const Announcement = require('../models/announcement.js');
const Employee = require('../models/employee.js');
const Notification = require('../models/notification.js');
const Assignment = require('../models/assignment.js');

class AnnouncementController {
  /**
   * Get the active announcement for the logged-in user (per-user dismissed filtered)
   * GET /api/announcements/active
   */
  static getActiveAnnouncement = async (req, res) => {
    try {
      const userCompany = req.user.company;
      const userId = req.user._id;

      const baseQuery = {
        isActive: true,
        $or: [
          { expiresAt: null },
          { expiresAt: { $gt: new Date() } }
        ],
        dismissedBy: { $nin: [userId] } // exclude announcements dismissed by this user
      };

      let announcement = await Announcement.findOne({ ...baseQuery, company: userCompany })
        .sort({ createdAt: -1 })
        .populate('relatedEmployee', 'name profilePicture');

      if (!announcement) {
        announcement = await Announcement.findOne({ ...baseQuery, company: null })
          .sort({ createdAt: -1 })
          .populate('relatedEmployee', 'name profilePicture');
      }

      res.status(200).json(announcement);
    } catch (error) {
      console.error('Error fetching active announcement:', error);
      res.status(500).json({ message: 'Error fetching announcement.' });
    }
  };

  /**
   * Get all announcements (Admin view)
   * GET /api/announcements
   */
  static getAllAnnouncements = async (req, res) => {
    if (req.user.role !== 'Admin') return res.status(403).json({ message: 'Not authorized.' });
    try {
      const announcements = await Announcement.find({})
        .populate('createdBy', 'name')
        .populate('relatedEmployee', 'name profilePicture')
        .sort({ createdAt: -1 });
      res.status(200).json(announcements);
    } catch (error) {
      console.error('Error fetching all announcements:', error);
      res.status(500).json({ message: 'Error fetching announcements.' });
    }
  };

  /**
   * Create announcement (Admin)
   * POST /api/announcements
   */
  static createAnnouncement = async (req, res) => {
    if (req.user.role !== 'Admin') return res.status(403).json({ message: 'Not authorized.' });
    const { title, content, startDate, expiresAt, company, relatedEmployee } = req.body;
    if (!title?.trim() || !content?.trim()) return res.status(400).json({ message: 'Title and content are required.' });

    try {
      const newAnnouncement = new Announcement({
        title,
        content,
        createdBy: req.user._id,
        isActive: true,
        startDate: startDate || Date.now(),
        expiresAt: expiresAt || null,
        company: company || null,
        relatedEmployee: relatedEmployee || null,
      });
      await newAnnouncement.save();

      // Notify employees (except creator)
      const employeeQuery = company ? { company } : {};
      const allEmployees = await Employee.find({ ...employeeQuery, _id: { $ne: req.user._id } }).select('_id');
      const notifications = allEmployees.map(emp => ({
        recipient: emp._id,
        message: `A new announcement has been published: "${title}"`,
        type: 'info',
        relatedAnnouncement: newAnnouncement._id,
      }));
      if (notifications.length > 0) await Notification.insertMany(notifications, { ordered: false });

      res.status(201).json(newAnnouncement);
    } catch (error) {
      console.error('Error creating announcement:', error);
      res.status(500).json({ message: 'Server error creating announcement.' });
    }
  };

  /**
   * Delete announcement (Admin permanent deletion)
   * DELETE /api/announcements/:id
   */
  static deleteAnnouncement = async (req, res) => {
    if (req.user.role !== 'Admin') return res.status(403).json({ message: 'Not authorized.' });
    const { id } = req.params;
    try {
      const deleted = await Announcement.findByIdAndDelete(id);
      if (!deleted) return res.status(404).json({ message: 'Announcement not found.' });

      await Notification.deleteMany({ relatedAnnouncement: id });
      res.status(200).json({ message: 'Announcement deleted.' });
    } catch (error) {
      console.error('Error deleting announcement:', error);
      res.status(500).json({ message: 'Server error deleting announcement.' });
    }
  };

  /**
   * Dismiss announcement for current user only (per-user dismissal)
   * POST /api/announcements/:id/dismiss
   */
  static dismissAnnouncement = async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;

    try {
      const announcement = await Announcement.findByIdAndUpdate(
        id,
        { $addToSet: { dismissedBy: userId } }, // push only if not already present
        { new: true }
      );

      if (!announcement) return res.status(404).json({ message: 'Announcement not found.' });

      res.status(200).json({ message: 'Announcement dismissed for this user.' });
    } catch (error) {
      console.error('Error dismissing announcement:', error);
      res.status(500).json({ message: 'Server error dismissing announcement.' });
    }
  };
}

module.exports = AnnouncementController;