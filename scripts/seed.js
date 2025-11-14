const mongoose = require('mongoose');
const config = require('../config');
const logger = require('../helpers/logger');
const User = require('../api/v1/user/user.model');
const { ROLES } = require('../constants/roles');

/**
 * Database seed script
 * Creates default admin user if not exists
 */
const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    logger.info('Connecting to database...');
    await mongoose.connect(config.mongodb.uri);
    logger.info('Database connected successfully');

    // Default admin credentials
    const defaultAdmin = {
      name: 'Admin User',
      email: 'admin@yopmail.com',
      password: 'Admin@123',
      role: ROLES.ADMIN,
      isActive: true,
      isEmailVerified: true,
    };

    // Check if admin already exists
    const existingAdmin = await User.findByEmail(defaultAdmin.email);

    if (existingAdmin) {
      logger.info(`Admin user already exists: ${defaultAdmin.email}`);
      logger.info('Skipping seed...');
    } else {
      // Create admin user
      const admin = new User(defaultAdmin);
      await admin.save();
      
      logger.info('✅ Database seeded successfully!');
      logger.info('='.repeat(50));
      logger.info('Default Admin Credentials:');
      logger.info(`Email: ${defaultAdmin.email}`);
      logger.info(`Password: ${defaultAdmin.password}`);
      logger.info(`Role: ${defaultAdmin.role}`);
      logger.info('='.repeat(50));
      logger.info('⚠️  Please change the default password after first login!');
    }

    // Disconnect from database
    await mongoose.connection.close();
    logger.info('Database connection closed');
    process.exit(0);
  } catch (error) {
    logger.error('Error seeding database:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run seed
seedDatabase();

