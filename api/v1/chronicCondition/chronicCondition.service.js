const ChronicCondition = require('./chronicCondition.model');
const MESSAGES = require('../../../constants/messages');
const RESPONSE_TAGS = require('../../../constants/responseTags');
const { createNotFoundError, createConflictError } = require('../../../middlewares/error.middleware');
const logger = require('../../../helpers/logger');

/**
 * Chronic Condition service
 */
const chronicConditionService = {
  /**
   * Create a new chronic condition
   * @param {Object} conditionData - Chronic condition data
   * @returns {Object} - Created chronic condition
   */
  async createChronicCondition(conditionData) {
    try {
      // Check if condition already exists
      const existingCondition = await ChronicCondition.findByName(conditionData.name);
      if (existingCondition) {
        throw createConflictError('Chronic condition already exists', RESPONSE_TAGS.RESOURCE.ALREADY_EXISTS);
      }

      const condition = new ChronicCondition(conditionData);
      await condition.save();

      logger.info(`Chronic condition created: ${condition.name}`);
      return condition;
    } catch (error) {
      logger.error('Error creating chronic condition:', error);
      throw error;
    }
  },

  /**
   * Get all chronic conditions with pagination and filters
   * @param {Object} options - Query options
   * @returns {Object} - Chronic conditions and pagination info
   */
  async getChronicConditions(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'name',
        sortOrder = 'asc',
        search,
        isActive,
      } = options;

      // Build query
      const query = {};

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { code: { $regex: search, $options: 'i' } },
        ];
      }

      if (typeof isActive === 'boolean') {
        query.isActive = isActive;
      }

      // Build sort object
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Execute query
      const skip = (page - 1) * limit;
      const [conditions, totalCount] = await Promise.all([
        ChronicCondition.find(query)
          .sort(sort)
          .skip(skip)
          .limit(limit),
        ChronicCondition.countDocuments(query),
      ]);

      return {
        conditions,
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
      logger.error('Error getting chronic conditions:', error);
      throw error;
    }
  },

  /**
   * Get chronic condition by ID
   * @param {string} conditionId - Chronic condition ID
   * @returns {Object} - Chronic condition data
   */
  async getChronicConditionById(conditionId) {
    try {
      const condition = await ChronicCondition.findById(conditionId);
      if (!condition) {
        throw createNotFoundError('Chronic condition not found', RESPONSE_TAGS.RESOURCE.NOT_FOUND);
      }

      return condition;
    } catch (error) {
      logger.error('Error getting chronic condition by ID:', error);
      throw error;
    }
  },

  /**
   * Update chronic condition
   * @param {string} conditionId - Chronic condition ID
   * @param {Object} updateData - Update data
   * @returns {Object} - Updated chronic condition
   */
  async updateChronicCondition(conditionId, updateData) {
    try {
      const condition = await ChronicCondition.findById(conditionId);
      if (!condition) {
        throw createNotFoundError('Chronic condition not found', RESPONSE_TAGS.RESOURCE.NOT_FOUND);
      }

      // Check if name is being updated and if it already exists
      if (updateData.name && updateData.name !== condition.name) {
        const existingCondition = await ChronicCondition.findByName(updateData.name);
        if (existingCondition) {
          throw createConflictError('Chronic condition with this name already exists', RESPONSE_TAGS.RESOURCE.ALREADY_EXISTS);
        }
      }

      Object.assign(condition, updateData);
      await condition.save();

      logger.info(`Chronic condition updated: ${condition.name}`);
      return condition;
    } catch (error) {
      logger.error('Error updating chronic condition:', error);
      throw error;
    }
  },

  /**
   * Delete chronic condition
   * @param {string} conditionId - Chronic condition ID
   */
  async deleteChronicCondition(conditionId) {
    try {
      const condition = await ChronicCondition.findById(conditionId);
      if (!condition) {
        throw createNotFoundError('Chronic condition not found', RESPONSE_TAGS.RESOURCE.NOT_FOUND);
      }

      await ChronicCondition.findByIdAndDelete(conditionId);

      logger.info(`Chronic condition deleted: ${condition.name}`);
    } catch (error) {
      logger.error('Error deleting chronic condition:', error);
      throw error;
    }
  },
};

module.exports = chronicConditionService;

