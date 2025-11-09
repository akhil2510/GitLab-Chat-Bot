import Joi from 'joi';
import logger from '../utils/logger.js';

/**
 * Sanitize and validate input to prevent prompt injection
 */
const sanitizeQuery = (query) => {
  // Remove excessive whitespace
  const sanitized = query.trim().replace(/\s+/g, ' ');
  
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions|prompts|rules)/i,
    /you\s+are\s+(now|a)\s+/i,
    /system\s*:?\s*(prompt|role|message)/i,
    /\[INST\]|\[\/INST\]/i,  // LLM instruction tokens
    /<\|.*?\|>/i,  // Special tokens
    /{{.*?}}/,  // Template injection
    /\$\{.*?\}/,  // String interpolation
    /(eval|exec|function)\s*\(/i,  // Code execution
    /script\s*>/i,  // XSS attempt
  ];
  
  const hasSuspiciousContent = suspiciousPatterns.some(pattern => pattern.test(sanitized));
  
  if (hasSuspiciousContent) {
    logger.warn('Suspicious query detected', { query: sanitized });
    throw new Error('Query contains potentially harmful content');
  }
  
  // Limit excessive repetition (prevents token exhaustion attacks)
  const repetitionPattern = /(.{3,})\1{5,}/;
  if (repetitionPattern.test(sanitized)) {
    logger.warn('Excessive repetition detected', { query: sanitized });
    throw new Error('Query contains excessive repetition');
  }
  
  return sanitized;
};

/**
 * Validation schemas
 */
const schemas = {
  query: Joi.object({
    query: Joi.string().required().min(1).max(500).trim().custom((value, helpers) => {
      try {
        return sanitizeQuery(value);
      } catch (error) {
        return helpers.error('any.invalid', { message: error.message });
      }
    }),
    sessionId: Joi.string().optional().min(1).max(100),
    useQueryExpansion: Joi.boolean().optional().default(false)
  }),
  
  sessionId: Joi.object({
    sessionId: Joi.string().required().min(1).max(100)
  }),
  
  feedback: Joi.object({
    sessionId: Joi.string().required().min(1).max(100),
    query: Joi.string().required().min(1).max(1000),
    answer: Joi.string().required().min(1),
    sources: Joi.array().items(Joi.object()).optional(),
    rating: Joi.string().valid('positive', 'negative').required(),
    comment: Joi.string().optional().max(500).allow('')
  })
};

/**
 * Validation middleware factory
 */
const validate = (schemaName) => {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    
    if (!schema) {
      logger.error(`Validation schema '${schemaName}' not found`);
      return next(new Error('Validation configuration error'));
    }
    
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      logger.warn('Validation error', { errors });
      
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation error',
          details: errors
        }
      });
    }
    
    // Replace request body with validated value
    req.body = value;
    next();
  };
};

export { validate, schemas };
