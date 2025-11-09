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

CRITICAL ANTI-HALLUCINATION RULES:
1. Answer ONLY using information from the provided sources below
2. Do NOT use any external knowledge or assumptions about GitLab
3. If the sources don't contain the answer, respond: "I don't have information about that in the available GitLab documentation. Please check [suggest relevant section]."
4. When making claims, include direct quotes from sources using quotation marks
5. Reference sources by number: [Source 1], [Source 2], etc.

GUIDELINES:
1. Stay strictly within the provided context
2. If uncertain, say so explicitly - NEVER guess
3. Cite sources for every major claim
4. Be concise but comprehensive
5. If asked about topics outside GitLab's handbook/direction, say: "This topic isn't covered in my knowledge base."
6. Maintain a professional and helpful tone

REQUIRED FORMAT:
- Start with a direct answer based on sources
- Include relevant quotes: "According to [Source X]: 'direct quote...'"
- End with source references

TRANSPARENCY:
- Always indicate which sources you're using
- If multiple sources provide conflicting information, mention that explicitly
- Distinguish between direct quotes and paraphrased information
- If you're paraphrasing, indicate: "Based on [Source X]..."

Remember: Accuracy over completeness. It's better to say "I don't know" than to make up information.`;
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
    const lowerResponse = response.toLowerCase();
    const lowerContext = context.toLowerCase();
    
    // Check for explicit uncertainty phrases
    const uncertaintyPhrases = [
      'i don\'t know',
      'i\'m not sure',
      'i cannot find',
      'not mentioned',
      'doesn\'t contain',
      'no information about',
      'i don\'t have information'
    ];
    
    const hasUncertainty = uncertaintyPhrases.some(phrase => 
      lowerResponse.includes(phrase)
    );
    
    if (hasUncertainty) {
      return 'low';
    }
    
    // Check for hallucination indicators
    // 1. Response much longer than context (making up details)
    if (response.length > context.length * 1.5) {
      logger.warn('Potential hallucination: Response significantly longer than context');
      return 'medium';
    }
    
    // 2. Check if response contains source citations
    const hasCitations = /\[source \d+\]/i.test(lowerResponse) || 
                        /".*?"/i.test(response); // Has quotes
    
    if (!hasCitations && context.length > 0) {
      logger.warn('Potential hallucination: No citations in response despite available context');
      return 'medium';
    }
    
    // 3. Extract key claims from response and verify against context
    const verificationScore = this.verifyClaimsInContext(response, context);
    
    if (verificationScore < 0.5) {
      logger.warn(`Potential hallucination: Low verification score (${verificationScore.toFixed(2)})`);
      return 'low';
    } else if (verificationScore < 0.8) {
      return 'medium';
    }
    
    return 'high';
  }

  /**
   * Verify if response claims exist in context
   */
  verifyClaimsInContext(response, context) {
    // Extract sentences from response (simple split by period)
    const sentences = response.split(/[.!?]/).filter(s => s.trim().length > 20);
    
    if (sentences.length === 0) return 1.0;
    
    let verifiedCount = 0;
    const contextLower = context.toLowerCase();
    
    sentences.forEach(sentence => {
      // Extract meaningful words (3+ chars, not common words)
      const words = sentence.toLowerCase()
        .split(/\s+/)
        .filter(w => w.length > 3 && !['this', 'that', 'with', 'from', 'have', 'been'].includes(w));
      
      // Check if significant portion of words exist in context
      const matchingWords = words.filter(w => contextLower.includes(w));
      const matchRatio = words.length > 0 ? matchingWords.length / words.length : 0;
      
      if (matchRatio > 0.5) {
        verifiedCount++;
      }
    });
    
    return sentences.length > 0 ? verifiedCount / sentences.length : 1.0;
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
