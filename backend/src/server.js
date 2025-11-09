import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import config from './config/index.js';
import logger from './utils/logger.js';
import chatRoutes from './routes/chat.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
// CORS configuration
// Support a comma-separated list in FRONTEND_URL (e.g. "https://site1.com,https://site2.com")
const rawOrigins = process.env.FRONTEND_URL || '';
const allowedOrigins = rawOrigins.split(',').map(s => s.trim()).filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (curl, server-to-server)
    if (!origin) return callback(null, true);

    // if no allowed origins configured, allow all origins (safe for quick testing)
    if (allowedOrigins.length === 0) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    return callback(new Error('CORS policy: origin not allowed'));
  },
  // only enable credentials when specific origins are configured
  credentials: allowedOrigins.length > 0
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Request logging
if (config.env === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  }));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    success: false,
    error: {
      message: 'Too many requests, please try again later.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', limiter);

// Routes
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'GitLab Chatbot API',
    version: '1.0.0',
    endpoints: {
      chat: '/api/chat',
      health: '/api/chat/health',
      stats: '/api/chat/stats'
    }
  });
});

app.use('/api/chat', chatRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const PORT = config.port;

// Only start server if not in test mode
if (config.env !== 'test') {
  try {
    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${config.env} mode`);
      logger.info(`API available at http://localhost:${PORT}`);
    });
    
    server.on('error', (error) => {
      logger.error('Server error:', error);
      process.exit(1);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    process.exit(0);
  });

  process.on('SIGINT', () => {
    logger.info('SIGINT signal received: closing HTTP server');
    process.exit(0);
  });
}

export default app;
