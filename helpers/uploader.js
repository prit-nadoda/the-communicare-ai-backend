const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config');
const logger = require('./logger');

// Ensure upload directory exists
const uploadDir = path.resolve(config.upload.uploadPath);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const filename = file.fieldname + '-' + uniqueSuffix + extension;
    cb(null, filename);
  },
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Define allowed file types
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxFileSize, // 5MB default
  },
});

/**
 * Single file upload middleware
 */
const uploadSingle = (fieldName) => {
  return upload.single(fieldName);
};

/**
 * Multiple files upload middleware
 */
const uploadMultiple = (fieldName, maxCount = 5) => {
  return upload.array(fieldName, maxCount);
};

/**
 * Multiple fields upload middleware
 */
const uploadFields = (fields) => {
  return upload.fields(fields);
};

/**
 * Get file URL
 * @param {string} filename - File name or full URL
 * @returns {string} - Full file URL with API base
 */
const getFileUrl = (filename) => {
  if (!filename) return null;
  
  // If already a full URL, return as is
  if (filename.startsWith('http://') || filename.startsWith('https://')) {
    return filename;
  }
  
  // If already includes /uploads/, just prepend API_URL
  if (filename.startsWith('/uploads/')) {
    return `${config.apiUrl}${filename}`;
  }
  
  // Otherwise, construct full URL
  return `${config.apiUrl}/uploads/${filename}`;
};

/**
 * Delete file
 * @param {string} filename - File name
 * @returns {boolean} - Success status
 */
const deleteFile = (filename) => {
  if (!filename) return false;
  
  try {
    const filePath = path.join(uploadDir, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.info(`File deleted: ${filename}`);
      return true;
    }
    return false;
  } catch (error) {
    logger.error(`Error deleting file ${filename}:`, error);
    return false;
  }
};

/**
 * Get file metadata
 * @param {Object} file - Multer file object
 * @returns {Object} - File metadata
 */
const getFileMetadata = (file) => {
  if (!file) return null;

  return {
    originalName: file.originalname,
    filename: file.filename,
    mimetype: file.mimetype,
    size: file.size,
    url: getFileUrl(file.filename),
    path: file.path,
  };
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  uploadFields,
  getFileUrl,
  deleteFile,
  getFileMetadata,
}; 