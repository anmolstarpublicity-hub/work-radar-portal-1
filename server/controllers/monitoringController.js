const Employee = require('../models/employee');
const { getActivityLogs, getPCStartTime, getAppUsageSummary, getPCDaysForMonth } = require('./supabaseService');

// GET /monitoring/:employeeId/pc-start?date=YYYY-MM-DD
const getPCStartTimeForEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.employeeId);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    if (!employee.monitoringName) return res.status(200).json({ pcStartTime: null, message: 'No monitoring name set' });

    const date = req.query.date || new Date().toISOString().split('T')[0];
    const pcStartTime = await getPCStartTime(employee.monitoringName, date);
    res.json({ pcStartTime, employeeName: employee.monitoringName, date });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /monitoring/:employeeId/activity?date=YYYY-MM-DD
const getActivityLogsForEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.employeeId);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    if (!employee.monitoringName) return res.status(200).json({ logs: [], totalDuration: 0, message: 'No monitoring name set' });

    const date = req.query.date || new Date().toISOString().split('T')[0];
    const { logs, totalDuration } = await getAppUsageSummary(employee.monitoringName, date);
    res.json({ logs, totalDuration, employeeName: employee.monitoringName, date });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /monitoring/:employeeId/pc-days?year=YYYY&month=M
const getPCDaysForEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.employeeId);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    if (!employee.monitoringName) return res.status(200).json({ pcDays: 0 });
    const { year, month } = req.query;
    const pcDays = await getPCDaysForMonth(employee.monitoringName, year, month);
    res.json({ pcDays });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getPCStartTimeForEmployee, getActivityLogsForEmployee, getPCDaysForEmployee };
