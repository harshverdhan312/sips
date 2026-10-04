const express = require('express');
const router = express.Router();
const internalAuth = require('../middleware/internalAuth');
const internalEligibilityController = require('../controllers/internalEligibilityController');

/**
 * Server-to-server internal API routes
 * Protected by X-Internal-Service-Secret header.
 */
router.post(
  '/placement-drives/:driveId/eligibility',
  internalAuth,
  internalEligibilityController.checkDriveEligibility
);

router.get(
  '/placement-drives/:driveId',
  internalAuth,
  internalEligibilityController.getDriveMetadata
);

module.exports = router;
