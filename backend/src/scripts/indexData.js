import VectorStore from '../services/vectorStore.js';
import TextProcessor from '../utils/textProcessor.js';
import logger from '../utils/logger.js';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  try {
    logger.info('=== Data Indexing Started ===');
    
    // Check for LIMIT environment variable
    const maxChunks = process.env.INDEX_LIMIT ? parseInt(process.env.INDEX_LIMIT) : null;
    
    // Load scraped data
    const dataPath = path.join(__dirname, '../../../data/scraped_data.json');
    logger.info(`Loading data from: ${dataPath}`);
    
    const rawData = await fs.readFile(dataPath, 'utf-8');
    const documents = JSON.parse(rawData);
    
    logger.info(`Loaded ${documents.length} documents`);
    
    // Process documents into chunks
    logger.info(`Processing ${documents.length} documents...`);
    const textProcessor = new TextProcessor();
    const allChunks = await textProcessor.processDocuments(documents);
    
    // Limit chunks if specified (for testing / avoiding rate limits)
    const chunks = maxChunks ? allChunks.slice(0, maxChunks) : allChunks;
    
    if (maxChunks && chunks.length < allChunks.length) {
      logger.info(`⚠️  LIMITING to first ${chunks.length} chunks (out of ${allChunks.length} total)`);
      logger.info(`   To index all chunks, remove INDEX_LIMIT from .env`);
    }
    
    logger.info(`Created ${chunks.length} chunks from ${documents.length} documents`);
    logger.info(`Created ${chunks.length} chunks`);
    
    // Estimate time based on provider
    const provider = process.env.EMBEDDING_PROVIDER || 'huggingface';
    const estimatedMinutes = provider === 'huggingface' 
      ? Math.ceil(chunks.length / 32) // ~32 chunks per minute with HF
      : Math.ceil((chunks.length * 7) / 60); // ~7 seconds per chunk with Gemini
    
    logger.info(`⏱️  Estimated time: ${estimatedMinutes} minutes (using ${provider} embeddings)`);
    logger.info(`💡 Tip: Set INDEX_LIMIT=500 in .env to test with fewer chunks first`);
    
    // Initialize vector store
    const vectorStore = new VectorStore();
    await vectorStore.initialize();
    
    // Index chunks
    await vectorStore.indexChunks(chunks);
    
    // Get stats
    const stats = await vectorStore.getStats();
    logger.info('=== Indexing Complete ===');
    logger.info(`Total chunks indexed: ${stats.totalChunks}`);
    
  } catch (error) {
    logger.error(`Indexing failed: ${error.message}`);
    logger.error(error.stack);
    process.exit(1);
  }
}

main();
