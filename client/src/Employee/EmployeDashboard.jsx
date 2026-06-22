import React, { useState, useEffect, useMemo } from 'react';
import { useGetTodaysReportQuery, useUpdateTodaysReportMutation, useGetEmployeesQuery, useGetHolidaysQuery, useGetMyTasksQuery, useGetAllTasksQuery, useGetAllMyReportsQuery, useGetActiveAnnouncementQuery, useGetEmployeeEOMHistoryQuery, useProcessPastDueTasksMutation, useUpdateEmployeeMutation } from '../services/EmployeApi';
import { apiSlice, useLogoutMutation } from '../services/apiSlice';
import toast from 'react-hot-toast';
import { ArrowPathIcon, PaperAirplaneIcon, DocumentTextIcon, BriefcaseIcon, CheckCircleIcon, HomeIcon, ChartBarIcon, UserGroupIcon, InformationCircleIcon, CalendarDaysIcon, ClipboardDocumentListIcon, CheckBadgeIcon, ArchiveBoxIcon, TrophyIcon, StarIcon, ShieldCheckIcon, ExclamationTriangleIcon, ClockIcon, CalendarIcon, ChevronDoubleLeftIcon, ChevronDownIcon, ArrowRightOnRectangleIcon, Cog8ToothIcon, ArrowDownTrayIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { EyeIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUser } from '../app/authSlice';
import PastReportsList from './PastReports';
import AttendanceCalendar from '../services/AttendanceCalendar';
import TaskApprovals from '../Admin/TaskApprovals';
import ThemeToggle from '../ThemeToggle.jsx';
import AssignTask from '../Senior/AssignTask.jsx'; 
import AnnouncementWidget from '../services/AnnouncementWidget.jsx';
import starPublicityLogo from '../assets/starpublicity.png';
import volgaInfosysLogo from '../assets/volgainfosys.png';
import ViewTeamTasks from '../Senior/ViewTeamTasks.jsx';
import { TaskDetailsModal } from '../Admin/TaskOverview.jsx';
import { TeamReports } from '../Admin/AdminDashboard.jsx';
import GooglePieChart from '../Admin/GooglePieChart.jsx';
import GoogleAreaChart from '../Admin/GoogleAreaChart.jsx';
import AppHeader from '../app/AppHeader.jsx';
import StatCard from '../shared/StatCard.jsx';
import Sidebar from '../shared/Sidebar.jsx';

const safeDate = (dateVal) => {
  if (!dateVal) return new Date();
  const d = new Date(dateVal);
  return isNaN(d.getTime()) ? new Date() : d;
};

const isSameDay = (date1, date2) => {
  if (!date1 || !date2) return false;
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
};

export const Dashboard = ({ user, onNavigate }) => {
  const { data: tasks = [], isLoading } = useGetMyTasksQuery(undefined, { pollingInterval: 30000 });
  const { data: announcement } = useGetActiveAnnouncementQuery();

  const [filterType, setFilterType] = useState('week');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

  useEffect(() => {
    const today = new Date();
    if (filterType === 'week') {
      const firstDay = new Date(today.setDate(today.getDate() - today.getDay()));
      const lastDay = new Date(firstDay);
      lastDay.setDate(lastDay.getDate() + 6);
      setDateRange({
        startDate: firstDay.toISOString().split('T')[0],
        endDate: lastDay.toISOString().split('T')[0],
      });
    } else if (filterType === 'month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      setDateRange({
        startDate: firstDay.toISOString().split('T')[0],
        endDate: lastDay.toISOString().split('T')[0],
      });
    }
  }, [filterType]);

  // Find next due date for user's own tasks
  const nextMyTaskDueDate = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to midnight for date-only comparison
    const upcoming = tasks
      .filter(task => task.dueDate && !['Completed', 'Not Completed', 'Pending Verification'].includes(task.status) && safeDate(task.dueDate) >= today)
      .map(task => safeDate(task.dueDate))
      .sort((a, b) => a - b);
    return upcoming.length > 0 ? upcoming[0] : null;
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    if (!dateRange.startDate || !dateRange.endDate) return tasks;
    const start = new Date(dateRange.startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(dateRange.endDate);
    end.setHours(23, 59, 59, 999);
    
    return tasks.filter(task => {
      const taskDate = new Date(task.createdAt || task.updatedAt);
      return taskDate >= start && taskDate <= end;
    });
  }, [tasks, dateRange]);

  const stats = useMemo(() => {
    const taskStats = { active: 0, inProgress: 0, pending: 0, completed: 0, notCompleted: 0 };
    const recentActivityLog = [];

    filteredTasks.forEach(task => {
      if (!['Completed', 'Not Completed', 'Pending Verification'].includes(task.status)) {
        taskStats.active++;
        if (task.status === 'In Progress') {
          taskStats.inProgress++;
        }
        if (task.status === 'Pending') {
          taskStats.pending++;
        }
      } else if (task.status === 'Completed') {
        taskStats.completed++;
      } else if (task.status === 'Not Completed') {
        taskStats.notCompleted++;
      }
      recentActivityLog.push(task);
    });

    const activeTaskList = filteredTasks.filter(t => !['Completed', 'Not Completed', 'Pending Verification'].includes(t.status)).sort((a, b) => safeDate(a.dueDate).getTime() - safeDate(b.dueDate).getTime()).slice(0, 5);
    const sortedRecentActivity = recentActivityLog.sort((a, b) => safeDate(b.updatedAt || b.createdAt).getTime() - safeDate(a.updatedAt || a.createdAt).getTime()).slice(0, 5);

    return { taskStats, activeTaskList, recentActivityLog: sortedRecentActivity, totalTasks: filteredTasks.length };
  }, [filteredTasks]);

  const formatDueDate = (dateObj) => {
    if (!dateObj) return 'N/A';
    const today = new Date();
    if (
      dateObj.getDate() === today.getDate() &&
      dateObj.getMonth() === today.getMonth() &&
      dateObj.getFullYear() === today.getFullYear()
    ) {
      return 'Today';
    }
    return dateObj.toLocaleDateString();
  };

  const { data: myReports = [] } = useGetAllMyReportsQuery(user?._id);

  // Dynamic Upcoming Deadlines
  const upcomingTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return filteredTasks
      .filter(t => t.dueDate && safeDate(t.dueDate) >= today && !['Completed', 'Not Completed'].includes(t.status))
      .sort((a, b) => safeDate(a.dueDate).getTime() - safeDate(b.dueDate).getTime())
      .slice(0, 3);
  }, [filteredTasks]);

  // Dynamic Productivity Trend (Last 7 Days)
  const productivityTrend = useMemo(() => {
    const data = [['Day', 'Tasks Completed']];
    if (!dateRange.startDate || !dateRange.endDate) return data;
    
    const start = new Date(dateRange.startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(dateRange.endDate);
    end.setHours(23, 59, 59, 999);
    
    const daysCount = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
    const maxDays = Math.min(daysCount, 31); 

    for (let i = maxDays - 1; i >= 0; i--) {
      const d = new Date(end);
      d.setDate(d.getDate() - i);
      const completedCount = tasks.filter(t => t.completionDate && isSameDay(safeDate(t.completionDate), d)).length;
      data.push([d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), completedCount]);
    }
    return data;
  }, [tasks, dateRange]);

  // Dynamic Personal Attendance Tracker
  const attendanceData = useMemo(() => {
    const days = [];
    if (!dateRange.startDate || !dateRange.endDate) return { days, presentCount: 0, totalDays: 0 };
    
    const start = new Date(dateRange.startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(dateRange.endDate);
    end.setHours(23, 59, 59, 999);

    const now = new Date();
    const evaluatedEnd = end > now ? now : end; 
    
    const daysCount = Math.max(0, Math.floor((evaluatedEnd - start) / (1000 * 60 * 60 * 24)) + 1);

    let presentCount = 0;
    
    for (let i = 0; i < daysCount; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      // 1. Filter tasks assigned exactly on this day
      const tasksOnDate = tasks.filter(task => {
        const taskDate = new Date(task.createdAt);
        taskDate.setHours(0, 0, 0, 0);
        return taskDate.getTime() === d.getTime();
      });

      // 2. Condition B: Default is Present if no tasks were assigned
      let isPresent = true;

      if (tasksOnDate.length > 0) {
        // Condition A: Absent if any assigned task is incomplete/unreported
        const hasMissingReports = tasksOnDate.some(t => !['Completed', 'Pending Verification', 'Not Completed'].includes(t.status) && (t.progress || 0) === 0);
        if (hasMissingReports) {
          isPresent = false; 
        }
      }

      // 3. Fallback: If they successfully submitted a report today
      const hasSubmittedReport = myReports.some(r => r.reportDate && r.status === 'Submitted' && isSameDay(safeDate(r.reportDate), d));
      if (hasSubmittedReport) {
        isPresent = true;
      }

      // 4. Manual Override by Admin
      if (user?.manualAttendanceStatus && user?.manualAttendanceDate === dateStr) {
        isPresent = user.manualAttendanceStatus === 'Present';
      }

      if (isPresent) presentCount++;
      
      days.push({
        label: d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
        isPresent,
        isFuture: false // Last 7 days are always past or present
      });
    }
    return { days, presentCount, totalDays: daysCount };
  }, [tasks, myReports, user, dateRange]);

  const totalPct = stats.totalTasks > 0;
  const pendingPct = totalPct ? ((stats.taskStats.pending / stats.totalTasks) * 100).toFixed(0) : 0;
  const completedPct = totalPct ? ((stats.taskStats.completed / stats.totalTasks) * 100).toFixed(0) : 0;
  const inProgressPct = totalPct ? (((stats.taskStats.inProgress || 0) / stats.totalTasks) * 100).toFixed(0) : 0;
  const performanceScore = totalPct ? Math.round((stats.taskStats.completed / stats.totalTasks) * 100) : 0;

  const donutData = [
    { name: 'Completed', value: stats.taskStats.completed || 0 },
    { name: 'In Progress', value: stats.taskStats.inProgress || 0 },
    { name: 'Pending', value: stats.taskStats.pending || 0 },
    { name: 'Not Completed', value: stats.taskStats.notCompleted || 0 },
  ].filter(d => d.value > 0);
  const DONUT_COLORS = { 'Completed': '#10b981', 'In Progress': '#3b82f6', 'Pending': '#f97316', 'Not Completed': '#ef4444', 'No Tasks': '#e2e8f0' };

  if (isLoading) return <div className="p-8 text-center">Loading dashboard...</div>;

  // --- Clean Executive Personal Dashboard ---
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-manrope text-slate-800 dark:text-slate-200 p-6 lg:p-8">
      <AnnouncementWidget />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white">Welcome back, {user?.name?.split(' ')[0] || 'Shivam'}! 👋</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Here's your work summary for the selected period.</p>
        </div>
        <div className="mt-4 md:mt-0 flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto">
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto md:mr-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full sm:w-auto bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 outline-none cursor-pointer shadow-sm"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="custom">Custom Range</option>
            </select>
            {filterType === 'custom' ? (
              <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 shadow-sm">
                <CalendarIcon className="h-4 w-4 text-slate-400" />
                <input type="date" value={dateRange.startDate} onChange={e => setDateRange(prev => ({...prev, startDate: e.target.value}))} className="w-full sm:w-auto bg-transparent border-none text-xs font-bold text-slate-600 dark:text-slate-300 outline-none cursor-pointer" />
                <span className="text-slate-400">-</span>
                <input type="date" value={dateRange.endDate} onChange={e => setDateRange(prev => ({...prev, endDate: e.target.value}))} className="w-full sm:w-auto bg-transparent border-none text-xs font-bold text-slate-600 dark:text-slate-300 outline-none cursor-pointer" />
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 w-full sm:w-auto bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 shadow-sm">
                <CalendarIcon className="h-4 w-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{dateRange.startDate ? new Date(dateRange.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''} - {dateRange.endDate ? new Date(dateRange.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}</span>
              </div>
            )}
          </div>
        <div className="text-right hidden sm:block mr-3 border-l border-slate-200 dark:border-slate-700 pl-4">
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold border border-indigo-200 dark:border-indigo-800">
                {user?.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'SK'}
                </div>
                <div className="text-left">
                <p className="text-sm font-bold text-slate-800 dark:text-white">{user?.name || 'Shivam Kumar'}</p>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Employee</p>
                </div>
            </div>
        </div>
           <button className="w-full sm:w-auto justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2.5 px-5 rounded-xl shadow-sm transition-all flex items-center gap-2">
             <ArrowDownTrayIcon className="h-5 w-5" />
             <span>Download Report</span>
           </button>
        </div>
      </div>

      {/* Individual Metrics Grid (5 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 lg:gap-6 mb-8">
        <StatCard title="Total Tasks" value={stats?.totalTasks || 0} subtext="Selected Period" icon={ClipboardDocumentListIcon} />
        <StatCard title="Pending Tasks" value={stats?.taskStats?.pending || 0} subtext={`${pendingPct}%`} isWarning icon={ClockIcon} />
        <StatCard title="Completed Tasks" value={stats?.taskStats?.completed || 0} subtext={`${completedPct}%`} isSuccess icon={CheckCircleIcon} />
        <StatCard title="In Progress" value={stats?.taskStats?.inProgress || 0} subtext={`${inProgressPct}%`} isInfo icon={ShieldCheckIcon} />
        <StatCard title="Attendance" value={`${Math.round((attendanceData?.presentCount / (attendanceData?.totalDays || 1)) * 100) || 0}%`} subtext="Selected Period" isDanger icon={CalendarDaysIcon} />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Personal Task Progress Donut */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 flex flex-col">
          <h3 className="text-base font-bold text-slate-800 dark:text-white mb-4">Personal Task Progress</h3>
          <div className="flex-1 flex flex-col sm:flex-row items-center gap-4 sm:gap-0">
            <div className="relative h-48 w-48 flex-shrink-0 mx-auto sm:mx-0">
              <GooglePieChart data={donutData?.length > 0 ? donutData : [{name:'No Tasks', value: 1}]} title="" colors={DONUT_COLORS} pieHole={0.65} is3D={false} hideLegend={true} />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-1">
                <p className="text-2xl font-black text-slate-800 dark:text-white leading-none">{stats?.totalTasks || 0}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Total</p>
              </div>
            </div>
            <div className="flex-1 flex flex-col justify-center gap-3 sm:pl-6 w-full">
              {donutData.map(d => {
                const pct = stats?.totalTasks > 0 ? Math.round((d.value / stats.totalTasks) * 100) : 0;
                return (
                  <div key={d.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ backgroundColor: DONUT_COLORS[d.name] }}></span><span className="font-semibold text-slate-600 dark:text-slate-300">{d.name}</span></div>
                    <span className="font-bold text-slate-800 dark:text-white">{d.value} - {pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* My Tasks Active List */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 flex flex-col">
          <div className="flex justify-between items-center mb-4"><h3 className="text-base font-bold text-slate-800 dark:text-white">My Tasks</h3><button onClick={() => onNavigate('my-tasks')} className="text-xs font-bold text-indigo-600 hover:underline">View All</button></div>
          <div className="space-y-3 overflow-y-auto flex-1 pr-2"> 
            {stats?.activeTaskList?.length > 0 ? (
              stats?.activeTaskList?.map((task, index) => (
                <div key={task._id} className="p-3 border border-slate-100 dark:border-slate-700/50 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <div className="flex justify-between items-center gap-3">
                    <div className="flex-1 min-w-0 pr-3">
                      <p className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate leading-tight">{task.title}</p>
                      <p className="text-[11px] text-slate-500 mt-1 truncate">{formatDueDate(new Date(task.dueDate))}</p>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full whitespace-nowrap flex-shrink-0 ${task.priority === 'High' ? 'bg-rose-100 text-rose-700' : task.priority === 'Medium' ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {task.priority || 'Medium'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-slate-500">
                <CheckCircleIcon className="h-12 w-12 mx-auto text-green-400" />
                <p className="mt-2 font-semibold">No pending or in-progress tasks!</p>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 flex flex-col">
          <h3 className="text-base font-bold text-slate-800 dark:text-white mb-4">Upcoming Deadlines</h3>
          <div className="space-y-4">
            {upcomingTasks?.map((task, i) => {
              const target = safeDate(task.dueDate);
              target.setHours(0,0,0,0);
              const todayD = new Date();
              todayD.setHours(0,0,0,0);
              const daysLeft = Math.round((target - todayD) / (1000 * 60 * 60 * 24));
              const isToday = daysLeft === 0;
              const isSoon = daysLeft > 0 && daysLeft <= 3;
              return (
                <div key={task._id} className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 border ${isToday ? 'bg-rose-50 text-rose-600 border-rose-100' : isSoon ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                    {new Date(task.dueDate).getDate()}
                  </div>
                  <div className="flex-1 min-w-0"><p className="text-sm font-bold text-slate-800 dark:text-white truncate">{task.title}</p><p className="text-[11px] text-slate-500 font-medium truncate">{new Date(task.dueDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p></div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded border whitespace-nowrap flex-shrink-0 ${isToday ? 'text-rose-600 bg-rose-50 border-rose-100' : isSoon ? 'text-orange-600 bg-orange-50 border-orange-100' : 'text-blue-600 bg-blue-50 border-blue-100'}`}>
                    {isToday ? 'Today' : `${daysLeft} days left`}
                  </span>
                </div>
              );
            })}
            {(!upcomingTasks || upcomingTasks.length === 0) && <p className="text-sm text-slate-500">No upcoming deadlines.</p>}
          </div>
        </div>
      </div>

      {/* 3-Column Lower Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Personal Attendance Tracker */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-bold text-slate-800 dark:text-white">Personal Attendance Tracker</h3>
            <button onClick={() => onNavigate('attendance')} className="text-xs font-bold text-indigo-600 hover:underline">View All</button>
          </div>
          <div className="flex justify-between items-center w-full px-2 mb-6 overflow-x-auto pb-2">
            {attendanceData?.days?.map((day, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2 flex-shrink-0 px-3 sm:px-1">
                <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center ${day.isPresent ? 'border-emerald-500 text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : day.isFuture ? 'border-slate-100 border-dashed dark:border-slate-800' : 'border-slate-200 text-slate-300 dark:border-slate-700 dark:bg-slate-800'}`}>
                  {day.isPresent && <CheckCircleIcon className="h-4 w-4" />}
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase whitespace-nowrap">{day.label}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 border-t border-slate-100 dark:border-slate-700 pt-4">
            <div className="text-center"><p className="text-sm font-black text-slate-800 dark:text-white">{attendanceData?.presentCount || 0}/{attendanceData?.totalDays || 0}</p><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Present</p></div>
            <div className="text-center border-x border-slate-100 dark:border-slate-700"><p className="text-sm font-black text-slate-800 dark:text-white">{(attendanceData?.presentCount || 0) * 8}h</p><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Hours</p></div>
            <div className="text-center"><p className="text-sm font-black text-emerald-500">0</p><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Leaves</p></div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-bold text-slate-800 dark:text-white">Recent Activity</h3>
            <button onClick={() => onNavigate('task-history')} className="text-xs font-bold text-indigo-600 hover:underline">View All</button>
          </div>
          <div className="relative border-l-2 border-slate-100 dark:border-slate-700 ml-3 space-y-5">
            {stats?.recentActivityLog?.slice(0, 3).map((activity, i) => (
              <div key={i} className="relative pl-6">
                <span className={`absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 border-white dark:border-slate-800 ${i % 2 === 0 ? 'bg-blue-500' : 'bg-emerald-500'}`}></span>
                <p className="text-sm font-bold text-slate-800 dark:text-white leading-tight truncate">Task Update: {activity.title}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">{safeDate(activity.updatedAt || activity.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
            {(!stats?.recentActivityLog || stats.recentActivityLog.length === 0) && <p className="text-sm text-slate-500">No recent activity.</p>}
          </div>
        </div>

        {/* My Performance */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 flex flex-col items-center justify-center text-center">
          <h3 className="text-base font-bold text-slate-800 dark:text-white mb-4 self-start">My Performance</h3>
          <div className="relative w-40 h-40 flex items-center justify-center mb-2 mx-auto">
            <svg className="w-full h-full transform -rotate-180" viewBox="0 0 100 100">
              <path d="M 10 50 A 40 40 0 0 1 90 50" fill="transparent" stroke="currentColor" strokeWidth="12" className="text-slate-100 dark:text-slate-700" strokeLinecap="round" />
              <path d="M 10 50 A 40 40 0 0 1 90 50" fill="transparent" stroke="url(#purpleGrad)" strokeWidth="12" strokeDasharray="125.6" strokeDashoffset={125.6 - (125.6 * performanceScore / 100)} strokeLinecap="round" />
              <defs>
                <linearGradient id="purpleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#4f46e5" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-4 pointer-events-none mt-1">
              <p className="text-2xl font-black text-slate-800 dark:text-white">{performanceScore}%</p>
            </div>
          </div>
          <p className={`text-[13px] font-bold ${performanceScore >= 80 ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30' : performanceScore >= 50 ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/30' : 'text-orange-600 bg-orange-50 dark:bg-orange-900/30'} px-3 py-1 rounded-full uppercase tracking-wider mb-2`}>
            {performanceScore >= 80 ? 'Excellent' : performanceScore >= 50 ? 'Good' : 'Needs Focus'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Keep up the great work!</p>
        </div>
      </div>

    </div>
  );
};

export const AnalyticsStatCard = ({ grade, count }) => {
  const GRADE_COLORS = { 'Avg. Completion': '#10B981', 'Total Tasks': '#3B82F6', 'In Progress': '#F59E0B', 'In Verification': '#8B5CF6', 'Not Completed': '#f97316', 'Completed': '#10B981', 'Moderate': '#3B82F6', 'Low': '#F59E0B', 'Pending': '#EF4444', 'Pending Verification': '#8B5CF6' };
  const GRADE_ICONS = { Completed: TrophyIcon, Moderate: ShieldCheckIcon, Low: StarIcon, Pending: ExclamationTriangleIcon };
  const Icon = GRADE_ICONS[grade] || InformationCircleIcon;
  return (
    <div className="bg-white dark:bg-slate-800/80 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 flex flex-col gap-4 hover:shadow-md hover:-translate-y-1 hover:border-slate-200 dark:hover:border-slate-600 transition-all duration-300 group">
      <div className="flex items-center gap-4">
        <div className="p-3.5 rounded-full shadow-sm group-hover:scale-110 transition-transform duration-300" style={{ backgroundColor: `${GRADE_COLORS[grade]}15`, color: GRADE_COLORS[grade] }}>
          <Icon className="h-7 w-7" />
        </div>
      </div>
      <div>
        <p className="text-4xl font-extrabold text-slate-800 dark:text-white tracking-tight">{count}</p>
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">{grade}</p>
      </div>
    </div>
  );
};

export const Analytics = ({ user }) => {
  const [view, setView] = useState('my_stats');
  const [selectedUserId, setSelectedUserId] = useState('');

  useEffect(() => {
    if (user) {
      if (user.role === 'Admin' || user.role === 'Super Admin') {
        setView('org_stats');
      } else if (user.canViewTeam) {
        setView('team_stats');
      } else {
        setView('my_stats');
      }
      setSelectedUserId('');
    }
  }, [user?.role, user?.canViewTeam]);

  const { data: allTasks = [], isLoading: isLoadingAllTasks } = useGetAllTasksQuery(undefined, { pollingInterval: 30000 });
  const { data: allEmployees = [], isLoading: isLoadingEmployees } = useGetEmployeesQuery();
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });

  const teamMemberIds = useMemo(() => {
    if (!allEmployees || !user?._id) return new Set();
    const subordinates = [];
    const getTeamLeadId = (emp) => emp.teamLead?._id ? String(emp.teamLead._id) : (emp.teamLead ? String(emp.teamLead) : null);
    const managerIdStr = String(user._id);
    const queue = allEmployees.filter(emp => getTeamLeadId(emp) === managerIdStr);
    const visited = new Set(queue.map(e => String(e._id)));
    while (queue.length > 0) {
      const currentEmployee = queue.shift();
      subordinates.push(currentEmployee);
      const directReports = allEmployees.filter(emp => getTeamLeadId(emp) === String(currentEmployee._id));
      for (const report of directReports) {
        if (!visited.has(String(report._id))) {
          visited.add(String(report._id));
          queue.push(report);
        }
      }
    }
    return new Set(subordinates.map(emp => String(emp._id)));
  }, [allEmployees, user]);

  const employeesForDropdown = useMemo(() => {
    if (!allEmployees) return [];
    if (user?.role === 'Admin' || user?.role === 'Super Admin') {
      return allEmployees.filter(emp => emp.dashboardAccess === 'Manager Dashboard' || emp.dashboardAccess === 'Employee Dashboard');
    } else if (user?.canViewTeam) {
      return allEmployees.filter(emp => teamMemberIds.has(String(emp._id)));
    }
    return [];
  }, [allEmployees, user, teamMemberIds]);

  const { performanceStats, title } = useMemo(() => {
    const stats = {
      totalTasks: 0,
      totalProgress: 0,
      averageCompletion: 0,
      tasksInVerification: 0,
      tasksInProgress: 0,
      pending: 0,
      inProgress: 0,
      pendingVerification: 0,
      completed: 0,
      notCompleted: 0,
    };
    let relevantTasks = [];
    let viewTitle = '';

    if (view === 'my_stats') {
      relevantTasks = allTasks.filter(task => {
        const id = task.assignedTo?._id || task.assignedTo;
        return id && String(id) === String(user?._id);
      });
      viewTitle = "My Performance Analytics";
    } else if (view === 'team_stats') {
      relevantTasks = allTasks.filter(task => {
        const id = task.assignedTo?._id || task.assignedTo;
        return id && teamMemberIds.has(String(id));
      });
      viewTitle = "Team Performance Analytics";
    } else if (view === 'org_stats') {
      relevantTasks = allTasks;
      viewTitle = "Organization Performance Analytics";
    } else if (view === 'user_stats' && selectedUserId) {
      relevantTasks = allTasks.filter(task => {
        const id = task.assignedTo?._id || task.assignedTo;
        return id && String(id) === String(selectedUserId);
      });
      const selectedUserObj = allEmployees.find(e => String(e._id) === String(selectedUserId));
      viewTitle = selectedUserObj ? `${selectedUserObj.name}'s Performance Analytics` : "User Performance Analytics";
    }

    let dateFilteredTasks = relevantTasks;

    if (dateRange.startDate && dateRange.endDate) {
      const start = new Date(dateRange.startDate);
      const end = new Date(dateRange.endDate);
      end.setHours(23, 59, 59, 999);
      dateFilteredTasks = relevantTasks.filter(task => {
        const assignedDate = new Date(task.createdAt);
        return assignedDate >= start && assignedDate <= end;
      });
    }

    const gradedTasks = dateFilteredTasks.filter(task => task.status === 'Completed' || task.status === 'Not Completed');
    stats.totalTasks = dateFilteredTasks.length;
    gradedTasks.forEach(task => {
      stats.totalProgress += task.progress || 0;
    });
    stats.averageCompletion = gradedTasks.length > 0 ? (stats.totalProgress / gradedTasks.length) : 0;
    stats.tasksInProgress = dateFilteredTasks.filter(t => t.status === 'In Progress').length;
    stats.tasksInVerification = dateFilteredTasks.filter(t => t.status === 'Pending Verification').length;

    dateFilteredTasks.forEach(task => {
      switch(task.status) {
        case 'Pending': stats.pending++; break;
        case 'In Progress': stats.inProgress++; break;
        case 'Pending Verification': stats.pendingVerification++; break;
        case 'Completed': stats.completed++; break;
        case 'Not Completed': stats.notCompleted++; break;
      }
    });

    return { performanceStats: stats, title: viewTitle };
  }, [allTasks, user, view, teamMemberIds, dateRange, selectedUserId, allEmployees]);

  const chartData = useMemo(() => {
    if (!performanceStats) return [];
    const { pending, inProgress, pendingVerification, completed, notCompleted } = performanceStats;
    return [
      { name: 'Pending', value: pending },
      { name: 'In Progress', value: inProgress },
      { name: 'Pending Verification', value: pendingVerification },
      { name: 'Completed', value: completed },
      { name: 'Not Completed', value: notCompleted },
    ].filter(item => item.value > 0);
  }, [performanceStats]);

  const GRADE_COLORS = {
    'Avg. Completion': '#10B981',
    'Total Tasks': '#3B82F6',
    'In Progress': '#F59E0B',
    'In Verification': '#8B5CF6',
    'Not Completed': '#f97316',
    'Completed': '#10B981', 'Moderate': '#3B82F6', 'Low': '#F59E0B', 'Pending': '#EF4444',
    'Pending Verification': '#8B5CF6',
  };
  const GRADE_ICONS = { Completed: TrophyIcon, Moderate: ShieldCheckIcon, Low: StarIcon, Pending: ExclamationTriangleIcon };

  if (isLoadingAllTasks || isLoadingEmployees) {
    return <div className="p-8 text-center">Loading analytics...</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full flex flex-col bg-slate-50/80 dark:bg-slate-900/50">
      <div className="flex flex-col xl:flex-row justify-between xl:items-center gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{title}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm sm:text-base">An overview of task completion and progress.</p>
        </div>
        <div className="flex flex-col xl:flex-row items-center gap-4 mt-4 xl:mt-0">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <div className="flex items-center p-1.5 bg-slate-100/80 dark:bg-slate-800/80 rounded-xl space-x-1 border border-slate-200/50 dark:border-slate-700/50">
                {(user?.role === 'Admin' || user?.role === 'Super Admin') && (
                  <button onClick={() => { setView('org_stats'); setSelectedUserId(''); }} className={`px-6 py-2 text-sm font-semibold rounded-lg transition-all duration-200 whitespace-nowrap ${view === 'org_stats' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'}`}>Org</button>
                )}
                {user?.canViewTeam && user?.role !== 'Admin' && user?.role !== 'Super Admin' && (
                  <button onClick={() => { setView('team_stats'); setSelectedUserId(''); }} className={`px-6 py-2 text-sm font-semibold rounded-lg transition-all duration-200 whitespace-nowrap ${view === 'team_stats' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'}`}>Team</button>
                )}
                {user?.role !== 'Admin' && user?.role !== 'Super Admin' && (
                  <button onClick={() => { setView('my_stats'); setSelectedUserId(''); }} className={`px-6 py-2 text-sm font-semibold rounded-lg transition-all duration-200 whitespace-nowrap ${view === 'my_stats' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'}`}>My Stats</button>
                )}
            </div>
            
            {(user?.role === 'Admin' || user?.role === 'Super Admin' || user?.canViewTeam) && employeesForDropdown.length > 0 && (
              <select
                value={selectedUserId}
                onChange={(e) => {
                  setSelectedUserId(e.target.value);
                  if (e.target.value) {
                    setView('user_stats');
                  } else {
                    setView(user?.role === 'Admin' || user?.role === 'Super Admin' ? 'org_stats' : 'team_stats');
                  }
                }}
                className="w-full sm:w-auto px-4 py-2.5 text-sm font-semibold border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all outline-none shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer appearance-none"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundPosition: `right 0.5rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em`, paddingRight: `2.5rem` }}
              >
                <option value="">-- All Users --</option>
                {employeesForDropdown.map(emp => (
                  <option key={emp._id} value={emp._id}>{emp.name}</option>
                ))}
              </select>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <CalendarIcon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="date" 
                value={dateRange.startDate}
                onChange={e => setDateRange(prev => ({...prev, startDate: e.target.value}))}
                className="w-full pl-10 pr-4 py-2.5 text-sm font-medium border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white dark:bg-slate-800 dark:text-white transition-all outline-none shadow-sm"
              />
            </div>
            <span className="text-slate-400 font-medium text-sm">to</span>
            <div className="relative">
              <CalendarIcon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="date" 
                value={dateRange.endDate}
                onChange={e => setDateRange(prev => ({...prev, endDate: e.target.value}))}
                className="w-full pl-10 pr-4 py-2.5 text-sm font-medium border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white dark:bg-slate-800 dark:text-white transition-all outline-none shadow-sm"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <AnalyticsStatCard grade="Avg. Completion" count={`${performanceStats.averageCompletion.toFixed(1)}%`} />
        <AnalyticsStatCard grade="Total Tasks" count={performanceStats.totalTasks} />
        <AnalyticsStatCard grade="In Progress" count={performanceStats.tasksInProgress} />
        <AnalyticsStatCard grade="In Verification" count={performanceStats.tasksInVerification} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-8 flex flex-col">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6 tracking-tight">Active Task Status</h3>
          {chartData.length > 0 ? (
            <div className="flex-1 flex flex-col sm:flex-row items-center gap-8 lg:gap-12">
              <div className="relative h-64 w-64 flex-shrink-0 mx-auto sm:mx-0">
                <GooglePieChart data={chartData} title="" colors={GRADE_COLORS} pieHole={0.65} is3D={false} hideLegend={true} />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-1">
                  <p className="text-4xl font-black text-slate-800 dark:text-white leading-none">{performanceStats.totalTasks}</p>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-1">Tasks Total</p>
                </div>
              </div>
              <div className="flex-1 flex flex-col justify-center gap-4 w-full">
                {chartData.map(d => {
                  const pct = performanceStats.totalTasks > 0 ? ((d.value / performanceStats.totalTasks) * 100).toFixed(1) : 0;
                  return (
                    <div key={d.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3">
                        <span className="h-4 w-4 rounded-full shadow-sm" style={{ backgroundColor: GRADE_COLORS[d.name] }}></span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{d.name}</span>
                      </div>
                      <span className="font-bold text-slate-800 dark:text-white">{d.value} <span className="text-slate-400 font-medium ml-1">({pct}%)</span></span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400">No graded tasks to display for this view.</div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-8 flex flex-col">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6 tracking-tight">Metric Definitions</h3>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
               <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex-shrink-0 mt-1">
                  <ChartBarIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
               </div>
               <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200">Avg. Completion</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mt-1">Average final progress of all graded tasks in the selected date range.</p>
               </div>
            </div>
            <div className="flex items-start gap-4">
               <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex-shrink-0 mt-1">
                  <ClipboardDocumentListIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
               </div>
               <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200">Total Tasks</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mt-1">All tasks assigned within the selected date range, regardless of their current status.</p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const MyTasks = () => {
  const { data: myTasks = [], isLoading } = useGetMyTasksQuery(undefined, { pollingInterval: 30000 });
  const [viewingTask, setViewingTask] = useState(null);
  const [viewingTaskNumber, setViewingTaskNumber] = useState(null);
  const [activeTab, setActiveTab] = useState('Active');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

  useEffect(() => {
    // Set default date range to the current week
    const today = new Date();
    const firstDay = new Date(today.setDate(today.getDate() - today.getDay()));
    const lastDay = new Date(firstDay);
    lastDay.setDate(lastDay.getDate() + 6);

    setDateRange({
      startDate: firstDay.toISOString().split('T')[0],
      endDate: lastDay.toISOString().split('T')[0],
    });
  }, []);

  const { stats, tasksToShow } = useMemo(() => {
    let dateFilteredTasks = myTasks;
    if (dateRange.startDate && dateRange.endDate) {
      const start = new Date(dateRange.startDate);
      const end = new Date(dateRange.endDate);
      end.setHours(23, 59, 59, 999); // Include the whole end day

      dateFilteredTasks = myTasks.filter(task => {
        const assignedDate = new Date(task.createdAt);
        return assignedDate >= start && assignedDate <= end;
      });
    }

    // Use UTC dates for reliable, timezone-agnostic comparison to prevent bugs
    const now = new Date();
    const todayUTCStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    // A task is overdue only if its due date has passed, its progress is less than 100%,
    // AND it is still an active task (not Completed, Not Completed, or Pending Verification).
    const overdue = dateFilteredTasks.filter(t => t.progress < 100 && ['Pending', 'In Progress'].includes(t.status) && t.dueDate && new Date(t.dueDate) < todayUTCStart);
    // Active tasks are those not yet graded and not in the overdue list.
    const activeAndNotOverdue = dateFilteredTasks.filter(t => !['Completed', 'Not Completed', 'Pending Verification'].includes(t.status) && !overdue.some(ot => ot._id === t._id));
    const completed = dateFilteredTasks.filter(t => ['Completed', 'Not Completed'].includes(t.status));
    
    const stats = {
      active: activeAndNotOverdue.length,
      overdue: overdue.length,
      completed: completed.length,
    };

    let tasks = [];
    if (activeTab === 'Active') {
      tasks = activeAndNotOverdue;
    } else if (activeTab === 'Completed') {
      tasks = completed; 
    } else { // 'All' tab
      tasks = dateFilteredTasks;
    }

    return { stats, tasksToShow: tasks };
  }, [myTasks, activeTab, dateRange]);

  if (isLoading) {
    return <div className="p-8 text-center">Loading tasks...</div>;
  }

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 border border-slate-100 dark:border-slate-700 flex items-center gap-5 transition-all duration-300 group">
      <div className={`p-4 rounded-full bg-gradient-to-br ${color.bg} ${color.text} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
        <Icon className="h-7 w-7" />
      </div>
      <div>
        <p className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">{value}</p>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">{title}</p>
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full flex flex-col bg-slate-50/80 dark:bg-slate-900/50">
      <div className="mb-8 text-center sm:text-left">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">My Tasks</h1>
        <p className="text-slate-500 mt-2 text-sm sm:text-base">Stay on top of your assigned tasks and deadlines.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <StatCard title="Active Tasks" value={stats.active} icon={ClipboardDocumentListIcon} color={{ bg: 'from-indigo-50 to-blue-100 dark:from-indigo-900/40 dark:to-blue-900/20', text: 'text-indigo-600 dark:text-indigo-400' }} />
        <StatCard title="Overdue Tasks" value={stats.overdue} icon={ExclamationTriangleIcon} color={{ bg: 'from-rose-50 to-red-100 dark:from-rose-900/40 dark:to-red-900/20', text: 'text-rose-600 dark:text-rose-400' }} />
        <StatCard title="Completed Tasks" value={stats.completed} icon={CheckCircleIcon} color={{ bg: 'from-emerald-50 to-green-100 dark:from-emerald-900/40 dark:to-green-900/20', text: 'text-emerald-600 dark:text-emerald-400' }} />
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex-1 flex flex-col overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-700/50 flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex items-center p-1.5 bg-slate-100/80 dark:bg-slate-800/80 rounded-xl space-x-1 w-full lg:w-auto overflow-x-auto no-scrollbar border border-slate-200/50 dark:border-slate-700/50">
            {['All', 'Active', 'Completed'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-2 text-sm font-semibold rounded-lg transition-all duration-200 whitespace-nowrap ${activeTab === tab ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'}`}>
                {tab}
              </button>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <div className="relative w-full sm:w-auto flex-1 lg:flex-none">
              <CalendarIcon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="date" 
                value={dateRange.startDate}
                onChange={e => setDateRange(prev => ({...prev, startDate: e.target.value}))}
                className="w-full sm:w-auto pl-10 pr-4 py-2.5 text-sm font-medium border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white dark:bg-slate-800 dark:text-white transition-all outline-none shadow-sm"
              />
            </div>
            <span className="text-slate-400 font-medium text-sm">to</span>
            <div className="relative w-full sm:w-auto flex-1 lg:flex-none">
              <CalendarIcon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="date" 
                value={dateRange.endDate}
                onChange={e => setDateRange(prev => ({...prev, endDate: e.target.value}))}
                className="w-full sm:w-auto pl-10 pr-4 py-2.5 text-sm font-medium border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white dark:bg-slate-800 dark:text-white transition-all outline-none shadow-sm"
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-900/30">
          {tasksToShow.length > 0 ? (
            <ul className="space-y-4">
              {tasksToShow.map((task, index) => {
                const priorityStyles = { High: 'bg-rose-500', Medium: 'bg-amber-500', Low: 'bg-emerald-500' };
                const statusStyles = { 
                  Pending: 'bg-slate-100 text-slate-700 dark:bg-slate-700/50 dark:text-slate-300', 
                  'In Progress': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400', 
                  Completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400', 
                  'Pending Verification': 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400', 
                  'Not Completed': 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400' 
                };

                const now = new Date();
                const todayUTCStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
                const isOverdue = !['Completed', 'Not Completed', 'Pending Verification'].includes(task.status) && task.dueDate && new Date(task.dueDate) < todayUTCStart;
                return (
                  <li key={task._id} className="bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60 rounded-2xl p-5 hover:shadow-md hover:border-slate-200 dark:hover:border-slate-600 transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-6 group relative overflow-hidden">
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${priorityStyles[task.priority] || 'bg-slate-300'}`}></div>
                    <div className="flex-1 min-w-0 pl-2">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`flex-shrink-0 h-3 w-3 rounded-full shadow-sm ${priorityStyles[task.priority]}`} title={`${task.priority} Priority`}></span>
                        <h3 className="text-base font-semibold text-slate-800 dark:text-white truncate tracking-tight">{task.title}</h3>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 pl-6">
                        <div className={`flex items-center gap-1.5 text-sm font-medium ${isOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}`}>
                          <CalendarIcon className="h-4 w-4" />
                          <span>Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'} {isOverdue && '(Overdue)'}</span>
                        </div>
                        {['Completed', 'Not Completed'].includes(task.status) && (
                          <div className="flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400">
                            <CheckCircleIcon className="h-4 w-4" />
                            <span>
                              {task.status === 'Not Completed' ? <span className="text-orange-600 dark:text-orange-400">Incomplete</span> : `Completed: ${task.completionDate ? new Date(task.completionDate).toLocaleDateString() : 'N/A'}`}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:gap-8 w-full md:w-auto">
                      <div className="w-full sm:w-48 flex items-center gap-3">
                        <div className="flex-1 bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden shadow-inner">
                          <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all duration-500" style={{ width: `${task.progress}%` }}></div>
                        </div>
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300 w-10 text-right">{task.progress}%</span>
                      </div>
                      
                      <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap shadow-sm ${statusStyles[task.status]}`}>{task.status}</span>
                        <button onClick={() => { setViewingTask(task); setViewingTaskNumber(index + 1); }} className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1.5 transition-colors group-hover:underline bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1.5 rounded-lg">
                          Details <ChevronRightIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="text-center py-16 text-slate-500">
              <ClipboardDocumentListIcon className="h-12 w-12 mx-auto text-slate-400" />
              <p className="mt-2 font-semibold">No {activeTab.toLowerCase()} tasks.</p>
            </div>
          )}
        </div>
      </div>
      <TaskDetailsModal
        isOpen={!!viewingTask}
        onClose={() => setViewingTask(null)}
        task={viewingTask}
        taskNumber={viewingTaskNumber}
      />
    </div>
  );
};

export const MyReportHistory = ({ employeeId }) => {
  const { data: reports = [], isLoading } = useGetAllMyReportsQuery(employeeId);
  const [expandedReportId, setExpandedReportId] = useState(null);
  const [viewingTask, setViewingTask] = useState(null);
  const [viewingTaskNumber, setViewingTaskNumber] = useState(null);

  useEffect(() => {
    if (reports.length > 0 && !expandedReportId) {
      setExpandedReportId(reports[0]._id);
    }
  }, [reports, expandedReportId]);

  const renderReportContent = (content) => {
    try {
      const data = JSON.parse(content);
      if (data.taskUpdates) {
        return (
          <div className="space-y-3 p-6 bg-slate-50 dark:bg-slate-900/50">
            {data.reportNote && (
              <div className="mb-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm">
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Report Notes</h4>
                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{data.reportNote}</p>
              </div>
            )}
            {data.taskUpdates.map((update, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="flex justify-between items-start">
                  <p className="font-semibold text-slate-800">{update.taskId?.title || 'Unknown Task'}</p>
                  <button onClick={() => { setViewingTask(update.taskId); setViewingTaskNumber(i + 1); }} className="text-xs font-semibold text-blue-600 hover:underline">Details</button>
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${update.completion}%` }}></div>
                  </div>
                  <span className="text-sm font-bold text-blue-600 w-12 text-right tabular-nums">{update.completion}%</span>
                </div>
                {update.note && (
                  <div className="mt-4 bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                    <p className="text-sm text-slate-600 dark:text-slate-300"><span className="font-semibold text-slate-700 dark:text-slate-200">Note:</span> {update.note}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      }
      return <p className="whitespace-pre-wrap text-sm text-slate-600">{JSON.stringify(data, null, 2)}</p>;
    } catch (e) {
      return <p className="whitespace-pre-wrap text-sm text-slate-600">{content}</p>;
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading report history...</div>;
  }

  return ( 
    <div className="p-4 sm:p-6 lg:p-8 h-full flex flex-col bg-slate-50/50 font-manrope">
      <div className="mb-6 sm:mb-8 text-center">
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">My Report History</h1>
        <p className="text-slate-500 mt-2">Review your previously submitted daily progress reports.</p>
      </div>
      <div className="space-y-4">
        {reports.length > 0 ? (
          reports.map(report => (
            <div key={report._id} className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden transition-all duration-300">
              <button onClick={() => setExpandedReportId(expandedReportId === report._id ? null : report._id)} className="w-full text-left p-5 flex justify-between items-center hover:bg-slate-50/50">
                <span className="font-bold text-slate-800">{new Date(report.reportDate).toLocaleDateString('en-US', { dateStyle: 'full' })}</span>
                <div className="flex items-center gap-4">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${report.status === 'Submitted' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{report.status}</span>
                  <ChevronDownIcon className={`h-5 w-5 text-slate-500 transition-transform ${expandedReportId === report._id ? 'rotate-180' : ''}`} />
                </div>
              </button>
              {expandedReportId === report._id && renderReportContent(report.content)}
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 bg-white rounded-2xl border-2 border-dashed p-16">
            <ArchiveBoxIcon className="h-16 w-16 text-slate-400 mb-4" />
            <p className="font-semibold">No Report History Found</p>
            <p className="text-sm">You have not submitted any reports yet.</p>
          </div>
        )}
      </div>
      <TaskDetailsModal isOpen={!!viewingTask} onClose={() => setViewingTask(null)} task={viewingTask} taskNumber={viewingTaskNumber} />
    </div>
  );
};

export const TeamInformation = ({ seniorId }) => {
  const { data: allEmployees, isLoading: isLoadingEmployees } = useGetEmployeesQuery();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const teamMembers = useMemo(() => {
    if (!allEmployees || !seniorId) return [];

    const getAllSubordinates = (managerId, employees) => {
      const subordinates = [];
      const getTeamLeadId = (emp) => emp.teamLead?._id ? String(emp.teamLead._id) : (emp.teamLead ? String(emp.teamLead) : null);
      const managerIdStr = String(managerId);
      const queue = employees.filter(emp => getTeamLeadId(emp) === managerIdStr);
      const visited = new Set(queue.map(e => String(e._id)));

      while (queue.length > 0) {
        const currentEmployee = queue.shift();
        subordinates.push(currentEmployee);

        const directReports = employees.filter(emp => getTeamLeadId(emp) === String(currentEmployee._id));
        for (const report of directReports) {
          if (!visited.has(String(report._id))) {
            visited.add(String(report._id));
            queue.push(report);
          }
        }
      }
      return subordinates;
    };

    return getAllSubordinates(seniorId, allEmployees);
  }, [allEmployees, seniorId]);

  useEffect(() => {
    if (teamMembers.length > 0 && !selectedEmployee) {
      setSelectedEmployee(teamMembers[0]);
    } else if (teamMembers.length === 0) {
      setSelectedEmployee(null);
    }
  }, [teamMembers, selectedEmployee]);

  const filteredTeamMembers = useMemo(() => {
    if (!searchTerm) return teamMembers;
    return teamMembers.filter(emp =>
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [teamMembers, searchTerm]);

  if (isLoadingEmployees) {
    return <div className="p-8 text-center">Loading team information...</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full flex flex-col bg-slate-50/50 font-manrope">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Team Information</h1>
        <p className="text-slate-500 mt-2">View details and attendance for your team members.</p>
      </div>
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-4 gap-6 md:gap-8">
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 shadow-lg flex flex-col">
          <div className="p-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800">Team Members ({teamMembers.length})</h2>
            <input type="text" placeholder="Search team..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="mt-3 w-full text-sm border-slate-300 rounded-lg p-2 focus:ring-blue-500" />
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {filteredTeamMembers.map(employee => (
              <button key={employee._id} onClick={() => setSelectedEmployee(employee)} className={`w-full text-left p-3 my-1 rounded-lg transition-all flex items-center gap-3 ${selectedEmployee?._id === employee._id ? 'bg-blue-100' : 'hover:bg-slate-100'}`}>
                <img src={employee.profilePicture || `https://ui-avatars.com/api/?name=${employee.name}&background=random`} alt={employee.name} className="h-10 w-10 rounded-full object-cover" />
                <div>
                  <p className={`font-semibold ${selectedEmployee?._id === employee._id ? 'text-blue-800' : 'text-slate-800'}`}>{employee.name}</p>
                  <p className="text-xs text-slate-500">{employee.role}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
        <div className="xl:col-span-3">
          {selectedEmployee ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6">
              <div className="flex items-center gap-4 mb-6 pb-6 border-b">
                <img src={selectedEmployee.profilePicture || `https://ui-avatars.com/api/?name=${selectedEmployee.name}&background=random`} alt={selectedEmployee.name} className="h-20 w-20 rounded-full object-cover" />
                <div>
                  <h3 className="text-2xl font-bold text-slate-800">{selectedEmployee.name}</h3>
                  <p className="text-slate-500">{selectedEmployee.role} &middot; {selectedEmployee.department}</p>
                  <p className="text-sm text-slate-400 font-mono">{selectedEmployee.employeeId}</p>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Attendance Calendar</h3>
              <AttendanceCalendar employeeId={selectedEmployee._id} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 bg-white rounded-2xl border-2 border-dashed p-8">
              <UserGroupIcon className="h-16 w-16 text-slate-400 mb-4" />
              <p className="font-semibold">No Team Members Found</p>
              <p className="text-sm">You do not have any team members assigned to you.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const MyDailyReport = ({ employeeId }) => {
  const { data: assignedTasks = [], isLoading: isLoadingTasks } = useGetMyTasksQuery(undefined, { refetchOnMountOrArgChange: true });
  const { data: todaysReport, isLoading: isLoadingReport } = useGetTodaysReportQuery(employeeId);
  const [updateTodaysReport, { isLoading: isUpdating }] = useUpdateTodaysReportMutation();
  const [progress, setProgress] = useState({});
  const [taskNotes, setTaskNotes] = useState({});
  const [reportNote, setReportNote] = useState('');
  
  const isReadOnly = useMemo(() => {
    const now = new Date();
    const isPastCutoff = now.getHours() >= 19; // 7:00 PM
    const isSubmitted = todaysReport?.status === 'Submitted';
    return isPastCutoff || isSubmitted;
  }, [todaysReport]);

  const isTaskReadOnly = (task) => {
    // A task is read-only if the main report is read-only.
    // We allow editing rejected tasks (which are In Progress) so the employee can correct them.
    return isReadOnly;
  };

  useEffect(() => {
    // Initialize or update progress state when tasks or the report status changes
    const initialProgress = {};
    const initialNotes = {};
    if (todaysReport?.status === 'Submitted') {
      // If already submitted, try to parse and show the submitted values
      try {
        const content = JSON.parse(todaysReport.content);
        if (content.taskUpdates) {
          content.taskUpdates.forEach(update => {
            initialProgress[update.taskId] = update.completion;
            initialNotes[update.taskId] = update.note || '';
          });
        }
        if (content.reportNote) {
          setReportNote(content.reportNote);
        }
      } catch (e) { /* ignore parsing errors */ }
    } else {
      // If not submitted or reopened, initialize from the task's last known progress
      assignedTasks.forEach(task => {
        initialProgress[task._id] = task.progress || 0;
        initialNotes[task._id] = '';
      });
    } 
    setProgress(initialProgress);
    setTaskNotes(initialNotes);
  }, [assignedTasks, todaysReport]);

  const handleProgressChange = (taskId, value) => {
    setProgress(prev => ({ ...prev, [taskId]: parseInt(value, 10) || 0 }));
  };

  const handleSubmit = async () => {
    const taskUpdates = Object.entries(progress)
      .map(([taskId, completion]) => ({ taskId, completion, note: taskNotes[taskId] || '' }));

    if (taskUpdates.length === 0 && !reportNote.trim()) {
      // If there are no tasks to report on, still allow submitting an empty report for attendance.
      toast.info('Submitting attendance for today.', { icon: '👍' });
    }

    try {
      await updateTodaysReport({
        employeeId: employeeId,
        content: JSON.stringify({ taskUpdates, reportNote: reportNote.trim() }),
        status: 'Submitted',
      }).unwrap();
      toast.success('Progress submitted successfully!');
    } catch (err) {
      toast.error(err.data?.message || "Error in submitting today's report");
    }
  };

  const tasksToDisplay = useMemo(() => {
    const now = new Date();
    // Use UTC for consistent date comparison with the server.
    const todayUTCStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    return assignedTasks.filter(task => {
      const dueDate = task.dueDate ? new Date(task.dueDate) : null;
      const isNotFinalized = !['Completed', 'Not Completed', 'Pending Verification'].includes(task.status);
      const isNotPastDue = !dueDate || dueDate >= todayUTCStart;
      return isNotFinalized && isNotPastDue;
    });
  }, [assignedTasks]);

  if (isLoadingTasks || isLoadingReport) {
    return <div className="text-center p-10">Loading Report...</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full overflow-y-auto bg-slate-50/50 dark:bg-slate-900">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-200 tracking-tight">Today's Progress Report</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Update the completion status for your active tasks.</p>
        </div>
        {!isReadOnly && tasksToDisplay.length > 0 && (
          <button onClick={handleSubmit} disabled={isUpdating} className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-xl text-sm disabled:bg-blue-400 transition-colors shadow-lg shadow-blue-500/30 dark:shadow-blue-800/50">
            {isUpdating ? <ArrowPathIcon className="animate-spin h-5 w-5 mr-2" /> : <PaperAirplaneIcon className="h-5 w-5 mr-2" />}
            Submit Progress
          </button>
        )}
      </div>

      {isReadOnly && (
        <div className="bg-gradient-to-r from-amber-100 to-yellow-100 border-l-4 border-amber-500 text-amber-800 p-4 mb-6 rounded-r-lg shadow-sm dark:bg-amber-500/10 dark:text-amber-300" role="alert">
          <p className="font-bold">Reporting Closed for Today</p>
          <p className="text-sm">You can submit progress once daily before 7:00 PM. Today's report may have already been submitted or the deadline has passed.</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {tasksToDisplay.map((task, index) => ( 
          <div key={task._id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex flex-col transition-all hover:shadow-md">
            
            {/* 1. Task Name & Percentage */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 tracking-tight truncate pr-4">
                {task.title}
              </h3>
              <span className={`font-extrabold text-xl tabular-nums flex-shrink-0 ${isReadOnly ? 'text-slate-500' : 'text-indigo-600 dark:text-indigo-400'}`}>
                {progress[task._id] || 0}%
              </span>
            </div>

            {/* 2. Progress Bar */}
            <div className="relative w-full h-6 flex items-center mb-4 group">
              <div className="absolute h-2.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full transition-all duration-300"
                  style={{ width: `${progress[task._id] || 0}%` }}
                ></div>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={progress[task._id] ?? 0}
                onChange={(e) => handleProgressChange(task._id, e.target.value)}
                disabled={isTaskReadOnly(task)}
                className="absolute z-10 w-full h-6 bg-transparent appearance-none cursor-pointer disabled:cursor-not-allowed slider-thumb opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </div>

            {/* 3. Description Field */}
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700/50">
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
                {task.description || "No specific details provided for this task."}
              </p>
            </div>

            {/* 4. Task Update Note */}
            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 ml-1">Task Update Note (Optional)</label>
              <input
                type="text"
                placeholder="E.g., Finished the first draft, waiting on review..."
                value={taskNotes[task._id] || ''}
                onChange={(e) => setTaskNotes(prev => ({ ...prev, [task._id]: e.target.value }))}
                disabled={isTaskReadOnly(task)}
                className="w-full text-sm border border-slate-200 dark:border-slate-700 dark:bg-slate-900/50 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:bg-slate-50"
              />
            </div>
          </div>
        ))}
        {tasksToDisplay.length === 0 && (
          <div className="text-center py-16 text-slate-500 bg-white dark:bg-slate-800 rounded-xl border border-dashed dark:border-slate-700">
            <CheckCircleIcon className="h-12 w-12 mx-auto text-green-400" />
            <p className="mt-4 font-semibold text-lg">All tasks are completed!</p>
            <p className="text-sm">No pending tasks to report on.</p>
          </div>
        )}
        
        {(!isReadOnly || reportNote) && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex flex-col transition-all">
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 tracking-tight mb-3">
              Additional Notes / Comments
            </h3>
            <textarea
              value={reportNote}
              onChange={(e) => setReportNote(e.target.value)}
              disabled={isReadOnly}
              placeholder="Add any notes, blockers, or comments regarding today's progress for your manager..."
              className="w-full text-sm border border-slate-200 dark:border-slate-700 dark:bg-slate-900/50 dark:text-white rounded-xl p-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none min-h-[120px] disabled:opacity-70 disabled:cursor-not-allowed disabled:bg-slate-50"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export const MyAttendance = ({ employeeId }) => {
  const { data: holidays = [], isLoading: isLoadingHolidays } = useGetHolidaysQuery(); 

  const legendItems = [
    { label: 'Present', color: 'bg-emerald-500' },
    { label: 'Absent', color: 'bg-red-500' },
    { label: 'Holiday', color: 'bg-amber-500' },
    { label: 'Leave', color: 'bg-sky-500' },
    { label: 'Future', color: 'bg-slate-200' },
  ];

  const upcomingHolidays = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return holidays
      .filter(h => new Date(h.date) >= today)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [holidays]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full flex flex-col bg-slate-50/50"> 
      <div className="mb-6 sm:mb-8 text-center">
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">My Attendance</h1>
        <p className="text-slate-500 mt-2">Review your monthly attendance record.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-lg p-6">
          <AttendanceCalendar employeeId={employeeId} />
        </div>
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Legend</h3>
            <div className="space-y-3">
              {legendItems.map(item => (
                <div key={item.label} className="flex items-center gap-3">
                  <span className={`h-4 w-4 rounded-full ${item.color}`}></span>
                  <span className="text-sm font-medium text-slate-600">{item.label}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-6 italic">Click on a date to apply for leave. Sundays are default holidays.</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Upcoming Holidays</h3>
            <div className="space-y-3">
              {isLoadingHolidays ? <p className="text-sm text-slate-400">Loading...</p> : upcomingHolidays.length > 0 ? upcomingHolidays.slice(0, 5).map(holiday => (
                <div key={holiday._id} className="p-3 rounded-lg bg-amber-50">
                  <p className="font-semibold text-sm text-amber-800">{holiday.name}</p>
                  <p className="text-xs text-amber-600">{new Date(holiday.date).toLocaleDateString('en-US', { dateStyle: 'long', timeZone: 'UTC' })}</p>
                </div>
              )) : (
                <p className="text-sm text-slate-400">No upcoming holidays found.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const EmployeeProfile = ({ user }) => {
  const dispatch = useDispatch();
  const [isEditMode, setIsEditMode] = useState(false);
  const [updateProfile, { isLoading: isUpdating }] = useUpdateEmployeeMutation();
  const token = useSelector(state => state.auth.token);
  const { data: eomHistory = [] } = useGetEmployeeEOMHistoryQuery(user._id, {
    skip: !user,
  });
  const monthNames = useMemo(() => ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"], []);

  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    profilePicture: null,
    address: user.address || '',
    gender: user.gender || '',
    country: user.country || '',
    city: user.city || '',
    qualification: user.qualification || '',
  });

  // When edit mode is toggled, reset the form data to the current user prop
  useEffect(() => {
    if (user && isEditMode) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        profilePicture: null, // Don't try to pre-fill file input
        address: user.address || '',
        gender: user.gender || '',
        country: user.country || '',
        city: user.city || '',
        qualification: user.qualification || '',
      });
    }
  }, [user, isEditMode]);

  const handleChange = (e) => {
    if (e.target.type === 'file') {
      setFormData({ ...formData, profilePicture: e.target.files[0] });
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const handleSave = async () => {
    // Validate required fields
    if (!formData.name || !formData.name.trim()) {
      toast.error('Name is required.');
      return;
    }
    if (!formData.email || !formData.email.trim()) {
      toast.error('Email is required.');
      return;
    }

    const profileData = new FormData();
    profileData.append('name', formData.name.trim());
    profileData.append('email', formData.email.trim());
    
    if (formData.profilePicture) {
      profileData.append('profilePicture', formData.profilePicture);
    }
    
    // Only append optional fields if they have values
    if (formData.address) profileData.append('address', formData.address.trim());
    if (formData.gender) profileData.append('gender', formData.gender);
    if (formData.country) profileData.append('country', formData.country.trim());
    if (formData.city) profileData.append('city', formData.city.trim());
    if (formData.qualification) profileData.append('qualification', formData.qualification.trim());

    try {
      const toastId = toast.loading('Updating profile...');
      const updatedData = await updateProfile({ id: user._id, formData: profileData }).unwrap();
      toast.success('Profile updated successfully!', { id: toastId, icon: <CheckCircleIcon className="h-6 w-6 text-green-500" /> });
      if (updatedData.employee) {
        dispatch(setCredentials({ user: updatedData.employee, token }));
      }
      setIsEditMode(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
      const errorMessage = err.data?.message || err.message || 'Failed to update profile. Please try again.';
      toast.error(errorMessage);
    }
  };

  const InfoField = ({ label, value }) => (
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-md font-semibold text-gray-800">{value || 'N/A'}</p>
    </div>
  );

  const EditField = ({ label, name, value, onChange, type = 'text' }) => (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        type={type}
        name={name}
        id={name}
        value={value}
        onChange={onChange}
        className="mt-1 w-full text-sm border border-gray-300 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
  );

  return (
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xl p-4 sm:p-8">
      <div className="flex justify-between items-start mb-8 pb-8 border-b border-gray-200 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-8">
        <img
          src={user.profilePicture || `https://ui-avatars.com/api/?name=${user.name}&background=random`}
          alt="Profile"
          className="h-32 w-32 rounded-full object-cover border-4 border-blue-200 shadow-lg"
        />
        <div>
          <h2 className="text-3xl font-bold text-blue-800 dark:text-slate-200">{user.name}</h2>
          <p className="text-gray-600 dark:text-slate-400">{user.role}</p>
          <p className="text-sm text-gray-500 dark:text-slate-500 font-mono mt-1">{user.employeeId}</p>
        </div>
      </div>
        {user.canEditProfile && (
          <button onClick={() => setIsEditMode(!isEditMode)} className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors">
            {isEditMode ? 'Cancel' : 'Edit Profile'}
          </button>
        )}
      </div>

      {eomHistory.length > 0 && !isEditMode && (
        <div className="mb-8">
          <h4 className="text-md font-semibold text-slate-700 dark:text-slate-300 mb-3">Hall of Fame</h4>
          <div className="flex flex-wrap gap-2">
            {eomHistory.map((win) => (
              <div key={win._id} className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M8 1.75a.75.75 0 0 1 .692.462l1.41 3.393 3.663.293a.75.75 0 0 1 .428 1.317l-2.79 2.39.853 3.575a.75.75 0 0 1-1.12.814L8 11.97l-3.126 1.92a.75.75 0 0 1-1.12-.814l.852-3.574-2.79-2.39a.75.75 0 0 1 .427-1.318l3.663-.293L7.308 2.212A.75.75 0 0 1 8 1.75Z" clipRule="evenodd" /></svg>
                <span>EOM: {monthNames[win.month - 1]} {win.year} <span className="font-normal opacity-80">(Avg. {win.score.toFixed(1)}%)</span></span>
              </div>
            ))}
          </div>
        </div>
      )}

      {isEditMode ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <EditField label="Full Name" name="name" value={formData.name} onChange={handleChange} />
            <EditField label="Email" name="email" value={formData.email} onChange={handleChange} type="email" />
            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700">Gender</label>
              <select name="gender" id="gender" value={formData.gender} onChange={handleChange} className="mt-1 w-full text-sm border border-gray-300 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="">Select...</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <EditField label="Address" name="address" value={formData.address} onChange={handleChange} />
            <EditField label="City" name="city" value={formData.city} onChange={handleChange} />
            <EditField label="Country" name="country" value={formData.country} onChange={handleChange} />
            <EditField label="Qualification" name="qualification" value={formData.qualification} onChange={handleChange} />
            <div>
              <label htmlFor="profilePicture" className="block text-sm font-medium text-gray-700">Profile Picture</label>
              <input type="file" name="profilePicture" id="profilePicture" onChange={handleChange} className="mt-1 w-full text-sm border border-gray-300 rounded-lg p-2" />
            </div>
          </div>
          <div className="flex justify-end">
            <button onClick={handleSave} disabled={isUpdating} className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400">
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <InfoField label="Email" value={user.email} />
          <InfoField label="Gender" value={user.gender} />
          <InfoField label="Address" value={user.address} />
          <InfoField label="City" value={user.city} />
          <InfoField label="Country" value={user.country} />
          <InfoField label="Qualification" value={user.qualification} />
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8 pt-8 border-t border-gray-200">
        <InfoField label="Department" value={user.department} />
        <InfoField label="Experience" value={user.experience} />
        <InfoField label="Work Type" value={user.workType} />
        <InfoField label="Company" value={user.company} />
        <InfoField label="Joining Date" value={user.joiningDate ? new Date(user.joiningDate).toLocaleDateString() : 'N/A'} />
        <InfoField label="Work Location" value={user.workLocation} />
        <InfoField label="Shift" value={user.shift} />
      </div>
    </div>
  );
};

const EmployeeDashboard = () => {
  const user = useSelector(selectCurrentUser);
  const dispatch = useDispatch();
  const [activeComponent, setActiveComponent] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [processPastDueTasks] = useProcessPastDueTasksMutation();
  const [logout] = useLogoutMutation();

  useEffect(() => {
    // When the employee's dashboard loads, trigger the backend to process any past-due tasks.
    // This automatically moves tasks to 'Pending Verification' after their due date has passed.
    processPastDueTasks();
  }, [processPastDueTasks]);


  const { data: allEmployees = [] } = useGetEmployeesQuery();
  const pageTitles = {
    dashboard: 'Dashboard',
    'my-report': "Today's Progress Report",
    attendance: 'My Attendance',
    'my-tasks': 'My Tasks',
    'my-history': 'My Report History',
    analytics: 'My Performance Analytics',
    profile: 'My Profile',
  };

  const handleRefresh = () => {
    // Invalidate specific tags to refetch data without a full state reset
    dispatch(apiSlice.util.invalidateTags([
      'Task',
      'Notification',
      'Report',
      'Leave',
      'Holiday',
      'Announcement',
      'EOMHistory',
      'Employee'
    ]));
    toast.success("Dashboard data refreshed!");
  };

  const renderContent = () => {
    switch (activeComponent) {
      case 'dashboard':
        return <Dashboard user={user} onNavigate={setActiveComponent} />;
      case 'my-report':
        return <MyDailyReport employeeId={user._id} />;
      case 'my-history':
        return <MyReportHistory employeeId={user._id} />;
      case 'analytics':
        return <Analytics user={user} />;
      case 'profile':
        return <EmployeeProfile user={user} />;
      case 'attendance':
        return <MyAttendance employeeId={user._id} />;
      case 'my-tasks':
        return <MyTasks />;
      default:
        return <Dashboard user={user} onNavigate={setActiveComponent} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 text-gray-800 font-manrope dark:bg-slate-900 dark:text-slate-200">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');
          .font-manrope {
            font-family: 'Manrope', sans-serif;
          }
          .slider-thumb::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 20px; height: 20px; background: #ffffff; border: 3px solid #4f46e5; border-radius: 50%; cursor: pointer; box-shadow: 0 0 5px rgba(0,0,0,0.1); }
          .slider-thumb::-moz-range-thumb { width: 20px; height: 20px; background: #ffffff; border: 3px solid #4f46e5; border-radius: 50%; cursor: pointer; box-shadow: 0 0 5px rgba(0,0,0,0.1); }
        `}
      </style>
      <Sidebar 
        activeComponent={activeComponent} 
        setActiveComponent={setActiveComponent} 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        isCollapsed={isSidebarCollapsed} 
        setIsCollapsed={setIsSidebarCollapsed} 
      />
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)}></div>}
      <div className="flex-1 flex flex-col overflow-hidden transition-all duration-300">
          <AppHeader pageTitle={pageTitles[activeComponent]} onMenuClick={() => setSidebarOpen(true)} setActiveComponent={setActiveComponent} />
          <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900">
            {renderContent()}
          </main>
        </div>
    </div>
   );
};

export default EmployeeDashboard;
 