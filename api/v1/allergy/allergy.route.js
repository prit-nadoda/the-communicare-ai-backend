const express = require('express');
const allergyController = require('./allergy.controller');
const allergyValidation = require('./allergy.validation');
const { validateBody, validateParams, validateQuery } = require('../../../middlewares/validator.middleware');
const { authenticate } = require('../../../middlewares/auth.middleware');
const { requireAdmin } = require('../../../middlewares/rbac.middleware');
const { paginationMiddleware, filterMiddleware, searchMiddleware } = require('../../../middlewares/pagination.middleware');
const { uploadSingle } = require('../../../helpers/uploader');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Public routes (authenticated users can view)
router.get('/', 
  paginationMiddleware,
  filterMiddleware,
  searchMiddleware,
  validateQuery(allergyValidation.allergyQuerySchema),
  allergyController.getAllergies
);

router.get('/:id', 
  validateParams(allergyValidation.allergyIdParamSchema),
  allergyController.getAllergyById
);

// Admin-only routes (CUD operations)
router.post('/', 
  requireAdmin,
  uploadSingle('image'),
  validateBody(allergyValidation.createAllergySchema),
  allergyController.createAllergy
);

router.put('/:id', 
  requireAdmin,
  validateParams(allergyValidation.allergyIdParamSchema),
  uploadSingle('image'),
  validateBody(allergyValidation.updateAllergySchema),
  allergyController.updateAllergy
);

router.delete('/:id', 
  requireAdmin,
  validateParams(allergyValidation.allergyIdParamSchema),
  allergyController.deleteAllergy
);

module.exports = router;

