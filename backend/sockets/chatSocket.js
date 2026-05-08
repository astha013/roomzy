const Chat = require('../models/Chat');
const User = require('../models/User');
const Match = require('../models/Match');
const { analyzeMessage } = require('../utils/fraudDetection');

function setupChatSocket(io) {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join', async (userId) => {
      socket.userId = userId;
      socket.join(`user_${userId}`);
    });

    socket.on('sendMessage', async ({ senderId, receiverId, content }) => {
      try {
        const sender = await User.findById(senderId);

        const trustScore = sender?.trustScore || 0;
        if (trustScore < 30) {
          socket.emit('error', { message: 'Trust score of 30+ required to chat. Verify phone or add social links.', trustScore });
          return;
        }

        // Block checks
        const senderBlockedReceiver = sender?.blockedUsers?.some(id => id.toString() === receiverId.toString());
        if (senderBlockedReceiver) { socket.emit('error', { message: 'You have blocked this user' }); return; }

        const receiver = await User.findById(receiverId);
        if (!receiver) { socket.emit('error', { message: 'Recipient not found' }); return; }

        const receiverBlockedSender = receiver?.blockedUsers?.some(id => id.toString() === senderId.toString());
        if (receiverBlockedSender) { socket.emit('error', { message: 'You cannot message this user' }); return; }

        // Allow messaging if: (a) mutual roommate match exists, OR
        // (b) a direct chat already exists between them (e.g. room inquiry)
        const matchExists = await Match.findOne({
          $or: [{ userA: senderId, userB: receiverId }, { userA: receiverId, userB: senderId }],
          status: 'matched',
        });
        const directChatExists = await Chat.findOne({
          participants: { $all: [senderId, receiverId] },
        });
        if (!matchExists && !directChatExists) {
          socket.emit('error', { message: 'Start a conversation from the room listing first' });
          return;
        }

        // ── FEATURE 6: Sentiment analysis & spam filtering ─────────────────
        const analysis = analyzeMessage(content);
        if (analysis.isSpam) {
          socket.emit('messageBlocked', {
            reason: 'spam_detected',
            details: 'Your message was flagged as spam and could not be delivered.',
            score: analysis.score
          });
          return;
        }

        // Warn sender if toxic (don't block, just flag)
        let contentWarning = null;
        if (analysis.isToxic) {
          contentWarning = { type: 'toxic_language', message: 'Your message contains potentially toxic language.' };
        }

        let chat = await Chat.findOne({ participants: { $all: [senderId, receiverId] } });
        if (!chat) {
          chat = await Chat.create({ participants: [senderId, receiverId], messages: [] });
        }

        const message = {
          sender: senderId,
          content,
          createdAt: new Date(),
          // Store sentiment metadata
          sentimentScore: analysis.score,
          flagged: analysis.isToxic,
        };

        chat.messages.push(message);
        chat.lastMessage = content;
        chat.lastMessageAt = new Date();

        if (chat.participants[0].toString() === senderId.toString()) chat.userBUnread += 1;
        else chat.userAUnread += 1;

        await chat.save();

        const savedMessage = chat.messages[chat.messages.length - 1];

        io.to(`user_${receiverId}`).emit('newMessage', { chatId: chat._id, message: savedMessage });
        socket.emit('messageSent', { chatId: chat._id, message: savedMessage, warning: contentWarning });

      } catch (error) {
        console.error('Message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('markRead', async ({ chatId, userId }) => {
      try {
        const chat = await Chat.findById(chatId);
        if (!chat) return;
        if (chat.participants[0].toString() === userId.toString()) chat.userAUnread = 0;
        else chat.userBUnread = 0;
        await chat.save();
        io.to(`user_${userId}`).emit('messagesRead', { chatId });
      } catch (error) {
        console.error('Mark read error:', error);
      }
    });

    socket.on('typing', ({ senderId, receiverId }) => {
      io.to(`user_${receiverId}`).emit('userTyping', { senderId });
    });

    // ── FEATURE 4: Voice/Video call signaling ──────────────────────────────
    socket.on('callRequest', ({ from, to, type }) => {
      io.to(`user_${to}`).emit('incomingCall', { from, type, signal: null });
    });

    socket.on('callSignal', ({ to, signal }) => {
      io.to(`user_${to}`).emit('callSignal', { from: socket.userId, signal });
    });

    socket.on('callAccepted', ({ to, signal }) => {
      io.to(`user_${to}`).emit('callAccepted', { signal });
    });

    socket.on('callRejected', ({ to }) => {
      io.to(`user_${to}`).emit('callRejected', {});
    });

    socket.on('callEnded', ({ to }) => {
      io.to(`user_${to}`).emit('callEnded', {});
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
}

async function getChats(userId) {
  const chats = await Chat.find({ participants: userId })
    .populate('participants', 'name profilePhoto')
    .sort({ lastMessageAt: -1 });
  return chats;
}

module.exports = { setupChatSocket, getChats };