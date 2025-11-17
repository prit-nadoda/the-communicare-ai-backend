const Allergy = require('./allergy.model');
const MESSAGES = require('../../../constants/messages');
const RESPONSE_TAGS = require('../../../constants/responseTags');
const { createNotFoundError, createConflictError } = require('../../../middlewares/error.middleware');
const logger = require('../../../helpers/logger');

/**
 * Allergy service
 */
const allergyService = {
  /**
   * Create a new allergy
   * @param {Object} allergyData - Allergy data
   * @returns {Object} - Created allergy
   */
  async createAllergy(allergyData) {
    try {
      // Check if allergy already exists
      const existingAllergy = await Allergy.findByName(allergyData.name);
      if (existingAllergy) {
        throw createConflictError('Allergy already exists', RESPONSE_TAGS.RESOURCE.ALREADY_EXISTS);
      }

      const allergy = new Allergy(allergyData);
      await allergy.save();

      logger.info(`Allergy created: ${allergy.name}`);
      return allergy;
    } catch (error) {
      logger.error('Error creating allergy:', error);
      throw error;
    }
  },

  /**
   * Get all allergies with pagination and filters
   * @param {Object} options - Query options
   * @returns {Object} - Allergies and pagination info
   */
  async getAllergies(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'name',
        sortOrder = 'asc',
        search,
        category,
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

      if (category) {
        query.category = category;
      }

      if (typeof isActive === 'boolean') {
        query.isActive = isActive;
      }

      // Build sort object
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Execute query
      const skip = (page - 1) * limit;
      const [allergies, totalCount] = await Promise.all([
        Allergy.find(query)
          .sort(sort)
          .skip(skip)
          .limit(limit),
        Allergy.countDocuments(query),
      ]);

      return {
        allergies,
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
      logger.error('Error getting allergies:', error);
      throw error;
    }
  },

  /**
   * Get allergy by ID
   * @param {string} allergyId - Allergy ID
   * @returns {Object} - Allergy data
   */
  async getAllergyById(allergyId) {
    try {
      const allergy = await Allergy.findById(allergyId);
      if (!allergy) {
        throw createNotFoundError('Allergy not found', RESPONSE_TAGS.RESOURCE.NOT_FOUND);
      }

      return allergy;
    } catch (error) {
      logger.error('Error getting allergy by ID:', error);
      throw error;
    }
  },

  /**
   * Update allergy
   * @param {string} allergyId - Allergy ID
   * @param {Object} updateData - Update data
   * @returns {Object} - Updated allergy
   */
  async updateAllergy(allergyId, updateData) {
    try {
      const allergy = await Allergy.findById(allergyId);
      if (!allergy) {
        throw createNotFoundError('Allergy not found', RESPONSE_TAGS.RESOURCE.NOT_FOUND);
      }

      // Check if name is being updated and if it already exists
      if (updateData.name && updateData.name !== allergy.name) {
        const existingAllergy = await Allergy.findByName(updateData.name);
        if (existingAllergy) {
          throw createConflictError('Allergy with this name already exists', RESPONSE_TAGS.RESOURCE.ALREADY_EXISTS);
        }
      }

      Object.assign(allergy, updateData);
      await allergy.save();

      logger.info(`Allergy updated: ${allergy.name}`);
      return allergy;
    } catch (error) {
      logger.error('Error updating allergy:', error);
      throw error;
    }
  },

  /**
   * Delete allergy
   * @param {string} allergyId - Allergy ID
   */
  async deleteAllergy(allergyId) {
    try {
      const allergy = await Allergy.findById(allergyId);
      if (!allergy) {
        throw createNotFoundError('Allergy not found', RESPONSE_TAGS.RESOURCE.NOT_FOUND);
      }

      await Allergy.findByIdAndDelete(allergyId);

      logger.info(`Allergy deleted: ${allergy.name}`);
    } catch (error) {
      logger.error('Error deleting allergy:', error);
      throw error;
    }
  },
};

module.exports = allergyService;

