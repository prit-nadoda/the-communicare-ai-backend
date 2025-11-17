const Joi = require('joi');

// Common validation schemas
const commonSchemas = {
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().max(500).optional(),
  code: Joi.string().uppercase().optional(),
  isActive: Joi.boolean().optional(),
};

// Create chronic condition schema
const createChronicConditionSchema = Joi.object({
  name: commonSchemas.name,
  description: commonSchemas.description,
  code: commonSchemas.code,
  isActive: commonSchemas.isActive,
});

// Update chronic condition schema
const updateChronicConditionSchema = Joi.object({
  name: commonSchemas.name.optional(),
  description: commonSchemas.description,
  code: commonSchemas.code,
  isActive: commonSchemas.isActive,
}).min(1);

// Query schema (for GET requests with filters)
const chronicConditionQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().default('name'),
  sortOrder: Joi.string().valid('asc', 'desc').default('asc'),
  search: Joi.string().optional(),
  isActive: Joi.boolean().optional(),
});

// ID parameter schema
const chronicConditionIdParamSchema = Joi.object({
  id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
});

module.exports = {
  createChronicConditionSchema,
  updateChronicConditionSchema,
  chronicConditionQuerySchema,
  chronicConditionIdParamSchema,
};

