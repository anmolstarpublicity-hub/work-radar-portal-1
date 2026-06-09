import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { UsersIcon, BriefcaseIcon, ClockIcon, TrophyIcon, CheckBadgeIcon, MegaphoneIcon, ChartBarIcon, ServerStackIcon, CodeBracketIcon, UserGroupIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import { ArrowTrendingUpIcon } from '@heroicons/react/24/solid';
import { useGetDashboardStatsQuery, useGetAllTasksQuery, useGetEmployeeOfTheMonthCandidatesQuery, useGetActiveAnnouncementQuery, useGetTasksForApprovalQuery, useGetEmployeesQuery } from '../services/EmployeApi';
import GooglePieChart from './GooglePieChart.jsx';
import GoogleAreaChart from './GoogleAreaChart.jsx';
import StatCard from '../components/StatCard.jsx';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../app/authSlice';
import { CalendarIcon } from '@heroicons/react/24/outline';

const safeDate = (dateVal) => {
  if (!dateVal) return new Date();
  const d = new Date(dateVal);
  return isNaN(d.getTime()) ? new Date() : d;
};

const formatDueDate = (dateString) => {
  if (!dateString) return 'N/A';
  // Create dates in a way that ignores time and timezone for comparison
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const dateObj = new Date(dateString);
  const dateObjStart = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());

  if (dateObjStart.getTime() === todayStart.getTime()) {
    return 'Today';
  }
  return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const isSameDay = (date1, date2) => {
  if (!date1 || !date2) return false;
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
};

const Countdown = ({ toDate }) => {
  const calculateTimeLeft = useCallback(() => {
    const difference = +new Date(toDate) - +new Date();
    let timeLeft = {};

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      };
    }
    return timeLeft;
  }, [toDate]);

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    // Set up an interval to update the countdown every minute
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 60000); // 60000 ms = 1 minute

    // Clear the interval when the component unmounts or toDate changes
    return () => clearInterval(timer);
  }, [calculateTimeLeft]);

  if (!timeLeft.days && !timeLeft.hours) return <span className="text-yellow-300">Expires soon</span>;

  return (
    <span className="text-yellow-300">
      {timeLeft.days > 0 && `${timeLeft.days}d `}
      {timeLeft.hours > 0 && `${timeLeft.hours}h `}
      left
    </span>
  );
};

