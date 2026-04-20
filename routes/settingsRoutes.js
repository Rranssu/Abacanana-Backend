const express = require('express');
const router = express.Router();
const { admin, db } = require('../config/firebase'); // Import both admin and db

/**
 * GET /api/settings
 * Retrieves user preferences (Units, Notifications enabled).
 */
router.get('/settings', async (req, res) => {
  try {
    const doc = await db.collection('config').doc('menu').get();
    if (!doc.exists) {
      // Return defaults if document hasn't been created yet
      return res.json({ pushEnabled: true, unit: 'C' });
    }
    res.json(doc.data());
  } catch (error) {
    console.error("Settings Fetch Error:", error);
    res.status(500).json({ error: "Failed to load settings." });
  }
});

/**
 * POST /api/settings
 * Saves preferences from the MenuScreen to Firestore.
 */
router.post('/settings', async (req, res) => {
  try {
    const { pushEnabled, unit } = req.body;

    await db.collection('config').doc('menu').set({
      pushEnabled: pushEnabled,
      unit: unit,
      updatedAt: admin.firestore.FieldValue.serverTimestamp() // Use admin for FieldValue
    }, { merge: true });

    res.json({ success: true, message: "Lab settings synchronized." });
  } catch (error) {
    console.error("Settings Update Error:", error);
    res.status(500).json({ error: "Cloud synchronization failed." });
  }
});

module.exports = router;