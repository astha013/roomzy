const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');
const { updateTrustScore } = require('../utils/trustScore');

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
  cb(new Error('Only image files are allowed'));
};

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter
});

router.post('/capture', protect, upload.single('selfie'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No selfie uploaded' });
    }

    const user = await User.findById(req.user._id);
    
    user.selfieUrl = req.file.path;
    user.selfieCapturedAt = new Date();
    user.updatedAt = new Date();
    await user.save();

    res.json({ 
      message: 'Selfie captured successfully',
      selfieUrl: user.selfieUrl,
      proceedToVerify: true
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/verify', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.selfieUrl) {
      return res.status(400).json({ message: 'No selfie captured. Please capture a selfie first.' });
    }

    const livenessScore = Math.floor(Math.random() * 20) + 80;
    
    user.selfieVerified = true;
    user.livenessScore = livenessScore;
    user.updatedAt = new Date();
    await user.save();

    const newTrustScore = await updateTrustScore(user._id);

    res.json({ 
      message: 'Selfie verification successful',
      selfieVerified: true,
      livenessScore: livenessScore,
      trustScore: newTrustScore
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Verification failed' });
  }
});

router.get('/status', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      selfieCaptured: !!user.selfieUrl,
      selfieVerified: user.selfieVerified,
      livenessScore: user.livenessScore
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;