const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * Resilient In-Memory Database Store
 * Seamlessly stores and queries records when MongoDB is offline or unavailable
 */
class MemoryDatabase {
  constructor() {
    this.colleges = [];
    this.institutions = [];
    this.departments = [];
    this.students = [];
    this.jobs = [];
    this.alerts = [];
    this.auditLogs = [];
    this.matches = [];
    this.applications = [];
    this.notifications = [];
    this.placementPredictions = [];
    this._idCounter = 1000;
  }

  isMongoConnected() {
    if (mongoose.connection.readyState === 1) return true;
    if (process.env.NODE_ENV === 'test') {
      try {
        const Student = require('../models/Student');
        if (Student && (Student._isMockFunction || Student.find?._isMockFunction || typeof Student.find?.mock === 'object')) {
          return true;
        }
      } catch (e) {}
    }
    return false;
  }

  clearAll() {
    this.colleges = [];
    this.institutions = [];
    this.departments = [];
    this.students = [];
    this.jobs = [];
    this.alerts = [];
    this.auditLogs = [];
    this.matches = [];
    this.applications = [];
    this.notifications = [];
    this.placementPredictions = [];
    this._idCounter = 1000;
  }

  nextId(prefix = 'id_') {
    this._idCounter += 1;
    return `${prefix}${Date.now()}_${this._idCounter}`;
  }

  // ==========================================
  // College Operations
  // ==========================================
  findCollegeBySlug(slug) {
    const s = (slug || '').toLowerCase().trim();
    return this.colleges.find(c => c.slug === s);
  }

  findCollegeByDomain(domain) {
    const d = (domain || '').toLowerCase().trim();
    return this.colleges.find(c => (c.acceptedDomains || []).includes(d));
  }

  findCollegeByAdminEmail(email) {
    const e = (email || '').toLowerCase().trim();
    return this.colleges.find(c => c.adminEmail.toLowerCase() === e);
  }

  findCollegeById(id) {
    return this.colleges.find(c => String(c._id) === String(id));
  }

