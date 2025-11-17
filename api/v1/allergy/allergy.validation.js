const Joi = require('joi');

// Common validation schemas
const commonSchemas = {
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().max(500).optional(),
  code: Joi.string().uppercase().optional(),
  category: Joi.string().valid('food', 'medication', 'environmental', 'other').optional(),
  isActive: Joi.boolean().optional(),
};

// Create allergy schema
const createAllergySchema = Joi.object({
  name: commonSchemas.name,
  description: commonSchemas.description,
  code: commonSchemas.code,
  category: commonSchemas.category,
  isActive: commonSchemas.isActive,
});

// Update allergy schema
const updateAllergySchema = Joi.object({
  name: commonSchemas.name.optional(),
  description: commonSchemas.description,
  code: commonSchemas.code,
  category: commonSchemas.category,
  isActive: commonSchemas.isActive,
}).min(1);

// Query schema (for GET requests with filters)
const allergyQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().default('name'),
  sortOrder: Joi.string().valid('asc', 'desc').default('asc'),
  search: Joi.string().optional(),
  category: Joi.string().valid('food', 'medication', 'environmental', 'other').optional(),
  isActive: Joi.boolean().optional(),
});

// ID parameter schema
const allergyIdParamSchema = Joi.object({
  id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
});

module.exports = {
  createAllergySchema,
  updateAllergySchema,
  allergyQuerySchema,
  allergyIdParamSchema,
};

