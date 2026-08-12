import React, { useState, useEffect, useMemo } from 'react';
import {
  HomeIcon, UserGroupIcon, PencilSquareIcon, InformationCircleIcon, CalendarDaysIcon, ArchiveBoxIcon, ClipboardDocumentListIcon, CheckBadgeIcon, ChartBarIcon, CalendarIcon, ArrowLeftIcon, BuildingLibraryIcon, Bars3Icon, BellIcon, CheckCircleIcon, ArrowRightOnRectangleIcon, ChevronDoubleLeftIcon, Cog8ToothIcon, ClockIcon, ArrowTrendingUpIcon, PlusIcon, BriefcaseIcon
} from '@heroicons/react/24/outline';
import { DocumentTextIcon, UsersIcon, EyeIcon } from '@heroicons/react/24/solid';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUser } from '../app/authSlice';
import { apiSlice, useLogoutMutation } from '../services/apiSlice';
import { useGetEmployeesQuery, useProcessPastDueTasksMutation, useGetAllTasksQuery, useGetTasksForApprovalQuery, useGetActiveAnnouncementQuery } from '../services/EmployeApi';
import toast from 'react-hot-toast'; 
import AssignTask from './AssignTask.jsx';
import TaskApprovals from '../Admin/TaskApprovals';
import ThemeToggle from '../ThemeToggle.jsx';
import HolidayManagement from '../Admin/HolidayManagement.jsx';
import LeaveManagement from '../Admin/LeaveManagement.jsx';
import AnnouncementWidget from '../services/AnnouncementWidget.jsx';
import AttendanceCalendar from '../services/AttendanceCalendar.jsx';
import AllEmployeeAttendance from '../Admin/AllEmployeeAttendance.jsx';
import ViewTeamTasks from './ViewTeamTasks.jsx';
import { TeamReports } from '../Admin/AdminDashboard.jsx';
import { Dashboard as EmployeeDashboardHome, MyTasks, MyReportHistory, MyDailyReport, MyAttendance, EmployeeProfile as ManagerProfile, TeamInformation, Analytics } from '../Employee/EmployeDashboard.jsx';
import starPublicityLogo from '../assets/starpublicity.png';
import volgaInfosysLogo from '../assets/volgainfosys.png';
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

