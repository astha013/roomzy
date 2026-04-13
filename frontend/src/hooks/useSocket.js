import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:5000';

let socketInstance = null;

export function useSocket() {
  const { user, token } = useAuth();
  const socketRef = useRef(null);

  useEffect(() => {
    if (!token || !user) return;

    // Singleton socket
    if (!socketInstance) {
      socketInstance = io(WS_URL, {
        auth: { token },
        transports: ['websocket'],
        reconnectionAttempts: 5,
      });
    }
    socketRef.current = socketInstance;

    // Join user room for directed messages
    socketInstance.emit('join', user._id);

    return () => {
      // Don't disconnect on unmount — keep singleton alive
    };
  }, [token, user]);

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

  return { sendMessage, markRead, sendTyping, on, off, socket: socketRef };
}
