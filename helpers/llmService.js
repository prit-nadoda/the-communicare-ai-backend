const OpenAI = require('openai');
const config = require('../config');
const logger = require('./logger');
const { countMessagesTokens, estimateCost } = require('./tokenCounter');

/**
 * LLM Service Wrapper
 * 
 * Provides a unified interface for interacting with LLM providers (starting with OpenAI).
 * Handles API calls, error handling, token tracking, and cost estimation.
 */

/**
 * Initialize OpenAI client
 */
const createOpenAIClient = () => {
  if (!config.llm.openai.apiKey) {
    throw new Error('OpenAI API key not configured');
  }
  
  return new OpenAI({
    apiKey: config.llm.openai.apiKey,
  });
};

let openaiClient = null;

/**
 * Get or create OpenAI client
 * @returns {OpenAI} - OpenAI client instance
 */
const getOpenAIClient = () => {
  if (!openaiClient) {
    openaiClient = createOpenAIClient();
  }
  return openaiClient;
};

/**
 * Generate completion using OpenAI
 * Following OpenAI production best practices:
 * - Use official SDK
 * - Implement retries with exponential backoff
 * - Proper error handling
 * - Observability (logging)
 * 
 * @param {Object} options - Generation options
 * @param {string} options.systemPrompt - System/developer prompt
 * @param {string} options.userPrompt - User prompt
 * @param {string} options.model - Model name (optional, defaults to config)
 * @param {number} options.maxTokens - Max completion tokens (optional)
 * @param {number} options.temperature - Temperature (optional, defaults to config)
 * @param {boolean} options.jsonMode - Use JSON mode (optional, default: true)
 * @param {number} options.maxRetries - Max retry attempts (optional, default: 3)
 * @returns {Object} - { content, usage, model, generationTime, cost }
 */
const generateCompletion = async (options) => {
  const {
    systemPrompt,
    userPrompt,
    model = config.llm.openai.model,
    maxTokens = config.llm.openai.maxTokens,
    temperature = config.llm.openai.temperature,
    jsonMode = true,
    maxRetries = 3,
  } = options;
  
  let lastError;
  
  // Implement retry with exponential backoff
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const client = getOpenAIClient();
      
      // Following OpenAI best practices: use developer role for instructions
      const messages = [
        { role: 'developer', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ];
      
      // Log token usage before API call (observability)
      const estimatedTokens = countMessagesTokens(messages, model);
      logger.info(`Calling OpenAI API (attempt ${attempt + 1}/${maxRetries})`, {
        model,
        estimatedTokens,
      });
      
      const startTime = Date.now();
      
      const completionOptions = {
        model,
        messages,
      };
      
      // For gpt-5.1 and reasoning models, we need MUCH higher limits
      // because reasoning tokens count against max_completion_tokens
      // gpt-5.1 can use 4000+ tokens just for reasoning!
      if (model === 'gpt-5.1') {
        // Allow 16K tokens: ~8K reasoning + ~8K output
        completionOptions.max_completion_tokens = Math.max(maxTokens * 4, 16000);
      } else if (model.startsWith('o1')) {
        // o1 models also use reasoning tokens
        completionOptions.max_completion_tokens = Math.max(maxTokens * 3, 12000);
      } else {
        completionOptions.max_completion_tokens = maxTokens;
      }
      
      // Handle temperature based on model
      // gpt-5.1 and o1 models use FIXED temperature of 1.0
      if (model === 'gpt-5.1' || model.startsWith('o1')) {
        completionOptions.temperature = 1.0; // Fixed for reasoning models
      } else {
        completionOptions.temperature = temperature;
      }
      
      // Add reasoning effort for gpt-5.1 (configurable reasoning)
      if (model === 'gpt-5.1' && config.llm.openai.reasoningEffort) {
        completionOptions.reasoning_effort = config.llm.openai.reasoningEffort;
      }
      
      // Use structured output mode if supported (latest OpenAI feature)
      if (jsonMode) {
        completionOptions.response_format = { type: 'json_object' };
      }
      
      const completion = await client.chat.completions.create(completionOptions);
      
      const generationTime = Date.now() - startTime;
      
      // Debug: Log the full response structure
      logger.debug('OpenAI response structure:', {
        hasChoices: !!completion.choices,
        choicesLength: completion.choices?.length,
        firstChoice: completion.choices?.[0] ? {
          finishReason: completion.choices[0].finish_reason,
          hasMessage: !!completion.choices[0].message,
          messageRole: completion.choices[0].message?.role,
          hasContent: !!completion.choices[0].message?.content,
          contentLength: completion.choices[0].message?.content?.length || 0,
          hasRefusal: !!completion.choices[0].message?.refusal,
          refusalContent: completion.choices[0].message?.refusal,
        } : 'NO_CHOICE',
      });
      
      const content = completion.choices[0]?.message?.content || '';
      const refusal = completion.choices[0]?.message?.refusal;
      
      // Check for refusal
      if (refusal) {
        logger.error('OpenAI refused the request:', refusal);
        throw new Error(`OpenAI refused: ${refusal}`);
      }
      
      // Check for empty content
      if (!content || content.trim() === '') {
        logger.error('OpenAI returned empty content', {
          finishReason: completion.choices[0]?.finish_reason,
          fullResponse: JSON.stringify(completion, null, 2),
        });
        throw new Error('OpenAI returned empty content');
      }
      
      const usage = {
        prompt: completion.usage?.prompt_tokens || 0,
        completion: completion.usage?.completion_tokens || 0,
        total: completion.usage?.total_tokens || 0,
      };
      
      const cost = estimateCost(usage, model);
      
      logger.info(`OpenAI API call completed in ${generationTime}ms`, {
        model,
        tokensUsed: usage.total,
        cost: cost.totalCost,
        attempt: attempt + 1,
        contentLength: content.length,
      });
      
      return {
        content,
        usage,
        model: completion.model,
        generationTime,
        cost,
      };
    } catch (error) {
      lastError = error;
      
      // Handle specific OpenAI errors
      if (error.status === 401) {
        throw new Error('Invalid OpenAI API key');
      } else if (error.status === 429 || error.status === 503) {
        // Rate limit or service unavailable - retry with backoff
        if (attempt < maxRetries - 1) {
          const backoffMs = Math.min(1000 * Math.pow(2, attempt), 10000);
          logger.warn(`Retrying after ${backoffMs}ms due to: ${error.message}`);
          await new Promise(resolve => setTimeout(resolve, backoffMs));
          continue;
        }
        throw new Error('OpenAI API rate limit exceeded. Please try again later.');
      } else if (error.status === 500 || error.status === 502) {
        // Server error - retry
        if (attempt < maxRetries - 1) {
          const backoffMs = Math.min(1000 * Math.pow(2, attempt), 10000);
          logger.warn(`Retrying after ${backoffMs}ms due to server error`);
          await new Promise(resolve => setTimeout(resolve, backoffMs));
          continue;
        }
        throw new Error('OpenAI API server error. Please try again later.');
      } else if (error.code === 'context_length_exceeded') {
        throw new Error('Context length exceeded. Please reduce the input size.');
      }
      
      // For other errors, don't retry
      throw new Error(`LLM API error: ${error.message}`);
    }
  }
  
  throw new Error(`LLM API failed after ${maxRetries} attempts: ${lastError.message}`);
};

