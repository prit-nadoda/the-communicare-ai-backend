const userService = require('./user.service');
const { successResponse } = require('../../../helpers/response');
const MESSAGES = require('../../../constants/messages');
const HTTP_CODES = require('../../../constants/httpCodes');
const RESPONSE_TAGS = require('../../../constants/responseTags');
const { asyncHandler } = require('../../../middlewares/error.middleware');
const logger = require('../../../helpers/logger');

/**
 * User controller
 */
const userController = {
  /**
   * Register a new user
   * POST /api/v1/user/register
   */
  register: asyncHandler(async (req, res) => {
    const userData = req.body;
    const user = await userService.createUser(userData);
    
    logger.info(`User registration successful: ${user.email}`);
    return successResponse(res, HTTP_CODES.CREATED, MESSAGES.SUCCESS.USER_CREATED, user, RESPONSE_TAGS.SUCCESS.USER_CREATED);
  }),

  /**
   * Login user
   * POST /api/v1/user/login
   */
  login: asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const result = await userService.loginUser(email, password);
    
    logger.info(`User login successful: ${result.user.email}`);
    return successResponse(res, HTTP_CODES.OK, MESSAGES.SUCCESS.LOGIN_SUCCESS, result, RESPONSE_TAGS.SUCCESS.LOGIN_SUCCESS);
  }),

  /**
   * Refresh access token
   * POST /api/v1/user/refresh-token
   */
  refreshToken: asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    const tokens = await userService.refreshToken(refreshToken);
    
    logger.info('Token refresh successful');
    return successResponse(res, HTTP_CODES.OK, MESSAGES.SUCCESS.TOKEN_REFRESHED, tokens, RESPONSE_TAGS.SUCCESS.TOKEN_REFRESHED);
  }),



  /**
   * Get current user profile
   * GET /api/v1/user/profile
   */
  getProfile: asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const user = await userService.getUserById(userId);
    
    logger.info(`Profile retrieved: ${user.email}`);
    return successResponse(res, HTTP_CODES.OK, MESSAGES.SUCCESS.USER_FOUND, user, RESPONSE_TAGS.SUCCESS.USER_FOUND);
  }),

  /**
   * Update current user profile
   * PUT /api/v1/user/profile
   */
  updateProfile: asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const updateData = req.body;
    
    const user = await userService.updateUser(userId, updateData);
    
    logger.info(`Profile updated: ${user.email}`);
    return successResponse(res, HTTP_CODES.OK, MESSAGES.SUCCESS.USER_UPDATED, user, RESPONSE_TAGS.SUCCESS.USER_UPDATED);
  }),

  /**
   * Change password
   * POST /api/v1/user/change-password
   */
  changePassword: asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;
    
    await userService.changePassword(userId, currentPassword, newPassword);
    
    logger.info(`Password changed for user: ${req.user.email}`);
    return successResponse(res, HTTP_CODES.OK, 'Password changed successfully', null, RESPONSE_TAGS.SUCCESS.USER_UPDATED);
  }),

  /**
   * Get user by ID (admin only)
   * GET /api/v1/user/:userId
   */
  getUserById: asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const user = await userService.getUserById(userId);
    
    logger.info(`User retrieved by ID: ${user.email}`);
    return successResponse(res, HTTP_CODES.OK, MESSAGES.SUCCESS.USER_FOUND, user, RESPONSE_TAGS.SUCCESS.USER_FOUND);
  }),

  /**
   * Get all users with pagination and filters (admin only)
   * GET /api/v1/user
   */
  getUsers: asyncHandler(async (req, res) => {
    const options = {
      page: req.pagination?.page || 1,
      limit: req.pagination?.limit || 10,
      sortBy: req.pagination?.sortBy || 'createdAt',
      sortOrder: req.pagination?.sortOrder || 'desc',
      search: req.search,
      ...req.filters,
    };
    
    const result = await userService.getUsers(options);
    
    logger.info(`Users retrieved: ${result.users.length} users`);
    return res.paginatedResponse(MESSAGES.SUCCESS.USERS_FOUND, result.users, result.pagination.totalCount, RESPONSE_TAGS.SUCCESS.USERS_FOUND);
  }),

  /**
   * Update user by ID (admin only)
   * PUT /api/v1/user/:userId
   */
  updateUser: asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const updateData = req.body;
    
    const user = await userService.updateUser(userId, updateData);
    
    logger.info(`User updated by admin: ${user.email}`);
    return successResponse(res, HTTP_CODES.OK, MESSAGES.SUCCESS.USER_UPDATED, user, RESPONSE_TAGS.SUCCESS.USER_UPDATED);
  }),

  /**
   * Delete user by ID (admin only)
   * DELETE /api/v1/user/:userId
   */
  deleteUser: asyncHandler(async (req, res) => {
    const { userId } = req.params;
    
    await userService.deleteUser(userId);
    
    logger.info(`User deleted by admin: ${userId}`);
    return successResponse(res, HTTP_CODES.OK, MESSAGES.SUCCESS.USER_DELETED, null, RESPONSE_TAGS.SUCCESS.USER_DELETED);
  }),
};

module.exports = userController; 