const allergyService = require('./allergy.service');
const { successResponse } = require('../../../helpers/response');
const MESSAGES = require('../../../constants/messages');
const HTTP_CODES = require('../../../constants/httpCodes');
const RESPONSE_TAGS = require('../../../constants/responseTags');
const { asyncHandler } = require('../../../middlewares/error.middleware');
const { getFileUrl } = require('../../../helpers/uploader');
const logger = require('../../../helpers/logger');

/**
 * Allergy controller
 */
const allergyController = {
  /**
   * Create a new allergy (Admin only)
   * POST /api/v1/allergy
   */
  createAllergy: asyncHandler(async (req, res) => {
    const allergyData = req.body;
    
    // Add image URL if file was uploaded
    if (req.file) {
      allergyData.image = getFileUrl(req.file.filename);
    }
    
    const allergy = await allergyService.createAllergy(allergyData);
    
    logger.info('Allergy created successfully');
    return successResponse(
      res,
      HTTP_CODES.CREATED,
      'Allergy created successfully',
      allergy,
      RESPONSE_TAGS.SUCCESS.DATA_CREATED
    );
  }),

  /**
   * Get all allergies with pagination
   * GET /api/v1/allergy
   */
  getAllergies: asyncHandler(async (req, res) => {
    const options = {
      page: req.pagination?.page || 1,
      limit: req.pagination?.limit || 10,
      sortBy: req.pagination?.sortBy || 'name',
      sortOrder: req.pagination?.sortOrder || 'asc',
      search: req.search,
      ...req.filters,
    };
    
    const result = await allergyService.getAllergies(options);
    
    logger.info(`Allergies retrieved: ${result.allergies.length} allergies`);
    return res.paginatedResponse(
      'Allergies retrieved successfully',
      result.allergies,
      result.pagination.totalCount,
      RESPONSE_TAGS.SUCCESS.DATA_RETRIEVED
    );
  }),

  /**
   * Get allergy by ID
   * GET /api/v1/allergy/:id
   */
  getAllergyById: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const allergy = await allergyService.getAllergyById(id);
    
    logger.info('Allergy retrieved successfully');
    return successResponse(
      res,
      HTTP_CODES.OK,
      'Allergy retrieved successfully',
      allergy,
      RESPONSE_TAGS.SUCCESS.DATA_RETRIEVED
    );
  }),

  /**
   * Update allergy (Admin only)
   * PUT /api/v1/allergy/:id
   */
  updateAllergy: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    
    // Add image URL if file was uploaded
    if (req.file) {
      updateData.image = getFileUrl(req.file.filename);
    }
    
    const allergy = await allergyService.updateAllergy(id, updateData);
    
    logger.info('Allergy updated successfully');
    return successResponse(
      res,
      HTTP_CODES.OK,
      'Allergy updated successfully',
      allergy,
      RESPONSE_TAGS.SUCCESS.DATA_UPDATED
    );
  }),

  /**
   * Delete allergy (Admin only)
   * DELETE /api/v1/allergy/:id
   */
  deleteAllergy: asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    await allergyService.deleteAllergy(id);
    
    logger.info('Allergy deleted successfully');
    return successResponse(
      res,
      HTTP_CODES.OK,
      'Allergy deleted successfully',
      null,
      RESPONSE_TAGS.SUCCESS.DATA_DELETED
    );
  }),
};

module.exports = allergyController;

