const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { Expo } = require('expo-server-sdk'); // Import Expo SDK

// Import Firebase initialization
const { db, admin } = require('./config/firebase');

const app = express();
const expo = new Expo(); // Initialize Expo

// --- Production Middleware ---
app.set('trust proxy', 1);
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: "Too many requests from this IP."
});
app.use('/api', limiter); 

// --- 1. LAB WATCHDOG LOGIC (The Monitoring System) ---

const startLabWatchdog = () => {
  console.log("🕵️  Lab Watchdog is now monitoring sensor readings...");

  // Listen for the LATEST document added to the 'readings' collection
  db.collection('readings')
    .orderBy('timestamp', 'desc')
    .limit(1)
    .onSnapshot(async (snapshot) => {
      if (snapshot.empty) return;

      const latestReading = snapshot.docs[0].data();
      const { temp, humidity } = latestReading;

      try {
        // Fetch current thresholds and push token from config/menu
        const configDoc = await db.collection('config').doc('menu').get();
        if (!configDoc.exists) return;

        const config = configDoc.data();
        const { 
          pushEnabled, expoPushToken, 
          tempMin, tempMax, humMin, humMax 
        } = config;

        // Only proceed if notifications are ON and we have a valid phone token
        if (!pushEnabled || !expoPushToken) return;

        let alertMessage = "";

        // Check Temperature Thresholds
        if (temp > tempMax) alertMessage = `⚠️ High Temp Alert: ${temp}°C exceeds max limit of ${tempMax}°C!`;
        else if (temp < tempMin) alertMessage = `❄️ Low Temp Alert: ${temp}°C is below min limit of ${tempMin}°C!`;

        // Check Humidity Thresholds (if no temp alert, check humidity)
        if (!alertMessage) {
            if (humidity > humMax) alertMessage = `💧 High Humidity: ${humidity}% exceeds limit of ${humMax}%!`;
            else if (humidity < humMin) alertMessage = `🌵 Low Humidity: ${humidity}% is below limit of ${humMin}%!`;
        }

        if (alertMessage) {
          await sendPushNotification(expoPushToken, alertMessage);
          await logNotification(alertMessage);
        }

      } catch (error) {
        console.error("Watchdog Logic Error:", error);
      }
    });
};

// Helper: Send to Expo Servers
const sendPushNotification = async (token, message) => {
  if (!Expo.isExpoPushToken(token)) return;

  const messages = [{
    to: token,
    sound: 'default',
    title: '🌿 Abacanana Lab Alert',
    body: message,
    data: { withData: 'arg' },
  }];

  try {
    await expo.sendPushNotificationsAsync(messages);
    console.log(`🚀 Notification sent: ${message}`);
  } catch (error) {
    console.error("Expo Push Error:", error);
  }
};

// Helper: Save alert to Notification History in App
const logNotification = async (message) => {
  await db.collection('notifications').add({
    title: "Threshold Breach",
    detail: message,
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  });
};

// --- 2. API Route Mounting ---
const dashboardRoutes = require('./routes/dashboardRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

app.get('/', (req, res) => res.send('🌿 Abacanana API Online'));
app.use('/api', dashboardRoutes);
app.use('/api', notificationRoutes);
app.use('/api', settingsRoutes);

// --- 3. START SERVER & WATCHDOG ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  
  // Start the background monitoring
  startLabWatchdog();
});