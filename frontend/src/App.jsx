import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect, lazy, Suspense } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { authApi } from './api';
import Navbar from './components/Navbar';
import { Spinner } from './components/UI';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import { Login, Register, ForgotPassword, ResetPassword } from './pages/Auth';
import Matches from './pages/Matches';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import Trust from './pages/Trust';
import './index.css';

// Lazy-loaded pages that are not critical path
const Admin = lazy(() => import('./pages/Admin'));

function LoadingFallback() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Spinner dark size={28} />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Navbar />
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              {/* Public */}
              <Route path="/"                       element={<Home />} />
              <Route path="/login"                  element={<Login />} />
              <Route path="/register"               element={<Register />} />
              <Route path="/forgot-password"        element={<ForgotPassword />} />
              <Route path="/reset-password/:token"  element={<ResetPassword />} />
              <Route path="/verify-email/:token"    element={<VerifyEmail />} />

              {/* Protected */}
              <Route path="/matches" element={<ProtectedRoute><Matches /></ProtectedRoute>} />
              <Route path="/chat"    element={<ProtectedRoute><Chat /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/trust"   element={<ProtectedRoute><Trust /></ProtectedRoute>} />

              {/* Admin */}
              <Route path="/admin/*" element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

// Inline verify-email handler page
function VerifyEmail() {
  const [status, setStatus] = useState('loading');
  const token = window.location.pathname.split('/').pop();

  useEffect(() => {
    authApi.verifyEmail(token)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        {status === 'loading' && <><div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div><p>Verifying your email…</p></>}
        {status === 'success' && (
          <>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', marginBottom: '0.75rem' }}>Email verified!</h2>
            <p style={{ color: 'var(--clay-3)', marginBottom: '1.5rem' }}>Your account is now active. Log in to find your roommate.</p>
            <a href="/login" className="btn btn-terra">Log in →</a>
          </>
        )}
        {status === 'error' && (
          <>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', marginBottom: '0.75rem' }}>Link expired</h2>
            <p style={{ color: 'var(--clay-3)', marginBottom: '1.5rem' }}>This link may have expired. Request a new one.</p>
            <a href="/login" className="btn btn-ghost">Go to login</a>
          </>
        )}
      </div>
    </div>
  );
}
