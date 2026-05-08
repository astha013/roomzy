import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { authApi, profileApi } from '../api';

export const AuthContext = createContext(null);

const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('rz_token'));
  const [loading, setLoading] = useState(true);
  const inactivityTimer = useRef(null);

  const doLogout = useCallback(() => {
    localStorage.removeItem('rz_token');
    localStorage.removeItem('rz_user');
    setToken(null);
    setUser(null);
    // Disconnect socket singleton
    window.dispatchEvent(new Event('rz:socket-disconnect'));
  }, []);

  // Reset inactivity timer on user activity
  const resetInactivityTimer = useCallback(() => {
    clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      doLogout();
      window.dispatchEvent(new CustomEvent('rz:inactivity-logout'));
    }, INACTIVITY_TIMEOUT);
  }, [doLogout]);

  // Start/stop inactivity tracking based on auth state
  useEffect(() => {
    if (!token) {
      clearTimeout(inactivityTimer.current);
      return;
    }
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(e => window.addEventListener(e, resetInactivityTimer, { passive: true }));
    resetInactivityTimer(); // start the timer immediately

    return () => {
      clearTimeout(inactivityTimer.current);
      events.forEach(e => window.removeEventListener(e, resetInactivityTimer));
    };
  }, [token, resetInactivityTimer]);

  // Hydrate user from token on mount
  useEffect(() => {
    const hydrate = async () => {
      if (!token) { setLoading(false); return; }
      try {
        const { data } = await profileApi.getMe();
        setUser(data);
      } catch {
        doLogout();
      } finally {
        setLoading(false);
      }
    };
    hydrate();
  }, [token]);

  // Listen for 401 auto-logout
  useEffect(() => {
    const handler = () => doLogout();
    window.addEventListener('rz:logout', handler);
    return () => window.removeEventListener('rz:logout', handler);
  }, [doLogout]);

  const login = useCallback(async (email, password) => {
    const { data } = await authApi.login({ email, password });
    localStorage.setItem('rz_token', data.token);
    setToken(data.token);
    // Fetch full profile
    const { data: profile } = await profileApi.getMe();
    setUser(profile);
    return profile;
  }, []);

  const logout = useCallback(() => {
    doLogout();
  }, [doLogout]);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await profileApi.getMe();
      setUser(data);
      return data;
    } catch { /* silent */ }
  }, []);

  const isAuthenticated = !!token && !!user;
  const trustScore = user?.trustScore ?? 0;
  const canChat = trustScore >= 30;
  const isAdmin = user?.isAdmin ?? false;

  return (
    <AuthContext.Provider value={{
      user, token, loading, isAuthenticated,
      trustScore, canChat, isAdmin,
      login, logout, refreshUser, setUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
