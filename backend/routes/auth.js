const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const collegeController = require('../controllers/collegeController');

// POST /api/auth/login — domain-based login (public)
router.post('/login', authController.login);
router.post('/student-login', authController.studentLogin);
router.post('/institution-login', authController.institutionLogin);

// POST /api/auth/register — student registration (public)
router.post('/register', authController.register);
router.post('/register-student', authController.register);

// POST /api/auth/register-college — register new college (public)
router.post('/register-college', collegeController.registerCollege);

module.exports = router;
