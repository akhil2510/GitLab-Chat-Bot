import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * File-based conversation storage for persistence across server restarts
 * Optimized for Render FREE tier (512MB RAM, 0.1 CPU)
 * 
 * Features:
 * - Minimal memory footprint (only active sessions in RAM)
 * - Auto-cleanup of old/inactive conversations
 * - Memory-efficient lazy loading
 * - Automatic limits to prevent exhaustion
 */
class ConversationStore {
  constructor() {
    // Store conversations in data directory
    this.storageDir = path.join(__dirname, '../../data/conversations');
    this.ensureStorageDir();
    
    // MEMORY OPTIMIZATION: Limited in-memory cache for Render free tier
    this.cache = new Map();
    this.maxCacheSize = 20; // Only keep 20 most recent sessions in memory
    this.maxConversationsOnDisk = 100; // Limit total conversations (prevent disk bloat)
    this.maxMessagePerSession = 10; // Limit messages per session (prevent large files)
    this.maxSessionAgeDays = 2; // Auto-delete sessions older than 2 days (free tier)
    
    // Track dirty sessions for efficient saving
    this.dirtySessionIds = new Set();
    
    // Load only recent conversations (not all)
    this.loadRecentConversations();
    
    // Only start intervals in non-test mode
    if (process.env.NODE_ENV !== 'test') {
      // Auto-cleanup every 10 minutes (delete old conversations)
      this.cleanupInterval = setInterval(() => {
        this.cleanupOldConversations(this.maxSessionAgeDays);
        this.enforceDiskLimits();
      }, 10 * 60 * 1000);
      
      // Auto-save interval (every 30 seconds) - only dirty sessions
      this.autoSaveInterval = setInterval(() => {
        this.saveDirtySessions();
      }, 30000);
    }
    
    logger.info('ConversationStore initialized (Render FREE tier optimized)');
  }

