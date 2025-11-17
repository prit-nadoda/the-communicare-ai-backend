const Patient = require('./patient.model');
const User = require('../user/user.model');
const { ROLES } = require('../../../constants/roles');
const MESSAGES = require('../../../constants/messages');
const RESPONSE_TAGS = require('../../../constants/responseTags');
const { createNotFoundError, createConflictError } = require('../../../middlewares/error.middleware');
const logger = require('../../../helpers/logger');

/**
 * Patient service
 */
const patientService = {
  /**
   * Register a new patient
   * @param {Object} registrationData - Patient registration data
   * @returns {Object} - Created patient with user data
   */
  async registerPatient(registrationData) {
    try {
      const { name, email, password, birthDate, gender, contact, chronicConditions, allergies, emergencyContact, medicalHistory } = registrationData;

      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        throw createConflictError(MESSAGES.ERROR.USER_ALREADY_EXISTS, RESPONSE_TAGS.RESOURCE.USER_ALREADY_EXISTS);
      }

      // Create user
      const user = new User({
        name,
        email,
        password,
        role: ROLES.PATIENT,
        isActive: true,
        isEmailVerified: false,
      });
      await user.save();

      // Create patient
      const patient = new Patient({
        user: user._id,
        birthDate,
        gender,
        contact,
        chronicConditions: chronicConditions || [],
        allergies: allergies || [],
        emergencyContact,
        medicalHistory,
        isActive: true,
      });
      await patient.save();

      // Populate user data
      await patient.populate('user', '-password');
      await patient.populate('chronicConditions');
      await patient.populate('allergies');

      logger.info(`Patient registered: ${user.email}`);
      return patient;
    } catch (error) {
      logger.error('Error registering patient:', error);
      throw error;
    }
  },

  /**
   * Get patient by ID
   * @param {string} patientId - Patient ID
   * @returns {Object} - Patient data
   */
  async getPatientById(patientId) {
    try {
      const patient = await Patient.findById(patientId)
        .populate('user', '-password')
        .populate('chronicConditions')
        .populate('allergies');
      
      if (!patient) {
        throw createNotFoundError('Patient not found', RESPONSE_TAGS.RESOURCE.NOT_FOUND);
      }

      return patient;
    } catch (error) {
      logger.error('Error getting patient by ID:', error);
      throw error;
    }
  },

  /**
   * Get patient by user ID
   * @param {string} userId - User ID
   * @returns {Object} - Patient data
   */
  async getPatientByUserId(userId) {
    try {
      const patient = await Patient.findByUserId(userId);
      
      if (!patient) {
        throw createNotFoundError('Patient not found', RESPONSE_TAGS.RESOURCE.NOT_FOUND);
      }

      return patient;
    } catch (error) {
      logger.error('Error getting patient by user ID:', error);
      throw error;
    }
  },

  /**
   * Get all patients with pagination and filters
   * @param {Object} options - Query options
   * @returns {Object} - Patients and pagination info
   */
  async getPatients(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        search,
        gender,
        isActive,
      } = options;

      // Build query
      const query = {};

      if (search) {
        // Search in user name and email
        const users = await User.find({
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
          ],
        }).select('_id');
        
        query.user = { $in: users.map(u => u._id) };
      }

      if (gender) {
        query.gender = gender;
      }

      if (typeof isActive === 'boolean') {
        query.isActive = isActive;
      }

      // Build sort object
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Execute query
      const skip = (page - 1) * limit;
      const [patients, totalCount] = await Promise.all([
        Patient.find(query)
          .populate('user', '-password')
          .populate('chronicConditions')
          .populate('allergies')
          .sort(sort)
          .skip(skip)
          .limit(limit),
        Patient.countDocuments(query),
      ]);

      return {
        patients,
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
      logger.error('Error getting patients:', error);
      throw error;
    }
  },

  /**
   * Update patient
   * @param {string} patientId - Patient ID
   * @param {Object} updateData - Update data
   * @returns {Object} - Updated patient
   */
  async updatePatient(patientId, updateData) {
    try {
      const patient = await Patient.findById(patientId);
      if (!patient) {
        throw createNotFoundError('Patient not found', RESPONSE_TAGS.RESOURCE.NOT_FOUND);
      }

      Object.assign(patient, updateData);
      await patient.save();

      await patient.populate('user', '-password');
      await patient.populate('chronicConditions');
      await patient.populate('allergies');

      logger.info(`Patient updated: ${patientId}`);
      return patient;
    } catch (error) {
      logger.error('Error updating patient:', error);
      throw error;
    }
  },

  /**
   * Delete patient
   * @param {string} patientId - Patient ID
   */
  async deletePatient(patientId) {
    try {
      const patient = await Patient.findById(patientId);
      if (!patient) {
        throw createNotFoundError('Patient not found', RESPONSE_TAGS.RESOURCE.NOT_FOUND);
      }

      // Delete associated user
      await User.findByIdAndDelete(patient.user);
      
      // Delete patient
      await Patient.findByIdAndDelete(patientId);

      logger.info(`Patient deleted: ${patientId}`);
    } catch (error) {
      logger.error('Error deleting patient:', error);
      throw error;
    }
  },
};

module.exports = patientService;

