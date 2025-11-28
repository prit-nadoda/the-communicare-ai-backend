const Joi = require('joi');

/**
 * Assessment Validation Schemas
 */

// Question types enum
const QUESTION_TYPES = [
  'long_text',
  'single_choice',
  'multi_choice',
  'numeric',
  'rating_likert',
  'rating_numeric',
  'rating_slider',
  'rating_frequency',
];

// Severity levels enum
const SEVERITY_LEVELS = ['low', 'moderate', 'high'];

// Question option schema
const questionOptionSchema = Joi.object({
  id: Joi.string().required(),
  label: Joi.string().required(),
  value: Joi.any().required(),
});

// Condition schema
const conditionSchema = Joi.object({
  questionId: Joi.string().required(),
  operator: Joi.string().valid('equals', 'not_equals', 'contains', 'greater_than', 'less_than').required(),
  value: Joi.any().required(),
});

// Question schema
const questionSchema = Joi.object({
  id: Joi.string().required(),
  type: Joi.string().valid(...QUESTION_TYPES).required(),
  label: Joi.string().required(),
  description: Joi.string().optional().allow('', null),
  required: Joi.boolean().default(true),
  options: Joi.array().items(questionOptionSchema).optional(),
  min: Joi.number().optional().allow(null),
  max: Joi.number().optional().allow(null),
  step: Joi.number().optional().allow(null),
  conditions: Joi.array().items(conditionSchema).optional(),
});

// Generate assessment schema
const generateAssessmentSchema = Joi.object({
  healthConcernId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required()
    .messages({
      'string.pattern.base': 'Invalid health concern ID format',
    }),
});

// Answer schema for response submission
const answerSchema = Joi.object({
  questionId: Joi.string().required(),
  questionType: Joi.string().valid(...QUESTION_TYPES).required(),
  value: Joi.alternatives().try(
    Joi.string(),
    Joi.number(),
    Joi.boolean(),
    Joi.array().items(Joi.string()),
    Joi.array().items(Joi.number())
  ).required(),
});

// Submit assessment response schema
const submitAssessmentResponseSchema = Joi.object({
  assessmentId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required()
    .messages({
      'string.pattern.base': 'Invalid assessment ID format',
    }),
  answers: Joi.array().items(answerSchema).min(1).required()
    .messages({
      'array.min': 'At least one answer is required',
    }),
  notes: Joi.string().optional().allow('', null),
});

// Get assessment history query schema
const getAssessmentHistorySchema = Joi.object({
  healthConcernId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional()
    .messages({
      'string.pattern.base': 'Invalid health concern ID format',
    }),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  includeResponses: Joi.boolean().default(true),
});

// Assessment ID parameter schema
const assessmentIdParamSchema = Joi.object({
  assessmentId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required()
    .messages({
      'string.pattern.base': 'Invalid assessment ID format',
    }),
});

// Response ID parameter schema
const responseIdParamSchema = Joi.object({
  responseId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required()
    .messages({
      'string.pattern.base': 'Invalid response ID format',
    }),
});

/**
 * Validate answer against question definition
 * @param {Object} answer - Answer object
 * @param {Object} question - Question definition
 * @returns {Object} - { valid, error }
 */
const validateAnswer = (answer, question) => {
  // Check question ID match
  if (answer.questionId !== question.id) {
    return { valid: false, error: 'Answer question ID does not match' };
  }
  
  // Check type match
  if (answer.questionType !== question.type) {
    return { valid: false, error: `Answer type mismatch for question ${question.id}` };
  }
  
  // Validate based on question type
  switch (question.type) {
    case 'long_text':
      if (typeof answer.value !== 'string') {
        return { valid: false, error: `Answer for ${question.id} must be a string` };
      }
      if (question.required && !answer.value.trim()) {
        return { valid: false, error: `Answer for ${question.id} is required` };
      }
      break;
      
    case 'single_choice':
      if (typeof answer.value !== 'string') {
        return { valid: false, error: `Answer for ${question.id} must be a single option` };
      }
      if (question.options) {
        const validOptions = question.options.map(opt => String(opt.value));
        if (!validOptions.includes(String(answer.value))) {
          return { valid: false, error: `Invalid option for ${question.id}` };
        }
      }
      break;
      
    case 'multi_choice':
      if (!Array.isArray(answer.value)) {
        return { valid: false, error: `Answer for ${question.id} must be an array` };
      }
      if (question.required && answer.value.length === 0) {
        return { valid: false, error: `At least one option required for ${question.id}` };
      }
      if (question.options) {
        const validOptions = question.options.map(opt => String(opt.value));
        for (const val of answer.value) {
          if (!validOptions.includes(String(val))) {
            return { valid: false, error: `Invalid option in ${question.id}` };
          }
        }
      }
      break;
      
    case 'numeric':
    case 'rating_numeric':
      if (typeof answer.value !== 'number') {
        return { valid: false, error: `Answer for ${question.id} must be a number` };
      }
      if (question.min !== null && question.min !== undefined && answer.value < question.min) {
        return { valid: false, error: `Answer for ${question.id} must be at least ${question.min}` };
      }
      if (question.max !== null && question.max !== undefined && answer.value > question.max) {
        return { valid: false, error: `Answer for ${question.id} must be at most ${question.max}` };
      }
      break;
      
    case 'rating_likert':
    case 'rating_frequency':
      if (typeof answer.value !== 'string') {
        return { valid: false, error: `Answer for ${question.id} must be a string option` };
      }
      if (question.options) {
        const validOptions = question.options.map(opt => String(opt.value));
        if (!validOptions.includes(String(answer.value))) {
          return { valid: false, error: `Invalid rating for ${question.id}` };
        }
      }
      break;
      
    case 'rating_slider':
      if (typeof answer.value !== 'number') {
        return { valid: false, error: `Answer for ${question.id} must be a number` };
      }
      if (question.min !== null && question.min !== undefined && answer.value < question.min) {
        return { valid: false, error: `Slider value for ${question.id} must be at least ${question.min}` };
      }
      if (question.max !== null && question.max !== undefined && answer.value > question.max) {
        return { valid: false, error: `Slider value for ${question.id} must be at most ${question.max}` };
      }
      break;
      
    default:
      return { valid: false, error: `Unknown question type: ${question.type}` };
  }
  
  return { valid: true };
};

/**
 * Validate all answers against assessment questions
 * @param {Array} answers - Array of answer objects
 * @param {Array} questions - Array of question definitions
 * @returns {Object} - { valid, errors }
 */
const validateAnswers = (answers, questions) => {
  const errors = [];
  const answeredQuestionIds = new Set(answers.map(a => a.questionId));
  
  // Check all required questions are answered
  for (const question of questions) {
    if (question.required && !answeredQuestionIds.has(question.id)) {
      errors.push(`Required question not answered: ${question.id}`);
    }
  }
  
  // Validate each answer
  for (const answer of answers) {
    const question = questions.find(q => q.id === answer.questionId);
    
    if (!question) {
      errors.push(`Answer provided for unknown question: ${answer.questionId}`);
      continue;
    }
    
    const validation = validateAnswer(answer, question);
    if (!validation.valid) {
      errors.push(validation.error);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};

module.exports = {
  generateAssessmentSchema,
  submitAssessmentResponseSchema,
  getAssessmentHistorySchema,
  assessmentIdParamSchema,
  responseIdParamSchema,
  questionSchema,
  answerSchema,
  validateAnswer,
  validateAnswers,
  QUESTION_TYPES,
  SEVERITY_LEVELS,
};

