const path = require('path');
const fs = require('fs');
const Student = require('../models/Student');
const College = require('../models/College');
const memoryDb = require('../utils/memoryDb');
const config = require('../config');
const logger = require('../utils/logger');
const { validateUsername } = require('../utils/usernameValidator');

/**
 * Build sanitized public college details
 */
async function getPublicCollegeInfo(collegeId) {
  if (!collegeId) return null;

  try {
    if (!memoryDb.isMongoConnected()) {
      const col = memoryDb.findCollegeById(collegeId);
      if (!col) return null;
      return {
        name: col.name || '',
        slug: col.slug || '',
        logoUrl: col.logoUrl || '',
        website: col.website || '',
        city: col.city || '',
        state: col.state || ''
      };
    }

    const col = await College.findById(collegeId).select('name slug logoUrl website city state');
    if (!col) return null;
    return {
      name: col.name || '',
      slug: col.slug || '',
      logoUrl: col.logoUrl || '',
      website: col.website || '',
      city: col.city || '',
      state: col.state || ''
    };
  } catch (err) {
    logger.warn('Error fetching public college info:', err.message);
    return null;
  }
}

/**
 * GET /api/public/students/:username
 * Public, unauthenticated endpoint to view student's career profile
 */
exports.getPublicStudentProfile = async (req, res, next) => {
  try {
    const rawUsername = req.params.username;
    const { isValid, normalized: username } = validateUsername(rawUsername);

    if (!isValid || !username) {
      return res.status(404).json({
        success: false,
        message: 'Public profile not found.'
      });
    }

    let student = null;

    if (!memoryDb.isMongoConnected()) {
      student = memoryDb.findStudentByPublicUsername(username);
    } else {
      student = await Student.findOne({
        'publicProfile.enabled': true,
        'publicProfile.username': username,
        accountStatus: { $ne: 'DEACTIVATED' }
      }).lean();
    }

    // Return 404 for nonexistent, disabled, unconfigured, or deactivated profiles
    if (!student || !student.publicProfile || !student.publicProfile.enabled || student.accountStatus === 'DEACTIVATED') {
      return res.status(404).json({
        success: false,
        message: 'Public profile not found.'
      });
    }

    // Fetch public college details
    const collegeInfo = await getPublicCollegeInfo(student.collegeId);

    // Format GitHub link
    let formattedGithub = null;
    if (student.publicProfile.showGithub !== false && student.github) {
      const gh = student.github.trim();
      formattedGithub = gh.startsWith('http') ? gh : `https://github.com/${gh.replace(/^@/, '')}`;
    }

    // Format LinkedIn link
    let formattedLinkedIn = null;
    if (student.publicProfile.showLinkedIn !== false && student.linkedin) {
      formattedLinkedIn = student.linkedin.trim();
    }

    // Filter and sanitize featured projects (max 3, sorted by order)
    let publicProjects = [];
    if (student.publicProfile.showProjects !== false && Array.isArray(student.projects)) {
      publicProjects = student.projects
        .slice(0, 3)
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map(p => ({
          name: p.name || '',
          description: p.description || '',
          htmlUrl: p.htmlUrl || '',
          primaryLanguage: p.primaryLanguage || '',
          languages: Array.isArray(p.languages) ? p.languages : [],
          topics: Array.isArray(p.topics) ? p.topics : [],
          stars: typeof p.stars === 'number' ? p.stars : 0,
          forks: typeof p.forks === 'number' ? p.forks : 0,
          order: p.order || 1
        }));
    }

    // Filter skills
    const publicSkills = (student.publicProfile.showSkills !== false && Array.isArray(student.skills))
      ? student.skills.filter(s => typeof s === 'string' && s.trim().length > 0)
      : [];

    // Filter and sanitize coding profiles (only active, visible profiles from stored snapshot)
    let publicCodingProfiles = [];
    if (student.publicProfile.showCodingProfiles !== false && Array.isArray(student.codingProfiles)) {
      publicCodingProfiles = student.codingProfiles
        .filter(cp => cp && cp.showOnPublicProfile !== false && cp.connectionStatus === 'CONNECTED')
        .map(cp => {
          const rawStats = cp.stats || {};
          const cleanStats = {};

          if (typeof rawStats.problemsSolved === 'number') {
            cleanStats.problemsSolved = rawStats.problemsSolved;
          }
          if (rawStats.difficultyBreakdown && typeof rawStats.difficultyBreakdown === 'object') {
            const diff = {};
            if (typeof rawStats.difficultyBreakdown.easy === 'number') diff.easy = rawStats.difficultyBreakdown.easy;
            if (typeof rawStats.difficultyBreakdown.medium === 'number') diff.medium = rawStats.difficultyBreakdown.medium;
            if (typeof rawStats.difficultyBreakdown.hard === 'number') diff.hard = rawStats.difficultyBreakdown.hard;
            if (Object.keys(diff).length > 0) {
              cleanStats.difficultyBreakdown = diff;
            }
          }
          if (typeof rawStats.currentRating === 'number') {
            cleanStats.currentRating = rawStats.currentRating;
          }
          if (typeof rawStats.maxRating === 'number') {
            cleanStats.maxRating = rawStats.maxRating;
          }
          if (rawStats.rank) {
            cleanStats.rank = String(rawStats.rank);
          }
          if (rawStats.maxRank) {
            cleanStats.maxRank = String(rawStats.maxRank);
          }
          if (typeof rawStats.globalRank === 'number') {
            cleanStats.globalRank = rawStats.globalRank;
          }
          if (rawStats.rankingTier) {
            cleanStats.rankingTier = String(rawStats.rankingTier);
          }
          if (typeof rawStats.contestParticipationCount === 'number') {
            cleanStats.contestParticipationCount = rawStats.contestParticipationCount;
          }
          if (Array.isArray(rawStats.badges)) {
            cleanStats.badges = rawStats.badges.map(b => ({
              name: String(b.name || ''),
              iconUrl: String(b.iconUrl || '')
            })).filter(b => b.name);
          }
          if (Array.isArray(rawStats.topLanguages)) {
            cleanStats.topLanguages = rawStats.topLanguages.map(l => String(l));
          }

          return {
            platform: cp.platform,
            username: cp.username,
            profileUrl: cp.profileUrl,
            accessMode: cp.accessMode || 'PUBLIC_ENDPOINT',
            stats: cleanStats
          };
        });
    }

    // Resume availability
    const hasResume = Boolean(student.resumeUrl && student.resumeUrl.trim());
    const isResumePublic = student.publicProfile.showResume === true && hasResume;

    const publicResponse = {
      success: true,
      username: student.publicProfile.username,
      profile: {
        name: student.name || '',
        profileImageUrl: student.profileImageUrl || '',
        bio: (typeof student.publicProfile.bio === 'string') ? student.publicProfile.bio : '',
        course: student.course || '',
        branch: student.branch || '',
        batch: student.batch || '',
        college: collegeInfo
      },
      links: {
        github: formattedGithub,
        linkedin: formattedLinkedIn
      },
      skills: publicSkills,
      projects: publicProjects,
      codingProfiles: publicCodingProfiles,
      resume: {
        available: isResumePublic,
        url: isResumePublic ? `/api/public/students/${username}/resume` : null
      }
    };

    return res.json(publicResponse);
  } catch (error) {
    logger.error('Public student profile retrieval error:', error);
    next(error);
  }
};

