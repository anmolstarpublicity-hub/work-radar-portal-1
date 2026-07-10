import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  BellIcon,
  ChevronDownIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  ArrowPathIcon,
  Bars3Icon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { selectCurrentUser } from './authSlice';
import { useLogoutMutation } from '../services/apiSlice';
import { apiSlice } from '../services/apiSlice';
import { useGetMyNotificationsQuery, useMarkNotificationsAsReadMutation, useDeleteReadNotificationsMutation } from '../services/EmployeApi';
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

  const { data: notifications = [] } = useGetMyNotificationsQuery(undefined, { pollingInterval: 30000, skip: !isAuthenticated });
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
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

    if (notification.type === 'task_approval' && (user.role === 'Admin' || user.role === 'Super Admin' || user.canApproveTask)) {
      setActiveComponent('task-approvals');
      return;
    }

    if (notification.type === 'info' && notification.relatedTask) {
      setActiveComponent('my-tasks');
      return;
    }

    if (message.includes('announcement')) {
      setActiveComponent((user.role === 'Admin' || user.role === 'Super Admin') ? 'announcements' : 'dashboard');
      return;
    }

    if (message.includes('report')) {
      if (user.role === 'Admin' || user.role === 'Super Admin' || user.canViewTeam) {
        setActiveComponent('team-reports');
      } else {
        setActiveComponent('my-history');
      }
      return;
    }

    setActiveComponent((user.role === 'Admin' || user.role === 'Super Admin') ? 'view-tasks' : 'my-tasks');
  };

  const handleRefresh = () => {
    dispatch(apiSlice.util.invalidateTags(['Employee', 'Task', 'Notification', 'Report', 'Leave', 'Holiday', 'Announcement', 'EOMHistory', 'User', 'EOMOfficial', 'CompanyInfo']));
    toast.success('Dashboard data refreshed!');
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
    // Adjusted header height and vertical alignment for better aesthetic
    <header className="sticky left-0 right-0 top-0 z-30 flex h-[80px] flex-shrink-0 items-center justify-between border-b border-gray-100 bg-white/95 px-4 transition-colors sm:px-8 md:relative dark:border-slate-700 dark:bg-slate-900/95">
      <div className="flex items-center gap-2"> {/* Grouping menu button and page title */}
        <button onClick={onMenuClick} className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-[#2563EB] md:hidden dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-blue-400">
          <Bars3Icon className="h-6 w-6" />
        </button>
        <h1 className="mr-6 hidden truncate text-xl font-bold tracking-tight text-slate-800 md:block dark:text-white">{pageTitle}</h1>
      </div>
      <div className="hidden max-w-xl flex-1 px-6 lg:block">
        <div className="relative w-full">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input type="text" placeholder="Search anything..." className="wr-input pl-11 pr-4 dark:bg-slate-800 dark:text-white dark:border-slate-700" />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <div className="h-6 w-px bg-gray-200 dark:bg-slate-700"></div>
        <button onClick={handleRefresh} className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-[#2563EB] dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-blue-400" title="Refresh Data">
          <ArrowPathIcon className="h-6 w-6" />
        </button>
        <div className="relative" ref={notificationRef}>
          <button onClick={handleBellClick} className="group relative rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-[#2563EB] dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-blue-400">
            <BellIcon className="h-6 w-6" />
            {unreadCount > 0 && <span className="absolute right-1 top-1 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white"></span>}
          </button>
          {isNotificationOpen && (
            <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-gray-100 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
              <div className="border-b border-gray-100 p-3 text-sm font-semibold text-slate-800 dark:border-slate-700 dark:text-white">Notifications</div>
              <div className="max-h-80 overflow-y-auto">{notifications.length > 0 ? notifications.map(n => (<div key={n._id} onClick={() => handleNotificationClick(n)} className={`cursor-pointer border-b border-gray-100 p-3 text-xs transition-colors ${!n.isRead ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}><p className="text-slate-700 dark:text-slate-300">{n.message}</p><p className="mt-1 text-slate-400 dark:text-slate-500">{new Date(n.createdAt).toLocaleString()}</p></div>)) : (<p className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">No notifications</p>)}</div>
              <div className="border-t border-gray-100 bg-slate-50 p-2 text-center dark:border-slate-700 dark:bg-slate-900/50"><button onClick={handleClearRead} className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] dark:text-blue-400 dark:hover:text-blue-300">Clear Read Notifications</button></div>
            </div>
          )}
        </div>
        <div className="relative" ref={profileRef}> {/* Profile dropdown */}
          <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="ml-2 flex items-center gap-3 rounded-full border border-gray-200 bg-white px-1 py-1 pr-3 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700">
            <img
              src={user?.profilePicture || `https://ui-avatars.com/api/?name=${user?.name || 'A'}&background=random`}
              alt="User"
              onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${user?.name || 'A'}&background=random`; }}
              className="h-8 w-8 rounded-full object-cover"
            />
            <div className="hidden pr-1 text-left sm:block"> {/* User name and role */}
              <div className="text-sm font-bold leading-tight text-slate-800 dark:text-white">{user?.name || 'Super Admin'}</div>
              <div className="text-xs font-medium leading-tight text-slate-500 dark:text-slate-400">{user?.role || 'Super Administrator'}</div>
            </div>
            <ChevronDownIcon className={`h-4 w-4 text-slate-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
          </button>
          {isProfileOpen && (<div className="absolute right-0 z-50 mt-2 w-48 rounded-xl border border-gray-100 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800"><button onClick={() => { setActiveComponent('profile'); setIsProfileOpen(false); }} className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700"><UserCircleIcon className="h-5 w-5" />My Profile</button><button onClick={logout} className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"><ArrowRightOnRectangleIcon className="h-5 w-5" />Logout</button></div>)}
        </div>
      </div>
    </header>
  );
};

export default AppHeader;