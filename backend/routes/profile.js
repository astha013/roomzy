const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');
const { generateAISummary } = require('../utils/aiSummary');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(new Error('Only image files are allowed (jpeg, jpg, png, webp)'));
};

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter
});

router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/photo', protect, upload.single('profilePhoto'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const user = await User.findById(req.user._id);
    user.profilePhoto = req.file.path;
    user.updatedAt = new Date();
    await user.save();

    res.json({ profilePhoto: user.profilePhoto });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { name, phone, city, area, bio, dateOfBirth, gender, intent } = req.body;
    
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (city) user.city = city;
    if (area !== undefined) user.area = area;
    if (bio !== undefined) user.bio = bio;
    if (dateOfBirth) user.dateOfBirth = dateOfBirth;
    if (gender) user.gender = gender;
    if (intent) user.intent = intent;
    user.updatedAt = new Date();

    await user.save();
    res.json({ 
      name: user.name, 
      phone: user.phone, 
      city: user.city,
      bio: user.bio,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      profilePhoto: user.profilePhoto
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/preferences', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { preferences, moveInDate, city, area, intent } = req.body;

    if (preferences) {
      user.preferences = { ...user.preferences.toObject(), ...preferences };
    }
    if (moveInDate) {
      user.preferences.moveInDate = moveInDate;
    }
    if (city) {
      user.city = city;
    }
    if (area !== undefined) {
      user.area = area;
    }
    if (intent) {
      user.intent = intent;
    }
    user.updatedAt = new Date();
    
    await user.save();

    if (user.preferences) {
      try {
        const aiSummary = await generateAISummary(user.preferences);
        user.aiSummary = aiSummary;
        await user.save();
      } catch (aiError) {
        console.error('AI summary generation failed:', aiError);
      }
    }

    res.json({
      preferences: user.preferences,
      moveInDate: user.preferences.moveInDate,
      city: user.city,
      intent: user.intent,
      area: user.area,
      aiSummary: user.aiSummary
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/weights', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.preferenceWeights = { ...user.preferenceWeights.toObject(), ...req.body };
    user.updatedAt = new Date();
    
    await user.save();
    res.json(user.preferenceWeights);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -email');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;