const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase'); // Import the db instance

/**
 * GET /api/notifications
 * Returns the history of alerts triggered by lab sensors.
 */
router.get('/notifications', async (req, res) => {
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

module.exports = router;