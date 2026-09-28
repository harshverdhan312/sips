const fs = require('fs');
const path = require('path');
const config = require('../config');
const logger = require('./logger');

/**
 * Safely delete an uploaded file inside config.uploadDir
 * Ensures path traversal cannot delete files outside the intended uploads directory
 * Safely handles missing files, null/undefined inputs, and non-existent paths
 */
function safeDeleteUploadFile(fileUrlOrName) {
  if (!fileUrlOrName || typeof fileUrlOrName !== 'string') return;

  try {
    const filename = path.basename(fileUrlOrName);
    if (!filename || filename === '.' || filename === '..') return;

    const uploadDir = path.resolve(config.uploadDir || path.join(__dirname, '../uploads'));
    const resolvedPath = path.resolve(uploadDir, filename);

    // Verify file is strictly inside uploadDir to prevent path traversal
    if (!resolvedPath.startsWith(uploadDir)) {
      logger.warn(`Path traversal attempt blocked during file deletion: ${fileUrlOrName}`);
      return;
    }

    if (fs.existsSync(resolvedPath)) {
      fs.unlinkSync(resolvedPath);
      logger.info(`Safely deleted upload file: ${filename}`);
    }
  } catch (err) {
    logger.warn(`Failed to safely delete file ${fileUrlOrName}:`, err.message);
  }
}

module.exports = {
  safeDeleteUploadFile
};
