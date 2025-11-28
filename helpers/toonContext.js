const { encode } = require('@toon-format/toon');
const logger = require('./logger');

/**
 * TOON Context Builder
 * 
 * Uses the official @toon-format/toon library to convert context objects
 * into token-efficient TOON format for LLM prompts.
 */

/**
 * Clean context object by removing unnecessary fields before encoding
 * @param {Object} obj - Object to clean
 * @returns {Object} - Cleaned object
 */
const cleanContext = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const fieldsToRemove = [
    'password',
    'refreshToken',
    'accessToken',
    '__v',
    'llmMetadata',
    'reportPayload',
  ];
  
  const cleaned = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (fieldsToRemove.includes(key)) continue;
    
    if (Array.isArray(value)) {
      cleaned[key] = value.map(item => cleanContext(item));
    } else if (value && typeof value === 'object' && !(value instanceof Date)) {
      // Handle Mongoose ObjectId
      if (value._id && Object.keys(value).length === 1) {
        cleaned[key] = value._id.toString();
      } else {
        cleaned[key] = cleanContext(value);
      }
    } else {
      cleaned[key] = value;
    }
  }
  
  return cleaned;
};

/**
 * Build TOON context for assessment generation
 * @param {Object} contextData - Raw context data
 * @returns {string} - TOON-encoded string
 */
const buildToonContext = (contextData) => {
  try {
    // Clean the context first
    const cleaned = cleanContext(contextData);
    
    // Encode to TOON using official library with recommended options
    const toonString = encode(cleaned, {
      indent: 2,           // Readable indentation
      delimiter: '\t',     // Tab delimiter for token efficiency
      keyFolding: 'safe',  // Flatten nested objects into dotted paths
      flattenDepth: Infinity,
    });
    
    logger.debug('Context encoded to TOON', {
      originalSize: JSON.stringify(contextData).length,
      toonSize: toonString.length,
    });
    
    return toonString;
  } catch (error) {
    logger.error('Error encoding context to TOON:', error);
    throw new Error('Failed to encode context to TOON format');
  }
};

/**
 * Build assessment generation context
 * @param {Object} user - User object
 * @param {Object} patientData - Patient data (if applicable)
 * @param {Object} healthConcern - Health concern details
 * @param {Array} previousAssessments - Previous assessments for this concern
 * @returns {string} - TOON-encoded context string
 */
const buildAssessmentContext = (user, patientData, healthConcern, previousAssessments) => {
  const context = {
    patient: {
      age: patientData?.birthDate 
        ? Math.floor((Date.now() - new Date(patientData.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
        : null,
      gender: patientData?.gender || 'not specified',
    },
    healthConcern: {
      title: healthConcern.title,
      chiefComplaint: healthConcern.chiefComplaint,
      symptoms: healthConcern.symptoms,
      onset: healthConcern.onsetDescription || `${healthConcern.onset?.value} ${healthConcern.onset?.unit}`,
      severity: healthConcern.severity,
      status: healthConcern.status,
      notes: healthConcern.notes,
    },
    previousAssessments: previousAssessments.map(a => ({
      createdAt: a.createdAt,
      severity: a.severity,
      questionCount: a.questions?.length || 0,
      hasResponse: a.hasResponse,
    })),
  };
  
  if (patientData) {
    if (patientData.chronicConditions && patientData.chronicConditions.length > 0) {
      context.chronicConditions = patientData.chronicConditions.map(c => ({
        name: c.name,
        description: c.description,
      }));
    }
    
    if (patientData.allergies && patientData.allergies.length > 0) {
      context.allergies = patientData.allergies.map(a => ({
        name: a.name,
        category: a.category,
      }));
    }
    
    if (patientData.medicalHistory) {
      context.medicalHistory = patientData.medicalHistory;
    }
  }
  
  return buildToonContext(context);
};

module.exports = {
  buildToonContext,
  buildAssessmentContext,
  cleanContext,
};

