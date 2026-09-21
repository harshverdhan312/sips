const Student = require('../models/Student');
const JobDescription = require('../models/JobDescription');
const Application = require('../models/Application');
const Alert = require('../models/Alert');
const AuditLog = require('../models/AuditLog');
const memoryDb = require('../utils/memoryDb');
const logger = require('../utils/logger');

/**
 * GET /api/admin/overview
 * Returns consolidated institutional KPIs for the dashboard
 */
exports.getOverview = async (req, res) => {
  try {
    const collegeId = req.collegeId;

    if (!memoryDb.isMongoConnected()) {
      const stats = memoryDb.getOverview(collegeId);
      return res.json({
        success: true,
        data: {
          totalStudents: stats.totalStudents,
          eligibleStudents: stats.eligibleStudents,
          placedStudents: stats.placedStudents,
          unplacedStudents: stats.unplacedStudents,
          inProcessStudents: stats.inProcessStudents,
          optedOutStudents: stats.optedOutStudents,
          placementRate: stats.placementRate,
          avgReadinessScore: stats.avgReadiness,
          avgTechnicalScore: stats.avgTechnical,
          avgSoftSkillScore: stats.avgSoftSkill,
          avgResumeScore: stats.avgResume,
          avgCgpa: stats.avgCgpa,
          atRiskCount: stats.atRiskCount,
          readyCount: stats.readyCount,
          needsImprovementCount: stats.needsImprovementCount,
          activeJobsCount: stats.activeJobsCount,
          activeAlertsCount: stats.activeAlertsCount,
          recentActivity: []
        }
      });
    }

    const [
      totalStudents,
      placedStudents,
      inProcessStudents,
      optedOutStudents,
      activeJobsCount,
      activeAlertsCount,
      totalApplications,
      recentLogs
    ] = await Promise.all([
      Student.countDocuments({ collegeId }),
      Student.countDocuments({ collegeId, placementStatus: 'PLACED' }),
      Student.countDocuments({ collegeId, placementStatus: 'IN_PROCESS' }),
      Student.countDocuments({ collegeId, placementStatus: 'OPTED_OUT' }),
      JobDescription.countDocuments({ collegeId, status: 'ACTIVE' }),
      Alert.countDocuments({ collegeId, active: true }),
      Application.countDocuments({ collegeId }),
      AuditLog.find({ collegeId }).sort({ timestamp: -1 }).limit(5).lean()
    ]);

    const unplacedStudents = Math.max(0, totalStudents - placedStudents - inProcessStudents - optedOutStudents);
    const eligibleStudents = Math.max(0, totalStudents - optedOutStudents);
    const placementRate = eligibleStudents > 0 ? Math.round((placedStudents / eligibleStudents) * 100) : 0;

    // Aggregate readiness & component score averages
    const scoreAgg = await Student.aggregate([
      { $match: { collegeId } },
      {
        $group: {
          _id: null,
          avgReadiness: { $avg: '$readinessScore' },
          avgTechnical: { $avg: '$technicalScore' },
          avgSoftSkill: { $avg: '$softSkillScore' },
          avgResume: { $avg: '$resumeScore' },
          avgCgpa: { $avg: '$cgpa' },
          atRiskCount: {
            $sum: {
              $cond: [{ $lt: ['$readinessScore', 50] }, 1, 0]
            }
          },
          readyCount: {
            $sum: {
              $cond: [{ $gte: ['$readinessScore', 75] }, 1, 0]
            }
          },
          needsImprovementCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ['$readinessScore', 50] },
                    { $lt: ['$readinessScore', 75] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    const stats = scoreAgg[0] || {
      avgReadiness: 0,
      avgTechnical: 0,
      avgSoftSkill: 0,
      avgResume: 0,
      avgCgpa: 0,
      atRiskCount: 0,
      readyCount: 0,
      needsImprovementCount: 0
    };

    res.json({
      success: true,
      data: {
        totalStudents,
        eligibleStudents,
        placedStudents,
        unplacedStudents,
        inProcessStudents,
        optedOutStudents,
        placementRate,
        avgReadinessScore: Math.round(stats.avgReadiness || 0),
        avgTechnicalScore: Math.round(stats.avgTechnical || 0),
        avgSoftSkillScore: Math.round(stats.avgSoftSkill || 0),
        avgResumeScore: Math.round(stats.avgResume || 0),
        avgCgpa: Number((stats.avgCgpa || 0).toFixed(2)),
        atRiskCount: stats.atRiskCount || 0,
        readyCount: stats.readyCount || 0,
        needsImprovementCount: stats.needsImprovementCount || 0,
        activeJobsCount,
        activeAlertsCount,
        totalApplications: totalApplications || 0,
        recentActivity: recentLogs.map(log => ({
          id: log._id,
          action: log.action,
          actor: log.actor,
          target: log.target,
          timestamp: log.timestamp
        }))
      }
    });
  } catch (error) {
    console.error('Admin getOverview error:', error);
    res.status(500).json({ message: 'Server error retrieving overview metrics' });
  }
};

/**
 * GET /api/admin/analytics/students
 * Institutional student readiness, CGPA, and department distribution
 */
exports.getStudentAnalytics = async (req, res) => {
  try {
    const collegeId = req.collegeId;

    // 1. Department/Branch distribution
    const departmentDistribution = await Student.aggregate([
      { $match: { collegeId } },
      {
        $group: {
          _id: '$branch',
          total: { $sum: 1 },
          avgReadiness: { $avg: '$readinessScore' },
          avgCgpa: { $avg: '$cgpa' },
          placed: {
            $sum: { $cond: [{ $eq: ['$placementStatus', 'PLACED'] }, 1, 0] }
          },
          atRisk: {
            $sum: { $cond: [{ $lt: ['$readinessScore', 50] }, 1, 0] }
          }
        }
      },
      { $sort: { total: -1 } }
    ]);

    // 2. Readiness tiers breakdown
    const readinessTiers = await Student.aggregate([
      { $match: { collegeId } },
      {
        $group: {
          _id: null,
          ready: {
            $sum: { $cond: [{ $gte: ['$readinessScore', 75] }, 1, 0] }
          },
          needsImprovement: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ['$readinessScore', 50] },
                    { $lt: ['$readinessScore', 75] }
                  ]
                },
                1,
                0
              ]
            }
          },
          atRisk: {
            $sum: { $cond: [{ $lt: ['$readinessScore', 50] }, 1, 0] }
          }
        }
      }
    ]);

    const tiers = readinessTiers[0] || { ready: 0, needsImprovement: 0, atRisk: 0 };

    // 3. CGPA distribution brackets
    const cgpaDistribution = await Student.aggregate([
      { $match: { collegeId } },
      {
        $bucket: {
          groupBy: '$cgpa',
          boundaries: [0, 6.0, 7.0, 8.0, 9.0, 10.1],
          default: 'Other',
          output: {
            count: { $sum: 1 }
          }
        }
      }
    ]);

    const cgpaBracketLabels = {
      0: '< 6.0',
      6.0: '6.0 - 7.0',
      7.0: '7.0 - 8.0',
      8.0: '8.0 - 9.0',
      9.0: '9.0 - 10.0'
    };

    const formattedCgpaBrackets = cgpaDistribution.map(b => ({
      bracket: cgpaBracketLabels[b._id] || String(b._id),
      count: b.count
    }));

    res.json({
      success: true,
      data: {
        readinessTiers: [
          { tier: 'Placement Ready (≥75)', count: tiers.ready, color: '#10B981' },
          { tier: 'Needs Improvement (50-74)', count: tiers.needsImprovement, color: '#F59E0B' },
          { tier: 'At Risk (<50)', count: tiers.atRisk, color: '#EF4444' }
        ],
        departments: departmentDistribution.map(d => ({
          branch: d._id || 'Unknown',
          total: d.total,
          placed: d.placed,
          atRisk: d.atRisk,
          avgReadiness: Math.round(d.avgReadiness || 0),
          avgCgpa: Number((d.avgCgpa || 0).toFixed(2))
        })),
        cgpaDistribution: formattedCgpaBrackets
      }
    });
  } catch (error) {
    console.error('Admin getStudentAnalytics error:', error);
    res.status(500).json({ message: 'Server error retrieving student analytics' });
  }
};

