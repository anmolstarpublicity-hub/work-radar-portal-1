import React, { useState } from 'react';
import { useGetAllAnnouncementsQuery, useCreateAnnouncementMutation, useDeleteAnnouncementMutation } from '../services/EmployeApi';
import toast from 'react-hot-toast';
import { MegaphoneIcon, PlusIcon, TrashIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

const ManageAnnouncements = () => {
  const { data: announcements = [], isLoading } = useGetAllAnnouncementsQuery();
  const [createAnnouncement, { isLoading: isCreating }] = useCreateAnnouncementMutation();
  const [deleteAnnouncement, { isLoading: isDeleting }] = useDeleteAnnouncementMutation();

  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '' });

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newAnnouncement.title || !newAnnouncement.content) {
      toast.error('Title and content are required.');
      return;
    }
    try {
      await createAnnouncement(newAnnouncement).unwrap();
      toast.success('New announcement is now active!');
      setNewAnnouncement({ title: '', content: '' });
    } catch (err) {
      console.error('Failed to create announcement:', err);
      toast.error('Failed to create announcement.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteAnnouncement(id).unwrap();
      toast.success('Announcement deleted.');
    } catch (err) {
      console.error('Failed to delete announcement:', err);
      toast.error('Failed to delete announcement.');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">Manage Announcements</h1>
        <p className="text-slate-500 dark:text-white mt-2">Create and manage company-wide announcements. The latest one created will be active.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1"> {/* Changed form background */}
          <form onSubmit={handleCreate} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Create New Announcement</h3>
            <input
              type="text"
              placeholder="Announcement Title"
              value={newAnnouncement.title}
              onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
              className="w-full text-sm border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg p-2"
            />
            <textarea
              placeholder="Announcement Content..."
              rows="5"
              value={newAnnouncement.content}
              onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
              className="w-full text-sm border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg p-2"
            />
            <button type="submit" disabled={isCreating} className="w-full inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-lg text-sm disabled:bg-blue-400">
              {isCreating ? <ArrowPathIcon className="animate-spin h-5 w-5 mr-2" /> : <PlusIcon className="h-5 w-5 mr-2" />}
              {isCreating ? 'Publishing...' : 'Publish New Announcement'}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2"> {/* Changed history background */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg p-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Announcement History</h3>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {isLoading ? <p>Loading...</p> : announcements.map(ann => (
                <div key={ann._id} className={`p-4 rounded-lg border ${ann.isActive ? 'bg-blue-50 dark:bg-blue-900/50 border-blue-300 dark:border-blue-800' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-white">{ann.title}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        By {ann.createdBy?.name || 'Admin'} on {new Date(ann.createdAt).toLocaleDateString()}
                      </p>
                      {(ann.startDate || ann.endDate) && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
                          Visible: {ann.startDate ? new Date(ann.startDate).toLocaleDateString() : '...'} - {ann.endDate ? new Date(ann.endDate).toLocaleDateString() : '...'}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {ann.isActive && (
                        <span className="text-xs font-bold text-green-700 bg-green-200 dark:bg-green-900/50 dark:text-green-300 px-2 py-1 rounded-full">Active</span>
                      )}
                      <button onClick={() => handleDelete(ann._id)} disabled={isDeleting} className="p-1.5 text-red-500 hover:bg-red-100 rounded-full">
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 whitespace-pre-wrap">{ann.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageAnnouncements;