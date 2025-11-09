import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validate } from '../middleware/validator.js';
import RAGService from '../services/rag.js';
import { nanoid } from 'nanoid';
import logger from '../utils/logger.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const ragService = new RAGService();

// Feedback storage
const FEEDBACK_FILE = path.join(__dirname, '../../data/feedback.json');

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

/**
 * POST /api/chat/feedback
 * Store user feedback for a response
 */
router.post('/feedback', validate('feedback'), asyncHandler(async (req, res) => {
  const { sessionId, query, answer, sources, rating, comment } = req.body;
  
  const feedbackEntry = {
    id: nanoid(),
    sessionId,
    query,
    answer,
    sources,
    rating, // 'positive' or 'negative'
    comment: comment || '',
    timestamp: new Date().toISOString()
  };
  
  try {
    // Read existing feedback
    let feedbackData = [];
    try {
      const data = await fs.readFile(FEEDBACK_FILE, 'utf-8');
      feedbackData = JSON.parse(data);
    } catch (error) {
      // File doesn't exist or is empty, start fresh
      await fs.mkdir(path.dirname(FEEDBACK_FILE), { recursive: true });
    }
    
    // Add new feedback
    feedbackData.push(feedbackEntry);
    
    // Write back to file
    await fs.writeFile(FEEDBACK_FILE, JSON.stringify(feedbackData, null, 2));
    
    logger.info(`Feedback received: ${rating} for query "${query.substring(0, 50)}..."`);
    
    res.json({
      success: true,
      message: 'Feedback recorded',
      data: { feedbackId: feedbackEntry.id }
    });
  } catch (error) {
    logger.error('Failed to store feedback:', error);
    throw error;
  }
}));

export default router;
