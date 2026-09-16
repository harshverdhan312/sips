const JobDescription = require('../models/JobDescription');
const Student = require('../models/Student');
const Match = require('../models/Match');
const AuditLog = require('../models/AuditLog');
const { calculateMatch, extractSkillsFromText } = require('../utils/matchingEngine');
const memoryDb = require('../utils/memoryDb');

/**
 * Helper to compute eligible and matched count for a JD
 */
const computeJobStats = async (collegeId, jd) => {
  const query = { collegeId };
  if (jd.minCgpa && jd.minCgpa > 0) {
    query.cgpa = { $gte: jd.minCgpa };
  }
  if (jd.allowedBranches && jd.allowedBranches.length > 0) {
    const branchRegexes = jd.allowedBranches.map(b => new RegExp(b.trim(), 'i'));
    query.branch = { $in: branchRegexes };
  }

  const eligibleCount = await Student.countDocuments(query);
  const matchedCount = await Match.countDocuments({
    jdId: jd._id,
    collegeId,
    score: { $gte: 50 }
  });

  return { eligibleCount, matchedCount };
};

/**
 * GET /api/admin/jobs
 * List all jobs & campus drives for the college
 */
exports.getJobs = async (req, res) => {
  try {
    const { status, search } = req.query;

    if (!memoryDb.isMongoConnected()) {
      const jobs = memoryDb.getJobs(req.collegeId, { status, search });
      return res.json({
        success: true,
        count: jobs.length,
        jobs
      });
    }

    const query = { collegeId: req.collegeId };

    if (status && status !== 'All') {
      query.status = status.toUpperCase();
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { company: searchRegex },
        { role: searchRegex },
        { department: searchRegex },
        { location: searchRegex }
      ];
    }

    const jobs = await JobDescription.find(query)
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      count: jobs.length,
      jobs
    });
  } catch (error) {
    console.error('Admin getJobs error:', error);
    res.status(500).json({ message: 'Server error retrieving jobs' });
  }
};

/**
 * POST /api/admin/jobs
 * Create a new job description / campus recruitment drive
 */
exports.createJob = async (req, res) => {
  try {
    const {
      title,
      role,
      company,
      description,
      department,
      location,
      ctc,
      ctcValue,
      type,
      deadline,
      driveDate,
      minCgpa,
      allowedBranches,
      requiredSkills,
      status
    } = req.body;

    if (!title || !company || !description) {
      return res.status(400).json({ message: 'Title, company, and description are required' });
    }

    // Auto-extract skills if none provided
    let skills = requiredSkills;
    if (!skills || skills.length === 0) {
      skills = extractSkillsFromText(description);
    }

    const parsedMinCgpa = parseFloat(minCgpa) || 0;
    const branches = Array.isArray(allowedBranches)
      ? allowedBranches.map(b => b.trim()).filter(Boolean)
      : (allowedBranches ? String(allowedBranches).split(',').map(b => b.trim()).filter(Boolean) : []);

    if (!memoryDb.isMongoConnected()) {
      const job = memoryDb.saveJob({
        collegeId: req.collegeId,
        title: title.trim(),
        role: (role || title).trim(),
        company: company.trim(),
        description: description.trim(),
        department: (department || 'Engineering').trim(),
        location: (location || 'Flexible / Campus').trim(),
        ctc: (ctc || '').trim(),
        ctcValue: parseFloat(ctcValue) || (ctc ? parseFloat(ctc) || 0 : 0),
        type: type || 'Full-time',
        deadline: deadline ? new Date(deadline) : undefined,
        driveDate: driveDate ? new Date(driveDate) : undefined,
        minCgpa: parsedMinCgpa,
        allowedBranches: branches,
        requiredSkills: (skills || []).map(s => s.trim().toLowerCase()).filter(Boolean),
        status: (status || 'ACTIVE').toUpperCase()
      });

      return res.status(201).json({
        success: true,
        message: 'Job / Drive created successfully',
        job
      });
    }

    const jd = new JobDescription({
      collegeId: req.collegeId,
      title: title.trim(),
      role: (role || title).trim(),
      company: company.trim(),
      description: description.trim(),
      rawText: description,
      department: (department || 'Engineering').trim(),
      location: (location || 'Flexible / Campus').trim(),
      ctc: (ctc || '').trim(),
      ctcValue: parseFloat(ctcValue) || (ctc ? parseFloat(ctc) || 0 : 0),
      type: type || 'Full-time',
      deadline: deadline ? new Date(deadline) : undefined,
      driveDate: driveDate ? new Date(driveDate) : undefined,
      minCgpa: parsedMinCgpa,
      allowedBranches: branches,
      requiredSkills: (skills || []).map(s => s.trim().toLowerCase()).filter(Boolean),
      status: status ? status.toUpperCase() : 'ACTIVE'
    });

    await jd.save();

    // Compute matches for students in this college
    const students = await Student.find({ collegeId: req.collegeId });
    let matchedCount = 0;

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
        if (result.score >= 50) {
          matchedCount++;
        }
      }
    }

    // Update eligible count
    const stats = await computeJobStats(req.collegeId, jd);
    jd.batchEligibleCount = stats.eligibleCount;
    jd.batchMatchedCount = matchedCount;
    await jd.save();

    // Audit log
    await AuditLog.create({
      collegeId: req.collegeId,
      action: 'CREATE_JOB',
      actor: req.user.email || 'Admin',
      target: `${jd.company} - ${jd.title}`,
      details: { jobId: jd._id }
    }).catch(err => console.error('AuditLog error:', err));

    res.status(201).json({
      success: true,
      message: 'Job / Drive created successfully',
      job: jd
    });
  } catch (error) {
    console.error('Admin createJob error:', error);
    res.status(500).json({ message: 'Server error creating job' });
  }
};

