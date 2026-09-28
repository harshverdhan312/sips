const cloudinaryService = require('../services/cloudinaryService');
const config = require('../config');

describe('Cloudinary Service Integration Tests', () => {
  const origCloudinaryUrl = config.cloudinaryUrl;
  const origCloudName = config.cloudinaryCloudName;
  const origApiKey = config.cloudinaryApiKey;
  const origApiSecret = config.cloudinaryApiSecret;

  afterEach(() => {
    config.cloudinaryUrl = origCloudinaryUrl;
    config.cloudinaryCloudName = origCloudName;
    config.cloudinaryApiKey = origApiKey;
    config.cloudinaryApiSecret = origApiSecret;
  });

  test('isCloudinaryConfigured returns false when no keys configured', () => {
    config.cloudinaryUrl = '';
    config.cloudinaryCloudName = '';
    config.cloudinaryApiKey = '';
    config.cloudinaryApiSecret = '';
    expect(cloudinaryService.isCloudinaryConfigured()).toBe(false);
  });

  test('isCloudinaryConfigured returns true when CLOUDINARY_URL is present', () => {
    config.cloudinaryUrl = 'cloudinary://1234567890:secret123@testcloud';
    expect(cloudinaryService.isCloudinaryConfigured()).toBe(true);
  });

  test('isCloudinaryConfigured returns true when individual credentials are present', () => {
    config.cloudinaryUrl = '';
    config.cloudinaryCloudName = 'testcloud';
    config.cloudinaryApiKey = '1234567890';
    config.cloudinaryApiSecret = 'secret123';
    expect(cloudinaryService.isCloudinaryConfigured()).toBe(true);
  });

  test('deleteImage returns false for empty or non-Cloudinary url', async () => {
    const res1 = await cloudinaryService.deleteImage(null);
    expect(res1).toBe(false);

    const res2 = await cloudinaryService.deleteImage('/uploads/avatar-123.png');
    expect(res2).toBe(false);
  });
});
