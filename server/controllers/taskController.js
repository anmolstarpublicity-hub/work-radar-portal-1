const Task = require('../models/task.js');
const Report = require('../models/report.js');
const Notification = require('../models/notification.js');
const Employee = require('../models/employee.js');
const Assignment = require('../models/assignment.js');

class TaskController {
  static createTask = async (req, res) => {
    const { title, description, assignedTo, startDate, dueDate, priority } = req.body;
    const assignedBy = req.user._id;

    if (!title || !assignedTo) {
      return res.status(400).json({ message: 'Title and assignedTo are required.' });
    }

    try {
      const task = new Task({
        title,
        description,
        assignedTo,
        assignedBy,
        startDate,
        dueDate,
        priority,
        status: 'Pending', // Requirement: Task starts as Pending
        progress: 0,       // Requirement: Task starts at 0% progress
      });
      await task.save();

      // Notify the assigned employee
      try {
        await Notification.create({
          recipient: task.assignedTo,
          subjectEmployee: assignedBy,
          message: `You have been assigned a new task: "${task.title}"`,
          type: 'info',
          relatedTask: task._id
        });
      } catch (e) {
        console.error("Failed to create notification for new task:", e);
        // Do not fail the entire request if notification creation fails
      }

      res.status(201).json({ message: 'Task created successfully', task });
    } catch (error) {
      console.error('Error creating task:', error);
      res.status(500).json({ message: 'Server error while creating task.' });
    }
  };

  static createMultipleTasks = async (req, res) => {
    const tasksData = req.body.tasks; // Expect an array of tasks
    const assignedBy = req.user._id;

    if (!Array.isArray(tasksData) || tasksData.length === 0) {
      return res.status(400).json({ message: 'An array of tasks is required.' });
    }

    try {
      const tasksToInsert = tasksData.map(task => ({
        ...task,
        assignedBy,
        status: 'Pending', // Requirement: Task starts as Pending
        progress: 0,       // Requirement: Task starts at 0% progress
      }));

      const createdTasks = await Task.insertMany(tasksToInsert);

      // Notify all assigned employees
      try {
        const notifications = createdTasks.map(task => ({
          recipient: task.assignedTo,
          subjectEmployee: assignedBy,
          message: `You have been assigned a new task: "${task.title}"`,
          type: 'info',
          relatedTask: task._id
        }));
        if (notifications.length > 0) {
          await Notification.insertMany(notifications, { ordered: false });
        }
      } catch (e) {
        console.error("Failed to create notifications for multiple new tasks:", e);
      }

      res.status(201).json({ message: `${createdTasks.length} tasks created successfully`, tasks: createdTasks });
    } catch (error) {
      console.error('Error creating multiple tasks:', error);
      res.status(500).json({ message: 'Server error while creating tasks.' });
    }
  };

