import { GoogleGenerativeAI } from '@google/generative-ai';
import logger from '../utils/logger.js';
import config from '../config/index.js';

class LLMService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(config.geminiApiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: config.llm.model,
      generationConfig: {
        temperature: config.llm.temperature,
        maxOutputTokens: config.llm.maxTokens,
        topP: config.llm.topP
      },
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        }
      ]
    });
  }

  /**
   * Build context from retrieved chunks
   */
  buildContext(retrievedChunks) {
    if (!retrievedChunks || retrievedChunks.length === 0) {
      return '';
    }

    let context = 'Here is relevant information from GitLab\'s Handbook and Direction pages:\n\n';
    
    retrievedChunks.forEach((chunk, index) => {
      context += `[Source ${index + 1}: ${chunk.metadata.title}]\n`;
      context += `${chunk.text}\n\n`;
    });
    
    return context;
  }

  /**
   * Create system prompt with instructions and guardrails
   */
  createSystemPrompt() {
    return `You are a helpful AI assistant specialized in GitLab's Handbook and Direction pages. Your role is to help GitLab employees and aspiring employees learn about GitLab's processes, values, and strategic direction.

GUIDELINES:
1. Answer questions based ONLY on the provided context from GitLab's documentation
2. If the context doesn't contain enough information to answer the question, clearly state that
3. Always cite your sources by mentioning the relevant section or page
4. Be concise but comprehensive in your answers
5. If asked about topics outside GitLab's handbook/direction, politely redirect to relevant documentation
6. Maintain a professional and helpful tone
7. If you're uncertain, express that uncertainty rather than making up information

TRANSPARENCY:
- Always indicate which sources you're using
- If multiple sources provide conflicting information, mention that
- Distinguish between direct quotes and paraphrased information

Remember: Your knowledge is limited to GitLab's official Handbook and Direction pages. Do not make assumptions or provide information from outside these sources.`;
  }

  /**
   * Generate response with RAG
   */
  async generateResponse(query, retrievedChunks, conversationHistory = []) {
    try {
      const systemPrompt = this.createSystemPrompt();
      const context = this.buildContext(retrievedChunks);
      
      // Build the full prompt
      let fullPrompt = `${systemPrompt}\n\n${context}\n\nUser Question: ${query}\n\nAssistant:`;
      
      // Add conversation history if available
      if (conversationHistory.length > 0) {
        const historyText = conversationHistory
          .slice(-3) // Last 3 exchanges
          .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
          .join('\n');
        
        fullPrompt = `${systemPrompt}\n\nPrevious conversation:\n${historyText}\n\n${context}\n\nUser Question: ${query}\n\nAssistant:`;
      }
      
      logger.info(`Generating response for query: "${query}"`);
      
      // Generate response
      const result = await this.model.generateContent(fullPrompt);
      const response = result.response;
      const text = response.text();
      
      // Extract sources from retrieved chunks
      const sources = retrievedChunks.map((chunk, index) => ({
        id: index + 1,
        title: chunk.metadata.title,
        url: chunk.metadata.source,
        relevanceScore: chunk.score ? chunk.score.toFixed(3) : null
      }));
      
      // Check for hallucination indicators
      const confidence = this.assessConfidence(text, context);
      
      return {
        answer: text,
        sources,
        confidence,
        metadata: {
          model: config.llm.model,
          chunksRetrieved: retrievedChunks.length,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error(`Error generating response: ${error.message}`);
      throw new Error('Failed to generate response. Please try again.');
    }
  }

  /**
   * Assess response confidence based on context relevance
   */
  assessConfidence(response, context) {
    // Simple heuristic: check if response contains uncertainty phrases
    const uncertaintyPhrases = [
      'i don\'t know',
      'i\'m not sure',
      'i cannot find',
      'not mentioned',
      'doesn\'t contain',
      'no information about'
    ];
    
    const lowConfidence = uncertaintyPhrases.some(phrase => 
      response.toLowerCase().includes(phrase)
    );
    
    if (lowConfidence) {
      return 'low';
    }
    
    // Check if response is substantially longer than context (potential hallucination)
    if (response.length > context.length * 1.5) {
      return 'medium';
    }
    
    return 'high';
  }

  /**
   * Expand query for better retrieval
   */
  async expandQuery(query) {
    try {
      const prompt = `Given the following question about GitLab, generate 2-3 alternative phrasings or related questions that would help retrieve relevant information:

Question: ${query}

Alternative phrasings (one per line):`;
      
      const result = await this.model.generateContent(prompt);
      const expansions = result.response.text()
        .split('\n')
        .filter(line => line.trim().length > 0)
        .slice(0, 3);
      
      return [query, ...expansions];
    } catch (error) {
      logger.warn(`Query expansion failed: ${error.message}`);
      return [query]; // Return original query on failure
    }
  }
}

export default LLMService;
