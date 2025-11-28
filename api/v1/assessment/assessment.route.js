const express = require('express');
const assessmentController = require('./assessment.controller');
const assessmentValidation = require('./assessment.validation');
const { validateBody, validateParams, validateQuery } = require('../../../middlewares/validator.middleware');
const { authenticate } = require('../../../middlewares/auth.middleware');
const { authorize } = require('../../../middlewares/rbac.middleware');
const { paginationMiddleware } = require('../../../middlewares/pagination.middleware');
const { ROLES } = require('../../../constants/roles');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Only patients and professionals can access assessments
// (Admins have different needs and shouldn't use patient-facing assessments)
router.use(authorize([ROLES.PATIENT, ROLES.PROFESSIONAL]));

/**
 * @route   POST /api/v1/assessment/generate
 * @desc    Generate new assessment for a health concern
 * @access  Private (Patient/Professional)
 */
router.post('/generate',
  validateBody(assessmentValidation.generateAssessmentSchema),
  assessmentController.generateAssessment
);

/**
 * @route   POST /api/v1/assessment/response
 * @desc    Submit assessment response
 * @access  Private (Patient/Professional)
 */
router.post('/response',
  validateBody(assessmentValidation.submitAssessmentResponseSchema),
  assessmentController.submitAssessmentResponse
);

/**
 * @route   GET /api/v1/assessment/history
 * @desc    Get assessment history for logged-in user
 * @access  Private (Patient/Professional)
 */
router.get('/history',
  paginationMiddleware,
  validateQuery(assessmentValidation.getAssessmentHistorySchema),
  assessmentController.getAssessmentHistory
);

/**
 * @route   GET /api/v1/assessment/can-generate/:healthConcernId
 * @desc    Check if user can generate new assessment (cooldown check)
 * @access  Private (Patient/Professional)
 */
router.get('/can-generate/:healthConcernId',
  assessmentController.checkCanGenerate
);

/**
 * @route   GET /api/v1/assessment/:assessmentId
 * @desc    Get assessment by ID
 * @access  Private (Patient/Professional)
 */
router.get('/:assessmentId',
  validateParams(assessmentValidation.assessmentIdParamSchema),
  assessmentController.getAssessmentById
);

/**
 * @route   GET /api/v1/assessment/response/:responseId
 * @desc    Get assessment response by ID
 * @access  Private (Patient/Professional)
 */
router.get('/response/:responseId',
  validateParams(assessmentValidation.responseIdParamSchema),
  assessmentController.getResponseById
);

module.exports = router;

