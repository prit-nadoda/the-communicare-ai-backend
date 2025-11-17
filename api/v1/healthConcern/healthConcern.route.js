const express = require('express');
const router = express.Router();
const healthConcernController = require('./healthConcern.controller');
const { authenticate } = require('../../../middlewares/auth.middleware');
const { authorize } = require('../../../middlewares/rbac.middleware');
const { validateBody, validateParams, validateQuery } = require('../../../middlewares/validator.middleware');
const { paginationMiddleware, searchMiddleware, filterMiddleware } = require('../../../middlewares/pagination.middleware');
const { ROLES } = require('../../../constants/roles');
const {
  createHealthConcernSchema,
  updateHealthConcernSchema,
  healthConcernQuerySchema,
  healthConcernIdParamSchema
} = require('./healthConcern.validation');

/**
 * Health Concern Routes
 * All routes require authentication and patient role
 * Patients can only access their own health concerns
 */

// Get active health concerns (must be before /:id route)
router.get(
  '/active/list',
  authenticate,
  authorize([ROLES.PATIENT]),
  healthConcernController.getActiveHealthConcerns
);

// Resolve health concern (must be before /:id route)
router.patch(
  '/:id/resolve',
  authenticate,
  authorize([ROLES.PATIENT]),
  validateParams(healthConcernIdParamSchema),
  healthConcernController.resolveHealthConcern
);

// Create health concern
router.post(
  '/',
  authenticate,
  authorize([ROLES.PATIENT]),
  validateBody(createHealthConcernSchema),
  healthConcernController.createHealthConcern
);

// Get all health concerns with pagination
router.get(
  '/',
  authenticate,
  authorize([ROLES.PATIENT]),
  paginationMiddleware,
  searchMiddleware,
  filterMiddleware,
  validateQuery(healthConcernQuerySchema),
  healthConcernController.getHealthConcerns
);

// Get single health concern by ID
router.get(
  '/:id',
  authenticate,
  authorize([ROLES.PATIENT]),
  validateParams(healthConcernIdParamSchema),
  healthConcernController.getHealthConcernById
);

// Update health concern
router.put(
  '/:id',
  authenticate,
  authorize([ROLES.PATIENT]),
  validateParams(healthConcernIdParamSchema),
  validateBody(updateHealthConcernSchema),
  healthConcernController.updateHealthConcern
);

// Delete health concern (soft delete)
router.delete(
  '/:id',
  authenticate,
  authorize([ROLES.PATIENT]),
  validateParams(healthConcernIdParamSchema),
  healthConcernController.deleteHealthConcern
);

module.exports = router;

