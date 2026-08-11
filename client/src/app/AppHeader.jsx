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
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-sm transition-all duration-200">
      <div className="mx-auto flex w-full max-w-[1720px] flex-col gap-4 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6 w-full">
          <button onClick={onMenuClick} className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-slate-300 hover:text-slate-700 md:hidden">
            <Bars3Icon className="h-5 w-5" />
          </button>

          <div className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-slate-100 px-4 py-2 shadow-sm">
            <span className="text-sm font-semibold text-slate-800">{pageTitle}</span>
          </div>

          <div className="relative hidden flex-1 max-w-xl sm:block">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search anything..."
              className="w-full rounded-full border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm text-slate-700 shadow-sm outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 sm:gap-3">
          <ThemeToggle />
          <div className="hidden h-8 w-px bg-slate-200 sm:block" />
          <button onClick={handleRefresh} className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-slate-300 hover:text-slate-700" title="Refresh Data">
            <ArrowPathIcon className="h-5 w-5" />
          </button>
          <div className="relative">
            <button onClick={handleBellClick} className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-slate-300 hover:text-slate-700">
              <BellIcon className="h-5 w-5" />
              {unreadCount > 0 && <span className="absolute right-1 top-1 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />}
            </button>
            {isNotificationOpen && (
              <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
                <div className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900">Notifications</div>
                <div className="max-h-80 space-y-0.5 overflow-y-auto">
                  {notifications.length > 0 ? notifications.map(n => (
                    <button key={n._id} onClick={() => handleNotificationClick(n)} className={`w-full text-left px-4 py-3 text-sm transition ${!n.isRead ? 'bg-slate-50' : 'hover:bg-slate-100'}`}>
                      <p className="text-slate-700">{n.message}</p>
                      <p className="mt-1 text-xs text-slate-400">{new Date(n.createdAt).toLocaleString()}</p>
                    </button>
                  )) : (
                    <div className="p-4 text-center text-sm text-slate-500">No notifications</div>
                  )}
                </div>
                <div className="border-t border-slate-200 bg-slate-50 px-4 py-2 text-center">
                  <button onClick={handleClearRead} className="text-xs font-semibold text-purple-600 hover:text-purple-700">Clear read notifications</button>
                </div>
              </div>
            )}
          </div>

          <div className="relative" ref={profileRef}>
            <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50">
              <div className="relative h-9 w-9 overflow-hidden rounded-full bg-purple-600 text-white shadow-sm">
                {user?.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt={user?.name || 'User'}
                    className="h-full w-full object-cover"
                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'AD')}&background=8E5FD0&color=fff`; }}
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-sm font-semibold uppercase">
                    {user?.name ? user.name.split(' ').map(n => n[0]).slice(0,2).join('') : 'AD'}
                  </span>
                )}
              </div>
              <div className="hidden min-w-0 flex-col truncate sm:flex">
                <span className="truncate text-slate-900">{user?.name || 'Admin'}</span>
                <span className="truncate text-xs text-slate-500">{user?.role || 'Admin'}</span>
              </div>
              <ChevronDownIcon className={`h-4 w-4 text-slate-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
            </button>
            {isProfileOpen && (
              <div className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
                <button onClick={() => { setActiveComponent('profile'); setIsProfileOpen(false); }} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50">
                  <UserCircleIcon className="h-5 w-5 text-slate-500" />
                  My Profile
                </button>
                <div className="border-t border-slate-200" />
                <button onClick={logout} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-red-600 transition hover:bg-red-50">
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;