/**
 * GET /api/admin/jobs/:id
 * Get single job details with matched candidates preview
 */
exports.getJobById = async (req, res) => {
  try {
    if (!memoryDb.isMongoConnected()) {
      const job = memoryDb.findJobById(req.params.id);
      if (!job) return res.status(404).json({ message: 'Job not found' });
      return res.json({
        success: true,
        job: {
          ...job,
          batchEligibleCount: 0,
          batchMatchedCount: 0
        }
      });
    }

    const jd = await JobDescription.findOne({
      _id: req.params.id,
      collegeId: req.collegeId
    });

    if (!jd) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const stats = await computeJobStats(req.collegeId, jd);

    res.json({
      success: true,
      job: {
        ...jd.toObject(),
        batchEligibleCount: stats.eligibleCount,
        batchMatchedCount: stats.matchedCount
      }
    });
  } catch (error) {
    console.error('Admin getJobById error:', error);
    res.status(500).json({ message: 'Server error retrieving job' });
  }
};

/**
 * PUT /api/admin/jobs/:id
 * Update an existing job description
 */
exports.updateJob = async (req, res) => {
  try {
    if (!memoryDb.isMongoConnected()) {
      const job = memoryDb.updateJob(req.params.id, req.body);
      if (!job) return res.status(404).json({ message: 'Job not found' });
      return res.json({
        success: true,
        message: 'Job updated successfully',
        job
      });
    }

    const jd = await JobDescription.findOne({
      _id: req.params.id,
      collegeId: req.collegeId
    });

    if (!jd) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const {
      title,
      role,
      company,
      description,
      department,
      location,
      ctc,
      ctcValue,
      type,
      deadline,
      driveDate,
      minCgpa,
      allowedBranches,
      requiredSkills,
      status
    } = req.body;

    let skillsChanged = false;

    if (title !== undefined) jd.title = title.trim();
    if (role !== undefined) jd.role = role.trim();
    if (company !== undefined) jd.company = company.trim();
    if (description !== undefined) {
      jd.description = description.trim();
      jd.rawText = description;
    }
    if (department !== undefined) jd.department = department.trim();
    if (location !== undefined) jd.location = location.trim();
    if (ctc !== undefined) jd.ctc = ctc.trim();
    if (ctcValue !== undefined) jd.ctcValue = parseFloat(ctcValue) || 0;
    if (type !== undefined) jd.type = type;
    if (deadline !== undefined) jd.deadline = deadline ? new Date(deadline) : null;
    if (driveDate !== undefined) jd.driveDate = driveDate ? new Date(driveDate) : null;
    if (minCgpa !== undefined) jd.minCgpa = parseFloat(minCgpa) || 0;
    if (allowedBranches !== undefined) {
      jd.allowedBranches = Array.isArray(allowedBranches)
        ? allowedBranches.map(b => b.trim()).filter(Boolean)
        : String(allowedBranches).split(',').map(b => b.trim()).filter(Boolean);
    }
    if (status !== undefined) jd.status = status.toUpperCase();

    if (requiredSkills !== undefined && Array.isArray(requiredSkills)) {
      const newSkills = requiredSkills.map(s => s.trim().toLowerCase()).filter(Boolean);
      if (JSON.stringify(newSkills) !== JSON.stringify(jd.requiredSkills)) {
        jd.requiredSkills = newSkills;
        skillsChanged = true;
      }
    }

    await jd.save();

    // Recompute matches if skills changed
    if (skillsChanged) {
      const students = await Student.find({ collegeId: req.collegeId });
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
            { upsert: true }
          );
        }
      }
    }

    const stats = await computeJobStats(req.collegeId, jd);
    jd.batchEligibleCount = stats.eligibleCount;
    jd.batchMatchedCount = stats.matchedCount;
    await jd.save();

    await AuditLog.create({
      collegeId: req.collegeId,
      action: 'UPDATE_JOB',
      actor: req.user.email || 'Admin',
      target: `${jd.company} - ${jd.title}`
    }).catch(err => console.error('AuditLog error:', err));

    res.json({
      success: true,
      message: 'Job updated successfully',
      job: jd
    });
  } catch (error) {
    console.error('Admin updateJob error:', error);
    res.status(500).json({ message: 'Server error updating job' });
  }
};

