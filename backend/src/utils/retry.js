import logger from './logger.js';

/**
 * Retry utility for handling transient failures
 * FREE - no external services needed
 */

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {Object} options - Retry options
 * @returns {Promise} - Result of successful function call
 */
export async function retryWithBackoff(fn, options = {}) {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    factor = 2,
    shouldRetry = (_error) => true,
    onRetry = (_error, _attempt) => {}
  } = options;

  let lastError;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry this error
      if (!shouldRetry(error)) {
        throw error;
      }

      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        break;
      }

      // Call retry callback
      onRetry(error, attempt + 1);

      // Wait before retrying
      logger.warn(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms due to: ${error.message}`);
      await sleep(delay);

      // Exponential backoff
      delay = Math.min(delay * factor, maxDelay);
    }
  }

  // All retries exhausted
  logger.error(`All ${maxRetries} retry attempts failed`);
  throw lastError;
}

/**
 * Poll a condition with timeout
 * @param {Function} conditionFn - Async function that returns true when condition is met
 * @param {Object} options - Polling options
 * @returns {Promise<boolean>} - True if condition met, false if timeout
 */
export async function pollUntil(conditionFn, options = {}) {
  const {
    interval = 5000,
    timeout = 120000,
    description = 'Condition'
  } = options;

  const startTime = Date.now();
  let attempt = 0;

  while (Date.now() - startTime < timeout) {
    attempt++;
    
    try {
      const result = await conditionFn();
      
      if (result) {
        logger.info(`${description} met after ${attempt} attempt(s)`);
        return true;
      }
      
      const elapsed = Date.now() - startTime;
      const remaining = timeout - elapsed;
      const nextCheck = Math.min(interval, remaining);
      
      if (nextCheck > 0) {
        logger.debug(`${description} not met yet, checking again in ${nextCheck}ms...`);
        await sleep(nextCheck);
      }
    } catch (error) {
      logger.warn(`Error while polling: ${error.message}`);
      await sleep(interval);
    }
  }

  logger.error(`${description} not met within ${timeout}ms timeout`);
  return false;
}

/**
 * Check if error is retryable (network/rate limit errors)
 * @param {Error} error - Error to check
 * @returns {boolean} - True if error should be retried
 */
export function isRetryableError(error) {
  const message = error.message ? error.message.toLowerCase() : '';
  const code = error.code ? error.code.toString() : '';

  // Rate limit errors
  if (message.includes('429') || message.includes('rate limit') || message.includes('quota')) {
    return true;
  }

  // Network errors
  if (
    message.includes('econnreset') ||
    message.includes('econnrefused') ||
    message.includes('etimedout') ||
    message.includes('network') ||
    code === 'ENOTFOUND' ||
    code === 'ECONNRESET'
  ) {
    return true;
  }

  // Temporary server errors (5xx)
  if (message.includes('500') || message.includes('502') || message.includes('503') || message.includes('504')) {
    return true;
  }

  return false;
}

/**
 * Sleep utility
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} - Promise that resolves after delay
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default {
  retryWithBackoff,
  pollUntil,
  isRetryableError
};
