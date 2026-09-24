const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * Resilient In-Memory Database Store
 * Seamlessly stores and queries records when MongoDB is offline or unavailable
 */
class MemoryDatabase {
  constructor() {
    this.colleges = [];
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
    return mongoose.connection.readyState === 1 || process.env.NODE_ENV === 'test';
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

    return list;
  }

  saveStudent(studentData) {
    const newStudent = {
      _id: studentData._id || this.nextId('std_'),
      collegeId: studentData.collegeId,
      name: studentData.name,
      rollNo: studentData.rollNo,
      usn: studentData.usn || studentData.rollNo,
      email: (studentData.email || '').toLowerCase().trim(),
      passwordHash: studentData.passwordHash,
      branch: studentData.branch || 'Computer Science & Engineering',
      batch: studentData.batch || '2025',
      cgpa: studentData.cgpa !== undefined ? studentData.cgpa : 7.5,
      placementStatus: studentData.placementStatus || 'UNPLACED',
      companyPlaced: studentData.companyPlaced || '',
      packageOffered: studentData.packageOffered || 0,
      readinessScore: studentData.readinessScore || 65,
      technicalScore: studentData.technicalScore || 65,
      softSkillScore: studentData.softSkillScore || 65,
      resumeScore: studentData.resumeScore || 65,
      skills: studentData.skills || [],
      tags: studentData.tags || [],
      notes: studentData.notes || '',
      github: studentData.github || '',
      resumeUrl: studentData.resumeUrl || '',
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
    Object.assign(student, updates, { updatedAt: new Date() });
    return student;
  }

  updateStudentProfileImage(id, profileImageUrl) {
    return this.updateStudent(id, { profileImageUrl });
  }

  deleteStudent(id) {
    const idx = this.students.findIndex(s => String(s._id) === String(id));
    if (idx === -1) return null;
    const removed = this.students.splice(idx, 1)[0];
    return removed;
  }

  // ==========================================
  // Job Operations
  // ==========================================
  getJobs(collegeId, filters = {}) {
    let list = this.jobs.filter(j => !collegeId || String(j.collegeId) === String(collegeId));
    if (filters.status && filters.status !== 'All') {
      list = list.filter(j => j.status === filters.status.toUpperCase());
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
      title: jobData.title,
      role: jobData.role || jobData.title,
      company: jobData.company,
      department: jobData.department || 'Engineering',
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
    Object.assign(job, updates, { updatedAt: new Date() });
    return job;
  }

  deleteJob(id) {
    const idx = this.jobs.findIndex(j => String(j._id) === String(id));
    if (idx === -1) return null;
    return this.jobs.splice(idx, 1)[0];
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

    const avgReadiness = totalStudents > 0 ? Math.round(students.reduce((acc, s) => acc + (s.readinessScore || 0), 0) / totalStudents) : 65;
    const avgTechnical = totalStudents > 0 ? Math.round(students.reduce((acc, s) => acc + (s.technicalScore || 0), 0) / totalStudents) : 65;
    const avgSoftSkill = totalStudents > 0 ? Math.round(students.reduce((acc, s) => acc + (s.softSkillScore || 0), 0) / totalStudents) : 65;
    const avgResume = totalStudents > 0 ? Math.round(students.reduce((acc, s) => acc + (s.resumeScore || 0), 0) / totalStudents) : 65;
    const avgCgpa = totalStudents > 0 ? parseFloat((students.reduce((acc, s) => acc + (s.cgpa || 0), 0) / totalStudents).toFixed(2)) : 7.5;

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
      placementRate,
      activeJobsCount: jobs.filter(j => j.status === 'ACTIVE').length,
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
