const mongoose = require('mongoose');

/**
 * Health Concern Schema
 * Represents patient-reported health concerns with symptoms and onset information
 */
const healthConcernSchema = new mongoose.Schema({
  // Patient reference
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Basic information
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  
  // Chief complaint - main description
  chiefComplaint: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  
  // Symptoms description
  symptoms: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  
  // When symptoms started (renamed from startedFrom to onset for medical clarity)
  onset: {
    value: {
      type: Number,
      required: true,
      min: 1
    },
    unit: {
      type: String,
      required: true,
      enum: ['day', 'week', 'month', 'year'],
      lowercase: true
    }
  },
  
  // Status tracking
  status: {
    type: String,
    enum: ['active', 'resolved', 'monitoring'],
    default: 'active'
  },
  
  // Severity level
  severity: {
    type: String,
    enum: ['mild', 'moderate', 'severe'],
    required: false
  },
  
  // Additional notes
  notes: {
    type: String,
    maxlength: 2000
  },
  
  // Soft delete
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
healthConcernSchema.index({ user: 1, createdAt: -1 });
healthConcernSchema.index({ user: 1, status: 1 });
healthConcernSchema.index({ title: 'text', chiefComplaint: 'text', symptoms: 'text' });

// Virtual for onset description
healthConcernSchema.virtual('onsetDescription').get(function() {
  if (this.onset && this.onset.value && this.onset.unit) {
    const plural = this.onset.value > 1 ? 's' : '';
    return `${this.onset.value} ${this.onset.unit}${plural} ago`;
  }
  return null;
});

// Static method to find by user
healthConcernSchema.statics.findByUser = function(userId, filters = {}) {
  return this.find({ user: userId, isActive: true, ...filters })
    .sort({ createdAt: -1 });
};

// Static method to find active concerns by user
healthConcernSchema.statics.findActiveByUser = function(userId) {
  return this.find({ user: userId, status: 'active', isActive: true })
    .sort({ createdAt: -1 });
};

// Instance method to mark as resolved
healthConcernSchema.methods.markAsResolved = function() {
  this.status = 'resolved';
  return this.save();
};

// Instance method to soft delete
healthConcernSchema.methods.softDelete = function() {
  this.isActive = false;
  return this.save();
};

module.exports = mongoose.model('HealthConcern', healthConcernSchema);

