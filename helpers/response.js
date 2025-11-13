const HTTP_CODES = require('../constants/httpCodes');

/**
 * Standardized success response
 * @param {Object} res - Express response object
 * @param {number} code - HTTP status code
 * @param {string} message - Success message
 * @param {*} data - Response data
 */
const successResponse = (res, code = HTTP_CODES.OK, message = 'Success', data = null) => {
  const response = {
    status: 'success',
    code,
    message,
  };

  if (data !== null) {
    response.data = data;
  }

  return res.status(code).json(response);
};

/**
 * Standardized error response
 * @param {Object} res - Express response object
 * @param {number} code - HTTP status code
 * @param {string} message - Error message
 * @param {*} errors - Error details (optional)
 */
const errorResponse = (res, code = HTTP_CODES.INTERNAL_SERVER_ERROR, message = 'Something went wrong', errors = null) => {
  const response = {
    status: 'error',
    code,
    message,
  };

  if (errors !== null) {
    response.errors = errors;
  }

  return res.status(code).json(response);
};

/**
 * Pagination response helper
 * @param {Object} res - Express response object
 * @param {string} message - Success message
 * @param {Array} data - Data array
 * @param {Object} pagination - Pagination info
 */
const paginationResponse = (res, message, data, pagination) => {
  return successResponse(res, HTTP_CODES.OK, message, {
    data,
    pagination,
  });
};

module.exports = {
  successResponse,
  errorResponse,
  paginationResponse,
}; 