const { encoding_for_model } = require('tiktoken');
const logger = require('./logger');

/**
 * Token Counter Utility
 * 
 * Uses tiktoken to count tokens for OpenAI models and optimize prompts.
 */

// Cache encodings to avoid recreating them
const encodingCache = new Map();

/**
 * Get encoding for a specific model
 * Latest models (gpt-5.x, gpt-4.5, o1) use o200k_base encoding
 * @param {string} model - Model name
 * @returns {Encoding} - Tiktoken encoding
 */
const getEncoding = (model) => {
  if (encodingCache.has(model)) {
    return encodingCache.get(model);
  }
  
  try {
    const encoding = encoding_for_model(model);
    encodingCache.set(model, encoding);
    return encoding;
  } catch (error) {
    // Fallback to o200k_base encoding (used by latest models)
    // This is expected for new models like gpt-5.1 that aren't in tiktoken yet
    logger.debug(`Using o200k_base encoding for model ${model}`);
    const { get_encoding } = require('tiktoken');
    if (!encodingCache.has('o200k_base')) {
      const encoding = get_encoding('o200k_base');
      encodingCache.set('o200k_base', encoding);
    }
    return encodingCache.get('o200k_base');
  }
};

/**
 * Count tokens in a string
 * @param {string} text - Text to count tokens for
 * @param {string} model - Model name (default: gpt-4o)
 * @returns {number} - Token count
 */
const countTokens = (text, model = 'gpt-4o') => {
  if (!text || typeof text !== 'string') return 0;
  
  try {
    const encoding = getEncoding(model);
    const tokens = encoding.encode(text);
    return tokens.length;
  } catch (error) {
    logger.error('Error counting tokens:', error);
    // Rough estimate: ~4 characters per token
    return Math.ceil(text.length / 4);
  }
};

/**
 * Count tokens for an array of messages (chat format)
 * @param {Array} messages - Array of message objects with role and content
 * @param {string} model - Model name
 * @returns {number} - Total token count
 */
const countMessagesTokens = (messages, model = 'gpt-4o') => {
  if (!Array.isArray(messages) || messages.length === 0) return 0;
  
  try {
    const encoding = getEncoding(model);
    let totalTokens = 0;
    
    // Overhead per message (varies by model)
    const tokensPerMessage = 3; // Approximate for GPT-4o
    const tokensPerName = 1;
    
    for (const message of messages) {
      totalTokens += tokensPerMessage;
      
      if (message.role) {
        totalTokens += encoding.encode(message.role).length;
      }
      
      if (message.content) {
        totalTokens += encoding.encode(message.content).length;
      }
      
      if (message.name) {
        totalTokens += tokensPerName;
        totalTokens += encoding.encode(message.name).length;
      }
    }
    
    // Every reply is primed with assistant message
    totalTokens += 3;
    
    return totalTokens;
  } catch (error) {
    logger.error('Error counting message tokens:', error);
    // Rough estimate
    const totalText = messages.map(m => m.content || '').join(' ');
    return Math.ceil(totalText.length / 4);
  }
};

/**
 * Optimize context by truncating if needed
 * @param {string} context - Context string
 * @param {number} maxTokens - Maximum allowed tokens
 * @param {string} model - Model name
 * @returns {Object} - { text, tokenCount, wasTruncated }
 */
const optimizeContext = (context, maxTokens, model = 'gpt-4o') => {
  if (!context || typeof context !== 'string') {
    return { text: '', tokenCount: 0, wasTruncated: false };
  }
  
  const originalTokenCount = countTokens(context, model);
  
  if (originalTokenCount <= maxTokens) {
    return {
      text: context,
      tokenCount: originalTokenCount,
      wasTruncated: false,
    };
  }
  
  try {
    const encoding = getEncoding(model);
    const tokens = encoding.encode(context);
    const truncatedTokens = tokens.slice(0, maxTokens);
    const truncatedText = new TextDecoder().decode(encoding.decode(truncatedTokens));
    
    logger.warn(`Context truncated from ${originalTokenCount} to ${maxTokens} tokens`);
    
    return {
      text: truncatedText + '\n\n[Context truncated due to length...]',
      tokenCount: maxTokens,
      wasTruncated: true,
      originalTokenCount,
    };
  } catch (error) {
    logger.error('Error optimizing context:', error);
    // Rough character-based truncation as fallback
    const charLimit = Math.floor(maxTokens * 4);
    return {
      text: context.substring(0, charLimit) + '\n\n[Context truncated due to length...]',
      tokenCount: maxTokens,
      wasTruncated: true,
    };
  }
};

/**
 * Estimate cost for token usage
 * Using latest OpenAI pricing (as of late 2024/early 2025)
 * @param {Object} usage - Token usage object { prompt, completion, total }
 * @param {string} model - Model name
 * @returns {Object} - Cost breakdown
 */
const estimateCost = (usage, model = 'gpt-5.1') => {
  // Latest pricing per 1M tokens
  // Reference: https://openai.com/api/pricing/
  const pricing = {
    // GPT-5.1 Family (newest flagship models)
    'gpt-5.1': { input: 3.00, output: 12.00 }, // Flagship model for agentic tasks
    // GPT-4.x models
    'gpt-4.5-turbo': { input: 2.00, output: 8.00 },
    'chatgpt-4o-latest': { input: 5.00, output: 15.00 },
    'o1': { input: 15.00, output: 60.00 }, // Reasoning model
    'o1-mini': { input: 3.00, output: 12.00 }, // Reasoning model (smaller)
    // Older models
    'gpt-4o': { input: 2.50, output: 10.00 },
    'gpt-4o-mini': { input: 0.150, output: 0.600 },
    'gpt-4-turbo': { input: 10.00, output: 30.00 },
    'gpt-4': { input: 30.00, output: 60.00 },
  };
  
  const modelPricing = pricing[model] || pricing['gpt-5.1'];
  
  const inputCost = (usage.prompt / 1_000_000) * modelPricing.input;
  const outputCost = (usage.completion / 1_000_000) * modelPricing.output;
  
  return {
    inputCost: parseFloat(inputCost.toFixed(6)),
    outputCost: parseFloat(outputCost.toFixed(6)),
    totalCost: parseFloat((inputCost + outputCost).toFixed(6)),
    currency: 'USD',
    model,
  };
};

/**
 * Calculate remaining tokens available for completion
 * @param {Array} messages - Messages array
 * @param {string} model - Model name
 * @param {number} modelMaxTokens - Model's maximum context window
 * @returns {number} - Tokens available for completion
 */
const getRemainingTokens = (messages, model = 'gpt-4o', modelMaxTokens = 128000) => {
  const usedTokens = countMessagesTokens(messages, model);
  return Math.max(0, modelMaxTokens - usedTokens);
};

/**
 * Free encoding resources
 */
const cleanup = () => {
  for (const [model, encoding] of encodingCache.entries()) {
    try {
      encoding.free();
    } catch (error) {
      logger.error(`Error freeing encoding for ${model}:`, error);
    }
  }
  encodingCache.clear();
};

// Cleanup on process exit
process.on('exit', cleanup);
process.on('SIGINT', () => {
  cleanup();
  process.exit();
});

module.exports = {
  countTokens,
  countMessagesTokens,
  optimizeContext,
  estimateCost,
  getRemainingTokens,
  cleanup,
};

