const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, async (req, res) => {
  try {
    const { reviewedUserId, ratings, comment, stayDuration, wouldRecommend } = req.body;

    const existingReview = await Review.findOne({
      reviewer: req.user._id,
      reviewedUser: reviewedUserId
    });
    if (existingReview) {
      return res.status(400).json({ message: 'Already reviewed this user' });
    }

    const review = await Review.create({
      reviewer: req.user._id,
      reviewedUser: reviewedUserId,
      ratings,
      comment,
      stayDuration,
      wouldRecommend
    });

    const reviews = await Review.find({ reviewedUser: reviewedUserId });
    
    const reviewCount = Math.min(reviews.length, 3);
    const trustBonus = reviewCount * 10;
    
    const user = await User.findById(reviewedUserId);
    let newTrustScore = (user.trustScore || 0) - (user.reviewTrustPoints || 0) + trustBonus;
    newTrustScore = Math.min(newTrustScore, 100);
    
    await User.findByIdAndUpdate(reviewedUserId, { 
      trustScore: newTrustScore,
      reviewTrustPoints: trustBonus
    });

    res.status(201).json(review);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/user/:userId', async (req, res) => {
  try {
    const reviews = await Review.find({ reviewedUser: req.params.userId })
      .populate('reviewer', 'name profilePhoto')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;