const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
    index: true,
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
  },
  startDate: {
    type: Date,
  },
  dueDate: {
    type: Date,
  },
  completionDate: {
    type: Date,
  },
  submittedForCompletionDate: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed', 'Pending Verification', 'Not Completed'],
    default: 'Pending',
  },
  rejectionReason: {
    type: String,
    trim: true,
    default: '',
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  completionCategory: {
    type: String,
    enum: ['Pending', 'Low', 'Moderate', 'Completed', 'N/A'],
    default: 'N/A',
  },
  comments: [
    {
      author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true,
      },
      text: {
        type: String,
        required: true,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium',
  },
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);