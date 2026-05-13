// script.js - Updated Watchdog (No Push, Just Firestore Logging)
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { db, admin } = require('./config/firebase');

const app = express();
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json());

// --- 🕵️ LAB WATCHDOG: THE MONITORING SYSTEM ---
const startLabWatchdog = () => {
  console.log("🕵️ Watchdog active: Monitoring thresholds for Notification History...");

  // Listen for the LATEST sensor reading
  db.collection('readings')
    .orderBy('timestamp', 'desc')
    .limit(1)
    .onSnapshot(async (snapshot) => {
      if (snapshot.empty) return;

      const { temp, humidity } = snapshot.docs[0].data();

      try {
        // Fetch thresholds from config/menu
        const configDoc = await db.collection('config').doc('menu').get();
        if (!configDoc.exists) return;

        const { tempMin, tempMax, humMin, humMax } = configDoc.data();

        let alertDetail = "";

        // Temperature Check
        if (temp > tempMax) alertDetail = `High Temp: ${temp}°C (Limit: ${tempMax}°C)`;
        else if (temp < tempMin) alertDetail = `Low Temp: ${temp}°C (Limit: ${tempMin}°C)`;

        // Humidity Check
        if (humidity > humMax) alertDetail = `High Humidity: ${humidity}% (Limit: ${humMax}%)`;
        else if (humidity < humMin) alertDetail = `Low Humidity: ${humidity}% (Limit: ${humMin}%)`;

        // IF THRESHOLD IS BROKEN: Create a new document in 'notifications'
        if (alertDetail) {
          console.log(`⚠️ Threshold Breach! Logging: ${alertDetail}`);
          
          await db.collection('notifications').add({
            title: "Lab Alert",
            detail: alertDetail,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
          });
        }
      } catch (error) {
        console.error("Watchdog Error:", error);
      }
    });
};

// --- ROUTES ---
const dashboardRoutes = require('./routes/dashboardRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

app.get('/', (req, res) => res.send('🌿 Abacanana API Online'));
app.use('/api', dashboardRoutes);
app.use('/api', notificationRoutes);
app.use('/api', settingsRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  startLabWatchdog();
});