const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required'],
    unique: true,
  },
  birthDate: {
    type: Date,
    required: [true, 'Birth date is required'],
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: [true, 'Gender is required'],
  },
  contact: {
    country: {
      type: String,
      required: [true, 'Country code is required'],
      uppercase: true,
      length: 2,
    },
    countryCode: {
      type: String,
      required: [true, 'Country calling code is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
  },
  chronicConditions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChronicCondition',
  }],
  allergies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Allergy',
  }],
  emergencyContact: {
    name: {
      type: String,
      trim: true,
    },
    relationship: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      uppercase: true,
      length: 2,
    },
    countryCode: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
  },
  medicalHistory: {
    type: String,
    trim: true,
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

// Indexes
patientSchema.index({ user: 1 });
patientSchema.index({ isActive: 1 });
patientSchema.index({ birthDate: 1 });

// Virtual for age
patientSchema.virtual('age').get(function() {
  if (!this.birthDate) return null;
  const today = new Date();
  const birthDate = new Date(this.birthDate);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

// Static method to find by user ID
patientSchema.statics.findByUserId = function(userId) {
  return this.findOne({ user: userId })
    .populate('user', '-password')
    .populate('chronicConditions')
    .populate('allergies');
};

// Static method to find active patients
patientSchema.statics.findActive = function() {
  return this.find({ isActive: true })
    .populate('user', '-password');
};

module.exports = mongoose.model('Patient', patientSchema);