const DonutChart = ({ segments, total, size = 160 }) => {
  const [hovered, setHovered] = React.useState(null);
  const cx = size / 2, cy = size / 2;
  const r = Math.floor(size * 0.36), strokeW = Math.floor(size * 0.175), gapDeg = 6;
  const circ = 2 * Math.PI * r;
  const gapFrac = gapDeg / 360;

  const slices = React.useMemo(() => {
    let cum = 0;
    return segments.map(s => {
      const pct     = s.val / (total || 1);
      const arcFrac = Math.max(pct - gapFrac, 0.01);
      const dash    = arcFrac * circ;
      const offset  = -(cum * circ) + circ * 0.25;
      cum += pct;
      return { ...s, dash, offset };
    });
  }, [segments, total, circ, gapFrac]);

  return (
    <div className="flex items-center gap-6">
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} onMouseLeave={() => setHovered(null)}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f0fa" strokeWidth={strokeW} />
          {slices.map((s) => {
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

const isSameDay = (date1, date2) => {
  if (!date1 || !date2) return false;
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
};


const ManagerDashboardContent = ({ user, onNavigate }) => {
  // Skip queries if user is not authenticated
  const isAuthenticated = !!user?._id;
  const { data: allTasks = [], isLoading: isLoadingTasks } = useGetAllTasksQuery(undefined, { skip: !isAuthenticated });
  const { data: allEmployees = [], isLoading: isLoadingEmployees } = useGetEmployeesQuery(undefined, { skip: !isAuthenticated });
  const { data: tasksForApproval = [], isLoading: isLoadingApprovals } = useGetTasksForApprovalQuery(undefined, { pollingInterval: 30000, skip: !isAuthenticated });
  const { data: announcement } = useGetActiveAnnouncementQuery(undefined, { skip: !isAuthenticated });

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

  // Team member IDs (direct & indirect)
  const teamMemberIds = useMemo(() => {
    if (!allEmployees || !user?._id) return new Set();
    const getAllSubordinates = (managerId, employees) => {
      const getTeamLeadId = (emp) => emp.teamLead?._id ? String(emp.teamLead._id) : (emp.teamLead ? String(emp.teamLead) : null);
      const subordinates = [];
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
    return new Set(getAllSubordinates(user._id, allEmployees).map(e => String(e._id)));
  }, [allEmployees, user]);

  const filteredTeamTasks = useMemo(() => {
    if (!dateRange.startDate || !dateRange.endDate) return [];
    const start = new Date(dateRange.startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(dateRange.endDate);
    end.setHours(23, 59, 59, 999);
    
    return allTasks.filter(task => {
      const id = task.assignedTo?._id || task.assignedTo;
      const taskDate = new Date(task.createdAt || task.updatedAt);
      return id && teamMemberIds.has(String(id)) && taskDate >= start && taskDate <= end;
    });
  }, [allTasks, teamMemberIds, dateRange]);

  // Stats & next due dates
  const stats = useMemo(() => {
    const now = new Date();
    const todayUTCStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    let teamUpcomingDueDate = null;
    let teamUpcomingTaskTitle = '';
    const taskStats = { completed: 0, inProgress: 0, pending: 0, pendingVerification: 0, notCompleted: 0 };

    let tasksThisPeriod = filteredTeamTasks.length;
    let completedThisPeriod = 0;

    const teamPendingApprovals = tasksForApproval.filter(t => {
      const id = t.assignedTo?._id || t.assignedTo;
      return id && teamMemberIds.has(String(id));
    });

    filteredTeamTasks.forEach(task => {
      if (task.status === 'Completed') {
        taskStats.completed++;
        completedThisPeriod++;
      }
      else if (task.status === 'In Progress') taskStats.inProgress++;
      else if (task.status === 'Pending Verification') taskStats.pendingVerification++;
      else if (task.status === 'Pending') taskStats.pending++;
      else if (task.status === 'Not Completed') taskStats.notCompleted++;

      if (['Pending', 'In Progress'].includes(task.status) && task.dueDate && safeDate(task.dueDate) >= todayUTCStart) {
        const dueDate = safeDate(task.dueDate);
        if (!teamUpcomingDueDate || dueDate < teamUpcomingDueDate) {
          teamUpcomingDueDate = dueDate;
          teamUpcomingTaskTitle = task.title;
        }
      }
    });

    return {
      teamMemberCount: teamMemberIds.size,
      totalTeamTasks: tasksThisPeriod,
      tasksThisPeriod,
      completedThisPeriod,
      pendingApprovalsCount: teamPendingApprovals.length,
      pendingApprovalTasks: teamPendingApprovals.slice(0, 5),
      teamUpcomingDueDate,
      teamUpcomingTaskTitle,
      taskStats,
    };
  }, [filteredTeamTasks, teamMemberIds, tasksForApproval, user]);

  // Calculate Top Performing Team Members
  const topTeamMembers = useMemo(() => {
    const members = Array.from(teamMemberIds).map(id => allEmployees.find(e => e._id === id)).filter(Boolean);
    return members.map(member => {
      const mTasks = filteredTeamTasks.filter(t => {
        const id = t.assignedTo?._id || t.assignedTo;
        return id && String(id) === String(member._id) && ['Completed', 'Not Completed'].includes(t.status);
      });
      const totalProgress = mTasks.reduce((acc, t) => acc + (t.progress || 0), 0);
      const score = mTasks.length > 0 ? (totalProgress / mTasks.length) : 0;
      const completedCount = mTasks.filter(t => t.status === 'Completed').length;
      return { employee: member, totalScore: score, completed: completedCount };
    }).sort((a, b) => b.totalScore - a.totalScore).slice(0, 4);
  }, [teamMemberIds, allEmployees, filteredTeamTasks]);

  // Dynamic Trend Data
  const trendData = useMemo(() => {
    const data = [['Day', 'Performance']];
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
      const completedTasks = filteredTeamTasks.filter(t => t.completionDate && isSameDay(safeDate(t.completionDate), d));
      const avgScore = completedTasks.length > 0 ? completedTasks.reduce((acc, t) => acc + (t.progress || 0), 0) / completedTasks.length : 0;
      data.push([d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), parseFloat(avgScore.toFixed(1))]);
    }
    return data;
  }, [filteredTeamTasks, dateRange]);

  // Dynamic Tasks Due This Period
  const tasksDueThisPeriod = useMemo(() => {
    if (!dateRange.startDate || !dateRange.endDate) return [];
    const start = new Date(dateRange.startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(dateRange.endDate);
    end.setHours(23, 59, 59, 999);
    
    return allTasks
      .filter(t => {
        const id = t.assignedTo?._id || t.assignedTo;
        return id && teamMemberIds.has(String(id)) && t.dueDate && safeDate(t.dueDate) >= start && safeDate(t.dueDate) <= end && !['Completed', 'Not Completed'].includes(t.status);
      })
      .sort((a, b) => safeDate(a.dueDate).getTime() - safeDate(b.dueDate).getTime())
      .slice(0, 3);
  }, [allTasks, teamMemberIds, dateRange]);

  // Dynamic System Activities
  const dynamicSystemActivities = useMemo(() => {
    return filteredTeamTasks.slice().sort((a, b) => safeDate(b.updatedAt || b.createdAt).getTime() - safeDate(a.updatedAt || a.createdAt).getTime()).slice(0, 4).map((t, i) => {
      const colors = ["bg-indigo-500", "bg-emerald-500", "bg-blue-500", "bg-orange-500"];
      return { id: t._id, action: `Task "${t.title}" is ${t.status}`, user: t.assignedTo?.name || 'System', time: safeDate(t.updatedAt || t.createdAt).toLocaleDateString(), color: colors[i % colors.length] };
    });
  }, [filteredTeamTasks]);

  // Chart data
  const taskChartData = [
    { name: 'Completed', value: stats?.taskStats?.completed || 0 },
    { name: 'In Progress', value: stats?.taskStats?.inProgress || 0 },
    { name: 'Pending', value: stats?.taskStats?.pending || 0 },
    { name: 'Verification', value: stats?.taskStats?.pendingVerification || 0 },
    { name: 'Not Completed', value: stats?.taskStats?.notCompleted || 0 },
  ].filter(entry => entry.value > 0);

  const TASK_COLORS = { 'Completed': '#10B981', 'In Progress': '#3B82F6', 'Pending': '#F59E0B', 'Verification': '#8B5CF6', 'Not Completed': '#F97316', 'No Tasks': '#e2e8f0' };

  const currentWeek = useMemo(() => {
    const today = new Date();
    const firstDay = new Date(today.setDate(today.getDate() - today.getDay()));
    const lastDay = new Date(today.setDate(today.getDate() - today.getDay() + 6));
    return `${firstDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${lastDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  }, []);

  // Compute Actual Live Team Attendance dynamically from Task Activity Logs
  const teamAttendanceData = useMemo(() => {
    const days = [];
    if (!dateRange.startDate || !dateRange.endDate) return { days, totalPresentDays: 0, totalWorkingDays: 0, overallPresent: 0 };
    
    const start = new Date(dateRange.startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(dateRange.endDate);
    end.setHours(23, 59, 59, 999);

    const now = new Date();
    const evaluatedEnd = end > now ? now : end; 
    
    const daysCount = Math.max(0, Math.floor((evaluatedEnd - start) / (1000 * 60 * 60 * 24)) + 1);

    let totalPresentDays = 0;

    for (let i = 0; i < daysCount; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const nextDay = new Date(d);
      nextDay.setDate(nextDay.getDate() + 1);

      const activeMembers = new Set();
      allTasks.forEach(t => {
        const id = t.assignedTo?._id || t.assignedTo;
        if (id && teamMemberIds.has(String(id))) {
          const updated = safeDate(t.updatedAt || t.createdAt);
          if (updated >= d && updated < nextDay) activeMembers.add(String(id));
        }
      });
      const presentCount = activeMembers.size;
      totalPresentDays += presentCount;
      days.push({
         dayStr: d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
         presentCount,
         isFuture: d > new Date()
      });
    }

    const totalWorkingDays = teamMemberIds.size * daysCount;
    const overallPresent = totalWorkingDays > 0 ? Math.round((totalPresentDays / totalWorkingDays) * 100) : 0;
    return { days, totalPresentDays, totalWorkingDays, overallPresent: Math.min(overallPresent, 100) };
  }, [allTasks, teamMemberIds, dateRange]);

  if (isLoadingTasks || isLoadingEmployees || isLoadingApprovals) {
    return (
      <div className="min-h-full flex items-center justify-center" style={{ backgroundColor: '#DFCDFE' }}>
        <p className="text-slate-500 font-medium">Loading dashboard...</p>
      </div>
    );
  }

  // --- Manager Dashboard ---
  return (
    <div className="min-h-screen p-6 lg:p-8 font-manrope" style={{ backgroundColor: '#DFCDFE' }}>
      <AnnouncementWidget />

      {/* Welcome Banner — purple gradient */}
      <div className="mb-8 flex flex-col md:flex-row items-center justify-between gap-6 rounded-2xl px-8 py-8 text-white"
        style={{ background: 'linear-gradient(135deg,#48306A,#8E5FD0)' }}>
        <div>
          <h1 className="text-2xl font-extrabold uppercase tracking-wide">Welcome Back, {user?.name?.split(' ')[0] || 'Manager'}!</h1>
          <p className="text-sm mt-2 text-purple-200">Monitor Your Team's Performance, Task Progress And Activities From One Place</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* Week/Month/Custom toggle */}
          <div className="flex items-center bg-white/10 rounded-xl p-1">
            {['week','month','custom'].map(t => (
              <button key={t} onClick={() => setFilterType(t)}
                className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all ${
                  filterType === t
                    ? 'bg-white text-purple-800 shadow-sm'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {/* Date range */}
          <div className="flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2.5">
            <CalendarIcon className="h-4 w-4 text-purple-200 flex-shrink-0" />
            <input
              type="date"
              value={dateRange.startDate}
              onChange={e => { setDateRange(p => ({ ...p, startDate: e.target.value })); setFilterType('custom'); }}
              onFocus={() => setFilterType('custom')}
              className="text-sm font-semibold text-white bg-transparent px-1 py-0.5 rounded outline-none [color-scheme:dark]"
            />
            <span className="text-purple-300 font-bold">-</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={e => { setDateRange(p => ({ ...p, endDate: e.target.value })); setFilterType('custom'); }}
              onFocus={() => setFilterType('custom')}
              className="text-sm font-semibold text-white bg-transparent px-1 py-0.5 rounded outline-none [color-scheme:dark]"
            />
          </div>

          {/* Assign Task */}
          <button onClick={() => onNavigate('assign-task')}
            className="flex items-center gap-2 bg-white text-purple-800 hover:bg-purple-50 font-bold py-2.5 px-5 rounded-xl shadow-sm transition text-sm whitespace-nowrap">
            <PlusIcon className="h-4 w-4" /> Assign Task
          </button>
        </div>
      </div>

      {/* Core Stats Grid (5 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 lg:gap-6 mb-8">
        <StatCard title="Team Members" value={stats?.teamMemberCount ?? 0} subtext="Total Members" icon={UsersIcon} />
        <StatCard title="Total Tasks" value={stats?.tasksThisPeriod ?? 0} subtext="Selected Period" icon={BriefcaseIcon} />
        <StatCard title="Pending Approvals" value={stats?.pendingApprovalsCount ?? 0} isWarning subtext="Needs Your Action" icon={ClockIcon} />
        <StatCard title="Completed Tasks" value={stats?.completedThisPeriod ?? 0} isSuccess subtext="Selected Period" icon={CheckCircleIcon} />
        <StatCard title="Team Progress" value={`${trendData.length > 1 ? trendData[trendData.length - 1][1] : 0}%`} trend="Overall Progress" icon={ArrowTrendingUpIcon} isInfo />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Team Task Status */}
        <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-6 flex flex-col">
          <h3 className="text-base font-bold text-slate-800 mb-1">Team Task Status</h3>
          <p className="text-xs text-slate-400 mb-4">Task breakdown for selected period</p>
          <div className="flex-1 mt-2">
            <DonutChart
              total={stats?.totalTeamTasks ?? 0}
              size={220}
              segments={taskChartData.map(d => ({ label: d.name, val: d.value, color: TASK_COLORS[d.name] }))}
            />
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-6 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-bold text-slate-800">Pending Approvals</h3>
            <button onClick={() => onNavigate('task-approvals')}
              className="text-xs font-bold px-3 py-1 rounded-lg text-white transition"
              style={{ background: 'linear-gradient(135deg,#48306A,#8E5FD0)' }}>
              View All
            </button>
          </div>
          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            {stats?.pendingApprovalTasks?.length > 0 ? stats.pendingApprovalTasks.map((task) => (
              <div key={task._id} onClick={() => onNavigate('task-approvals')}
                className="p-3 border border-purple-100 rounded-xl flex items-center justify-between hover:bg-purple-50 transition cursor-pointer">
                <div className="flex items-center gap-3">
                  <img src={task.assignedTo?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(task.assignedTo?.name || 'User')}&background=8E5FD0&color=fff`}
                    className="h-8 w-8 rounded-full object-cover border-2 border-purple-100 flex-shrink-0" alt="User"
                    onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(task.assignedTo?.name || 'User')}&background=8E5FD0&color=fff`; }} />
                  <div>
                    <p className="font-bold text-sm text-slate-800 truncate max-w-[130px]">{task.assignedTo?.name}</p>
                    <p className="text-[10px] text-slate-400">{safeDate(task.submittedForCompletionDate || task.updatedAt || task.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-purple-600 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full">Review</span>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                <CheckCircleIcon className="h-10 w-10 text-emerald-400 mb-2" />
                <p className="font-semibold text-sm">All caught up!</p>
              </div>
            )}
          </div>
        </div>

        {/* Performance Trend */}
        <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-6">
          <h3 className="text-base font-bold text-slate-800 mb-2">Team Performance Trend</h3>
          <div className="relative h-60 -ml-4 -mb-2">
            <GoogleAreaChart data={trendData} colors={['#8E5FD0']} />
          </div>
        </div>
      </div>

      {/* Lower Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* My Team Overview */}
        <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-6 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-bold text-slate-800">My Team Overview</h3>
            <button onClick={() => onNavigate('team-info')}
              className="text-xs font-bold px-3 py-1 rounded-lg text-white transition"
              style={{ background: 'linear-gradient(135deg,#48306A,#8E5FD0)' }}>
              View All
            </button>
          </div>
          <div className="space-y-4 flex-1">
            {topTeamMembers?.map((member, i) => (
              <div key={i} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={member.employee?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.employee?.name || 'User')}&background=8E5FD0&color=fff`}
                    alt="Avatar"
                    onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.employee?.name || 'User')}&background=8E5FD0&color=fff`; }}
                    className="h-9 w-9 rounded-full object-cover border-2 border-purple-100 flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{member.employee?.name || 'Unknown'}</p>
                    <p className="text-[11px] text-slate-400 truncate">{member.employee?.role || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="w-20 h-1.5 bg-purple-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${Math.min(member.totalScore, 100)}%`, background: 'linear-gradient(90deg,#48306A,#8E5FD0)' }} />
                  </div>
                  <span className="text-xs font-bold text-purple-600">{Math.min(member.totalScore, 100).toFixed(0)}%</span>
                </div>
              </div>
            ))}
            {(!topTeamMembers || topTeamMembers.length === 0) && <p className="text-sm text-slate-400">No team data available.</p>}
            <button onClick={() => onNavigate('team-info')} className="w-full text-center text-xs font-bold text-purple-600 mt-auto pt-4 border-t border-purple-50 hover:underline">View Full Team</button>
          </div>
        </div>

        {/* Tasks Due This Period */}
        <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-bold text-slate-800">Tasks Due This Period</h3>
            <button onClick={() => onNavigate('view-team-tasks')}
              className="text-xs font-bold px-3 py-1 rounded-lg text-white transition"
              style={{ background: 'linear-gradient(135deg,#48306A,#8E5FD0)' }}>
              View All
            </button>
          </div>
          <div className="space-y-3">
            {tasksDueThisPeriod?.map(task => (
              <div key={task._id} className="p-3 rounded-xl bg-purple-50 border border-purple-100 flex justify-between items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">{task.title}</p>
                  <p className="text-[11px] text-slate-400">{new Date(task.dueDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                </div>
                <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full flex-shrink-0 ${task.priority === 'High' ? 'bg-red-100 text-red-700 border border-red-200' : task.priority === 'Medium' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'}`}>
                  {task.priority || 'Medium'}
                </span>
              </div>
            ))}
            {(!tasksDueThisPeriod || tasksDueThisPeriod.length === 0) && <p className="text-sm text-slate-400">No tasks due in this period.</p>}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-6">
          <h3 className="text-base font-bold text-slate-800 mb-4">Recent Activities</h3>
          <div className="relative border-l-2 border-purple-100 ml-3 space-y-5">
            {dynamicSystemActivities?.map(activity => (
              <div key={activity.id} className="relative pl-6">
                <span className="absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 border-white"
                  style={{ background: 'linear-gradient(135deg,#48306A,#8E5FD0)' }} />
                <p className="text-sm font-bold text-slate-800 leading-tight break-words pr-2">{activity.action}</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-[10px] font-bold text-purple-400">{activity.user}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{activity.time}</p>
                </div>
              </div>
            ))}
            {(!dynamicSystemActivities || dynamicSystemActivities.length === 0) && <p className="text-sm text-slate-400">No recent activities.</p>}
          </div>
        </div>
      </div>

      {/* Team Attendance */}
      <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-6">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="flex-1 w-full">
            <h3 className="text-base font-bold text-slate-800 mb-4">Team Attendance</h3>
            <div className="flex justify-between items-center w-full px-2 overflow-x-auto pb-2">
              {teamAttendanceData.days.map((day, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2 flex-shrink-0 px-2">
                  <div className={`h-10 w-10 rounded-full border-2 flex items-center justify-center ${day.presentCount > 0 ? 'border-purple-400 bg-purple-50' : day.isFuture ? 'border-slate-200 border-dashed' : 'border-slate-200 border-dashed'}`}>
                    {day.presentCount > 0 && <CheckCircleIcon className="h-5 w-5 text-purple-500" />}
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{day.dayStr}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="w-full lg:w-auto lg:border-l border-purple-100 lg:pl-8 grid grid-cols-2 gap-4 min-w-[280px]">
            <div><p className="text-xl font-black text-purple-600">{teamAttendanceData.overallPresent}%</p><p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Overall Present</p></div>
            <div><p className="text-xl font-black text-slate-800">{teamAttendanceData.totalPresentDays}/{teamAttendanceData.totalWorkingDays}</p><p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Total Presence</p></div>
            <div><p className="text-xl font-black text-slate-800">{teamAttendanceData.totalPresentDays * 8}h</p><p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Working Hours</p></div>
            <div><p className="text-xl font-black text-orange-500">0</p><p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Total Leaves</p></div>
          </div>
        </div>
      </div>

    </div>
  );
};

const ManagerDashboard = () => {

  const [activeView, setActiveView] = useState({ component: 'dashboard', props: {} });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSidebarHovering, setIsSidebarHovering] = useState(false);

  const isSidebarExpanded = !isSidebarCollapsed || isSidebarHovering;

  const [processPastDueTasks] = useProcessPastDueTasksMutation();
  const [logout] = useLogoutMutation();

  useEffect(() => {
    // When the manager's dashboard loads, trigger the backend to process any past-due tasks.
    // This automatically moves tasks to 'Pending Verification' after their due date has passed.
    processPastDueTasks();
  }, [processPastDueTasks]);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const user = useSelector(selectCurrentUser); 
  const { data: allEmployees = [] } = useGetEmployeesQuery();
  const isHrHead = user?.department === 'Human Resource' && user?.role === 'HR Head';
  const isHr = isHrHead || user?.role === 'HR Executive';
  const hasTeam = useMemo(() => {
    if (!user?.canViewTeam || !allEmployees.length) {
      return false;
    }
    const getAllSubordinates = (managerId, employees) => {
      const getTeamLeadId = (emp) => emp.teamLead?._id ? String(emp.teamLead._id) : (emp.teamLead ? String(emp.teamLead) : null);
      const subordinates = [];
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
    return getAllSubordinates(user._id, allEmployees).length > 0;
  }, [user, allEmployees]);
  const dispatch = useDispatch();

  const handleRefresh = () => {
    // Invalidate specific tags to refetch data without a full state reset
    dispatch(apiSlice.util.invalidateTags([
      'Employee',
      'Task',
      'Notification',
      'Report',
      'Leave',
      'Holiday',
      'Announcement',
      'EOMHistory'
    ]));
    toast.success("Dashboard data refreshed!");
  };

  const pageTitles = {
    dashboard: 'Dashboard',
    'assign-task': 'Assign Task',
    'view-team-tasks': 'View Team Tasks',
    'task-approvals': 'Pending Approvals',
    'team-reports': 'Team Reports',
    'team-info': 'Team Information',
    'analytics': 'Team Performance Analytics',
    'profile': 'My Profile'
  };

  const handleNavigation = (view) => {
    if (typeof view === 'string') {
      setActiveView({ component: view, props: {} });
    } else {
      setActiveView(view);
    }
  };

  useEffect(() => {
    // If the active component is a team-only component and the user has no team,
    // default back to the dashboard.
    const teamComponents = ['team-reports', 'team-info', 'task-approvals', 'assign-task', 'view-team-tasks'];
    // The 'setIsNotificationOpen' variable is not defined in this component.
    // If you intended to manage a notification state here, you need to declare it using useState.
    // For now, removing the problematic line to resolve the ReferenceError.
    if (!hasTeam && teamComponents.includes(activeView.component)) { setActiveView({ component: 'dashboard', props: {} }); }
  }, [hasTeam, activeView.component]);

    const renderActiveComponent = () => {
      switch (activeView.component) {
        case 'dashboard': return <ManagerDashboardContent user={user} onNavigate={handleNavigation} />; // This is the manager-specific one
        case 'team-reports': return <TeamReports seniorId={user._id} />;
        case 'team-info': return <TeamInformation seniorId={user?._id} />;
        case 'profile': return <ManagerProfile user={user} />;
        case 'analytics': return <Analytics user={user} />;
        case 'task-approvals': return <TaskApprovals />;
        case 'assign-task': return <AssignTask teamLeadId={user._id} />;
        case 'view-team-tasks': return <ViewTeamTasks teamLeadId={user._id} {...activeView.props} />;
        default: return <ManagerDashboardContent user={user} onNavigate={handleNavigation} />;
      }
    };

    return (
    <div className="flex min-h-screen font-manrope p-3 gap-3" style={{ backgroundColor: '#DFCDFE' }}>
        <style>
          {`
            @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');
            .font-manrope {
              font-family: 'Manrope', sans-serif;
            }
          `}
        </style>
      <Sidebar 
        activeComponent={activeView.component} 
        setActiveComponent={handleNavigation} 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        isCollapsed={isSidebarCollapsed} 
        setIsCollapsed={setIsSidebarCollapsed} 
      />
        {/* Overlay for mobile sidebar */}
        {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)}></div>}
      <div className="flex flex-1 flex-col overflow-hidden rounded-2xl bg-white shadow-sm">
        <AppHeader pageTitle={pageTitles[activeView.component] || 'Dashboard'} onMenuClick={() => setSidebarOpen(true)} setActiveComponent={handleNavigation} />
        <main className="flex-1 overflow-y-auto" style={{ backgroundColor: '#DFCDFE' }}>{renderActiveComponent()}</main>
      </div>
    </div>
    );
  }

export default ManagerDashboard;
