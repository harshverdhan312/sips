const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
const allowedOrigins = [
  'http://localhost:5137',
  'http://localhost:5173',
  'https://sips-six.vercel.app',
  process.env.FRONTEND_URL
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

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} not found` });
});

// Error handling middleware
app.use(require('./middleware/errorHandler'));

// Database Connection & Server Startup
if (process.env.NODE_ENV !== 'test') {
  mongoose.set('bufferCommands', false);
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sips';

  mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 })
    .then((conn) => {
      console.log(`✅ Connected to MongoDB: ${conn.connection.host}/${conn.connection.name}`);
    })
    .catch(err => {
      console.warn(`⚠️  MongoDB connection failed (${err.message}). Running in resilient in-memory mode.`);
    });

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

module.exports = app;