  saveCollege(collegeData) {
    const newCollege = {
      _id: collegeData._id || this.nextId('col_'),
      name: collegeData.name,
      slug: (collegeData.slug || '').toLowerCase().trim(),
      adminEmail: (collegeData.adminEmail || '').toLowerCase().trim(),
      masterPasswordHash: collegeData.masterPasswordHash,
      acceptedDomains: collegeData.acceptedDomains || [],
      logoUrl: collegeData.logoUrl || null,
      code: collegeData.code || '',
      address: collegeData.address || '',
      city: collegeData.city || '',
      state: collegeData.state || '',
      website: collegeData.website || '',
      contactEmail: collegeData.contactEmail || '',
      contactPhone: collegeData.contactPhone || '',
      establishedYear: typeof collegeData.establishedYear === 'number' ? collegeData.establishedYear : null,
      academicStructure: collegeData.academicStructure || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.colleges.push(newCollege);
    return newCollege;
  }

  updateCollege(id, updates) {
    const college = this.findCollegeById(id);
    if (!college) return null;
    Object.assign(college, updates, { updatedAt: new Date() });
    return college;
  }

  updateCollegeLogo(id, logoUrl) {
    return this.updateCollege(id, { logoUrl });
  }

  // ==========================================
  // Institution Operations
  // ==========================================
  findInstitutionBySlug(slug) {
    const s = (slug || '').toLowerCase().trim();
    return this.institutions.find(i => i.slug === s);
  }

  findInstitutionByEmail(email) {
    const e = (email || '').toLowerCase().trim();
    return this.institutions.find(i => (i.officialEmail || '').toLowerCase() === e);
  }

  findInstitutionByMainAdminUsername(username) {
    const u = (username || '').toLowerCase().trim();
    return this.institutions.find(i => i.mainAdmin && (i.mainAdmin.username || '').toLowerCase() === u);
  }

  findInstitutionById(id) {
    return this.institutions.find(i => String(i._id) === String(id));
  }

  saveInstitution(data) {
    const newInst = {
      _id: data._id || this.nextId('inst_'),
      name: (data.name || '').trim(),
      slug: (
        (data.slug || '').toLowerCase().trim() ||
        (data.name || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') ||
        `inst-${Date.now()}`
      ),
      code: (data.code || '').trim(),
      officialEmail: (data.officialEmail || '').toLowerCase().trim(),
      address: (data.address || '').trim(),
      city: (data.city || '').trim(),
      state: (data.state || '').trim(),
      country: (data.country || 'India').trim(),
      website: (data.website || '').trim(),
      phone: (data.phone || '').trim(),
      logoUrl: data.logoUrl || null,
      acceptedDomains: data.acceptedDomains || [],
      mainAdmin: {
        name: data.mainAdmin?.name || '',
        username: (data.mainAdmin?.username || '').toLowerCase().trim(),
        email: (data.mainAdmin?.email || '').toLowerCase().trim(),
        passwordHash: data.mainAdmin?.passwordHash || ''
      },
      status: data.status || 'PENDING_APPROVAL',
      approvalStatus: data.approvalStatus || (data.status === 'ACTIVE' ? 'APPROVED' : 'PENDING'),
      approvalRemarks: data.approvalRemarks || '',
      approvedAt: data.approvedAt || (data.status === 'ACTIVE' ? new Date() : null),
      approvedBy: data.approvedBy || null,
      needsPasswordReset: data.needsPasswordReset !== undefined ? data.needsPasswordReset : true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.institutions.push(newInst);
    return newInst;
  }

  updateInstitution(id, updates) {
    const inst = this.findInstitutionById(id);
    if (!inst) return null;
    Object.assign(inst, updates, { updatedAt: new Date() });
    return inst;
  }

  // ==========================================
  // Department Operations
  // ==========================================
  findDepartmentByUsername(username) {
    const u = (username || '').toLowerCase().trim();
    return this.departments.find(d => (d.username || '').toLowerCase() === u);
  }

  findDepartmentById(id) {
    return this.departments.find(d => String(d._id) === String(id));
  }

  findDepartmentsByInstitution(institutionId) {
    return this.departments.filter(d => String(d.institutionId) === String(institutionId));
  }

  saveDepartment(data) {
    const newDept = {
      _id: data._id || this.nextId('dept_'),
      institutionId: data.institutionId,
      name: (data.name || '').trim(),
      code: (data.code || '').trim(),
      username: (data.username || '').toLowerCase().trim(),
      passwordHash: data.passwordHash,
      programs: data.programs || [],
      description: (data.description || '').trim(),
      contactEmail: (data.contactEmail || '').toLowerCase().trim(),
      contactPhone: (data.contactPhone || '').trim(),
      status: data.status || 'ACTIVE',
      isMergedGroup: !!data.isMergedGroup,
      subDepartmentIds: data.subDepartmentIds || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.departments.push(newDept);

    // Keep shadow college record for complete legacy compatibility
    if (!this.findCollegeById(newDept._id)) {
      const parentInst = this.findInstitutionById(newDept.institutionId);
      this.colleges.push({
        _id: newDept._id,
        name: newDept.name,
        slug: newDept.username,
        adminEmail: newDept.username + '@institution.edu',
        masterPasswordHash: newDept.passwordHash,
        acceptedDomains: parentInst?.acceptedDomains ? [...parentInst.acceptedDomains] : [],
        academicStructure: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    return newDept;
  }

  updateDepartment(id, updates) {
    const dept = this.findDepartmentById(id);
    if (!dept) return null;
    Object.assign(dept, updates, { updatedAt: new Date() });

    // Sync shadow college record
    const shadowCol = this.findCollegeById(id);
    if (shadowCol) {
      if (updates.name) shadowCol.name = updates.name;
      if (updates.username) shadowCol.slug = updates.username;
    }

    return dept;
  }

  deleteDepartment(id) {
    const idx = this.departments.findIndex(d => String(d._id) === String(id));
    if (idx === -1) return false;
    this.departments.splice(idx, 1);
    this.colleges = this.colleges.filter(c => String(c._id) !== String(id));
    return true;
  }

  // ==========================================
  // Student Operations
  // ==========================================
  findStudentByEmail(email, collegeId) {
    const cleanEmail = (email || '').toLowerCase().trim();
    return this.students.find(s => 
      s.email.toLowerCase() === cleanEmail && 
      (!collegeId || String(s.collegeId) === String(collegeId))
    );
  }

  findStudentByRollNo(rollNo, collegeId) {
    const cleanRoll = (rollNo || '').toLowerCase().trim();
    return this.students.find(s => 
      ((s.rollNo && s.rollNo.toLowerCase() === cleanRoll) || 
       (s.usn && s.usn.toLowerCase() === cleanRoll)) &&
      (!collegeId || String(s.collegeId) === String(collegeId))
    );
  }

  findStudentById(id) {
    return this.students.find(s => String(s._id) === String(id));
  }

  getStudents(collegeId, filters = {}) {
    let list = this.students.filter(s => !collegeId || String(s.collegeId) === String(collegeId));

    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(s =>
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q)) ||
        (s.rollNo && s.rollNo.toLowerCase().includes(q)) ||
        (s.branch && s.branch.toLowerCase().includes(q))
      );
    }
    if (filters.branch && filters.branch !== 'All') {
      list = list.filter(s => s.branch && s.branch.toLowerCase().includes(filters.branch.toLowerCase()));
    }
    if (filters.status && filters.status !== 'All') {
      const st = filters.status.toUpperCase();
      if (st === 'AT RISK' || st === 'AT_RISK') {
        list = list.filter(s => (s.readinessScore || 0) < 50);
      } else if (st === 'NEEDS IMPROVEMENT' || st === 'NEEDS_IMPROVEMENT') {
        list = list.filter(s => (s.readinessScore || 0) >= 50 && (s.readinessScore || 0) < 75);
      } else if (st === 'READY' || st === 'PLACEMENT READY') {
        list = list.filter(s => (s.readinessScore || 0) >= 75);
      } else {
        list = list.filter(s => s.placementStatus === st);
      }
    }
    if (filters.readiness && filters.readiness !== 'All') {
      const r = filters.readiness.toLowerCase();
      if (r === 'ready') list = list.filter(s => (s.readinessScore || 0) >= 75);
      else if (r === 'needs_improvement') list = list.filter(s => (s.readinessScore || 0) >= 50 && (s.readinessScore || 0) < 75);
      else if (r === 'at_risk') list = list.filter(s => (s.readinessScore || 0) < 50);
    }
    if (filters.batch && filters.batch !== 'All') {
      const b = String(filters.batch).trim();
      list = list.filter(s => (s.batch && String(s.batch) === b) || (s.passingYear && String(s.passingYear) === b));
    }
    if (filters.passingYear && filters.passingYear !== 'All') {
      const py = String(filters.passingYear).trim();
      list = list.filter(s => (s.passingYear && String(s.passingYear) === py) || (s.batch && String(s.batch) === py));
    }
    if (filters.accountStatus && filters.accountStatus !== 'All') {
      const ast = filters.accountStatus.toUpperCase();
      list = list.filter(s => (s.accountStatus || 'ACTIVE') === ast);
    }

    return list;
  }

  saveStudent(studentData) {
    const newStudent = {
      _id: studentData._id || this.nextId('std_'),
      collegeId: studentData.collegeId,
      institutionId: studentData.institutionId || null,
      departmentId: studentData.departmentId || null,
      name: studentData.name,
      rollNo: studentData.rollNo,
      usn: studentData.usn || studentData.rollNo,
      email: (studentData.email || '').toLowerCase().trim(),
      passwordHash: studentData.passwordHash,
      course: (studentData.course || '').trim(),
      branch: studentData.branch || 'Computer Science & Engineering',
      section: (studentData.section || '').trim(),
      batch: studentData.batch ? String(studentData.batch).trim() : (studentData.passingYear ? String(studentData.passingYear).trim() : ''),
      passingYear: studentData.passingYear ? String(studentData.passingYear).trim() : (studentData.batch ? String(studentData.batch).trim() : ''),
      cgpa: (studentData.cgpa !== undefined && studentData.cgpa !== null && !isNaN(Number(studentData.cgpa))) ? Number(studentData.cgpa) : 0,
      placementStatus: studentData.placementStatus || 'UNPLACED',
      applicationEligibilityStatus: studentData.applicationEligibilityStatus || 'ELIGIBLE',
      accountStatus: studentData.accountStatus || 'ACTIVE',
      companyPlaced: studentData.companyPlaced || '',
      packageOffered: studentData.packageOffered || 0,
      readinessScore: studentData.readinessScore || 0,
      technicalScore: studentData.technicalScore || 0,
      softSkillScore: studentData.softSkillScore || 0,
      resumeScore: studentData.resumeScore || 0,
      skills: Array.isArray(studentData.skills) ? studentData.skills : [],
      tags: studentData.tags || [],
      notes: studentData.notes || '',
      github: studentData.github || '',
      linkedin: studentData.linkedin || '',
      projects: Array.isArray(studentData.projects) ? studentData.projects : [],
      codingProfiles: Array.isArray(studentData.codingProfiles) ? studentData.codingProfiles : [],
      publicProfile: studentData.publicProfile ? {
        enabled: Boolean(studentData.publicProfile.enabled),
        username: (studentData.publicProfile.username || '').toLowerCase().trim(),
        bio: String(studentData.publicProfile.bio || '').slice(0, 500).trim(),
        showResume: studentData.publicProfile.showResume !== undefined ? Boolean(studentData.publicProfile.showResume) : false,
        showGithub: studentData.publicProfile.showGithub !== undefined ? Boolean(studentData.publicProfile.showGithub) : true,
        showLinkedIn: studentData.publicProfile.showLinkedIn !== undefined ? Boolean(studentData.publicProfile.showLinkedIn) : true,
        showSkills: studentData.publicProfile.showSkills !== undefined ? Boolean(studentData.publicProfile.showSkills) : true,
        showProjects: studentData.publicProfile.showProjects !== undefined ? Boolean(studentData.publicProfile.showProjects) : true,
        showCodingProfiles: studentData.publicProfile.showCodingProfiles !== undefined ? Boolean(studentData.publicProfile.showCodingProfiles) : true
      } : {
        enabled: false,
        username: '',
        bio: '',
        showResume: false,
        showGithub: true,
        showLinkedIn: true,
        showSkills: true,
        showProjects: true,
        showCodingProfiles: true
      },
      resumeUrl: studentData.resumeUrl || '',
      resumeSkillReview: studentData.resumeSkillReview || {
        detectedSkills: [],
        status: 'NONE',
        extractedAt: null,
        confirmedAt: null
      },
      profileImageUrl: studentData.profileImageUrl || null,
      age: studentData.age !== undefined ? studentData.age : null,
      internships: studentData.internships !== undefined ? studentData.internships : null,
      hostel: studentData.hostel !== undefined ? studentData.hostel : null,
      historyOfBacklogs: studentData.historyOfBacklogs !== undefined ? studentData.historyOfBacklogs : null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.students.push(newStudent);
    return newStudent;
  }

  updateStudent(id, updates) {
    const student = this.findStudentById(id);
    if (!student) return null;
    
    // Deep merge for publicProfile if provided
    if (updates.publicProfile && typeof updates.publicProfile === 'object') {
      const existingPP = student.publicProfile || {};
      updates.publicProfile = {
        ...existingPP,
        ...updates.publicProfile
      };
    }
    
    Object.assign(student, updates, { updatedAt: new Date() });
    return student;
  }

  findStudentByPublicUsername(username) {
    if (!username || typeof username !== 'string') return null;
    const clean = username.toLowerCase().trim();
    return this.students.find(s => 
      s.publicProfile && 
      s.publicProfile.enabled === true && 
      (s.accountStatus || 'ACTIVE') !== 'DEACTIVATED' &&
      s.publicProfile.username && 
      s.publicProfile.username.toLowerCase() === clean
    ) || null;
  }

  isPublicUsernameTaken(username, excludeStudentId = null) {
    if (!username || typeof username !== 'string') return false;
    const clean = username.toLowerCase().trim();
    if (!clean) return false;
    return this.students.some(s => 
      String(s._id) !== String(excludeStudentId) &&
      s.publicProfile && 
      s.publicProfile.username && 
      s.publicProfile.username.toLowerCase() === clean
    );
  }

  updateStudentProfileImage(id, profileImageUrl) {
    return this.updateStudent(id, { profileImageUrl });
  }

  deleteStudent(id) {
    const idx = this.students.findIndex(s => String(s._id) === String(id));
    if (idx === -1) return null;
    const removed = this.students.splice(idx, 1)[0];

    // Cascade remove dependent in-memory records
    this.matches = this.matches.filter(m => String(m.studentId) !== String(id));
    this.applications = this.applications.filter(a => String(a.studentId) !== String(id));
    this.placementPredictions = this.placementPredictions.filter(p => String(p.studentId) !== String(id));
    this.notifications = this.notifications.filter(n => String(n.studentId) !== String(id) && String(n.userId) !== String(id));

    return removed;
  }

  bulkUpdateStudentAccountStatus(collegeId, studentIds, accountStatus) {
    if (!Array.isArray(studentIds) || studentIds.length === 0) return 0;
    const idStrs = studentIds.map(String);
    let updatedCount = 0;
    for (const s of this.students) {
      if ((!collegeId || String(s.collegeId) === String(collegeId)) && idStrs.includes(String(s._id))) {
        s.accountStatus = accountStatus;
        s.updatedAt = new Date();
        updatedCount++;
      }
    }
    return updatedCount;
  }

  bulkDeleteStudents(collegeId, studentIds) {
    if (!Array.isArray(studentIds) || studentIds.length === 0) return [];
    const idStrs = studentIds.map(String);
    const deletedStudents = [];
    this.students = this.students.filter(s => {
      if ((!collegeId || String(s.collegeId) === String(collegeId)) && idStrs.includes(String(s._id))) {
        deletedStudents.push(s);
        return false;
      }
      return true;
    });

    const deletedIds = deletedStudents.map(s => String(s._id));
    if (deletedIds.length > 0) {
      this.matches = this.matches.filter(m => !deletedIds.includes(String(m.studentId)));
      this.applications = this.applications.filter(a => !deletedIds.includes(String(a.studentId)));
      this.placementPredictions = this.placementPredictions.filter(p => !deletedIds.includes(String(p.studentId)));
      this.notifications = this.notifications.filter(n => !deletedIds.includes(String(n.studentId)) && !deletedIds.includes(String(n.userId)));
    }
    return deletedStudents;
  }

  // ==========================================
  // Job Operations
  // ==========================================
  getJobs(collegeId, filters = {}) {
    let list = this.jobs.filter(j => !collegeId || String(j.collegeId) === String(collegeId));
    if (filters.status && filters.status !== 'All') {
      list = list.filter(j => j.status === filters.status.toUpperCase());
    }
    if (filters.batch && filters.batch !== 'All') {
      const b = String(filters.batch).trim();
      list = list.filter(j => (j.batch && String(j.batch) === b) || (j.targetBatch && String(j.targetBatch) === b));
    }
    if (filters.targetBatch && filters.targetBatch !== 'All') {
      const tb = String(filters.targetBatch).trim();
      list = list.filter(j => (j.targetBatch && String(j.targetBatch) === tb) || (j.batch && String(j.batch) === tb));
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(j => 
        (j.title && j.title.toLowerCase().includes(q)) ||
        (j.company && j.company.toLowerCase().includes(q)) ||
        (j.department && j.department.toLowerCase().includes(q))
      );
    }
    return list;
  }

  findJobById(id) {
    return this.jobs.find(j => String(j._id) === String(id));
  }

  saveJob(jobData) {
    const newJob = {
      _id: jobData._id || this.nextId('job_'),
      collegeId: jobData.collegeId,
      institutionId: jobData.institutionId || null,
      departmentId: jobData.departmentId || null,
      title: jobData.title,
      role: jobData.role || jobData.title,
      company: jobData.company,
      department: jobData.department || 'Engineering',
      batch: jobData.batch ? String(jobData.batch).trim() : (jobData.targetBatch ? String(jobData.targetBatch).trim() : ''),
      targetBatch: jobData.targetBatch ? String(jobData.targetBatch).trim() : (jobData.batch ? String(jobData.batch).trim() : ''),
      location: jobData.location || 'Campus / Bengaluru',
      ctc: jobData.ctc || '12 LPA - 16 LPA',
      ctcValue: jobData.ctcValue || (jobData.ctc ? parseFloat(jobData.ctc) || 0 : 0),
      type: jobData.type || 'Full-time',
      minCgpa: jobData.minCgpa || 7.0,
      allowedBranches: jobData.allowedBranches || ['Computer Science'],
      requiredSkills: jobData.requiredSkills || ['Java', 'SQL'],
      description: jobData.description || '',
      rawText: jobData.description || '',
      status: jobData.status || 'ACTIVE',
      deadline: jobData.deadline || new Date(Date.now() + 30 * 86400000),
      driveDate: jobData.driveDate || new Date(Date.now() + 14 * 86400000),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.jobs.unshift(newJob);
    return newJob;
  }

  updateJob(id, updates) {
    const job = this.findJobById(id);
    if (!job) return null;
    if (updates.targetBatch && !updates.batch) {
      updates.batch = updates.targetBatch;
    } else if (updates.batch && !updates.targetBatch) {
      updates.targetBatch = updates.batch;
    }
    Object.assign(job, updates, { updatedAt: new Date() });
    return job;
  }

  deleteJob(id, collegeId) {
    const idx = this.jobs.findIndex(j => 
      String(j._id) === String(id) &&
      (!collegeId || String(j.collegeId) === String(collegeId))
    );
    if (idx === -1) return null;
    const removed = this.jobs.splice(idx, 1)[0];
    const jId = String(removed._id);
    this.matches = this.matches.filter(m => String(m.jdId) !== jId && String(m.jobId) !== jId);
    this.applications = this.applications.filter(a => String(a.jobId) !== jId);
    return removed;
  }

  // ==========================================
  // Match Operations
  // ==========================================
  findMatch(collegeId, studentId, jdId) {
    return this.matches.find(m => 
      (!collegeId || String(m.collegeId) === String(collegeId)) &&
      String(m.studentId) === String(studentId) &&
      (String(m.jdId) === String(jdId) || String(m.jobId) === String(jdId))
    );
  }

  getJobMatches(collegeId, jdId) {
    return this.matches.filter(m => 
      (!collegeId || String(m.collegeId) === String(collegeId)) &&
      (String(m.jdId) === String(jdId) || String(m.jobId) === String(jdId))
    );
  }

  saveMatch(matchData) {
    const existing = this.findMatch(matchData.collegeId, matchData.studentId, matchData.jdId || matchData.jobId);
    if (existing) {
      Object.assign(existing, matchData, { updatedAt: new Date() });
      return existing;
    }
    const newMatch = {
      _id: matchData._id || this.nextId('match_'),
      studentId: matchData.studentId,
      jdId: matchData.jdId || matchData.jobId,
      jobId: matchData.jdId || matchData.jobId,
      score: matchData.score,
      matchedSkills: matchData.matchedSkills || [],
      missingSkills: matchData.missingSkills || [],
      collegeId: matchData.collegeId,
      createdAt: new Date()
    };
    this.matches.push(newMatch);
    return newMatch;
  }

  // ==========================================
  // Alert Operations
  // ==========================================
  getAlerts(collegeId, filters = {}) {
    let list = this.alerts.filter(a => !collegeId || String(a.collegeId) === String(collegeId));
    if (filters.active !== undefined && filters.active !== 'all') {
      const isActive = filters.active === 'true' || filters.active === true;
      list = list.filter(a => a.active === isActive);
    }
    if (filters.type && filters.type !== 'ALL') {
      list = list.filter(a => a.type === filters.type.toUpperCase());
    }
    return list;
  }

  saveAlert(alertData) {
    const newAlert = {
      _id: alertData._id || this.nextId('alt_'),
      collegeId: alertData.collegeId,
      title: alertData.title,
      message: alertData.message,
      type: alertData.type || 'ANNOUNCEMENT',
      priority: alertData.priority || 'MEDIUM',
      target: alertData.target || 'ALL',
      active: alertData.active !== undefined ? alertData.active : true,
      expiresAt: alertData.expiresAt,
      createdAt: new Date()
    };
    this.alerts.unshift(newAlert);
    return newAlert;
  }

  // ==========================================
  // Application Operations
  // ==========================================
  findApplicationById(id) {
    return this.applications.find(a => String(a._id) === String(id));
  }

  findApplication(collegeId, studentId, jobId) {
    return this.applications.find(a => 
      String(a.collegeId) === String(collegeId) &&
      String(a.studentId) === String(studentId) &&
      String(a.jobId) === String(jobId)
    );
  }

  getStudentApplications(collegeId, studentId) {
    return this.applications
      .filter(a => 
        String(a.collegeId) === String(collegeId) && 
        String(a.studentId) === String(studentId)
      )
      .sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));
  }

  getJobApplications(collegeId, jobId) {
    return this.applications
      .filter(a => 
        String(a.collegeId) === String(collegeId) && 
        String(a.jobId) === String(jobId)
      )
      .sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));
  }

  saveApplication(appData) {
    const newApp = {
      _id: appData._id || this.nextId('app_'),
      collegeId: appData.collegeId,
      studentId: appData.studentId,
      jobId: appData.jobId,
      status: appData.status || 'APPLIED',
      appliedAt: appData.appliedAt || new Date(),
      updatedAt: new Date()
    };
    this.applications.unshift(newApp);
    return newApp;
  }

  // ==========================================
  // Notification Operations
  // ==========================================
  findNotificationById(id) {
    return this.notifications.find(n => String(n._id) === String(id));
  }

  getNotifications(collegeId, filters = {}) {
    let list = this.notifications.filter(n => String(n.collegeId) === String(collegeId));

    if (filters.studentId) {
      const sid = String(filters.studentId);
      list = list.filter(n =>
        (n.studentId && String(n.studentId) === sid) ||
        n.target === 'ALL' ||
        n.target === 'STUDENTS'
      );
    }

    if (filters.read !== undefined) {
      const isRead = filters.read === true || filters.read === 'true';
      list = list.filter(n => n.read === isRead);
    }

    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  saveNotification(data) {
    const newNotif = {
      _id: data._id || this.nextId('notif_'),
      collegeId: data.collegeId,
      studentId: data.studentId || null,
      title: data.title || '',
      message: data.message,
      type: data.type || 'ANNOUNCEMENT',
      target: data.target || (data.studentId ? 'INDIVIDUAL' : 'ALL'),
      applicationId: data.applicationId || null,
      jobId: data.jobId || null,
      read: data.read || false,
      readAt: data.readAt || null,
      createdAt: data.createdAt || new Date(),
      updatedAt: new Date()
    };
    this.notifications.unshift(newNotif);
    return newNotif;
  }

  updateNotification(id, updates) {
    const notif = this.findNotificationById(id);
    if (!notif) return null;
    Object.assign(notif, updates, { updatedAt: new Date() });
    return notif;
  }

  markAllNotificationsAsRead(collegeId, studentId) {
    let count = 0;
    this.notifications.forEach(n => {
      if (String(n.collegeId) === String(collegeId)) {
        if (!studentId || (n.studentId && String(n.studentId) === String(studentId))) {
          if (!n.read) {
            n.read = true;
            n.readAt = new Date();
            n.updatedAt = new Date();
            count++;
          }
        }
      }
    });
    return count;
  }

  // ==========================================
  // Telemetry Operations
  // ==========================================
  getStudentApplicationStats(collegeId, studentId) {
    const apps = this.getStudentApplications(collegeId, studentId);
    const byStatus = {
      APPLIED: 0,
      SHORTLISTED: 0,
      REJECTED: 0,
      SELECTED: 0,
      WITHDRAWN: 0
    };

    apps.forEach(a => {
      if (byStatus[a.status] !== undefined) {
        byStatus[a.status]++;
      }
    });

    return {
      totalApplications: apps.length,
      activeApplications: byStatus.APPLIED + byStatus.SHORTLISTED,
      selectedApplications: byStatus.SELECTED,
      shortlistedApplications: byStatus.SHORTLISTED,
      rejectedApplications: byStatus.REJECTED,
      withdrawnApplications: byStatus.WITHDRAWN,
      byStatus
    };
  }

  getCollegeApplicationStats(collegeId) {
    const apps = this.applications.filter(a => String(a.collegeId) === String(collegeId));
    const byStatus = {
      APPLIED: 0,
      SHORTLISTED: 0,
      REJECTED: 0,
      SELECTED: 0,
      WITHDRAWN: 0
    };

    apps.forEach(a => {
      if (byStatus[a.status] !== undefined) {
        byStatus[a.status]++;
      }
    });

    return {
      total: apps.length,
      active: byStatus.APPLIED + byStatus.SHORTLISTED,
      selected: byStatus.SELECTED,
      shortlisted: byStatus.SHORTLISTED,
      rejected: byStatus.REJECTED,
      withdrawn: byStatus.WITHDRAWN,
      applied: byStatus.APPLIED,
      byStatus
    };
  }

  // ==========================================
  // Overview / Analytics Computation
  // ==========================================
  getOverview(collegeId) {
    const students = this.getStudents(collegeId);
    const jobs = this.getJobs(collegeId);
    const alerts = this.getAlerts(collegeId);

    const totalStudents = students.length;
    const placedStudents = students.filter(s => s.placementStatus === 'PLACED').length;
    const inProcessStudents = students.filter(s => s.placementStatus === 'IN_PROCESS').length;
    const optedOutStudents = students.filter(s => s.placementStatus === 'OPTED_OUT').length;
    const unplacedStudents = Math.max(0, totalStudents - placedStudents - inProcessStudents - optedOutStudents);
    const eligibleStudents = Math.max(0, totalStudents - optedOutStudents);
    const placementRate = eligibleStudents > 0 ? Math.round((placedStudents / eligibleStudents) * 100) : 0;

    const readyCount = students.filter(s => (s.readinessScore || 0) >= 75).length;
    const needsImprovementCount = students.filter(s => (s.readinessScore || 0) >= 50 && (s.readinessScore || 0) < 75).length;
    const atRiskCount = students.filter(s => (s.readinessScore || 0) < 50).length;

    const avgReadiness = totalStudents > 0 ? Math.round(students.reduce((acc, s) => acc + (s.readinessScore || 0), 0) / totalStudents) : 0;
    const avgTechnical = totalStudents > 0 ? Math.round(students.reduce((acc, s) => acc + (s.technicalScore || 0), 0) / totalStudents) : 0;
    const avgSoftSkill = totalStudents > 0 ? Math.round(students.reduce((acc, s) => acc + (s.softSkillScore || 0), 0) / totalStudents) : 0;
    const avgResume = totalStudents > 0 ? Math.round(students.reduce((acc, s) => acc + (s.resumeScore || 0), 0) / totalStudents) : 0;
    const avgCgpa = totalStudents > 0 ? parseFloat((students.reduce((acc, s) => acc + (s.cgpa || 0), 0) / totalStudents).toFixed(2)) : 0;

    // Group students by branch to compute REAL departmentReadiness
    const deptMap = {};
    students.forEach(s => {
      const b = s.branch || 'General';
      if (!deptMap[b]) {
        deptMap[b] = { branch: b, count: 0, totalScore: 0, placed: 0, ready: 0, needsImprovement: 0, atRisk: 0 };
      }
      deptMap[b].count++;
      deptMap[b].totalScore += (s.readinessScore || 0);
      if (s.placementStatus === 'PLACED') deptMap[b].placed++;
      if ((s.readinessScore || 0) >= 75) deptMap[b].ready++;
      else if ((s.readinessScore || 0) >= 50) deptMap[b].needsImprovement++;
      else deptMap[b].atRisk++;
    });

    const departmentReadiness = Object.values(deptMap).map(d => ({
      branch: d.branch,
      department: d.branch,
      count: d.count,
      total: d.count,
      avgReadiness: d.count > 0 ? Math.round(d.totalScore / d.count) : 0,
      placed: d.placed,
      ready: d.ready,
      needsImprovement: d.needsImprovement,
      atRisk: d.atRisk
    }));

    return {
      totalStudents,
      placedStudents,
      inProcessStudents,
      unplacedStudents,
      optedOutStudents,
      eligibleStudents,
      activeJobsCount: jobs.filter(j => (j.status || 'ACTIVE') === 'ACTIVE' && (!j.deadline || new Date(j.deadline) >= new Date())).length,
      activeAlertsCount: alerts.filter(a => a.active).length,
      avgReadiness,
      avgTechnical,
      avgSoftSkill,
      avgResume,
      avgCgpa,
      atRiskCount,
      readyCount,
      needsImprovementCount,
      departmentReadiness,
      recentLogs: this.auditLogs.slice(0, 5)
    };
  }

  getStudentAnalytics(collegeId) {
    const students = this.getStudents(collegeId);
    const ready = students.filter(s => (s.readinessScore || 0) >= 75).length;
    const needsImprovement = students.filter(s => (s.readinessScore || 0) >= 50 && (s.readinessScore || 0) < 75).length;
    const atRisk = students.filter(s => (s.readinessScore || 0) < 50).length;

    const deptMap = {};
    students.forEach(s => {
      const b = s.branch || 'General';
      if (!deptMap[b]) {
        deptMap[b] = { branch: b, total: 0, totalScore: 0, totalCgpa: 0, placed: 0, ready: 0, needsImprovement: 0, atRisk: 0 };
      }
      deptMap[b].total++;
      deptMap[b].totalScore += (s.readinessScore || 0);
      deptMap[b].totalCgpa += (s.cgpa || 0);
      if (s.placementStatus === 'PLACED') deptMap[b].placed++;
      if ((s.readinessScore || 0) >= 75) deptMap[b].ready++;
      else if ((s.readinessScore || 0) >= 50) deptMap[b].needsImprovement++;
      else deptMap[b].atRisk++;
    });

    const departments = Object.values(deptMap).map(d => ({
      branch: d.branch,
      department: d.branch,
      total: d.total,
      placed: d.placed,
      ready: d.ready,
      needsImprovement: d.needsImprovement,
      atRisk: d.atRisk,
      avgReadiness: d.total > 0 ? Math.round(d.totalScore / d.total) : 0,
      avgCgpa: d.total > 0 ? Number((d.totalCgpa / d.total).toFixed(2)) : 0
    }));

    const cgpaBrackets = [
      { bracket: '< 6.0', count: students.filter(s => (s.cgpa || 0) < 6.0).length },
      { bracket: '6.0 - 7.0', count: students.filter(s => (s.cgpa || 0) >= 6.0 && (s.cgpa || 0) < 7.0).length },
      { bracket: '7.0 - 8.0', count: students.filter(s => (s.cgpa || 0) >= 7.0 && (s.cgpa || 0) < 8.0).length },
      { bracket: '8.0 - 9.0', count: students.filter(s => (s.cgpa || 0) >= 8.0 && (s.cgpa || 0) < 9.0).length },
      { bracket: '9.0 - 10.0', count: students.filter(s => (s.cgpa || 0) >= 9.0).length }
    ];

    return {
      readinessTiers: [
        { tier: 'Placement Ready (≥75)', name: 'Placement Ready', count: ready, color: '#10B981' },
        { tier: 'Needs Improvement (50-74)', name: 'Needs Improvement', count: needsImprovement, color: '#F59E0B' },
        { tier: 'At Risk (<50)', name: 'At Risk', count: atRisk, color: '#EF4444' }
      ],
      departments,
      cgpaDistribution: cgpaBrackets
    };
  }

  getPlacementAnalytics(collegeId) {
    const students = this.getStudents(collegeId);
    const statusMap = { PLACED: 0, UNPLACED: 0, IN_PROCESS: 0, OPTED_OUT: 0 };
    students.forEach(s => {
      const st = s.placementStatus || 'UNPLACED';
      if (statusMap[st] !== undefined) statusMap[st]++;
      else statusMap.UNPLACED++;
    });

    const deptMap = {};
    students.forEach(s => {
      const b = s.branch || 'General';
      if (!deptMap[b]) {
        deptMap[b] = { branch: b, total: 0, placed: 0, totalPkg: 0 };
      }
      deptMap[b].total++;
      if (s.placementStatus === 'PLACED') {
        deptMap[b].placed++;
        deptMap[b].totalPkg += (s.packageOffered || 0);
      }
    });

    const departments = Object.values(deptMap).map(d => ({
      branch: d.branch,
      department: d.branch,
      total: d.total,
      placed: d.placed,
      placementRate: d.total > 0 ? Math.round((d.placed / d.total) * 100) : 0,
      avgPackage: d.placed > 0 ? Number((d.totalPkg / d.placed).toFixed(1)) : 0
    }));

    const placedStudents = students.filter(s => s.placementStatus === 'PLACED');
    const ctcDistribution = [
      { tier: '< 5 LPA', count: placedStudents.filter(s => (s.packageOffered || 0) < 5).length },
      { tier: '5 - 10 LPA', count: placedStudents.filter(s => (s.packageOffered || 0) >= 5 && (s.packageOffered || 0) < 10).length },
      { tier: '10 - 15 LPA', count: placedStudents.filter(s => (s.packageOffered || 0) >= 10 && (s.packageOffered || 0) < 15).length },
      { tier: '15+ LPA', count: placedStudents.filter(s => (s.packageOffered || 0) >= 15).length }
    ];

    const recruiterMap = {};
    placedStudents.forEach(s => {
      if (s.companyPlaced) {
        if (!recruiterMap[s.companyPlaced]) recruiterMap[s.companyPlaced] = { company: s.companyPlaced, hires: 0, totalPkg: 0 };
        recruiterMap[s.companyPlaced].hires++;
        recruiterMap[s.companyPlaced].totalPkg += (s.packageOffered || 0);
      }
    });
    const topRecruiters = Object.values(recruiterMap).map(r => ({
      company: r.company,
      hires: r.hires,
      avgPackage: r.hires > 0 ? Number((r.totalPkg / r.hires).toFixed(1)) : 0
    }));

    const batchMap = {};
    students.forEach(s => {
      const b = s.batch || 'Current';
      if (!batchMap[b]) batchMap[b] = { batch: b, total: 0, placed: 0, totalPkg: 0 };
      batchMap[b].total++;
      if (s.placementStatus === 'PLACED') {
        batchMap[b].placed++;
        batchMap[b].totalPkg += (s.packageOffered || 0);
      }
    });
    const batchTrends = Object.values(batchMap).map(b => ({
      batch: b.batch,
      total: b.total,
      placed: b.placed,
      placementRate: b.total > 0 ? Math.round((b.placed / b.total) * 100) : 0,
      avgPackage: b.placed > 0 ? Number((b.totalPkg / b.placed).toFixed(1)) : 0
    }));

    const applicationStats = this.getCollegeApplicationStats(collegeId);

    return {
      statusBreakdown: statusMap,
      departments,
      ctcDistribution,
      topRecruiters,
      batchTrends,
      applications: applicationStats
    };
  }

  getSkillIntelligence(collegeId) {
    const students = this.getStudents(collegeId);
    const jobs = this.getJobs(collegeId).filter(j => j.status === 'ACTIVE');

    const studentSkillMap = {};
    students.forEach(s => {
      if (Array.isArray(s.skills)) {
        s.skills.forEach(sk => {
          const lower = sk.toLowerCase().trim();
          studentSkillMap[lower] = (studentSkillMap[lower] || 0) + 1;
        });
      }
    });

    const demandedSkillMap = {};
    jobs.forEach(j => {
      if (Array.isArray(j.requiredSkills)) {
        j.requiredSkills.forEach(sk => {
          const lower = sk.toLowerCase().trim();
          demandedSkillMap[lower] = (demandedSkillMap[lower] || 0) + 1;
        });
      }
    });

    const allSkills = Array.from(new Set([...Object.keys(studentSkillMap), ...Object.keys(demandedSkillMap)]));
    const totalStudents = students.length || 1;
    const totalJobs = jobs.length || 1;

    const gapAnalysis = allSkills.map(skill => {
      const studentCount = studentSkillMap[skill] || 0;
      const demandCount = demandedSkillMap[skill] || 0;
      const studentPercentage = Math.round((studentCount / totalStudents) * 100);
      const demandPercentage = Math.round((demandCount / totalJobs) * 100);
      return {
        skill,
        studentCount,
        demandCount,
        studentPercentage,
        demandPercentage,
        gapScore: Math.max(0, demandPercentage - studentPercentage)
      };
    }).sort((a, b) => b.gapScore - a.gapScore);

    return {
      studentSkills: Object.entries(studentSkillMap).map(([skill, count]) => ({ skill, count })).sort((a, b) => b.count - a.count),
      demandedSkills: Object.entries(demandedSkillMap).map(([skill, count]) => ({ skill, count })).sort((a, b) => b.count - a.count),
      topMissingSkills: [],
      gapAnalysis: gapAnalysis.slice(0, 15),
      branchSkills: []
    };
  }

  // ==========================================
  // Placement Prediction Operations
  // ==========================================
  savePlacementPrediction(data) {
    const newPrediction = {
      _id: data._id || this.nextId('pred_'),
      collegeId: data.collegeId,
      studentId: data.studentId,
      placementProbability: data.placementProbability,
      decisionThreshold: data.decisionThreshold !== undefined ? data.decisionThreshold : 0.5,
      predictedClass: data.predictedClass,
      predictedLabel: data.predictedLabel,
      modelVersion: data.modelVersion || '1.0.0',
      inputSnapshot: data.inputSnapshot || {},
      createdAt: data.createdAt || new Date(),
      updatedAt: data.updatedAt || new Date()
    };
    this.placementPredictions.push(newPrediction);
    return newPrediction;
  }

  getLatestPlacementPrediction(collegeId, studentId) {
    const matches = this.placementPredictions.filter(p =>
      String(p.studentId) === String(studentId) &&
      (!collegeId || String(p.collegeId) === String(collegeId))
    );
    if (matches.length === 0) return null;
    matches.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return matches[0];
  }

  getPlacementPredictions(collegeId, studentId) {
    return this.placementPredictions
      .filter(p =>
        String(p.studentId) === String(studentId) &&
        (!collegeId || String(p.collegeId) === String(collegeId))
      )
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
}

const memoryDb = new MemoryDatabase();

module.exports = memoryDb;
