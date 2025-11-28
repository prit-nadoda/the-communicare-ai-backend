const Assessment = require('./assessment.model');
const AssessmentResponse = require('./assessmentResponse.model');
const HealthConcern = require('../healthConcern/healthConcern.model');
const Patient = require('../patient/patient.model');
const User = require('../user/user.model');
const { buildAssessmentContext } = require('../../../helpers/toonContext');
const { generateStructuredOutput } = require('../../../helpers/llmService');
const { countTokens, optimizeContext } = require('../../../helpers/tokenCounter');
const { 
  ASSESSMENT_GENERATION_SYSTEM_PROMPT, 
  createAssessmentGenerationUserPrompt,
  PROMPT_VERSION,
  TOKEN_BUDGET,
  MODEL_CONFIG,
} = require('./prompts/assessmentGeneration');
const { validateAnswers } = require('./assessment.validation');
const { createNotFoundError, createBadRequestError, createConflictError } = require('../../../middlewares/error.middleware');
const MESSAGES = require('../../../constants/messages');
const RESPONSE_TAGS = require('../../../constants/responseTags');
const config = require('../../../config');
const logger = require('../../../helpers/logger');

/**
 * Assessment Service
 */
const assessmentService = {
  /**
   * Generate a new assessment for a health concern
   * @param {string} userId - User ID
   * @param {string} healthConcernId - Health concern ID
   * @returns {Object} - Generated assessment
   */
  async generateAssessment(userId, healthConcernId) {
    try {
      // 1. Check if user can generate new assessment (cooldown enforcement)
      const cooldownCheck = await Assessment.canGenerateNewAssessment(userId, healthConcernId);
      
      if (!cooldownCheck.allowed) {
        throw createConflictError(
          cooldownCheck.reason,
          RESPONSE_TAGS.VALIDATION.COOLDOWN_NOT_MET
        );
      }
      
      // 2. Fetch health concern details
      const healthConcern = await HealthConcern.findOne({
        _id: healthConcernId,
        user: userId,
      });
      
      if (!healthConcern) {
        throw createNotFoundError(
          'Health concern not found',
          RESPONSE_TAGS.RESOURCE.RESOURCE_NOT_FOUND
        );
      }
      
      // 3. Fetch user and patient data
      const user = await User.findById(userId);
      if (!user) {
        throw createNotFoundError(
          MESSAGES.ERROR.USER_NOT_FOUND,
          RESPONSE_TAGS.RESOURCE.USER_NOT_FOUND
        );
      }
      
      let patientData = null;
      if (user.role === 'patient') {
        patientData = await Patient.findOne({ user: userId })
          .populate('chronicConditions')
          .populate('allergies');
      }
      
      // 4. Fetch previous assessments for context
      const previousAssessments = await Assessment.find({
        user: userId,
        healthConcern: healthConcernId,
        isActive: true,
      })
        .sort({ createdAt: -1 })
        .limit(3)
        .lean();
      
      // Check if previous assessments have responses
      for (const assessment of previousAssessments) {
        const hasResponse = await AssessmentResponse.hasResponse(assessment._id);
        assessment.hasResponse = hasResponse;
      }
      
      // 5. Build context using official TOON library
      const toonContext = buildAssessmentContext(user, patientData, healthConcern, previousAssessments);
      
      // 6. Optimize context if needed (token budget management)
      const optimizedContext = optimizeContext(
        toonContext,
        TOKEN_BUDGET.maxContext,
        config.llm.openai.model
      );
      
      if (optimizedContext.wasTruncated) {
        logger.warn(`Context truncated for assessment generation: ${healthConcernId}`);
      }
      
      // 7. Generate assessment using LLM
      const userPrompt = createAssessmentGenerationUserPrompt(optimizedContext.text);
      
      logger.info(`Generating assessment for health concern: ${healthConcernId}`);
      
      // Get model-specific config
      const modelConfig = MODEL_CONFIG[config.llm.openai.model] || {};
      
      const llmResult = await generateStructuredOutput({
        systemPrompt: ASSESSMENT_GENERATION_SYSTEM_PROMPT,
        userPrompt,
        model: config.llm.openai.model,
        maxTokens: TOKEN_BUDGET.maxCompletion,
        temperature: modelConfig.temperature || config.llm.openai.temperature,
      });
      
      // 8. Validate LLM response structure
      this._validateLLMResponse(llmResult.data);
      
      // 9. Create assessment document
      const assessment = new Assessment({
        user: userId,
        healthConcern: healthConcernId,
        severity: llmResult.data.severity,
        minDaysBeforeNextAssessment: llmResult.data.min_days_before_next_assessment,
        questions: llmResult.data.questions,
        llmMetadata: {
          provider: 'openai',
          model: llmResult.model,
          promptVersion: PROMPT_VERSION,
          tokensUsed: llmResult.usage,
          generationTime: llmResult.generationTime,
        },
      });
      
      await assessment.save();
      
      logger.info(`Assessment generated successfully: ${assessment._id}`, {
        severity: assessment.severity,
        questionCount: assessment.questions.length,
        tokensUsed: llmResult.usage.total,
      });
      
      return assessment;
    } catch (error) {
      logger.error('Error generating assessment:', error);
      throw error;
    }
  },

  /**
   * Submit assessment response
   * @param {string} userId - User ID
   * @param {string} assessmentId - Assessment ID
   * @param {Array} answers - Array of answers
   * @param {string} notes - Optional notes
   * @returns {Object} - Assessment response
   */
  async submitAssessmentResponse(userId, assessmentId, answers, notes = null) {
    try {
      // 1. Fetch assessment
      const assessment = await Assessment.findOne({
        _id: assessmentId,
        user: userId,
        isActive: true,
      });
      
      if (!assessment) {
        throw createNotFoundError(
          'Assessment not found',
          RESPONSE_TAGS.RESOURCE.RESOURCE_NOT_FOUND
        );
      }
      
      // 2. Check if assessment already has a response
      const existingResponse = await AssessmentResponse.findOne({
        assessment: assessmentId,
      });
      
      if (existingResponse) {
        throw createConflictError(
          'Assessment has already been completed',
          RESPONSE_TAGS.VALIDATION.ALREADY_COMPLETED
        );
      }
      
      // 3. Validate answers against assessment questions
      const validation = validateAnswers(answers, assessment.questions);
      
      if (!validation.valid) {
        throw createBadRequestError(
          `Answer validation failed: ${validation.errors.join(', ')}`,
          RESPONSE_TAGS.VALIDATION.VALIDATION_ERROR
        );
      }
      
      // 4. Create assessment response
      const assessmentResponse = new AssessmentResponse({
        assessment: assessmentId,
        user: userId,
        healthConcern: assessment.healthConcern,
        answers,
        notes,
        reportStatus: 'pending',
      });
      
      await assessmentResponse.save();
      
      logger.info(`Assessment response submitted: ${assessmentResponse._id}`, {
        assessmentId,
        answerCount: answers.length,
      });
      
      // 5. Trigger report generation (placeholder for future implementation)
      // TODO: Integrate with report generation service
      this._triggerReportGeneration(assessmentResponse._id);
      
      return assessmentResponse;
    } catch (error) {
      logger.error('Error submitting assessment response:', error);
      throw error;
    }
  },

  /**
   * Get assessment by ID
   * @param {string} userId - User ID
   * @param {string} assessmentId - Assessment ID
   * @returns {Object} - Assessment
   */
  async getAssessmentById(userId, assessmentId) {
    try {
      const assessment = await Assessment.findOne({
        _id: assessmentId,
        user: userId,
      })
        .populate('healthConcern')
        .populate('user', '-password');
      
      if (!assessment) {
        throw createNotFoundError(
          'Assessment not found',
          RESPONSE_TAGS.RESOURCE.RESOURCE_NOT_FOUND
        );
      }
      
      // Check if assessment has a response
      const response = await AssessmentResponse.findOne({
        assessment: assessmentId,
      });
      
      return {
        ...assessment.toObject(),
        hasResponse: !!response,
        response: response || null,
      };
    } catch (error) {
      logger.error('Error fetching assessment:', error);
      throw error;
    }
  },

  /**
   * Get assessment history for user
   * @param {string} userId - User ID
   * @param {string} healthConcernId - Optional health concern ID filter
   * @param {Object} pagination - Pagination options
   * @returns {Object} - Assessment history
   */
  async getAssessmentHistory(userId, healthConcernId = null, pagination = {}) {
    try {
      const { page = 1, limit = 10, includeResponses = true } = pagination;
      const skip = (page - 1) * limit;
      
      const query = { user: userId, isActive: true };
      if (healthConcernId) {
        query.healthConcern = healthConcernId;
      }
      
      const assessments = await Assessment.find(query)
        .populate('healthConcern')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
      
      const totalCount = await Assessment.countDocuments(query);
      
      // Attach response data if requested
      if (includeResponses) {
        for (const assessment of assessments) {
          const response = await AssessmentResponse.findOne({
            assessment: assessment._id,
          }).lean();
          
          assessment.hasResponse = !!response;
          assessment.response = response || null;
        }
      }
      
      logger.info(`Assessment history retrieved for user: ${userId}`, {
        count: assessments.length,
        totalCount,
      });
      
      return {
        assessments,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      };
    } catch (error) {
      logger.error('Error fetching assessment history:', error);
      throw error;
    }
  },

  /**
   * Get response by ID
   * @param {string} userId - User ID
   * @param {string} responseId - Response ID
   * @returns {Object} - Assessment response
   */
  async getResponseById(userId, responseId) {
    try {
      const response = await AssessmentResponse.findOne({
        _id: responseId,
        user: userId,
      })
        .populate('assessment')
        .populate('healthConcern')
        .populate('user', '-password');
      
      if (!response) {
        throw createNotFoundError(
          'Assessment response not found',
          RESPONSE_TAGS.RESOURCE.RESOURCE_NOT_FOUND
        );
      }
      
      return response;
    } catch (error) {
      logger.error('Error fetching assessment response:', error);
      throw error;
    }
  },

  /**
   * Validate LLM response structure
   * @private
   */
  _validateLLMResponse(data) {
    if (!data.severity || !['low', 'moderate', 'high'].includes(data.severity)) {
      throw new Error('Invalid severity level in LLM response');
    }
    
    if (typeof data.min_days_before_next_assessment !== 'number' || data.min_days_before_next_assessment < 0) {
      throw new Error('Invalid min_days_before_next_assessment in LLM response');
    }
    
    if (!Array.isArray(data.questions) || data.questions.length === 0) {
      throw new Error('No questions generated in LLM response');
    }
    
    // Validate each question has required fields
    for (const question of data.questions) {
      if (!question.id || !question.type || !question.label) {
        throw new Error(`Invalid question structure in LLM response: missing id, type, or label`);
      }
    }
  },

  /**
   * Trigger report generation (placeholder)
   * @private
   */
  _triggerReportGeneration(responseId) {
    // TODO: Implement report generation service integration
    logger.info(`Report generation triggered for response: ${responseId}`);
    // This is a placeholder for future report generation logic
  },
};

module.exports = assessmentService;

