const Joi = require('joi');
const { phoneSchema, optionalPhoneSchema } = require('../../../helpers/phoneValidator');

// Patient registration schema
const registerPatientSchema = Joi.object({
  // User data
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  
  // Patient-specific data
  birthDate: Joi.string().isoDate().required()
    .messages({
      'string.isoDate': 'Birth date must be in ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ)',
    }),
  gender: Joi.string().valid('male', 'female', 'other').required(),
  contact: phoneSchema.keys({
    email: Joi.string().email().optional(),
  }).required(),
  
  // Optional fields
  chronicConditions: Joi.array().items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/)).optional(),
  allergies: Joi.array().items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/)).optional(),
  emergencyContact: optionalPhoneSchema.keys({
    name: Joi.string().optional(),
    relationship: Joi.string().optional(),
  }).optional(),
  medicalHistory: Joi.string().optional(),
});

// Update patient schema
const updatePatientSchema = Joi.object({
  birthDate: Joi.string().isoDate().optional()
    .messages({
      'string.isoDate': 'Birth date must be in ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ)',
    }),
  gender: Joi.string().valid('male', 'female', 'other').optional(),
  contact: optionalPhoneSchema.keys({
    email: Joi.string().email().optional(),
  }).optional(),
  chronicConditions: Joi.array().items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/)).optional(),
  allergies: Joi.array().items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/)).optional(),
  emergencyContact: optionalPhoneSchema.keys({
    name: Joi.string().optional(),
    relationship: Joi.string().optional(),
  }).optional(),
  medicalHistory: Joi.string().optional(),
  isActive: Joi.boolean().optional(),
}).min(1);

// Query schema
const patientQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  search: Joi.string().optional(),
  gender: Joi.string().valid('male', 'female', 'other').optional(),
  isActive: Joi.boolean().optional(),
});

// ID parameter schema
const patientIdParamSchema = Joi.object({
  id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
});

module.exports = {
  registerPatientSchema,
  updatePatientSchema,
  patientQuerySchema,
  patientIdParamSchema,
};

