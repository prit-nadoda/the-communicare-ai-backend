const { errorResponse } = require('../helpers/response');
const MESSAGES = require('../constants/messages');
const HTTP_CODES = require('../constants/httpCodes');
const RESPONSE_TAGS = require('../constants/responseTags');
const { ROLES, ROLE_HIERARCHY } = require('../constants/roles');
const logger = require('../helpers/logger');

/**
 * Role-based access control middleware
 * @param {string|Array} allowedRoles - Role(s) allowed to access the route
 */
const authorize = (allowedRoles) => {
  return (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return errorResponse(res, HTTP_CODES.UNAUTHORIZED, MESSAGES.ERROR.UNAUTHORIZED, null, RESPONSE_TAGS.AUTH.UNAUTHORIZED);
      }

      // Convert single role to array
      const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

      // Check if user has any of the allowed roles
      const hasRole = roles.includes(req.user.role);

      if (!hasRole) {
        logger.warn(`Access denied for user ${req.user.userId} with role ${req.user.role}`);
        return errorResponse(res, HTTP_CODES.FORBIDDEN, MESSAGES.ERROR.INSUFFICIENT_PERMISSIONS, null, RESPONSE_TAGS.AUTH.INSUFFICIENT_PERMISSIONS);
      }

      logger.info(`Access granted for user ${req.user.userId} with role ${req.user.role}`);
      next();
    } catch (error) {
      logger.error('RBAC middleware error:', error);
      return errorResponse(res, HTTP_CODES.INTERNAL_SERVER_ERROR, MESSAGES.ERROR.SOMETHING_WENT_WRONG, null, RESPONSE_TAGS.SERVER.INTERNAL_SERVER_ERROR);
    }
  };
};

/**
 * Minimum role hierarchy middleware
 * @param {string} minimumRole - Minimum role required (hierarchy-based)
 */
const requireMinimumRole = (minimumRole) => {
  return (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return errorResponse(res, HTTP_CODES.UNAUTHORIZED, MESSAGES.ERROR.UNAUTHORIZED, null, RESPONSE_TAGS.AUTH.UNAUTHORIZED);
      }

      const userRoleLevel = ROLE_HIERARCHY[req.user.role] || 0;
      const requiredRoleLevel = ROLE_HIERARCHY[minimumRole] || 0;

      if (userRoleLevel < requiredRoleLevel) {
        logger.warn(`Access denied for user ${req.user.userId} with role ${req.user.role} (required: ${minimumRole})`);
        return errorResponse(res, HTTP_CODES.FORBIDDEN, MESSAGES.ERROR.INSUFFICIENT_PERMISSIONS, null, RESPONSE_TAGS.AUTH.INSUFFICIENT_PERMISSIONS);
      }

      logger.info(`Access granted for user ${req.user.userId} with role ${req.user.role} (minimum required: ${minimumRole})`);
      next();
    } catch (error) {
      logger.error('Minimum role middleware error:', error);
      return errorResponse(res, HTTP_CODES.INTERNAL_SERVER_ERROR, MESSAGES.ERROR.SOMETHING_WENT_WRONG, null, RESPONSE_TAGS.SERVER.INTERNAL_SERVER_ERROR);
    }
  };
};

/**
 * Admin-only middleware
 */
const requireAdmin = authorize([ROLES.ADMIN]);

/**
 * Patient or higher middleware
 */
const requirePatientOrHigher = requireMinimumRole(ROLES.PATIENT);

/**
 * Professional or higher middleware
 */
const requireProfessionalOrHigher = requireMinimumRole(ROLES.PROFESSIONAL);

module.exports = {
  authorize,
  requireMinimumRole,
  requireAdmin,
  requirePatientOrHigher,
  requireProfessionalOrHigher,
}; 