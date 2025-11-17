const patientService = require('./patient.service');
const { successResponse } = require('../../../helpers/response');
const MESSAGES = require('../../../constants/messages');
const HTTP_CODES = require('../../../constants/httpCodes');
const RESPONSE_TAGS = require('../../../constants/responseTags');
const { asyncHandler } = require('../../../middlewares/error.middleware');
const logger = require('../../../helpers/logger');

/**
 * Patient controller
 */
const patientController = {
  /**
   * Register a new patient
   * POST /api/v1/patient/register
   */
  registerPatient: asyncHandler(async (req, res) => {
    const registrationData = req.body;
    const patient = await patientService.registerPatient(registrationData);
    
    logger.info('Patient registered successfully');
    return successResponse(
      res,
      HTTP_CODES.CREATED,
      'Patient registered successfully',
      patient,
      RESPONSE_TAGS.SUCCESS.USER_CREATED
    );
  }),

  /**
   * Get patient profile
   * GET /api/v1/patient/profile
   */
  getProfile: asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const patient = await patientService.getPatientByUserId(userId);
    
    logger.info('Patient profile retrieved');
    return successResponse(
      res,
      HTTP_CODES.OK,
      'Patient profile retrieved successfully',
      patient,
      RESPONSE_TAGS.SUCCESS.USER_FOUND
    );
  }),

  /**
   * Update patient profile
   * PUT /api/v1/patient/profile
   */
  updateProfile: asyncHandler(async (req, res) => {
    const patientId = req.patientId;
    const updateData = req.body;
    
    const patient = await patientService.updatePatient(patientId, updateData);
    
    logger.info('Patient profile updated');
    return successResponse(
      res,
      HTTP_CODES.OK,
      'Patient profile updated successfully',
      patient,
      RESPONSE_TAGS.SUCCESS.USER_UPDATED
    );
  }),

  /**
   * Get all patients with pagination (Admin only)
   * GET /api/v1/patient
   */
  getPatients: asyncHandler(async (req, res) => {
    const options = {
      page: req.pagination?.page || 1,
      limit: req.pagination?.limit || 10,
      sortBy: req.pagination?.sortBy || 'createdAt',
      sortOrder: req.pagination?.sortOrder || 'desc',
      search: req.search,
      ...req.filters,
    };
    
    const result = await patientService.getPatients(options);
    
    logger.info(`Patients retrieved: ${result.patients.length} patients`);
    return res.paginatedResponse(
      'Patients retrieved successfully',
      result.patients,
      result.pagination.totalCount,
      RESPONSE_TAGS.SUCCESS.USERS_FOUND
    );
  }),

  /**
   * Get patient by ID (Admin only)
   * GET /api/v1/patient/:id
   */
  getPatientById: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const patient = await patientService.getPatientById(id);
    
    logger.info('Patient retrieved by ID');
    return successResponse(
      res,
      HTTP_CODES.OK,
      'Patient retrieved successfully',
      patient,
      RESPONSE_TAGS.SUCCESS.USER_FOUND
    );
  }),

  /**
   * Update patient by ID (Admin only)
   * PUT /api/v1/patient/:id
   */
  updatePatient: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    
    const patient = await patientService.updatePatient(id, updateData);
    
    logger.info('Patient updated by admin');
    return successResponse(
      res,
      HTTP_CODES.OK,
      'Patient updated successfully',
      patient,
      RESPONSE_TAGS.SUCCESS.USER_UPDATED
    );
  }),

  /**
   * Delete patient by ID (Admin only)
   * DELETE /api/v1/patient/:id
   */
  deletePatient: asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    await patientService.deletePatient(id);
    
    logger.info('Patient deleted by admin');
    return successResponse(
      res,
      HTTP_CODES.OK,
      'Patient deleted successfully',
      null,
      RESPONSE_TAGS.SUCCESS.USER_DELETED
    );
  }),
};

module.exports = patientController;

