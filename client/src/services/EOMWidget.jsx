import React, { useMemo, useState } from 'react';
import { useGetActiveAnnouncementQuery } from './EmployeApi';
import { MegaphoneIcon, XMarkIcon } from '@heroicons/react/24/solid';

const AnnouncementWidget = () => {
  const { data: announcement, isLoading } = useGetActiveAnnouncementQuery();
  const storageKey = useMemo(() => announcement ? `announcementDismissed_session_${announcement._id}` : null, [announcement]);

  const [isVisible, setIsVisible] = useState(true);
  
  React.useEffect(() => {
    if (storageKey) {
      setIsVisible(!sessionStorage.getItem(storageKey));
    }
  }, [storageKey]);

  const handleDismiss = () => {
    if (storageKey) {
      sessionStorage.setItem(storageKey, 'true');
    }
    setIsVisible(false);
  };

  if (isLoading || !announcement || !isVisible) {
    return null;
  }

  return (
    <div className="bg-blue-50 dark:bg-blue-900/50 border-b-2 border-blue-200 dark:border-blue-800 p-3 mb-8">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <MegaphoneIcon className="h-6 w-6 text-blue-500" />
          <p className="font-bold text-sm text-blue-900 dark:text-blue-200">{announcement.title}</p>
        </div>
        <div className="flex items-center gap-2">
          {announcement.relatedEmployee && (
            <img src={announcement.relatedEmployee.profilePicture || `https://ui-avatars.com/api/?name=${announcement.relatedEmployee.name}`} alt={announcement.relatedEmployee.name} className="h-8 w-8 rounded-full object-cover border-2 border-blue-300" />
          )}
          <p className="text-sm text-slate-700 dark:text-slate-300">{announcement.content}</p>
        </div>
        <button onClick={handleDismiss} className="p-1.5 rounded-full hover:bg-blue-100 dark:hover:bg-blue-500/20">
          <XMarkIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </button>
      </div>
    </div>
  );
};

export default AnnouncementWidget;