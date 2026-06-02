const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

const DEMO_USER = {
  _id: 'demo-doctor-001',
  name: 'Demo Doctor',
  email: 'demo@docclinic.com',
  phone: '9000000000',
  role: 'doctor',
  specialty: 'general',
  clinicName: 'DocClinic Demo Centre',
  clinicCity: 'Mumbai',
  consultationFee: 500,
  plan: 'pro',
  isActive: true
};

const DEMO_USER_ID = 'demo-doctor-001';

const auth = async (req, res, next) => {
  try {
    const header = req.header('Authorization') || '';
    const token = header.replace(/^Bearer\s+/i, '').trim();
    if (!token) return res.status(401).json({ message: 'No token, access denied' });

    const secret = process.env.JWT_SECRET || 'demo-fallback-secret-key-32chars!!';
    const decoded = jwt.verify(token, secret);

    // Demo mode: if DB is not connected OR user has demo token, use demo user
    if (!req.app.locals.dbConnected || decoded.userId === DEMO_USER_ID) {
      req.user = DEMO_USER;
      return next();
    }

    // Only query DB if connection is actually ready
    if (mongoose.connection.readyState !== 1) {
      req.user = DEMO_USER;
      return next();
    }

    const user = await User.findById(decoded.userId).select('-password');
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = auth;
