const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const collegeController = require('../controllers/collegeController');

// POST /api/auth/login — domain-based login (public)
router.post('/login', authController.login);

// POST /api/auth/register-college — register new college (public)
router.post('/register-college', collegeController.registerCollege);

module.exports = router;
