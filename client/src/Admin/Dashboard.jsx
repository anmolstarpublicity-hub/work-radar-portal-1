import React, { useMemo, useState, useEffect } from 'react';
import { UsersIcon, BriefcaseIcon, ClockIcon, CheckBadgeIcon, UserGroupIcon, ClipboardDocumentListIcon, BuildingOffice2Icon } from '@heroicons/react/24/outline';
import { ArrowRightIcon, ChevronDownIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { useGetDashboardStatsQuery, useGetAllTasksQuery, useGetEmployeeOfTheMonthCandidatesQuery, useGetActiveAnnouncementQuery, useGetTasksForApprovalQuery, useGetEmployeesQuery } from '../services/EmployeApi';
import GooglePieChart from './GooglePieChart.jsx';
import GoogleAreaChart from './GoogleAreaChart.jsx';
import StatCard from '../shared/StatCard.jsx';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../app/authSlice';

const DonutChart = ({ segments, total, size = 160 }) => {
  const [hovered, setHovered] = React.useState(null);
  const [isAnimated, setIsAnimated] = useState(false);
  const cx = size / 2, cy = size / 2;
  const r = 58, strokeW = 28, gapDeg = 6;
  const circ = 2 * Math.PI * r;
  const gapFrac = gapDeg / 360;

  useEffect(() => {
    const timer = window.setTimeout(() => setIsAnimated(true), 80);
    return () => window.clearTimeout(timer);
  }, []);

  // Pre-compute outside render so StrictMode double-invoke doesn't corrupt cumPct
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
      <div
        className="relative flex-shrink-0"
        style={{ width: size, height: size, opacity: isAnimated ? 1 : 0.75, transform: isAnimated ? 'scale(1)' : 'scale(0.96)', transition: 'opacity 0.45s ease, transform 0.45s ease' }}
      >
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} onMouseLeave={() => setHovered(null)}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f0fa" strokeWidth={strokeW} />
          {slices.map((s) => {
            const isHov = hovered === s.label;
            return (
              <circle key={s.label} cx={cx} cy={cy} r={r} fill="none"
                stroke={s.color}
                strokeWidth={isHov ? strokeW + 6 : strokeW}
                strokeDasharray={`${s.dash} ${circ - s.dash}`}
                strokeDashoffset={isAnimated ? s.offset : s.offset + circ}
                strokeLinecap="round"
                style={{ filter: `drop-shadow(0px ${isHov ? 6 : 4}px ${isHov ? 10 : 6}px rgba(0,0,0,${isHov ? 0.25 : 0.15}))`, transition: 'stroke-dashoffset 800ms cubic-bezier(0.22, 1, 0.36, 1), stroke-width 0.15s ease, opacity 0.25s ease', cursor: 'pointer', opacity: isAnimated ? 1 : 0.3 }}
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

const safeDate = (d) => { const dt = new Date(d); return isNaN(dt.getTime()) ? new Date() : dt; };
const isSameDay = (a, b) => a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const perfLabel = (score) => {
  if (score >= 85) return { label: 'Excellent', cls: 'bg-green-100 text-green-700' };
  if (score >= 75) return { label: 'Very Good', cls: 'bg-blue-100 text-blue-700' };
  if (score >= 65) return { label: 'Good', cls: 'bg-purple-100 text-purple-700' };
  return { label: 'Average', cls: 'bg-orange-100 text-orange-700' };
};

const Dashboard = ({ onNavigate = () => {} }) => {
  const _user = useSelector(selectCurrentUser);
  const isAuthenticated = !!_user?._id;
  const [filterType, setFilterType] = useState('week');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

  useEffect(() => {
    const today = new Date();
    if (filterType === 'week') {
      const first = new Date(today); first.setDate(today.getDate() - today.getDay());
      const last = new Date(first); last.setDate(first.getDate() + 6);
      setDateRange({ startDate: first.toISOString().split('T')[0], endDate: last.toISOString().split('T')[0] });
    } else if (filterType === 'month') {
      const first = new Date(today.getFullYear(), today.getMonth(), 1);
      const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      setDateRange({ startDate: first.toISOString().split('T')[0], endDate: last.toISOString().split('T')[0] });
    }
  }, [filterType]);

  const { data: stats } = useGetDashboardStatsQuery(undefined, { skip: !isAuthenticated });
  const { data: allTasks = [], isLoading: isLoadingTasks } = useGetAllTasksQuery(undefined, { skip: !isAuthenticated });
  const { data: eomCandidates = [], isLoading: isLoadingEOM } = useGetEmployeeOfTheMonthCandidatesQuery({ month: new Date().getMonth() + 1, year: new Date().getFullYear() }, { skip: !isAuthenticated });
  const { isLoading: isLoadingAnn } = useGetActiveAnnouncementQuery(undefined, { skip: !isAuthenticated });
  const { data: approvalTasks = [] } = useGetTasksForApprovalQuery(undefined, { skip: !isAuthenticated });
  const { data: allEmployees = [] } = useGetEmployeesQuery(undefined, { skip: !isAuthenticated });

  const isLoading = isLoadingTasks || isLoadingEOM || isLoadingAnn;

  const filteredTasks = useMemo(() => {
    if (!dateRange.startDate || !dateRange.endDate) return allTasks;
    const s = new Date(dateRange.startDate); s.setHours(0,0,0,0);
    const e = new Date(dateRange.endDate); e.setHours(23,59,59,999);
    return allTasks.filter(t => { const d = new Date(t.createdAt || t.updatedAt); return d >= s && d <= e; });
  }, [allTasks, dateRange]);

  const totalUsers = allEmployees.length;
  const totalManagers = allEmployees.filter(e => e.dashboardAccess === 'Manager Dashboard').length;
  const totalEmployees = allEmployees.filter(e => e.dashboardAccess !== 'Manager Dashboard' && e.role !== 'Admin' && e.role !== 'Super Admin').length;
  const totalTasks = filteredTasks.length;
  const tasksCompleted = filteredTasks.filter(t => t.status === 'Completed').length;
  const pendingApprovals = filteredTasks.filter(t => t.status === 'Pending Verification').length;

  const taskChartData = useMemo(() => [
    { name: 'Completed', value: filteredTasks.filter(t => t.status === 'Completed').length },
    { name: 'Pending', value: filteredTasks.filter(t => t.status === 'Pending').length },
    { name: 'In Progress', value: filteredTasks.filter(t => t.status === 'In Progress').length },
    { name: 'Not Completed', value: filteredTasks.filter(t => t.status === 'Not Completed').length },
  ].filter(d => d.value > 0), [filteredTasks]);

  const userDistData = useMemo(() => [
    { name: 'Employee', value: totalEmployees },
    { name: 'Manager', value: totalManagers },
  ].filter(d => d.value > 0), [totalEmployees, totalManagers]);

  const TASK_COLORS = { Completed: '#86efac', Pending: '#d8b4fe', 'In Progress': '#7c3aed', 'Not Completed': '#f97316', 'No Tasks': '#e2e8f0' };
  const DIST_COLORS = { Employee: '#86efac', Manager: '#7c3aed', 'No Users': '#e2e8f0' };

  const trendData = useMemo(() => {
    const data = [['Day', 'Tasks Completed']];
    if (!dateRange.startDate || !dateRange.endDate) return data;
    const s = new Date(dateRange.startDate); s.setHours(0,0,0,0);
    const e = new Date(dateRange.endDate); e.setHours(23,59,59,999);
    const days = Math.min(Math.floor((e - s) / 86400000) + 1, 31);
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(e); d.setDate(d.getDate() - i);
      data.push([d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), allTasks.filter(t => t.completionDate && isSameDay(safeDate(t.completionDate), d)).length]);
    }
    return data;
  }, [allTasks, dateRange]);

  const systemActivities = useMemo(() =>
    filteredTasks.slice().sort((a, b) => safeDate(b.updatedAt).getTime() - safeDate(a.updatedAt).getTime()).slice(0, 4).map(t => ({
      id: t._id,
      title: `Task "${t.title}" marked as ${t.status}`,
      sub: t.assignedTo?.name || 'System',
      time: safeDate(t.updatedAt || t.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      avatar: t.assignedTo?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(t.assignedTo?.name || 'S')}&background=8E5FD0&color=fff`,
    })), [filteredTasks]);

  const topManagers = useMemo(() =>
    eomCandidates.filter(c => c.employee?.dashboardAccess === 'Manager Dashboard').slice(0, 5).map(c => ({
      name: c.employee?.name, role: c.employee?.role,
      avatar: c.employee?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.employee?.name || 'M')}&background=8E5FD0&color=fff`,
      tasks: c.completedTasks || 0, rate: Math.min(c.totalScore, 100).toFixed(0),
    })), [eomCandidates]);

  const completionRate = totalTasks > 0 ? ((tasksCompleted / totalTasks) * 100).toFixed(1) : 0;
  const onTime = filteredTasks.filter(t => t.status === 'Completed' && safeDate(t.completionDate) <= safeDate(t.dueDate)).length;
  const onTimeRate = tasksCompleted > 0 ? ((onTime / tasksCompleted) * 100).toFixed(0) : 0;
  const avgRating = eomCandidates.length > 0 ? (eomCandidates.reduce((a, c) => a + c.totalScore, 0) / eomCandidates.length / 20).toFixed(1) : '4.5';
  const activeUsers = new Set(filteredTasks.map(t => String(t.assignedTo?._id || t.assignedTo)).filter(Boolean)).size;

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

  if (isLoading) return <div className="p-8 text-center text-slate-500">Loading dashboard...</div>;

  return (
    <div className="min-h-screen p-6 lg:p-8 font-manrope" style={{ backgroundColor: '#DFCDFE' }}>

      {/* Welcome Bar */}
      <div className="mb-8 flex flex-col md:flex-row items-center justify-between gap-4 rounded-2xl px-10 py-10 text-white animate-[fadeInUp_0.6s_ease-out]" style={{ background: 'linear-gradient(135deg, #48306A, #8E5FD0)' }}>
        <div>
          <h1 className="text-2xl font-extrabold uppercase tracking-wide">Welcome Back, {_user?.name?.split(' ')[0] || 'Admin'} !</h1>
          <p className="text-base mt-4 text-purple-200">Monitor Platform Performance, Employee Activities And Task Progress From One Place</p>
        </div>
        <div className="hidden md:block w-px self-stretch bg-white/20" />
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-white/10 rounded-lg p-2">
            {['week','month'].map(t => (
              <button key={t} onClick={() => setFilterType(t)}
                className={`px-5 py-2.5 rounded-md text-sm font-bold capitalize transition-all ${filterType === t ? 'bg-white text-purple-800' : 'text-white hover:bg-white/10'}`}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 bg-white/10 rounded-lg px-3 py-2">
            <CalendarIcon className="h-5 w-5 text-purple-200 flex-shrink-0" />
            <input
              type="date"
              value={dateRange.startDate}
              onChange={e => { setDateRange(p => ({ ...p, startDate: e.target.value })); setFilterType('custom'); }}
              onFocus={() => setFilterType('custom')}
              className="text-sm font-semibold text-white bg-transparent px-2 py-1 rounded-md outline-none"
            />
            <span className="text-purple-300">-</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={e => { setDateRange(p => ({ ...p, endDate: e.target.value })); setFilterType('custom'); }}
              onFocus={() => setFilterType('custom')}
              className="text-sm font-semibold text-white bg-transparent px-2 py-1 rounded-md outline-none"
            />
          </div>

          <button onClick={() => setFilterType('custom')}
            className="flex items-center gap-1.5 bg-white text-purple-800 hover:bg-purple-50 transition px-5 py-2 rounded-lg text-sm font-bold">
            Apply <ArrowRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <StatCard title="Total User" value={totalUsers} icon={UsersIcon} />
        <StatCard title="Total Manager" value={totalManagers} icon={BriefcaseIcon} />
        <StatCard title="Total Employee" value={totalEmployees} icon={UserGroupIcon} />
        <StatCard title="Total Task" value={totalTasks} icon={ClipboardDocumentListIcon} />
        <StatCard title="Task Completed" value={tasksCompleted} icon={CheckBadgeIcon} />
        <StatCard title="Pending Approvals" value={pendingApprovals} icon={ClockIcon} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Platform Task Overview */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-purple-100 dark:border-slate-700 p-6 shadow-sm animate-[fadeInUp_0.6s_ease-out]">
          <h3 className="text-base font-bold text-slate-800 dark:text-white mb-1">Platform Task Overview</h3>
          <p className="text-xs text-slate-400 mb-4">Task status breakdown for selected period</p>
          <DonutChart
            total={totalTasks}
            segments={[
              { label: 'Completed',          val: filteredTasks.filter(t => t.status === 'Completed').length,             color: '#86efac' },
              { label: 'In Progress',        val: filteredTasks.filter(t => t.status === 'In Progress').length,           color: '#8E5FD0' },
              { label: 'Pending',            val: filteredTasks.filter(t => t.status === 'Pending').length,               color: '#d8b4fe' },
              { label: 'Verification',       val: filteredTasks.filter(t => t.status === 'Pending Verification').length,  color: '#f59e0b' },
              { label: 'Not Completed',      val: filteredTasks.filter(t => t.status === 'Not Completed').length,         color: '#f97316' },
            ].filter(s => s.val > 0)}
          />
        </div>

        {/* Task Completion Trend */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-purple-100 dark:border-slate-700 p-6 shadow-sm animate-[fadeInUp_0.7s_ease-out]">
          <h3 className="text-base font-bold text-slate-800 dark:text-white mb-2">Task Completion Trend</h3>
          <div className="h-52 -ml-4 -mb-2">
            <GoogleAreaChart data={trendData} colors={['#8E5FD0']} />
          </div>
        </div>

        {/* User Distribution */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-purple-100 dark:border-slate-700 p-6 shadow-sm flex flex-col animate-[fadeInUp_0.8s_ease-out]">
          <h3 className="text-base font-bold text-slate-800 dark:text-white mb-1">User Distribution</h3>
          <p className="text-xs text-slate-400 mb-4">Breakdown of platform users by role</p>
          <DonutChart
            total={totalUsers}
            segments={[
              { label: 'Employees', val: totalEmployees, color: '#8E5FD0' },
              { label: 'Managers',  val: totalManagers,  color: '#86efac' },
            ].filter(s => s.val > 0)}
          />
        </div>
      </div>

      {/* Middle Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Top Performing Manager */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-purple-100 dark:border-slate-700 p-6 shadow-sm animate-[fadeInUp_0.7s_ease-out]">
          <h3 className="text-base font-bold text-slate-800 dark:text-white mb-4">Top Performing Manager</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-400 border-b border-slate-100 dark:border-slate-700">
                <th className="text-left pb-2 font-semibold">Performer</th>
                <th className="text-center pb-2 font-semibold">Complete Task</th>
                <th className="text-center pb-2 font-semibold">Completion Rate</th>
                <th className="text-center pb-2 font-semibold">Performance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
              {topManagers.length > 0 ? topManagers.map((m, i) => {
                const p = perfLabel(Number(m.rate));
                return (
                  <tr key={i}>
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <img src={m.avatar} alt={m.name} className="h-8 w-8 rounded-full object-cover flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-white text-xs leading-tight">{m.name}</p>
                          <p className="text-[10px] text-slate-400">{m.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-center text-slate-700 dark:text-slate-300 font-semibold">{m.tasks}</td>
                    <td className="text-center text-slate-700 dark:text-slate-300 font-semibold">{m.rate}%</td>
                    <td className="text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${p.cls}`}>{p.label}</span>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={4} className="py-4 text-center text-slate-400 text-xs">No data available</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Recent System Activities */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-purple-100 dark:border-slate-700 p-6 shadow-sm animate-[fadeInUp_0.8s_ease-out]">
          <h3 className="text-base font-bold text-slate-800 dark:text-white mb-4">Recent System Activities</h3>
          <div className="relative border-l-2 border-purple-100 dark:border-slate-700 ml-4 space-y-4">
            {systemActivities.map((a, i) => (
              <div key={a.id} className="relative pl-5">
                <img src={a.avatar} alt={a.sub} className="absolute -left-4 top-0 h-7 w-7 rounded-full object-cover border-2 border-white dark:border-slate-800" />
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-white leading-tight">{a.title}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{a.sub}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap flex-shrink-0">{a.time}</span>
                </div>
              </div>
            ))}
            {systemActivities.length === 0 && <p className="text-xs text-slate-400 pl-5">No recent activities.</p>}
          </div>
          <button onClick={() => onNavigate('view-tasks')} className="mt-4 flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-800 transition">
            View All <ChevronDownIcon className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Task Due For Approvals */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-purple-100 dark:border-slate-700 p-6 shadow-sm animate-[fadeInUp_0.9s_ease-out]">
          <h3 className="text-base font-bold text-slate-800 dark:text-white mb-4">Task Due For Approvals</h3>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-100 dark:border-slate-700">
                <th className="text-left pb-2 font-semibold">Employee</th>
                <th className="text-left pb-2 font-semibold">Task</th>
                <th className="text-left pb-2 font-semibold">Submitted On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
              {approvalTasks.slice(0, 5).map((t, i) => (
                <tr key={i}>
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <img src={t.assignedTo?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(t.assignedTo?.name || 'U')}&background=8E5FD0&color=fff`}
                        alt={t.assignedTo?.name} className="h-7 w-7 rounded-full object-cover flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-white leading-tight">{t.assignedTo?.name || 'Unknown'}</p>
                        <p className="text-[10px] text-slate-400">{t.assignedTo?.role || ''}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-slate-600 dark:text-slate-300 font-medium truncate max-w-[80px]">{t.title}</td>
                  <td className="text-slate-400 whitespace-nowrap">{safeDate(t.submittedForCompletionDate || t.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                </tr>
              ))}
              {approvalTasks.length === 0 && <tr><td colSpan={3} className="py-4 text-center text-slate-400">No pending approvals</td></tr>}
            </tbody>
          </table>
          <button onClick={() => onNavigate('task-approvals')} className="mt-4 flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-800 transition">
            View All <ChevronDownIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overall Platform Analytics */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-purple-100 dark:border-slate-700 p-6 shadow-sm animate-[fadeInUp_0.8s_ease-out]">
          <h3 className="text-base font-bold text-slate-800 dark:text-white mb-6">Overall Platform Analytics</h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {[
              { label: 'Task Completion', val: `${completionRate}%` },
              { label: 'On Time Delivery', val: `${onTimeRate}%` },
              { label: 'Attendance Rate', val: '96.6%' },
              { label: 'Average Rating', val: `${avgRating}/5` },
              { label: 'Improvement Rate', val: '+5.2%' },
            ].map(({ label, val }) => (
              <div key={label} className="flex flex-col gap-1">
                <p className="text-xs text-slate-400 font-medium">{label}</p>
                <p className="text-2xl font-extrabold text-slate-800 dark:text-white">{val}</p>
                <div className="h-0.5 w-8 rounded-full" style={{ background: 'linear-gradient(90deg,#48306A,#8E5FD0)' }} />
              </div>
            ))}
          </div>
        </div>

        {/* Platform Summary */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-purple-100 dark:border-slate-700 p-6 shadow-sm animate-[fadeInUp_0.9s_ease-out]">
          <h3 className="text-base font-bold text-slate-800 dark:text-white mb-6">Platform Summary</h3>
          <div className="flex flex-col gap-5">
            <div className="flex flex-col items-center">
              <div className="h-10 w-10 rounded-full bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center mb-1">
                <UsersIcon className="h-5 w-5 text-purple-500" />
              </div>
              <p className="text-xs text-slate-400">Active This Month</p>
              <p className="text-3xl font-extrabold text-slate-800 dark:text-white">{activeUsers}</p>
              <div className="h-0.5 w-8 rounded-full mt-1" style={{ background: 'linear-gradient(90deg,#48306A,#8E5FD0)' }} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
                  <BuildingOffice2Icon className="h-4 w-4 text-purple-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Total Branch</p>
                  <p className="text-xl font-extrabold text-slate-800 dark:text-white">4</p>
                  <div className="h-0.5 w-6 rounded-full" style={{ background: 'linear-gradient(90deg,#48306A,#8E5FD0)' }} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
                  <ClockIcon className="h-4 w-4 text-purple-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Inactive User</p>
                  <p className="text-xl font-extrabold text-slate-800 dark:text-white">4</p>
                  <div className="h-0.5 w-6 rounded-full" style={{ background: 'linear-gradient(90deg,#48306A,#8E5FD0)' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
