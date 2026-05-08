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

   // Get all user IDs already interacted with (liked, matched, rejected)
const existingMatches = await Match.find({
  $or: [{ userA: currentUser._id }, { userB: currentUser._id }]
}).select('userA userB');

const interactedIds = existingMatches.map(m =>
  m.userA.toString() === currentUser._id.toString() ? m.userB : m.userA
);

const excludedIds = [currentUser._id, ...(currentUser.blockedUsers || []), ...interactedIds];
    // ── Base filters ───────────────────────────────────────────────────────
    const query = {
      _id:    { $nin: excludedIds },
      city:   currentUser.city,
      intent: oppositeIntent,
      'preferences.moveInDate': { $gte: minDate, $lte: maxDate },
      trustScore: { $gte: 30 },
      isBlocked:  false,
    };

    // ── Food habit (HARD) ──────────────────────────────────────────────────
    // Veg users must ONLY see other veg users — never eggetarian or non-veg.
    // Eggetarian/non-veg users can still be filtered further by query param.
    const myFood   = currentUser.preferences?.foodHabit;
    const qFood    = req.query.foodHabit; // explicit filter from frontend
    if (qFood && ['veg', 'non-veg', 'eggetarian'].includes(qFood)) {
      query['preferences.foodHabit'] = qFood;
    } else if (myFood === 'veg') {
      // Auto-enforce: veg users never see non-veg / eggetarian profiles
      query['preferences.foodHabit'] = 'veg';
    }

    // ── Gender preference (HARD) ───────────────────────────────────────────
    const myGenderPref = currentUser.preferences?.genderPreference;
    if (myGenderPref && myGenderPref !== 'any') {
      query['gender'] = myGenderPref;
    }

    // ── Budget overlap (HARD) ──────────────────────────────────────────────
    // Ranges must actually overlap: candidate.min <= my.max AND candidate.max >= my.min
    const myMin = currentUser.preferences?.budgetMin ?? 0;
    const myMax = currentUser.preferences?.budgetMax;
    if (myMax) {
      query['preferences.budgetMin'] = { $lte: myMax };
      query['preferences.budgetMax'] = { $gte: myMin };
    }

    // ── Optional query-param filters ───────────────────────────────────────
    // sleepTime: model enum is 'early' | 'late' | 'flexible'
    const { sleepTime, personality, minBudget, maxBudget } = req.query;
    if (sleepTime && ['early', 'late', 'flexible'].includes(sleepTime)) {
      query['preferences.sleepTime'] = sleepTime;
    }
    if (personality && ['introvert', 'extrovert', 'ambivert'].includes(personality)) {
      query['preferences.personality'] = personality;
    }
    // Budget filters from frontend tighten (never loosen) the range
    if (minBudget && !isNaN(minBudget)) {
      // Candidate's max must be >= frontend minBudget
      const existingMin = query['preferences.budgetMax'];
      const frontendMin = Number(minBudget);
      query['preferences.budgetMax'] = existingMin
        ? { $gte: Math.max(existingMin.$gte ?? 0, frontendMin) }
        : { $gte: frontendMin };
    }
    if (maxBudget && !isNaN(maxBudget)) {
      // Candidate's min must be <= frontend maxBudget
      const existingMax = query['preferences.budgetMin'];
      const frontendMax = Number(maxBudget);
      query['preferences.budgetMin'] = existingMax
        ? { ...existingMax, $lte: Math.min(existingMax.$lte ?? Infinity, frontendMax) }
        : { $lte: frontendMax };
    }

    const candidates = await User.find(query).select('-password');

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

    // FIX: prevent self-liking
    if (currentUserId.toString() === targetUserId.toString()) {
      return res.status(400).json({ message: 'You cannot like yourself' });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const currentUser = await User.findById(currentUserId);

    // FIX: correct mutual match logic
    // Look for a record where the OTHER person already liked the current user
    const theyLikedMe = await Match.findOne({
      userA: targetUserId,
      userB: currentUserId,
      status: 'liked',
    });

    // Also check if we already have a match record initiated by us
    let ourLike = await Match.findOne({
      userA: currentUserId,
      userB: targetUserId,
    });

    let match;
    let isNowMatched = false;

    if (theyLikedMe) {
      // They already liked us — mutual match!
      theyLikedMe.status = 'matched';
      theyLikedMe.updatedAt = new Date();
      await theyLikedMe.save();
      match = theyLikedMe;
      isNowMatched = true;
    } else if (ourLike) {
      // We already have a record — update if not already liked/matched
      if (ourLike.status !== 'liked' && ourLike.status !== 'matched') {
        ourLike.status = 'liked';
        ourLike.updatedAt = new Date();
        await ourLike.save();
      }
      match = ourLike;
    } else {
      // No record at all — create new like
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
    const { type } = req.query; // 'matched' | 'liked' | undefined (all)

    const statusFilter = type === 'matched'
      ? 'matched'
      : type === 'liked'
        ? 'liked'
        : { $in: ['liked', 'matched'] };

    const matches = await Match.find({
      $or: [{ userA: req.user._id }, { userB: req.user._id }],
      status: statusFilter,
    })
      .populate('userA', 'name profilePhoto city trustScore aiSummary intent preferences')
      .populate('userB', 'name profilePhoto city trustScore aiSummary intent preferences');

    res.json(matches);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
