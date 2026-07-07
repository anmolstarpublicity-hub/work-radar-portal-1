import React, { useEffect, useState } from 'react';
import { XMarkIcon, MegaphoneIcon } from '@heroicons/react/24/outline';
import { useGetActiveAnnouncementQuery } from './EmployeApi';
import toast from 'react-hot-toast';

const AnnouncementWidget = () => {
  const { data: announcement, isLoading, isError } = useGetActiveAnnouncementQuery();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!announcement) return;
    const dismissed = sessionStorage.getItem('dismissedAnnouncements_session');
    const list = dismissed ? JSON.parse(dismissed) : [];
    setIsVisible(!list.includes(announcement._id));
  }, [announcement]);

  const handleDismiss = () => {
    if (!announcement?._id) return;
    const dismissed = sessionStorage.getItem('dismissedAnnouncements_session');
    const list = dismissed ? JSON.parse(dismissed) : [];
    if (!list.includes(announcement._id)) list.push(announcement._id);
    sessionStorage.setItem('dismissedAnnouncements_session', JSON.stringify(list));
    setIsVisible(false);
    toast.success('Announcement dismissed for this session.');
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm mb-6 flex items-center gap-3 animate-pulse">
        <div className="h-6 w-6 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
      </div>
    );
  }

  if (isError || !announcement || !isVisible) {
    return null; // Don't render if there's an error or no active announcement or dismissed this session
  }

  return (
    <div className="bg-gradient-to-r from-indigo-500 to-blue-600 text-white p-4 rounded-2xl shadow-lg mb-8 flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <MegaphoneIcon className="h-7 w-7 flex-shrink-0" />
        <div>
          <h3 className="font-bold text-lg">{announcement.title}</h3>
          <p className="text-sm opacity-90">{announcement.content}</p>
          {announcement.relatedEmployee && (
            <p className="text-xs opacity-80 mt-1">
              - {announcement.relatedEmployee.name}
            </p>
          )}
        </div>
      </div>
      <button
        onClick={handleDismiss}
        className="p-2 rounded-full hover:bg-white/20 transition-colors flex-shrink-0"
        aria-label="Dismiss announcement"
      >
        <XMarkIcon className="h-5 w-5" />
      </button>
    </div>
  );
};

export default AnnouncementWidget;