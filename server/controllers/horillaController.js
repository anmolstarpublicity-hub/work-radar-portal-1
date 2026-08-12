const Employee = require('../models/employee');
const { getPunchData } = require('./horillaService');

// GET /horilla/:employeeId/punch?date=YYYY-MM-DD
const getPunchForEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.employeeId);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    const date = req.query.date || new Date().toISOString().split('T')[0];
    const employeeId = employee.employeeId;
    const employeeName = employee.monitoringName || employee.name;

    const { punchIn, punchOut } = await getPunchData({ employeeId, employeeName }, date);
    res.json({ punchIn, punchOut, date, employeeName });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getPunchForEmployee };
