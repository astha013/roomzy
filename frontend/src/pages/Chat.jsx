import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { chatApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import { useToast } from '../context/ToastContext';
import { Avatar, Spinner } from '../components/UI';
import Footer from '../components/Footer';

export default function Chat() {
  const { user, canChat, trustScore } = useAuth();
  const { sendMessage, markRead, sendTyping, on, off } = useSocket();
  const toast = useToast();
  const location = useLocation();

  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [search, setSearch] = useState('');
  const bottomRef = useRef(null);
  const typingTimer = useRef(null);

  // Load chat list
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await chatApi.list();
        setChats(data);
        // Auto-select if navigated with a userId
        if (location.state?.userId) {
          const existing = data.find(c => c.participants.some(p => (p._id || p) === location.state.userId));
          if (existing) selectChat(existing);
        }
      } catch { /* handled gracefully — empty state shown */ }
      finally { setLoading(false); }
    };
    load();
  }, []);

  // Socket listeners
  useEffect(() => {
    const handleNew = ({ chatId, message }) => {
      setMessages(prev => {
        if (activeChat?._id !== chatId) return prev;
        return [...prev, message];
      });
      // Update chat list preview
      setChats(prev => prev.map(c =>
        c._id === chatId ? { ...c, lastMessage: message.content, lastMessageAt: message.createdAt } : c
      ));
    };

    const handleTyping = ({ senderId }) => {
      if (senderId !== user?._id) {
        setTyping(true);
        clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => setTyping(false), 2000);
      }
    };

    const unsub1 = on('newMessage', handleNew);
    const unsub2 = on('userTyping', handleTyping);
    const unsub3 = on('error', ({ message }) => toast(message, 'error'));

    return () => { unsub1?.(); unsub2?.(); unsub3?.(); };
  }, [on, activeChat, user, toast]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const selectChat = useCallback(async (chat) => {
    setActiveChat(chat);
    setMessages([]);
    try {
      const { data } = await chatApi.messages(chat._id);
      setMessages(data);
      if (user) markRead({ chatId: chat._id, userId: user._id });
    } catch { setMessages(chat.messages || []); }
  }, [user, markRead]);

  const handleSend = async () => {
    if (!input.trim() || !activeChat || sending) return;
    if (!canChat) {
      toast(`Trust score 30+ required. You have ${trustScore}.`, 'warning');
      return;
    }
    const receiver = activeChat.participants.find(p => (p._id || p) !== user._id);
    const receiverId = receiver?._id || receiver;
    if (!receiverId) return;

    setSending(true);
    const content = input.trim();
    setInput('');

    // Optimistic update
    const tempMsg = { _id: Date.now(), sender: user._id, content, createdAt: new Date().toISOString(), pending: true };
    setMessages(prev => [...prev, tempMsg]);

    sendMessage({ senderId: user._id, receiverId, content });
    setSending(false);
  };

  const handleTypingInput = (e) => {
    setInput(e.target.value);
    if (activeChat && user) {
      const receiver = activeChat.participants.find(p => (p._id || p) !== user._id);
      if (receiver) sendTyping({ senderId: user._id, receiverId: receiver._id || receiver });
    }
  };

  const filtered = chats.filter(c => {
    const other = c.participants?.find(p => (p._id || p) !== user?._id);
    return other?.name?.toLowerCase().includes(search.toLowerCase());
  });

  const activeOther = activeChat?.participants?.find(p => (p._id || p) !== user?._id);

  return (
    <div className="page-pad" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'clamp(250px, 30vw, 300px) 1fr' }}>
      {/* Sidebar */}
      <div style={{ borderRight: '1px solid var(--parchment-3)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: 'clamp(1rem, 3vw, 1.25rem) clamp(0.75rem, 2vw, 1rem) clamp(0.5rem, 2vw, 0.75rem)', borderBottom: '1px solid var(--parchment-3)' }}>
          <h3 style={{ fontFamily: 'var(--font-body)', fontWeight: 800, fontSize: 'clamp(0.9rem, 2vw, 1rem)', marginBottom: '0.75rem' }}>Messages</h3>
          <input
            className="form-input"
            style={{ borderRadius: 100, fontSize: 'clamp(0.75rem, 1.5vw, 0.82rem)', padding: '0.5rem 0.875rem' }}
            placeholder="Search conversations…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}><Spinner dark /></div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--clay-3)', fontSize: 'clamp(0.75rem, 1.5vw, 0.82rem)' }}>
              {chats.length === 0 ? 'No conversations yet. Match with someone to start chatting!' : 'No results'}
            </div>
          ) : (
            filtered.map(chat => {
              const other = chat.participants?.find(p => (p._id || p) !== user?._id);
              const isActive = activeChat?._id === chat._id;
              return (
                <div
                  key={chat._id}
                  onClick={() => selectChat(chat)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem',
                    borderRadius: 'var(--r-md)', cursor: 'pointer', transition: 'background 0.15s',
                    background: isActive ? 'var(--parchment-2)' : 'transparent',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--parchment-2)'; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                >
                  <Avatar name={other?.name || '?'} src={other?.profilePhoto} size="md" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 'clamp(0.8rem, 1.5vw, 0.875rem)', marginBottom: '0.15rem' }}>{other?.name || 'Unknown'}</div>
                    <div style={{ fontSize: 'clamp(0.7rem, 1.2vw, 0.75rem)', color: 'var(--clay-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {chat.lastMessage || 'Start a conversation'}
                    </div>
                  </div>
                  {(chat.userAUnread > 0 || chat.userBUnread > 0) && (
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--terra)', flexShrink: 0 }} />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main chat area */}
      {activeChat ? (
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Chat header */}
          <div style={{ padding: 'clamp(0.75rem, 2vw, 1rem) clamp(1rem, 3vw, 1.5rem)', borderBottom: '1px solid var(--parchment-3)', background: 'white', display: 'flex', alignItems: 'center', gap: 'clamp(0.75rem, 2vw, 1rem)', flexWrap: 'wrap' }}>
            <Avatar name={activeOther?.name || '?'} src={activeOther?.profilePhoto} size="md" />
            <div style={{ flex: 1, minWidth: '150px' }}>
              <h3 style={{ fontFamily: 'var(--font-body)', fontWeight: 800, fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>{activeOther?.name}</h3>
              <p style={{ fontSize: 'clamp(0.7rem, 1.2vw, 0.75rem)', color: 'var(--clay-3)' }}>
                {activeOther?.city} · Trust {activeOther?.trustScore ?? '—'}
              </p>
            </div>
            <div>
              <span style={{ background: 'var(--forest-light)', color: 'var(--forest-text)', fontSize: 'clamp(0.65rem, 1.2vw, 0.75rem)', fontWeight: 700, padding: '4px 12px', borderRadius: 100 }}>
                {activeChat.compatibilityScore ? `${activeChat.compatibilityScore}% compatible` : '❤️ Matched'}
              </span>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 'clamp(1rem, 3vw, 1.5rem)', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'var(--parchment)' }}>
            {messages.map((msg, i) => {
              const isMe = (msg.sender?._id || msg.sender) === user?._id;
              return (
                <div key={msg._id || i} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: '0.5rem' }}>
                  {!isMe && <Avatar name={activeOther?.name || ''} size="sm" />}
                  <div style={{ maxWidth: '65%' }}>
                    <div style={{
                      padding: '0.75rem 1rem', borderRadius: isMe ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                      background: isMe ? 'var(--clay)' : 'white',
                      color: isMe ? 'var(--parchment)' : 'var(--clay)',
                      fontSize: '0.875rem', lineHeight: 1.5,
                      border: isMe ? 'none' : '1px solid var(--parchment-3)',
                      opacity: msg.pending ? 0.6 : 1,
                    }}>
                      {msg.content}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--clay-3)', marginTop: 4, textAlign: isMe ? 'right' : 'left' }}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {msg.pending && ' · sending…'}
                    </div>
                  </div>
                </div>
              );
            })}
            {typing && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Avatar name={activeOther?.name || ''} size="sm" />
                <div style={{ padding: '0.6rem 1rem', background: 'white', borderRadius: '4px 16px 16px 16px', border: '1px solid var(--parchment-3)' }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--clay-3)', animation: `pulse 1.2s ${i*0.2}s infinite` }} />)}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input bar */}
          {!canChat ? (
            <div style={{ padding: 'clamp(0.75rem, 2vw, 1rem) clamp(1rem, 3vw, 1.5rem)', background: 'white', borderTop: '1px solid var(--parchment-3)', textAlign: 'center', color: 'var(--clay-3)', fontSize: 'clamp(0.75rem, 1.5vw, 0.85rem)' }}>
              🔒 You need 30+ trust points to send messages. Current: {trustScore}
            </div>
          ) : (
            <div style={{ padding: 'clamp(0.625rem, 2vw, 0.875rem) clamp(1rem, 3vw, 1.5rem)', background: 'white', borderTop: '1px solid var(--parchment-3)', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                className="form-input"
                style={{ borderRadius: 100, padding: '0.625rem 1.25rem', flex: 1, minWidth: '150px' }}
                placeholder="Type a message…"
                value={input}
                onChange={handleTypingInput}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              />
              <button
                className="btn btn-icon"
                style={{ background: input.trim() ? 'var(--terra)' : 'var(--parchment-3)', color: input.trim() ? 'white' : 'var(--clay-3)', border: 'none', transition: 'all 0.2s', flexShrink: 0 }}
                onClick={handleSend}
                disabled={sending || !input.trim()}
              >
                {sending ? <Spinner size={14} /> : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                )}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--clay-3)', flexDirection: 'column', gap: '1rem', padding: '2rem', textAlign: 'center' }}>
          <div style={{ fontSize: 'clamp(2.5rem, 8vw, 3rem)' }}>💬</div>
          <p style={{ fontWeight: 600, fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>Select a conversation to start chatting</p>
          <p style={{ fontSize: 'clamp(0.8rem, 1.5vw, 0.85rem)' }}>Mutual matches appear here</p>
        </div>
      )}
      </div>
      <Footer />
    </div>
  );
}
