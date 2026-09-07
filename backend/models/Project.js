const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    trim: true,
    uppercase: true,
    default: function() {
      return 'PROJ-' + Math.floor(100 + Math.random() * 900);
    }
  },
  description: {
    type: String,
    default: ''
  },
  budget: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Active', 'In Planning', 'Under Review', 'Completed', 'On Hold'],
    default: 'Active'
  },
  category: {
    type: String,
    default: 'Software Development'
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Project', projectSchema);
