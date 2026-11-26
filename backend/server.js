const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dns = require('dns');
const config = require('./config');
const logger = require('./utils/logger');

// Set reliable public DNS servers for resolving MongoDB Atlas shard/SRV records on local networks
if (config.mongoUri && config.mongoUri.includes('mongodb.net')) {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
  } catch (err) {
    logger.debug('DNS setServers error:', err.message);
  }
}

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

const jwt = require('jsonwebtoken');
const memoryDb = require('./utils/memoryDb');
let StudentModel = null;
try {
  StudentModel = require('./models/Student');
} catch (e) {
  // Ignored in minimal test mocks
}

// Serve uploaded files with strict privacy protection for sensitive documents (.pdf resumes)
const uploadsStaticDir = path.resolve(config.uploadDir || path.join(__dirname, 'uploads'));

app.use('/uploads', async (req, res, next) => {
  const reqPath = req.path || '';
  const ext = path.extname(reqPath).toLowerCase();

  // Public image assets (avatars, college logos) are served directly
  const publicImageExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.ico'];
  if (publicImageExtensions.includes(ext)) {
    return next();
  }

  // Sensitive documents (PDF resumes): direct unauthenticated static access is blocked
  if (ext === '.pdf') {
    const authHeader = req.headers.authorization;
    let token = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.query && req.query.token) {
      token = req.query.token;
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, config.jwtSecret);
        const filename = path.basename(reqPath);
        const role = (decoded.role || '').toUpperCase();

        let authorized = false;
        if (role === 'SUPERADMIN' || role === 'SUPER_ADMIN' || role === 'ADMIN' || decoded.isSuperAdmin) {
          authorized = true;
        } else if (!memoryDb.isMongoConnected()) {
          if (role === 'STUDENT') {
            const student = memoryDb.findStudentById(decoded.id);
            if (student && student.resumeUrl) {
              if (path.basename(student.resumeUrl.split('?')[0]) === filename) {
                authorized = true;
              }
              if (student.resumeUrl.startsWith('http://') || student.resumeUrl.startsWith('https://')) {
                return res.redirect(student.resumeUrl);
              }
            }
          } else if (role === 'COLLEGE_ADMIN' || role === 'INSTITUTION_ADMIN' || role === 'DEPARTMENT_ADMIN') {
            const students = memoryDb.getStudentsByCollege(decoded.collegeId);
            if (students.some(s => s.resumeUrl && path.basename(s.resumeUrl.split('?')[0]) === filename)) {
              authorized = true;
            }
          }
        } else if (StudentModel) {
          if (role === 'STUDENT') {
            const student = await StudentModel.findById(decoded.id);
            if (student && student.resumeUrl) {
              if (path.basename(student.resumeUrl.split('?')[0]) === filename) {
                authorized = true;
              }
              // If student's resume is hosted on Cloudinary / remote URL, redirect directly
              if (student.resumeUrl.startsWith('http://') || student.resumeUrl.startsWith('https://')) {
                return res.redirect(student.resumeUrl);
              }
            }
          } else if (role === 'COLLEGE_ADMIN' || role === 'INSTITUTION_ADMIN' || role === 'DEPARTMENT_ADMIN') {
            const student = await StudentModel.findOne({ collegeId: decoded.collegeId, resumeUrl: { $regex: filename } });
            if (student) {
              authorized = true;
              if (student.resumeUrl.startsWith('http://') || student.resumeUrl.startsWith('https://')) {
                return res.redirect(student.resumeUrl);
              }
            }
          }
        }

        if (authorized) {
          const resolvedPath = path.resolve(uploadsStaticDir, filename);
          if (resolvedPath.startsWith(uploadsStaticDir) && fs.existsSync(resolvedPath)) {
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'inline');
            return res.sendFile(resolvedPath);
          }
        }
      } catch (err) {
        // Token error
      }
    }

    // Direct unauthenticated or unauthorized access to PDF resumes is strictly blocked with 404
    if (req.accepts && req.accepts('html')) {
      return res.status(404).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Resume Unavailable - SIPS</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background-color: #f8fafc; color: #1e293b; }
    .card { background: white; border-radius: 1rem; border: 1px solid #e2e8f0; padding: 2.5rem; max-width: 440px; text-align: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    h2 { margin-top: 0; font-size: 1.25rem; color: #0f172a; }
    p { font-size: 0.875rem; color: #64748b; line-height: 1.5; margin-bottom: 1.5rem; }
    a { display: inline-block; background-color: #4f46e5; color: white; padding: 0.625rem 1.25rem; border-radius: 0.5rem; font-weight: 600; text-decoration: none; font-size: 0.875rem; }
    a:hover { background-color: #4338ca; }
  </style>
</head>
<body>
  <div class="card">
    <h2>Resume File Unavailable</h2>
    <p>The requested resume file is no longer stored on the server. If this is your resume, please sign in to SIPS and re-upload your PDF resume.</p>
    <a href="/student/profile">Back to Profile</a>
  </div>
</body>
</html>`);
    }

    return res.status(404).json({ success: false, message: 'File not found or not accessible.' });
  }

  return next();
}, express.static(uploadsStaticDir));

// Routes - Mount both standard /api/* and root routes for compatibility
const authRoutes = require('./routes/auth');
const collegeRoutes = require('./routes/college');
const studentRoutes = require('./routes/student');
const jdRoutes = require('./routes/jd');
const notificationRoutes = require('./routes/notification');
const adminRoutes = require('./routes/admin');
const publicRoutes = require('./routes/public');
const internalRoutes = require('./routes/internal');
const institutionRoutes = require('./routes/institution');
const superAdminRoutes = require('./routes/superAdmin');

// Server-to-server internal routes
app.use('/api/internal', internalRoutes);

// Super Admin routes
app.use('/api/super-admin', superAdminRoutes);
app.use('/super-admin', superAdminRoutes);

// Admin routes
app.use('/api/admin', adminRoutes);
app.use('/admin', adminRoutes);

// Institution routes
app.use('/api/institution', institutionRoutes);
app.use('/institution', institutionRoutes);

// Public routes (unauthenticated shareable profile routes)
app.use('/api/public', publicRoutes);
app.use('/public', publicRoutes);

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

// Cloudinary connection diagnostics
app.get(['/health/cloudinary', '/api/health/cloudinary', '/api/cloudinary-status'], async (req, res) => {
  const cloudinaryService = require('./services/cloudinaryService');
  const status = await cloudinaryService.getCloudinaryStatus();
  res.json({
    status: status.isConfigured ? (status.pingStatus === 'ok' ? 'ok' : 'degraded') : 'unconfigured',
    ...status,
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

  mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 15000, connectTimeoutMS: 15000 })
    .then((conn) => {
      logger.info(`✅ Connected to MongoDB: ${conn.connection.host}/${conn.connection.name}`);
    })
    .catch(err => {
      logger.warn(`⚠️  MongoDB connection failed (${err.message}). Running in resilient in-memory mode.`);
    });

  const cloudinaryService = require('./services/cloudinaryService');
  if (cloudinaryService.isCloudinaryConfigured()) {
    logger.info('☁️  Cloudinary storage is CONFIGURED and ACTIVE for persistent image & resume uploads.');
  } else {
    logger.warn('⚠️  Cloudinary is NOT configured. Uploaded images/resumes will be stored on local ephemeral disk (/uploads). For persistent storage across Render redeployments, set CLOUDINARY_URL (or CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) in Render environment variables.');
  }

  app.listen(config.port, () => {
    logger.info(`🚀 Server running on port ${config.port}`);
  });
}

module.exports = app;
