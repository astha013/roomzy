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

    const isParticipant = chat.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );
    if (!isParticipant) {
      return res.status(403).json({ message: 'Not a participant in this chat' });
    }

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

// DELETE /api/chat/:chatId — delete entire conversation (only for requesting user)
router.delete('/:chatId', protect, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    const isParticipant = chat.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );
    if (!isParticipant) return res.status(403).json({ message: 'Not a participant' });

    await Chat.findByIdAndDelete(req.params.chatId);
    res.json({ message: 'Chat deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/chat/:chatId/messages/:messageId — unsend a message (sender only)
router.delete('/:chatId/messages/:messageId', protect, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    const isParticipant = chat.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );
    if (!isParticipant) return res.status(403).json({ message: 'Not a participant' });

    const msg = chat.messages.id(req.params.messageId);
    if (!msg) return res.status(404).json({ message: 'Message not found' });

    if (msg.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only unsend your own messages' });
    }

    // Replace content with unsent marker instead of deleting, so other user sees it
    msg.content = 'This message was unsent';
    msg.unsent = true;
    await chat.save();

    res.json({ message: 'Message unsent', messageId: req.params.messageId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});


// POST /api/chat/start — open or reuse a direct chat (used for room inquiries)
// Does NOT require a mutual match — allows contacting room owners directly.
router.post('/start', protect, async (req, res) => {
  try {
    const { recipientId } = req.body;
    if (!recipientId) return res.status(400).json({ message: 'recipientId required' });

    const senderId = req.user._id;
    if (senderId.toString() === recipientId.toString()) {
      return res.status(400).json({ message: 'Cannot start a chat with yourself' });
    }

    // Reuse existing chat if one already exists
    let chat = await Chat.findOne({ participants: { $all: [senderId, recipientId] } })
      .populate('participants', 'name profilePhoto city trustScore intent');

    if (!chat) {
      chat = await Chat.create({ participants: [senderId, recipientId], messages: [] });
      chat = await Chat.findById(chat._id)
        .populate('participants', 'name profilePhoto city trustScore intent');
    }

    res.json(chat);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;