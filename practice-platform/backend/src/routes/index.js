const express = require('express');
const router = express.Router();

const healthRoutes = require('./healthRoutes');
const questionRoutes = require('./questionRoutes');
const codingRoutes = require('./codingRoutes');
const practiceRoutes = require('./practiceRoutes');
const contestRoutes = require('./contestRoutes');

// API Routes
router.use('/health', healthRoutes);
router.use('/', questionRoutes);
router.use('/', codingRoutes);
router.use('/', practiceRoutes);
router.use('/', contestRoutes);

module.exports = router;
