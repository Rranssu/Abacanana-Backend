const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');

/**
 * GET /api/dashboard
 * Fetches latest sensor data, status message, and historical data for the chart.
 * Accepts query param: ?filter=minutes | hours | days | weeks
 */
router.get('/dashboard', async (req, res) => {
  try {
    const { filter } = req.query;

    // 1. Determine how many data points to fetch based on the filter
    let limitCount = 5; // Default for 'minutes'
    if (filter === 'hours') limitCount = 12; // Snapshot of last 12 data points
    if (filter === 'days') limitCount = 7;   // Last 7 readings
    if (filter === 'weeks') limitCount = 4;  // Last 4 readings

    // 2. Fetch historical data from 'readings'
    const historySnap = await db.collection('readings')
      .orderBy('timestamp', 'desc')
      .limit(limitCount)
      .get();

    // 3. Process data for the chart
    // Firestore returns descending (latest first), but charts need ascending (oldest first)
    const history = historySnap.docs.map(doc => {
      const data = doc.data();
      const date = data.timestamp.toDate();
      
      // Create a friendly label based on the filter
      let label = "";
      if (filter === 'days' || filter === 'weeks') {
        label = date.toLocaleDateString([], { weekday: 'short' }); // e.g. "Mon"
      } else {
        label = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); // e.g. "10:30"
      }

      return {
        temp: data.temp,
        humidity: data.humidity,
        label: label,
        fullTimestamp: date
      };
    }).reverse(); // Reverse to get chronological order (Left -> Right)

    // 4. Get the manual status message
    const statusDoc = await db.collection('config').doc('status').get();
    const statusText = statusDoc.exists ? statusDoc.data().message : "Lab environment stable.";

    // 5. Get the single latest reading for the top cards
    const latest = history.length > 0 ? history[history.length - 1] : { temp: 0, humidity: 0, fullTimestamp: new Date() };

    res.json({
      temp: latest.temp,
      humidity: latest.humidity,
      statusMessage: statusText,
      lastUpdated: latest.fullTimestamp,
      history: history // Array used by the react-native-chart-kit
    });

  } catch (error) {
    console.error("Dashboard Filtered Fetch Error:", error);
    res.status(500).json({ error: "Failed to load filtered dashboard data." });
  }
});

module.exports = router;