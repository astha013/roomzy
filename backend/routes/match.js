const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Match = require('../models/Match');
const { protect } = require('../middleware/authMiddleware');
const { calculateCompatibility } = require('../utils/compatibility');

router.get('/suggestions', protect, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    
    if (!currentUser.preferences?.moveInDate || !currentUser.city || !currentUser.intent) {
      return res.status(400).json({ message: 'Please set intent, move-in date and city in your profile' });
    }

    const currentIntent = currentUser.intent;
    const oppositeIntent = currentIntent === 'have_room_need_roommate' ? 'looking_for_roommate' : 'have_room_need_roommate';

    const moveInDate = new Date(currentUser.preferences.moveInDate);
    const minDate = new Date(moveInDate.getTime() - 15 * 24 * 60 * 60 * 1000);
    const maxDate = new Date(moveInDate.getTime() + 15 * 24 * 60 * 60 * 1000);

    const candidates = await User.find({
      _id: { $ne: currentUser._id },
      city: currentUser.city,
      intent: oppositeIntent,
      'preferences.moveInDate': { $gte: minDate, $lte: maxDate },
      trustScore: { $gte: 30 },
      isBlocked: false,
      _id: { $nin: currentUser.blockedUsers || [] }
    }).select('-password');

    const matches = candidates.map(candidate => {
      const { score, breakdown } = calculateCompatibility(
        currentUser.preferences,
        candidate.preferences,
        currentUser.preferenceWeights
      );
      return {
        user: candidate,
        compatibilityScore: score,
        breakdown
      };
    }).sort((a, b) => b.compatibilityScore - a.compatibilityScore);

    res.json(matches.slice(0, 20));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/like/:userId', protect, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    const targetUser = await User.findById(req.params.userId);

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    let match = await Match.findOne({
      $or: [
        { userA: currentUser._id, userB: targetUser._id },
        { userA: targetUser._id, userB: currentUser._id }
      ]
    });

    if (match) {
      if (match.userA.toString() === currentUser._id.toString()) {
        match.status = 'liked';
      } else if (match.userB.toString() === currentUser._id.toString()) {
        if (match.status === 'liked') {
          match.status = 'matched';
        } else {
          match.status = 'liked';
        }
      }
      await match.save();
    } else {
      const { score, breakdown } = calculateCompatibility(
        currentUser.preferences,
        targetUser.preferences,
        currentUser.preferenceWeights
      );

      match = await Match.create({
        userA: currentUser._id,
        userB: targetUser._id,
        compatibilityScore: score,
        breakdown,
        status: 'liked'
      });
    }

    res.json({ message: 'Like sent', match });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/pass/:userId', protect, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    const targetUserId = req.params.userId;

    let match = await Match.findOne({
      $or: [
        { userA: currentUser._id, userB: targetUserId },
        { userA: targetUserId, userB: currentUser._id }
      ]
    });

    if (match) {
      match.status = 'rejected';
      await match.save();
    }

    res.json({ message: 'User passed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/', protect, async (req, res) => {
  try {
    const matches = await Match.find({
      $or: [{ userA: req.user._id }, { userB: req.user._id }],
      status: 'matched'
    }).populate('userA', 'name profilePhoto city trustScore').populate('userB', 'name profilePhoto city trustScore');

    res.json(matches);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;