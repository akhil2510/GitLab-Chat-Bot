import { GoogleGenerativeAI } from '@google/generative-ai';
import { HfInference } from '@huggingface/inference';
import logger from '../utils/logger.js';
import config from '../config/index.js';

class EmbeddingService {
  constructor() {
    this.provider = process.env.EMBEDDING_PROVIDER || 'huggingface'; // Default to HuggingFace
    this.dimension = 768; // Standard dimension for both providers
    
    if (this.provider === 'gemini') {
      this.genAI = new GoogleGenerativeAI(config.geminiApiKey);
      this.embeddingModel = this.genAI.getGenerativeModel({ 
        model: 'embedding-001' 
      });
      logger.info('Using Gemini embeddings (768 dimensions)');
    } else {
      // HuggingFace - FREE and unlimited!
      this.hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
      // Using sentence-transformers/all-mpnet-base-v2 (768 dimensions, high quality)
      this.model = 'sentence-transformers/all-mpnet-base-v2';
      logger.info(`Using HuggingFace embeddings: ${this.model} (768 dimensions)`);
    }
  }

  /**
   * Generate single embedding
   */
  async generateEmbedding(text) {
    try {
      if (this.provider === 'gemini') {
        const result = await this.embeddingModel.embedContent(text);
        return result.embedding.values;
      } else {
        // HuggingFace
        const result = await this.hf.featureExtraction({
          model: this.model,
          inputs: text
        });
        
        // Handle different response formats
        if (Array.isArray(result)) {
          // If it's a 2D array (batch), take first item
          return Array.isArray(result[0]) ? result[0] : result;
        }
        return result;
      }
    } catch (error) {
      logger.error(`Error generating embedding with ${this.provider}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate embeddings for multiple texts with batching
   */
  async generateEmbeddings(texts) {
    const embeddings = [];
    
    if (this.provider === 'huggingface') {
      // HuggingFace can handle larger batches without rate limits
      const batchSize = 32; // Much larger batches for HF
      const delayBetweenBatches = 1000; // Just 1 second
      
      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        const batchNum = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(texts.length / batchSize);
        
        logger.info(`Processing batch ${batchNum}/${totalBatches} (${i + 1}-${Math.min(i + batchSize, texts.length)} of ${texts.length} chunks)`);
        
        // Process batch in parallel (HF can handle it)
        const batchEmbeddings = await Promise.all(
          batch.map(text => this.generateEmbedding(text))
        );
        
        embeddings.push(...batchEmbeddings);
        
        // Small delay between batches
        if (i + batchSize < texts.length) {
          await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
        }
      }
    } else {
      // Gemini - slower due to rate limits
      const batchSize = 5;
      const delayBetweenBatches = 6000;
      
      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        const batchNum = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(texts.length / batchSize);
        
        logger.info(`Processing batch ${batchNum}/${totalBatches} (${i + 1}-${Math.min(i + batchSize, texts.length)} of ${texts.length} chunks)`);
        
        // Process batch with retry logic
        const batchEmbeddings = [];
        for (const text of batch) {
          let retries = 3;
          let success = false;
          
          while (retries > 0 && !success) {
            try {
              const embedding = await this.generateEmbedding(text);
              batchEmbeddings.push(embedding);
              success = true;
              await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
              retries--;
              if (error.message.includes('429') || error.message.includes('quota')) {
                const waitTime = retries > 0 ? 30000 : 60000;
                logger.warn(`Rate limit hit. Waiting ${waitTime/1000}s before retry... (${retries} retries left)`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
              } else {
                throw error;
              }
            }
          }
          
          if (!success) {
            throw new Error('Failed to generate embedding after retries');
          }
        }
        
        embeddings.push(...batchEmbeddings);
        
        if (i + batchSize < texts.length) {
          logger.info(`Waiting ${delayBetweenBatches/1000}s before next batch...`);
          await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
        }
      }
    }
    
    return embeddings;
  }

  /**
   * Get embedding dimension
   */
  getDimension() {
    return this.dimension;
  }
}

export default EmbeddingService;
