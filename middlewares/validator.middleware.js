const Joi = require('joi');
const { errorResponse } = require('../helpers/response');
const MESSAGES = require('../constants/messages');
const HTTP_CODES = require('../constants/httpCodes');
const RESPONSE_TAGS = require('../constants/responseTags');
const logger = require('../helpers/logger');

/**
 * Validation middleware factory
 * @param {Object} schema - Joi validation schema
 * @param {string} property - Request property to validate ('body', 'query', 'params')
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    try {
      const { error, value } = schema.validate(req[property], {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        const errorDetails = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
        }));

        logger.warn(`Validation failed for ${property}:`, errorDetails);
        return errorResponse(
          res,
          HTTP_CODES.BAD_REQUEST,
          MESSAGES.ERROR.VALIDATION_ERROR,
          errorDetails,
          RESPONSE_TAGS.VALIDATION.VALIDATION_ERROR
        );
      }

      // Replace request property with validated data
      req[property] = value;
      next();
    } catch (error) {
      logger.error('Validation middleware error:', error);
      return errorResponse(
        res, 
        HTTP_CODES.INTERNAL_SERVER_ERROR, 
        MESSAGES.ERROR.SOMETHING_WENT_WRONG,
        null,
        RESPONSE_TAGS.SERVER.INTERNAL_SERVER_ERROR
      );
    }
  };
};

/**
 * Common validation schemas
 */
const commonSchemas = {
  // Pagination schema
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sortBy: Joi.string().default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  }),

  // ObjectId schema
  objectId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),

  // Email schema
  email: Joi.string().email().required(),

  // Password schema
  password: Joi.string().min(6).required(),

  // Name schema
  name: Joi.string().min(2).max(50).required(),

  // Optional string schema
  optionalString: Joi.string().optional(),

  // Optional number schema
  optionalNumber: Joi.number().optional(),

  // Optional boolean schema
  optionalBoolean: Joi.boolean().optional(),
};

/**
 * Validation middleware for specific request properties
 */
const validateBody = (schema) => validate(schema, 'body');
const validateQuery = (schema) => validate(schema, 'query');
const validateParams = (schema) => validate(schema, 'params');

module.exports = {
  validate,
  validateBody,
  validateQuery,
  validateParams,
  commonSchemas,
}; 