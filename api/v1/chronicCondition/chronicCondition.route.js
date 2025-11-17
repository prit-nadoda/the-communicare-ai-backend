const express = require('express');
const chronicConditionController = require('./chronicCondition.controller');
const chronicConditionValidation = require('./chronicCondition.validation');
const { validateBody, validateParams, validateQuery } = require('../../../middlewares/validator.middleware');
const { authenticate } = require('../../../middlewares/auth.middleware');
const { requireAdmin } = require('../../../middlewares/rbac.middleware');
const { paginationMiddleware, filterMiddleware, searchMiddleware } = require('../../../middlewares/pagination.middleware');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Public routes (authenticated users can view)
router.get('/', 
  paginationMiddleware,
  filterMiddleware,
  searchMiddleware,
  validateQuery(chronicConditionValidation.chronicConditionQuerySchema),
  chronicConditionController.getChronicConditions
);

router.get('/:id', 
  validateParams(chronicConditionValidation.chronicConditionIdParamSchema),
  chronicConditionController.getChronicConditionById
);

// Admin-only routes (CUD operations)
router.post('/', 
  requireAdmin,
  validateBody(chronicConditionValidation.createChronicConditionSchema),
  chronicConditionController.createChronicCondition
);

router.put('/:id', 
  requireAdmin,
  validateParams(chronicConditionValidation.chronicConditionIdParamSchema),
  validateBody(chronicConditionValidation.updateChronicConditionSchema),
  chronicConditionController.updateChronicCondition
);

router.delete('/:id', 
  requireAdmin,
  validateParams(chronicConditionValidation.chronicConditionIdParamSchema),
  chronicConditionController.deleteChronicCondition
);

module.exports = router;

