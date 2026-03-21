const Student = require('../models/Student');
const Match = require('../models/Match');
const JobDescription = require('../models/JobDescription');
const bcrypt = require('bcryptjs');
const { calculateMatch } = require('../utils/matchingEngine');

/**
 * GET /api/student/profile
 * Student-only — get own profile
 */
exports.getProfile = async (req, res) => {
  try {
    const student = await Student.findOne({ 
      _id: req.user.id, 
      collegeId: req.collegeId 
    }).select('-passwordHash');

    if (!student) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    res.json(student);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * PUT /api/student/profile
 * Student-only — update editable fields (skills, github, password)
 */
exports.updateProfile = async (req, res) => {
  try {
    const { skills, github, newPassword } = req.body;
    const student = await Student.findOne({ 
      _id: req.user.id, 
      collegeId: req.collegeId 
    });

    if (!student) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    if (skills !== undefined) {
      student.skills = skills.map(s => s.trim()).filter(Boolean);
    }
    if (github !== undefined) {
      student.github = github.trim();
    }
    if (newPassword) {
      const salt = await bcrypt.genSalt(10);
      student.passwordHash = await bcrypt.hash(newPassword, salt);
    }

    await student.save();

    // Recompute matches for this student after skill update
    if (skills !== undefined) {
      const jds = await JobDescription.find({ collegeId: req.collegeId });
      for (const jd of jds) {
        const result = calculateMatch(student.skills, jd.requiredSkills);
        await Match.findOneAndUpdate(
          { studentId: student._id, jdId: jd._id },
          {
            studentId: student._id,
            jdId: jd._id,
            score: result.score,
            matchedSkills: result.matchedSkills,
            missingSkills: result.missingSkills,
            collegeId: req.collegeId
          },
          { upsert: true, new: true }
        );
      }
    }

    const updated = await Student.findById(student._id).select('-passwordHash');
    res.json({ message: 'Profile updated', student: updated });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * POST /api/student/resume
 * Student-only — upload resume (expects multipart form with 'resume' field)
 */
exports.uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const student = await Student.findOne({ 
      _id: req.user.id, 
      collegeId: req.collegeId 
    });

    if (!student) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    student.resumeUrl = `/uploads/${req.file.filename}`;
    await student.save();

    res.json({ message: 'Resume uploaded', resumeUrl: student.resumeUrl });
  } catch (error) {
    console.error('Upload resume error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET /api/student/jobs
 * Student-only — list all JDs with match scores for this student
 */
exports.getJobs = async (req, res) => {
  try {
    const jds = await JobDescription.find({ collegeId: req.collegeId })
      .sort({ createdAt: -1 });

    const student = await Student.findOne({ 
      _id: req.user.id, 
      collegeId: req.collegeId 
    });

    // Get matches for this student
    const matches = await Match.find({ 
      studentId: student._id, 
      collegeId: req.collegeId 
    });
    const matchMap = {};
    matches.forEach(m => { matchMap[m.jdId.toString()] = m; });

    const jobsWithScores = jds.map(jd => {
      const match = matchMap[jd._id.toString()];
      return {
        ...jd.toObject(),
        matchScore: match ? match.score : 0,
        matchedSkills: match ? match.matchedSkills : [],
        missingSkills: match ? match.missingSkills : []
      };
    });

    res.json(jobsWithScores);
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET /api/student/preferred-jobs
 * Student-only — top matching JDs sorted by score descending
 */
exports.getPreferredJobs = async (req, res) => {
  try {
    const student = await Student.findOne({ 
      _id: req.user.id, 
      collegeId: req.collegeId 
    });

    const matches = await Match.find({ 
      studentId: student._id, 
      collegeId: req.collegeId,
      score: { $gt: 0 }
    })
      .sort({ score: -1 })
      .populate('jdId');

    const preferredJobs = matches.map(m => ({
      ...m.jdId.toObject(),
      matchScore: m.score,
      matchedSkills: m.matchedSkills,
      missingSkills: m.missingSkills
    }));

    res.json(preferredJobs);
  } catch (error) {
    console.error('Get preferred jobs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
