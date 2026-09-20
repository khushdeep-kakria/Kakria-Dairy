const { MongoClient } = require('mongodb');
const fs = require('fs');

const envContent = fs.readFileSync('.env', 'utf8');
const match = envContent.match(/MONGODB_URI=(.*)/);
const raw = match[1].trim();

const withoutPrefix = raw.replace(/^mongodb(\+srv)?:\/\//, '');
const atIdx = withoutPrefix.lastIndexOf('@');
const auth = withoutPrefix.slice(0, atIdx);
const colonIdx = auth.indexOf(':');
const user = auth.slice(0, colonIdx);
const pass = auth.slice(colonIdx + 1);

const srvUri = `mongodb+srv://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@cluster0.eezo7fs.mongodb.net/kakria_dairy?retryWrites=true&w=majority`;

const client = new MongoClient(srvUri, {
  serverSelectionTimeoutMS: 5000,
});

client.on('serverDescriptionChanged', (event) => {
  console.log('Server description:', event.address, 'type:', event.newDescription.type, 'error:', event.newDescription.error?.message || 'none');
});

client.on('serverHeartbeatFailed', (event) => {
  console.log('Heartbeat failed for:', event.connectionId, 'failure:', event.failure?.message);
});

client.connect()
  .then(() => {
    console.log('Connected successfully!');
    client.close();
  })
  .catch((err) => {
    console.log('Connect failed:', err.name, err.message);
    if (err.reason) {
      console.log('Reason servers:');
      for (const [s, desc] of err.reason.servers) {
        console.log('  -', s, 'error:', desc.error?.message);
      }
    }
    process.exit(0);
  });
