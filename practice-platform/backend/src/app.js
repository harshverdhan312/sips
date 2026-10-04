const express = require('express');
const cors = require('cors');
const config = require('./config');
const routes = require('./routes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Global Middleware
const allowedOrigins = config.corsOrigin;

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins === true) return callback(null, true);
    if (Array.isArray(allowedOrigins)) {
      if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        return callback(null, true);
      }
      if (origin.endsWith('.vercel.app') || origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }
    }
    return callback(null, false);
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Direct /health route as required by spec
app.use('/health', require('./routes/healthRoutes'));

// Base API Routes
app.use('/api', routes);

// 404 Handler
app.use(notFound);

// Centralized Error Handler
app.use(errorHandler);

module.exports = app;
