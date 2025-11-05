import VectorStore from './vectorStore.js';
import LLMService from './llm.js';
import TextProcessor from '../utils/textProcessor.js';
import logger from '../utils/logger.js';
import config from '../config/index.js';
import NodeCache from 'node-cache';

class RAGService {
  constructor() {
    this.vectorStore = new VectorStore();
    this.llmService = new LLMService();
    this.textProcessor = new TextProcessor();
    this.cache = new NodeCache({ stdTTL: config.cache.ttl });
    this.conversationStore = new Map(); // In-memory conversation storage
  }

  async initialize() {
    await this.vectorStore.initialize();
    logger.info('RAG Service initialized');
  }

  /**
   * Generate cache key for queries
   */
  getCacheKey(query, sessionId = null) {
    const normalizedQuery = this.textProcessor.normalizeQuery(query);
    return sessionId ? `${sessionId}:${normalizedQuery}` : normalizedQuery;
  }

  /**
   * Retrieve relevant context using hybrid approach
   */
  async retrieveContext(query, topK = config.rag.topK) {
    try {
      // Check cache first
      const cacheKey = this.getCacheKey(query);
      const cachedResults = this.cache.get(cacheKey);
      
      if (cachedResults) {
        logger.info('Retrieved results from cache');
        return cachedResults;
      }
      
      // Perform vector search
      const results = await this.vectorStore.search(query, topK);
      
      // Filter by similarity threshold
      const filteredResults = results.filter(
        result => !result.score || result.score >= config.rag.similarityThreshold
      );
      
      // Cache results
      this.cache.set(cacheKey, filteredResults);
      
      logger.info(`Retrieved ${filteredResults.length} relevant chunks`);
      return filteredResults;
    } catch (error) {
      logger.error(`Error retrieving context: ${error.message}`);
      throw error;
    }
  }

  /**
   * Rerank retrieved results for better relevance
   */
  rerankResults(results, query) {
    const keywords = this.textProcessor.extractKeywords(query);
    
    return results.map(result => {
      let boostScore = 0;
      
      // Boost if title matches keywords
      keywords.forEach(keyword => {
        if (result.metadata.title.toLowerCase().includes(keyword)) {
          boostScore += 0.1;
        }
      });
      
      // Boost recent content slightly
      const scrapedDate = new Date(result.metadata.scrapedAt);
      const daysSince = (Date.now() - scrapedDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < 30) {
        boostScore += 0.05;
      }
      
      return {
        ...result,
        finalScore: (result.score || 0) + boostScore
      };
    }).sort((a, b) => b.finalScore - a.finalScore);
  }

  /**
   * Main query processing with RAG
   */
  async query(userQuery, sessionId = null, useQueryExpansion = false) {
    try {
      const startTime = Date.now();
      
      logger.info(`Processing query: "${userQuery}" [session: ${sessionId}]`);
      
      // Normalize query
      const normalizedQuery = this.textProcessor.normalizeQuery(userQuery);
      
      // Optional: Query expansion for better retrieval
      let queries = [normalizedQuery];
      if (useQueryExpansion) {
        queries = await this.llmService.expandQuery(normalizedQuery);
        logger.info(`Expanded query into ${queries.length} variations`);
      }
      
      // Retrieve context from all query variations
      const allResults = [];
      for (const query of queries) {
        const results = await this.retrieveContext(query, config.rag.topK);
        allResults.push(...results);
      }
      
      // Deduplicate by chunk ID
      const uniqueResults = Array.from(
        new Map(allResults.map(r => [r.id, r])).values()
      );
      
      // Rerank results
      const rerankedResults = this.rerankResults(uniqueResults, normalizedQuery);
      const topResults = rerankedResults.slice(0, config.rag.topK);
      
      // Get conversation history
      const conversationHistory = this.getConversationHistory(sessionId);
      
      // Generate response
      const response = await this.llmService.generateResponse(
        userQuery,
        topResults,
        conversationHistory
      );
      
      // Store in conversation history
      this.addToConversationHistory(sessionId, {
        role: 'user',
        content: userQuery
      });
      this.addToConversationHistory(sessionId, {
        role: 'assistant',
        content: response.answer
      });
      
      const processingTime = Date.now() - startTime;
      
      logger.info(`Query processed in ${processingTime}ms`);
      
      return {
        ...response,
        query: userQuery,
        processingTimeMs: processingTime,
        sessionId
      };
    } catch (error) {
      logger.error(`Error processing query: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get conversation history for a session
   */
  getConversationHistory(sessionId) {
    if (!sessionId) return [];
    return this.conversationStore.get(sessionId) || [];
  }

  /**
   * Add message to conversation history
   */
  addToConversationHistory(sessionId, message) {
    if (!sessionId) return;
    
    const history = this.conversationStore.get(sessionId) || [];
    history.push({
      ...message,
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 10 messages
    if (history.length > 10) {
      history.shift();
    }
    
    this.conversationStore.set(sessionId, history);
  }

  /**
   * Clear conversation history
   */
  clearConversationHistory(sessionId) {
    this.conversationStore.delete(sessionId);
    logger.info(`Cleared conversation history for session: ${sessionId}`);
  }

  /**
   * Get system statistics
   */
  async getStats() {
    const vectorStats = await this.vectorStore.getStats();
    const cacheStats = this.cache.getStats();
    
    return {
      vectorStore: vectorStats,
      cache: {
        keys: cacheStats.keys,
        hits: cacheStats.hits,
        misses: cacheStats.misses,
        hitRate: cacheStats.hits / (cacheStats.hits + cacheStats.misses) || 0
      },
      activeSessions: this.conversationStore.size
    };
  }
}

export default RAGService;