const Dashboard = ({ onNavigate }) => {
  const user = useSelector(selectCurrentUser);

  const [filterType, setFilterType] = useState('week'); // 'week', 'month', 'custom'
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

  const { data: stats, isLoading: isLoadingStats } = useGetDashboardStatsQuery();
  const { data: allTasks = [], isLoading: isLoadingTasks } = useGetAllTasksQuery();
  const { data: eomCandidates = [], isLoading: isLoadingEOM } = useGetEmployeeOfTheMonthCandidatesQuery({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });
  const { data: announcement, isLoading: isLoadingAnnouncement } = useGetActiveAnnouncementQuery();
  const { data: approvalTasks = [] } = useGetTasksForApprovalQuery();
  const { data: allEmployees = [] } = useGetEmployeesQuery();

  const isLoading = isLoadingStats || isLoadingTasks || isLoadingEOM || isLoadingAnnouncement;

  const filteredAllTasks = useMemo(() => {
    if (!dateRange.startDate || !dateRange.endDate) return allTasks;
    const start = new Date(dateRange.startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(dateRange.endDate);
    end.setHours(23, 59, 59, 999);
    
    return allTasks.filter(task => {
      const taskDate = new Date(task.createdAt || task.updatedAt);
      return taskDate >= start && taskDate <= end;
    });
  }, [allTasks, dateRange]);

  const dashboardData = useMemo(() => {
    if (isLoading) return null;

    const topCandidate = eomCandidates[0];

    const taskChartData = [
      { name: 'Pending', value: filteredAllTasks.filter(t => t.status === 'Pending').length },
      { name: 'In Progress', value: filteredAllTasks.filter(t => t.status === 'In Progress').length },
      { name: 'Verification', value: filteredAllTasks.filter(t => t.status === 'Pending Verification').length },
      { name: 'Completed', value: filteredAllTasks.filter(t => t.status === 'Completed').length },
      { name: 'Not Completed', value: filteredAllTasks.filter(t => t.status === 'Not Completed').length },
    ].filter(entry => entry.value > 0);

    const tasksCompletedThisPeriod = filteredAllTasks.filter(t => t.status === 'Completed').length;

    const totalManagers = allEmployees.filter(emp => emp.dashboardAccess === 'Manager Dashboard').length || 0;
    const totalEmployeesVal = allEmployees.filter(emp => emp.dashboardAccess !== 'Manager Dashboard' && emp.role !== 'Admin' && emp.role !== 'Super Admin').length || 0;
    const totalUsers = allEmployees.length || (totalEmployeesVal + totalManagers + 1);
    const activeDepartments = new Set(allEmployees.map(emp => emp.department).filter(Boolean)).size || 0;

    return {
      totalEmployees: totalEmployeesVal,
      totalManagers,
      totalUsers,
      activeDepartments,
      tasksPendingVerification: filteredAllTasks.filter(t => t.status === 'Pending Verification').length,
      totalTasks: filteredAllTasks.length || 0,
      topCandidate,
      taskChartData,
      upcomingManagerTask: stats?.upcomingManagerTask,
      tasksCompletedThisPeriod,
    };
  }, [isLoading, stats, filteredAllTasks, eomCandidates, allEmployees]);

  const TASK_COLORS = {
    'Completed': '#10B981',
    'In Progress': '#3B82F6',
    'Pending': '#F59E0B',
    'Verification': '#8B5CF6',
    'Not Completed': '#F97316',
    'No Tasks': '#e2e8f0'
  };

  // Dynamic Trend Data
  const trendData = useMemo(() => {
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
      const completedCount = allTasks.filter(t => t.completionDate && isSameDay(safeDate(t.completionDate), d)).length;
      data.push([d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), completedCount]);
    }
    return data;
  }, [allTasks, dateRange]);

  // Dynamic System Activities
  const dynamicSystemActivities = useMemo(() => {
    return filteredAllTasks.slice().sort((a, b) => safeDate(b.updatedAt || b.createdAt).getTime() - safeDate(a.updatedAt || a.createdAt).getTime()).slice(0, 4).map((t, i) => {
      const colors = ["bg-indigo-500", "bg-emerald-500", "bg-blue-500", "bg-orange-500"];
      return { id: t._id, action: `Task "${t.title}" marked as ${t.status}`, user: t.assignedTo?.name || 'System', time: safeDate(t.updatedAt || t.createdAt).toLocaleDateString(), color: colors[i % colors.length] };
    });
  }, [filteredAllTasks]);

  // Platform Analytics Calculation
  const platformAnalytics = useMemo(() => {
    const completed = filteredAllTasks.filter(t => t.status === 'Completed').length;
    const total = filteredAllTasks.length;
    const completionRate = total > 0 ? ((completed / total) * 100).toFixed(2) : 0;
    const onTime = filteredAllTasks.filter(t => t.status === 'Completed' && safeDate(t.completionDate) <= safeDate(t.dueDate)).length;
    const onTimeRate = completed > 0 ? ((onTime / completed) * 100).toFixed(0) : 0;
    const avgRating = eomCandidates.length > 0 ? (eomCandidates.reduce((acc, c) => acc + c.totalScore, 0) / eomCandidates.length / 20).toFixed(1) : '4.6'; 
    const activeUsers = new Set(filteredAllTasks.map(t => {
      const id = t.assignedTo?._id || t.assignedTo;
      return id ? String(id) : null;
    }).filter(Boolean)).size;
    
    return { completionRate, onTimeRate, avgRating, activeUsers };
  }, [filteredAllTasks, eomCandidates]);

  if (isLoading) {
    return <div className="p-8 text-center">Loading dashboard...</div>;
  }

  const userDistData = [
    {name: 'Employees', value: dashboardData?.totalEmployees || 0},
    {name: 'Managers', value: dashboardData?.totalManagers || 0}
  ].filter(x => x.value > 0);

  // --- Clean Executive Layout ---
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-manrope text-slate-800 dark:text-slate-200 p-6 lg:p-8">

      {/* Blueprint Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white">Welcome back, {user?.name?.split(' ')[0] || 'Admin'}! 👋</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Here's your system overview for the selected period.</p>
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
                {user?.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'SA'}
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-slate-800 dark:text-white">{user?.name || 'Super Administrator'}</p>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{user?.role || 'System Admin'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 lg:gap-6 mb-8">
        <StatCard title="Total Users" value={dashboardData?.totalUsers || 0} trend="+12%" icon={UsersIcon} />
        <StatCard title="Total Managers" value={dashboardData?.totalManagers || 0} trend="+8%" icon={BriefcaseIcon} />
        <StatCard title="Total Employees" value={dashboardData?.totalEmployees || 0} trend="+15%" icon={UserGroupIcon} />
        <StatCard title="Total Tasks" value={dashboardData?.totalTasks || 0} subtext="Selected Period" icon={ClipboardDocumentListIcon} />
        <StatCard title="Tasks Completed" value={dashboardData?.tasksCompletedThisPeriod || 0} subtext={`${platformAnalytics.completionRate}% Completion`} isSuccess icon={CheckBadgeIcon} />
        <StatCard title="Pending Approvals" value={dashboardData?.tasksPendingVerification || 0} isWarning subtext="Requires Attention" icon={ClockIcon} />
      </div>

      {/* Data Visualization & Analytics Middle Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* Task Overview Donut */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm flex flex-col justify-center">
          <h3 className="text-base font-bold text-slate-800 dark:text-white mb-4">Platform Task Overview</h3>
          <div className="flex-1 flex flex-col sm:flex-row items-center gap-4 sm:gap-0">
            <div className="relative h-48 w-48 flex-shrink-0 mx-auto sm:mx-0">
              {dashboardData?.taskChartData?.length > 0 ? (
                <GooglePieChart data={dashboardData.taskChartData} title="" colors={TASK_COLORS} pieHole={0.65} is3D={false} hideLegend={true} />
              ) : (
                <GooglePieChart data={[{name: 'No Tasks', value: 1}]} title="" colors={{'No Tasks': '#e2e8f0'}} pieHole={0.65} is3D={false} hideLegend={true} />
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-1">
                <p className="text-2xl font-black text-slate-800 dark:text-white leading-none">{dashboardData?.totalTasks || 0}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Total</p>
              </div>
            </div>
            <div className="flex-1 flex flex-col justify-center gap-3 sm:pl-6 w-full">
              {dashboardData?.taskChartData?.map(d => {
                const pct = dashboardData.totalTasks > 0 ? ((d.value / dashboardData.totalTasks) * 100).toFixed(1) : 0;
                return (
                  <div key={d.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ backgroundColor: TASK_COLORS[d.name] }}></span><span className="font-semibold text-slate-600 dark:text-slate-300">{d.name}</span></div>
                    <span className="font-bold text-slate-800 dark:text-white">{d.value} - {pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Task Completion Trend (Area Chart) */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm lg:col-span-1">
          <h3 className="text-base font-bold text-slate-800 dark:text-white mb-2">Task Completion Trend</h3>
          <div className="relative h-60 -ml-4 -mb-2">
            <GoogleAreaChart data={trendData} colors={['#6366f1']} />
          </div>
        </div>

        {/* User Distribution Donut */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm flex flex-col justify-center">
          <h3 className="text-base font-bold text-slate-800 dark:text-white mb-4">User Distribution</h3>
          <div className="flex-1 flex flex-col sm:flex-row items-center gap-4 sm:gap-0">
            <div className="relative h-48 w-48 flex-shrink-0 mx-auto sm:mx-0">
              <GooglePieChart 
                data={userDistData.length > 0 ? userDistData : [{name: 'No Users', value: 1}]} 
                title="" 
                colors={{'Employees': '#3b82f6', 'Managers': '#10b981', 'No Users': '#e2e8f0'}} 
                pieHole={0.65} is3D={false} hideLegend={true}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-1">
                <p className="text-2xl font-black text-slate-800 dark:text-white leading-none">{dashboardData?.totalUsers || 0}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Total Users</p>
              </div>
            </div>
            <div className="flex-1 flex flex-col justify-center gap-3 sm:pl-6 w-full">
              <div className="flex items-center justify-between text-sm"><div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-blue-500"></span><span className="font-semibold text-slate-600 dark:text-slate-300">Employees</span></div><span className="font-bold text-slate-800 dark:text-white">{dashboardData?.totalEmployees || 0} - {dashboardData?.totalUsers ? ((dashboardData.totalEmployees / dashboardData.totalUsers) * 100).toFixed(1) : 0}%</span></div>
              <div className="flex items-center justify-between text-sm"><div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-emerald-500"></span><span className="font-semibold text-slate-600 dark:text-slate-300">Managers</span></div><span className="font-bold text-slate-800 dark:text-white">{dashboardData?.totalManagers || 0} - {dashboardData?.totalUsers ? ((dashboardData.totalManagers / dashboardData.totalUsers) * 100).toFixed(1) : 0}%</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid Rows */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Top Performing Managers / Employees */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-800 dark:text-white mb-4">Top Performing Managers</h3>
          <div className="space-y-4">
            {eomCandidates.filter(c => c.employee && c.employee.dashboardAccess === 'Manager Dashboard').slice(0, 4).map((candidate, i) => (
              <div key={i} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <img src={candidate.employee?.profilePicture || `https://ui-avatars.com/api/?name=${candidate.employee?.name || 'User'}`} alt={candidate.employee?.name} className="h-10 w-10 rounded-full object-cover border border-slate-200 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{candidate.employee?.name || 'Unknown User'}</p>
                    <p className="text-[11px] font-semibold text-slate-500 uppercase truncate">{candidate.employee?.role || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(candidate.totalScore, 100)}%` }}></div>
                  </div>
                  <span className="text-xs font-bold text-emerald-600">{Math.min(candidate.totalScore, 100).toFixed(0)}%</span>
                </div>
              </div>
            ))}
            {eomCandidates.filter(c => c.employee && c.employee.dashboardAccess === 'Manager Dashboard').length === 0 && <p className="text-sm text-slate-500">No performance data available yet.</p>}
          </div>
        </div>

        {/* Recent System Activities */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-800 dark:text-white mb-4">Recent System Activities</h3>
          <div className="relative border-l-2 border-slate-100 dark:border-slate-700 ml-3 space-y-5">
            {dynamicSystemActivities?.map(activity => (
              <div key={activity.id} className="relative pl-6">
                <span className={`absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 border-white dark:border-slate-800 ${activity.color}`}></span>
                <p className="text-sm font-bold text-slate-800 dark:text-white leading-tight break-words pr-2">{activity.action}</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs font-medium text-slate-500 truncate pr-2">{activity.user}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex-shrink-0">{activity.time}</p>
                </div>
              </div>
            ))}
            {(!dynamicSystemActivities || dynamicSystemActivities.length === 0) && <p className="text-sm text-slate-500 mt-2">No recent system activities recorded.</p>}
          </div>
        </div>

        {/* Tasks Due for Approval */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-800 dark:text-white mb-4">Tasks Due for Approval</h3>
          <div className="space-y-3">
            {approvalTasks?.slice(0, 4).map((task, i) => (
              <div key={i} className="flex justify-between items-center gap-3 border-b border-slate-100 dark:border-slate-700/50 pb-3 last:border-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-800 dark:text-white leading-tight truncate">{task.title}</p>
                  <p className="text-[11px] font-medium text-slate-500 mt-1 truncate">{task.assignedTo?.name || 'Unknown'} • {safeDate(task.submittedForCompletionDate || task.updatedAt || task.createdAt).toLocaleDateString()}</p>
                </div>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 flex-shrink-0 whitespace-nowrap">
                  {["Daily Report", "Weekly Report", "Task Completion", "Content Review"][i % 4]}
                </span>
              </div>
            ))}
            {(!approvalTasks || approvalTasks.length === 0) && <p className="text-sm text-slate-500">No tasks pending approval.</p>}
          </div>
        </div>
      </div>

      {/* Lower Metrics Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4">Overall Platform Analytics</h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 divide-x divide-slate-100 dark:divide-slate-700">
            <div className="px-4 first:pl-0"><p className="text-2xl font-black text-slate-800 dark:text-white">{platformAnalytics.completionRate}%</p><p className="text-xs font-semibold text-slate-500 mt-1">Task Completion</p></div>
            <div className="px-4"><p className="text-2xl font-black text-slate-800 dark:text-white">{platformAnalytics.onTimeRate}%</p><p className="text-xs font-semibold text-slate-500 mt-1">On-Time Delivery</p></div>
            <div className="px-4"><p className="text-2xl font-black text-slate-800 dark:text-white">92%</p><p className="text-xs font-semibold text-slate-500 mt-1">Attendance Rate</p></div>
            <div className="px-4"><p className="text-2xl font-black text-slate-800 dark:text-white">{platformAnalytics.avgRating}<span className="text-base text-slate-400">/5</span></p><p className="text-xs font-semibold text-slate-500 mt-1">Avg Rating</p></div>
            <div className="px-4"><p className="text-2xl font-black text-emerald-500">+5.2%</p><p className="text-xs font-semibold text-slate-500 mt-1">Improvement Rate</p></div>
          </div>
        </div>
        <div className="lg:col-span-1 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm flex flex-col justify-center">
          <div className="flex justify-between items-center mb-3">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Platform Summary</p>
            <div className="flex items-center gap-1.5"><span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span></span><span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">99.9% UPTIME</span></div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between"><span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Total Branches</span><span className="text-sm font-bold text-slate-800 dark:text-white">4</span></div>
            <div className="flex justify-between"><span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Active This Month</span><span className="text-sm font-bold text-slate-800 dark:text-white">{platformAnalytics.activeUsers}</span></div>
            <div className="flex justify-between"><span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Inactive Users</span><span className="text-sm font-bold text-slate-800 dark:text-white">3</span></div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-6 mt-4 text-slate-400 dark:text-slate-500 text-xs font-semibold">
        &copy; {new Date().getFullYear()} Work Radar Platform
      </div>
    </div>
  );
};

export default Dashboard;