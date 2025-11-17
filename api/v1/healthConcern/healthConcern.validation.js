const Joi = require('joi');

// Create health concern schema
const createHealthConcernSchema = Joi.object({
  title: Joi.string().min(3).max(200).required()
    .messages({
      'string.min': 'Title must be at least 3 characters',
      'string.max': 'Title cannot exceed 200 characters',
      'any.required': 'Title is required'
    }),
  
  chiefComplaint: Joi.string().min(10).max(1000).required()
    .messages({
      'string.min': 'Chief complaint must be at least 10 characters',
      'string.max': 'Chief complaint cannot exceed 1000 characters',
      'any.required': 'Chief complaint is required'
    }),
  
  symptoms: Joi.string().min(10).max(2000).required()
    .messages({
      'string.min': 'Symptoms description must be at least 10 characters',
      'string.max': 'Symptoms description cannot exceed 2000 characters',
      'any.required': 'Symptoms description is required'
    }),
  
  onset: Joi.object({
    value: Joi.number().integer().min(1).required()
      .messages({
        'number.min': 'Onset value must be at least 1',
        'any.required': 'Onset value is required'
      }),
    unit: Joi.string().valid('day', 'week', 'month', 'year').required()
      .messages({
        'any.only': 'Onset unit must be one of: day, week, month, year',
        'any.required': 'Onset unit is required'
      })
  }).required()
    .messages({
      'any.required': 'Onset information is required'
    }),
  
  severity: Joi.string().valid('mild', 'moderate', 'severe').optional(),
  
  notes: Joi.string().max(2000).optional()
    .messages({
      'string.max': 'Notes cannot exceed 2000 characters'
    })
});

// Update health concern schema
const updateHealthConcernSchema = Joi.object({
  title: Joi.string().min(3).max(200).optional()
    .messages({
      'string.min': 'Title must be at least 3 characters',
      'string.max': 'Title cannot exceed 200 characters'
    }),
  
  chiefComplaint: Joi.string().min(10).max(1000).optional()
    .messages({
      'string.min': 'Chief complaint must be at least 10 characters',
      'string.max': 'Chief complaint cannot exceed 1000 characters'
    }),
  
  symptoms: Joi.string().min(10).max(2000).optional()
    .messages({
      'string.min': 'Symptoms description must be at least 10 characters',
      'string.max': 'Symptoms description cannot exceed 2000 characters'
    }),
  
  onset: Joi.object({
    value: Joi.number().integer().min(1).required(),
    unit: Joi.string().valid('day', 'week', 'month', 'year').required()
  }).optional(),
  
  status: Joi.string().valid('active', 'resolved', 'monitoring').optional()
    .messages({
      'any.only': 'Status must be one of: active, resolved, monitoring'
    }),
  
  severity: Joi.string().valid('mild', 'moderate', 'severe').optional()
    .messages({
      'any.only': 'Severity must be one of: mild, moderate, severe'
    }),
  
  notes: Joi.string().max(2000).optional()
    .messages({
      'string.max': 'Notes cannot exceed 2000 characters'
    }),
  
  isActive: Joi.boolean().optional()
}).min(1)
  .messages({
    'object.min': 'At least one field must be provided for update'
  });

// Query schema
const healthConcernQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  search: Joi.string().optional(),
  status: Joi.string().valid('active', 'resolved', 'monitoring').optional(),
  severity: Joi.string().valid('mild', 'moderate', 'severe').optional(),
  isActive: Joi.boolean().optional()
});

// ID parameter schema
const healthConcernIdParamSchema = Joi.object({
  id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required()
    .messages({
      'string.pattern.base': 'Invalid health concern ID format'
    })
});

module.exports = {
  createHealthConcernSchema,
  updateHealthConcernSchema,
  healthConcernQuerySchema,
  healthConcernIdParamSchema
};

