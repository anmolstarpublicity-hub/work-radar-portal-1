const EmployeeScore = require('../models/employeeScore');

const getScore = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { year, month } = req.query;
    const score = await EmployeeScore.findOne({ employee: employeeId, year: Number(year), month: Number(month) });
    res.json({
      officeBehaviour: score?.officeBehaviour ?? null,
      dressUp: score?.dressUp ?? null,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const setScore = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { year, month, officeBehaviour, dressUp } = req.body;
    const score = await EmployeeScore.findOneAndUpdate(
      { employee: employeeId, year: Number(year), month: Number(month) },
      { officeBehaviour, dressUp, setBy: req.user._id },
      { new: true, upsert: true, runValidators: true }
    );
    res.json({ officeBehaviour: score.officeBehaviour, dressUp: score.dressUp });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getScore, setScore };
