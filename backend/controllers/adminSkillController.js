const Student = require('../models/Student');
const JobDescription = require('../models/JobDescription');
const Match = require('../models/Match');
const memoryDb = require('../utils/memoryDb');

/**
 * GET /api/admin/skills/intelligence
 * Computes institutional skill intelligence:
 * - Top student skills
 * - Top demanded skills by recruiters
 * - Skill gaps (missing skills across active jobs)
 * - Branch-wise skill coverage
 */
exports.getSkillIntelligence = async (req, res) => {
  try {
    const collegeId = req.collegeId;

    if (!memoryDb.isMongoConnected() && !Student.aggregate?.mock) {
      const data = memoryDb.getSkillIntelligence(collegeId);
      return res.json({ success: true, data });
    }

    // 1. Student Skills aggregation
    const studentSkillsAgg = await Student.aggregate([
      { $match: { collegeId } },
      { $unwind: '$skills' },
      {
        $group: {
          _id: { $toLower: '$skills' },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 30 }
    ]);

    const studentSkillMap = {};
    studentSkillsAgg.forEach(s => {
      studentSkillMap[s._id] = s.count;
    });

    // 2. Demanded Skills aggregation across active JDs
    const demandedSkillsAgg = await JobDescription.aggregate([
      { $match: { collegeId, status: 'ACTIVE' } },
      { $unwind: '$requiredSkills' },
      {
        $group: {
          _id: { $toLower: '$requiredSkills' },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 30 }
    ]);

    const demandedSkillMap = {};
    demandedSkillsAgg.forEach(d => {
      demandedSkillMap[d._id] = d.count;
    });

    // 3. Missing skills identified from Match collection
    const missingSkillsAgg = await Match.aggregate([
      { $match: { collegeId } },
      { $unwind: '$missingSkills' },
      {
        $group: {
          _id: { $toLower: '$missingSkills' },
          frequency: { $sum: 1 }
        }
      },
      { $sort: { frequency: -1 } },
      { $limit: 20 }
    ]);

    // 4. Compute Supply vs Demand Gaps
    const allSkillKeys = Array.from(new Set([
      ...Object.keys(studentSkillMap),
      ...Object.keys(demandedSkillMap)
    ]));

    const totalStudents = (await Student.countDocuments({ collegeId })) || 1;
    const totalJobs = (await JobDescription.countDocuments({ collegeId, status: 'ACTIVE' })) || 1;

    const gapAnalysis = allSkillKeys.map(skill => {
      const studentCount = studentSkillMap[skill] || 0;
      const demandCount = demandedSkillMap[skill] || 0;
      const studentPercentage = Math.round((studentCount / totalStudents) * 100);
      const demandPercentage = Math.round((demandCount / totalJobs) * 100);

      // Shortfall: high demand percentage vs low student percentage
      const gapScore = Math.max(0, demandPercentage - studentPercentage);

      return {
        skill,
        studentCount,
        demandCount,
        studentPercentage,
        demandPercentage,
        gapScore
      };
    });

    // Sort by largest gap (high demand, low student availability)
    gapAnalysis.sort((a, b) => b.gapScore - a.gapScore);

    // 5. Branch-wise top skills
    const branchSkills = await Student.aggregate([
      { $match: { collegeId } },
      { $unwind: '$skills' },
      {
        $group: {
          _id: {
            branch: '$branch',
            skill: { $toLower: '$skills' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      {
        $group: {
          _id: '$_id.branch',
          skills: {
            $push: { skill: '$_id.skill', count: '$count' }
          }
        }
      },
      {
        $project: {
          branch: '$_id',
          topSkills: { $slice: ['$skills', 8] }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        studentSkills: studentSkillsAgg.map(s => ({ skill: s._id, count: s.count })),
        demandedSkills: demandedSkillsAgg.map(d => ({ skill: d._id, count: d.count })),
        topMissingSkills: missingSkillsAgg.map(m => ({ skill: m._id, frequency: m.frequency })),
        gapAnalysis: gapAnalysis.slice(0, 15),
        branchSkills
      }
    });
  } catch (error) {
    console.error('Admin getSkillIntelligence error:', error);
    res.status(500).json({ message: 'Server error analyzing skill intelligence' });
  }
};
