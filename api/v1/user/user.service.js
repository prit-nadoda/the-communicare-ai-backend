const User = require('./user.model');
const { generateTokens, verifyRefreshToken } = require('../../../helpers/token');
const MESSAGES = require('../../../constants/messages');
const ROLES = require('../../../constants/roles');
const { createNotFoundError, createConflictError, createUnauthorizedError } = require('../../../middlewares/error.middleware');
const logger = require('../../../helpers/logger');

/**
 * User service class
 */
const userService = {
  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Object} - Created user
   */
  async createUser(userData) {
    try {
      // Check if user already exists
      const existingUser = await User.findByEmail(userData.email);
      if (existingUser) {
        throw createConflictError(MESSAGES.ERROR.USER_ALREADY_EXISTS);
      }

      // Create new user
      const user = new User(userData);
      await user.save();

      // Remove password from response
      const userResponse = user.toObject();
      delete userResponse.password;

      logger.info(`User created: ${user.email}`);
      return userResponse;
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  },

  /**
   * Authenticate user and generate tokens
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Object} - User data and tokens
   */
  async loginUser(email, password) {
    try {
      // Find user by email and include password
      const user = await User.findByEmail(email).select('+password');
      if (!user) {
        throw createUnauthorizedError(MESSAGES.ERROR.INVALID_CREDENTIALS);
      }

      // Check if user is active
      if (!user.isActive) {
        throw createUnauthorizedError('Account is deactivated');
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw createUnauthorizedError(MESSAGES.ERROR.INVALID_CREDENTIALS);
      }

      // Generate tokens
      const tokenPayload = {
        userId: user._id,
        email: user.email,
        role: user.role,
      };

      const { accessToken, refreshToken } = generateTokens(tokenPayload);



      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Remove password from response
      const userResponse = user.toObject();
      delete userResponse.password;

      logger.info(`User logged in: ${user.email}`);
      return {
        user: userResponse,
        accessToken,
        refreshToken,
      };
    } catch (error) {
      logger.error('Error logging in user:', error);
      throw error;
    }
  },

  /**
   * Refresh access token
   * @param {string} refreshToken - Refresh token
   * @returns {Object} - New tokens
   */
  async refreshToken(refreshToken) {
    try {
      // Verify refresh token
      const decoded = verifyRefreshToken(refreshToken);

      // Find user
      const user = await User.findById(decoded.userId);
      if (!user) {
        throw createUnauthorizedError(MESSAGES.ERROR.REFRESH_TOKEN_INVALID);
      }

      // Check if user is active
      if (!user.isActive) {
        throw createUnauthorizedError('Account is deactivated');
      }

      // Generate new tokens
      const tokenPayload = {
        userId: user._id,
        email: user.email,
        role: user.role,
      };

      const { accessToken, refreshToken: newRefreshToken } = generateTokens(tokenPayload);

      logger.info(`Token refreshed for user: ${user.email}`);
      return {
        accessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      logger.error('Error refreshing token:', error);
      throw error;
    }
  },



  /**
   * Get user by ID
   * @param {string} userId - User ID
   * @returns {Object} - User data
   */
  async getUserById(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw createNotFoundError(MESSAGES.ERROR.USER_NOT_FOUND);
      }

      // Remove password from response
      const userResponse = user.toObject();
      delete userResponse.password;

      return userResponse;
    } catch (error) {
      logger.error('Error getting user by ID:', error);
      throw error;
    }
  },

  /**
   * Get all users with pagination and filters
   * @param {Object} options - Query options
   * @returns {Object} - Users and pagination info
   */
  async getUsers(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        search,
        role,
        isActive,
        isEmailVerified,
      } = options;

      // Build query
      const query = {};

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ];
      }

      if (role) {
        query.role = role;
      }

      if (typeof isActive === 'boolean') {
        query.isActive = isActive;
      }

      if (typeof isEmailVerified === 'boolean') {
        query.isEmailVerified = isEmailVerified;
      }

      // Build sort object
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Execute query
      const skip = (page - 1) * limit;
      const [users, totalCount] = await Promise.all([
        User.find(query)
          .select('-password')
          .sort(sort)
          .skip(skip)
          .limit(limit),
        User.countDocuments(query),
      ]);

      return {
        users,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          limit,
          hasNextPage: page < Math.ceil(totalCount / limit),
          hasPrevPage: page > 1,
        },
      };
    } catch (error) {
      logger.error('Error getting users:', error);
      throw error;
    }
  },

  /**
   * Update user
   * @param {string} userId - User ID
   * @param {Object} updateData - Update data
   * @returns {Object} - Updated user
   */
  async updateUser(userId, updateData) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw createNotFoundError(MESSAGES.ERROR.USER_NOT_FOUND);
      }

      // Check if email is being updated and if it already exists
      if (updateData.email && updateData.email !== user.email) {
        const existingUser = await User.findByEmail(updateData.email);
        if (existingUser) {
          throw createConflictError(MESSAGES.ERROR.USER_ALREADY_EXISTS);
        }
      }

      // Update user
      Object.assign(user, updateData);
      await user.save();

      // Remove password from response
      const userResponse = user.toObject();
      delete userResponse.password;

      logger.info(`User updated: ${user.email}`);
      return userResponse;
    } catch (error) {
      logger.error('Error updating user:', error);
      throw error;
    }
  },

  /**
   * Delete user
   * @param {string} userId - User ID
   */
  async deleteUser(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw createNotFoundError(MESSAGES.ERROR.USER_NOT_FOUND);
      }

      await User.findByIdAndDelete(userId);

      logger.info(`User deleted: ${user.email}`);
    } catch (error) {
      logger.error('Error deleting user:', error);
      throw error;
    }
  },

  /**
   * Change user password
   * @param {string} userId - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   */
  async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = await User.findById(userId).select('+password');
      if (!user) {
        throw createNotFoundError(MESSAGES.ERROR.USER_NOT_FOUND);
      }

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        throw createUnauthorizedError('Current password is incorrect');
      }

      // Update password
      user.password = newPassword;
      await user.save();

      logger.info(`Password changed for user: ${user.email}`);
    } catch (error) {
      logger.error('Error changing password:', error);
      throw error;
    }
  },
};

module.exports = userService; 