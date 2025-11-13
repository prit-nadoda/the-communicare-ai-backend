# Node.js MongoDB Backend Boilerplate

A comprehensive Node.js MongoDB backend boilerplate with JWT authentication, RBAC, and Swagger documentation.

## 🚀 Features

- **JWT Authentication** - Access token + Refresh token flow
- **Role-Based Access Control (RBAC)** - User, Moderator, Admin roles
- **MongoDB Integration** - Mongoose ODM with optimized schemas
- **Input Validation** - Joi schema validation
- **Security Middleware** - Helmet, CORS, XSS protection, NoSQL injection prevention
- **Rate Limiting** - Express rate limiting on auth endpoints
- **File Upload** - Multer-based file upload with validation
- **Logging** - Winston logger with file and console output
- **Error Handling** - Global error handler with custom error classes
- **API Documentation** - Swagger UI with comprehensive documentation
- **Health Check** - Server health monitoring endpoint
- **Pagination & Filtering** - Built-in pagination, search, and filtering
- **Standardized Responses** - Consistent API response format

## 📁 Project Structure

```
project/
│
├── api/
│   └── v1/
│       └── user/
│           ├── user.controller.js
│           ├── user.service.js
│           ├── user.route.js
│           ├── user.model.js
│           └── user.validation.js
│
├── config/
│   └── index.js
│
├── constants/
│   ├── messages.js
│   ├── httpCodes.js
│   └── roles.js
│
├── middlewares/
│   ├── auth.middleware.js
│   ├── rbac.middleware.js
│   ├── error.middleware.js
│   ├── validator.middleware.js
│   └── pagination.middleware.js
│
├── helpers/
│   ├── logger.js
│   ├── response.js
│   ├── token.js
│   ├── uploader.js
│   └── sanitizer.js
│
├── uploads/
├── docs/
│   └── swagger.yaml
├── logs/
├── .env
├── app.js
└── server.js
```

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd node-js-boilerplate
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start MongoDB**
   ```bash
   # Make sure MongoDB is running locally or update MONGODB_URI in .env
   ```

5. **Run the application**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## ⚙️ Configuration

### Environment Variables

```env
# Server Configuration
NODE_ENV=development
PORT=3000

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/node-boilerplate

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# File Upload Configuration
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

## 🔐 Authentication

### JWT Token Flow

1. **Register/Login** - Get access and refresh tokens
2. **API Requests** - Include access token in Authorization header
3. **Token Refresh** - Use refresh token to get new access token

### Role-Based Access Control

- **User** - Basic access to own profile
- **Moderator** - User access + content moderation
- **Admin** - Full system access

## 📚 API Documentation

Access the interactive API documentation at:
```
http://localhost:3000/docs
```

## 🚀 API Endpoints

### Authentication
- `POST /api/v1/user/register` - Register new user
- `POST /api/v1/user/login` - Login user
- `POST /api/v1/user/refresh-token` - Refresh access token

### User Profile
- `GET /api/v1/user/profile` - Get current user profile
- `PUT /api/v1/user/profile` - Update current user profile
- `POST /api/v1/user/change-password` - Change password

### Admin (Admin only)
- `GET /api/v1/user` - Get all users with pagination
- `GET /api/v1/user/:userId` - Get user by ID
- `PUT /api/v1/user/:userId` - Update user by ID
- `DELETE /api/v1/user/:userId` - Delete user by ID

### Health Check
- `GET /health` - Server health status

## 🔧 Adding New Modules

1. **Create module structure**
   ```
   api/v1/your-module/
   ├── your-module.controller.js
   ├── your-module.service.js
   ├── your-module.route.js
   ├── your-module.model.js
   └── your-module.validation.js
   ```

2. **Add routes to app.js**
   ```javascript
   const yourModuleRoutes = require('./api/v1/your-module/your-module.route');
   app.use('/api/v1/your-module', yourModuleRoutes);
   ```

3. **Update Swagger documentation**
   - Add new paths to `docs/swagger.yaml`

## 🛡️ Security Features

- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **XSS Protection** - XSS attack prevention
- **NoSQL Injection Protection** - MongoDB query sanitization
- **Rate Limiting** - Request rate limiting
- **Input Validation** - Request data validation
- **JWT Security** - Secure token handling

## 📝 Logging

Logs are written to:
- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only
- Console output (development only)

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run tests with coverage
npm run test:coverage
```

## 📦 Scripts

```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm test           # Run tests
npm run lint       # Run linter (when configured)
```

## 🚀 Deployment

### Environment Variables for Production

```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://your-mongodb-uri
JWT_SECRET=your-production-jwt-secret
JWT_REFRESH_SECRET=your-production-refresh-secret
CORS_ORIGIN=https://your-frontend-domain.com
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, please open an issue in the repository or contact the maintainers.

---

**Happy Coding! 🎉** 