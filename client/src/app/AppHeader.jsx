import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  BellIcon,
  ChevronDownIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  ArrowPathIcon,
  Bars3Icon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { selectCurrentUser } from './authSlice';
import { useLogoutMutation } from '../services/apiSlice';
import { apiSlice } from '../services/apiSlice';
import { useGetNotificationsQuery, useMarkNotificationsAsReadMutation, useDeleteReadNotificationsMutation } from '../services/EmployeApi';
import ThemeToggle from '../ThemeToggle';

const AppHeader = ({ pageTitle, onMenuClick, setActiveComponent }) => {
  const user = useSelector(selectCurrentUser);
  const isAuthenticated = !!user?._id;
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const profileRef = useRef(null);
  const notificationRef = useRef(null);
  const [logout] = useLogoutMutation();
  const dispatch = useDispatch();

  const { data: notifications = [] } = useGetNotificationsQuery(undefined, { pollingInterval: 30000, skip: !isAuthenticated });
  const [markNotificationsAsRead] = useMarkNotificationsAsReadMutation();
  const [deleteReadNotifications] = useDeleteReadNotificationsMutation();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications]);

  const handleBellClick = () => {
    setIsNotificationOpen(!isNotificationOpen);
    if (!isNotificationOpen && unreadCount > 0) {
      setTimeout(() => {
        markNotificationsAsRead();
      }, 2000);
    }
  };

  const handleNotificationClick = (notification) => {
    setIsNotificationOpen(false);
    const message = notification.message?.toLowerCase() || '';
 
    // Priority 1: Task Approvals (specific type)
    if (notification.type === 'task_approval' && (user.role === 'Admin' || user.role === 'Super Admin' || user.canApproveTask)) {
      setActiveComponent('task-approvals');
      return;
    }
 
    // Priority 2: Task-related info notifications (approved, rejected, commented)
    // This is more robust than just checking the message.
    if (notification.type === 'info' && notification.relatedTask) {
      setActiveComponent('my-tasks');
      return;
    }
 
    // Priority 3: Announcements
    if (message.includes('announcement')) {
      // Admins go to management page, others to dashboard to see the widget
      setActiveComponent((user.role === 'Admin' || user.role === 'Super Admin') ? 'announcements' : 'dashboard');
      return;
    }
 
    // Priority 4: Report-related
    if (message.includes('report')) {
      // Both admins and managers should see team reports
      if (user.role === 'Admin' || user.role === 'Super Admin' || user.canViewTeam) {
        setActiveComponent('team-reports');
      } else {
        // An employee getting a report notification is likely about their own report.
        setActiveComponent('my-history');
      }
      return;
    }
 
    // Fallback for any other info notifications
    setActiveComponent((user.role === 'Admin' || user.role === 'Super Admin') ? 'view-tasks' : 'my-tasks');
  };

  const handleRefresh = () => {
    dispatch(apiSlice.util.invalidateTags(['Employee', 'Task', 'Notification', 'Report', 'Leave', 'Holiday', 'Announcement', 'EOMHistory', 'User', 'EOMOfficial', 'CompanyInfo']));
    toast.success("Dashboard data refreshed!");
  };

  const handleClearRead = async () => {
    try {
      await deleteReadNotifications().unwrap();
      toast.success('Read notifications cleared.');
    } catch {
      toast.error('Failed to clear notifications.');
    }
  };

  return (
    <header className="sticky md:relative top-0 left-0 right-0 z-30 h-[72px] bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-8 flex-shrink-0 transition-colors">
      <div className="flex items-center gap-2">
        <button onClick={onMenuClick} className="md:hidden text-slate-500 hover:text-indigo-600 p-2 rounded-full hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors">
          <Bars3Icon className="h-6 w-6" />
        </button>
        <h1 className="hidden md:block text-xl font-bold text-slate-800 dark:text-white tracking-tight truncate mr-6">{pageTitle}</h1>
      </div>
      <div className="flex-1 max-w-xl hidden lg:block px-6">
        <div className="relative w-full">
          <MagnifyingGlassIcon className="h-5 w-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search anything..." className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-11 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-700 dark:text-slate-200 placeholder-slate-400 transition-all" />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <div className="w-px h-6 bg-gray-200 dark:bg-slate-600"></div>
        <button onClick={handleRefresh} className="text-slate-500 hover:text-indigo-600 p-2 rounded-full hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors" title="Refresh Data">
          <ArrowPathIcon className="h-6 w-6" />
        </button>
        <div className="relative" ref={notificationRef}>
          <button onClick={handleBellClick} className="text-slate-500 hover:text-indigo-600 p-2 rounded-full hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors relative group">
            <BellIcon className="h-6 w-6" />
            {unreadCount > 0 && <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900"></span>}
          </button>
          {isNotificationOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-black rounded-md shadow-lg border border-gray-200 dark:border-slate-700 z-50">
              <div className="p-3 font-semibold text-sm border-b dark:border-slate-700 text-slate-800 dark:text-white">Notifications</div>
              <div className="max-h-80 overflow-y-auto">{notifications.length > 0 ? notifications.map(n => (<div key={n._id} onClick={() => handleNotificationClick(n)} className={`p-3 border-b dark:border-slate-700 text-xs cursor-pointer transition-colors ${!n.isRead ? 'bg-blue-50 dark:bg-blue-900/50' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}><p className="text-slate-700 dark:text-white">{n.message}</p><p className="text-slate-400 dark:text-slate-500 mt-1">{new Date(n.createdAt).toLocaleString()}</p></div>)) : (<p className="p-4 text-center text-sm text-gray-500 dark:text-white">No notifications</p>)}</div>
              <div className="p-2 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-black text-center"><button onClick={handleClearRead} className="text-xs font-semibold text-blue-600 hover:text-blue-800">Clear Read Notifications</button></div>
            </div>
          )}
        </div>
        <div className="relative" ref={profileRef}>
          <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-3 pl-1 pr-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm ml-2">
            <img 
              src={user?.profilePicture || `https://ui-avatars.com/api/?name=${user?.name || 'A'}&background=random`} 
              alt="User" 
              onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${user?.name || 'A'}&background=random`; }}
              className="h-8 w-8 rounded-full object-cover" 
            />
            <div className="text-left hidden sm:block pr-1">
              <div className="text-sm font-bold text-slate-800 dark:text-white leading-tight">{user?.name || 'Super Admin'}</div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-tight">{user?.role || 'Super Administrator'}</div>
            </div>
            <ChevronDownIcon className={`h-4 w-4 text-slate-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
          </button>
          {isProfileOpen && (<div className="absolute right-0 mt-2 w-48 bg-white dark:bg-black rounded-md shadow-lg py-1 z-50 border border-gray-200 dark:border-slate-700"><button onClick={() => { setActiveComponent('profile'); setIsProfileOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-slate-800"><UserCircleIcon className="h-5 w-5" />My Profile</button><button onClick={logout} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"><ArrowRightOnRectangleIcon className="h-5 w-5" />Logout</button></div>)}
        </div>
      </div>
    </header>
  );
};

export default AppHeader;