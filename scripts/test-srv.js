const mongoose = require('mongoose');
const fs = require('fs');

const envContent = fs.readFileSync('.env', 'utf8');
const match = envContent.match(/MONGODB_URI=(.*)/);
if (!match) {
  console.log('No MONGODB_URI in .env');
  process.exit(1);
}
const raw = match[1].trim();

// Extract auth part
const withoutPrefix = raw.replace(/^mongodb(\+srv)?:\/\//, '');
const atIdx = withoutPrefix.lastIndexOf('@');
const auth = withoutPrefix.slice(0, atIdx);
const colonIdx = auth.indexOf(':');
const user = auth.slice(0, colonIdx);
const pass = auth.slice(colonIdx + 1);

console.log('User:', user, 'Pass length:', pass.length);

// Construct mongodb+srv URI with url-encoded user and pass and db 'kakria_dairy'
const srvUri = `mongodb+srv://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@cluster0.eezo7fs.mongodb.net/kakria_dairy?retryWrites=true&w=majority`;

console.log('Testing SRV connection (URI sanitized):', srvUri.replace(/:([^@]+)@/, ':****@'));

mongoose.connect(srvUri, { serverSelectionTimeoutMS: 8000 })
  .then(() => {
    console.log('MongoDB SRV connection SUCCESSFUL! Database:', mongoose.connection.name);
    process.exit(0);
  })
  .catch((err) => {
    console.log('MongoDB SRV connection failed:', err.message);
    process.exit(1);
  });
