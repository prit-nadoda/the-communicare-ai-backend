const Joi = require('joi');
const { ROLES } = require('../../../constants/roles');

// Common validation schemas
const commonSchemas = {
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid(...Object.values(ROLES)).optional(),
  avatar: Joi.string().uri().optional(),
  isActive: Joi.boolean().optional(),
  isEmailVerified: Joi.boolean().optional(),
};

// User registration schema
const registerSchema = Joi.object({
  name: commonSchemas.name,
  email: commonSchemas.email,
  password: commonSchemas.password,
  role: commonSchemas.role,
});

// User login schema
const loginSchema = Joi.object({
  email: commonSchemas.email,
  password: commonSchemas.password,
});

// User update schema
const updateUserSchema = Joi.object({
  name: commonSchemas.name.optional(),
  email: commonSchemas.email.optional(),
  password: commonSchemas.password.optional(),
  role: commonSchemas.role,
  avatar: commonSchemas.avatar,
  isActive: commonSchemas.isActive,
  isEmailVerified: commonSchemas.isEmailVerified,
});

// User partial update schema (for PATCH requests)
const partialUpdateUserSchema = Joi.object({
  name: commonSchemas.name.optional(),
  email: commonSchemas.email.optional(),
  password: commonSchemas.password.optional(),
  role: commonSchemas.role,
  avatar: commonSchemas.avatar,
  isActive: commonSchemas.isActive,
  isEmailVerified: commonSchemas.isEmailVerified,
});

// Refresh token schema
const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

// Change password schema
const changePasswordSchema = Joi.object({
  currentPassword: commonSchemas.password,
  newPassword: commonSchemas.password,
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required(),
});

// Forgot password schema
const forgotPasswordSchema = Joi.object({
  email: commonSchemas.email,
});

// Reset password schema
const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  password: commonSchemas.password,
  confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
});

// User query schema (for GET requests with filters)
const userQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  search: Joi.string().optional(),
  role: Joi.string().valid(...Object.values(ROLES)).optional(),
  isActive: Joi.boolean().optional(),
  isEmailVerified: Joi.boolean().optional(),
});

// User ID parameter schema
const userIdParamSchema = Joi.object({
  userId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
});

module.exports = {
  registerSchema,
  loginSchema,
  updateUserSchema,
  partialUpdateUserSchema,
  refreshTokenSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  userQuerySchema,
  userIdParamSchema,
}; 