import dotenv from 'dotenv';
dotenv.config();

const config = {
  // Server
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  
  // API Keys
  geminiApiKey: process.env.GEMINI_API_KEY,
  
  // Vector Database (Pinecone - recommended for deployment)
  pinecone: {
    apiKey: process.env.PINECONE_API_KEY,
    environment: process.env.PINECONE_ENVIRONMENT || 'gcp-starter',
    indexName: process.env.PINECONE_INDEX || 'gitlab-handbook'
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100
  },
  
  // Scraping
  scraping: {
    delayMs: parseInt(process.env.SCRAPE_DELAY_MS, 10) || 2000,
    maxConcurrent: parseInt(process.env.MAX_CONCURRENT_REQUESTS, 10) || 5,
    userAgent: process.env.USER_AGENT || 'Mozilla/5.0 (compatible; GitLabChatbot/1.0)',
    timeout: 30000
  },
  
  // GitLab URLs
  gitlab: {
    handbookUrl: 'https://handbook.gitlab.com',
    directionUrl: 'https://about.gitlab.com/direction'
  },
  
  // Cache
  cache: {
    ttl: parseInt(process.env.CACHE_TTL_SECONDS, 10) || 3600
  },
  
  // RAG Configuration
  rag: {
    chunkSize: 1000,
    chunkOverlap: 200,
    topK: 5,
    similarityThreshold: 0.7,
    maxContextLength: 8000
  },
  
  // LLM Configuration
  llm: {
    model: 'gemini-2.0-flash',
    temperature: 0.7,
    maxTokens: 2048,
    topP: 0.95
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    dir: 'logs'
  }
};

// Validation
if (!config.geminiApiKey && config.env === 'production') {
  throw new Error('GEMINI_API_KEY is required in production');
}

export default config;