/**
 * GET /api/public/students/:username/resume
 * Controlled public resume download/view endpoint
 */
exports.getPublicStudentResume = async (req, res, next) => {
  try {
    const rawUsername = req.params.username;
    const { isValid, normalized: username } = validateUsername(rawUsername);

    if (!isValid || !username) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found or not publicly available.'
      });
    }

    let student = null;

    if (!memoryDb.isMongoConnected()) {
      student = memoryDb.findStudentByPublicUsername(username);
    } else {
      student = await Student.findOne({
        'publicProfile.enabled': true,
        'publicProfile.username': username,
        accountStatus: { $ne: 'DEACTIVATED' }
      }).select('publicProfile resumeUrl name accountStatus');
    }

    if (
      !student ||
      !student.publicProfile ||
      !student.publicProfile.enabled ||
      student.accountStatus === 'DEACTIVATED' ||
      student.publicProfile.showResume !== true ||
      !student.resumeUrl
    ) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found or not publicly available.'
      });
    }

    // If resume is stored on Cloudinary / remote CDN, redirect directly
    if (student.resumeUrl.startsWith('http://') || student.resumeUrl.startsWith('https://')) {
      return res.redirect(student.resumeUrl);
    }

    // Safely resolve the file in uploadDir to prevent directory traversal
    const filename = path.basename(student.resumeUrl);
    const uploadDirectory = path.resolve(config.uploadDir || path.join(__dirname, '../uploads'));
    const resolvedPath = path.resolve(uploadDirectory, filename);

    // Verify file is within uploadDirectory
    if (!resolvedPath.startsWith(uploadDirectory)) {
      logger.warn(`Path traversal attempt on public resume: ${student.resumeUrl}`);
      return res.status(404).json({
        success: false,
        message: 'Resume file cannot be located.'
      });
    }

    if (!fs.existsSync(resolvedPath)) {
      return res.status(404).json({
        success: false,
        message: 'Resume file not found on server.'
      });
    }

    const safeDownloadName = `${username}-resume.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${safeDownloadName}"`);

    return res.sendFile(resolvedPath);
  } catch (error) {
    logger.error('Public resume access error:', error);
    next(error);
  }
};
