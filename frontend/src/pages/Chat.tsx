import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_WS_URL || 'http://localhost:5000');

function Chat() {
  const { userId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user._id) {
      socket.emit('join', user._id);
    }

    socket.on('newMessage', (data) => {
      if (userId && data.chatId) {
        setMessages(prev => [...prev, data.message]);
      }
    });

    return () => {
      socket.off('newMessage');
    };
  }, [userId]);

  const handleSend = () => {
    if (!newMessage.trim()) return;
    
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    socket.emit('sendMessage', {
      senderId: user._id,
      receiverId: userId,
      content: newMessage
    });
    setNewMessage('');
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '20px' }}>Chat</h1>
      
      {userId ? (
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px' }}>
          <div style={{ height: '400px', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '15px', overflowY: 'auto', marginBottom: '15px' }}>
            {messages.length > 0 ? (
              messages.map((msg, idx) => (
                <div key={idx} style={{ padding: '10px', marginBottom: '10px', background: '#f3f4f6', borderRadius: '8px' }}>
                  {msg.content}
                </div>
              ))
            ) : (
              <p style={{ textAlign: 'center', color: '#6b7280' }}>No messages yet</p>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <input 
              type="text" 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type a message..."
              style={{ flex: 1, padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px' }}
            />
            <button onClick={handleSend} style={{ padding: '12px 20px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Send</button>
          </div>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
          <p style={{ color: '#6b7280' }}>Select a conversation to start chatting</p>
        </div>
      )}
    </div>
  );
}

export default Chat;