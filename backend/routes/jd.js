const express = require('express');
const router = express.Router();
const jdController = require('../controllers/jdController');
const auth = require('../middleware/auth');
const tenant = require('../middleware/tenant');
const adminOnly = require('../middleware/adminOnly');
const { validateObjectId } = require('../middleware/validate');

// POST /api/jd — admin creates a JD
router.post('/', auth, tenant, adminOnly, jdController.createJD);

// GET /api/jd — list all JDs (auth required)
router.get('/', auth, tenant, jdController.getJDs);

// GET /api/jd/:id — get single JD
router.get('/:id', auth, tenant, validateObjectId('id'), jdController.getJD);

// GET /api/jd/:id/matches — admin gets ranked matches for a JD
router.get('/:id/matches', auth, tenant, adminOnly, validateObjectId('id'), jdController.getJDMatches);

// POST /api/jd/recompute — admin triggers full recomputation
router.post('/recompute', auth, tenant, adminOnly, jdController.recomputeMatches);

module.exports = router;
