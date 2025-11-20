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

// Profile update schema (logged-in user updates their own profile)
const updateProfileSchema = Joi.object({
  name: commonSchemas.name.optional(),
  // Patient-specific fields (from patient.validation.js)
  birthDate: Joi.string().isoDate().optional()
    .messages({
      'string.isoDate': 'Birth date must be in ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ)',
    }),
  gender: Joi.string().valid('male', 'female', 'other').optional(),
  contact: Joi.object({
    country: Joi.string().length(2).uppercase().optional(),
    countryCode: Joi.string().pattern(/^\+?\d{1,4}$/).optional(),
    phone: Joi.string().pattern(/^\d+$/).optional(),
    email: Joi.string().email().optional(),
  }).optional(),
  chronicConditions: Joi.array().items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/)).optional(),
  allergies: Joi.array().items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/)).optional(),
  emergencyContact: Joi.object({
    name: Joi.string().optional(),
    relationship: Joi.string().optional(),
    country: Joi.string().length(2).uppercase().optional(),
    countryCode: Joi.string().pattern(/^\+?\d{1,4}$/).optional(),
    phone: Joi.string().pattern(/^\d+$/).optional(),
  }).optional(),
  medicalHistory: Joi.string().optional(),
}).min(1);

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
  updateProfileSchema,
}; 