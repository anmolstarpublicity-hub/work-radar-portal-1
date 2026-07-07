const express = require('express');
const dotenv = require('dotenv');
dotenv.config(); // This line is crucial and must be at the top
const cors = require('cors');
const connectDB = require('./db/connectDB.js');
const webRoutes = require('./routes/web.js');
const path = require('path');
const app = express();

const allowedOrigins = process.env.FRONTEND_URLS ? process.env.FRONTEND_URLS.split(',') : [];
// During local development, allow common Vite dev server origins so the browser
// can call the API directly (client runs on :5173 or :5174 by default).
if (process.env.NODE_ENV === 'development') {
  allowedOrigins.push('http://localhost:5173', 'http://localhost:5174');
}

// --- Middleware ---
app.use(cors({
  origin: function (origin, callback) {
    // This is the line that was showing the CORS error (app.js:17)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
}));
app.use(express.json());

// --- API Routes ---
// This is the ONLY job of this server. It handles all requests that start with /api.
// The client is configured to make requests to '/workradar/api', so we mount the routes here.
app.use('/workradar/api', webRoutes);

// --- All static file logic has been REMOVED ---
// Nginx is now 100% responsible for serving your React app.
// This fixes the "PathError" crash.

const PORT = process.env.PORT || 2000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch((err) => {
  console.error('Failed to connect to database. Server failed to start:', err);
  process.exit(1);
});