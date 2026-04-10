import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import EmailVerify from './pages/EmailVerify';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Preferences from './pages/Preferences';
import Matches from './pages/Matches';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import Verification from './pages/Verification';
import OTPVerify from './pages/OTPVerify';
import LivenessVerify from './pages/LivenessVerify';
import SocialLinks from './pages/SocialLinks';
import Reviews from './pages/Reviews';
import Agreement from './pages/Agreement';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, []);

  return (
    <Router>
      <div className="app">
        {isAuthenticated && <Navbar setIsAuthenticated={setIsAuthenticated} />}
        <div className="container">
          <Routes>
            <Route path="/login" element={!isAuthenticated ? <Login setIsAuthenticated={setIsAuthenticated} /> : <Navigate to="/dashboard" />} />
            <Route path="/register" element={!isAuthenticated ? <Register setIsAuthenticated={setIsAuthenticated} /> : <Navigate to="/dashboard" />} />
            <Route path="/verify-email/:token" element={<EmailVerify />} />
            <Route path="/forgot-password" element={!isAuthenticated ? <ForgotPassword /> : <Navigate to="/dashboard" />} />
            <Route path="/reset-password/:token" element={!isAuthenticated ? <ResetPassword /> : <Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
            <Route path="/preferences" element={isAuthenticated ? <Preferences /> : <Navigate to="/login" />} />
            <Route path="/matches" element={isAuthenticated ? <Matches /> : <Navigate to="/login" />} />
            <Route path="/chat" element={isAuthenticated ? <Chat /> : <Navigate to="/login" />} />
            <Route path="/chat/:userId" element={isAuthenticated ? <Chat /> : <Navigate to="/login" />} />
            <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} />
            <Route path="/profile/:id" element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} />
            <Route path="/verification" element={isAuthenticated ? <Verification /> : <Navigate to="/login" />} />
            <Route path="/otp-verify" element={isAuthenticated ? <OTPVerify /> : <Navigate to="/login" />} />
            <Route path="/liveness-verify" element={isAuthenticated ? <LivenessVerify /> : <Navigate to="/login" />} />
            <Route path="/social-links" element={isAuthenticated ? <SocialLinks /> : <Navigate to="/login" />} />
            <Route path="/reviews/:userId" element={isAuthenticated ? <Reviews /> : <Navigate to="/login" />} />
            <Route path="/agreement/:matchId" element={isAuthenticated ? <Agreement /> : <Navigate to="/login" />} />
            <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;