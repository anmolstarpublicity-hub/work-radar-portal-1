const mongoose = require('mongoose');

const employeeScoreSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  year: { type: Number, required: true },
  month: { type: Number, required: true, min: 1, max: 12 },
  officeBehaviour: { type: Number, default: null, min: 0, max: 5 },
  dressUp: { type: Number, default: null, min: 0, max: 5 },
  setBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
}, { timestamps: true });

employeeScoreSchema.index({ employee: 1, year: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('EmployeeScore', employeeScoreSchema);
