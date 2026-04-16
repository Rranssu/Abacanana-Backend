/**
 * ABACANANA LABORATORY BACKEND
 * Stack: Express.js + Firebase Admin SDK
 * 
 * Instructions:
 * 1. Run 'npm install express firebase-admin cors'
 * 2. Place your 'firebase-admin-key.json' in the same folder.
 * 3. Run with 'node script.js'
 */

const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// --- 1. FIREBASE INITIALIZATION ---
// Replace the path below with your actual Firebase Service Account Key file
const serviceAccount = require("./firebase-admin-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// --- 2. DASHBOARD API ---
/**
 * GET /api/dashboard
 * Fetches latest sensor data and current lab status message.
 */
app.get('/api/dashboard', async (req, res) => {
  try {
    // Get the most recent reading from the 'readings' collection
    const sensorSnap = await db.collection('readings')
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get();

    // Get the manual status message from config/status
    const statusDoc = await db.collection('config').doc('status').get();

    const latest = sensorSnap.empty ? { temp: 0, humidity: 0 } : sensorSnap.docs[0].data();
    const statusText = statusDoc.exists ? statusDoc.data().message : "Lab environment stable.";

    res.json({
      temp: latest.temp,
      humidity: latest.humidity,
      statusMessage: statusText,
      lastUpdated: latest.timestamp ? latest.timestamp.toDate() : new Date()
    });
  } catch (error) {
    console.error("Dashboard Fetch Error:", error);
    res.status(500).json({ error: "Failed to load dashboard data." });
  }
});

// --- 3. NOTIFICATIONS API ---
/**
 * GET /api/notifications
 * Returns the history of alerts triggered by lab sensors.
 */
app.get('/api/notifications', async (req, res) => {
  try {
    const snapshot = await db.collection('notifications')
      .orderBy('timestamp', 'desc')
      .limit(20)
      .get();

    const alerts = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title || "Sensor Alert",
        detail: data.message || data.detail || "Threshold limit exceeded.",
        // Format Firestore timestamp for the Mobile UI
        time: data.timestamp ? data.timestamp.toDate().toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        }) : "Recently"
      };
    });

    res.json(alerts);
  } catch (error) {
    console.error("Notifications Fetch Error:", error);
    res.status(500).json({ error: "Failed to load lab alerts." });
  }
});

// --- 4. SETTINGS (MENU) API ---
/**
 * GET /api/settings
 * Retrieves user preferences (Units, Notifications enabled).
 */
app.get('/api/settings', async (req, res) => {
  try {
    const doc = await db.collection('config').doc('menu').get();
    if (!doc.exists) {
      // Return defaults if document hasn't been created yet
      return res.json({ pushEnabled: true, unit: 'C' });
    }
    res.json(doc.data());
  } catch (error) {
    res.status(500).json({ error: "Failed to load settings." });
  }
});

/**
 * POST /api/settings
 * Saves preferences from the MenuScreen to Firestore.
 */
app.post('/api/settings', async (req, res) => {
  try {
    const { pushEnabled, unit } = req.body;

    await db.collection('config').doc('menu').set({
      pushEnabled: pushEnabled,
      unit: unit,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    res.json({ success: true, message: "Lab settings synchronized." });
  } catch (error) {
    console.error("Settings Update Error:", error);
    res.status(500).json({ error: "Cloud synchronization failed." });
  }
});

// --- 5. START SERVER ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(``);
  console.log(`🌿 ABACANANA API IS ONLINE`);
  console.log(`-------------------------------------------`);
  console.log(`📡 Local Endpoint: http://localhost:${PORT}`);
  console.log(`📍 Dashboard:    /api/dashboard`);
  console.log(`📍 Alerts:       /api/notifications`);
  console.log(`📍 Menu/Config:  /api/settings`);
  console.log(`-------------------------------------------`);
  console.log(`Make sure to use your LOCAL IP for Mobile Testing!`);
});