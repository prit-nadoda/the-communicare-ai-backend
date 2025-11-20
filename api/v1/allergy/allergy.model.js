const mongoose = require('mongoose');

const allergySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Allergy name is required'],
    trim: true,
    unique: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
  },
  code: {
    type: String,
    trim: true,
    uppercase: true,
    sparse: true,
    unique: true,
  },
  image: {
    type: String,
    default: null,
  },
  category: {
    type: String,
    enum: ['food', 'medication', 'environmental', 'other'],
    default: 'other',
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
allergySchema.index({ name: 1 });
allergySchema.index({ code: 1 });
allergySchema.index({ category: 1 });
allergySchema.index({ isActive: 1 });

// Static method to find by name
allergySchema.statics.findByName = function(name) {
  return this.findOne({ name: new RegExp(`^${name}$`, 'i') });
};

// Static method to find active allergies
allergySchema.statics.findActive = function() {
  return this.find({ isActive: true });
};

// Static method to find by category
allergySchema.statics.findByCategory = function(category) {
  return this.find({ category, isActive: true });
};

module.exports = mongoose.model('Allergy', allergySchema);

