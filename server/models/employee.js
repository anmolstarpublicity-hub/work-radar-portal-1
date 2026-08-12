const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Import bcrypt
const Task = require('./task.js');
const Report = require('./report.js');
const Notification = require('./notification.js');
const Leave = require('./leave.js');

const employeeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please fill a valid email address',
    ],
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
    trim: true,
  },
  employeeId: {
    type: String,
    required: true,
    minlength: [3, 'Employee ID must be at least 3 characters long.'],
    unique: true,
    trim: true,
  },
  profilePicture: {
    type: String,
    default: '',
  },
  address: {
    type: String,
    trim: true,
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
  },
  country: {
    type: String,
    trim: true,
  },
  city: {
    type: String,
    trim: true,
  },
  qualification: {
    type: String,
    trim: true,
  },
  experience: {
    type: String,
    trim: true,
  },
  workType: {
    type: String,
    trim: true,
    enum: ['Full-time', 'Part-time', 'Internship'],
    default: 'Full-time',
  },
  company: {
    type: String,
    required: [true, 'Company name is required.'],
    trim: true,
  },
  joiningDate: {
    type: Date,
  },
  workLocation: {
    type: String,
    trim: true,
  },
  shift: {
    type: String,
    enum: ['Day', 'Night'],
    default: 'Day',
  },
  dashboardAccess: {
    type: String,
    enum: ['Admin Dashboard', 'Manager Dashboard', 'Employee Dashboard'],
    required: true,
    default: 'Employee Dashboard',
  },
  department: {
    type: String,
    trim: true,
    enum: [
      '', // Allow empty string
      'Corporate management', 'Human Resource', 'Creative Designing',
      'Finance & Accounts', 'Marketing Operations', 'Sales & Marketing', 'Tech & Development'
    ],
    // Not making it required, so existing employees don't fail validation
    // and it can be assigned later.
  },
  canEditProfile: {
    type: Boolean,
    default: false,
  },
  canViewTeam: {
    type: Boolean,
    default: false,
  },
  canUpdateTask: {
    type: Boolean,
    default: false,
  },
  canApproveTask: {
    type: Boolean,
    default: false,
  },
  canAssignTask: {
    type: Boolean,
    default: false,
  },
  canDeleteTask: {
    type: Boolean,
    default: false,
  },
  canViewAnalytics: {
    type: Boolean,
    default: false,
  },
  canDeleteReport: {
    type: Boolean,
    default: false,
  },
  hasAttendancePower: {
    type: Boolean,
    default: false,
  },
  manualAttendanceStatus: {
    type: String,
    enum: ['Present', 'Absent', ''],
    default: '',
  },
  manualAttendanceDate: {
    type: String,
    default: '',
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  themePreference: {
    type: String,
    enum: ['light', 'dark'],
    default: 'light',
  },
  monitoringName: {
    type: String,
    trim: true,
    default: '',
  },
}, { timestamps: true });

// Hash the password before saving the employee
employeeSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Generate a salt
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare entered password with the hashed password
employeeSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};
const Employee = mongoose.model('Employee', employeeSchema);

module.exports = Employee;