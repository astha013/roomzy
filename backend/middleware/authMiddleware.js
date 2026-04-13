const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
      }
      
      if (req.user.isBlocked) {
        return res.status(403).json({ message: 'Account blocked' });
      }
      
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const verifiedOnly = (req, res, next) => {
  if (!req.user.isVerified && !req.user.governmentIdVerified) {
    return res.status(403).json({ message: 'Government ID verification required' });
  }
  next();
};

const trustScoreRequired = (minScore = 30) => {
  return (req, res, next) => {
    const trustScore = req.user?.trustScore || 0;
    
    if (trustScore < minScore) {
      return res.status(403).json({ 
        message: `Minimum trust score of ${minScore} required`,
        currentScore: trustScore,
        howToIncrease: 'Verify your phone, add social links, or get roommate reviews'
      });
    }
    next();
  };
};

const adminOnly = (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

module.exports = { protect, verifiedOnly, trustScoreRequired, adminOnly, generateToken };