import Joi from 'joi';
import logger from '../utils/logger.js';

/**
 * Validation schemas
 */
const schemas = {
  query: Joi.object({
    query: Joi.string().required().min(1).max(1000).trim(),
    sessionId: Joi.string().optional().min(1).max(100),
    useQueryExpansion: Joi.boolean().optional().default(false)
  }),
  
  sessionId: Joi.object({
    sessionId: Joi.string().required().min(1).max(100)
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
