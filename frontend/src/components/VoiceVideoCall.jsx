/**
 * VoiceVideoCall.jsx
 * Full WebRTC voice/video call component for Roomzy.
 * Uses the socket signaling events already wired in chatSocket.js:
 *   callRequest → incomingCall → callSignal → callAccepted → callEnded/callRejected
 *
 * Usage:
 *   <VoiceVideoCall
 *     socket={socketRef}           // raw socket ref from useSocket()
 *     currentUser={user}           // auth user object
 *     activeOther={activeOther}    // the other participant (has ._id, .name, .profilePhoto)
 *     on={on}                      // socket event listener helper from useSocket
 *   />
 */

import { useState, useEffect, useRef, useCallback } from 'react';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// WebRTC config — uses free public STUN servers, works on LAN/localhost always
const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

// ── tiny avatar fallback ──────────────────────────────────────────────────
function CallAvatar({ name, src, size = 80 }) {
  const initials = name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
  return src ? (
    <img
      src={`${BASE}${src}`}
      alt={name}
      style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(255,255,255,0.3)' }}
      onError={e => { e.target.style.display = 'none'; }}
    />
  ) : (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'linear-gradient(135deg, #b5714b, #7c5c8a)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'white', fontWeight: 800, fontSize: size * 0.32, border: '3px solid rgba(255,255,255,0.3)'
    }}>{initials}</div>
  );
}

