const chronicConditionService = require('./chronicCondition.service');
const { successResponse } = require('../../../helpers/response');
const MESSAGES = require('../../../constants/messages');
const HTTP_CODES = require('../../../constants/httpCodes');
const RESPONSE_TAGS = require('../../../constants/responseTags');
const { asyncHandler } = require('../../../middlewares/error.middleware');
const logger = require('../../../helpers/logger');

/**
 * Chronic Condition controller
 */
const chronicConditionController = {
  /**
   * Create a new chronic condition (Admin only)
   * POST /api/v1/chronic-condition
   */
  createChronicCondition: asyncHandler(async (req, res) => {
    const conditionData = req.body;
    const condition = await chronicConditionService.createChronicCondition(conditionData);
    
    logger.info('Chronic condition created successfully');
    return successResponse(
      res,
      HTTP_CODES.CREATED,
      'Chronic condition created successfully',
      condition,
      RESPONSE_TAGS.SUCCESS.DATA_CREATED
    );
  }),

  /**
   * Get all chronic conditions with pagination
   * GET /api/v1/chronic-condition
   */
  getChronicConditions: asyncHandler(async (req, res) => {
    const options = {
      page: req.pagination?.page || 1,
      limit: req.pagination?.limit || 10,
      sortBy: req.pagination?.sortBy || 'name',
      sortOrder: req.pagination?.sortOrder || 'asc',
      search: req.search,
      ...req.filters,
    };
    
    const result = await chronicConditionService.getChronicConditions(options);
    
    logger.info(`Chronic conditions retrieved: ${result.conditions.length} conditions`);
    return res.paginatedResponse(
      'Chronic conditions retrieved successfully',
      result.conditions,
      result.pagination.totalCount,
      RESPONSE_TAGS.SUCCESS.DATA_RETRIEVED
    );
  }),

  /**
   * Get chronic condition by ID
   * GET /api/v1/chronic-condition/:id
   */
  getChronicConditionById: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const condition = await chronicConditionService.getChronicConditionById(id);
    
    logger.info('Chronic condition retrieved successfully');
    return successResponse(
      res,
      HTTP_CODES.OK,
      'Chronic condition retrieved successfully',
      condition,
      RESPONSE_TAGS.SUCCESS.DATA_RETRIEVED
    );
  }),

  /**
   * Update chronic condition (Admin only)
   * PUT /api/v1/chronic-condition/:id
   */
  updateChronicCondition: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    
    const condition = await chronicConditionService.updateChronicCondition(id, updateData);
    
    logger.info('Chronic condition updated successfully');
    return successResponse(
      res,
      HTTP_CODES.OK,
      'Chronic condition updated successfully',
      condition,
      RESPONSE_TAGS.SUCCESS.DATA_UPDATED
    );
  }),

  /**
   * Delete chronic condition (Admin only)
   * DELETE /api/v1/chronic-condition/:id
   */
  deleteChronicCondition: asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    await chronicConditionService.deleteChronicCondition(id);
    
    logger.info('Chronic condition deleted successfully');
    return successResponse(
      res,
      HTTP_CODES.OK,
      'Chronic condition deleted successfully',
      null,
      RESPONSE_TAGS.SUCCESS.DATA_DELETED
    );
  }),
};

module.exports = chronicConditionController;

