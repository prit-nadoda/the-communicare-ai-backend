const { parsePhoneNumber, isValidPhoneNumber } = require('libphonenumber-js');
const Joi = require('joi');
const logger = require('./logger');

/**
 * Phone validation helper using libphonenumber-js
 */

/**
 * Joi custom validation for phone numbers
 * Validates phone number based on country code
 */
const phoneSchema = Joi.object({
  country: Joi.string().length(2).uppercase().required()
    .messages({
      'string.length': 'Country code must be 2 characters (ISO format, e.g., US, IN, GB)',
      'string.uppercase': 'Country code must be uppercase',
      'any.required': 'Country code is required'
    }),
  countryCode: Joi.string().pattern(/^\+?\d{1,4}$/).required()
    .messages({
      'string.pattern.base': 'Country calling code must be 1-4 digits, optionally starting with + (e.g., +1, +91, +44)',
      'any.required': 'Country calling code is required'
    }),
  phone: Joi.string().pattern(/^\d+$/).required()
    .messages({
      'string.pattern.base': 'Phone number must contain only digits (no spaces or special characters)',
      'any.required': 'Phone number is required'
    })
}).custom((value, helpers) => {
  const { country, countryCode, phone } = value;

  try {
    // Combine country code and phone for validation
    const fullNumber = `${countryCode}${phone}`;
    
    // Validate using libphonenumber-js
    if (!isValidPhoneNumber(fullNumber, country)) {
      return helpers.message(`Invalid phone number for country ${country}. Please provide a valid ${country} phone number.`);
    }

    return value;
  } catch (error) {
    logger.error('Phone validation error:', error);
    return helpers.message(`Invalid phone number or unsupported country code: ${country}. Please check your input.`);
  }
});

/**
 * Optional phone schema (for non-required fields like emergency contact)
 */
const optionalPhoneSchema = Joi.object({
  country: Joi.string().length(2).uppercase().optional()
    .messages({
      'string.length': 'Country code must be 2 characters (ISO format)',
    }),
  countryCode: Joi.string().pattern(/^\+?\d{1,4}$/).optional()
    .messages({
      'string.pattern.base': 'Country calling code must be 1-4 digits, optionally starting with +',
    }),
  phone: Joi.string().pattern(/^\d+$/).optional()
    .messages({
      'string.pattern.base': 'Phone number must contain only digits',
    })
}).custom((value, helpers) => {
  // If any field is provided, all must be provided
  const { country, countryCode, phone } = value || {};
  const hasAny = country || countryCode || phone;
  const hasAll = country && countryCode && phone;

  if (hasAny && !hasAll) {
    return helpers.message('If phone is provided, all fields (country, countryCode, phone) are required');
  }

  // If all provided, validate
  if (hasAll) {
    try {
      const fullNumber = `${countryCode}${phone}`;
      
      if (!isValidPhoneNumber(fullNumber, country)) {
        return helpers.message(`Invalid phone number for country ${country}. Please provide a valid phone number.`);
      }
    } catch (error) {
      logger.error('Phone validation error:', error);
      return helpers.message(`Invalid phone number or unsupported country code: ${country}`);
    }
  }

  return value;
});

/**
 * Validate and format phone number
 * @param {string} countryCode - Country calling code (e.g., '+1', '91')
 * @param {string} phone - Phone number without country code
 * @param {string} country - ISO country code (e.g., 'US', 'IN')
 * @returns {Object} - Validation result with formatted number
 */
const validateAndFormatPhone = (countryCode, phone, country) => {
  try {
    const fullNumber = `${countryCode}${phone}`;
    
    if (!isValidPhoneNumber(fullNumber, country)) {
      return {
        valid: false,
        error: `Invalid phone number for country ${country}`
      };
    }

    // Only parse if valid
    try {
      const parsed = parsePhoneNumber(fullNumber, country);
      
      return {
        valid: true,
        formatted: {
          international: parsed.formatInternational(),
          national: parsed.formatNational(),
          e164: parsed.format('E.164')
        }
      };
    } catch (parseError) {
      logger.error('Phone parsing error:', parseError);
      return {
        valid: false,
        error: 'Unable to parse phone number'
      };
    }
  } catch (error) {
    logger.error('Phone formatting error:', error);
    return {
      valid: false,
      error: 'Invalid phone number or unsupported country'
    };
  }
};

module.exports = {
  phoneSchema,
  optionalPhoneSchema,
  validateAndFormatPhone,
};

