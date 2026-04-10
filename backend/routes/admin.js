const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Report = require('../models/Report');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/users', protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/reports', protect, adminOnly, async (req, res) => {
  try {
    const reports = await Report.find()
      .populate('reporter', 'name email')
      .populate('reportedUser', 'name email')
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/reports/:reportId', protect, adminOnly, async (req, res) => {
  try {
    const { status, resolution, actionTaken } = req.body;
    
    const report = await Report.findByIdAndUpdate(
      req.params.reportId,
      { 
        status,
        resolution,
        actionTaken,
        resolvedAt: status === 'resolved' || status === 'dismissed' ? new Date() : undefined
      },
      { new: true }
    );
    
    if (status === 'resolved' && actionTaken === 'block') {
      await User.findByIdAndUpdate(report.reportedUser, { isBlocked: true });
    }
    
    res.json(report);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/stats', protect, adminOnly, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const trustedUsers = await User.countDocuments({ trustScore: { $gte: 30 } });
    const blockedUsers = await User.countDocuments({ isBlocked: true });
    const pendingReports = await Report.countDocuments({ status: 'pending' });
    
    res.json({
      totalUsers,
      trustedUsers,
      blockedUsers,
      pendingReports
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;