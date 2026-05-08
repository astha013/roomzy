const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, async (req, res) => {
  try {
    const { reportedUserId, reason, description } = req.body;

    const report = await Report.create({
      reporter: req.user._id,
      reportedUser: reportedUserId,
      reason,
      description
    });

    res.status(201).json({ message: 'Report submitted', report });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/block/:userId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.blockedUsers.includes(req.params.userId)) {
      user.blockedUsers.push(req.params.userId);
      await user.save();
    }
    res.json({ message: 'User blocked' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/unblock/:userId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.blockedUsers = user.blockedUsers.filter(id => id.toString() !== req.params.userId);
    await user.save();
    res.json({ message: 'User unblocked' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/blocked', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('blockedUsers', 'name profilePhoto');
    res.json(user.blockedUsers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;