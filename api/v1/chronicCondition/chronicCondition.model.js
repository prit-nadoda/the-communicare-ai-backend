const mongoose = require('mongoose');

const chronicConditionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Chronic condition name is required'],
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
chronicConditionSchema.index({ name: 1 });
chronicConditionSchema.index({ code: 1 });
chronicConditionSchema.index({ isActive: 1 });

// Static method to find by name
chronicConditionSchema.statics.findByName = function(name) {
  return this.findOne({ name: new RegExp(`^${name}$`, 'i') });
};

// Static method to find active conditions
chronicConditionSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};

module.exports = mongoose.model('ChronicCondition', chronicConditionSchema);

