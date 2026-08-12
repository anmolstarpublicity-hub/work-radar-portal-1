import React, { useEffect, useState } from 'react';
import { XMarkIcon, MegaphoneIcon } from '@heroicons/react/24/outline'; // Removed unused import of XMarkIcon
import { useGetActiveAnnouncementQuery, useDismissAnnouncementMutation } from './EmployeApi';
import toast from 'react-hot-toast';

const AnnouncementWidget = () => {
  const { data: announcement, isLoading, isError } = useGetActiveAnnouncementQuery();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (announcement) {
      const dismissed = sessionStorage.getItem(`announcementDismissed_session_${announcement._id}`);
      setIsVisible(!dismissed);
    }
  }, [announcement]);

  const [dismissAnnouncement] = useDismissAnnouncementMutation();
  const handleDismiss = () => {
    if (!announcement?._id) return; // Ensure announcement ID exists
    dismissAnnouncement(announcement._id) // Call the RTK Query mutation
      .unwrap()
      .then(() => {
        sessionStorage.setItem(`announcementDismissed_session_${announcement._id}`, 'true'); // Mark as dismissed in session storage
        setIsVisible(false); // Hide immediately
        toast.success('Announcement dismissed.');
      })
      .catch(err => {
        console.error('Failed to dismiss announcement:', err);
        toast.error('Failed to dismiss announcement. Please try again.');
      });
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

  const isEOM = !!announcement.relatedEmployee;

  const goldStyle = {
    background: 'linear-gradient(135deg, #92600A 0%, #D4A017 30%, #F5C842 55%, #D4A017 80%, #92600A 100%)',
    backgroundSize: '200% 100%',
    animation: 'goldShimmer 3s ease-in-out infinite',
    boxShadow: '0 4px 24px rgba(212,160,23,0.45), 0 1px 4px rgba(146,96,10,0.3)',
    border: '1.5px solid rgba(245,200,66,0.6)',
    textColor: '#1C0A00',
    subTextColor: '#2d1200',
  };

  const silverStyle = {
    background: 'linear-gradient(135deg, #6b7280 0%, #9ca3af 30%, #d1d5db 55%, #9ca3af 80%, #6b7280 100%)',
    backgroundSize: '200% 100%',
    animation: 'goldShimmer 3s ease-in-out infinite',
    boxShadow: '0 4px 24px rgba(107,114,128,0.4), 0 1px 4px rgba(75,85,99,0.25)',
    border: '1.5px solid rgba(209,213,219,0.6)',
    textColor: '#111827',
    subTextColor: '#1f2937',
  };

  const theme = isEOM ? goldStyle : silverStyle;

  return (
    <div style={{
      background: theme.background,
      backgroundSize: theme.backgroundSize,
      animation: theme.animation,
      borderRadius: '16px',
      padding: '16px 20px',
      marginBottom: '32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '16px',
      boxShadow: theme.boxShadow,
      border: theme.border,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <style>{`
        @keyframes goldShimmer {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes megaphonePulse {
          0%, 100% { transform: rotate(-8deg) scale(1); }
          50%       { transform: rotate(8deg) scale(1.15); }
        }
      `}</style>

      {/* Shimmer overlay */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 'inherit',
        background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.2) 50%, transparent 60%)',
        animation: 'goldShimmer 2.5s ease-in-out infinite',
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', position: 'relative', zIndex: 1 }}>
        <MegaphoneIcon style={{
          width: '28px', height: '28px', flexShrink: 0,
          color: theme.textColor,
          animation: 'megaphonePulse 1.8s ease-in-out infinite',
          filter: 'drop-shadow(0 1px 2px rgba(255,255,255,0.2))',
        }} />
        <div>
          <h3 style={{ fontWeight: 800, fontSize: '17px', color: theme.textColor, marginBottom: '3px', letterSpacing: '-0.01em' }}>
            {announcement.title}
          </h3>
          <p style={{ fontSize: '14px', color: theme.subTextColor, fontWeight: 500 }}>{announcement.content}</p>
          {announcement.relatedEmployee && (
            <p style={{ fontSize: '12px', color: theme.subTextColor, fontWeight: 600, marginTop: '4px' }}>
              — {announcement.relatedEmployee.name}
            </p>
          )}
        </div>
      </div>

      <button
        onClick={handleDismiss}
        style={{
          padding: '6px', borderRadius: '50%', background: 'rgba(0,0,0,0.12)',
          border: '1px solid rgba(0,0,0,0.1)', cursor: 'pointer', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', zIndex: 1, transition: 'background 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.22)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.12)'}
        aria-label="Dismiss announcement"
      >
        <XMarkIcon style={{ width: '18px', height: '18px', color: theme.textColor }} />
      </button>
    </div>
  );
};

export default AnnouncementWidget;