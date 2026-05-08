const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Report = require('../models/Report');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { detectFakeProfile } = require('../utils/fakeProfileDetection');

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

    // FIX: check report exists before accessing reportedUser
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
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

router.put('/users/:id/block', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isBlocked: true }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User blocked', user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/users/:id/unblock', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isBlocked: false }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User unblocked', user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});


// GET /api/admin/fake-profiles — AI-based fake profile detection
router.get('/fake-profiles', protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find({ isBlocked: false }).select('-password').lean();
    const Report = require('../models/Report');

    const results = await Promise.all(users.map(async (user) => {
      const reportCount = await Report.countDocuments({ reportedUser: user._id });
      const analysis = detectFakeProfile(user, reportCount, 0);
      return { ...user, fakeAnalysis: analysis };
    }));

    const suspicious = results
      .filter(u => u.fakeAnalysis.verdict !== 'genuine')
      .sort((a, b) => b.fakeAnalysis.fakeScore - a.fakeAnalysis.fakeScore);

    res.json(suspicious);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;