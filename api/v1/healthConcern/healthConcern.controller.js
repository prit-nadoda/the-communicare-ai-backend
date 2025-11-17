const healthConcernService = require('./healthConcern.service');
const { successResponse } = require('../../../helpers/response');
const { asyncHandler } = require('../../../middlewares/error.middleware');
const MESSAGES = require('../../../constants/messages');
const HTTP_CODES = require('../../../constants/httpCodes');
const RESPONSE_TAGS = require('../../../constants/responseTags');
const logger = require('../../../helpers/logger');

/**
 * Health Concern Controller
 * Handles HTTP requests for health concern management
 */

/**
 * Create a new health concern
 * @route POST /api/v1/health-concern
 * @access Private (Patient only)
 */
const createHealthConcern = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const data = req.body;
  
  const healthConcern = await healthConcernService.createHealthConcern(userId, data);
  
  logger.info(`Health concern created: ${healthConcern._id}`);
  return successResponse(
    res,
    HTTP_CODES.CREATED,
    'Health concern created successfully',
    healthConcern,
    RESPONSE_TAGS.SUCCESS.DATA_CREATED
  );
});

/**
 * Get all health concerns for authenticated user
 * @route GET /api/v1/health-concern
 * @access Private (Patient only)
 */
const getHealthConcerns = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { page, limit, skip, sortBy, sortOrder } = req.pagination;
  const search = req.search;
  const filters = req.filters;
  
  const result = await healthConcernService.getHealthConcerns(userId, {
    pagination: { skip, limit, sortBy, sortOrder },
    search,
    filters
  });
  
  logger.info('Health concerns retrieved with pagination');
  return res.paginatedResponse(
    'Health concerns retrieved successfully',
    result.data,
    result.totalCount,
    RESPONSE_TAGS.SUCCESS.DATA_RETRIEVED
  );
});

/**
 * Get a single health concern by ID
 * @route GET /api/v1/health-concern/:id
 * @access Private (Patient only - own records)
 */
const getHealthConcernById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;
  
  const healthConcern = await healthConcernService.getHealthConcernById(id, userId);
  
  logger.info(`Health concern retrieved: ${id}`);
  return successResponse(
    res,
    HTTP_CODES.OK,
    'Health concern retrieved successfully',
    healthConcern,
    RESPONSE_TAGS.SUCCESS.DATA_RETRIEVED
  );
});

/**
 * Update a health concern
 * @route PUT /api/v1/health-concern/:id
 * @access Private (Patient only - own records)
 */
const updateHealthConcern = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;
  const data = req.body;
  
  const healthConcern = await healthConcernService.updateHealthConcern(id, userId, data);
  
  logger.info(`Health concern updated: ${id}`);
  return successResponse(
    res,
    HTTP_CODES.OK,
    'Health concern updated successfully',
    healthConcern,
    RESPONSE_TAGS.SUCCESS.DATA_UPDATED
  );
});

/**
 * Delete a health concern (soft delete)
 * @route DELETE /api/v1/health-concern/:id
 * @access Private (Patient only - own records)
 */
const deleteHealthConcern = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;
  
  await healthConcernService.deleteHealthConcern(id, userId);
  
  logger.info(`Health concern deleted: ${id}`);
  return successResponse(
    res,
    HTTP_CODES.OK,
    'Health concern deleted successfully',
    null,
    RESPONSE_TAGS.SUCCESS.DATA_DELETED
  );
});

/**
 * Get active health concerns for authenticated user
 * @route GET /api/v1/health-concern/active/list
 * @access Private (Patient only)
 */
const getActiveHealthConcerns = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  
  const healthConcerns = await healthConcernService.getActiveHealthConcerns(userId);
  
  logger.info('Active health concerns retrieved');
  return successResponse(
    res,
    HTTP_CODES.OK,
    'Active health concerns retrieved successfully',
    healthConcerns,
    RESPONSE_TAGS.SUCCESS.DATA_RETRIEVED
  );
});

/**
 * Mark a health concern as resolved
 * @route PATCH /api/v1/health-concern/:id/resolve
 * @access Private (Patient only - own records)
 */
const resolveHealthConcern = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;
  
  const healthConcern = await healthConcernService.resolveHealthConcern(id, userId);
  
  logger.info(`Health concern marked as resolved: ${id}`);
  return successResponse(
    res,
    HTTP_CODES.OK,
    'Health concern marked as resolved',
    healthConcern,
    RESPONSE_TAGS.SUCCESS.DATA_UPDATED
  );
});

module.exports = {
  createHealthConcern,
  getHealthConcerns,
  getHealthConcernById,
  updateHealthConcern,
  deleteHealthConcern,
  getActiveHealthConcerns,
  resolveHealthConcern
};

