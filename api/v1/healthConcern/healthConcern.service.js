const HealthConcern = require('./healthConcern.model');
const MESSAGES = require('../../../constants/messages');
const RESPONSE_TAGS = require('../../../constants/responseTags');
const logger = require('../../../helpers/logger');
const { 
  createNotFoundError, 
  createForbiddenError,
  createBadRequestError 
} = require('../../../middlewares/error.middleware');

/**
 * Health Concern Service
 * Handles business logic for patient health concerns
 */
const healthConcernService = {
  /**
   * Create a new health concern
   */
  async createHealthConcern(userId, data) {
    try {
      const healthConcern = await HealthConcern.create({
        user: userId,
        ...data
      });

      logger.info(`Health concern created by user: ${userId}`);
      return healthConcern;
    } catch (error) {
      logger.error('Error creating health concern:', error);
      throw error;
    }
  },

  /**
   * Get all health concerns for a user with pagination and filters
   */
  async getHealthConcerns(userId, { pagination, search, filters }) {
    try {
      const { skip, limit, sortBy, sortOrder } = pagination;
      
      // Build query - user can only see their own health concerns
      const query = { user: userId, isActive: true, ...filters };
      
      // Add search functionality using regex (case-insensitive)
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { chiefComplaint: { $regex: search, $options: 'i' } },
          { symptoms: { $regex: search, $options: 'i' } }
        ];
      }
      
      // Execute query with pagination
      const healthConcerns = await HealthConcern.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .populate('user', 'name email');
      
      const totalCount = await HealthConcern.countDocuments(query);
      
      logger.info(`Retrieved ${healthConcerns.length} health concerns for user: ${userId}`);
      return {
        data: healthConcerns,
        totalCount
      };
    } catch (error) {
      logger.error('Error fetching health concerns:', error);
      throw error;
    }
  },

  /**
   * Get a single health concern by ID
   */
  async getHealthConcernById(concernId, userId) {
    try {
      const healthConcern = await HealthConcern.findById(concernId)
        .populate('user', 'name email');
      
      if (!healthConcern || !healthConcern.isActive) {
        throw createNotFoundError(
          'Health concern not found',
          RESPONSE_TAGS.RESOURCE.RESOURCE_NOT_FOUND
        );
      }

      // Check ownership - user can only access their own health concerns
      if (healthConcern.user._id.toString() !== userId) {
        throw createForbiddenError(
          'You do not have permission to access this health concern',
          RESPONSE_TAGS.AUTH.INSUFFICIENT_PERMISSIONS
        );
      }
      
      logger.info(`Health concern retrieved: ${concernId}`);
      return healthConcern;
    } catch (error) {
      logger.error('Error fetching health concern:', error);
      throw error;
    }
  },

  /**
   * Update a health concern
   */
  async updateHealthConcern(concernId, userId, data) {
    try {
      const healthConcern = await HealthConcern.findById(concernId);
      
      if (!healthConcern || !healthConcern.isActive) {
        throw createNotFoundError(
          'Health concern not found',
          RESPONSE_TAGS.RESOURCE.RESOURCE_NOT_FOUND
        );
      }

      // Check ownership - user can only update their own health concerns
      if (healthConcern.user.toString() !== userId) {
        throw createForbiddenError(
          'You do not have permission to update this health concern',
          RESPONSE_TAGS.AUTH.INSUFFICIENT_PERMISSIONS
        );
      }
      
      // Update fields
      Object.assign(healthConcern, data);
      await healthConcern.save();
      
      // Populate user info
      await healthConcern.populate('user', 'name email');
      
      logger.info(`Health concern updated: ${concernId}`);
      return healthConcern;
    } catch (error) {
      logger.error('Error updating health concern:', error);
      throw error;
    }
  },

  /**
   * Delete a health concern (soft delete)
   */
  async deleteHealthConcern(concernId, userId) {
    try {
      const healthConcern = await HealthConcern.findById(concernId);
      
      if (!healthConcern || !healthConcern.isActive) {
        throw createNotFoundError(
          'Health concern not found',
          RESPONSE_TAGS.RESOURCE.RESOURCE_NOT_FOUND
        );
      }

      // Check ownership - user can only delete their own health concerns
      if (healthConcern.user.toString() !== userId) {
        throw createForbiddenError(
          'You do not have permission to delete this health concern',
          RESPONSE_TAGS.AUTH.INSUFFICIENT_PERMISSIONS
        );
      }
      
      // Soft delete
      await healthConcern.softDelete();
      
      logger.info(`Health concern deleted: ${concernId}`);
      return healthConcern;
    } catch (error) {
      logger.error('Error deleting health concern:', error);
      throw error;
    }
  },

  /**
   * Get active health concerns for a user
   */
  async getActiveHealthConcerns(userId) {
    try {
      const healthConcerns = await HealthConcern.findActiveByUser(userId)
        .populate('user', 'name email');
      
      logger.info(`Retrieved ${healthConcerns.length} active health concerns for user: ${userId}`);
      return healthConcerns;
    } catch (error) {
      logger.error('Error fetching active health concerns:', error);
      throw error;
    }
  },

  /**
   * Mark a health concern as resolved
   */
  async resolveHealthConcern(concernId, userId) {
    try {
      const healthConcern = await HealthConcern.findById(concernId);
      
      if (!healthConcern || !healthConcern.isActive) {
        throw createNotFoundError(
          'Health concern not found',
          RESPONSE_TAGS.RESOURCE.RESOURCE_NOT_FOUND
        );
      }

      // Check ownership
      if (healthConcern.user.toString() !== userId) {
        throw createForbiddenError(
          'You do not have permission to update this health concern',
          RESPONSE_TAGS.AUTH.INSUFFICIENT_PERMISSIONS
        );
      }
      
      await healthConcern.markAsResolved();
      await healthConcern.populate('user', 'name email');
      
      logger.info(`Health concern marked as resolved: ${concernId}`);
      return healthConcern;
    } catch (error) {
      logger.error('Error resolving health concern:', error);
      throw error;
    }
  }
};

module.exports = healthConcernService;

