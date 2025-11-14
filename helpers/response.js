const HTTP_CODES = require('../constants/httpCodes');
const RESPONSE_TAGS = require('../constants/responseTags');

/**
 * Standardized success response
 * @param {Object} res - Express response object
 * @param {number} code - HTTP status code
 * @param {string} message - Success message
 * @param {*} data - Response data
 * @param {string} tag - Response identifier tag (optional)
 */
const successResponse = (res, code = HTTP_CODES.OK, message = 'Success', data = null, tag = RESPONSE_TAGS.SUCCESS.OPERATION_SUCCESS) => {
  const response = {
    status: 'success',
    code,
    message,
    tag,
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
 * @param {string} tag - Response identifier tag (optional)
 */
const errorResponse = (res, code = HTTP_CODES.INTERNAL_SERVER_ERROR, message = 'Something went wrong', errors = null, tag = RESPONSE_TAGS.SERVER.INTERNAL_SERVER_ERROR) => {
  const response = {
    status: 'error',
    code,
    message,
    tag,
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
 * @param {string} tag - Response identifier tag (optional)
 */
const paginationResponse = (res, message, data, pagination, tag = RESPONSE_TAGS.SUCCESS.DATA_RETRIEVED) => {
  return successResponse(res, HTTP_CODES.OK, message, {
    data,
    pagination,
  }, tag);
};

module.exports = {
  successResponse,
  errorResponse,
  paginationResponse,
}; 