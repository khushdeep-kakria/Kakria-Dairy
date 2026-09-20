const mongoose = require('mongoose');
const fs = require('fs');

const envContent = fs.readFileSync('.env', 'utf8');
const match = envContent.match(/MONGODB_URI=(.*)/);
if (!match) {
  console.log('No MONGODB_URI found in .env');
  process.exit(0);
}
let rawUri = match[1].trim().replace(/^["']|["']$/g, '');

function normalizeMongoUri(raw) {
  try {
    const prefix = raw.startsWith('mongodb+srv://') ? 'mongodb+srv://' : raw.startsWith('mongodb://') ? 'mongodb://' : '';
    if (!prefix) return raw;
    const rest = raw.slice(prefix.length);
    const atIdx = rest.lastIndexOf('@');
    if (atIdx === -1) return raw;
    const auth = rest.slice(0, atIdx);
    const hostAndQuery = rest.slice(atIdx + 1);
    const colonIdx = auth.indexOf(':');
    if (colonIdx === -1) return raw;
    const rawUser = auth.slice(0, colonIdx);
    const rawPass = auth.slice(colonIdx + 1);
    const user = encodeURIComponent(decodeURIComponent(rawUser));
    const pass = encodeURIComponent(decodeURIComponent(rawPass));
    return prefix + user + ':' + pass + '@' + hostAndQuery;
  } catch(e) { return raw; }
}

const uri = normalizeMongoUri(rawUri);

console.log('Connecting with normalized URI...');
mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 })
  .then(() => {
    console.log('MongoDB connection SUCCESSFUL!');
    process.exit(0);
  })
  .catch((err) => {
    console.log('MongoDB connection failed:', err.message);
    process.exit(0);
  });
