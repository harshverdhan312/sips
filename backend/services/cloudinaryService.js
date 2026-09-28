const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * Configure and verify Cloudinary client
 * @returns {boolean}
 */
function isCloudinaryConfigured() {
  if (config.cloudinaryUrl && config.cloudinaryUrl.trim().length > 0) {
    cloudinary.config({
      cloudinary_url: config.cloudinaryUrl.trim()
    });
    return true;
  }

  if (
    config.cloudinaryCloudName &&
    config.cloudinaryApiKey &&
    config.cloudinaryApiSecret &&
    config.cloudinaryCloudName.trim().length > 0 &&
    config.cloudinaryApiKey.trim().length > 0 &&
    config.cloudinaryApiSecret.trim().length > 0
  ) {
    cloudinary.config({
      cloud_name: config.cloudinaryCloudName.trim(),
      api_key: config.cloudinaryApiKey.trim(),
      api_secret: config.cloudinaryApiSecret.trim(),
      secure: true
    });
    return true;
  }

  return false;
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
  uploadImage,
  deleteImage
};
