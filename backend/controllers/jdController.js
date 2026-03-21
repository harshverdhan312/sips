const JobDescription = require('../models/JobDescription');
const Student = require('../models/Student');
const Match = require('../models/Match');
const { calculateMatch, extractSkillsFromText } = require('../utils/matchingEngine');

/**
 * POST /api/jd
 * Admin-only — create a new job description
 */
exports.createJD = async (req, res) => {
  try {
    const { title, company, description, requiredSkills } = req.body;

    if (!title || !company || !description) {
      return res.status(400).json({ message: 'Title, company, and description are required' });
    }

    // Auto-extract skills from description if none provided
    let skills = requiredSkills;
    if (!skills || skills.length === 0) {
      skills = extractSkillsFromText(description);
    }

    const jd = new JobDescription({
      collegeId: req.collegeId,
      title: title.trim(),
      company: company.trim(),
      description: description.trim(),
      rawText: description,
      requiredSkills: skills.map(s => s.trim()).filter(Boolean)
    });

    await jd.save();

    // Compute matches for all students in this college
    const students = await Student.find({ collegeId: req.collegeId });
    let matchCount = 0;

    for (const student of students) {
      if (student.skills && student.skills.length > 0) {
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
        matchCount++;
      }
    }

    res.status(201).json({ 
      message: 'Job description created',
      jd,
      matchesComputed: matchCount
    });
  } catch (error) {
    console.error('Create JD error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET /api/jd
 * Auth required — list all JDs for this college
 */
exports.getJDs = async (req, res) => {
  try {
    const jds = await JobDescription.find({ collegeId: req.collegeId })
      .sort({ createdAt: -1 });
    res.json(jds);
  } catch (error) {
    console.error('Get JDs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET /api/jd/:id
 * Auth required — get single JD
 */
exports.getJD = async (req, res) => {
  try {
    const jd = await JobDescription.findOne({ 
      _id: req.params.id, 
      collegeId: req.collegeId 
    });
    if (!jd) {
      return res.status(404).json({ message: 'Job description not found' });
    }
    res.json(jd);
  } catch (error) {
    console.error('Get JD error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET /api/jd/:id/matches
 * Admin-only — get ranked student matches for a JD
 */
exports.getJDMatches = async (req, res) => {
  try {
    const jd = await JobDescription.findOne({ 
      _id: req.params.id, 
      collegeId: req.collegeId 
    });
    if (!jd) {
      return res.status(404).json({ message: 'Job description not found' });
    }

    const matches = await Match.find({ 
      jdId: jd._id, 
      collegeId: req.collegeId 
    })
      .sort({ score: -1 })
      .populate('studentId', '-passwordHash');

    const ranked = matches.map((m, idx) => ({
      rank: idx + 1,
      student: m.studentId,
      score: m.score,
      matchedSkills: m.matchedSkills,
      missingSkills: m.missingSkills
    }));

    res.json({ jd, matches: ranked });
  } catch (error) {
    console.error('Get JD matches error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * POST /api/jd/recompute
 * Admin-only — recompute all matches for a college
 */
exports.recomputeMatches = async (req, res) => {
  try {
    const jds = await JobDescription.find({ collegeId: req.collegeId });
    const students = await Student.find({ collegeId: req.collegeId });
    let count = 0;

    for (const jd of jds) {
      for (const student of students) {
        if (student.skills && student.skills.length > 0) {
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
          count++;
        }
      }
    }

    res.json({ message: 'Matches recomputed', matchesProcessed: count });
  } catch (error) {
    console.error('Recompute matches error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
