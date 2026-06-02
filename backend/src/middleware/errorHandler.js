const logger = require('../utils/logger');

// 404 handler
function notFound(req, res, next) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// Centralized error handler
// Use this by either calling next(err) or throwing in async route wrappers.
function errorHandler(err, req, res, next) {
  let status = err.status || err.statusCode || 500;
  let message = err.message || 'Server error';

  // Mongoose validation
  if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    message = `Duplicate value for ${field}`;
  }

  // Cast (bad ObjectId)
  if (err.name === 'CastError') {
    status = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // JWT
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    status = 401;
    message = 'Invalid or expired token';
  }

  // MongoDB connectivity errors — return 503 instead of generic 500
  if (err.name === 'MongoServerSelectionError' || err.name === 'MongoNetworkError' ||
      err.name === 'MongooseServerSelectionError' || err.name === 'MongoNetworkTimeoutError' ||
      (err.message && err.message.includes('connect ECONNREFUSED'))) {
    status = 503;
    message = 'Database temporarily unavailable. Please try again shortly.';
  }

  if (status >= 500) {
    logger.error(err.stack || err.message);
  } else {
    logger.warn(`${status} ${message}`);
  }

  res.status(status).json({
    message,
    ...(process.env.NODE_ENV !== 'production' && err.stack ? { stack: err.stack } : {})
  });
}

// Async wrapper so route handlers can throw without try/catch boilerplate
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { notFound, errorHandler, asyncHandler };
