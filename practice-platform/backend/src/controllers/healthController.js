/**
 * Health Controller
 */

exports.getHealth = (req, res) => {
  return res.status(200).json({
    success: true,
    service: 'practice-platform',
    status: 'healthy'
  });
};
