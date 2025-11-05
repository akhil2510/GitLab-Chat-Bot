import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validate } from '../middleware/validator.js';
import RAGService from '../services/rag.js';
import { nanoid } from 'nanoid';
import logger from '../utils/logger.js';

const router = express.Router();
const ragService = new RAGService();

// Initialize RAG service
await ragService.initialize();

/**
 * POST /api/chat/query
 * Process a user query
 */
router.post('/query', validate('query'), asyncHandler(async (req, res) => {
  const { query, sessionId, useQueryExpansion } = req.body;
  
  // Generate session ID if not provided
  const currentSessionId = sessionId || nanoid();
  
  const result = await ragService.query(query, currentSessionId, useQueryExpansion);
  
  res.json({
    success: true,
    data: result
  });
}));

/**
 * POST /api/chat/clear
 * Clear conversation history
 */
router.post('/clear', validate('sessionId'), asyncHandler(async (req, res) => {
  const { sessionId } = req.body;
  
  ragService.clearConversationHistory(sessionId);
  
  res.json({
    success: true,
    message: 'Conversation history cleared'
  });
}));

/**
 * GET /api/chat/stats
 * Get system statistics
 */
router.get('/stats', asyncHandler(async (req, res) => {
  const stats = await ragService.getStats();
  
  res.json({
    success: true,
    data: stats
  });
}));

/**
 * GET /api/chat/health
 * Health check
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

export default router;
