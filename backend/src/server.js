const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cron = require('node-cron');

dotenv.config();

const logger = require('./utils/logger');
const { validateEnv } = require('./utils/env');
const { notFound, errorHandler } = require('./middleware/errorHandler');

validateEnv();

const app = express();
app.set('trust proxy', 1);

// Security & perf
app.use(helmet());
app.use(compression());

// CORS — allow all origins in development, restrict in production
const allowed = (process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || '*')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // mobile / curl / same-origin
      if (allowed.includes('*')) return cb(null, true);
      if (allowed.includes(origin)) return cb(null, true);
      // In development, allow all origins
      if (process.env.NODE_ENV !== 'production') return cb(null, true);
      return cb(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true
  })
);

// Body parsers (limit size)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(mongoSanitize());

// FAILSAFE: Demo login handler — runs BEFORE rate limiting and all other middleware
// This guarantees demo@docclinic.com / demo1234 ALWAYS works no matter what
app.post('/api/auth/login', (req, res, next) => {
  const { email, password } = req.body;
  if (email === 'demo@docclinic.com' && password === 'demo1234') {
    const jwt = require('jsonwebtoken');
    const secret = process.env.JWT_SECRET || 'demo-fallback-secret-key-32chars!!';
    const token = jwt.sign({ userId: 'demo-doctor-001' }, secret, { expiresIn: '30d' });
    return res.json({
      token,
      user: {
        _id: 'demo-doctor-001',
        id: 'demo-doctor-001',
        name: 'Demo Doctor',
        email: 'demo@docclinic.com',
        phone: '9000000000',
        role: 'doctor',
        specialty: 'general',
        qualification: 'MBBS, MD',
        registrationNo: 'REG-DEMO-001',
        clinicName: 'DocClinic Demo Centre',
        clinicAddress: '123 Health Street',
        clinicCity: 'Mumbai',
        consultationFee: 500,
        plan: 'pro',
        planExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        workingHours: { start: '09:00', end: '18:00' },
        isActive: true
      }
    });
  }
  next();
});

// Logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', {
  stream: { write: (msg) => logger.info(msg.trim()) }
}));

// Rate limiting on /api
const windowMin = parseInt(process.env.RATE_LIMIT_WINDOW_MINUTES || '15', 10);
const max = parseInt(process.env.RATE_LIMIT_MAX || '300', 10);
app.use(
  '/api',
  rateLimit({
    windowMs: windowMin * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many requests, please slow down.' }
  })
);

// Static uploads
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
app.use('/uploads', express.static(uploadDir));

// MongoDB — default to demo mode until DB is confirmed connected
app.locals.dbConnected = false;

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/doctor-clinic';
mongoose
  .connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 })
  .then(() => {
    logger.info('MongoDB connected');
    app.locals.dbConnected = true;
  })
  .catch((err) => {
    logger.warn(`MongoDB not available: ${err.message}`);
    logger.warn('Running in DEMO MODE — using in-memory dummy data. No data will persist.');
    app.locals.dbConnected = false;
  });

// Track MongoDB connection state changes to prevent 500 errors when DB drops
mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected — switching to DEMO MODE');
  app.locals.dbConnected = false;
});

mongoose.connection.on('reconnected', () => {
  logger.info('MongoDB reconnected — resuming normal mode');
  app.locals.dbConnected = true;
});

mongoose.connection.on('error', (err) => {
  logger.error(`MongoDB connection error: ${err.message}`);
  app.locals.dbConnected = false;
});

// Demo mode routes (MUST come BEFORE real routes so they intercept when DB is unavailable)
app.use('/api', require('./routes/demo'));

// DB guard: if somehow a request reaches real routes but DB is actually down, return 503
// This prevents 500 errors from Mongoose timeout/connection failures
app.use('/api', (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    // DB not connected — sync the flag and respond with 503
    app.locals.dbConnected = false;
    return res.status(503).json({ message: 'Database temporarily unavailable. Please try again shortly.' });
  }
  next();
});

// Real routes (used when MongoDB IS connected)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/prescriptions', require('./routes/prescriptions'));
app.use('/api/billing', require('./routes/billing'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/whatsapp', require('./routes/whatsapp'));
app.use('/api/medicines', require('./routes/medicines'));
app.use('/api/labtests', require('./routes/labtests'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/portal', require('./routes/portal'));
app.use('/api/uploads', require('./routes/uploads'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/subscription', require('./routes/subscription'));
app.use('/api/telemedicine', require('./routes/telemedicine'));
app.use('/api/otp', require('./routes/otp'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/pdf', require('./routes/pdf'));

// ===== NEW AI-POWERED HEALTHCARE PLATFORM ROUTES =====

// Patient Features
app.use('/api/health-records', require('./routes/healthRecords'));
app.use('/api/family', require('./routes/family'));
app.use('/api/reminders', require('./routes/reminders'));
app.use('/api/vaccinations', require('./routes/vaccinations'));
app.use('/api/chatbot', require('./routes/chatbot'));

// Doctor Features (AI-powered)
app.use('/api/doctor', require('./routes/doctor'));

// Business Features
app.use('/api/membership', require('./routes/membership'));
app.use('/api/health-packages', require('./routes/healthPackages'));
app.use('/api/campaigns', require('./routes/campaigns'));
app.use('/api/referrals', require('./routes/referrals'));

// Enterprise Features
app.use('/api/enterprise', require('./routes/enterprise'));

// Health check (DB-aware)
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const demoMode = !app.locals.dbConnected;
  res.status(200).json({
    status: demoMode ? 'DEMO_MODE' : (dbState === 1 ? 'OK' : 'DEGRADED'),
    db: demoMode ? 'not-connected (demo mode active)' : (states[dbState] || 'unknown'),
    demoMode,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// 404 + central error handler (must be last)
app.use(notFound);
app.use(errorHandler);

// Daily cron - 8 AM
cron.schedule('0 8 * * *', async () => {
  try {
    const { sendAppointmentReminders } = require('./services/whatsappService');
    await sendAppointmentReminders();
  } catch (err) {
    logger.error(`Reminder cron failed: ${err.message}`);
  }
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => logger.info(`Doctor Clinic API running on port ${PORT}`));

// Initialize Socket.IO for real-time queue updates
const { initSocket } = require('./services/socketService');
initSocket(server);

// Graceful shutdown
function shutdown(signal) {
  logger.info(`${signal} received, shutting down...`);
  server.close(() => {
    mongoose.connection.close(false).then(() => process.exit(0));
  });
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

module.exports = app;
