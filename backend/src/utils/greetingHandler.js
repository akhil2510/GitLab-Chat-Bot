import logger from './logger.js';

/**
 * Handle casual greetings and common conversational messages
 * Makes the chatbot feel more natural and friendly
 */

const greetingPatterns = [
  /^(hi|hello|hey|hiya|howdy|greetings|good\s+(morning|afternoon|evening|day))[\s!.?]*$/i,
  /^(what's up|whats up|sup|wassup)[\s!.?]*$/i,
  /^how\s+(are\s+you|r\s+u|are\s+ya)[\s!.?]*$/i,
  /^(thanks|thank\s+you|thx|ty|tysm|appreciate\s+it)[\s!.?]*$/i,
  /^(bye|goodbye|see\s+ya|see\s+you|cya|later|farewell)[\s!.?]*$/i,
  /^(ok|okay|cool|got\s+it|understood|alright|sounds\s+good)[\s!.?]*$/i,
  /^(help|what\s+can\s+you\s+do|how\s+do\s+i\s+use|commands)[\s!.?]*$/i
];

const greetingResponses = {
  greetings: [
    "Hi there! 👋 I'm here to help you learn about GitLab's Handbook and Direction. What would you like to know?",
    "Hello! I'm your GitLab AI Assistant. I can answer questions about GitLab's values, processes, and strategic direction. How can I help you today?",
    "Hey! Welcome! Ask me anything about GitLab's Handbook or Direction pages.",
    "Hi! I'm specialized in GitLab's documentation. What questions do you have about GitLab?"
  ],
  
  whatsup: [
    "I'm ready to help you explore GitLab's Handbook! What would you like to know?",
    "All systems running smoothly! I'm here to answer your GitLab questions. What can I help you with?",
    "Ready to assist! Ask me about GitLab's values, processes, or strategic direction."
  ],
  
  howareyou: [
    "I'm doing great, thanks for asking! 😊 More importantly, how can I help you learn about GitLab today?",
    "I'm functioning perfectly and excited to help! What GitLab topics are you interested in?",
    "I'm excellent! Ready to answer your questions about GitLab. What would you like to know?"
  ],
  
  thanks: [
    "You're welcome! Happy to help! Feel free to ask if you have more questions. 😊",
    "My pleasure! Don't hesitate to ask if you need anything else about GitLab!",
    "Glad I could help! Let me know if you have any other questions.",
    "Anytime! I'm here whenever you need information about GitLab."
  ],
  
  goodbye: [
    "Goodbye! Feel free to come back anytime you have questions about GitLab! 👋",
    "See you later! Don't hesitate to return if you need more information about GitLab.",
    "Take care! I'll be here whenever you need help with GitLab documentation.",
    "Bye! Hope I was helpful. Come back anytime!"
  ],
  
  acknowledgment: [
    "Great! Let me know if you need anything else about GitLab! 😊",
    "Perfect! I'm here if you have more questions.",
    "Awesome! Feel free to ask if you need more information."
  ],
  
  help: [
    "I'm your GitLab AI Assistant! 🦊\n\nI can help you with:\n• GitLab's values and culture\n• Handbook processes and policies\n• Product direction and strategy\n• Team structure and workflows\n• Remote work practices\n• Contribution guidelines\n\nJust ask me a question like:\n• 'What are GitLab's core values?'\n• 'How does GitLab handle remote work?'\n• 'What is GitLab's product direction?'\n\nWhat would you like to know?",
    "Here's what I can do! 🚀\n\nI specialize in GitLab's Handbook and Direction pages. Ask me about:\n✓ Company values & culture\n✓ Processes & best practices\n✓ Product strategy & roadmap\n✓ Team collaboration & remote work\n✓ Engineering practices\n\nTry asking: 'Tell me about GitLab's values' or 'How does code review work at GitLab?'\n\nWhat interests you?"
  ]
};

/**
 * Check if query is a casual greeting/message
 * @param {string} query - User query
 * @returns {object|null} - Greeting response or null
 */
export function handleGreeting(query) {
  if (!query || typeof query !== 'string') {
    return null;
  }

  const trimmedQuery = query.trim();
  
  // Too long to be a greeting
  if (trimmedQuery.length > 100) {
    return null;
  }

  // Check each pattern
  if (greetingPatterns[0].test(trimmedQuery)) {
    return createGreetingResponse('greetings', trimmedQuery);
  }
  
  if (greetingPatterns[1].test(trimmedQuery)) {
    return createGreetingResponse('whatsup', trimmedQuery);
  }
  
  if (greetingPatterns[2].test(trimmedQuery)) {
    return createGreetingResponse('howareyou', trimmedQuery);
  }
  
  if (greetingPatterns[3].test(trimmedQuery)) {
    return createGreetingResponse('thanks', trimmedQuery);
  }
  
  if (greetingPatterns[4].test(trimmedQuery)) {
    return createGreetingResponse('goodbye', trimmedQuery);
  }
  
  if (greetingPatterns[5].test(trimmedQuery)) {
    return createGreetingResponse('acknowledgment', trimmedQuery);
  }
  
  if (greetingPatterns[6].test(trimmedQuery)) {
    return createGreetingResponse('help', trimmedQuery);
  }

  return null;
}

/**
 * Create greeting response object
 */
function createGreetingResponse(type, originalQuery) {
  const responses = greetingResponses[type];
  const answer = responses[Math.floor(Math.random() * responses.length)];
  
  logger.info(`Handled greeting/casual message: "${originalQuery}" -> ${type}`);
  
  return {
    answer,
    sources: [],
    confidence: 'greeting', // Special confidence type
    metadata: {
      isGreeting: true,
      greetingType: type,
      timestamp: new Date().toISOString()
    },
    processingTimeMs: 5 // Instant response
  };
}

/**
 * Check if query is too short/generic (might need greeting handling)
 */
export function isTooGeneric(query) {
  if (!query || typeof query !== 'string') {
    return false;
  }
  
  const trimmed = query.trim();
  
  // Single word queries (except specific ones)
  if (trimmed.split(/\s+/).length === 1 && trimmed.length < 15) {
    return !['gitlab', 'handbook', 'values', 'remote', 'culture'].includes(trimmed.toLowerCase());
  }
  
  return false;
}

export default {
  handleGreeting,
  isTooGeneric
};
