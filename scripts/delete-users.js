const admin = require('firebase-admin');

// You must add these to your .env or replace them here temporarily
const serviceAccount = {
  projectId: "split-ea9d4",
  clientEmail: "YOUR_CLIENT_EMAIL",
  privateKey: "YOUR_PRIVATE_KEY".replace(/\\n/g, '\n'),
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

async function deleteAllUsers(nextPageToken) {
  const result = await admin.auth().listUsers(100, nextPageToken);
  const uids = result.users.map((user) => user.uid);
  
  if (uids.length > 0) {
    await admin.auth().deleteUsers(uids);
    console.log(`Successfully deleted ${uids.length} users.`);
  }
  
  if (result.pageToken) {
    await deleteAllUsers(result.pageToken);
  }
}

deleteAllUsers().then(() => {
  console.log('Finished deleting all users.');
  process.exit(0);
}).catch((err) => {
  console.error('Error deleting users:', err);
  process.exit(1);
});
