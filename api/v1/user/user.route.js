const express = require('express');
const userController = require('./user.controller');
const userValidation = require('./user.validation');
const { validateBody, validateParams, validateQuery } = require('../../../middlewares/validator.middleware');
const { authenticate } = require('../../../middlewares/auth.middleware');
const { authorize, requireAdmin } = require('../../../middlewares/rbac.middleware');
const { paginationMiddleware, filterMiddleware, searchMiddleware } = require('../../../middlewares/pagination.middleware');

const router = express.Router();

// Public routes (no authentication required)
router.post('/login', validateBody(userValidation.loginSchema), userController.login);
router.post('/refresh-token', validateBody(userValidation.refreshTokenSchema), userController.refreshToken);

// Protected routes (authentication required)
router.use(authenticate); // Apply authentication to all routes below

// User profile routes
router.get('/profile', userController.getProfile);
router.put('/profile', validateBody(userValidation.partialUpdateUserSchema), userController.updateProfile);
router.post('/change-password', validateBody(userValidation.changePasswordSchema), userController.changePassword);


// Admin routes (admin role required)
router.get('/', 
  requireAdmin,
  paginationMiddleware,
  filterMiddleware,
  searchMiddleware,
  validateQuery(userValidation.userQuerySchema),
  userController.getUsers
);

router.get('/:userId', 
  requireAdmin,
  validateParams(userValidation.userIdParamSchema),
  userController.getUserById
);

router.put('/:userId', 
  requireAdmin,
  validateParams(userValidation.userIdParamSchema),
  validateBody(userValidation.updateUserSchema),
  userController.updateUser
);

router.delete('/:userId', 
  requireAdmin,
  validateParams(userValidation.userIdParamSchema),
  userController.deleteUser
);

module.exports = router; 