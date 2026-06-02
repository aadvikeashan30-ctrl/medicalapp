const winston = require('winston');

const level = process.env.LOG_LEVEL || 'info';

const logger = winston.createLogger({
  level,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    process.env.NODE_ENV === 'production'
      ? winston.format.json()
      : winston.format.printf(({ timestamp, level: lvl, message, stack }) =>
          `${timestamp} [${lvl}] ${stack || message}`
        )
  ),
  transports: [new winston.transports.Console()]
});

module.exports = logger;