// ── main component ────────────────────────────────────────────────────────
export default function VoiceVideoCall({ socket, currentUser, activeOther, on, initialCallType, onCallEnd }) {
  // call state machine: idle | calling | incoming | connected
  const [callState, setCallState] = useState('idle');
  const [callType, setCallType] = useState('video'); // 'video' | 'voice'
  const [incomingCall, setIncomingCall] = useState(null); // { from, type }
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState(''); // 'Connecting…' | 'Connected' | ''

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);           // RTCPeerConnection
  const localStreamRef = useRef(null);  // local MediaStream
  const timerRef = useRef(null);
  const offerCandidates = useRef([]);   // queue ICE candidates until remote desc is set
  const isInitiatorRef = useRef(false);

  // ── helpers ───────────────────────────────────────────────────────────
  const emit = useCallback((event, data) => {
    socket?.current?.emit(event, data);
  }, [socket]);

  const cleanup = useCallback(() => {
    // Stop all local tracks
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;

    // Close peer connection
    if (pcRef.current) {
      pcRef.current.onicecandidate = null;
      pcRef.current.ontrack = null;
      pcRef.current.close();
      pcRef.current = null;
    }

    // Clear video elements
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

    // Clear timer
    clearInterval(timerRef.current);
    setCallDuration(0);

    offerCandidates.current = [];
    isInitiatorRef.current = false;
    setIsMuted(false);
    setIsCamOff(false);
    setConnectionStatus('');
  }, []);

  // Auto-start call when parent triggers it
  useEffect(() => {
    if (initialCallType && callState === 'idle' && activeOther?._id) {
      startCall(initialCallType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCallType]);

  // Notify parent when call ends
  const endCall = useCallback((notifyOther = true) => {
    if (notifyOther && activeOther?._id) {
      emit('callEnded', { to: activeOther._id });
    }
    cleanup();
    setCallState('idle');
    setIncomingCall(null);
    onCallEnd?.();
  }, [activeOther, emit, cleanup, onCallEnd]);

  // ── get media stream ──────────────────────────────────────────────────
  const getStream = useCallback(async (type) => {
    const constraints = type === 'video'
      ? { video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }, audio: true }
      : { video: false, audio: true };
    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err) {
      // fallback: audio-only if video fails
      if (type === 'video') {
        try { return await navigator.mediaDevices.getUserMedia({ video: false, audio: true }); }
        catch { throw new Error('Microphone access denied'); }
      }
      throw new Error('Microphone access denied');
    }
  }, []);

  // ── build PeerConnection ──────────────────────────────────────────────
  const createPC = useCallback((stream, targetId) => {
    const pc = new RTCPeerConnection(RTC_CONFIG);
    pcRef.current = pc;

    // Add local tracks
    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    // Send ICE candidates
    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        emit('callSignal', { to: targetId, signal: { type: 'candidate', candidate } });
      }
    };

    pc.onconnectionstatechange = () => {
      const s = pc.connectionState;
      if (s === 'connected') {
        setConnectionStatus('Connected');
        timerRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);
      } else if (s === 'disconnected' || s === 'failed' || s === 'closed') {
        endCall(false);
      }
    };

    // Receive remote stream
    pc.ontrack = ({ streams }) => {
      if (remoteVideoRef.current && streams[0]) {
        remoteVideoRef.current.srcObject = streams[0];
      }
    };

    return pc;
  }, [emit, endCall]);

  // ── initiate call ─────────────────────────────────────────────────────
  const startCall = useCallback(async (type) => {
    if (!activeOther?._id || callState !== 'idle') return;
    setCallType(type);
    setCallState('calling');
    setConnectionStatus('Calling…');
    isInitiatorRef.current = true;

    try {
      const stream = await getStream(type);
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const pc = createPC(stream, activeOther._id);

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      emit('callRequest', { from: currentUser._id, to: activeOther._id, type });
      emit('callSignal', { to: activeOther._id, signal: { type: 'offer', sdp: offer } });
    } catch (err) {
      setCallState('idle');
      setConnectionStatus('');
      alert(err.message || 'Could not start call. Check camera/mic permissions.');
    }
  }, [activeOther, callState, currentUser, getStream, createPC, emit]);

  // ── accept incoming call ──────────────────────────────────────────────
  const acceptCall = useCallback(async (incoming) => {
    setCallState('connected');
    setCallType(incoming.type || 'video');
    setConnectionStatus('Connecting…');
    isInitiatorRef.current = false;

    try {
      const stream = await getStream(incoming.type || 'video');
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const pc = createPC(stream, incoming.from);

      // If we already got the offer signal, process it
      if (incoming.signal?.type === 'offer') {
        await pc.setRemoteDescription(new RTCSessionDescription(incoming.signal.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        emit('callAccepted', { to: incoming.from, signal: { type: 'answer', sdp: answer } });

        // drain queued candidates
        for (const c of offerCandidates.current) {
          await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
        }
        offerCandidates.current = [];
      }
    } catch (err) {
      endCall(true);
      alert(err.message || 'Could not start call');
    }
    setIncomingCall(null);
  }, [getStream, createPC, emit, endCall]);

  const rejectCall = useCallback(() => {
    if (incomingCall?.from) emit('callRejected', { to: incomingCall.from });
    setIncomingCall(null);
    setCallState('idle');
  }, [incomingCall, emit]);

  // ── socket event listeners ────────────────────────────────────────────
  useEffect(() => {
    if (!on) return;

    // Someone is calling us
    const u1 = on('incomingCall', ({ from, type, signal }) => {
      if (callState !== 'idle') {
        // busy — reject silently
        emit('callRejected', { to: from });
        return;
      }
      setIncomingCall({ from, type: type || 'video', signal });
      setCallState('incoming');
    });

    // Receive WebRTC signaling from remote
    const u2 = on('callSignal', async ({ from: _from, signal }) => {
      const pc = pcRef.current;
      if (!pc || !signal) return;

      try {
        if (signal.type === 'offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          emit('callAccepted', { to: activeOther?._id, signal: { type: 'answer', sdp: answer } });
        } else if (signal.type === 'answer') {
          if (pc.signalingState === 'have-local-offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          }
        } else if (signal.type === 'candidate') {
          if (pc.remoteDescription) {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate)).catch(() => {});
          } else {
            offerCandidates.current.push(signal.candidate);
          }
        }
      } catch { /* ignore stale state errors */ }
    });

    // Remote accepted our call
    const u3 = on('callAccepted', async ({ signal }) => {
      const pc = pcRef.current;
      if (!pc || !signal) return;
      if (signal.type === 'answer' && pc.signalingState === 'have-local-offer') {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          setCallState('connected');
          setConnectionStatus('Connecting…');
        } catch { /* ignore */ }
      }
    });

    // Remote rejected our call
    const u4 = on('callRejected', () => {
      cleanup();
      setCallState('idle');
    });

    // Remote ended the call
    const u5 = on('callEnded', () => {
      cleanup();
      setCallState('idle');
    });

    return () => { u1?.(); u2?.(); u3?.(); u4?.(); u5?.(); };
  }, [on, emit, activeOther, callState, cleanup]);

  // ── controls ──────────────────────────────────────────────────────────
  const toggleMute = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) { track.enabled = !track.enabled; setIsMuted(m => !m); }
  };

  const toggleCam = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) { track.enabled = !track.enabled; setIsCamOff(c => !c); }
  };

  const formatDuration = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  // ── nothing to render when idle ───────────────────────────────────────
  if (callState === 'idle') {
    // Render just the call buttons inline in parent header — exposed as a sub-component
    return null;
  }

  // ── incoming call UI ──────────────────────────────────────────────────
  if (callState === 'incoming' && incomingCall) {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 10001, flexDirection: 'column', gap: '1.5rem'
      }}>
        {/* Pulsing ring */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {[1,2,3].map(i => (
            <div key={i} style={{
              position: 'absolute', width: 80 + i * 30, height: 80 + i * 30,
              borderRadius: '50%', border: '2px solid rgba(255,255,255,0.2)',
              animation: `pulse-ring 2s ${i * 0.4}s ease-out infinite`,
            }} />
          ))}
          <CallAvatar name={activeOther?.name} src={activeOther?.profilePhoto} size={90} />
        </div>

        <div style={{ textAlign: 'center', color: 'white' }}>
          <p style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: 4 }}>
            Incoming {incomingCall.type === 'video' ? '📹 video' : '📞 voice'} call
          </p>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 4 }}>{activeOther?.name || 'Someone'}</h2>
        </div>

        <div style={{ display: 'flex', gap: '2.5rem' }}>
          <button onClick={rejectCall} style={btnStyle('#ef4444')}>
            <PhoneIcon style={{ transform: 'rotate(135deg)' }} />
          </button>
          <button onClick={() => acceptCall(incomingCall)} style={btnStyle('#22c55e')}>
            {incomingCall.type === 'video' ? <VideoIcon /> : <PhoneIcon />}
          </button>
        </div>

        <style>{`
          @keyframes pulse-ring {
            0% { transform: scale(0.8); opacity: 1; }
            100% { transform: scale(1.4); opacity: 0; }
          }
        `}</style>
      </div>
    );
  }

  // ── active call UI (calling + connected) ──────────────────────────────
  const isVideo = callType === 'video';
  const otherName = activeOther?.name || 'User';

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#0f0f0f',
      display: 'flex', flexDirection: 'column',
      zIndex: 10001, userSelect: 'none'
    }}>
      {/* Remote video / avatar */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {isVideo ? (
          <video
            ref={remoteVideoRef}
            autoPlay playsInline
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
            <CallAvatar name={otherName} src={activeOther?.profilePhoto} size={120} />
            <div style={{ textAlign: 'center', color: 'white' }}>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{otherName}</h2>
              <p style={{ opacity: 0.65, marginTop: 4 }}>
                {callState === 'calling' ? (connectionStatus || 'Ringing…') : (callDuration > 0 ? formatDuration(callDuration) : connectionStatus)}
              </p>
            </div>
          </div>
        )}

        {/* Status overlay for video */}
        {isVideo && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, padding: '1.25rem 1.5rem',
            background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 100%)',
            display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'white'
          }}>
            <CallAvatar name={otherName} src={activeOther?.profilePhoto} size={38} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>{otherName}</div>
              <div style={{ fontSize: '0.72rem', opacity: 0.75 }}>
                {callState === 'calling' ? (connectionStatus || 'Ringing…') : (callDuration > 0 ? formatDuration(callDuration) : connectionStatus)}
              </div>
            </div>
          </div>
        )}

        {/* Local video PiP */}
        {isVideo && (
          <div style={{
            position: 'absolute', bottom: 90, right: 16,
            width: 110, height: 155, borderRadius: 14,
            overflow: 'hidden', border: '2px solid rgba(255,255,255,0.3)',
            background: '#222', boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
          }}>
            <video
              ref={localVideoRef}
              autoPlay playsInline muted
              style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
            />
            {isCamOff && (
              <div style={{
                position: 'absolute', inset: 0, background: '#333',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.5rem'
              }}>📷</div>
            )}
          </div>
        )}

        {/* Voice call: hidden local audio element */}
        {!isVideo && (
          <video ref={localVideoRef} autoPlay playsInline muted style={{ display: 'none' }} />
        )}
        {!isVideo && (
          <video ref={remoteVideoRef} autoPlay playsInline style={{ display: 'none' }} />
        )}
      </div>

      {/* Controls bar */}
      <div style={{
        padding: '1.25rem 2rem 2rem',
        background: 'linear-gradient(0deg, rgba(0,0,0,0.9) 0%, transparent 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.25rem'
      }}>
        <CtrlBtn icon={isMuted ? '🔇' : '🎤'} label={isMuted ? 'Unmute' : 'Mute'} onClick={toggleMute} active={isMuted} />
        {isVideo && (
          <CtrlBtn icon={isCamOff ? '📷' : '📹'} label={isCamOff ? 'Cam on' : 'Cam off'} onClick={toggleCam} active={isCamOff} />
        )}
        <CtrlBtn icon={isSpeaker ? '🔊' : '🔈'} label="Speaker" onClick={() => setIsSpeaker(s => !s)} active={!isSpeaker} />
        <button
          onClick={() => endCall(true)}
          style={{
            width: 64, height: 64, borderRadius: '50%',
            background: '#ef4444', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(239,68,68,0.5)', transition: 'transform 0.15s'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <PhoneIcon style={{ transform: 'rotate(135deg)', color: 'white' }} size={26} />
        </button>
      </div>
    </div>
  );
}

