const Report = require('../models/report.js');
const Task = require('../models/task.js');
const Notification = require('../models/notification.js');
const Employee = require('../models/employee.js');
const Assignment = require('../models/assignment.js');

class ReportController {
  /**
   * @description Get the current day's report for a specific employee
   * @route GET /api/reports/my-today/:employeeId
   * @access Employee
   */
  static getMyTodaysReport = async (req, res) => {
    // In a real app, employeeId would come from auth middleware (e.g., req.user.id)
    const { employeeId } = req.params;
    
    // Get the start of today in UTC
    const now = new Date();
    const startOfTodayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    try {
      // Find a report for the employee where the reportDate is on or after the start of today UTC.
      // This correctly finds the report for the current day regardless of timezones.
      const report = await Report.findOne({ employee: employeeId, reportDate: { $gte: startOfTodayUTC } });
      res.status(200).json(report); // Will be null if not found, which is expected
    } catch (error) {
      console.error("Error fetching today's report:", error);
      res.status(500).json({ message: "Server error while fetching today's report." });
    }
  };

  /**
   * @description Create or update the current day's report for an employee
   * @route POST /api/reports/my-today/:employeeId
   * @access Employee
   */
  static updateMyTodaysReport = async (req, res) => {
    const { employeeId } = req.params;
    const { content, status } = req.body;

    const now = new Date();
    // Use UTC date to prevent timezone issues
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
 
    try {
      // Prevent updates if the report has already been submitted or if it's past the cutoff time.
      const existingReport = await Report.findOne({ employee: employeeId, reportDate: today });
 
      if (existingReport && existingReport.status === 'Submitted') {
        return res.status(403).json({ message: 'Report has already been submitted and cannot be modified.' });
      }
 
      // Add a server-side time check for consistency. Assumes server is in the company's local timezone.
      const currentHour = new Date().getHours();
      if (currentHour >= 19) { // 7 PM
        return res.status(403).json({ message: 'The deadline for submitting reports (7:00 PM) has passed.' });
      }

      // If the report is being submitted, check for task completion updates.
      if (status === 'Submitted' && content) {
        try {
          const reportContent = JSON.parse(content);
          if (reportContent.taskUpdates && Array.isArray(reportContent.taskUpdates)) {
            for (const update of reportContent.taskUpdates) {
              const task = await Task.findById(update.taskId);
              if (task) {
                let completion = parseInt(update.completion, 10);
                if (isNaN(completion)) continue; // Skip invalid updates to prevent data corruption

                task.progress = completion;
                // Clear rejection reason so the task is eligible for auto-submission if it becomes overdue
                task.rejectionReason = '';
                
                // Extract optional progress note and add it directly to the task's comment feed
                if (update.note && typeof update.note === 'string' && update.note.trim() !== '') {
                  task.comments.push({
                    text: `Progress update (${completion}%): ${update.note.trim()}`,
                    author: employeeId,
                  });
                }

                // Check if the task is already in a state that shouldn't be changed by simple progress updates
                const isFinalizedState = ['Pending Verification', 'Completed', 'Not Completed'].includes(task.status);

                if (completion === 100 && !isFinalizedState) {
                  // If progress is 100%, move to verification
                  task.status = 'Pending Verification';
                  task.submittedForCompletionDate = new Date(); // Set submission date to the exact time

                  // --- Notification Logic ---
                  // This is wrapped in a try/catch so that a failure in sending notifications
                  // does not prevent the user's report and task progress from being saved.
                  try {
                    const employee = await Employee.findById(task.assignedTo).select('name');
                    if (employee) {
                      const message = `${employee.name} has marked the task "${task.title}" as 100% complete and it is ready for your approval.`;
                      
                      // Build a unique list of recipients who can approve the task
                      const recipientIds = new Set();
                      if (task.assignedBy) recipientIds.add(task.assignedBy.toString());
  
                      // Find assignee's team lead
                      const assignment = await Assignment.findOne({ employee: task.assignedTo });
                      if (assignment && assignment.teamLead) {
                        recipientIds.add(assignment.teamLead.toString());
                      }
  
                      // Add all admins
                      const admins = await Employee.find({ role: 'Admin' }).select('_id');
                      admins.forEach(admin => recipientIds.add(admin._id.toString()));
  
                      // Don't notify the person who completed the task
                      if (task.assignedTo) {
                        recipientIds.delete(task.assignedTo.toString());
                      }
  
                      const notifications = Array.from(recipientIds).map(id => ({
                        recipient: id,
                        subjectEmployee: employee._id,
                        message: message,
                        type: 'task_approval',
                        relatedTask: task._id,
                      }));
  
                      if (notifications.length > 0) {
                        // Use ordered: false to insert all possible notifications,
                        // skipping any duplicates without failing the entire batch.
                        // This is robust against race conditions.
                        await Notification.insertMany(notifications, { ordered: false });
                      }
                    }
                  } catch (notificationError) {
                    // Log the error but do not fail the entire report submission.
                    console.error(`Non-critical error: Failed to create approval notification for task ${task._id}:`, notificationError);
                  }
                } else if (!isFinalizedState) {
                  // Only update status if it's not already in a finalized or verification state
                  // If progress is made (> 0) and the task is currently Pending, move it to In Progress.
                  if (completion > 0 && task.status === 'Pending') {
                    task.status = 'In Progress';
                  }
                }
                await task.save();
              }
            }
          }
        } catch (e) {
          console.error("Could not parse report content to update tasks:", e);
        }
      }

      const updatedReport = await Report.findOneAndUpdate(
        { employee: employeeId, reportDate: today },
        { content, status, employee: employeeId, reportDate: today },
        { new: true, upsert: true, runValidators: true }
      );

      // If the report was successfully submitted, notify the team lead and all admins.
      if (status === 'Submitted') {
        const submittingEmployee = await Employee.findById(employeeId);
        if (submittingEmployee) {
          const message = `${submittingEmployee.name} has submitted their daily progress report.`;
          
          // Find the assignment to get the team lead
          const assignment = await Assignment.findOne({ employee: employeeId });
          const admins = await Employee.find({ role: 'Admin' }).select('_id');
          
          const potentialRecipients = new Set();
          if (assignment && assignment.teamLead) {
            potentialRecipients.add(assignment.teamLead.toString());
          }
          admins.forEach(admin => {
            potentialRecipients.add(admin._id.toString());
          });
          // Don't notify the person who submitted the report
          potentialRecipients.delete(submittingEmployee._id.toString());

          const recipientIds = Array.from(potentialRecipients);

          if (recipientIds.length > 0) {
            const todayForNotification = new Date();
            todayForNotification.setUTCHours(0, 0, 0, 0);

            const notifications = recipientIds.map(id => ({
              recipient: id,
              subjectEmployee: submittingEmployee._id,
              message: message,
              type: 'report_submitted',
              notificationDate: todayForNotification
            }));

            // The unique index on the Notification model will prevent duplicates for the same day.
            // Using ordered: false ensures that if one notification fails (e.g., duplicate), the others are still inserted.
            try {
              await Notification.insertMany(notifications, { ordered: false });
            } catch (notificationError) {
              // Log the error but do not fail the entire report submission.
              console.error(`Non-critical error: Failed to create report submission notification for employee ${employeeId}:`, notificationError);
            }
          }
        }
      }

      res.status(200).json({ message: 'Report saved successfully!', report: updatedReport });
    } catch (error) {
      console.error("Error updating today's report:", error);
      res.status(500).json({ message: "Server error while updating today's report." });
    }
  };

