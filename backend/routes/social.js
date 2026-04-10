const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');
const { updateTrustScore } = require('../utils/trustScore');

router.post('/save', protect, async (req, res) => {
  try {
    const { linkedin, instagram, collegeEmail, companyEmail } = req.body;
    
    const user = await User.findById(req.user._id);
    
    if (linkedin !== undefined) user.socialLinks.linkedin = linkedin || '';
    if (instagram !== undefined) user.socialLinks.instagram = instagram || '';
    if (collegeEmail !== undefined) user.socialLinks.collegeEmail = collegeEmail || '';
    if (companyEmail !== undefined) user.socialLinks.companyEmail = companyEmail || '';
    
    user.updatedAt = new Date();
    await user.save();

    res.json({ 
      message: 'Social links saved successfully',
      socialLinks: user.socialLinks,
      note: 'Verification pending. Links will be manually reviewed.'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/verify-manual', protect, async (req, res) => {
  try {
    const { platform, verified } = req.body;
    
    const validPlatforms = ['linkedin', 'instagram', 'collegeEmail', 'companyEmail'];
    if (!validPlatforms.includes(platform)) {
      return res.status(400).json({ message: 'Invalid platform' });
    }

    const user = await User.findById(req.user._id);
    
    const verifiedField = `${platform}Verified`;
    user.socialLinks[verifiedField] = verified;
    user.updatedAt = new Date();
    await user.save();

    const newTrustScore = await updateTrustScore(user._id);

    res.json({ 
      message: `${platform} ${verified ? 'verified' : 'unverified'} successfully`,
      [platform]: { verified: verified },
      trustScore: newTrustScore
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/my-links', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      socialLinks: user.socialLinks,
      trustContribution: {
        linkedin: user.socialLinks.linkedinVerified ? 2.5 : 0,
        instagram: user.socialLinks.instagramVerified ? 2.5 : 0,
        collegeEmail: user.socialLinks.collegeEmailVerified ? 2.5 : 2.5,
        companyEmail: user.socialLinks.companyEmailVerified ? 2.5 : 0
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;