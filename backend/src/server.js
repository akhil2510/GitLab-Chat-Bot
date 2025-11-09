import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import config from './config/index.js';
import logger from './utils/logger.js';
import MemoryMonitor from './utils/memoryMonitor.js';
import chatRoutes from './routes/chat.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();

// Initialize memory monitor for Render free tier (512MB)
let memoryMonitor;
if (process.env.NODE_ENV !== 'test') {
  memoryMonitor = new MemoryMonitor();
}

// Security middleware
app.use(helmet());

// CORS configuration
const rawOrigins = process.env.FRONTEND_URL || '';
const allowedOrigins = rawOrigins.split(',').map(s => s.trim()).filter(Boolean);

// Log CORS configuration on startup
if (allowedOrigins.length > 0) {
  logger.info(`CORS enabled for origins: ${allowedOrigins.join(', ')}`);
} else {
  logger.warn('CORS: No specific origins configured - allowing all origins');
}

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (curl, server-to-server, mobile apps)
    if (!origin) {
      return callback(null, true);
    }

    // If no allowed origins configured, allow all origins (development mode)
    if (allowedOrigins.length === 0) {
      return callback(null, true);
    }

    // Check if origin is in allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    
    // Log rejected origins
    logger.warn(`CORS: Rejected origin ${origin}`);
    return callback(new Error(`CORS policy: Origin ${origin} not allowed`));
  },
  credentials: allowedOrigins.length > 0,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400 // 24 hours
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

  // Graceful shutdown with conversation store cleanup
  const shutdown = async (signal) => {
    logger.info(`${signal} signal received: closing HTTP server`);
    
    // Import RAG service to access conversation store
    const { default: RAGService } = await import('./services/rag.js');
    const ragInstance = new RAGService();
    
    // Save all conversations before shutdown
    if (ragInstance.conversationStore && ragInstance.conversationStore.shutdown) {
      ragInstance.conversationStore.shutdown();
    }
    
    // Shutdown memory monitor
    if (memoryMonitor && memoryMonitor.shutdown) {
      memoryMonitor.shutdown();
    }
    
    logger.info('Graceful shutdown complete');
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

export default app;
