import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:5000';

let socketInstance = null;
let joinedUserId = null; // FIX: track which userId has already joined

export function useSocket() {
  const { user, token } = useAuth();
  const socketRef = useRef(null);

  useEffect(() => {
    if (!token || !user) {
      if (socketInstance) {
        socketInstance.disconnect();
        socketInstance = null;
        joinedUserId = null;
      }
      socketRef.current = null;
      return;
    }

    // Singleton socket
    if (!socketInstance) {
      socketInstance = io(WS_URL, {
        auth: { token },
        transports: ['websocket'],
        reconnectionAttempts: 5,
      });
    }
    socketRef.current = socketInstance;

    // FIX: only emit join if we haven't already joined as this user
    if (joinedUserId !== user._id) {
      socketInstance.emit('join', user._id);
      joinedUserId = user._id;
    }

    return () => {
      // Don't disconnect on unmount — keep singleton alive per session
    };
  }, [token, user]);

  // Disconnect socket on inactivity logout
  useEffect(() => {
    const handler = () => {
      if (socketInstance) {
        socketInstance.disconnect();
        socketInstance = null;
        joinedUserId = null;
      }
    };
    window.addEventListener('rz:socket-disconnect', handler);
    return () => window.removeEventListener('rz:socket-disconnect', handler);
  }, []);

  const sendMessage = useCallback(({ senderId, receiverId, content }) => {
    socketRef.current?.emit('sendMessage', { senderId, receiverId, content });
  }, []);

  const markRead = useCallback(({ chatId, userId }) => {
    socketRef.current?.emit('markRead', { chatId, userId });
  }, []);

  const sendTyping = useCallback(({ senderId, receiverId }) => {
    socketRef.current?.emit('typing', { senderId, receiverId });
  }, []);

  const on = useCallback((event, handler) => {
    socketRef.current?.on(event, handler);
    return () => socketRef.current?.off(event, handler);
  }, []);

  const off = useCallback((event, handler) => {
    socketRef.current?.off(event, handler);
  }, []);

  const emitRaw = useCallback((event, data) => {
    socketRef.current?.emit(event, data);
  }, []);

  return { sendMessage, markRead, sendTyping, on, off, socket: socketRef, emitRaw };
}
