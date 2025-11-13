const { errorResponse } = require('../helpers/response');
const MESSAGES = require('../constants/messages');
const HTTP_CODES = require('../constants/httpCodes');
const logger = require('../helpers/logger');

/**
 * Error factory functions
 */
const createAppError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
  error.isOperational = true;
  Error.captureStackTrace(error, createAppError);
  return error;
};

const createBadRequestError = (message = MESSAGES.ERROR.BAD_REQUEST) => {
  return createAppError(message, HTTP_CODES.BAD_REQUEST);
};

const createUnauthorizedError = (message = MESSAGES.ERROR.UNAUTHORIZED) => {
  return createAppError(message, HTTP_CODES.UNAUTHORIZED);
};

const createForbiddenError = (message = MESSAGES.ERROR.INSUFFICIENT_PERMISSIONS) => {
  return createAppError(message, HTTP_CODES.FORBIDDEN);
};

const createNotFoundError = (message = MESSAGES.ERROR.ROUTE_NOT_FOUND) => {
  return createAppError(message, HTTP_CODES.NOT_FOUND);
};

const createConflictError = (message = MESSAGES.ERROR.USER_ALREADY_EXISTS) => {
  return createAppError(message, HTTP_CODES.CONFLICT);
};

const createValidationError = (message = MESSAGES.ERROR.VALIDATION_ERROR, errors = null) => {
  const error = createAppError(message, HTTP_CODES.BAD_REQUEST);
  error.errors = errors;
  return error;
};

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = createNotFoundError(message);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field} already exists`;
    error = createConflictError(message);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(val => ({
      field: val.path,
      message: val.message,
    }));
    error = createValidationError(MESSAGES.ERROR.VALIDATION_ERROR, errors);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = createUnauthorizedError(MESSAGES.ERROR.TOKEN_INVALID);
  }

  if (err.name === 'TokenExpiredError') {
    error = createUnauthorizedError(MESSAGES.ERROR.TOKEN_EXPIRED);
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    error = createBadRequestError(MESSAGES.ERROR.FILE_TOO_LARGE);
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    error = createBadRequestError('Unexpected file field');
  }

  // Default error
  const statusCode = error.statusCode || HTTP_CODES.INTERNAL_SERVER_ERROR;
  const message = error.message || MESSAGES.ERROR.INTERNAL_SERVER_ERROR;

  return errorResponse(res, statusCode, message, error.errors);
};

/**
 * 404 handler middleware
 */
const notFoundHandler = (req, res, next) => {
  const error = createNotFoundError(`Route ${req.originalUrl} not found`);
  next(error);
};

/**
 * Method not allowed handler middleware
 */
const methodNotAllowedHandler = (req, res, next) => {
  const error = createAppError(`Method ${req.method} not allowed`, HTTP_CODES.METHOD_NOT_ALLOWED);
  next(error);
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  createAppError,
  createBadRequestError,
  createUnauthorizedError,
  createForbiddenError,
  createNotFoundError,
  createConflictError,
  createValidationError,
  errorHandler,
  notFoundHandler,
  methodNotAllowedHandler,
  asyncHandler,
}; 