const express = require('express');
const cors = require('cors');

// Import Firebase initialization (this runs the config/firebase.js logic)
const { db, admin } = require('./config/firebase'); // We'll need 'admin' for FieldValue.serverTimestamp

// Import Route Modules
const dashboardRoutes = require('./routes/dashboardRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

const app = express();

// --- Express Middleware ---
app.use(cors());
app.use(express.json());

// --- API Route Mounting ---
// All routes defined in dashboardRoutes will be prefixed with '/api'
app.use('/api', dashboardRoutes);
app.use('/api', notificationRoutes);
app.use('/api', settingsRoutes);

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