import { Pinecone } from '@pinecone-database/pinecone';
import logger from '../utils/logger.js';
import config from '../config/index.js';
import EmbeddingService from './embeddings.js';

class VectorStore {
  constructor() {
    this.pinecone = null;
    this.index = null;
    this.embeddingService = new EmbeddingService();
    this.dimension = this.embeddingService.getDimension();
  }

  async initialize() {
    try {
      if (!config.pinecone.apiKey) {
        logger.warn('Pinecone API key not found. Vector search will be limited.');
        return false;
      }

      // Initialize Pinecone client
      this.pinecone = new Pinecone({
        apiKey: config.pinecone.apiKey
      });
      
      logger.info('Pinecone client initialized');
      
      // Get or create index
      const indexList = await this.pinecone.listIndexes();
      const indexExists = indexList.indexes?.some(
        idx => idx.name === config.pinecone.indexName
      );
      
      if (!indexExists) {
        logger.info(`Creating Pinecone index: ${config.pinecone.indexName}`);
        await this.pinecone.createIndex({
          name: config.pinecone.indexName,
          dimension: this.dimension,
          metric: 'cosine',
          spec: {
            serverless: {
              cloud: 'aws',
              region: 'us-east-1'
            }
          }
        });
        
        // Wait for index to be ready
        await new Promise(resolve => setTimeout(resolve, 60000)); // 60s wait
        logger.info('Index created and ready');
      }
      
      this.index = this.pinecone.index(config.pinecone.indexName);
      logger.info(`Using Pinecone index: ${config.pinecone.indexName}`);
      
      return true;
    } catch (error) {
      logger.error(`Failed to initialize Pinecone: ${error.message}`);
      logger.warn('Continuing without vector search capability');
      return false;
    }
  }

  /**
   * Generate embeddings using configured embedding service
   */
  async generateEmbedding(text) {
    return await this.embeddingService.generateEmbedding(text);
  }

  /**
   * Generate embeddings for multiple texts
   */
  async generateEmbeddings(texts) {
    return await this.embeddingService.generateEmbeddings(texts);
  }

  /**
   * Index chunks into Pinecone
   */
  async indexChunks(chunks) {
    try {
      if (!this.index) {
        logger.error('Pinecone index not initialized');
        throw new Error('Vector store not initialized');
      }

      logger.info(`Indexing ${chunks.length} chunks...`);
      
      if (chunks.length === 0) {
        logger.warn('No chunks to index');
        return;
      }
      
      // Extract texts
      const documents = chunks.map(chunk => chunk.text);
      
      // Generate embeddings
      logger.info('Generating embeddings...');
      const embeddings = await this.generateEmbeddings(documents);
      
      // Prepare vectors for Pinecone
      const vectors = chunks.map((chunk, index) => ({
        id: chunk.id,
        values: embeddings[index],
        metadata: {
          text: chunk.text.substring(0, 40000), // Pinecone metadata limit
          source: chunk.source,
          title: chunk.title,
          chunkIndex: chunk.chunkIndex,
          totalChunks: chunk.totalChunks,
          scrapedAt: chunk.scrapedAt
        }
      }));
      
      // Upsert in batches (Pinecone limit: 100 vectors per request)
      const upsertBatchSize = 100;
      for (let i = 0; i < vectors.length; i += upsertBatchSize) {
        const batch = vectors.slice(i, i + upsertBatchSize);
        
        await this.index.upsert(batch);
        
        logger.info(`Indexed ${Math.min(i + upsertBatchSize, vectors.length)}/${vectors.length} chunks`);
      }
      
      logger.info('Indexing complete!');
    } catch (error) {
      logger.error(`Error indexing chunks: ${error.message}`);
      throw error;
    }
  }

  /**
   * Search for similar chunks
   */
  async search(query, topK = config.rag.topK) {
    try {
      if (!this.index) {
        logger.warn('Vector search not available');
        return [];
      }

      // Generate query embedding
      const queryEmbedding = await this.generateEmbedding(query);
      
      // Search in Pinecone
      const results = await this.index.query({
        vector: queryEmbedding,
        topK: topK,
        includeMetadata: true
      });
      
      // Format results
      const formattedResults = results.matches.map(match => ({
        text: match.metadata.text,
        metadata: {
          source: match.metadata.source,
          title: match.metadata.title,
          chunkIndex: match.metadata.chunkIndex,
          totalChunks: match.metadata.totalChunks,
          scrapedAt: match.metadata.scrapedAt
        },
        score: match.score,
        id: match.id
      }));
      
      return formattedResults;
    } catch (error) {
      logger.error(`Error searching vector store: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get collection statistics
   */
  async getStats() {
    try {
      if (!this.index) {
        return { 
          totalChunks: 0, 
          indexName: 'Not initialized',
          error: 'Vector store not initialized'
        };
      }

      const stats = await this.index.describeIndexStats();
      
      return {
        totalChunks: stats.totalRecordCount || 0,
        indexName: config.pinecone.indexName,
        dimension: stats.dimension || this.dimension
      };
    } catch (error) {
      logger.error(`Error getting stats: ${error.message}`);
      return { totalChunks: 0, error: error.message };
    }
  }

  /**
   * Delete index (for resetting)
   */
  async deleteIndex() {
    try {
      if (!this.pinecone) {
        logger.warn('Pinecone not initialized');
        return;
      }

      await this.pinecone.deleteIndex(config.pinecone.indexName);
      logger.info(`Deleted index: ${config.pinecone.indexName}`);
    } catch (error) {
      logger.error(`Error deleting index: ${error.message}`);
      throw error;
    }
  }
}

export default VectorStore;