  /**
   * Ensure storage directory exists
   */
  ensureStorageDir() {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
      logger.info(`Created conversations directory: ${this.storageDir}`);
    }
  }

  /**
   * Get file path for a session
   */
  getFilePath(sessionId) {
    // Sanitize session ID for safe filename
    const safeId = sessionId.replace(/[^a-zA-Z0-9-_]/g, '_');
    return path.join(this.storageDir, `${safeId}.json`);
  }

  /**
   * Load only recent conversations (memory-efficient for free tier)
   */
  loadRecentConversations() {
    try {
      if (!fs.existsSync(this.storageDir)) return;
      
      const files = fs.readdirSync(this.storageDir);
      const fileStats = [];
      
      // Get file stats for sorting by modification time
      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        
        try {
          const filePath = path.join(this.storageDir, file);
          const stats = fs.statSync(filePath);
          fileStats.push({ file, mtime: stats.mtime });
        } catch (error) {
          logger.warn(`Failed to stat file ${file}: ${error.message}`);
        }
      }
      
      // Sort by most recent first
      fileStats.sort((a, b) => b.mtime - a.mtime);
      
      // Load only the 20 most recent sessions (memory limit)
      const recentFiles = fileStats.slice(0, this.maxCacheSize);
      let loadedCount = 0;
      
      for (const { file } of recentFiles) {
        try {
          const filePath = path.join(this.storageDir, file);
          const data = fs.readFileSync(filePath, 'utf8');
          const conversation = JSON.parse(data);
          
          const sessionId = file.replace('.json', '');
          this.cache.set(sessionId, conversation.history || []);
          loadedCount++;
        } catch (error) {
          logger.warn(`Failed to load conversation file ${file}: ${error.message}`);
        }
      }
      
      if (loadedCount > 0) {
        logger.info(`Loaded ${loadedCount} recent conversation(s) to memory (${fileStats.length} total on disk)`);
      }
    } catch (error) {
      logger.error(`Error loading conversations: ${error.message}`);
    }
  }

  /**
   * Get conversation history for a session
   * Lazy loading: Load from disk only if not in memory
   */
  get(sessionId) {
    if (!sessionId) return [];
    
    // Check memory cache first
    if (this.cache.has(sessionId)) {
      return this.cache.get(sessionId);
    }
    
    // Lazy load from disk if not in cache
    try {
      const filePath = this.getFilePath(sessionId);
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        const conversation = JSON.parse(data);
        const history = conversation.history || [];
        
        // Add to cache but respect memory limits
        this.addToCache(sessionId, history);
        return history;
      }
    } catch (error) {
      logger.warn(`Failed to load conversation ${sessionId}: ${error.message}`);
    }
    
    return [];
  }

  /**
   * Add session to cache with LRU eviction (memory-efficient)
   */
  addToCache(sessionId, history) {
    // If cache is full, remove oldest entry (LRU)
    if (this.cache.size >= this.maxCacheSize && !this.cache.has(sessionId)) {
      const oldestKey = this.cache.keys().next().value;
      
      // Save oldest session before evicting from memory
      const oldHistory = this.cache.get(oldestKey);
      this.saveAsync(oldestKey, oldHistory);
      
      this.cache.delete(oldestKey);
      logger.debug(`Evicted session ${oldestKey} from cache (LRU)`);
    }
    
    this.cache.set(sessionId, history);
  }

  /**
   * Set/update conversation history
   */
  set(sessionId, history) {
    if (!sessionId) return;
    
    // Enforce message limit per session (prevent large files on free tier)
    const limitedHistory = history.slice(-this.maxMessagePerSession);
    
    // Update cache with LRU eviction
    this.addToCache(sessionId, limitedHistory);
    
    // Mark as dirty for next auto-save
    this.dirtySessionIds.add(sessionId);
  }

  /**
   * Save only dirty (modified) sessions - memory efficient
   */
  saveDirtySessions() {
    if (this.dirtySessionIds.size === 0) return;
    
    let savedCount = 0;
    for (const sessionId of this.dirtySessionIds) {
      const history = this.cache.get(sessionId);
      if (history) {
        this.saveAsync(sessionId, history);
        savedCount++;
      }
    }
    
    this.dirtySessionIds.clear();
    
    if (savedCount > 0) {
      logger.debug(`Auto-saved ${savedCount} dirty session(s)`);
    }
  }

  /**
   * Save conversation to disk asynchronously
   */
  saveAsync(sessionId, history) {
    const filePath = this.getFilePath(sessionId);
    const data = {
      sessionId,
      history,
      lastUpdated: new Date().toISOString()
    };
    
    // Non-blocking write
    fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8', (error) => {
      if (error) {
        logger.error(`Failed to save conversation ${sessionId}: ${error.message}`);
      }
    });
  }

  /**
   * Save all conversations (used on shutdown)
   */
  saveAll() {
    let savedCount = 0;
    for (const [sessionId, history] of this.cache.entries()) {
      try {
        const filePath = this.getFilePath(sessionId);
        const data = {
          sessionId,
          history,
          lastUpdated: new Date().toISOString()
        };
        
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        savedCount++;
      } catch (error) {
        logger.error(`Failed to save conversation ${sessionId}: ${error.message}`);
      }
    }
    
    if (savedCount > 0) {
      logger.info(`Saved ${savedCount} conversation(s) to disk`);
    }
  }

  /**
   * Delete a conversation
   */
  delete(sessionId) {
    if (!sessionId) return;
    
    // Remove from memory
    this.cache.delete(sessionId);
    
    // Remove from disk
    try {
      const filePath = this.getFilePath(sessionId);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.info(`Deleted conversation file for session: ${sessionId}`);
      }
    } catch (error) {
      logger.warn(`Failed to delete conversation ${sessionId}: ${error.message}`);
    }
  }

  /**
   * Get number of active sessions
   */
  get size() {
    return this.cache.size;
  }

  /**
   * Cleanup old conversations (older than X days)
   * Free tier optimization: Keep storage small
   */
  cleanupOldConversations(maxAgeDays = 2) {
    try {
      const now = Date.now();
      const maxAge = maxAgeDays * 24 * 60 * 60 * 1000;
      let deletedCount = 0;
      
      const files = fs.readdirSync(this.storageDir);
      
      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        
        try {
          const filePath = path.join(this.storageDir, file);
          const data = fs.readFileSync(filePath, 'utf8');
          const conversation = JSON.parse(data);
          
          const lastUpdated = new Date(conversation.lastUpdated).getTime();
          const age = now - lastUpdated;
          
          if (age > maxAge) {
            fs.unlinkSync(filePath);
            const sessionId = file.replace('.json', '');
            this.cache.delete(sessionId);
            deletedCount++;
          }
        } catch (error) {
          logger.warn(`Error processing file ${file}: ${error.message}`);
        }
      }
      
      if (deletedCount > 0) {
        logger.info(`Cleaned up ${deletedCount} old conversation(s) (>${maxAgeDays}d)`);
      }
    } catch (error) {
      logger.error(`Error during cleanup: ${error.message}`);
    }
  }

  /**
   * Enforce disk limits - delete oldest conversations if over limit
   * Render free tier: Keep total conversations under control
   */
  enforceDiskLimits() {
    try {
      const files = fs.readdirSync(this.storageDir);
      const jsonFiles = files.filter(f => f.endsWith('.json'));
      
      if (jsonFiles.length <= this.maxConversationsOnDisk) {
        return; // Under limit
      }
      
      // Get file stats and sort by modification time (oldest first)
      const fileStats = [];
      for (const file of jsonFiles) {
        try {
          const filePath = path.join(this.storageDir, file);
          const stats = fs.statSync(filePath);
          fileStats.push({ file, filePath, mtime: stats.mtime });
        } catch (error) {
          logger.warn(`Failed to stat file ${file}: ${error.message}`);
        }
      }
      
      fileStats.sort((a, b) => a.mtime - b.mtime); // Oldest first
      
      // Delete oldest files to get under limit
      const toDelete = fileStats.length - this.maxConversationsOnDisk;
      let deletedCount = 0;
      
      for (let i = 0; i < toDelete; i++) {
        try {
          fs.unlinkSync(fileStats[i].filePath);
          const sessionId = fileStats[i].file.replace('.json', '');
          this.cache.delete(sessionId);
          deletedCount++;
        } catch (error) {
          logger.warn(`Failed to delete ${fileStats[i].file}: ${error.message}`);
        }
      }
      
      if (deletedCount > 0) {
        logger.info(`Enforced disk limit: Deleted ${deletedCount} oldest conversation(s) (limit: ${this.maxConversationsOnDisk})`);
      }
    } catch (error) {
      logger.error(`Error enforcing disk limits: ${error.message}`);
    }
  }

  /**
   * Graceful shutdown
   */
  shutdown() {
    // Clear intervals
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    // Final save of dirty sessions only (not all)
    this.saveDirtySessions();
    
    logger.info(`ConversationStore shutdown complete (${this.cache.size} sessions in memory)`);
  }
}

export default ConversationStore;
