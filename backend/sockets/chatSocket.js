const Chat = require('../models/Chat');
const User = require('../models/User');

function setupChatSocket(io) {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join', async (userId) => {
      socket.userId = userId;
      socket.join(`user_${userId}`);
      
      const user = await User.findById(userId);
      if (user?.blockedUsers) {
        user.blockedUsers.forEach(blockedId => {
          socket.join(`blocked_${blockedId}`);
        });
      }
    });

    socket.on('sendMessage', async ({ senderId, receiverId, content }) => {
      try {
        const sender = await User.findById(senderId);
        
        const trustScore = sender?.trustScore || 0;
        if (trustScore < 30) {
          socket.emit('error', { message: 'Trust score of 30+ required to chat. Verify phone or add social links.', trustScore });
          return;
        }

        if (sender?.blockedUsers?.includes(receiverId)) {
          socket.emit('error', { message: 'You have blocked this user' });
          return;
        }

        let chat = await Chat.findOne({
          participants: { $all: [senderId, receiverId] }
        });

        if (!chat) {
          chat = await Chat.create({
            participants: [senderId, receiverId],
            messages: []
          });
        }

        const message = {
          sender: senderId,
          content,
          createdAt: new Date()
        };

        chat.messages.push(message);
        chat.lastMessage = content;
        chat.lastMessageAt = new Date();

        if (chat.participants[0].toString() === senderId) {
          chat.userBUnread += 1;
        } else {
          chat.userAUnread += 1;
        }

        await chat.save();

        io.to(`user_${receiverId}`).emit('newMessage', {
          chatId: chat._id,
          message
        });

        socket.emit('messageSent', { chatId: chat._id, message });
      } catch (error) {
        console.error('Message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('markRead', async ({ chatId, userId }) => {
      try {
        const chat = await Chat.findById(chatId);
        if (!chat) return;

        if (chat.participants[0].toString() === userId) {
          chat.userAUnread = 0;
        } else {
          chat.userBUnread = 0;
        }
        await chat.save();

        io.to(`user_${userId}`).emit('messagesRead', { chatId });
      } catch (error) {
        console.error('Mark read error:', error);
      }
    });

    socket.on('typing', ({ senderId, receiverId }) => {
      io.to(`user_${receiverId}`).emit('userTyping', { senderId });
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