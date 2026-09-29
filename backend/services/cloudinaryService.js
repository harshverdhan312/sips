const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const config = require('../config');
const logger = require('../utils/logger');

function cleanEnvStr(val) {
  if (!val || typeof val !== 'string') return '';
  let s = val.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim();
  }
  return s;
}

function sanitizeCloudinaryUrl(urlStr) {
  let s = cleanEnvStr(urlStr);
  if (s.startsWith('CLOUDINARY_URL=')) {
    s = s.replace(/^CLOUDINARY_URL=/, '').trim();
    s = cleanEnvStr(s);
  }
  return s;
}

/**
 * Configure and verify Cloudinary client
 * @returns {boolean}
 */
function isCloudinaryConfigured() {
  const rawUrl = sanitizeCloudinaryUrl(typeof config.cloudinaryUrl === 'string' ? config.cloudinaryUrl : (process.env.CLOUDINARY_URL || ''));
  if (rawUrl.length > 0) {
    process.env.CLOUDINARY_URL = rawUrl;
    cloudinary.config(true);
    cloudinary.config({ secure: true });
    const cfg = cloudinary.config();
    if (cfg.cloud_name && cfg.api_key && cfg.api_secret) {
      return true;
    }
  }

  const cloudName = cleanEnvStr(typeof config.cloudinaryCloudName === 'string' ? config.cloudinaryCloudName : (process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_NAME || ''));
  const apiKey = cleanEnvStr(typeof config.cloudinaryApiKey === 'string' ? config.cloudinaryApiKey : (process.env.CLOUDINARY_API_KEY || ''));
  const apiSecret = cleanEnvStr(typeof config.cloudinaryApiSecret === 'string' ? config.cloudinaryApiSecret : (process.env.CLOUDINARY_API_SECRET || ''));

  if (cloudName.length > 0 && apiKey.length > 0 && apiSecret.length > 0) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true
    });
    return true;
  }

  return false;
}

/**
 * Get Cloudinary configuration status and ping result for diagnostics
 */
async function getCloudinaryStatus() {
  const isConfigured = isCloudinaryConfigured();
  const cfg = cloudinary.config();
  let pingStatus = null;
  let pingError = null;

  if (isConfigured) {
    try {
      const ping = await cloudinary.api.ping();
      pingStatus = ping.status || 'ok';
    } catch (err) {
      pingError = err.message;
      logger.warn('Cloudinary ping check failed:', err.message);
    }
  }

  return {
    isConfigured,
    cloudName: cfg.cloud_name || null,
    hasApiKey: Boolean(cfg.api_key),
    hasApiSecret: Boolean(cfg.api_secret),
    pingStatus,
    pingError
  };
}

/**
 * Upload an image file to Cloudinary with automatic optimization
 * @param {string} localFilePath - Path to local file on disk
 * @param {Object} [options] - Additional upload options
 * @returns {Promise<{ secure_url: string, public_id: string }>}
 */
async function uploadImage(localFilePath, options = {}) {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary is not configured on the server.');
  }

  const uploadOptions = {
    folder: options.folder || 'sips/avatars',
    resource_type: 'image',
    transformation: [
      { width: 500, height: 500, crop: 'limit' },
      { quality: 'auto', fetch_format: 'auto' }
    ],
    ...options
  };

  const result = await cloudinary.uploader.upload(localFilePath, uploadOptions);

  return {
    secure_url: result.secure_url,
    public_id: result.public_id
  };
}

/**
 * Upload a PDF resume file to Cloudinary with persistent raw/image storage
 * @param {string} localFilePath - Path to local file on disk
 * @param {Object} [options] - Additional upload options
 * @returns {Promise<{ secure_url: string, public_id: string }>}
 */
async function uploadResume(localFilePath, options = {}) {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary is not configured on the server.');
  }

  const uploadOptions = {
    folder: options.folder || 'sips/resumes',
    resource_type: 'auto',
    ...options
  };

  const result = await cloudinary.uploader.upload(localFilePath, uploadOptions);

  return {
    secure_url: result.secure_url,
    public_id: result.public_id
  };
}

/**
 * Delete an image from Cloudinary by public ID or URL
 * @param {string} urlOrPublicId
 * @returns {Promise<boolean>}
 */
async function deleteImage(urlOrPublicId) {
  if (!urlOrPublicId || typeof urlOrPublicId !== 'string') {
    return false;
  }

  if (!isCloudinaryConfigured()) {
    return false;
  }

  try {
    let publicId = urlOrPublicId;

    // If a full Cloudinary URL is provided, extract public_id
    if (urlOrPublicId.includes('cloudinary.com')) {
      const parts = urlOrPublicId.split('/upload/');
      if (parts.length > 1) {
        // Strip transformation params and version prefix if present
        // (e.g. v123456789/sips/avatars/abc.jpg -> sips/avatars/abc)
        const pathAfterUpload = parts[1].replace(/^(?:[a-z0-9_,-]+\/)?(?:v\d+\/)?/, '');
        publicId = pathAfterUpload.replace(/\.[^/.]+$/, ''); // remove extension
      }
    } else {
      // If it's not a cloudinary url and not a valid publicId format
      return false;
    }

    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (err) {
    logger.warn('Failed to delete image from Cloudinary:', err.message);
    return false;
  }
}

module.exports = {
  isCloudinaryConfigured,
  getCloudinaryStatus,
  uploadImage,
  uploadResume,
  deleteImage
};
