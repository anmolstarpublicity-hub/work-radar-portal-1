const express = require('express');
const ManageEmployeeController = require('../controllers/manageEmployeeController.js');
const AssignmentController = require('../controllers/assignmentController.js');
const ReportController = require('../controllers/reportController.js');
const NotificationController = require('../controllers/notificationController.js');
const HolidayController = require('../controllers/holidayController.js');
const LeaveController = require('../controllers/leaveController.js');
const AttendanceController = require('../controllers/attendanceController.js');
const TaskController = require('../controllers/taskController.js');
const AuthController = require('../controllers/authController.js');
const SetupController = require('../controllers/setupController.js');
const SettingsController = require('../controllers/settingsController.js');
const AnnouncementController = require('../controllers/announcementController.js');
const MonitoringController = require('../controllers/monitoringController.js');
const HorillaController = require('../controllers/horillaController.js');
const { protect } = require('../middleware/authMiddleware.js');
const multer = require('multer');
const { storage } = require('../config/cloudinary.js');
const upload = multer({ storage });

const router = express.Router();
router.get('/setup/check', SetupController.checkSetup);
router.post('/setup/create-admin', upload.single('profilePicture'), SetupController.createAdmin);
router.get('/setup/company-info', SetupController.getCompanyInfo);

// Public route
router.post('/login', AuthController.login);
router.post('/logout', AuthController.logout);
router.get('/auth/me', protect, AuthController.getMe);
router.post('/auth/forgot-password', AuthController.forgotPassword);
router.post('/auth/reset-password/:token', AuthController.resetPassword);

// Employee Management Routes
router.post('/employees', protect, upload.single('profilePicture'), ManageEmployeeController.addEmployee);
router.put('/employees/:id', protect, upload.single('profilePicture'), ManageEmployeeController.updateEmployee);
router.delete('/employees/:id', protect, ManageEmployeeController.deleteEmployee);
router.put('/employees/:id/assign', protect, AssignmentController.assignEmployee);
router.delete('/employees/:id/unassign', protect, AssignmentController.unassignEmployee);
router.get('/stats', protect, ManageEmployeeController.getDashboardStats);
router.get('/manager-stats/:managerId', protect, ManageEmployeeController.getManagerDashboardStats);
router.get('/employees', protect, ManageEmployeeController.getAllEmployees);
router.get('/employees/employee-of-the-month', protect, ManageEmployeeController.getEmployeeOfTheMonthCandidates);
router.post('/employees/employee-of-the-month', protect, ManageEmployeeController.setEmployeeOfTheMonth);
router.get('/employees/official-eom', protect, ManageEmployeeController.getOfficialEOM);
router.get('/employees/hall-of-fame', protect, ManageEmployeeController.getHallOfFame);
router.get('/employees/:employeeId/eom-history', protect, ManageEmployeeController.getEmployeeEOMHistory);

// Report Routes
router.get('/reports/my-today/:employeeId', protect, ReportController.getMyTodaysReport);
router.post('/reports/my-today/:employeeId', protect, ReportController.updateMyTodaysReport);
router.get('/reports/my-all/:employeeId', protect, ReportController.getAllMyReports);
router.get('/reports/employee/:employeeId', protect, ReportController.getReportsForEmployee);
router.delete('/reports/:id', protect, ReportController.deleteReport);

// Notification Routes
router.get('/notifications', protect, NotificationController.getMyNotifications);
router.put('/notifications/mark-read', protect, NotificationController.markNotificationsAsRead);
router.delete('/notifications/read', protect, NotificationController.deleteReadNotifications);

// Holiday Routes
router.get('/holidays', protect, HolidayController.getHolidays);
router.post('/holidays', protect, HolidayController.addHoliday);
router.delete('/holidays/:id', protect, HolidayController.deleteHoliday);
router.get('/holidays/today', protect, HolidayController.isTodayHoliday);

// Leave Routes
router.get('/leaves/:employeeId', protect, LeaveController.getLeavesForEmployee);
router.post('/leaves/:employeeId', protect, LeaveController.addLeave);
router.delete('/leaves/:leaveId', protect, LeaveController.removeLeave);

// Attendance Route
router.get('/attendance/:employeeId', protect, AttendanceController.getAttendanceForMonth);

// Task Routes
router.post('/tasks', protect, TaskController.createTask);
router.post('/tasks/multiple', protect, TaskController.createMultipleTasks);
router.get('/tasks/my-tasks', protect, TaskController.getMyTasks);
router.get('/tasks/for-approval', protect, TaskController.getTasksForApproval);
router.get('/tasks/all', protect, TaskController.getAllTasks);
router.put('/tasks/:id', protect, TaskController.updateTask);
router.put('/tasks/:id/approve', protect, TaskController.approveTaskCompletion);
router.put('/tasks/:id/reject', protect, TaskController.rejectTaskCompletion);
router.post('/tasks/:id/comments', protect, TaskController.addTaskComment);
router.delete('/tasks/:id', protect, TaskController.deleteTask);
router.post('/tasks/process-due-tasks', protect, TaskController.processPastDueTasks);

// Monitoring Routes (Portal 3 - Supabase)
router.get('/monitoring/:employeeId/pc-start', protect, MonitoringController.getPCStartTimeForEmployee);
router.get('/monitoring/:employeeId/pc-shutdown', protect, MonitoringController.getPCShutdownTimeForEmployee);
router.get('/monitoring/:employeeId/activity', protect, MonitoringController.getActivityLogsForEmployee);
router.get('/monitoring/:employeeId/pc-days', protect, MonitoringController.getPCDaysForEmployee);

// Horilla Routes (Portal 1 - HRM)
router.get('/horilla/:employeeId/punch', protect, HorillaController.getPunchForEmployee);

const EmployeeScoreController = require('../controllers/employeeScoreController.js');

router.get('/employee-scores/:employeeId', protect, EmployeeScoreController.getScore);
router.post('/employee-scores/:employeeId', protect, EmployeeScoreController.setScore);

// Announcement Routes
router.get('/announcements/active', protect, AnnouncementController.getActiveAnnouncement);
router.get('/announcements', protect, AnnouncementController.getAllAnnouncements);
router.post('/announcements', protect, AnnouncementController.createAnnouncement);
router.delete('/announcements/:id', protect, AnnouncementController.deleteAnnouncement);
// per-user dismiss
router.post('/announcements/:id/dismiss', protect, AnnouncementController.dismissAnnouncement);

module.exports = router;