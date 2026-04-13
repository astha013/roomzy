const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Match = require('../models/Match');
const { protect } = require('../middleware/authMiddleware');
const { calculateCompatibility } = require('../utils/compatibility');

// GET /api/matches/suggestions
router.get('/suggestions', protect, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);

    if (!currentUser.preferences?.moveInDate || !currentUser.city || !currentUser.intent) {
      return res.status(400).json({
        message: 'Please set intent, move-in date and city in your profile',
      });
    }

    const oppositeIntent =
      currentUser.intent === 'have_room_need_roommate'
        ? 'looking_for_roommate'
        : 'have_room_need_roommate';

    const moveInDate = new Date(currentUser.preferences.moveInDate);
    const minDate = new Date(moveInDate.getTime() - 15 * 24 * 60 * 60 * 1000);
    const maxDate = new Date(moveInDate.getTime() + 15 * 24 * 60 * 60 * 1000);

    // FIX BUG 3: combine $ne and $nin into a single $nin array
    const excludedIds = [currentUser._id, ...(currentUser.blockedUsers || [])];

    const candidates = await User.find({
      _id: { $nin: excludedIds },
      city: currentUser.city,
      intent: oppositeIntent,
      'preferences.moveInDate': { $gte: minDate, $lte: maxDate },
      trustScore: { $gte: 30 },
      isBlocked: false,
    }).select('-password');

    const matches = candidates
      .map((candidate) => {
        const { score, breakdown } = calculateCompatibility(
          currentUser.preferences,
          candidate.preferences,
          currentUser.preferenceWeights
        );
        return { user: candidate, compatibilityScore: score, breakdown };
      })
      .sort((a, b) => b.compatibilityScore - a.compatibilityScore);

    res.json(matches.slice(0, 20));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/matches/like/:userId
router.post('/like/:userId', protect, async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const targetUserId = req.params.userId;

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const currentUser = await User.findById(currentUserId);

    // FIX BUG 9: simplified mutual match logic
    let match = await Match.findOne({
      $or: [
        { userA: currentUserId, userB: targetUserId },
        { userA: targetUserId, userB: currentUserId },
      ],
    });

    if (match) {
      // A match record exists - check if the OTHER user already liked
      const otherUserAlreadyLiked =
        (match.userA.toString() === targetUserId.toString() && match.status === 'liked') ||
        (match.userB.toString() === targetUserId.toString() && match.status === 'liked');

      if (otherUserAlreadyLiked) {
        match.status = 'matched';
      } else if (match.status === 'pending' || match.status === 'rejected') {
        match.status = 'liked';
      }
      // If already 'liked' by currentUser or 'matched', no change needed
      match.updatedAt = new Date();
      await match.save();
    } else {
      // No existing match - create one
      const { score, breakdown } = calculateCompatibility(
        currentUser.preferences,
        targetUser.preferences,
        currentUser.preferenceWeights
      );

      match = await Match.create({
        userA: currentUserId,
        userB: targetUserId,
        compatibilityScore: score,
        breakdown,
        status: 'liked',
      });
    }

    const isNowMatched = match.status === 'matched';
    res.json({ message: isNowMatched ? "It's a match!" : 'Like sent', match, isNowMatched });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/matches/pass/:userId
router.post('/pass/:userId', protect, async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const targetUserId = req.params.userId;

    let match = await Match.findOne({
      $or: [
        { userA: currentUserId, userB: targetUserId },
        { userA: targetUserId, userB: currentUserId },
      ],
    });

    if (match) {
      match.status = 'rejected';
      match.updatedAt = new Date();
      await match.save();
    } else {
      const { score, breakdown } = calculateCompatibility(
        req.user.preferences,
        (await User.findById(targetUserId))?.preferences || {},
        req.user.preferenceWeights
      );
      await Match.create({
        userA: currentUserId,
        userB: targetUserId,
        compatibilityScore: score,
        breakdown,
        status: 'rejected',
      });
    }

    res.json({ message: 'User passed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/matches - get confirmed matches
router.get('/', protect, async (req, res) => {
  try {
    const matches = await Match.find({
      $or: [{ userA: req.user._id }, { userB: req.user._id }],
      status: 'matched',
    })
      .populate('userA', 'name profilePhoto city trustScore aiSummary intent')
      .populate('userB', 'name profilePhoto city trustScore aiSummary intent');

    res.json(matches);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