  static getMyTasks = async (req, res) => {
    try {
      const tasks = await Task.find({ assignedTo: req.user._id })
        .populate('assignedBy', 'name')
        .populate({
          path: 'comments',
          populate: {
            path: 'author',
            select: 'name profilePicture'
          }
        })
        .sort({ createdAt: -1 });
      res.status(200).json(tasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      res.status(500).json({ message: 'Server error while fetching tasks.' });
    }
  };

  static getAllTasks = async (req, res) => {
    try {
      const tasks = await Task.find({})
        .populate('assignedTo', 'name employeeId')
        .populate('assignedBy', 'name employeeId')
        .populate({
          path: 'comments',
          populate: {
            path: 'author',
            select: 'name profilePicture'
          }
        })
        .sort({ createdAt: -1 });
      res.status(200).json(tasks);
    } catch (error) {
      console.error('Error fetching all tasks:', error);
      res.status(500).json({ message: 'Server error while fetching all tasks.' });
    }
  };

  static updateTask = async (req, res) => {
    const { id } = req.params;
    const { title, description, dueDate, priority, status } = req.body;
    const updaterId = req.user._id;

    try {
      const task = await Task.findById(id).populate('assignedTo', 'name');

      if (!task) {
        return res.status(404).json({ message: 'Task not found.' });
      }

      // Allow the user who assigned the task OR the user it is assigned to, to update it.
      const isAssignee = task.assignedTo._id.toString() === updaterId.toString();
      const isAssigner = task.assignedBy.toString() === updaterId.toString();
      const isAdmin = req.user.role === 'Admin';

      // Prevent status updates on finally graded tasks
      if (isAssignee && status && ['Completed', 'Not Completed'].includes(task.status)) {
        return res.status(403).json({ message: 'This task has already been graded and cannot be modified.' });
      }

      const canUpdate = isAdmin || (isAssigner && req.user.canUpdateTask);

      if (isAssignee) {
        // Assignees can only update status, and only to specific values to prevent bypassing approval.
        if (title || description || dueDate || priority) {
          return res.status(403).json({ message: 'You are only authorized to update the status of this task.' });
        }
        if (status && !['In Progress', 'Pending Verification'].includes(status)) {
          return res.status(403).json({ message: `You can only set the status to 'In Progress' or 'Pending Verification'.` });
        }
      } else if (!isAssignee && !canUpdate) {
        return res.status(403).json({ message: 'You are not authorized to update this task.' });
      }

      task.title = title || task.title;
      task.description = description || task.description;
      task.dueDate = dueDate || task.dueDate;
      task.priority = priority || task.priority;
      task.status = status || task.status;

      // If an employee manually sets status to 'Pending Verification',
      // it implies they believe the task is 100% complete.
      if (isAssignee && status === 'Pending Verification') {
        task.progress = 100;
        task.submittedForCompletionDate = new Date();
      }

      // If the assignee is updating the task, clear any previous rejection reason
      // so it is treated as active and eligible for auto-submission logic.
      if (isAssignee) {
        task.rejectionReason = '';
      }

      const updatedTask = await task.save();

      // If the status is 'Pending Verification', create notifications
      if (status === 'Pending Verification') {
        if (task.assignedTo) { // Only proceed if there is an assignee
          // Check for existing notification to prevent duplicates
          const existingNotification = await Notification.findOne({
            relatedTask: task._id,
            type: 'task_approval'
          });

          if (!existingNotification) {
            try {
              const employeeName = task.assignedTo.name;
              const employeeId = task.assignedTo._id;
              const message = `${employeeName} has marked the task "${task.title}" as complete and it is ready for your approval.`;

              // Build a unique list of recipients who can approve the task
              const recipientIds = new Set();
              if (task.assignedBy) recipientIds.add(task.assignedBy.toString());

              // Find assignee's team lead
              const assignment = await Assignment.findOne({ employee: task.assignedTo._id });
              if (assignment && assignment.teamLead) {
                recipientIds.add(assignment.teamLead.toString());
              }

              // Add all admins
              const admins = await Employee.find({ role: 'Admin' }).select('_id');
              admins.forEach(admin => recipientIds.add(admin._id.toString()));

              // Don't notify the person who completed the task
              recipientIds.delete(task.assignedTo._id.toString());

              const notifications = Array.from(recipientIds).map(id => ({
                recipient: id,
                subjectEmployee: employeeId,
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
            } catch (notificationError) {
              // If it's a duplicate key error (code 11000), we can safely ignore it,
              // as it means another process created the notification just now.
              if (notificationError.code !== 11000) {
                console.error(`Failed to create approval notification for task ${task._id} during manual update:`, notificationError);
              }
            }
          }
        }
      }

      res.status(200).json({ message: 'Task updated successfully', task: updatedTask });
    } catch (error) {
      console.error('Error updating task:', error);
      res.status(500).json({ message: 'Server error while updating task.' });
    }
  };

  static approveTaskCompletion = async (req, res) => {
    const { id } = req.params;
    const { finalPercentage, comment } = req.body;
    const approverId = req.user._id;

    try {
      const task = await Task.findById(id).populate('assignedTo'); // Populate the full assignee object
      if (!task) {
        return res.status(404).json({ message: 'Task not found.' });
      }
      if (!task.assignedTo) {
        return res.status(400).json({ message: 'This task has no assignee and cannot be approved.' });
      }
      // Ensure the task is actually pending verification before approving.
      if (task.status !== 'Pending Verification') {
        return res.status(400).json({ message: `This task is in '${task.status}' status and cannot be approved directly. It must be 'Pending Verification'.` });
      }

      // Authorization Check:
      const isAssigner = task.assignedBy.toString() === approverId.toString();
      const isAdmin = req.user.role === 'Admin';
      const hasGlobalApprovePermission = req.user.canApproveTask;
      // Find the assignment to check if the approver is the team lead
      const assignment = await Assignment.findOne({ employee: task.assignedTo._id });
      const isTeamLeadOfAssignee = assignment && assignment.teamLead?.toString() === approverId.toString();

      if (!isAssigner && !isAdmin && !hasGlobalApprovePermission && !isTeamLeadOfAssignee) {
        return res.status(403).json({ message: 'You are not authorized to approve this task.' });
      }

      const finalProgress = parseInt(finalPercentage, 10);
      if (isNaN(finalProgress)) {
        return res.status(400).json({ message: 'Invalid final percentage provided.' });
      }

      // Set completion category based on the manager's final percentage
      if (finalProgress === 100) {
        task.completionCategory = 'Completed';
      } else if (finalProgress >= 80) {
        task.completionCategory = 'Moderate';
      } else if (finalProgress >= 60) {
        task.completionCategory = 'Low';
      } else {
        task.completionCategory = 'Pending';
      }

      if (finalProgress < 100) {
        task.status = 'Not Completed'; // Requirement: If approved at < 100%, status is Incomplete
      } else {
        task.status = 'Completed'; // Requirement: If approved at 100%, status is Completed
      }
      task.completionDate = task.submittedForCompletionDate || new Date();
      task.progress = finalProgress; // Correctly assign the final progress
      task.rejectionReason = ''; // Clear any previous rejection reason

      // If there's a comment, add it to the task
      if (comment && comment.trim() !== '') {
        task.comments.push({
          text: `Approval comment: ${comment}`,
          author: approverId,
        });
      }

      await task.save();

      // Create a notification for the employee
      await Notification.create({
        recipient: task.assignedTo,
        subjectEmployee: approverId,
        message: `Your task "${task.title}" has been approved with a final grade of ${task.completionCategory}.`,
        type: 'info',
        relatedTask: task._id,
        isRead: false,
      });

      // After approval, delete the corresponding 'task_approval' notification
      await Notification.deleteMany({
        relatedTask: task._id,
        type: 'task_approval',
      });

      res.status(200).json({ message: 'Task approved successfully.', task });
    } catch (error) {
      console.error('Error approving task:', error);
      res.status(500).json({ message: 'Server error while approving task.' });
    }
  };

  static rejectTaskCompletion = async (req, res) => {
    const { id } = req.params;
    const { reason, finalPercentage } = req.body; // The final percentage is sent from the modal
    const rejectorId = req.user._id;

    if (!reason) {
      return res.status(400).json({ message: 'A reason is required for rejection.' });
    }

    try {
      const task = await Task.findById(id).populate('assignedTo'); // Populate the full assignee object
      if (!task) {
        return res.status(404).json({ message: 'Task not found.' });
      }
      if (!task.assignedTo) {
        return res.status(400).json({ message: 'This task has no assignee and cannot be reviewed.' });
      }
      // Ensure the task is actually pending verification before rejecting.
      if (task.status !== 'Pending Verification') {
        return res.status(400).json({ message: `This task is in '${task.status}' status and cannot be rejected. It must be 'Pending Verification'.` });
      }

      // Authorization Check:
      const isAssigner = task.assignedBy.toString() === rejectorId.toString();
      const isAdmin = req.user.role === 'Admin';
      const hasGlobalApprovePermission = req.user.canApproveTask;
      // Find the assignment to check if the reviewer is the team lead
      const assignment = await Assignment.findOne({ employee: task.assignedTo._id });
      const isTeamLeadOfAssignee = assignment && assignment.teamLead?.toString() === rejectorId.toString();

      if (!isAssigner && !isAdmin && !hasGlobalApprovePermission && !isTeamLeadOfAssignee) {
        return res.status(403).json({ message: 'You are not authorized to reject this task.' });
      }

      // Update progress if a final percentage is provided during rejection
      if (finalPercentage !== undefined && finalPercentage !== null) {
        task.progress = parseInt(finalPercentage, 10);
      }

      // Set the status to 'Not Completed' to finalize the task as incomplete.
      task.status = 'Not Completed';
      task.completionDate = new Date(); // Record the date of this final decision
      task.rejectionReason = reason;
      task.submittedForCompletionDate = task.submittedForCompletionDate || new Date(); // Ensure submission date is set

      // Set completion category based on the final percentage
      if (task.progress >= 80) {
        task.completionCategory = 'Moderate';
      } else if (task.progress >= 60) {
        task.completionCategory = 'Low';
      } else {
        task.completionCategory = 'Pending';
      }

      // Add a comment about the rejection
      task.comments.push({
        text: `Task graded as 'Not Completed'. Reason: ${reason}. Final Grade: ${task.progress}%`,
        author: rejectorId,
      });
      await task.save();

      await Notification.create({
        recipient: task.assignedTo._id,
        subjectEmployee: rejectorId,
        message: `Your task "${task.title}" was graded as 'Not Completed'. Reason: ${reason}. Grade: ${task.progress}%`,
        type: 'info',
        relatedTask: task._id,
      });

      // After rejection, delete the corresponding 'task_approval' notification
      await Notification.deleteMany({
        relatedTask: task._id,
        type: 'task_approval',
      });

      res.status(200).json({ message: 'Task graded as Incomplete successfully.', task });
    } catch (error) {
      console.error('Error rejecting task:', error);
      res.status(500).json({ message: 'Server error while rejecting task.' });
    }
  };

  static deleteTask = async (req, res) => {
    const { id } = req.params;

    if (req.user.role !== 'Admin' && !req.user.canDeleteTask) {
      return res.status(403).json({ message: 'You are not authorized to delete tasks.' });
    }

    try {
      const task = await Task.findById(id);

      if (!task) {
        return res.status(404).json({ message: 'Task not found.' });
      }

      await task.deleteOne();
      res.status(200).json({ message: 'Task deleted successfully.' });
    } catch (error) {
      console.error('Error deleting task:', error);
      res.status(500).json({ message: 'Server error while deleting task.' });
    }
  };

  /**
   * @description Add a comment to a task
   * @route POST /api/tasks/:id/comments
   * @access Private
   */
  static addTaskComment = async (req, res) => {
    const { id } = req.params;
    const { text } = req.body;
    const authorId = req.user._id;

    if (!text) {
      return res.status(400).json({ message: 'Comment text is required.' });
    }

    try {
      const task = await Task.findById(id);
      if (!task) {
        return res.status(404).json({ message: 'Task not found.' });
      }

      const comment = { author: authorId, text };
      task.comments.push(comment);
      await task.save();

      // Notify all relevant parties about the new comment
      const recipientIds = new Set();
      // Add the person who assigned the task
      if (task.assignedBy) recipientIds.add(task.assignedBy.toString());
      // Add the person the task is assigned to
      if (task.assignedTo) recipientIds.add(task.assignedTo.toString());

      // Also notify the team lead of the assignee
      const assignment = await Assignment.findOne({ employee: task.assignedTo });
      if (assignment && assignment.teamLead) {
        recipientIds.add(assignment.teamLead.toString());
      }

      // Remove the author from the notification list to avoid self-notification
      recipientIds.delete(authorId.toString());

      const notifications = Array.from(recipientIds).map(id => ({
        recipient: id,
        subjectEmployee: authorId,
        message: `${req.user.name} commented on the task: "${task.title}"`,
        type: 'info',
        relatedTask: task._id,
      }));

      if (notifications.length > 0) await Notification.insertMany(notifications, { ordered: false });

      const populatedTask = await Task.findById(id).populate('comments.author', 'name profilePicture');
      res.status(201).json(populatedTask);
    } catch (error) {
      console.error('Error adding comment:', error);
      res.status(500).json({ message: 'Server error while adding comment.' });
    }
  };

  /**
   * @description Transition tasks that are past their due date to 'Pending Verification'
   * @route POST /api/tasks/process-due-tasks
   * @access Private
   */
  static processPastDueTasks = async (req, res) => {
      try {
          const now = new Date();
          const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

          // Find potential tasks (just IDs) first
          const pastDueTasks = await Task.find({
              dueDate: { $lt: today },
              status: { $in: ['Pending', 'In Progress'] },
              // Exclude tasks that have been rejected (have a rejection reason)
              // to prevent them from looping back to 'Pending Verification' immediately after rejection.
              $or: [
                  { rejectionReason: { $exists: false } },
                  { rejectionReason: "" },
                  { rejectionReason: null }
              ]
          }).select('_id');

          let processedCount = 0;

          for (const taskRef of pastDueTasks) {
              // Atomically update the task status.
              // This ensures that if multiple requests try to process the same task,
              // only one will succeed in updating it and receiving the document back.
              const task = await Task.findOneAndUpdate(
                  { 
                      _id: taskRef._id, 
                      status: { $in: ['Pending', 'In Progress'] },
                      $or: [
                          { rejectionReason: { $exists: false } },
                          { rejectionReason: "" },
                          { rejectionReason: null }
                      ]
                  },
                  { 
                      $set: { 
                          status: 'Pending Verification',
                          submittedForCompletionDate: new Date()
                      } 
                  },
                  { new: true }
              ).populate('assignedTo', 'name');

              // If task is null, it means another request processed it first
              if (!task) continue;

              if (!task.assignedTo) {
                  console.log(`Skipping past-due processing for task ${task._id}: no assignee.`);
                  continue;
              }

              const employee = await Employee.findById(task.assignedTo._id);
              if (!employee) {
                  console.log(`Skipping notification for task ${task._id}: assigned employee not found.`);
                  continue;
              }

              const message = `The due date for the task "${task.title}" assigned to ${employee.name} has passed. It has been automatically submitted for review. Final Progress: ${task.progress}%.`;

              // Build a unique list of recipients who can approve the task
              const recipientIds = new Set();
              if (task.assignedBy) recipientIds.add(task.assignedBy.toString());

              // Find assignee's team lead
              const assignment = await Assignment.findOne({ employee: task.assignedTo._id });
              if (assignment && assignment.teamLead) {
                recipientIds.add(assignment.teamLead.toString());
              }

              // Add all admins
              const admins = await Employee.find({ role: 'Admin' }).select('_id');
              admins.forEach(admin => recipientIds.add(admin._id.toString()));

              // Don't notify the person who was assigned the task
              recipientIds.delete(task.assignedTo._id.toString());

              const notifications = Array.from(recipientIds).map(id => ({
                recipient: id,
                subjectEmployee: employee._id,
                message: message,
                type: 'task_approval',
                relatedTask: task._id,
              }));

              if (notifications.length > 0) {
                  try {
                      await Notification.insertMany(notifications, { ordered: false });
                  } catch (e) {
                      // Ignore duplicate key errors if the unique index is working
                      if (e.code !== 11000) console.error("Error sending notifications:", e);
                  }
              }
              processedCount++;
          }
          res.status(200).json({ message: `${processedCount} past-due tasks processed.` });
      } catch (error) {
          console.error('Error processing past-due tasks:', error);
          res.status(500).json({ message: 'Server error while processing past-due tasks.' });
      }
  };

  /**
   * @description Get all tasks with status 'Pending Verification' for the user's team or all if admin.
   * @route GET /api/tasks/for-approval
   * @access Admin, Manager
   */
  static getTasksForApproval = async (req, res) => {
    try {
      let tasksForApproval = [];
      const approverId = req.user._id;

      if (req.user.role === 'Admin') {
        // Admins can see all tasks pending verification
        tasksForApproval = await Task.find({ status: 'Pending Verification' })
          .populate('assignedTo', 'name profilePicture employeeId')
          .sort({ submittedForCompletionDate: 1 });
      } else {
        // Managers see tasks they assigned OR tasks assigned to their team members.
        const allEmployees = await Employee.find({});

        // Find all direct and indirect subordinates
        const teamMemberIds = new Set();
        const queue = allEmployees.filter(emp => emp.teamLead?._id.toString() === approverId.toString());
        const visited = new Set(queue.map(e => e._id.toString()));
        
        while (queue.length > 0) {
          const currentEmployee = queue.shift();
          teamMemberIds.add(currentEmployee._id);
          const directReports = allEmployees.filter(emp => emp.teamLead?._id.toString() === currentEmployee._id.toString());
          for (const report of directReports) {
            if (!visited.has(report._id.toString())) {
              visited.add(report._id.toString());
              queue.push(report);
            }
          }
        }

        tasksForApproval = await Task.find({
          status: 'Pending Verification',
          $or: [
            { assignedTo: { $in: Array.from(teamMemberIds) } }, // Task is assigned to a team member
            { assignedBy: approverId } // Task was assigned by the current manager
          ]
        })
          .populate('assignedTo', 'name profilePicture employeeId')
          .sort({ submittedForCompletionDate: 1 });
      }
      res.status(200).json(tasksForApproval);
    } catch (error) {
      console.error('Error fetching tasks for approval:', error);
      res.status(500).json({ message: 'Server error while fetching tasks for approval.' });
    }
  };
}

module.exports = TaskController;