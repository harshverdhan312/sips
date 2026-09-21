const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const config = require('./config');
const logger = require('./utils/logger');

const app = express();

// Middleware
const allowedOrigins = [
  'http://localhost:5137',
  'http://localhost:5173',
  'https://sips-six.vercel.app',
  config.frontendUrl
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (mobile apps, curl, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes - Mount both standard /api/* and root routes for compatibility
const authRoutes = require('./routes/auth');
const collegeRoutes = require('./routes/college');
const studentRoutes = require('./routes/student');
const jdRoutes = require('./routes/jd');
const notificationRoutes = require('./routes/notification');
const adminRoutes = require('./routes/admin');

// Admin routes
app.use('/api/admin', adminRoutes);
app.use('/admin', adminRoutes);

// Core routes with both /api/ prefix and root paths
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

app.use('/api/college', collegeRoutes);
app.use('/college', collegeRoutes);

app.use('/api/student', studentRoutes);
app.use('/student', studentRoutes);

app.use('/api/jd', jdRoutes);
app.use('/jd', jdRoutes);

app.use('/api/notification', notificationRoutes);
app.use('/notification', notificationRoutes);

const frontendDistPath = path.join(__dirname, '../frontend/dist');

// Root route - Points to landing page of website
app.get('/', (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const indexPath = path.join(__dirname, '../frontend/dist/index.html');

  // If client explicitly requests JSON without HTML, return API metadata pointing to landing page
  if (!req.accepts('html') && req.accepts('json')) {
    return res.json({
      name: 'SIPS - Skill Intelligence Placement System API',
      status: 'online',
      website: frontendUrl,
      landingPage: frontendUrl,
      health: '/health'
    });
  }

  // Otherwise, serve landing page directly or redirect to it
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }

  return res.redirect(frontendUrl);
});

// Serve static frontend assets if built (excluding automatic index.html takeover on /)
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath, { index: false }));
}

// Health check
app.get(['/health', '/api/health'], (req, res) => {
  const isMongo = mongoose.connection.readyState === 1;
  res.json({
    status: 'ok',
    database: isMongo ? 'mongodb' : 'in-memory-resilient',
    mongoHost: isMongo ? mongoose.connection.host : null,
    mongoDbName: isMongo ? mongoose.connection.name : null,
    timestamp: new Date().toISOString()
  });
});

// Fallback for non-API client routes to serve landing page / SPA or redirect to frontend
app.get('*', (req, res, next) => {
  if (
    req.path.startsWith('/api') ||
    req.path.startsWith('/auth') ||
    req.path.startsWith('/admin') ||
    req.path.startsWith('/college') ||
    req.path.startsWith('/student') ||
    req.path.startsWith('/jd') ||
    req.path.startsWith('/notification') ||
    req.path.startsWith('/uploads') ||
    req.path.startsWith('/health')
  ) {
    return next();
  }

  const indexPath = path.join(__dirname, '../frontend/dist/index.html');
  if (fs.existsSync(indexPath) && req.accepts('html')) {
    return res.sendFile(indexPath);
  }

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  if (req.accepts('html')) {
    return res.redirect(`${frontendUrl}${req.path}`);
  }

  next();
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} not found` });
});

// Error handling middleware
app.use(require('./middleware/errorHandler'));

// Database Connection & Server Startup
if (!config.isTest) {
  mongoose.set('bufferCommands', false);

  mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 5000 })
    .then((conn) => {
      logger.info(`✅ Connected to MongoDB: ${conn.connection.host}/${conn.connection.name}`);
    })
    .catch(err => {
      logger.warn(`⚠️  MongoDB connection failed (${err.message}). Running in resilient in-memory mode.`);
    });

  app.listen(config.port, () => {
    logger.info(`🚀 Server running on port ${config.port}`);
  });
}

module.exports = app;
