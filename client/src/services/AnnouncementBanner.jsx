import React, { useState } from 'react';
import { useGetActiveAnnouncementQuery } from '../services/EmployeApi';
import { MegaphoneIcon, XMarkIcon } from '@heroicons/react/24/outline';

const AnnouncementBanner = () => {
  const { data: announcement, isLoading } = useGetActiveAnnouncementQuery();
  const [isVisible, setIsVisible] = useState(true);
  React.useEffect(() => {
    if (!announcement) return;
    const key = `announcementDismissed_session_${announcement._id}`;
    setIsVisible(!sessionStorage.getItem(key));
  }, [announcement]);

  const showBanner = !isLoading && announcement && isVisible;

  if (!showBanner) {
    return null;
  }

  return (
    <div className="relative bg-gradient-to-r from-blue-600 to-indigo-700 text-white animate-fade-in-down">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex flex-1 items-center">
            <span className="flex rounded-lg bg-indigo-800/50 p-2">
              <MegaphoneIcon className="h-6 w-6" aria-hidden="true" />
            </span>
            <p className="ml-3 font-medium">
              <strong className="font-bold">{announcement.title}:</strong>
              <span className="ml-2 hidden md:inline">{announcement.content}</span>
            </p>
          </div>
          <div className="order-3 mt-2 w-full flex-shrink-0 sm:order-2 sm:mt-0 sm:w-auto">
            <button onClick={() => {
                if (announcement && announcement._id) {
                  const key = `announcementDismissed_session_${announcement._id}`;
                  sessionStorage.setItem(key, 'true');
                }
                setIsVisible(false);
              }} className="flex items-center justify-center rounded-md border border-transparent bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/20">
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementBanner;