import winston from 'winston';
import config from '../config/index.js';
import path from 'path';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom log format
const logFormat = printf(({ level, message, timestamp, stack, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  
  if (stack) {
    msg += `\n${stack}`;
  }
  
  return msg;
});

// Create logger instance
const logger = winston.createLogger({
  level: config.logging.level,
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    // Console transport (always enabled, especially important for Render)
    new winston.transports.Console({
      format: combine(
        colorize({ all: process.env.NODE_ENV !== 'production' }), // Colorize in dev only
        logFormat
      ),
      handleExceptions: true,
      handleRejections: true
    })
  ],
  exceptionHandlers: [
    new winston.transports.Console({
      format: logFormat
    })
  ],
  rejectionHandlers: [
    new winston.transports.Console({
      format: logFormat
    })
  ]
});

// Only add file transports if not in test mode and logs directory exists
if (process.env.NODE_ENV !== 'test') {
  try {
    // File transports (may fail on some hosting platforms like Render's free tier)
    logger.add(new winston.transports.File({
      filename: path.join(config.logging.dir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }));
    
    logger.add(new winston.transports.File({
      filename: path.join(config.logging.dir, 'combined.log'),
      maxsize: 5242880,
      maxFiles: 5
    }));
    
    logger.add(new winston.transports.File({
      filename: path.join(config.logging.dir, 'exceptions.log')
    }));
  } catch (error) {
    // Fallback to console-only logging if file system is not writable
    console.warn('File logging disabled (filesystem not writable). Using console-only logging.');
  }
}

export default logger;
