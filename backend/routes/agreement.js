const express = require('express');
const router = express.Router();
const Match = require('../models/Match');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');
const { generateAgreementPDF } = require('../utils/pdfGenerator');

router.post('/create', protect, async (req, res) => {
  try {
    const { matchId, rent, rentSplit, rules, moveInDate } = req.body;

    const match = await Match.findById(matchId);
    if (!match || match.status !== 'matched') {
      return res.status(400).json({ message: 'Match not found or not confirmed' });
    }

    // FIX: ensure requesting user is a participant in this match
    const isParticipant =
      match.userA.toString() === req.user._id.toString() ||
      match.userB.toString() === req.user._id.toString();
    if (!isParticipant) {
      return res.status(403).json({ message: 'Not authorized for this match' });
    }

    const userA = await User.findById(match.userA);
    const userB = await User.findById(match.userB);

    // FIX: handle case where a user account was deleted
    if (!userA || !userB) {
      return res.status(404).json({ message: 'One or both users not found' });
    }

    const agreement = {
      matchId: match._id,
      userA: { name: userA.name, email: userA.email },
      userB: { name: userB.name, email: userB.email },
      rent,
      rentSplit,
      rules,
      moveInDate,
      createdAt: new Date()
    };

    match.agreement = agreement;
    await match.save();

    res.json({ message: 'Agreement created', agreement });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/download/:matchId', protect, async (req, res) => {
  try {
    const match = await Match.findById(req.params.matchId);
    if (!match || !match.agreement) {
      return res.status(404).json({ message: 'Agreement not found' });
    }

    const pdfBuffer = await generateAgreementPDF(match.agreement);

    res.set('Content-Type', 'application/pdf');
    res.set('Content-Disposition', 'attachment; filename=roomzy-agreement.pdf');
    res.send(pdfBuffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;