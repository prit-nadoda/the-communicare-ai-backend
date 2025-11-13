const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const hpp = require('hpp');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const path = require('path');

// Import config and helpers
const config = require('./config');
const logger = require('./helpers/logger');
const { errorHandler, notFoundHandler, methodNotAllowedHandler } = require('./middlewares/error.middleware');

// Import routes
const userRoutes = require('./api/v1/user/user.route');

// Create Express app
const app = express();

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security middleware
app.use(helmet());
app.use(hpp());
app.use(xss());
app.use(mongoSanitize());

// CORS configuration
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    status: 'error',
    code: 429,
    message: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to auth routes
app.use('/api/v1/user/login', limiter);
app.use('/api/v1/user/register', limiter);
app.use('/api/v1/user/refresh-token', limiter);

// Static files with custom CORS headers
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  const healthCheck = {
    status: 'success',
    code: 200,
    message: 'Server is healthy',
    data: {
      uptime: process.uptime(),
      timestamp: Date.now(),
      environment: config.nodeEnv,
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    },
  };
  res.status(200).json(healthCheck);
});

// API routes
app.use('/api/v1/user', userRoutes);

// Swagger documentation
try {
  const swaggerDocument = require('./docs/swagger.json');
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Node.js Boilerplate API Documentation',
  }));
} catch (error) {
  logger.warn('Swagger documentation not found, skipping...');
}

// 404 handler
app.use(notFoundHandler);

// Method not allowed handler
app.use(methodNotAllowedHandler);

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app; 