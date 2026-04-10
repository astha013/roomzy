const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/db');
const { setupChatSocket } = require('./sockets/chatSocket');

const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const matchRoutes = require('./routes/match');
const reviewRoutes = require('./routes/review');
const reportRoutes = require('./routes/report');
const verificationRoutes = require('./routes/verification');
const agreementRoutes = require('./routes/agreement');
const adminRoutes = require('./routes/admin');
const otpRoutes = require('./routes/otp');
const livenessRoutes = require('./routes/liveness');
const socialRoutes = require('./routes/social');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.FRONTEND_URL 
      : 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

connectDB();

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ['*'],
      imgSrc: ['*', 'data:', 'blob:'],
    },
  },
}));

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL
    : 'http://localhost:5173',
  credentials: true
}));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Too many requests, please try again later' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many login attempts, please try again later' }
});

app.use('/api', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

app.use(mongoSanitize());

app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '1d',
  dotfiles: 'ignore'
}));

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/agreements', agreementRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/liveness', livenessRoutes);
app.use('/api/social', socialRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Max 5MB allowed.' });
    }
    return res.status(400).json({ message: 'File upload error' });
  }
  
  res.status(500).json({ message: 'Something went wrong!' });
});

setupChatSocket(io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server, io };