/**
 * GET /api/admin/analytics/placement
 * Placement metrics, package tiers, department placement rates, recruiter statistics
 */
exports.getPlacementAnalytics = async (req, res) => {
  try {
    const collegeId = req.collegeId;

    // 1. Placement Status breakdown
    const statusCounts = await Student.aggregate([
      { $match: { collegeId } },
      {
        $group: {
          _id: '$placementStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    const statusMap = { PLACED: 0, UNPLACED: 0, IN_PROCESS: 0, OPTED_OUT: 0 };
    statusCounts.forEach(s => {
      if (s._id && statusMap[s._id] !== undefined) {
        statusMap[s._id] = s.count;
      }
    });

    // 2. Department-wise placement rate
    const departmentPlacement = await Student.aggregate([
      { $match: { collegeId } },
      {
        $group: {
          _id: '$branch',
          total: { $sum: 1 },
          placed: {
            $sum: { $cond: [{ $eq: ['$placementStatus', 'PLACED'] }, 1, 0] }
          },
          avgPackage: {
            $avg: {
              $cond: [{ $eq: ['$placementStatus', 'PLACED'] }, '$packageOffered', null]
            }
          }
        }
      },
      {
        $project: {
          branch: '$_id',
          total: 1,
          placed: 1,
          placementRate: {
            $cond: [
              { $gt: ['$total', 0] },
              { $round: [{ $multiply: [{ $divide: ['$placed', '$total'] }, 100] }, 1] },
              0
            ]
          },
          avgPackage: { $round: [{ $ifNull: ['$avgPackage', 0] }, 1] }
        }
      },
      { $sort: { placementRate: -1 } }
    ]);

    // 3. CTC Distribution tiers (for placed students)
    const ctcDistribution = await Student.aggregate([
      { $match: { collegeId, placementStatus: 'PLACED' } },
      {
        $bucket: {
          groupBy: '$packageOffered',
          boundaries: [0, 5, 10, 15, 100],
          default: 'Other',
          output: {
            count: { $sum: 1 }
          }
        }
      }
    ]);

    const ctcLabels = {
      0: '< 5 LPA',
      5: '5 - 10 LPA',
      10: '10 - 15 LPA',
      15: '15+ LPA'
    };

    const formattedCtcTiers = ctcDistribution.map(b => ({
      tier: ctcLabels[b._id] || String(b._id),
      count: b.count
    }));

    // 4. Top Recruiters
    const topRecruiters = await Student.aggregate([
      {
        $match: {
          collegeId,
          placementStatus: 'PLACED',
          companyPlaced: { $ne: '' }
        }
      },
      {
        $group: {
          _id: '$companyPlaced',
          hires: { $sum: 1 },
          avgPackage: { $avg: '$packageOffered' }
        }
      },
      { $sort: { hires: -1 } },
      { $limit: 10 },
      {
        $project: {
          company: '$_id',
          hires: 1,
          avgPackage: { $round: [{ $ifNull: ['$avgPackage', 0] }, 1] }
        }
      }
    ]);

    // 5. Batch-wise historical trends
    const batchTrends = await Student.aggregate([
      { $match: { collegeId } },
      {
        $group: {
          _id: '$batch',
          total: { $sum: 1 },
          placed: {
            $sum: { $cond: [{ $eq: ['$placementStatus', 'PLACED'] }, 1, 0] }
          },
          avgPackage: {
            $avg: {
              $cond: [{ $eq: ['$placementStatus', 'PLACED'] }, '$packageOffered', null]
            }
          }
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          batch: '$_id',
          total: 1,
          placed: 1,
          placementRate: {
            $cond: [
              { $gt: ['$total', 0] },
              { $round: [{ $multiply: [{ $divide: ['$placed', '$total'] }, 100] }, 1] },
              0
            ]
          },
          avgPackage: { $round: [{ $ifNull: ['$avgPackage', 0] }, 1] }
        }
      }
    ]);

    // 6. Application Telemetry
    let applicationStats;
    if (!memoryDb.isMongoConnected()) {
      applicationStats = memoryDb.getCollegeApplicationStats(collegeId);
    } else {
      const appCounts = await Application.aggregate([
        { $match: { collegeId } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);
      const appByStatus = {
        APPLIED: 0,
        SHORTLISTED: 0,
        REJECTED: 0,
        SELECTED: 0,
        WITHDRAWN: 0
      };
      let totalApps = 0;
      appCounts.forEach(a => {
        if (a._id && appByStatus[a._id] !== undefined) {
          appByStatus[a._id] = a.count;
        }
        totalApps += a.count;
      });
      applicationStats = {
        total: totalApps,
        active: appByStatus.APPLIED + appByStatus.SHORTLISTED,
        selected: appByStatus.SELECTED,
        shortlisted: appByStatus.SHORTLISTED,
        rejected: appByStatus.REJECTED,
        withdrawn: appByStatus.WITHDRAWN,
        applied: appByStatus.APPLIED,
        byStatus: appByStatus
      };
    }

    res.json({
      success: true,
      data: {
        statusBreakdown: statusMap,
        departments: departmentPlacement,
        ctcDistribution: formattedCtcTiers,
        topRecruiters,
        batchTrends,
        applications: applicationStats
      }
    });
  } catch (error) {
    console.error('Admin getPlacementAnalytics error:', error);
    res.status(500).json({ message: 'Server error retrieving placement analytics' });
  }
};
