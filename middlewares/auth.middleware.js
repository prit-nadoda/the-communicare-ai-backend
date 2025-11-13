const { verifyAccessToken } = require('../helpers/token');
const { errorResponse } = require('../helpers/response');
const MESSAGES = require('../constants/messages');
const HTTP_CODES = require('../constants/httpCodes');
const logger = require('../helpers/logger');

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, HTTP_CODES.UNAUTHORIZED, MESSAGES.ERROR.TOKEN_MISSING);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      return errorResponse(res, HTTP_CODES.UNAUTHORIZED, MESSAGES.ERROR.TOKEN_MISSING);
    }

    // Verify token
    const decoded = verifyAccessToken(token);
    
    // Attach user to request
    req.user = decoded;
    
    logger.info(`User authenticated: ${decoded.userId}`);
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, HTTP_CODES.UNAUTHORIZED, MESSAGES.ERROR.TOKEN_EXPIRED);
    }
    
    if (error.name === 'JsonWebTokenError') {
      return errorResponse(res, HTTP_CODES.UNAUTHORIZED, MESSAGES.ERROR.TOKEN_INVALID);
    }
    
    return errorResponse(res, HTTP_CODES.UNAUTHORIZED, MESSAGES.ERROR.UNAUTHORIZED);
  }
};

/**
 * Optional authentication middleware
 * Verifies JWT token if present, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without authentication
    }

    const token = authHeader.substring(7);

    if (!token) {
      return next(); // Continue without authentication
    }

    // Verify token
    const decoded = verifyAccessToken(token);
    
    // Attach user to request
    req.user = decoded;
    
    logger.info(`Optional user authenticated: ${decoded.userId}`);
    next();
  } catch (error) {
    logger.warn('Optional authentication failed:', error);
    next(); // Continue without authentication
  }
};

module.exports = {
  authenticate,
  optionalAuth,
}; 