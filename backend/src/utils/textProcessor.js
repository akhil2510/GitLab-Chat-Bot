import logger from '../utils/logger.js';
import config from '../config/index.js';

class TextProcessor {
  constructor(chunkSize = config.rag.chunkSize, overlap = config.rag.chunkOverlap) {
    this.chunkSize = chunkSize;
    this.overlap = overlap;
  }

  /**
   * Split text into chunks with overlap for better context preservation
   */
  chunkText(text, metadata = {}) {
    const chunks = [];
    const sentences = this.splitIntoSentences(text);
    
    let currentChunk = '';
    let currentLength = 0;
    
    for (const sentence of sentences) {
      const sentenceLength = sentence.length;
      
      if (currentLength + sentenceLength > this.chunkSize && currentChunk.length > 0) {
        chunks.push({
          text: currentChunk.trim(),
          ...metadata
        });
        
        // Add overlap by keeping last few sentences
        const overlapText = this.getOverlapText(currentChunk, this.overlap);
        currentChunk = overlapText + ' ' + sentence;
        currentLength = currentChunk.length;
      } else {
        currentChunk += ' ' + sentence;
        currentLength += sentenceLength;
      }
    }
    
    // Add final chunk
    if (currentChunk.trim().length > 0) {
      chunks.push({
        text: currentChunk.trim(),
        ...metadata
      });
    }
    
    return chunks;
  }

  /**
   * Split text into sentences (simple approach)
   */
  splitIntoSentences(text) {
    // Split on sentence boundaries
    return text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  /**
   * Get overlap text from the end of current chunk
   */
  getOverlapText(text, overlapSize) {
    if (text.length <= overlapSize) return text;
    
    const overlapText = text.slice(-overlapSize);
    // Try to start from a sentence boundary
    const sentenceStart = overlapText.indexOf('. ');
    
    return sentenceStart !== -1 
      ? overlapText.slice(sentenceStart + 2) 
      : overlapText;
  }

  /**
   * Process scraped data into chunks
   */
  async processDocuments(documents) {
    logger.info(`Processing ${documents.length} documents...`);
    
    const allChunks = [];
    let chunkId = 0;
    
    for (const doc of documents) {
      const chunks = this.chunkText(doc.content, {
        source: doc.url,
        title: doc.title,
        headings: doc.headings,
        scrapedAt: doc.scrapedAt
      });
      
      // Add unique IDs and chunk numbers
      chunks.forEach((chunk, index) => {
        allChunks.push({
          id: `chunk_${chunkId++}`,
          chunkIndex: index,
          totalChunks: chunks.length,
          ...chunk
        });
      });
      
      logger.debug(`Processed ${doc.title}: ${chunks.length} chunks`);
    }
    
    logger.info(`Created ${allChunks.length} chunks from ${documents.length} documents`);
    return allChunks;
  }

  /**
   * Clean and normalize query text
   */
  normalizeQuery(query) {
    return query
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase();
  }

  /**
   * Extract keywords from query for hybrid search
   */
  extractKeywords(query) {
    const stopwords = new Set([
      'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
      'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
      'to', 'was', 'will', 'with', 'what', 'when', 'where', 'who', 'how'
    ]);
    
    const words = query
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopwords.has(word));
    
    return [...new Set(words)];
  }
}

export default TextProcessor;
