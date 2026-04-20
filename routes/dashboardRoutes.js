const express = require('express');
const router = express.Router(); // Create an Express Router
const { db } = require('../config/firebase'); // Import the db instance

/**
 * GET /api/dashboard
 * Fetches latest sensor data and current lab status message.
 */
router.get('/dashboard', async (req, res) => {
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

module.exports = router;