  /**
   * @description Get all reports for a specific employee
   * @route GET /api/reports/my-all/:employeeId
   * @access Employee
   */
  static getAllMyReports = async (req, res) => {
    const { employeeId } = req.params;

    try {
      // Find all reports for the employee and sort them by date in descending order
      const reports = await Report.find({ employee: employeeId }).sort({ reportDate: -1 }).lean();

      // Manually populate task details inside the JSON content
      const populatedReports = await Promise.all(reports.map(async (report) => {
        try {
          // Ensure content is a string before parsing
          const contentString = typeof report.content === 'string' ? report.content : JSON.stringify(report.content);
          if (!contentString) return report;

          const content = JSON.parse(contentString);
          if (content.taskUpdates && Array.isArray(content.taskUpdates)) {
            content.taskUpdates = await Promise.all(content.taskUpdates.map(async (update) => {
              if (update.taskId) {
                const taskDetails = await Task.findById(update.taskId)
                  .populate({
                    path: 'comments',
                    populate: { path: 'author', select: 'name profilePicture' }
                  })
                  .lean();
                update.taskId = taskDetails; // Replace ID with full task object
              }
              return update;
            }));
            report.content = JSON.stringify(content);
          }
        } catch (e) { /* Ignore content that isn't valid JSON or doesn't have taskUpdates */ }
        return report;
      }));
      res.status(200).json(populatedReports);
    } catch (error) {
      console.error("Error fetching all reports for employee:", error);
      res.status(500).json({ message: "Server error while fetching reports." });
    }
  };

  /**
   * @description Get all reports for a specific employee (for Admin)
   * @route GET /api/reports/employee/:employeeId
   * @access Manager
   */
  static getReportsForEmployee = async (req, res) => {
    // In a real app, you'd add another middleware to check if req.user.role is 'manager'
    const { employeeId } = req.params;

    try {
      const reports = await Report.find({ employee: employeeId }).sort({ reportDate: -1 }).lean();

      // Manually populate task details inside the JSON content
      const populatedReports = await Promise.all(reports.map(async (report) => {
        try {
          // Ensure content is a string before parsing
          const contentString = typeof report.content === 'string' ? report.content : JSON.stringify(report.content);
          if (!contentString) return report;

          const content = JSON.parse(contentString);
          if (content.taskUpdates && Array.isArray(content.taskUpdates)) {
            content.taskUpdates = await Promise.all(content.taskUpdates.map(async (update) => {
              if (update.taskId) {
                const taskDetails = await Task.findById(update.taskId)
                  .populate({
                    path: 'comments',
                    populate: { path: 'author', select: 'name profilePicture' }
                  })
                  .lean();
                update.taskId = taskDetails; // Replace ID with full task object
              }
              return update;
            }));
            report.content = JSON.stringify(content);
          }
        } catch (e) { /* Ignore content that isn't valid JSON or doesn't have taskUpdates */ }
        return report;
      }));
      res.status(200).json(populatedReports);
    } catch (error) {
      console.error("Error fetching reports for employee:", error);
      res.status(500).json({ message: "Server error while fetching reports." });
    }
  };

  /**
   * @description Delete a report by its ID
   * @route DELETE /api/reports/:id
   * @access Admin
   */
  static deleteReport = async (req, res) => {
    if (req.user.role !== 'Admin' && !req.user.canDeleteReport) {
      return res.status(403).json({ message: 'Not authorized to delete reports.' });
    }

    try {
      const report = await Report.findByIdAndDelete(req.params.id);

      if (!report) {
        return res.status(404).json({ message: 'Report not found.' });
      }

      res.status(200).json({ message: 'Report deleted successfully.' });
    } catch (error) {
      console.error('Error deleting report:', error);
      res.status(500).json({ message: 'Server error while deleting report.' });
    }
  };
}

module.exports = ReportController;