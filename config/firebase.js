const admin = require('firebase-admin');

// Replace the path below with your actual Firebase Service Account Key file
// This path is relative to the 'config' folder, so '../' goes up one level.
const serviceAccount = require("../firebase-admin-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Export the initialized Firestore instance and the admin object
module.exports = { admin, db };