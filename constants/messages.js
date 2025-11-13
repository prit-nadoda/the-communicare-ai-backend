const MESSAGES = {
  // Success Messages
  SUCCESS: {
    USER_CREATED: 'User created successfully',
    USER_UPDATED: 'User updated successfully',
    USER_DELETED: 'User deleted successfully',
    USER_FOUND: 'User found successfully',
    USERS_FOUND: 'Users found successfully',
    LOGIN_SUCCESS: 'Login successful',

    TOKEN_REFRESHED: 'Token refreshed successfully',
    FILE_UPLOADED: 'File uploaded successfully',
    HEALTH_CHECK: 'Server is healthy',
  },

  // Error Messages
  ERROR: {
    // Authentication Errors
    UNAUTHORIZED: 'Unauthorized access',
    INVALID_CREDENTIALS: 'Invalid email or password',
    TOKEN_EXPIRED: 'Token has expired',
    TOKEN_INVALID: 'Invalid token',
    TOKEN_MISSING: 'Access token is required',
    REFRESH_TOKEN_INVALID: 'Invalid refresh token',
    REFRESH_TOKEN_EXPIRED: 'Refresh token has expired',
    INSUFFICIENT_PERMISSIONS: 'Insufficient permissions',

    // User Errors
    USER_NOT_FOUND: 'User not found',
    USER_ALREADY_EXISTS: 'User already exists',
    USER_UPDATE_FAILED: 'Failed to update user',
    USER_DELETE_FAILED: 'Failed to delete user',

    // Validation Errors
    VALIDATION_ERROR: 'Validation error',
    INVALID_EMAIL: 'Invalid email format',
    INVALID_PASSWORD: 'Password must be at least 6 characters long',
    INVALID_ROLE: 'Invalid role specified',

    // File Upload Errors
    FILE_TOO_LARGE: 'File size exceeds maximum limit',
    INVALID_FILE_TYPE: 'Invalid file type',
    FILE_UPLOAD_FAILED: 'File upload failed',

    // Server Errors
    INTERNAL_SERVER_ERROR: 'Internal server error',
    DATABASE_ERROR: 'Database error occurred',
    RATE_LIMIT_EXCEEDED: 'Too many requests, please try again later',

    // Not Found Errors
    ROUTE_NOT_FOUND: 'Route not found',
    METHOD_NOT_ALLOWED: 'Method not allowed',

    // General Errors
    SOMETHING_WENT_WRONG: 'Something went wrong',
    INVALID_REQUEST: 'Invalid request',
  },
};

module.exports = MESSAGES; 