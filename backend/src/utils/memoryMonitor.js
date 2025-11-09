import logger from './logger.js';

/**
 * Memory Monitor for Render FREE tier (512MB RAM limit)
 * Logs warnings when approaching memory limits
 */
class MemoryMonitor {
  constructor() {
    this.maxMemoryMB = 512; // Render free tier limit
    this.warningThresholdPercent = 80; // Warn at 80% usage
    this.criticalThresholdPercent = 90; // Critical at 90% usage
    
    // Check memory every 5 minutes
    this.monitorInterval = setInterval(() => {
      this.checkMemory();
    }, 5 * 60 * 1000);
    
    // Log initial memory status
    this.logMemoryStatus();
  }

  /**
   * Get current memory usage
   */
  getMemoryUsage() {
    const usage = process.memoryUsage();
    return {
      heapUsedMB: Math.round(usage.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(usage.heapTotal / 1024 / 1024),
      rssMB: Math.round(usage.rss / 1024 / 1024), // Resident Set Size
      externalMB: Math.round(usage.external / 1024 / 1024),
      percentUsed: Math.round((usage.rss / 1024 / 1024 / this.maxMemoryMB) * 100)
    };
  }

  /**
   * Check memory and log warnings
   */
  checkMemory() {
    const usage = this.getMemoryUsage();
    
    if (usage.percentUsed >= this.criticalThresholdPercent) {
      logger.error(`🚨 CRITICAL: Memory usage at ${usage.percentUsed}% (${usage.rssMB}MB / ${this.maxMemoryMB}MB)`);
      logger.error('Consider restarting server or reducing cache sizes');
    } else if (usage.percentUsed >= this.warningThresholdPercent) {
      logger.warn(`⚠️  Memory usage at ${usage.percentUsed}% (${usage.rssMB}MB / ${this.maxMemoryMB}MB)`);
    } else {
      logger.debug(`Memory usage: ${usage.percentUsed}% (${usage.rssMB}MB / ${this.maxMemoryMB}MB)`);
    }
  }

  /**
   * Log current memory status
   */
  logMemoryStatus() {
    const usage = this.getMemoryUsage();
    logger.info(`Memory Monitor started - Current: ${usage.rssMB}MB / ${this.maxMemoryMB}MB (${usage.percentUsed}%)`);
    logger.info(`Heap: ${usage.heapUsedMB}MB / ${usage.heapTotalMB}MB`);
  }

  /**
   * Force garbage collection if available (V8 flag required)
   */
  forceGC() {
    if (global.gc) {
      global.gc();
      logger.info('Forced garbage collection');
      this.logMemoryStatus();
    } else {
      logger.warn('Garbage collection not available. Start with --expose-gc flag to enable.');
    }
  }

  /**
   * Stop monitoring
   */
  shutdown() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
    }
    logger.info('Memory Monitor shutdown');
  }
}

export default MemoryMonitor;
