import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
  // eslint-disable-next-line no-var
  var __mongoLastFailureTime: number | undefined;
  // eslint-disable-next-line no-var
  var __mongoLastFailureError: Error | null | undefined;
}

let cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

function normalizeMongoUri(rawUri: string): string {
  try {
    const uri = rawUri.trim().replace(/^["']|["']$/g, '');
    const prefix = uri.startsWith('mongodb+srv://')
      ? 'mongodb+srv://'
      : uri.startsWith('mongodb://')
      ? 'mongodb://'
      : '';
    if (!prefix) return uri;

    const rest = uri.slice(prefix.length);
    const atIdx = rest.lastIndexOf('@');
    if (atIdx === -1) return uri;

    const auth = rest.slice(0, atIdx);
    const hostAndQuery = rest.slice(atIdx + 1);
    const colonIdx = auth.indexOf(':');
    if (colonIdx === -1) return uri;

    const rawUser = auth.slice(0, colonIdx);
    const rawPass = auth.slice(colonIdx + 1);

    const user = encodeURIComponent(decodeURIComponent(rawUser));
    const pass = encodeURIComponent(decodeURIComponent(rawPass));

    return `${prefix}${user}:${pass}@${hostAndQuery}`;
  } catch {
    return rawUri;
  }
}

const FAILURE_COOLDOWN_MS = 30000;

export async function connectToDatabase(): Promise<typeof mongoose> {
  const rawUri = process.env.MONGODB_URI;
  if (!rawUri) {
    throw new Error('MONGODB_URI is not defined in environment variables.');
  }
  const uri = normalizeMongoUri(rawUri);

  if (cached.conn) {
    return cached.conn;
  }

  if (
    global.__mongoLastFailureTime &&
    Date.now() - global.__mongoLastFailureTime < FAILURE_COOLDOWN_MS &&
    global.__mongoLastFailureError
  ) {
    throw global.__mongoLastFailureError;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 2000,
      connectTimeoutMS: 2000,
      socketTimeoutMS: 15000,
      dbName: 'kakria_dairy',
    };

    cached.promise = mongoose.connect(uri, opts).then((mongooseInstance) => {
      console.log('MongoDB connected successfully');
      global.__mongoLastFailureTime = 0;
      global.__mongoLastFailureError = null;
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
    global.__mongoLastFailureTime = 0;
    global.__mongoLastFailureError = null;
  } catch (e: any) {
    cached.promise = null;
    global.__mongoLastFailureTime = Date.now();
    global.__mongoLastFailureError = e;
    const sanitizedMsg = (e.message || String(e)).replace(/:([^@]+)@/, ':****@');
    console.error('MongoDB connection error:', sanitizedMsg);
    throw e;
  }

  return cached.conn;
}

export const connectDB = connectToDatabase;
export default connectToDatabase;

