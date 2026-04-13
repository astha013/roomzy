const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const { protect } = require('../middleware/authMiddleware');

// GET /api/chat/list — all conversations for current user
router.get('/list', protect, async (req, res) => {
  try {
    const chats = await Chat.find({ participants: req.user._id })
      .populate('participants', 'name profilePhoto city trustScore intent')
      .sort({ lastMessageAt: -1 });
    res.json(chats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/chat/:chatId/messages — messages for a specific chat
router.get('/:chatId/messages', protect, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId)
      .populate('messages.sender', 'name profilePhoto');

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Verify user is a participant
    const isParticipant = chat.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );
    if (!isParticipant) {
      return res.status(403).json({ message: 'Not a participant in this chat' });
    }

    // Mark messages as read
    if (chat.participants[0].toString() === req.user._id.toString()) {
      chat.userAUnread = 0;
    } else {
      chat.userBUnread = 0;
    }
    await chat.save();

    res.json(chat.messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
