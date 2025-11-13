const app = require('./app');
const mongoose = require('mongoose');
const config = require('./config');
const logger = require('./helpers/logger');

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  logger.error('Error', err);
  process.exit(1);
});

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongodb.uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

// Start server function
const startServer = () => {
  const server = app.listen(config.port, () => {
    logger.info(`Server running in ${config.nodeEnv} mode on port ${config.port}`);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
    logger.error('Error', err);
    server.close(() => {
      process.exit(1);
    });
  });

  // Handle SIGTERM
  process.on('SIGTERM', () => {
    logger.info('SIGTERM RECEIVED. Shutting down gracefully');
    gracefulShutdown('SIGTERM');
  });

  // Handle SIGINT
  process.on('SIGINT', () => {
    logger.info('SIGINT RECEIVED. Shutting down gracefully');
    gracefulShutdown('SIGINT');
  });

  // Graceful shutdown
  const gracefulShutdown = (signal) => {
    logger.info(`${signal} received. Starting graceful shutdown...`);
    
    server.close(async () => {
      logger.info('HTTP server closed');
      
      try {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed');
        process.exit(0);
      } catch (error) {
        logger.error('Error closing MongoDB connection:', error);
        process.exit(1);
      }
    });
  };



  return server;
};

// Connect to database and start server
connectDB().then(() => {
  logger.info('Database connected successfully');
  startServer();
}); 