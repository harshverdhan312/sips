const mongoose = require('mongoose');
const JobDescription = require('../models/JobDescription');
const Student = require('../models/Student');
const { checkJobEligibility } = require('../utils/eligibilityChecker');
const logger = require('../utils/logger');

/**
 * Internal Placement Drive Eligibility Controller
 * Server-to-server endpoint for verifying student eligibility for placement drives.
 * Authoritative single source of truth for drive eligibility, CGPA, branch, deadline, and account status rules.
 */

exports.checkDriveEligibility = async (req, res) => {
  try {
    const { driveId } = req.params;
    const { studentId, collegeId } = req.body;

    // 1. Validate parameter presence
    if (!driveId || typeof driveId !== 'string' || !driveId.trim()) {
      return res.status(400).json({
        success: false,
        message: 'driveId parameter is required'
      });
    }

    if (!studentId || typeof studentId !== 'string' || !studentId.trim()) {
      return res.status(400).json({
        success: false,
        message: 'studentId is required in request body'
      });
    }

    if (!collegeId || typeof collegeId !== 'string' || !collegeId.trim()) {
      return res.status(400).json({
        success: false,
        message: 'collegeId is required in request body'
      });
    }

    // 2. Validate MongoDB ObjectId format if applicable
    const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id) && (String(new mongoose.Types.ObjectId(id)) === id || /^[0-9a-fA-F]{24}$/.test(id));

    if (!isValidObjectId(driveId)) {
      return res.status(404).json({
        success: false,
        message: 'Placement drive not found with provided ID'
      });
    }

    if (!isValidObjectId(studentId)) {
      return res.status(404).json({
        success: false,
        message: 'Student not found with provided ID'
      });
    }

    // 3. Query Drive and Student
    const [drive, student] = await Promise.all([
      JobDescription.findById(driveId),
      Student.findById(studentId)
    ]);

    if (!drive) {
      return res.status(404).json({
        success: false,
        message: 'Placement drive not found'
      });
    }

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // 4. Tenancy and College Isolation Verification
    const driveCollegeId = String(drive.collegeId);
    const studentCollegeId = String(student.collegeId);
    const requestedCollegeId = String(collegeId).trim();

    if (driveCollegeId !== requestedCollegeId || studentCollegeId !== requestedCollegeId || driveCollegeId !== studentCollegeId) {
      return res.status(403).json({
        success: false,
        message: 'Tenant college mismatch between student, placement drive, and request'
      });
    }

    // 5. Account Lifecycle & Placement Status Checks
    const accountStatus = (student.accountStatus || 'ACTIVE').toUpperCase();
    if (accountStatus === 'DEBARRED') {
      return res.status(200).json({
        eligible: false,
        reasons: ['You have been debarred from participating in placement drives. Please contact your Placement Cell.']
      });
    }

    if (accountStatus === 'PASSOUT' || accountStatus === 'DEACTIVATED') {
      return res.status(200).json({
        eligible: false,
        reasons: [`Student account is inactive (${accountStatus}) and not permitted to participate in placement drives.`]
      });
    }

    const placementStatus = (student.placementStatus || 'UNPLACED').toUpperCase();
    if (placementStatus === 'OPTED_OUT') {
      return res.status(200).json({
        eligible: false,
        reasons: ['You have opted out of campus placements.']
      });
    }

    // 6. Authoritative Job Eligibility Rules (CGPA, Branch/Stream, Deadline, Job Status)
    const reasons = checkJobEligibility(student, drive);

    return res.status(200).json({
      eligible: reasons.length === 0,
      reasons: reasons || []
    });
  } catch (error) {
    logger.error('Internal eligibility evaluation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while evaluating drive eligibility'
    });
  }
};

/**
 * Internal Placement Drive Metadata Retrieval
 * Server-to-server endpoint for validating placement drive existence, status, and tenancy.
 */
exports.getDriveMetadata = async (req, res) => {
  try {
    const { driveId } = req.params;
    const { collegeId } = req.query;

    if (!driveId || typeof driveId !== 'string' || !driveId.trim()) {
      return res.status(400).json({
        success: false,
        message: 'driveId parameter is required'
      });
    }

    const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id) && (String(new mongoose.Types.ObjectId(id)) === id || /^[0-9a-fA-F]{24}$/.test(id));

    if (!isValidObjectId(driveId)) {
      return res.status(404).json({
        success: false,
        message: 'Placement drive not found with provided ID'
      });
    }

    const drive = await JobDescription.findById(driveId);

    if (!drive) {
      return res.status(404).json({
        success: false,
        message: 'Placement drive not found'
      });
    }

    if (collegeId && String(drive.collegeId) !== String(collegeId).trim()) {
      return res.status(403).json({
        success: false,
        message: 'Tenant college mismatch for placement drive'
      });
    }

    return res.status(200).json({
      success: true,
      drive: {
        id: String(drive._id),
        title: drive.title,
        role: drive.role || drive.title,
        company: drive.company,
        collegeId: String(drive.collegeId),
        status: drive.status,
        deadline: drive.deadline || null,
        minCgpa: drive.minCgpa || 0,
        allowedBranches: drive.allowedBranches || []
      }
    });
  } catch (error) {
    logger.error('Internal drive metadata retrieval error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving drive metadata'
    });
  }
};

