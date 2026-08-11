import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useGetTodaysReportQuery, useUpdateTodaysReportMutation, useGetEmployeesQuery, useGetHolidaysQuery, useGetMyTasksQuery, useGetAllTasksQuery, useGetAllMyReportsQuery, useGetActiveAnnouncementQuery, useGetEmployeeEOMHistoryQuery, useProcessPastDueTasksMutation, useUpdateEmployeeMutation } from '../services/EmployeApi';
import { apiSlice, useLogoutMutation } from '../services/apiSlice';
import toast from 'react-hot-toast';
import { ArrowPathIcon, PaperAirplaneIcon, DocumentTextIcon, BriefcaseIcon, CheckCircleIcon, HomeIcon, ChartBarIcon, UserGroupIcon, InformationCircleIcon, CalendarDaysIcon, ClipboardDocumentListIcon, CheckBadgeIcon, ArchiveBoxIcon, TrophyIcon, StarIcon, ShieldCheckIcon, ExclamationTriangleIcon, ClockIcon, CalendarIcon, ChevronDoubleLeftIcon, ChevronDownIcon, ArrowRightOnRectangleIcon, Cog8ToothIcon, ArrowDownTrayIcon, ChevronRightIcon, CameraIcon, TrashIcon, UserIcon, EnvelopeIcon, MapPinIcon, BuildingOfficeIcon, AcademicCapIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import { EyeIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUser, setCredentials, selectCurrentToken } from '../app/authSlice'; // Removed useForgotPasswordMutation as it's not used here
import PastReportsList from './PastReports';
import AttendanceCalendar from '../services/AttendanceCalendar';
import TaskApprovals from '../Admin/TaskApprovals';
import ThemeToggle from '../ThemeToggle.jsx';
import AssignTask from '../Senior/AssignTask.jsx'; 
import AnnouncementWidget from '../services/AnnouncementWidget.jsx';
// removed unused logo imports to satisfy lint
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

// Admin-style SVG donut chart — module scope for stable identity
const EmpDonutChart = ({ segments, total, size = 180 }) => {
  const [hovered, setHovered] = React.useState(null);
  const cx = size / 2, cy = size / 2;
  const r = Math.floor(size * 0.36), strokeW = Math.floor(size * 0.175), gapDeg = 6;
  const circ = 2 * Math.PI * r;
  const gapFrac = gapDeg / 360;
  const slices = React.useMemo(() => {
    let cum = 0;
    return segments.map(s => {
      const pct = s.val / (total || 1);
      const arcFrac = Math.max(pct - gapFrac, 0.01);
      const dash = arcFrac * circ;
      const offset = -(cum * circ) + circ * 0.25;
      cum += pct;
      return { ...s, dash, offset };
    });
  }, [segments, total, circ, gapFrac]);

  return (
    <div className="flex items-center gap-6">
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} onMouseLeave={() => setHovered(null)}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f0fa" strokeWidth={strokeW} />
          {slices.map(s => {
            const isHov = hovered === s.label;
            return (
              <circle key={s.label} cx={cx} cy={cy} r={r} fill="none"
                stroke={s.color}
                strokeWidth={isHov ? strokeW + 6 : strokeW}
                strokeDasharray={`${s.dash} ${circ - s.dash}`}
                strokeDashoffset={s.offset}
                strokeLinecap="round"
                style={{ filter: `drop-shadow(0px ${isHov ? 6 : 4}px ${isHov ? 10 : 6}px rgba(0,0,0,${isHov ? 0.25 : 0.15}))`, transition: 'stroke-width 0.15s ease', cursor: 'pointer' }}
                onMouseEnter={() => setHovered(s.label)}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {hovered ? (
            <>
              <span className="text-xl font-extrabold text-slate-800 leading-none">{slices.find(s => s.label === hovered)?.val}</span>
              <span className="text-[10px] font-semibold text-slate-400 mt-0.5 text-center px-2 leading-tight">{hovered}</span>
            </>
          ) : (
            <>
              <span className="text-2xl font-extrabold text-slate-800 leading-none">{total}</span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mt-0.5">Total</span>
            </>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-3 flex-1">
        {slices.map(s => {
          const pct = total > 0 ? ((s.val / total) * 100).toFixed(0) : 0;
          const isHov = hovered === s.label;
          return (
            <div key={s.label}
              className={`flex items-center justify-between rounded-xl px-2 py-1 transition-all cursor-pointer ${isHov ? 'bg-purple-50' : ''}`}
              onMouseEnter={() => setHovered(s.label)}
              onMouseLeave={() => setHovered(null)}>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                <span className={`text-xs font-medium transition-colors ${isHov ? 'text-slate-800 font-bold' : 'text-slate-500'}`}>{s.label}</span>
              </div>
              <span className={`text-xs font-bold ${isHov ? 'text-slate-800' : 'text-slate-400'}`}>{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const InfoField = ({ label, value }) => (
  <div>
    <p className="text-sm text-gray-500 dark:text-slate-400">{label}</p>
    <p className="text-md font-semibold text-gray-800 dark:text-slate-200">{value || 'N/A'}</p>
  </div>
);

const EditField = ({ label, name, value, onChange, type = 'text' }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-slate-300">{label}</label>
    <input
      type={type}
      name={name}
      id={name}
      value={value}
      onChange={onChange}
      className="mt-1 w-full text-sm border border-gray-300 dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 outline-none transition"
    />
  </div>
);

const ProfileInputField = ({ label, name, value, type = 'text', icon: Icon, onChange }) => (
  <div>
    <label className="block text-sm font-semibold text-slate-600 mb-1.5">{label}</label>
    <div className="flex items-center gap-2 border border-purple-200 rounded-xl px-3 py-2.5 bg-white focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-200 transition">
      {Icon && (
        <span className="flex items-center justify-center h-7 w-7 rounded-lg bg-purple-50 flex-shrink-0">
          <Icon className="h-4 w-4 text-purple-500" />
        </span>
      )}
      {name === 'gender' ? (
        <select name={name} value={value} onChange={onChange}
          className="flex-1 bg-transparent text-sm text-slate-700 outline-none">
          <option value="">Select...</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>
      ) : (
        <input type={type} name={name} value={value} onChange={onChange}
          className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-300" />
      )}
    </div>
  </div>
);

export const Dashboard = ({ user, onNavigate }) => {
  // Skip queries if user is not authenticated
  const isAuthenticated = !!user?._id;
  const { data: tasks = [], isLoading } = useGetMyTasksQuery(undefined, { pollingInterval: 30000, skip: !isAuthenticated });
  const { data: _announcement } = useGetActiveAnnouncementQuery(undefined, { skip: !isAuthenticated });

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
  const _nextMyTaskDueDate = useMemo(() => {
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
  const _productivityTrend = useMemo(() => {
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
    { name: 'Completed', value: tasks.filter(t => t.status === 'Completed').length },
    { name: 'In Progress', value: tasks.filter(t => t.status === 'In Progress').length },
    { name: 'Pending', value: tasks.filter(t => t.status === 'Pending').length },
    { name: 'Not Completed', value: tasks.filter(t => t.status === 'Not Completed').length },
    { name: 'Pending Verification', value: tasks.filter(t => t.status === 'Pending Verification').length },
  ].filter(d => d.value > 0);
  const donutTotal = tasks.length;
  const DONUT_COLORS = { 'Completed': '#10b981', 'In Progress': '#3b82f6', 'Pending': '#f97316', 'Not Completed': '#ef4444', 'Pending Verification': '#8E5FD0', 'No Tasks': '#e2e8f0' };

  if (isLoading) return <div className="p-8 text-center">Loading dashboard...</div>;

  // --- Employee Dashboard (Admin-style UI) ---
  return (
    <div className="min-h-screen p-6 lg:p-8 font-manrope" style={{ backgroundColor: '#DFCDFE' }}>
      <AnnouncementWidget />

      {/* Welcome Bar — matches admin purple gradient */}
      <div className="mb-8 flex flex-col md:flex-row items-center justify-between gap-4 rounded-2xl px-8 py-8 text-white" style={{ background: 'linear-gradient(135deg, #48306A, #8E5FD0)' }}>
        <div>
          <h1 className="text-2xl font-extrabold uppercase tracking-wide">Welcome Back, {user?.name?.split(' ')[0] || 'Employee'} !</h1>
          <p className="text-base mt-3 text-purple-200">Track Your Tasks, Performance And Daily Progress From One Place</p>
        </div>
        <div className="hidden md:block w-px self-stretch bg-white/20" />
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-white/10 rounded-lg p-1.5">
            {['week', 'month'].map(t => (
              <button key={t} onClick={() => setFilterType(t)}
                className={`px-4 py-2 rounded-md text-sm font-bold capitalize transition-all ${filterType === t ? 'bg-white text-purple-800' : 'text-white hover:bg-white/10'}`}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
            <CalendarIcon className="h-4 w-4 text-purple-200 flex-shrink-0" />
            <input type="date" value={dateRange.startDate}
              onChange={e => { setDateRange(p => ({ ...p, startDate: e.target.value })); setFilterType('custom'); }}
              onFocus={() => setFilterType('custom')}
              className="text-sm font-semibold text-white bg-transparent px-1 py-0.5 rounded outline-none [color-scheme:dark]" />
            <span className="text-purple-300 font-bold">-</span>
            <input type="date" value={dateRange.endDate}
              onChange={e => { setDateRange(p => ({ ...p, endDate: e.target.value })); setFilterType('custom'); }}
              onFocus={() => setFilterType('custom')}
              className="text-sm font-semibold text-white bg-transparent px-1 py-0.5 rounded outline-none [color-scheme:dark]" />
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        <StatCard title="Total Tasks" value={stats?.totalTasks || 0} subtext="Selected Period" icon={ClipboardDocumentListIcon} />
        <StatCard title="Pending Tasks" value={stats?.taskStats?.pending || 0} subtext={`${pendingPct}%`} isWarning icon={ClockIcon} />
        <StatCard title="Completed" value={stats?.taskStats?.completed || 0} subtext={`${completedPct}%`} isSuccess icon={CheckCircleIcon} />
        <StatCard title="In Progress" value={stats?.taskStats?.inProgress || 0} subtext={`${inProgressPct}%`} isInfo icon={ShieldCheckIcon} />
        <StatCard title="Attendance" value={`${Math.round((attendanceData?.presentCount / (attendanceData?.totalDays || 1)) * 100) || 0}%`} subtext="Selected Period" isDanger icon={CalendarDaysIcon} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Personal Task Status Donut */}
        <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-6">
          <h3 className="text-base font-bold text-slate-800 mb-1">Personal Task Overview</h3>
          <p className="text-xs text-slate-400 mb-4">Task status breakdown for selected period</p>
          <EmpDonutChart
            total={donutTotal}
            size={180}
            segments={donutData.map(d => ({ label: d.name, val: d.value, color: DONUT_COLORS[d.name] }))}
          />
        </div>

        {/* Task Completion Trend */}
        <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-6">
          <h3 className="text-base font-bold text-slate-800 mb-2">Task Completion Trend</h3>
          <div className="h-52 -ml-4 -mb-2">
            <GoogleAreaChart data={_productivityTrend} colors={['#8E5FD0']} />
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-bold text-slate-800">Upcoming Deadlines</h3>
            <button onClick={() => onNavigate('my-tasks')} className="text-xs font-bold px-3 py-1 rounded-lg text-white transition" style={{ background: 'linear-gradient(135deg,#48306A,#8E5FD0)' }}>View All</button>
          </div>
          <div className="space-y-3">
            {upcomingTasks?.map(task => {
              const target = safeDate(task.dueDate); target.setHours(0,0,0,0);
              const todayD = new Date(); todayD.setHours(0,0,0,0);
              const daysLeft = Math.round((target - todayD) / (1000 * 60 * 60 * 24));
              const isToday = daysLeft === 0;
              const isSoon = daysLeft > 0 && daysLeft <= 3;
              return (
                <div key={task._id} className="p-3 rounded-xl bg-purple-50 border border-purple-100 flex justify-between items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{task.title}</p>
                    <p className="text-[11px] text-slate-400">{new Date(task.dueDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border flex-shrink-0 ${isToday ? 'text-rose-600 bg-rose-50 border-rose-200' : isSoon ? 'text-orange-600 bg-orange-50 border-orange-200' : 'text-purple-600 bg-purple-50 border-purple-200'}`}>
                    {isToday ? 'Today' : `${daysLeft}d left`}
                  </span>
                </div>
              );
            })}
            {(!upcomingTasks || upcomingTasks.length === 0) && <p className="text-sm text-slate-400">No upcoming deadlines.</p>}
          </div>
        </div>
      </div>

      {/* Lower Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* My Active Tasks */}
        <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-6 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-bold text-slate-800">My Active Tasks</h3>
            <button onClick={() => onNavigate('my-tasks')} className="text-xs font-bold px-3 py-1 rounded-lg text-white transition" style={{ background: 'linear-gradient(135deg,#48306A,#8E5FD0)' }}>View All</button>
          </div>
          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            {stats?.activeTaskList?.length > 0 ? stats.activeTaskList.map(task => (
              <div key={task._id} className="p-3 border border-purple-100 rounded-xl flex items-center justify-between hover:bg-purple-50 transition">
                <div className="flex-1 min-w-0 pr-2">
                  <p className="font-bold text-sm text-slate-800 truncate">{task.title}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{formatDueDate(new Date(task.dueDate))}</p>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex-shrink-0 ${task.priority === 'High' ? 'bg-red-100 text-red-700 border border-red-200' : task.priority === 'Medium' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'}`}>
                  {task.priority || 'Medium'}
                </span>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                <CheckCircleIcon className="h-10 w-10 text-emerald-400 mb-2" />
                <p className="font-semibold text-sm">All caught up!</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-bold text-slate-800">Recent Activity</h3>
            <button onClick={() => onNavigate('task-history')} className="text-xs font-bold px-3 py-1 rounded-lg text-white transition" style={{ background: 'linear-gradient(135deg,#48306A,#8E5FD0)' }}>View All</button>
          </div>
          <div className="relative border-l-2 border-purple-100 ml-4 space-y-4">
            {stats?.recentActivityLog?.slice(0, 4).map((activity, i) => (
              <div key={i} className="relative pl-5">
                <span className="absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 border-white flex-shrink-0" style={{ background: 'linear-gradient(135deg,#48306A,#8E5FD0)' }} />
                <p className="text-xs font-bold text-slate-800 leading-tight truncate">Task Update: {activity.title}</p>
                <p className="text-[10px] font-bold text-purple-400 mt-0.5">{safeDate(activity.updatedAt || activity.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
            {(!stats?.recentActivityLog || stats.recentActivityLog.length === 0) && <p className="text-xs text-slate-400 pl-5">No recent activities.</p>}
          </div>
        </div>

        {/* My Performance */}
        <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-6 flex flex-col items-center justify-center text-center">
          <h3 className="text-base font-bold text-slate-800 mb-4 self-start">My Performance</h3>
          <div className="relative w-40 h-40 flex items-center justify-center mb-3 mx-auto">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f0fa" strokeWidth="12" />
              <circle cx="50" cy="50" r="40" fill="none" stroke="url(#empPurpleGrad)" strokeWidth="12"
                strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * performanceScore / 100)}
                strokeLinecap="round" />
              <defs>
                <linearGradient id="empPurpleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#48306A" />
                  <stop offset="100%" stopColor="#8E5FD0" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-2xl font-black text-slate-800 leading-none">{performanceScore}%</p>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mt-0.5">Score</p>
            </div>
          </div>
          <span className={`text-[13px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${performanceScore >= 80 ? 'text-emerald-600 bg-emerald-50' : performanceScore >= 50 ? 'text-purple-600 bg-purple-50' : 'text-orange-600 bg-orange-50'}`}>
            {performanceScore >= 80 ? 'Excellent' : performanceScore >= 50 ? 'Good' : 'Needs Focus'}
          </span>
          <p className="text-xs text-slate-400 mt-2">Keep up the great work!</p>
        </div>
      </div>

      {/* Attendance Row */}
      <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-6">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="flex-1 w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-slate-800">Personal Attendance Tracker</h3>
              <button onClick={() => onNavigate('attendance')} className="text-xs font-bold px-3 py-1 rounded-lg text-white transition" style={{ background: 'linear-gradient(135deg,#48306A,#8E5FD0)' }}>View All</button>
            </div>
            <div className="flex justify-between items-center w-full px-2 overflow-x-auto pb-2">
              {attendanceData?.days?.map((day, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2 flex-shrink-0 px-2">
                  <div className={`h-10 w-10 rounded-full border-2 flex items-center justify-center ${day.isPresent ? 'border-purple-400 bg-purple-50' : day.isFuture ? 'border-slate-200 border-dashed' : 'border-slate-200 border-dashed'}`}>
                    {day.isPresent && <CheckCircleIcon className="h-5 w-5 text-purple-500" />}
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{day.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="w-full lg:w-auto lg:border-l border-purple-100 lg:pl-8 grid grid-cols-3 gap-4 min-w-[240px]">
            <div><p className="text-xl font-black text-purple-600">{attendanceData?.presentCount || 0}/{attendanceData?.totalDays || 0}</p><p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Present</p></div>
            <div><p className="text-xl font-black text-slate-800">{(attendanceData?.presentCount || 0) * 8}h</p><p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Hours</p></div>
            <div><p className="text-xl font-black text-orange-500">0</p><p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Leaves</p></div>
          </div>
        </div>
      </div>

    </div>
  );
};

export const AnalyticsDonutChart = ({ segments, total, size = 260 }) => {
  const [hovered, setHovered] = React.useState(null);
  const cx = size / 2, cy = size / 2;
  const r = 90, strokeW = 36, gapDeg = 6;
  const circ = 2 * Math.PI * r;
  const gapFrac = gapDeg / 360;
  let cumPct = 0;
  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} onMouseLeave={() => setHovered(null)}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f0fa" strokeWidth={strokeW} />
          {segments.map(s => {
            const pct = s.val / (total || 1);
            const arcFrac = Math.max(pct - gapFrac, 0.01);
            const dash = arcFrac * circ;
            const dashOffset = -(cumPct * circ) + circ * 0.25;
            cumPct += pct;
            const isHov = hovered === s.label;
            return (
              <circle key={s.label} cx={cx} cy={cy} r={r} fill="none"
                stroke={s.color}
                strokeWidth={isHov ? strokeW + 6 : strokeW}
                strokeDasharray={`${dash} ${circ - dash}`}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                style={{ filter: `drop-shadow(0px ${isHov ? 6 : 4}px ${isHov ? 10 : 6}px rgba(0,0,0,${isHov ? 0.25 : 0.15}))`, transition: 'stroke-width 0.15s ease', cursor: 'pointer' }}
                onMouseEnter={() => setHovered(s.label)}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {hovered ? (
            <>
              <span className="text-xl font-extrabold text-slate-800 leading-none">{segments.find(s => s.label === hovered)?.val}</span>
              <span className="text-[10px] font-semibold text-slate-400 mt-0.5 text-center px-2 leading-tight">{hovered}</span>
            </>
          ) : (
            <>
              <span className="text-2xl font-extrabold text-slate-800 leading-none">{total}</span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mt-0.5">Total</span>
            </>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-3 flex-1 w-full">
        {segments.map(s => {
          const pct = total > 0 ? ((s.val / total) * 100).toFixed(0) : 0;
          const isHov = hovered === s.label;
          return (
            <div key={s.label}
              className={`flex items-center justify-between rounded-xl px-2 py-1 transition-all cursor-pointer ${isHov ? 'bg-purple-50' : ''}`}
              onMouseEnter={() => setHovered(s.label)}
              onMouseLeave={() => setHovered(null)}
            >
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                <span className={`text-xs font-medium transition-colors ${isHov ? 'text-slate-800 font-bold' : 'text-slate-500'}`}>{s.label}</span>
              </div>
              <span className={`text-xs font-bold ${isHov ? 'text-slate-800' : 'text-slate-400'}`}>{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const AnalyticsStatCard = ({ grade, count, accentColor }) => {
  const ACCENT = accentColor || '#8E5FD0';
  const GRADE_ICONS = {
    'Avg. Completion': ChartBarIcon,
    'Total Tasks': ClipboardDocumentListIcon,
    'In Progress': ArrowPathIcon,
    'In Verification': ShieldCheckIcon,
    'Completed': TrophyIcon,
    'Not Completed': ExclamationTriangleIcon,
    'Pending': ExclamationTriangleIcon,
  };
  const Icon = GRADE_ICONS[grade] || InformationCircleIcon;
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-purple-100 p-5 flex items-start gap-4 hover:shadow-md transition-shadow">
      <div className="flex-shrink-0 p-3 rounded-xl" style={{ backgroundColor: `${ACCENT}18`, color: ACCENT }}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">{grade}</p>
        <p className="text-4xl font-extrabold text-slate-800 leading-none">{count}</p>
        <div className="h-0.5 w-8 rounded-full mt-2" style={{ backgroundColor: ACCENT }} />
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
    return (
      <div className="min-h-full flex items-center justify-center" style={{ backgroundColor: '#DFCDFE' }}>
        <p className="text-slate-500 font-medium">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="min-h-full p-6 lg:p-8" style={{ backgroundColor: '#DFCDFE' }}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="mb-2">
        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Performance Analytics</h2>
        <div className="h-1 w-12 rounded-full mt-1 mb-3" style={{ background: 'linear-gradient(90deg,#48306A,#8E5FD0)' }} />
        <p className="text-slate-500 text-sm">An Overview Of Task Completion And Progress</p>
      </div>

      {/* ── Toolbar ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 my-6">
        {/* Search */}
        <div className="relative w-full sm:w-64">
          <svg className="h-4 w-4 text-slate-400 absolute top-1/2 left-3 -translate-y-1/2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
          <input type="text" placeholder="Search Anything..." className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-purple-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-300 shadow-sm" readOnly />
        </div>

        {/* View toggle */}
        <div className="flex items-center rounded-xl overflow-hidden border border-purple-200 bg-white shadow-sm">
          {(user?.role === 'Admin' || user?.role === 'Super Admin') && (
            <button
              onClick={() => { setView('org_stats'); setSelectedUserId(''); }}
              className="px-5 py-2.5 text-sm font-bold transition-all whitespace-nowrap"
              style={view === 'org_stats' ? { background: 'linear-gradient(135deg,#48306A,#8E5FD0)', color: '#fff' } : { color: '#48306A' }}
            >ORG</button>
          )}
          {user?.canViewTeam && user?.role !== 'Admin' && user?.role !== 'Super Admin' && (
            <button
              onClick={() => { setView('team_stats'); setSelectedUserId(''); }}
              className="px-5 py-2.5 text-sm font-bold transition-all whitespace-nowrap"
              style={view === 'team_stats' ? { background: 'linear-gradient(135deg,#48306A,#8E5FD0)', color: '#fff' } : { color: '#48306A' }}
            >Team</button>
          )}
          {user?.role !== 'Admin' && user?.role !== 'Super Admin' && (
            <button
              onClick={() => { setView('my_stats'); setSelectedUserId(''); }}
              className="px-5 py-2.5 text-sm font-bold transition-all whitespace-nowrap"
              style={view === 'my_stats' ? { background: 'linear-gradient(135deg,#48306A,#8E5FD0)', color: '#fff' } : { color: '#48306A' }}
            >My Stats</button>
          )}
        </div>

        {/* User dropdown */}
        {(user?.role === 'Admin' || user?.role === 'Super Admin' || user?.canViewTeam) && employeesForDropdown.length > 0 && (
          <select
            value={selectedUserId}
            onChange={e => {
              setSelectedUserId(e.target.value);
              setView(e.target.value ? 'user_stats' : (user?.role === 'Admin' || user?.role === 'Super Admin' ? 'org_stats' : 'team_stats'));
            }}
            className="text-sm border border-purple-200 rounded-xl px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-purple-300 shadow-sm font-semibold text-slate-700"
          >
            <option value="">All User</option>
            {employeesForDropdown.map(emp => (
              <option key={emp._id} value={emp._id}>{emp.name}</option>
            ))}
          </select>
        )}

        {/* Date pickers */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white border border-purple-200 rounded-xl px-3 py-2.5 shadow-sm">
            <CalendarIcon className="h-4 w-4 text-purple-400 flex-shrink-0" />
            <input
              type="date" value={dateRange.startDate}
              onChange={e => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="text-sm text-slate-600 outline-none bg-transparent w-32"
            />
          </div>
          <span className="text-slate-500 text-sm font-semibold">TO</span>
          <div className="flex items-center gap-1.5 bg-white border border-purple-200 rounded-xl px-3 py-2.5 shadow-sm">
            <CalendarIcon className="h-4 w-4 text-purple-400 flex-shrink-0" />
            <input
              type="date" value={dateRange.endDate}
              onChange={e => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="text-sm text-slate-600 outline-none bg-transparent w-32"
            />
          </div>
        </div>
      </div>

      {/* ── Stat Cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <AnalyticsStatCard grade="Avg. Completion" count={`${performanceStats.averageCompletion.toFixed(1)}%`} accentColor="#8E5FD0" />
        <AnalyticsStatCard grade="Total Tasks"     count={performanceStats.totalTasks}           accentColor="#3B82F6" />
        <AnalyticsStatCard grade="In Progress"     count={performanceStats.tasksInProgress}       accentColor="#10B981" />
        <AnalyticsStatCard grade="In Verification" count={performanceStats.tasksInVerification}   accentColor="#F59E0B" />
      </div>

      {/* ── Bottom Row ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">

        {/* Active Task Status */}
        <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-6 flex flex-col">
          <h3 className="text-lg font-extrabold text-slate-800 mb-5">Active Task Status</h3>
          {chartData.length > 0 ? (
            <AnalyticsDonutChart
              segments={chartData.map(d => ({ label: d.name, val: d.value, color: GRADE_COLORS[d.name] }))}
              total={performanceStats.totalTasks}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <ChartBarIcon className="h-10 w-10 mb-2 text-purple-200" />
              <p className="text-sm">No task data to display.</p>
            </div>
          )}
          <div className="pt-4 mt-4 border-t border-purple-100">
            <p className="text-sm font-semibold text-slate-500">Total Task</p>
            <p className="text-3xl font-extrabold text-slate-800">{performanceStats.totalTasks}</p>
            <div className="h-0.5 w-8 rounded-full mt-1" style={{ background: 'linear-gradient(90deg,#48306A,#8E5FD0)' }} />
          </div>
        </div>

        {/* Metric Definitions */}
        <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-6 flex flex-col">
          <h3 className="text-lg font-extrabold text-slate-800 mb-5">Metric Definitions</h3>
          <div className="space-y-0 divide-y divide-purple-50">
            {[
              {
                icon: ChartBarIcon,
                color: '#8E5FD0',
                title: 'Average Completion',
                desc: 'Average Final Progress Of All Graded Task In The Selected Data Range',
              },
              {
                icon: ClipboardDocumentListIcon,
                color: '#3B82F6',
                title: 'Total Task',
                desc: 'All Task Assign Within The Selected Range Time',
              },
              {
                icon: ArrowPathIcon,
                color: '#10B981',
                title: 'Inprogress',
                desc: 'Task Currently Being Worked On By Employee',
              },
              {
                icon: ShieldCheckIcon,
                color: '#F59E0B',
                title: 'In Verification',
                desc: 'Tasks Submitted By Employee And Awaiting Approval',
              },
            ].map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="flex items-start gap-4 py-4">
                <div className="flex-shrink-0 p-2.5 rounded-xl" style={{ backgroundColor: `${color}18`, color }}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-slate-800">{title}</p>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
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

  if (isLoading) return <div className="p-8 text-center text-slate-500">Loading tasks...</div>;

  const statusStyles = {
    'Pending': 'bg-amber-50 text-amber-700 border border-amber-200',
    'In Progress': 'bg-blue-50 text-blue-700 border border-blue-200',
    'Completed': 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    'Pending Verification': 'bg-purple-50 text-purple-700 border border-purple-200',
    'Not Completed': 'bg-orange-50 text-orange-700 border border-orange-200',
  };
  const priorityColors = { High: '#ef4444', Medium: '#f59e0b', Low: '#10b981' };

  return (
    <div className="min-h-screen p-6 lg:p-8 font-manrope" style={{ backgroundColor: '#DFCDFE' }}>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-slate-800 uppercase tracking-wide">My Tasks</h1>
        <p className="text-sm text-slate-500 mt-1">Stay on top of your assigned tasks and deadlines</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {/* Active Tasks — blue pastel */}
        <div className="flex items-center gap-4 bg-white rounded-2xl border border-blue-100 p-5 shadow-sm">
          <div className="rounded-xl p-2.5 bg-blue-50 flex-shrink-0">
            <ClipboardDocumentListIcon className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Active Tasks</p>
            <p className="text-4xl font-extrabold text-blue-600 mt-1">{stats.active}</p>
          </div>
        </div>
        {/* Overdue Tasks — red pastel */}
        <div className="flex items-center gap-4 bg-white rounded-2xl border border-red-100 p-5 shadow-sm">
          <div className="rounded-xl p-2.5 bg-red-50 flex-shrink-0">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Overdue Tasks</p>
            <p className="text-4xl font-extrabold text-red-500 mt-1">{stats.overdue}</p>
          </div>
        </div>
        {/* Completed Tasks — green pastel */}
        <div className="flex items-center gap-4 bg-white rounded-2xl border border-emerald-100 p-5 shadow-sm">
          <div className="rounded-xl p-2.5 bg-emerald-50 flex-shrink-0">
            <CheckCircleIcon className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Completed Tasks</p>
            <p className="text-4xl font-extrabold text-emerald-600 mt-1">{stats.completed}</p>
          </div>
        </div>
      </div>

      {/* Task Table Card */}
      <div className="bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-purple-50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center bg-purple-50 rounded-xl p-1 gap-1">
            {['All', 'Active', 'Completed'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === tab ? 'text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                style={activeTab === tab ? { background: 'linear-gradient(135deg,#48306A,#8E5FD0)' } : {}}>
                {tab}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 border border-purple-200 rounded-xl px-3 py-2 bg-white">
              <CalendarIcon className="h-4 w-4 text-purple-400 flex-shrink-0" />
              <input type="date" value={dateRange.startDate}
                onChange={e => setDateRange(p => ({ ...p, startDate: e.target.value }))}
                className="text-xs font-semibold text-slate-600 bg-transparent outline-none" />
              <span className="text-slate-300 font-bold">-</span>
              <input type="date" value={dateRange.endDate}
                onChange={e => setDateRange(p => ({ ...p, endDate: e.target.value }))}
                className="text-xs font-semibold text-slate-600 bg-transparent outline-none" />
            </div>
            <p className="text-xs text-slate-400 font-semibold whitespace-nowrap">{tasksToShow.length} task{tasksToShow.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        <div className="divide-y divide-purple-50">
          {tasksToShow.length > 0 ? tasksToShow.map((task, index) => {
            const now = new Date();
            const todayUTCStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
            const isOverdue = !['Completed', 'Not Completed', 'Pending Verification'].includes(task.status) && task.dueDate && new Date(task.dueDate) < todayUTCStart;
            return (
              <div key={task._id} className="px-6 py-4 hover:bg-purple-50/50 transition flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: priorityColors[task.priority] || '#94a3b8' }} title={`${task.priority} Priority`} />
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-slate-800 truncate">{task.title}</p>
                    <span className={`text-[10px] font-bold ${isOverdue ? 'text-rose-600' : 'text-slate-400'}`}>
                      Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                      {isOverdue && ' · Overdue'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full md:w-40 flex-shrink-0">
                  <div className="flex-1 h-2 rounded-full bg-purple-100 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${task.progress || 0}%`, background: 'linear-gradient(90deg,#48306A,#8E5FD0)' }} />
                  </div>
                  <span className="text-xs font-bold text-slate-600 w-8 text-right">{task.progress || 0}%</span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide whitespace-nowrap ${statusStyles[task.status] || ''}`}>
                    {task.status}
                  </span>
                  <button onClick={() => { setViewingTask(task); setViewingTaskNumber(index + 1); }}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg text-white transition"
                    style={{ background: 'linear-gradient(135deg,#48306A,#8E5FD0)' }}>
                    Details
                  </button>
                </div>
              </div>
            );
          }) : (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <ClipboardDocumentListIcon className="h-12 w-12 text-purple-200 mb-3" />
              <p className="font-bold text-slate-500">No {activeTab.toLowerCase()} tasks.</p>
              <p className="text-sm mt-1">Tasks assigned to you will appear here.</p>
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
          <div className="px-6 pb-6 space-y-3">
            {data.reportNote && (
              <div className="bg-purple-50 border border-purple-100 rounded-xl px-4 py-3">
                <h4 className="text-[10px] font-bold text-purple-400 uppercase tracking-wider mb-1">Employee Notes</h4>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{data.reportNote}</p>
              </div>
            )}
            {data.taskUpdates.map((update, i) => (
              <div key={i} className="bg-slate-50 border border-purple-100 rounded-xl p-4">
                {/* Title + Details button */}
                <div className="flex justify-between items-center mb-2">
                  <p className="font-bold text-sm text-slate-800 flex-1 min-w-0 pr-3 truncate">
                    Task {i + 1}: {update.taskId?.title || 'Unknown Task'}
                  </p>
                  {update.taskId && (
                    <button onClick={() => { setViewingTask(update.taskId); setViewingTaskNumber(i + 1); }}
                      className="text-[10px] font-bold px-2.5 py-1 rounded-lg text-white transition flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg,#48306A,#8E5FD0)' }}>
                      Details
                    </button>
                  )}
                </div>
                {/* Progress bar */}
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex-1 h-2 rounded-full bg-purple-100 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${update.completion}%`, background: 'linear-gradient(90deg,#48306A,#8E5FD0)' }} />
                  </div>
                  <span className="text-sm font-extrabold flex-shrink-0 w-10 text-right"
                    style={{ background: 'linear-gradient(135deg,#48306A,#8E5FD0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    {update.completion}%
                  </span>
                </div>
                {update.note && (
                  <div className="mt-2 bg-white rounded-lg border border-purple-100 px-3 py-2">
                    <p className="text-xs text-slate-600"><span className="font-bold text-slate-700">Note: </span>{update.note}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      }
      return <p className="px-6 pb-6 text-sm text-slate-600 whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</p>;
    } catch {
      return <p className="px-6 pb-6 text-sm text-slate-600 whitespace-pre-wrap">{content}</p>;
    }
  };

  if (isLoading) return <div className="p-8 text-center text-slate-500">Loading report history...</div>;

  return (
    <div className="min-h-screen p-6 lg:p-8 font-manrope" style={{ backgroundColor: '#DFCDFE' }}>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-slate-800 uppercase tracking-wide">My Report History</h1>
        <p className="text-sm text-slate-500 mt-1">Review your previously submitted daily progress reports</p>
      </div>

      {/* Report count */}
      <div className="flex items-center justify-between mb-4 px-1">
        <p className="text-sm font-bold text-slate-600">{reports.length} report{reports.length !== 1 ? 's' : ''} found</p>
      </div>

      {/* Report list */}
      <div className="space-y-3">
        {reports.length > 0 ? reports.map(report => (
          <div key={report._id} className="bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden">
            {/* Accordion header */}
            <button
              onClick={() => setExpandedReportId(expandedReportId === report._id ? null : report._id)}
              className="w-full text-left px-6 py-4 flex items-center justify-between hover:bg-purple-50/50 transition">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#48306A,#8E5FD0)' }}>
                  <DocumentTextIcon className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-bold text-sm text-slate-800">
                    {new Date(report.reportDate).toLocaleDateString('en-US', { dateStyle: 'full' })}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {(() => { try { const d = JSON.parse(report.content); return `${(d.taskUpdates || []).length} task update${(d.taskUpdates || []).length !== 1 ? 's' : ''}`; } catch { return ''; } })()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${report.status === 'Submitted' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                  {report.status}
                </span>
                <ChevronDownIcon className={`h-4 w-4 text-slate-400 transition-transform ${expandedReportId === report._id ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {/* Accordion body */}
            {expandedReportId === report._id && (
              <div className="border-t border-purple-50 pt-4">
                {renderReportContent(report.content)}
              </div>
            )}
          </div>
        )) : (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-purple-100 shadow-sm text-slate-400">
            <ArchiveBoxIcon className="h-12 w-12 text-purple-200 mb-3" />
            <p className="font-bold text-slate-500 text-base">No Report History Found</p>
            <p className="text-sm mt-1">You have not submitted any reports yet.</p>
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
      } catch { /* ignore parsing errors */ }
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
    return <div className="p-8 text-center text-slate-500">Loading Report...</div>;
  }

  return (
    <div className="min-h-screen p-6 lg:p-8 font-manrope" style={{ backgroundColor: '#DFCDFE' }}>

      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 uppercase tracking-wide">Today's Progress Report</h1>
          <p className="text-sm text-slate-500 mt-1">Update the completion status for your active tasks</p>
        </div>
        {!isReadOnly && tasksToDisplay.length > 0 && (
          <button onClick={handleSubmit} disabled={isUpdating}
            className="flex items-center gap-2 font-bold py-2.5 px-6 rounded-xl text-white shadow-sm transition text-sm disabled:opacity-60 whitespace-nowrap"
            style={{ background: 'linear-gradient(135deg,#48306A,#8E5FD0)' }}>
            {isUpdating ? <ArrowPathIcon className="animate-spin h-4 w-4" /> : <PaperAirplaneIcon className="h-4 w-4" />}
            Submit Progress
          </button>
        )}
      </div>

      {/* Read-only warning */}
      {isReadOnly && (
        <div className="mb-6 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
          <ExclamationTriangleIcon className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-800 text-sm">Reporting Closed For Today</p>
            <p className="text-xs text-amber-700 mt-0.5">You can submit progress once daily before 7:00 PM. Today's report may have already been submitted or the deadline has passed.</p>
          </div>
        </div>
      )}

      {/* Task Cards */}
      <div className="space-y-4">
        {tasksToDisplay.map((task, index) => (
          <div key={task._id} className="bg-white rounded-2xl border border-purple-100 shadow-sm p-6 hover:shadow-md transition">

            {/* Task header */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1 min-w-0 pr-4">
                <h3 className="font-bold text-base text-slate-800 truncate">{task.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}</p>
              </div>
              <span className="text-2xl font-extrabold flex-shrink-0" style={{ background: 'linear-gradient(135deg,#48306A,#8E5FD0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {progress[task._id] || 0}%
              </span>
            </div>

            {/* Progress bar + slider */}
            <div className="relative w-full mb-4">
              <div className="h-3 w-full bg-purple-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${progress[task._id] || 0}%`, background: 'linear-gradient(90deg,#48306A,#8E5FD0)' }} />
              </div>
              <input type="range" min="0" max="100" step="5"
                value={progress[task._id] ?? 0}
                onChange={(e) => handleProgressChange(task._id, e.target.value)}
                disabled={isTaskReadOnly(task)}
                className="absolute inset-0 w-full opacity-0 cursor-pointer disabled:cursor-not-allowed h-3"
                style={{ top: 0 }}
              />
            </div>

            {/* Description */}
            {task.description && (
              <div className="bg-purple-50 rounded-xl px-4 py-3 border border-purple-100 mb-4">
                <p className="text-xs text-slate-500 leading-relaxed whitespace-pre-wrap">{task.description}</p>
              </div>
            )}

            {/* Task note */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Task Update Note <span className="font-normal text-slate-400">(Optional)</span></label>
              <input type="text"
                placeholder="E.g., Finished the first draft, waiting on review..."
                value={taskNotes[task._id] || ''}
                onChange={(e) => setTaskNotes(prev => ({ ...prev, [task._id]: e.target.value }))}
                disabled={isTaskReadOnly(task)}
                className="w-full text-sm border border-purple-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 transition disabled:opacity-60 disabled:bg-slate-50 disabled:cursor-not-allowed bg-white text-slate-700 placeholder:text-slate-300"
              />
            </div>
          </div>
        ))}

        {tasksToDisplay.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-purple-100 shadow-sm text-slate-400">
            <CheckCircleIcon className="h-12 w-12 text-emerald-400 mb-3" />
            <p className="font-bold text-slate-600 text-base">All tasks are completed!</p>
            <p className="text-sm mt-1">No pending tasks to report on.</p>
          </div>
        )}

        {/* Additional Notes */}
        {(!isReadOnly || reportNote) && (
          <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-6">
            <h3 className="font-bold text-base text-slate-800 mb-3">Additional Notes / Comments</h3>
            <textarea
              value={reportNote}
              onChange={(e) => setReportNote(e.target.value)}
              disabled={isReadOnly}
              placeholder="Add any notes, blockers, or comments regarding today's progress for your manager..."
              className="w-full text-sm border border-purple-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 transition resize-none min-h-[120px] disabled:opacity-60 disabled:bg-slate-50 disabled:cursor-not-allowed bg-white text-slate-700 placeholder:text-slate-300"
            />
          </div>
        )}

        {/* Bottom submit button */}
        {!isReadOnly && tasksToDisplay.length > 0 && (
          <div className="flex justify-end pt-2">
            <button onClick={handleSubmit} disabled={isUpdating}
              className="flex items-center gap-2 font-bold py-2.5 px-8 rounded-xl text-white shadow-sm transition text-sm disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg,#48306A,#8E5FD0)' }}>
              {isUpdating ? <ArrowPathIcon className="animate-spin h-4 w-4" /> : <PaperAirplaneIcon className="h-4 w-4" />}
              Submit Progress
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export const MyAttendance = ({ employeeId }) => {
  const { data: holidays = [], isLoading: isLoadingHolidays } = useGetHolidaysQuery();

  const legendItems = [
    { label: 'Present',  color: 'bg-emerald-500' },
    { label: 'Absent',   color: 'bg-red-500' },
    { label: 'Holiday',  color: 'bg-amber-500' },
    { label: 'Leave',    color: 'bg-sky-500' },
    { label: 'Future',   color: 'bg-slate-200' },
  ];

  const upcomingHolidays = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return holidays
      .filter(h => new Date(h.date) >= today)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [holidays]);

  return (
    <div className="min-h-screen p-6 lg:p-8 font-manrope" style={{ backgroundColor: '#DFCDFE' }}>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-slate-800 uppercase tracking-wide">My Attendance</h1>
        <p className="text-sm text-slate-500 mt-1">Review your monthly attendance record</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-purple-100 shadow-sm p-6">
          <AttendanceCalendar employeeId={employeeId} />
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Legend */}
          <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-5">
            <h3 className="text-sm font-bold text-slate-800 mb-3">Legend</h3>
            <div className="space-y-2.5">
              {legendItems.map(item => (
                <div key={item.label} className="flex items-center gap-2.5">
                  <span className={`h-3.5 w-3.5 rounded-full flex-shrink-0 ${item.color}`} />
                  <span className="text-sm font-medium text-slate-600">{item.label}</span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 mt-4 italic leading-relaxed">
              Click on a date to apply for leave. Sundays are default holidays.
            </p>
          </div>

          {/* Upcoming Holidays */}
          <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-5">
            <h3 className="text-sm font-bold text-slate-800 mb-3">Upcoming Holidays</h3>
            <div className="space-y-2">
              {isLoadingHolidays ? (
                <p className="text-sm text-slate-400">Loading...</p>
              ) : upcomingHolidays.length > 0 ? (
                upcomingHolidays.slice(0, 5).map(holiday => (
                  <div key={holiday._id} className="p-3 rounded-xl bg-amber-50 border border-amber-100">
                    <p className="font-bold text-sm text-amber-800">{holiday.name}</p>
                    <p className="text-[11px] text-amber-600 mt-0.5">
                      {new Date(holiday.date).toLocaleDateString('en-US', { dateStyle: 'long', timeZone: 'UTC' })}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400">No upcoming holidays found.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const EmployeeProfileContent = ({ user }) => {
  const dispatch = useDispatch();
  const [isEditMode, setIsEditMode] = useState(false);
  const [updateProfile, { isLoading: isUpdating }] = useUpdateEmployeeMutation();
  const token = useSelector(selectCurrentToken); // Use the memoized selector for token
  const { data: eomHistory = [] } = useGetEmployeeEOMHistoryQuery(user._id, {
    skip: !user,
  });
  const monthNames = useMemo(() => ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"], []);

  const [formData, setFormData] = useState({
    name: '', email: '', profilePicture: null, address: '', gender: '', country: '', city: '', qualification: '',
  });

  // Populate form data when the user loads or changes, but do not reset while editing.
  useEffect(() => {
    if (!user || isEditMode) return;

    setFormData({
      name: user.name || '',
      email: user.email || '',
      profilePicture: null,
      address: user.address || '',
      gender: user.gender || '',
      country: user.country || '',
      city: user.city || '',
      qualification: user.qualification || '',
    });
  }, [user, isEditMode]);

  const handleChange = useCallback((e) => {
    if (e.target.type === 'file') {
      setFormData(prev => ({ ...prev, profilePicture: e.target.files[0] }));
      return;
    }

    setIsEditMode(true);
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }, []); // setFormData and setIsEditMode are stable, so no need to list them as dependencies

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
        dispatch(setCredentials({ user: updatedData.employee, token: updatedData.token || user.token })); // Pass token from updatedData or existing user
      }
      setIsEditMode(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
      const errorMessage = err.data?.message || err.message || 'Failed to update profile. Please try again.';
      toast.error(errorMessage);
    }
  };

  const fileInputRef = React.useRef(null);
  const [previewUrl, setPreviewUrl] = React.useState(null);

  const handleFileChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, profilePicture: file }));
      setPreviewUrl(URL.createObjectURL(file));
    }
  }, []);

  const handleDeletePhoto = () => {
    setPreviewUrl(null);
    setFormData(prev => ({ ...prev, profilePicture: null }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const avatarSrc = previewUrl || user.profilePicture ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=8E5FD0&color=fff`;

  return (
    <div className="min-h-full" style={{ backgroundColor: '#DFCDFE' }}>
      {/* Hero Banner */}
      <div className="relative h-44 flex flex-col items-center justify-end pb-0"
        style={{ background: 'linear-gradient(135deg,#48306A,#8E5FD0)' }}>
        <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 80" preserveAspectRatio="none" style={{ height: 60 }}>
          <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" fill="#DFCDFE" />
        </svg>
        <div className="relative z-10 mb-[-88px]">
          <div className="h-56 w-56 rounded-full border-4 border-dashed border-white/70 p-1 bg-white/10">
            <img src={avatarSrc}
              onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=8E5FD0&color=fff`; }}
              alt="Profile" className="h-full w-full rounded-full object-cover" />
          </div>
        </div>
      </div>

      {/* Name + role */}
      <div className="flex flex-col items-center pt-28 pb-4" style={{ backgroundColor: '#DFCDFE' }}>
        <h2 className="text-xl font-extrabold text-slate-800">{user.name}</h2>
        <p className="text-sm text-slate-500 mt-0.5">{user.role}</p>

        {/* EOM badges */}
        {eomHistory.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mt-3">
            {eomHistory.map(win => (
              <div key={win._id}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full"
                style={{ boxShadow: '0 0 8px 1px rgba(251,191,36,0.3)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 text-amber-400">
                  <path fillRule="evenodd" d="M8 1.75a.75.75 0 0 1 .692.462l1.41 3.393 3.663.293a.75.75 0 0 1 .428 1.317l-2.79 2.39.853 3.575a.75.75 0 0 1-1.12.814L8 11.97l-3.126 1.92a.75.75 0 0 1-1.12-.814l.852-3.574-2.79-2.39a.75.75 0 0 1 .427-1.318l3.663-.293L7.308 2.212A.75.75 0 0 1 8 1.75Z" clipRule="evenodd" />
                </svg>
                EOM: {monthNames[win.month - 1]} {win.year}
              </div>
            ))}
          </div>
        )}

        {/* Upload/Delete photo */}
        {user.canEditProfile && (
          <div className="flex items-center gap-3 mt-4">
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="avatar-upload-profile" />
            <label htmlFor="avatar-upload-profile"
              className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold text-white cursor-pointer transition"
              style={{ background: 'linear-gradient(135deg,#48306A,#8E5FD0)' }}>
              <CameraIcon className="h-4 w-4" /> Upload
            </label>
            <button onClick={handleDeletePhoto}
              className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition">
              <TrashIcon className="h-4 w-4" /> Delete
            </button>
          </div>
        )}
      </div>

      {/* Form Card */}
      <div className="px-4 pb-10 max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-purple-100 p-8">

          {/* Personal Information */}
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-slate-800">Personal Information</h3>
            <p className="text-sm text-slate-400 mt-1">Manage Your Personal Information To Keep Your Account Accurate And Up To Date</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5 mb-8">
            <ProfileInputField label="Full Name"     name="name"          value={formData.name}          icon={UserIcon} onChange={handleChange} />
            <ProfileInputField label="E-Mail Address" name="email"        value={formData.email}         icon={EnvelopeIcon} type="email" onChange={handleChange} />
            <ProfileInputField label="Gender"        name="gender"        value={formData.gender}        icon={UserIcon} onChange={handleChange} />
            <ProfileInputField label="Qualification" name="qualification" value={formData.qualification} icon={AcademicCapIcon} onChange={handleChange} />
            <ProfileInputField label="Country"       name="country"       value={formData.country}       icon={GlobeAltIcon} onChange={handleChange} />
            <ProfileInputField label="City"          name="city"          value={formData.city}          icon={BuildingOfficeIcon} onChange={handleChange} />
            <ProfileInputField label="Address"       name="address"       value={formData.address}       icon={MapPinIcon} onChange={handleChange} />
          </div>

          {/* Divider */}
          <div className="border-t border-dashed border-slate-200 mb-6" />

          {/* Actions */}
          <div className="flex justify-center gap-4">
            <button onClick={() => {
                setFormData({ name: user.name||'', email: user.email||'', profilePicture: null, address: user.address||'', gender: user.gender||'', country: user.country||'', city: user.city||'', qualification: user.qualification||'' });
                setIsEditMode(false);
              }}
              className="px-8 py-2.5 rounded-full border border-slate-300 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">
              Cancel
            </button>
            {user.canEditProfile && (
              <button onClick={handleSave} disabled={isUpdating}
                className="px-8 py-2.5 rounded-full text-sm font-semibold text-white transition disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#48306A,#8E5FD0)' }}>
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Export the component without complex memoization
// The skip conditions in parent queries prevent re-renders
export const EmployeeProfile = EmployeeProfileContent;

const EmployeeDashboard = () => {
  const user = useSelector(selectCurrentUser);
  const dispatch = useDispatch();
  const [activeComponent, setActiveComponent] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [processPastDueTasks] = useProcessPastDueTasksMutation();
  const [logout] = useLogoutMutation();

  // Skip queries if user is not authenticated
  const isAuthenticated = !!user?._id;

  useEffect(() => {
    // When the employee's dashboard loads, trigger the backend to process any past-due tasks.
    // This automatically moves tasks to 'Pending Verification' after their due date has passed.
    if (isAuthenticated) {
      processPastDueTasks();
    }
  }, [processPastDueTasks, isAuthenticated]);


  const { data: allEmployees = [] } = useGetEmployeesQuery(undefined, { skip: !isAuthenticated });
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
    <div className="flex min-h-screen bg-[#DFCDFE] font-manrope text-slate-800 transition-colors p-3 gap-3">
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
      <div className="flex flex-1 flex-col overflow-hidden rounded-2xl bg-white shadow-sm">
        <AppHeader pageTitle={pageTitles[activeComponent]} onMenuClick={() => setSidebarOpen(true)} setActiveComponent={setActiveComponent} />
        <main className="flex-1 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
   );
};

export default EmployeeDashboard;
 