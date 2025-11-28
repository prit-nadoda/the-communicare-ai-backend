const mongoose = require('mongoose');

// Question option schema
const questionOptionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    required: true,
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
}, { _id: false });

// Condition schema for conditional logic
const conditionSchema = new mongoose.Schema({
  questionId: {
    type: String,
    required: true,
  },
  operator: {
    type: String,
    enum: ['equals', 'not_equals', 'contains', 'greater_than', 'less_than'],
    required: true,
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
}, { _id: false });

// Question schema
const questionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: [
      'long_text',
      'single_choice',
      'multi_choice',
      'numeric',
      'rating_likert',
      'rating_numeric',
      'rating_slider',
      'rating_frequency',
    ],
    required: true,
  },
  label: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: null,
  },
  required: {
    type: Boolean,
    default: true,
  },
  options: [questionOptionSchema],
  min: {
    type: Number,
    default: null,
  },
  max: {
    type: Number,
    default: null,
  },
  step: {
    type: Number,
    default: null,
  },
  conditions: [conditionSchema],
}, { _id: false });

// Assessment schema
const assessmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  healthConcern: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HealthConcern',
    required: true,
    index: true,
  },
  severity: {
    type: String,
    enum: ['low', 'moderate', 'high'],
    required: true,
  },
  minDaysBeforeNextAssessment: {
    type: Number,
    required: true,
    min: 0,
  },
  questions: {
    type: [questionSchema],
    required: true,
    validate: {
      validator: function(questions) {
        return questions && questions.length > 0;
      },
      message: 'Assessment must have at least one question',
    },
  },
  llmMetadata: {
    provider: {
      type: String,
      default: 'openai',
    },
    model: {
      type: String,
      required: true,
    },
    promptVersion: {
      type: String,
      default: 'v1.0',
    },
    tokensUsed: {
      prompt: { type: Number, default: 0 },
      completion: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },
    generationTime: {
      type: Number,
      default: 0,
    },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Compound indexes
assessmentSchema.index({ user: 1, healthConcern: 1, createdAt: -1 });
assessmentSchema.index({ user: 1, createdAt: -1 });

// Virtual for response status
assessmentSchema.virtual('responseStatus', {
  ref: 'AssessmentResponse',
  localField: '_id',
  foreignField: 'assessment',
  justOne: true,
});

// Static method to find latest assessment for user + health concern
assessmentSchema.statics.findLatestByUserAndConcern = function(userId, healthConcernId) {
  return this.findOne({
    user: userId,
    healthConcern: healthConcernId,
    isActive: true,
  }).sort({ createdAt: -1 });
};

// Static method to check if user can generate new assessment
assessmentSchema.statics.canGenerateNewAssessment = async function(userId, healthConcernId) {
  const latestAssessment = await this.findLatestByUserAndConcern(userId, healthConcernId);
  
  if (!latestAssessment) {
    return { allowed: true, reason: 'No previous assessment found' };
  }

  const daysSinceLastAssessment = Math.floor(
    (Date.now() - latestAssessment.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceLastAssessment >= latestAssessment.minDaysBeforeNextAssessment) {
    return { allowed: true, daysSinceLastAssessment };
  }

  const daysRemaining = latestAssessment.minDaysBeforeNextAssessment - daysSinceLastAssessment;
  return {
    allowed: false,
    reason: `Must wait ${daysRemaining} more day(s) before next assessment`,
    daysRemaining,
    lastAssessmentDate: latestAssessment.createdAt,
  };
};

module.exports = mongoose.model('Assessment', assessmentSchema);

