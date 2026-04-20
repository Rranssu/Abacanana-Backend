const admin = require('firebase-admin');

/**
 * FIREBASE INITIALIZATION (Render-Ready)
 * Logic: 
 * 1. Checks for a FIREBASE_SERVICE_ACCOUNT environment variable (Production/Render).
 * 2. If not found, falls back to the local .json file (Development/Local).
 */

let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  // --- PRODUCTION (RENDER) ---
  // We parse the string from the Environment Variable back into a JSON object
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } catch (error) {
    console.error("❌ Error parsing FIREBASE_SERVICE_ACCOUNT env var:", error.message);
  }
} else {
  // --- DEVELOPMENT (LOCAL PC) ---
  // Uses the local file you already have
  try {
    serviceAccount = require("../firebase-admin-key.json");
  } catch (error) {
    console.error("❌ Local firebase-admin-key.json not found. Did you forget to add it to your local folder?");
  }
}

// Initialize only if serviceAccount was successfully loaded
if (serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log("✅ Firebase Admin Initialized Successfully");
} else {
  console.error("🛑 Critical Error: No Firebase credentials found. Backend will not work.");
}

const db = admin.firestore();

// Export the initialized instances
module.exports = { admin, db };