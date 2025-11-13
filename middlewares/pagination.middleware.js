const { successResponse, paginationResponse } = require('../helpers/response');
const { MESSAGES } = require('../constants/messages');
const { HTTP_CODES } = require('../constants/httpCodes');
const logger = require('../helpers/logger');

/**
 * Pagination middleware
 * Adds pagination info to request and response
 */
const paginationMiddleware = (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder || 'desc';

    // Validate pagination parameters
    if (page < 1) {
      return res.status(HTTP_CODES.BAD_REQUEST).json({
        status: 'error',
        code: HTTP_CODES.BAD_REQUEST,
        message: 'Page must be greater than 0',
      });
    }

    if (limit < 1 || limit > 100) {
      return res.status(HTTP_CODES.BAD_REQUEST).json({
        status: 'error',
        code: HTTP_CODES.BAD_REQUEST,
        message: 'Limit must be between 1 and 100',
      });
    }

    // Calculate skip value
    const skip = (page - 1) * limit;

    // Add pagination info to request
    req.pagination = {
      page,
      limit,
      skip,
      sortBy,
      sortOrder,
    };

    // Add pagination response helper to response object
    res.paginatedResponse = (message, data, totalCount) => {
      const totalPages = Math.ceil(totalCount / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      const pagination = {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? page + 1 : null,
        prevPage: hasPrevPage ? page - 1 : null,
      };

      return paginationResponse(res, message, data, pagination);
    };

    next();
  } catch (error) {
    logger.error('Pagination middleware error:', error);
    return res.status(HTTP_CODES.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      code: HTTP_CODES.INTERNAL_SERVER_ERROR,
      message: MESSAGES.ERROR.SOMETHING_WENT_WRONG,
    });
  }
};

/**
 * Filter middleware
 * Adds filtering capabilities to request
 */
const filterMiddleware = (req, res, next) => {
  try {
    const filters = {};

    // Extract filter parameters from query
    Object.keys(req.query).forEach(key => {
      if (!['page', 'limit', 'sortBy', 'sortOrder'].includes(key)) {
        const value = req.query[key];
        
        // Handle different filter types
        if (value === 'true' || value === 'false') {
          filters[key] = value === 'true';
        } else if (!isNaN(value)) {
          filters[key] = parseFloat(value);
        } else if (value.includes(',')) {
          // Handle array filters (comma-separated)
          filters[key] = value.split(',').map(v => v.trim());
        } else {
          filters[key] = value;
        }
      }
    });

    req.filters = filters;
    next();
  } catch (error) {
    logger.error('Filter middleware error:', error);
    return res.status(HTTP_CODES.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      code: HTTP_CODES.INTERNAL_SERVER_ERROR,
      message: MESSAGES.ERROR.SOMETHING_WENT_WRONG,
    });
  }
};

/**
 * Search middleware
 * Adds search capabilities to request
 */
const searchMiddleware = (req, res, next) => {
  try {
    const search = req.query.search;
    
    if (search) {
      req.search = search.trim();
    }

    next();
  } catch (error) {
    logger.error('Search middleware error:', error);
    return res.status(HTTP_CODES.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      code: HTTP_CODES.INTERNAL_SERVER_ERROR,
      message: MESSAGES.ERROR.SOMETHING_WENT_WRONG,
    });
  }
};

module.exports = {
  paginationMiddleware,
  filterMiddleware,
  searchMiddleware,
}; 