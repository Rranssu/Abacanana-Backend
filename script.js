const express = require('express');
const cors = require('cors');
const helmet = require('helmet'); // Security: sets various HTTP headers
const compression = require('compression'); // Performance: compresses response bodies
const rateLimit = require('express-rate-limit'); // Security: prevents brute force/DDoS

// Import Firebase initialization
const { db, admin } = require('./config/firebase');

// Import Route Modules
const dashboardRoutes = require('./routes/dashboardRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

const app = express();

// --- 1. Production Middleware ---

// Enable 'trust proxy' (Required for Render/Heroku to get correct IP for rate limiting)
app.set('trust proxy', 1);

app.use(helmet()); // Basic security headers
app.use(compression()); // Compress all responses
app.use(cors()); // Allow requests from your Expo app
app.use(express.json()); // Parse JSON bodies

// Rate Limiting: Max 100 requests every 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests from this IP, please try again later."
});
app.use('/api', limiter); 

// --- 2. Health Check (Crucial for Render) ---
// Render uses this to ensure your server didn't crash during deployment
app.get('/', (req, res) => {
  res.status(200).send('🌿 Abacanana API is Healthy and Online');
});

// --- 3. API Route Mounting ---
app.use('/api', dashboardRoutes);
app.use('/api', notificationRoutes);
app.use('/api', settingsRoutes);

// --- 4. Global Error Handler ---
// Catches any unexpected errors so the server doesn't just hang
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong on the server!' });
});

// --- 5. START SERVER ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`
  -------------------------------------------
  🌿 ABACANANA API - PRODUCTION MODE
  -------------------------------------------
  ✅ Status: Online
  📡 Port:   ${PORT}
  🌍 Health Check: /
  📍 Endpoints: /api/dashboard, /api/notifications, /api/settings
  -------------------------------------------
  `);
});