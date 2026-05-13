const express = require('express');
const router = express.Router();
const { admin, db } = require('../config/firebase');

/**
 * GET /api/settings
 * Retrieves user preferences and alert thresholds.
 */
router.get('/settings', async (req, res) => {
  try {
    const doc = await db.collection('config').doc('menu').get();
    
    if (!doc.exists) {
      // Return industry-standard defaults for Abacá/Banana growth if no config exists
      return res.json({ 
        pushEnabled: true, 
        unit: 'C',
        tempMin: 20,
        tempMax: 35,
        humMin: 60,
        humMax: 90
      });
    }
    
    res.json(doc.data());
  } catch (error) {
    console.error("Settings Fetch Error:", error);
    res.status(500).json({ error: "Failed to load settings." });
  }
});

/**
 * POST /api/settings
 * Saves preferences and thresholds from the MenuScreen to Firestore.
 */
router.post('/settings', async (req, res) => {
  try {
    const { 
      pushEnabled, 
      unit, 
      tempMin, 
      tempMax, 
      humMin, 
      humMax 
    } = req.body;

    // Use merge: true to update only the fields provided without deleting others
    await db.collection('config').doc('menu').set({
      pushEnabled: pushEnabled,
      unit: unit,
      // Ensure values are stored as Numbers for the dev-feeder logic
      tempMin: Number(tempMin),
      tempMax: Number(tempMax),
      humMin: Number(humMin),
      humMax: Number(humMax),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    res.json({ success: true, message: "Lab thresholds synchronized." });
  } catch (error) {
    console.error("Settings Update Error:", error);
    res.status(500).json({ error: "Cloud synchronization failed." });
  }
});

/**
 * POST /api/settings/push-token
 * Separate endpoint for the app to register the phone's unique Push Token
 */
router.post('/settings/push-token', async (req, res) => {
  try {
    const { token } = req.body;
    await db.collection('config').doc('menu').set({
      expoPushToken: token,
      tokenUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    res.json({ success: true, message: "Push token registered." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;