// ── helper sub-components ─────────────────────────────────────────────────
function CtrlBtn({ icon, label, onClick, active }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <button
        onClick={onClick}
        style={{
          width: 52, height: 52, borderRadius: '50%',
          background: active ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)',
          border: `1.5px solid ${active ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)'}`,
          cursor: 'pointer', fontSize: '1.3rem', display: 'flex',
          alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s'
        }}
      >{icon}</button>
      <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.62rem' }}>{label}</span>
    </div>
  );
}

function PhoneIcon({ style = {}, size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="white" style={style}>
      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
    </svg>
  );
}

function VideoIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="white">
      <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
    </svg>
  );
}

const btnStyle = (bg) => ({
  width: 68, height: 68, borderRadius: '50%',
  background: bg, border: 'none', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  boxShadow: `0 6px 24px ${bg}80`, transition: 'transform 0.15s'
});

// ── exported trigger buttons (render inside Chat header) ──────────────────
export function CallButtons({ onVoiceCall, onVideoCall, disabled }) {
  return (
    <div style={{ display: 'flex', gap: '0.4rem' }}>
      <button
        title="Voice call"
        onClick={onVoiceCall}
        disabled={disabled}
        style={{
          background: 'none', border: '1.5px solid var(--parchment-3)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          padding: '5px 10px', borderRadius: 8,
          color: disabled ? 'var(--parchment-3)' : 'var(--clay-2)',
          fontSize: '1rem', lineHeight: 1, transition: 'all 0.15s', opacity: disabled ? 0.4 : 1
        }}
        onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = 'var(--parchment-2)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
      >📞</button>
      <button
        title="Video call"
        onClick={onVideoCall}
        disabled={disabled}
        style={{
          background: 'none', border: '1.5px solid var(--parchment-3)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          padding: '5px 10px', borderRadius: 8,
          color: disabled ? 'var(--parchment-3)' : 'var(--clay-2)',
          fontSize: '1rem', lineHeight: 1, transition: 'all 0.15s', opacity: disabled ? 0.4 : 1
        }}
        onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = 'var(--parchment-2)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
      >📹</button>
    </div>
  );
}
