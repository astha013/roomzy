import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { chatApi, reportApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import { useToast } from '../context/ToastContext';
import { Avatar, Spinner } from '../components/UI';
import Footer from '../components/Footer';
import VoiceVideoCall, { CallButtons } from '../components/VoiceVideoCall';
import UserProfileDrawer from '../components/UserProfileDrawer';

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
function formatDate(ts) {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}
function groupByDate(messages) {
  const groups = [];
  let lastDate = null;
  messages.forEach((msg) => {
    const label = formatDate(msg.createdAt);
    if (label !== lastDate) { groups.push({ type: 'divider', label }); lastDate = label; }
    groups.push({ type: 'message', msg });
  });
  return groups;
}

function ContextMenu({ x, y, items, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);
  return (
    <div ref={ref} style={{ position: 'fixed', top: y, left: x, zIndex: 9999, background: 'white', borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.16)', border: '1px solid var(--parchment-3)', minWidth: 165, overflow: 'hidden' }}>
      {items.map((item, i) => (
        <button key={i} onClick={() => { item.action(); onClose(); }}
          style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '0.625rem 1rem', textAlign: 'left', fontSize: '0.82rem', fontFamily: 'var(--font-body)', color: item.danger ? 'var(--danger)' : 'var(--clay)', fontWeight: 600 }}
          onMouseEnter={e => { e.currentTarget.style.background = item.danger ? '#FEF0EF' : 'var(--parchment-2)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}>
          <span style={{ fontSize: '1rem' }}>{item.icon}</span>{item.label}
        </button>
      ))}
    </div>
  );
}

function ConfirmDialog({ icon, title, body, confirmLabel, confirmDanger, onConfirm, onCancel }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
      <div style={{ background: 'white', borderRadius: 16, padding: '2rem', maxWidth: 380, width: '90%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>{icon}</div>
        <h3 style={{ fontFamily: 'var(--font-body)', fontWeight: 800, marginBottom: '0.5rem' }}>{title}</h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--clay-3)', marginBottom: '1.5rem', lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: body }} />
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={onCancel}>Cancel</button>
          <button className="btn btn-sm" style={{ flex: 1, background: confirmDanger ? 'var(--danger)' : 'var(--terra)', color: 'white', border: 'none' }} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

export default function Chat() {
  const { user, canChat, trustScore } = useAuth();
  const { sendMessage, markRead, sendTyping, on, socket, emitRaw } = useSocket();
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
  const [msgMenu, setMsgMenu] = useState(null);
  const [chatMenu, setChatMenu] = useState(null);
  const [blockDialog, setBlockDialog] = useState(null);
  const [deleteChatDialog, setDeleteChatDialog] = useState(null);
  const [callActive, setCallActive] = useState(false); // track if a call window is open
  const [showProfile, setShowProfile] = useState(false); // show other user's profile drawer

  const bottomRef = useRef(null);
  const typingTimer = useRef(null);

  const selectChat = useCallback(async (chat) => {
    setActiveChat(chat);
    setMessages([]);
    try {
      const { data } = await chatApi.messages(chat._id);
      setMessages(data);
      if (user) markRead({ chatId: chat._id, userId: user._id });
    } catch { setMessages(chat.messages || []); }
  }, [user, markRead]);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: chatList } = await chatApi.list();
        setChats(chatList);

        if (location.state?.userId) {
          const targetId = location.state.userId;

          // Always call /start — it returns the existing chat if one already exists,
          // or creates a new one. This is the single source of truth.
          try {
            const { data: targetChat } = await chatApi.start(targetId);

            // Deduplicate: replace the existing entry if it's already in the list,
            // otherwise prepend. Prevents the same chat appearing twice.
            setChats(prev => {
              const without = prev.filter(c => c._id !== targetChat._id);
              return [targetChat, ...without];
            });

            selectChat(targetChat);
          } catch (err) {
            console.warn('Could not start chat:', err?.response?.data?.message || err.message);
            toast(err?.response?.data?.message || 'Could not open chat', 'error');
          }
        }
      } catch (err) {
        console.warn('Chat load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state?.userId]);

  useEffect(() => {
    const handleNew = ({ chatId, message }) => {
      setMessages(prev => activeChat?._id !== chatId ? prev : [...prev, message]);
      setChats(prev => prev.map(c => c._id === chatId ? { ...c, lastMessage: message.content, lastMessageAt: message.createdAt } : c));
    };
    const handleMessageSent = ({ chatId, message }) => {
      setMessages(prev => [...prev.filter(m => !m.pending), message]);
      setChats(prev => prev.map(c => c._id === chatId
        ? { ...c, lastMessage: message.content, lastMessageAt: message.createdAt }
        : c
      ));
    };
    const handleTyping = ({ senderId }) => {
      if (senderId !== user?._id) {
        setTyping(true);
        clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => setTyping(false), 2000);
      }
    };
    const handleMessageUnsent = ({ chatId, messageId }) => {
      if (activeChat?._id === chatId) setMessages(prev => prev.map(m => m._id === messageId ? { ...m, content: 'This message was unsent', unsent: true } : m));
    };
    const u1 = on('newMessage', handleNew);
    const u2 = on('messageSent', handleMessageSent);
    const u3 = on('userTyping', handleTyping);
    const u4 = on('error', ({ message }) => toast(message, 'error'));
    const u5 = on('messageUnsent', handleMessageUnsent);
    return () => { u1?.(); u2?.(); u3?.(); u4?.(); u5?.(); };
  }, [on, activeChat, user, toast]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, typing]);

  const handleSend = async () => {
    if (!input.trim() || !activeChat || sending) return;
    if (!canChat) { toast(`Trust score 30+ required. You have ${trustScore}.`, 'warning'); return; }
    const receiver = activeChat.participants.find(p => (p._id || p) !== user._id);
    const receiverId = receiver?._id || receiver;
    if (!receiverId) return;
    setSending(true);
    const content = input.trim();
    setInput('');
    setMessages(prev => [...prev, { _id: Date.now(), sender: user._id, content, createdAt: new Date().toISOString(), pending: true }]);
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

  const handleMsgContextMenu = (e, msg) => {
    e.preventDefault();
    const isMe = (msg.sender?._id || msg.sender) === user?._id;
    setMsgMenu({ msgId: msg._id, x: e.clientX, y: e.clientY, isMe, msg });
  };

  const handleUnsend = async (msgId) => {
    try {
      await chatApi.unsendMessage(activeChat._id, msgId);
      setMessages(prev => prev.map(m => m._id === msgId ? { ...m, content: 'This message was unsent', unsent: true } : m));
      toast('Message unsent', 'success');
    } catch (err) { toast(err.response?.data?.message || 'Could not unsend', 'error'); }
  };

  const handleDeleteChat = async (chatId) => {
    try {
      await chatApi.deleteChat(chatId);
      setChats(prev => prev.filter(c => c._id !== chatId));
      if (activeChat?._id === chatId) { setActiveChat(null); setMessages([]); }
      toast('Conversation deleted', 'success');
    } catch (err) { toast(err.response?.data?.message || 'Could not delete', 'error'); }
    setDeleteChatDialog(null);
  };

  const handleBlock = async (userId) => {
    try {
      await reportApi.block(userId);
      setChats(prev => prev.filter(c => !c.participants.some(p => (p._id || p) === userId)));
      if (activeChat?.participants?.some(p => (p._id || p) === userId)) { setActiveChat(null); setMessages([]); }
      toast('User blocked', 'success');
    } catch (err) { toast(err.response?.data?.message || 'Could not block', 'error'); }
    setBlockDialog(null);
  };

  const filtered = chats.filter(c => {
    const other = c.participants?.find(p => (p._id || p) !== user?._id);
    return other?.name?.toLowerCase().includes(search.toLowerCase());
  });
  const activeOther = activeChat?.participants?.find(p => (p._id || p) !== user?._id);

  return (
    <div className="page-pad" style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div className="chat-layout" style={{ flex: 1, display: 'grid', gridTemplateColumns: 'clamp(240px, 28vw, 300px) 1fr', overflow: 'hidden', minHeight: 0 }}>

        {/* Sidebar */}
        <div style={{ borderRight: '1px solid var(--parchment-3)', display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
          <div style={{ padding: '1rem 0.875rem 0.75rem', borderBottom: '1px solid var(--parchment-3)', flexShrink: 0 }}>
            <h3 style={{ fontFamily: 'var(--font-body)', fontWeight: 800, fontSize: '1rem', marginBottom: '0.75rem' }}>Messages</h3>
            <input className="form-input" style={{ borderRadius: 100, fontSize: '0.82rem', padding: '0.5rem 0.875rem' }} placeholder="Search conversations…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}><Spinner dark /></div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--clay-3)', fontSize: '0.82rem' }}>
                {chats.length === 0 ? 'No conversations yet. Match with someone to start chatting!' : 'No results'}
              </div>
            ) : filtered.map(chat => {
              const other = chat.participants?.find(p => (p._id || p) !== user?._id);
              const isActive = activeChat?._id === chat._id;
              return (
                <div key={chat._id} onClick={() => selectChat(chat)}
                  onContextMenu={(e) => { e.preventDefault(); setChatMenu({ chatId: chat._id, x: e.clientX, y: e.clientY, chat }); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0.75rem', borderRadius: 'var(--r-md)', cursor: 'pointer', transition: 'background 0.15s', background: isActive ? 'var(--parchment-2)' : 'transparent' }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--parchment-2)'; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}>
                  <Avatar name={other?.name || '?'} src={other?.profilePhoto} size="md" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.1rem' }}>{other?.name || 'Unknown'}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--clay-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{chat.lastMessage || 'Start a conversation'}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem', flexShrink: 0 }}>
                    {chat.lastMessageAt && <div style={{ fontSize: '0.62rem', color: 'var(--clay-3)' }}>{formatTime(chat.lastMessageAt)}</div>}
                    {/* FIX: show unread dot only for current user's unread messages */}
                    {(() => {
                      const myIdx = chat.participants?.findIndex(p => (p._id || p) === user?._id);
                      const myUnread = myIdx === 0 ? chat.userAUnread : chat.userBUnread;
                      return myUnread > 0 ? <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--terra)' }} /> : null;
                    })()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main */}
        {activeChat ? (
          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid var(--parchment-3)', background: 'white', display: 'flex', alignItems: 'center', gap: '0.875rem', flexShrink: 0 }}>
              <button onClick={() => setShowProfile(true)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.875rem', flex: 1, minWidth: 0, textAlign: 'left' }}>
                <Avatar name={activeOther?.name || '?'} src={activeOther?.profilePhoto} size="md" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontFamily: 'var(--font-body)', fontWeight: 800, fontSize: '1rem' }}>{activeOther?.name}</h3>
                  <p style={{ fontSize: '0.72rem', color: 'var(--clay-3)' }}>{activeOther?.city} · Trust {activeOther?.trustScore ?? '—'} · <span style={{ color: 'var(--terra)' }}>View profile →</span></p>
                </div>
              </button>
              <span style={{ background: 'var(--forest-light)', color: 'var(--forest-text)', fontSize: '0.72rem', fontWeight: 700, padding: '4px 12px', borderRadius: 100, flexShrink: 0 }}>
                {activeChat.compatibilityScore ? `${activeChat.compatibilityScore}% match` : '❤️ Matched'}
              </span>
              <CallButtons
                onVoiceCall={() => setCallActive('voice')}
                onVideoCall={() => setCallActive('video')}
                disabled={!canChat}
              />
              <button
                title="Chat options"
                onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); setChatMenu({ chatId: activeChat._id, x: r.left - 160, y: r.bottom + 6, chat: activeChat }); }}
                style={{ background: 'none', border: '1.5px solid var(--parchment-3)', cursor: 'pointer', padding: '4px 10px', borderRadius: 8, color: 'var(--clay-2)', fontSize: '1.1rem', lineHeight: 1, transition: 'all 0.15s', flexShrink: 0 }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--parchment-2)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
              >⋮</button>
            </div>

            {/* Messages area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: 0, background: 'var(--parchment)' }}>

              {/* Room listing context banner — shown when arriving from a room listing */}
              {location.state?.fromListing && location.state?.listingTitle && messages.length === 0 && (
                <div style={{ background: 'var(--terra-light)', border: '1.5px solid var(--terra)', borderRadius: 12, padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.82rem', color: 'var(--terra)', fontWeight: 600, display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '1rem', flexShrink: 0 }}>🏠</span>
                  <span>
                    Enquiring about: <strong>{location.state.listingTitle}</strong><br />
                    <span style={{ fontWeight: 400, color: 'var(--clay-3)' }}>Introduce yourself and ask about the room.</span>
                  </span>
                </div>
              )}

              {/* Empty chat hint */}
              {messages.length === 0 && !typing && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--clay-3)', textAlign: 'center', padding: '2rem', gap: '0.5rem' }}>
                  <div style={{ fontSize: '2.5rem' }}>👋</div>
                  <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>No messages yet</p>
                  <p style={{ fontSize: '0.8rem' }}>Say hello to {activeOther?.name?.split(' ')[0] || 'them'}!</p>
                </div>
              )}

              {groupByDate(messages).map((item, i) => {
                if (item.type === 'divider') {
                  return (
                    <div key={`d-${i}`} style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', margin: '0.875rem 0', color: 'var(--clay-3)', fontSize: '0.68rem', fontWeight: 700 }}>
                      <div style={{ flex: 1, height: 1, background: 'var(--parchment-3)' }} />{item.label}<div style={{ flex: 1, height: 1, background: 'var(--parchment-3)' }} />
                    </div>
                  );
                }
                const { msg } = item;
                const isMe = (msg.sender?._id || msg.sender) === user?._id;
                return (
                  <div key={msg._id || i} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: '0.5rem', marginBottom: '0.5rem' }}
                    onContextMenu={(e) => !msg.pending && handleMsgContextMenu(e, msg)}>
                    {!isMe && <Avatar name={activeOther?.name || ''} src={activeOther?.profilePhoto} size="sm" />}
                    <div style={{ maxWidth: '65%' }}>
                      <div style={{ padding: '0.625rem 0.875rem', borderRadius: isMe ? '16px 4px 16px 16px' : '4px 16px 16px 16px', background: msg.unsent ? 'transparent' : (isMe ? 'var(--clay)' : 'white'), color: msg.unsent ? 'var(--clay-3)' : (isMe ? 'var(--parchment)' : 'var(--clay)'), fontSize: '0.875rem', lineHeight: 1.5, border: msg.unsent ? '1px dashed var(--parchment-3)' : (isMe ? 'none' : '1px solid var(--parchment-3)'), opacity: msg.pending ? 0.65 : 1, fontStyle: msg.unsent ? 'italic' : 'normal' }}>
                        {msg.unsent && <span style={{ marginRight: '0.3rem' }}>🚫</span>}{msg.content}
                      </div>
                      <div style={{ fontSize: '0.62rem', color: 'var(--clay-3)', marginTop: 3, textAlign: isMe ? 'right' : 'left' }}>
                        {formatTime(msg.createdAt)}{msg.pending && ' · sending…'}
                        {isMe && !msg.pending && !msg.unsent && <span style={{ marginLeft: '0.3rem', opacity: 0.5 }}>✓✓</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
              {typing && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Avatar name={activeOther?.name || ''} src={activeOther?.profilePhoto} size="sm" />
                  <div style={{ padding: '0.6rem 1rem', background: 'white', borderRadius: '4px 16px 16px 16px', border: '1px solid var(--parchment-3)' }}>
                    <div style={{ display: 'flex', gap: 4 }}>{[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--clay-3)', animation: `pulse 1.2s ${i*0.2}s infinite` }} />)}</div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            {!canChat ? (
              <div style={{ padding: '1rem 1.5rem', background: 'white', borderTop: '1px solid var(--parchment-3)', textAlign: 'center', color: 'var(--clay-3)', fontSize: '0.85rem', flexShrink: 0 }}>
                🔒 You need 30+ trust points to send messages. Current: {trustScore}
              </div>
            ) : (
              <div style={{ padding: '0.75rem 1.5rem', background: 'white', borderTop: '1px solid var(--parchment-3)', display: 'flex', gap: '0.75rem', alignItems: 'center', flexShrink: 0 }}>
                <input className="form-input" style={{ borderRadius: 100, padding: '0.625rem 1.25rem', flex: 1 }} placeholder="Type a message… (right-click to unsend)" value={input} onChange={handleTypingInput} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} />
                <button className="btn btn-icon" style={{ background: input.trim() ? 'var(--terra)' : 'var(--parchment-3)', color: input.trim() ? 'white' : 'var(--clay-3)', border: 'none', transition: 'all 0.2s', flexShrink: 0 }} onClick={handleSend} disabled={sending || !input.trim()}>
                  {sending ? <Spinner size={14} /> : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--clay-3)', flexDirection: 'column', gap: '1rem', padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem' }}>💬</div>
            <p style={{ fontWeight: 600, fontSize: '1rem' }}>Select a conversation to start chatting</p>
            <p style={{ fontSize: '0.85rem' }}>Mutual matches appear here · Right-click messages for options</p>
          </div>
        )}
      </div>

      {/* Menus & Dialogs */}
      {msgMenu && (
        <ContextMenu x={msgMenu.x} y={msgMenu.y} onClose={() => setMsgMenu(null)}
          items={[
            !msgMenu.msg.unsent && { icon: '📋', label: 'Copy message', action: () => navigator.clipboard.writeText(msgMenu.msg.content).then(() => toast('Copied!', 'success')) },
            msgMenu.isMe && !msgMenu.msg.unsent && { icon: '↩️', label: 'Unsend message', danger: true, action: () => handleUnsend(msgMenu.msgId) },
          ].filter(Boolean)}
        />
      )}
      {chatMenu && (
        <ContextMenu x={chatMenu.x} y={chatMenu.y} onClose={() => setChatMenu(null)}
          items={[
            { icon: '🗑️', label: 'Delete conversation', danger: true, action: () => { const other = chatMenu.chat.participants?.find(p => (p._id || p) !== user?._id); setDeleteChatDialog({ chatId: chatMenu.chatId, name: other?.name || 'this user' }); } },
            { icon: '🚫', label: 'Block user', danger: true, action: () => { const other = chatMenu.chat.participants?.find(p => (p._id || p) !== user?._id); setBlockDialog({ userId: other?._id || other, name: other?.name || 'this user' }); } },
          ]}
        />
      )}
      {blockDialog && (
        <ConfirmDialog icon="🚫" title={`Block ${blockDialog.name}?`} body={`They won't be able to message you or see your profile. You can unblock them from Profile settings.`} confirmLabel="Block user" confirmDanger onConfirm={() => handleBlock(blockDialog.userId)} onCancel={() => setBlockDialog(null)} />
      )}
      {deleteChatDialog && (
        <ConfirmDialog icon="🗑️" title="Delete conversation?" body={`This will permanently delete your chat with <strong>${deleteChatDialog.name}</strong>. This cannot be undone.`} confirmLabel="Delete chat" confirmDanger onConfirm={() => handleDeleteChat(deleteChatDialog.chatId)} onCancel={() => setDeleteChatDialog(null)} />
      )}

      {/* User Profile Drawer */}
      {showProfile && activeOther && (
        <UserProfileDrawer user={activeOther} onClose={() => setShowProfile(false)} />
      )}

      {/* Voice/Video Call overlay */}
      {activeOther && (
        <VoiceVideoCall
          socket={socket}
          currentUser={user}
          activeOther={activeOther}
          on={on}
          initialCallType={callActive}
          onCallEnd={() => setCallActive(false)}
        />
      )}
      {/* Also listen for incoming calls even without active chat */}
      {!activeOther && (
        <VoiceVideoCall
          socket={socket}
          currentUser={user}
          activeOther={chats.length > 0 ? chats[0]?.participants?.find(p => (p._id || p) !== user?._id) : null}
          on={on}
          onCallEnd={() => setCallActive(false)}
        />
      )}

      <Footer />
    </div>
  );
}