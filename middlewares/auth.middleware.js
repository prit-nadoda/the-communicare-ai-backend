const { verifyAccessToken } = require('../helpers/token');
const { errorResponse } = require('../helpers/response');
const MESSAGES = require('../constants/messages');
const HTTP_CODES = require('../constants/httpCodes');
const { ROLES } = require('../constants/roles');
const logger = require('../helpers/logger');
const Patient = require('../api/v1/patient/patient.model');

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
    
    // Add role-specific context
    if (decoded.role === ROLES.PATIENT) {
      try {
        const patient = await Patient.findOne({ user: decoded.userId }).select('_id');
        if (patient) {
          req.patientId = patient._id.toString();
        }
      } catch (error) {
        logger.error('Error fetching patient context:', error);
      }
    }
    
    logger.info(`User authenticated: ${decoded.userId} (${decoded.role})`);
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
    
    // Add role-specific context
    if (decoded.role === ROLES.PATIENT) {
      try {
        const patient = await Patient.findOne({ user: decoded.userId }).select('_id');
        if (patient) {
          req.patientId = patient._id.toString();
        }
      } catch (error) {
        logger.error('Error fetching patient context:', error);
      }
    }
    
    logger.info(`Optional user authenticated: ${decoded.userId} (${decoded.role})`);
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