/**
 * DELETE /api/admin/jobs/:id
 * Delete job and clean up its matches
 */
exports.deleteJob = async (req, res) => {
  try {
    if (!memoryDb.isMongoConnected()) {
      const job = memoryDb.deleteJob(req.params.id);
      if (!job) return res.status(404).json({ message: 'Job not found' });
      return res.json({ success: true, message: 'Job deleted successfully' });
    }

    const jd = await JobDescription.findOneAndDelete({
      _id: req.params.id,
      collegeId: req.collegeId
    });

    if (!jd) {
      return res.status(404).json({ message: 'Job not found' });
    }

    await Match.deleteMany({
      jdId: jd._id,
      collegeId: req.collegeId
    });

    await AuditLog.create({
      collegeId: req.collegeId,
      action: 'DELETE_JOB',
      actor: req.user.email || 'Admin',
      target: `${jd.company} - ${jd.title}`
    }).catch(err => console.error('AuditLog error:', err));

    res.json({
      success: true,
      message: 'Job and associated match records deleted successfully'
    });
  } catch (error) {
    console.error('Admin deleteJob error:', error);
    res.status(500).json({ message: 'Server error deleting job' });
  }
};

/**
 * GET /api/admin/jobs/:id/matches
 * Ranked list of students matching this job
 */
exports.getJobMatches = async (req, res) => {
  try {
    const { minScore = 0 } = req.query;

    if (!memoryDb.isMongoConnected()) {
      const job = memoryDb.findJobById(req.params.id);
      if (!job) return res.status(404).json({ message: 'Job not found' });
      const students = memoryDb.getStudents(req.collegeId);
      const ranked = students
        .map(s => {
          const result = calculateMatch(s.skills || [], job.requiredSkills || []);
          return {
            student: s,
            score: result.score,
            matchedSkills: result.matchedSkills,
            missingSkills: result.missingSkills
          };
        })
        .filter(m => m.score >= (parseInt(minScore, 10) || 0))
        .sort((a, b) => b.score - a.score)
        .map((m, idx) => ({ rank: idx + 1, ...m }));

      return res.json({
        success: true,
        job,
        totalMatches: ranked.length,
        matches: ranked
      });
    }

    const jd = await JobDescription.findOne({
      _id: req.params.id,
      collegeId: req.collegeId
    });

    if (!jd) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const matches = await Match.find({
      jdId: jd._id,
      collegeId: req.collegeId,
      score: { $gte: parseInt(minScore, 10) || 0 }
    })
      .sort({ score: -1 })
      .populate('studentId', 'name rollNo usn email branch batch cgpa placementStatus readinessScore skills')
      .lean();

    const ranked = matches
      .filter(m => m.studentId)
      .map((m, idx) => ({
        rank: idx + 1,
        student: m.studentId,
        score: m.score,
        matchedSkills: m.matchedSkills,
        missingSkills: m.missingSkills
      }));

    res.json({
      success: true,
      job: jd,
      totalMatches: ranked.length,
      matches: ranked
    });
  } catch (error) {
    console.error('Admin getJobMatches error:', error);
    res.status(500).json({ message: 'Server error retrieving job matches' });
  }
};

/**
 * POST /api/admin/jobs/:id/recompute
 * Recomputes candidate matches for a single job
 */
exports.recomputeJobMatches = async (req, res) => {
  try {
    const jd = await JobDescription.findOne({
      _id: req.params.id,
      collegeId: req.collegeId
    });

    if (!jd) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const students = await Student.find({ collegeId: req.collegeId });
    let count = 0;

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
          { upsert: true }
        );
        count++;
      }
    }

    const stats = await computeJobStats(req.collegeId, jd);
    jd.batchEligibleCount = stats.eligibleCount;
    jd.batchMatchedCount = stats.matchedCount;
    await jd.save();

    res.json({
      success: true,
      message: 'Matches recomputed for job',
      matchesProcessed: count,
      eligibleCount: stats.eligibleCount,
      matchedCount: stats.matchedCount
    });
  } catch (error) {
    console.error('Admin recomputeJobMatches error:', error);
    res.status(500).json({ message: 'Server error recomputing matches' });
  }
};
