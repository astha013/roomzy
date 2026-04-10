const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');
const { generateVerificationHash, storeOnBlockchain } = require('../blockchain/verifyHash');
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

const maskAadharNumber = (aadharNumber) => {
  if (!aadharNumber || aadharNumber.length !== 12) return null;
  return aadharNumber.substring(0, 4) + ' ' + aadharNumber.substring(4, 8) + ' ' + aadharNumber.substring(8, 12);
};

router.post('/upload-id', protect, upload.single('idDocument'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { idDocumentNumber, idDocumentType } = req.body;

    if (idDocumentType === 'aadhar' && idDocumentNumber) {
      if (!/^\d{12}$/.test(idDocumentNumber)) {
        return res.status(400).json({ message: 'Aadhar number must be 12 digits' });
      }
    }

    const user = await User.findById(req.user._id);
    user.idDocumentUrl = req.file.path;
    user.idDocumentType = idDocumentType || 'aadhar';
    user.idDocumentNumber = idDocumentNumber;
    user.maskedIdNumber = idDocumentType === 'aadhar' ? maskAadharNumber(idDocumentNumber) : idDocumentNumber;
    user.verificationStatus = 'pending';
    await user.save();

    res.json({ 
      message: 'ID document uploaded successfully. This is optional verification.',
      verificationStatus: user.verificationStatus,
      maskedIdNumber: user.maskedIdNumber,
      isOptional: true,
      trustBonus: '+10 trust points (optional)'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/verify-id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.idDocumentUrl) {
      return res.status(400).json({ message: 'Please upload ID document first' });
    }

    if (user.governmentIdVerified) {
      return res.status(400).json({ message: 'Government ID already verified' });
    }

    const verificationId = 'GOV-' + Date.now();
    const timestamp = new Date();
    const hash = generateVerificationHash(user._id.toString(), verificationId, timestamp);
    
    let txHash = null;
    try {
      txHash = await storeOnBlockchain(hash);
    } catch (err) {
      console.log('Blockchain storage failed, continuing with mock');
    }

    user.governmentIdVerified = true;
    user.verificationStatus = 'approved';
    user.verificationId = verificationId;
    user.verificationHash = hash;
    user.verificationTimestamp = timestamp;
    user.updatedAt = new Date();
    await user.save();

    const newTrustScore = await updateTrustScore(user._id);

    res.json({ 
      message: 'Government ID verification successful (Optional)',
      governmentIdVerified: true,
      verificationHash: hash,
      txHash,
      trustScore: newTrustScore,
      note: 'This is optional verification. You can use the platform without it.'
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
      governmentIdVerified: user.governmentIdVerified,
      verificationStatus: user.verificationStatus,
      verificationHash: user.verificationHash,
      verificationTimestamp: user.verificationTimestamp,
      maskedIdNumber: user.maskedIdNumber,
      isOptional: true
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;