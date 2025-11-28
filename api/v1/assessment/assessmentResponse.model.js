const mongoose = require('mongoose');

// Answer schema
const answerSchema = new mongoose.Schema({
  questionId: {
    type: String,
    required: true,
  },
  questionType: {
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
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
}, { _id: false });

// Assessment response schema
const assessmentResponseSchema = new mongoose.Schema({
  assessment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assessment',
    required: true,
    index: true,
  },
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
  answers: {
    type: [answerSchema],
    required: true,
    validate: {
      validator: function(answers) {
        return answers && answers.length > 0;
      },
      message: 'Response must have at least one answer',
    },
  },
  submittedAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  reportStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
  },
  reportPayload: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  notes: {
    type: String,
    default: null,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Compound indexes
assessmentResponseSchema.index({ user: 1, healthConcern: 1, submittedAt: -1 });
assessmentResponseSchema.index({ user: 1, submittedAt: -1 });
assessmentResponseSchema.index({ assessment: 1 }, { unique: true });

// Static method to find responses by user and health concern
assessmentResponseSchema.statics.findByUserAndConcern = function(userId, healthConcernId, options = {}) {
  const query = {
    user: userId,
    healthConcern: healthConcernId,
  };

  return this.find(query)
    .populate('assessment')
    .sort({ submittedAt: -1 })
    .limit(options.limit || 0)
    .skip(options.skip || 0);
};

// Static method to check if assessment has been responded to
assessmentResponseSchema.statics.hasResponse = async function(assessmentId) {
  const count = await this.countDocuments({ assessment: assessmentId });
  return count > 0;
};

// Instance method to get answer by question ID
assessmentResponseSchema.methods.getAnswerByQuestionId = function(questionId) {
  return this.answers.find(answer => answer.questionId === questionId);
};

module.exports = mongoose.model('AssessmentResponse', assessmentResponseSchema);

