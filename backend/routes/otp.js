const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');
const { updateTrustScore } = require('../utils/trustScore');

router.post('/send', protect, async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    if (!/^[6-9]\d{9}$/.test(phoneNumber)) {
      return res.status(400).json({ message: 'Invalid Indian phone number format' });
    }

    const user = await User.findById(req.user._id);
    
    const existingUserWithPhone = await User.findOne({ phoneNumber, _id: { $ne: user._id } });
    if (existingUserWithPhone) {
      return res.status(400).json({ message: 'Phone number already registered with another user' });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const phoneVerificationExpires = Date.now() + 10 * 60 * 1000;

    user.phoneNumber = phoneNumber;
    user.phoneVerificationCode = otp;
    user.phoneVerificationExpires = phoneVerificationExpires;
    await user.save();

    console.log(`OTP for ${phoneNumber}: ${otp}`);
    
    res.json({ 
      message: 'OTP sent successfully',
      expiresIn: '10 minutes',
      note: 'In production, OTP would be sent via SMS gateway'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/verify', protect, async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;

    if (!phoneNumber || !otp) {
      return res.status(400).json({ message: 'Phone number and OTP are required' });
    }

    const user = await User.findById(req.user._id);

    if (user.phoneNumber !== phoneNumber) {
      return res.status(400).json({ message: 'Phone number mismatch' });
    }

    if (!user.phoneVerificationCode || !user.phoneVerificationExpires) {
      return res.status(400).json({ message: 'No OTP sent. Please request OTP first.' });
    }

    if (Date.now() > user.phoneVerificationExpires) {
      return res.status(400).json({ message: 'OTP expired. Please request a new OTP.' });
    }

    if (user.phoneVerificationCode !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    user.phoneVerified = true;
    user.phoneVerificationCode = undefined;
    user.phoneVerificationExpires = undefined;
    user.updatedAt = new Date();
    await user.save();

    const newTrustScore = await updateTrustScore(user._id);

    res.json({ 
      message: 'Phone verified successfully',
      phoneVerified: true,
      trustScore: newTrustScore
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/status', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      phoneNumber: user.phoneNumber,
      phoneVerified: user.phoneVerified
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;