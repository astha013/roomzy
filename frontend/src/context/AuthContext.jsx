import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, profileApi } from '../api';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('rz_token'));
  const [loading, setLoading] = useState(true);

  // Hydrate user from token on mount
  useEffect(() => {
    const hydrate = async () => {
      if (!token) { setLoading(false); return; }
      try {
        const { data } = await profileApi.getMe();
        setUser(data);
      } catch {
        localStorage.removeItem('rz_token');
        setToken(null);
      } finally {
        setLoading(false);
      }
    };
    hydrate();
  }, [token]);

  // Listen for 401 auto-logout
  useEffect(() => {
    const handler = () => { setUser(null); setToken(null); };
    window.addEventListener('rz:logout', handler);
    return () => window.removeEventListener('rz:logout', handler);
  }, []);

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
    localStorage.removeItem('rz_token');
    localStorage.removeItem('rz_user');
    setToken(null);
    setUser(null);
  }, []);

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
