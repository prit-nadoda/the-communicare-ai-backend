const assessmentService = require('./assessment.service');
const { successResponse } = require('../../../helpers/response');
const HTTP_CODES = require('../../../constants/httpCodes');
const RESPONSE_TAGS = require('../../../constants/responseTags');
const { asyncHandler } = require('../../../middlewares/error.middleware');
const logger = require('../../../helpers/logger');

/**
 * Assessment Controller
 */
const assessmentController = {
  /**
   * Generate assessment
   * POST /api/v1/assessment/generate
   */
  generateAssessment: asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { healthConcernId } = req.body;
    
    const assessment = await assessmentService.generateAssessment(userId, healthConcernId);
    
    logger.info(`Assessment generated for user: ${userId}, health concern: ${healthConcernId}`);
    return successResponse(
      res,
      HTTP_CODES.CREATED,
      'Assessment generated successfully',
      assessment,
      RESPONSE_TAGS.SUCCESS.DATA_CREATED
    );
  }),

  /**
   * Submit assessment response
   * POST /api/v1/assessment/response
   */
  submitAssessmentResponse: asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { assessmentId, answers, notes } = req.body;
    
    const response = await assessmentService.submitAssessmentResponse(
      userId,
      assessmentId,
      answers,
      notes
    );
    
    logger.info(`Assessment response submitted for user: ${userId}, assessment: ${assessmentId}`);
    return successResponse(
      res,
      HTTP_CODES.CREATED,
      'Assessment response submitted successfully',
      response,
      RESPONSE_TAGS.SUCCESS.DATA_CREATED
    );
  }),

  /**
   * Get assessment by ID
   * GET /api/v1/assessment/:assessmentId
   */
  getAssessmentById: asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { assessmentId } = req.params;
    
    const assessment = await assessmentService.getAssessmentById(userId, assessmentId);
    
    logger.info(`Assessment retrieved: ${assessmentId}`);
    return successResponse(
      res,
      HTTP_CODES.OK,
      'Assessment retrieved successfully',
      assessment,
      RESPONSE_TAGS.SUCCESS.DATA_RETRIEVED
    );
  }),

  /**
   * Get assessment history
   * GET /api/v1/assessment/history
   */
  getAssessmentHistory: asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { healthConcernId, page, limit, includeResponses } = req.query;
    
    const result = await assessmentService.getAssessmentHistory(
      userId,
      healthConcernId,
      { page, limit, includeResponses }
    );
    
    logger.info(`Assessment history retrieved for user: ${userId}`);
    return res.paginatedResponse(
      'Assessment history retrieved successfully',
      result.assessments,
      result.pagination.totalCount,
      RESPONSE_TAGS.SUCCESS.DATA_RETRIEVED
    );
  }),

  /**
   * Get response by ID
   * GET /api/v1/assessment/response/:responseId
   */
  getResponseById: asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { responseId } = req.params;
    
    const response = await assessmentService.getResponseById(userId, responseId);
    
    logger.info(`Assessment response retrieved: ${responseId}`);
    return successResponse(
      res,
      HTTP_CODES.OK,
      'Assessment response retrieved successfully',
      response,
      RESPONSE_TAGS.SUCCESS.DATA_RETRIEVED
    );
  }),

  /**
   * Check if user can generate new assessment for health concern
   * GET /api/v1/assessment/can-generate/:healthConcernId
   */
  checkCanGenerate: asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { healthConcernId } = req.params;
    
    const Assessment = require('./assessment.model');
    const canGenerate = await Assessment.canGenerateNewAssessment(userId, healthConcernId);
    
    logger.info(`Cooldown check for user: ${userId}, health concern: ${healthConcernId}`);
    return successResponse(
      res,
      HTTP_CODES.OK,
      canGenerate.allowed ? 'Can generate new assessment' : canGenerate.reason,
      {
        allowed: canGenerate.allowed,
        reason: canGenerate.reason,
        daysRemaining: canGenerate.daysRemaining,
        lastAssessmentDate: canGenerate.lastAssessmentDate,
      },
      canGenerate.allowed 
        ? RESPONSE_TAGS.SUCCESS.OPERATION_SUCCESS 
        : RESPONSE_TAGS.VALIDATION.COOLDOWN_NOT_MET
    );
  }),
};

module.exports = assessmentController;