/**
 * Generate structured JSON output using OpenAI
 * @param {Object} options - Generation options
 * @returns {Object} - Parsed JSON response
 */
const generateStructuredOutput = async (options) => {
  const result = await generateCompletion({
    ...options,
    jsonMode: true,
  });
  
  try {
    // Clean the content - remove markdown code blocks if present
    let cleanedContent = result.content.trim();
    
    // Remove markdown json code blocks
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.replace(/^```\s*/i, '').replace(/\s*```$/, '');
    }
    
    const parsed = JSON.parse(cleanedContent);
    return {
      data: parsed,
      usage: result.usage,
      model: result.model,
      generationTime: result.generationTime,
      cost: result.cost,
    };
  } catch (error) {
    logger.error('Error parsing JSON response from LLM:', error);
    logger.error('Raw content length:', result.content?.length || 0);
    logger.error('Raw content preview:', result.content?.substring(0, 500) || 'EMPTY');
    throw new Error('Failed to parse LLM response as JSON');
  }
};

/**
 * Validate LLM configuration
 * @returns {Object} - { valid, errors }
 */
const validateConfiguration = () => {
  const errors = [];
  
  if (!config.llm.openai.apiKey) {
    errors.push('OpenAI API key is not configured');
  }
  
  if (!config.llm.openai.model) {
    errors.push('OpenAI model is not configured');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Test LLM connection
 * @returns {Object} - { success, message, model }
 */
const testConnection = async () => {
  try {
    const result = await generateCompletion({
      systemPrompt: 'You are a helpful assistant.',
      userPrompt: 'Say "Hello, connection successful!"',
      maxTokens: 50,
      temperature: 0,
    });
    
    return {
      success: true,
      message: 'Connection successful',
      model: result.model,
      content: result.content,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
      error: error.toString(),
    };
  }
};

module.exports = {
  generateCompletion,
  generateStructuredOutput,
  validateConfiguration,
  testConnection,
  getOpenAIClient,
};

