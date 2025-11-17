const express = require('express');
const patientController = require('./patient.controller');
const patientValidation = require('./patient.validation');
const { validateBody, validateParams, validateQuery } = require('../../../middlewares/validator.middleware');
const { authenticate } = require('../../../middlewares/auth.middleware');
const { requireAdmin } = require('../../../middlewares/rbac.middleware');
const { paginationMiddleware, filterMiddleware, searchMiddleware } = require('../../../middlewares/pagination.middleware');

const router = express.Router();

// Public routes (no authentication required)
router.post('/register', validateBody(patientValidation.registerPatientSchema), patientController.registerPatient);

// Protected routes (authentication required)
router.use(authenticate);

// Patient profile routes
router.get('/profile', patientController.getProfile);
router.put('/profile', validateBody(patientValidation.updatePatientSchema), patientController.updateProfile);

// Admin routes
router.get('/', 
  requireAdmin,
  paginationMiddleware,
  filterMiddleware,
  searchMiddleware,
  validateQuery(patientValidation.patientQuerySchema),
  patientController.getPatients
);

router.get('/:id', 
  requireAdmin,
  validateParams(patientValidation.patientIdParamSchema),
  patientController.getPatientById
);

router.put('/:id', 
  requireAdmin,
  validateParams(patientValidation.patientIdParamSchema),
  validateBody(patientValidation.updatePatientSchema),
  patientController.updatePatient
);

router.delete('/:id', 
  requireAdmin,
  validateParams(patientValidation.patientIdParamSchema),
  patientController.deletePatient
);

module.exports = router;

