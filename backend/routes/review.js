const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');
const { analyzeSentiment, analyzeMessage } = require('../utils/fraudDetection');

// POST /api/reviews — create review with sentiment analysis
router.post('/', protect, async (req, res) => {
  try {
    const { reviewedUserId, ratings, comment, stayDuration, wouldRecommend } = req.body;

    if (req.user._id.toString() === reviewedUserId)
      return res.status(400).json({ message: 'You cannot review yourself' });

    const existingReview = await Review.findOne({ reviewer: req.user._id, reviewedUser: reviewedUserId });
    if (existingReview) return res.status(400).json({ message: 'Already reviewed this user' });

    if (!ratings || ratings.overall === undefined)
      return res.status(400).json({ message: 'Overall rating is required' });

    // Validate required new rating dimensions
    const requiredDimensions = ['cleanliness', 'behavior', 'cooperation', 'punctuality'];
    for (const dim of requiredDimensions) {
      if (ratings[dim] !== undefined && (ratings[dim] < 1 || ratings[dim] > 5))
        return res.status(400).json({ message: `${dim} rating must be between 1 and 5` });
    }

    // Feature 6: Sentiment analysis on review comment
    let sentimentScore = null;
    let flagged = false;
    let flagReason = '';

    if (comment) {
      sentimentScore = analyzeSentiment(comment);
      const msgAnalysis = analyzeMessage(comment);
      if (msgAnalysis.isSpam) {
        flagged = true;
        flagReason = 'spam_detected';
      } else if (msgAnalysis.isToxic) {
        flagged = true;
        flagReason = 'toxic_language';
      }
    }

    const review = await Review.create({
      reviewer: req.user._id,
      reviewedUser: reviewedUserId,
      ratings,
      comment,
      stayDuration,
      wouldRecommend,
      sentimentScore,
      flagged,
      flagReason
    });

    const { updateTrustScore } = require('../utils/trustScore');
    const newTrustScore = await updateTrustScore(reviewedUserId);

    res.status(201).json({ review, trustScore: newTrustScore, sentimentScore });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/reviews/user/:userId
router.get('/user/:userId', async (req, res) => {
  try {
    const reviews = await Review.find({ reviewedUser: req.params.userId, flagged: false })
      .populate('reviewer', 'name profilePhoto')
      .sort({ createdAt: -1 });
    
    // Compute averages per dimension
    const dims = ['cleanliness', 'behavior', 'cooperation', 'punctuality', 'communication', 'overall'];
    const averages = {};
    dims.forEach(dim => {
      const vals = reviews.filter(r => r.ratings[dim]).map(r => r.ratings[dim]);
      averages[dim] = vals.length ? parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)) : null;
    });

    res.json({ reviews, averages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
