import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../app/authSlice';
import toast from 'react-hot-toast';
import { useGetAttendanceForMonthQuery, useGetPCStartTimeQuery, useGetReportsByEmployeeQuery, useGetAllTasksQuery, useGetPCDaysForMonthQuery, useGetPunchDataQuery, useGetEmployeeScoreQuery, useSetEmployeeScoreMutation } from '../services/EmployeApi';
import { ChevronLeftIcon, ChevronRightIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { ComputerDesktopIcon, ClockIcon, CheckCircleIcon, ArrowRightEndOnRectangleIcon, UserGroupIcon } from '@heroicons/react/24/outline';

const parseDateToIso = (value) => {
  if (!value) return null;
  const trimmed = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) {
    const [day, month, year] = trimmed.split('-');
    return `${year}-${month}-${day}`;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().split('T')[0];
};

const formatTimeString = (ts) => {
  if (!ts) return 'N/A';
  const trimmed = String(ts).trim();
  if (/^\d{2}:\d{2}(?::\d{2})?$/.test(trimmed)) {
    const [hours, minutes, seconds = '00'] = trimmed.split(':');
    const date = new Date();
    date.setHours(Number(hours), Number(minutes), Number(seconds), 0);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

// --- Performance Report Modal ---
const PerformanceReportModal = ({ isOpen, onClose, employee, date, attendanceStatus }) => {
  const isoDate = parseDateToIso(date);
  const dateObj = isoDate ? new Date(isoDate) : null;
  const startOfWeek = useMemo(() => {
    if (!dateObj) return null;
    const d = new Date(dateObj);
    d.setDate(d.getDate() - d.getDay() + 1);
    return d.toISOString().split('T')[0];
  }, [dateObj]);
  const endOfWeek = useMemo(() => {
    if (!dateObj) return null;
    const d = new Date(dateObj);
    d.setDate(d.getDate() - d.getDay() + 7);
    return d.toISOString().split('T')[0];
  }, [dateObj]);

  const { data: allTasks = [] } = useGetAllTasksQuery(undefined, { skip: !isOpen });
  const { data: reports = [] } = useGetReportsByEmployeeQuery(employee?._id, { skip: !isOpen || !employee });
  const normalizedDate = parseDateToIso(date);
  const { data: pcData } = useGetPCStartTimeQuery(
    { employeeId: employee?._id, date: normalizedDate },
    { skip: !isOpen || !employee?.monitoringName || !normalizedDate }
  );
  const pcStartTime = pcData?.pcStartTime;

  const normalizedPunchDate = normalizedDate;
  const { data: punchData } = useGetPunchDataQuery(
    { employeeId: employee?._id, date: normalizedPunchDate },
    { skip: !isOpen || !employee || !normalizedPunchDate }
  );
  const punchIn = punchData?.punchIn;
  const punchOut = punchData?.punchOut;

  const taskStats = useMemo(() => {
    if (!employee || !isoDate) return { completed: 0, total: 0 };
    const employeeTasks = allTasks.filter(t => {
      const id = t.assignedTo?._id || t.assignedTo;
      return String(id) === String(employee._id);
    });
    const completed = employeeTasks.filter(t => t.status === 'Completed').length;
    return { completed, total: employeeTasks.length };
  }, [allTasks, employee, isoDate]);

  const report = useMemo(() => {
    if (!reports || !isoDate) return null;
    return reports.find(r => r.reportDate?.split('T')[0] === isoDate);
  }, [reports, isoDate]);

  const performanceScore = useMemo(() => {
    if (!taskStats.total) return 0;
    const taskScore = (taskStats.completed / taskStats.total) * 70;
    const attendanceScore = attendanceStatus === 'Present' ? 20 : 0;
    const punctualityScore = pcStartTime ? 10 : 0;
    return Math.round(taskScore + attendanceScore + punctualityScore);
  }, [taskStats, attendanceStatus, pcStartTime]);

  if (!isOpen || !employee || !date) return null;

  const formatTime = (ts) => formatTimeString(ts);

  const initials = employee.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>

        {/* Header — purple gradient */}
        <div className="flex items-center justify-between px-6 py-4 text-white" style={{ background: 'linear-gradient(135deg, #48306A, #8E5FD0)' }}>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {initials}
            </div>
            <div>
              <p className="font-bold text-white text-sm">{employee.name}</p>
              <p className="text-xs text-purple-200">{employee.department} · {employee.employeeId}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-purple-200">
                {new Date(isoDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' })}
              </p>
              <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                attendanceStatus === 'Present' ? 'bg-emerald-400/20 text-emerald-200 border border-emerald-400/30' :
                attendanceStatus === 'Absent' ? 'bg-red-400/20 text-red-200 border border-red-400/30' :
                'bg-white/10 text-white/70 border border-white/20'
              }`}>{attendanceStatus || 'N/A'}</span>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition">
              <XMarkIcon className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>

        <div className="p-6 grid grid-cols-2 gap-6">
          {/* Left: Attendance & PC Activity */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Attendance & Activity</p>
            <div className="space-y-3">
              {[
                { icon: ArrowRightEndOnRectangleIcon, label: 'Punch In', value: punchIn ? formatTime(punchIn) : 'N/A', color: 'text-purple-500', bg: 'bg-purple-50' },
                { icon: ArrowRightEndOnRectangleIcon, label: 'Punch Out', value: punchOut ? formatTime(punchOut) : 'N/A', color: 'text-purple-500', bg: 'bg-purple-50', rotate: true },
                { icon: ComputerDesktopIcon, label: 'PC Start', value: formatTime(pcStartTime), color: 'text-emerald-500', bg: 'bg-emerald-50' },
                { icon: ComputerDesktopIcon, label: 'PC Shutdown', value: 'N/A', color: 'text-slate-400', bg: 'bg-slate-50' },
              ].map(({ icon: Icon, label, value, color, bg, rotate }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className={`h-7 w-7 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`h-3.5 w-3.5 ${color} ${rotate ? 'rotate-180' : ''}`} />
                    </span>
                    <span className="text-sm text-slate-600">{label}</span>
                  </div>
                  <span className="text-sm font-bold text-slate-800">{value}</span>
                </div>
              ))}
            </div>

            {/* Task Completion */}
            <div className="mt-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Task Completion</p>
                <span className="text-xs font-bold text-purple-600">{taskStats.completed}/{taskStats.total}</span>
              </div>
              <div className="w-full bg-purple-100 rounded-full h-2">
                <div className="h-2 rounded-full transition-all duration-500"
                  style={{ width: taskStats.total > 0 ? `${(taskStats.completed / taskStats.total) * 100}%` : '0%', background: 'linear-gradient(90deg, #48306A, #8E5FD0)' }} />
              </div>
            </div>
          </div>

          {/* Right: Performance Score */}
          <div className="flex flex-col items-center justify-center">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Performance Score</p>
            <div className="relative h-32 w-32">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f0fa" strokeWidth="10" />
                <circle cx="50" cy="50" r="40" fill="none"
                  stroke="url(#perfGrad)" strokeWidth="10"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - performanceScore / 100)}`}
                  strokeLinecap="round" />
                <defs>
                  <linearGradient id="perfGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#48306A" />
                    <stop offset="100%" stopColor="#8E5FD0" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-3xl font-black text-slate-800">{performanceScore}</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-wide">out of 100</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 text-center mt-3 leading-relaxed">Weighted from attendance, activity & task delivery.</p>
          </div>
        </div>

        {/* Report Notes */}
        {report && (
          <div className="px-6 pb-6">
            <div className="h-px bg-purple-50 mb-4" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Daily Report</p>
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 text-sm text-slate-600 max-h-24 overflow-y-auto">
              {(() => {
                try {
                  const data = JSON.parse(report.content);
                  return data.reportNote || 'No notes submitted.';
                } catch { return report.content; }
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- PC Start Time Tooltip (portal-based to escape overflow clipping) ---
const PCStartTooltip = ({ employeeId, monitoringName, date, children }) => {
  const [hovered, setHovered] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const ref = useRef(null);

  const normalizedDate = parseDateToIso(date);
  const { data: pcData } = useGetPCStartTimeQuery(
    { employeeId, date: normalizedDate },
    { skip: !hovered || !monitoringName || !normalizedDate }
  );

  const formatTime = (ts) => {
    if (!ts) return '...';
    const parsed = new Date(ts);
    if (Number.isNaN(parsed.getTime())) return '...';
    return parsed.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const handleMouseEnter = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setPos({ x: rect.left + rect.width / 2, y: rect.top });
    }
    setHovered(true);
  };

  const isDark = document.documentElement.classList.contains('dark');

  return (
    <div ref={ref} className="w-full h-full" onMouseEnter={handleMouseEnter} onMouseLeave={() => setHovered(false)}>
      {children}
      {hovered && monitoringName && createPortal(
        <div
          className="pointer-events-none"
          style={{
            position: 'fixed',
            left: pos.x,
            top: pos.y - 8,
            transform: 'translate(-50%, -100%)',
            zIndex: 9999,
            filter: 'drop-shadow(0 6px 20px rgba(37,99,235,0.18))',
          }}
        >
          <div style={{
            background: isDark ? '#1e293b' : '#ffffff',
            border: `1px solid ${isDark ? 'rgba(37,99,235,0.3)' : 'rgba(37,99,235,0.15)'}`,
            borderRadius: 12,
            padding: '7px 12px',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <span style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              height: 20, width: 20, borderRadius: '50%',
              background: isDark ? 'rgba(37,99,235,0.2)' : 'rgba(37,99,235,0.08)',
            }}>
              <ComputerDesktopIcon style={{ height: 11, width: 11, color: '#2563eb' }} />
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, color: isDark ? '#94a3b8' : '#475569' }}>PC Start</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#2563eb' }}>
              {pcData?.pcStartTime ? formatTime(pcData.pcStartTime) : '...'}
            </span>
          </div>
          {/* Arrow */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{
              width: 10, height: 10, marginTop: -5,
              background: isDark ? '#1e293b' : '#ffffff',
              border: `1px solid ${isDark ? 'rgba(37,99,235,0.3)' : 'rgba(37,99,235,0.15)'}`,
              borderTop: 'none', borderLeft: 'none',
              transform: 'rotate(45deg)',
            }} />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

// --- Monthly Performance Report ---
const MonthlyPerformanceReport = ({ employee, attendanceData, year, month }) => {
  const monthName = new Date(year, month - 1).toLocaleString('en-US', { month: 'long' });
  const currentUser = useSelector(selectCurrentUser);
  const canEdit = currentUser?.role === 'Admin' || currentUser?.role === 'Super Admin' || currentUser?.dashboardAccess === 'Manager Dashboard';

  const { data: pcDaysData } = useGetPCDaysForMonthQuery(
    { employeeId: employee._id, year, month },
    { skip: !employee.monitoringName }
  );

  const { data: scoreData } = useGetEmployeeScoreQuery({ employeeId: employee._id, year, month });
  const [setEmployeeScore, { isLoading: isSaving }] = useSetEmployeeScoreMutation();

  const [officeBehaviourInput, setOfficeBehaviourInput] = useState('');
  const [dressUpInput, setDressUpInput] = useState('');

  // Sync inputs when scoreData loads
  useEffect(() => {
    if (scoreData) {
      setOfficeBehaviourInput(scoreData.officeBehaviour !== null ? String(scoreData.officeBehaviour) : '');
      setDressUpInput(scoreData.dressUp !== null ? String(scoreData.dressUp) : '');
    }
  }, [scoreData]);

  const handleSaveScore = async () => {
    const ob = officeBehaviourInput !== '' ? Number(officeBehaviourInput) : null;
    const du = dressUpInput !== '' ? Number(dressUpInput) : null;
    if ((ob !== null && (ob < 0 || ob > 5)) || (du !== null && (du < 0 || du > 5))) {
      toast.error('Scores must be between 0 and 5.');
      return;
    }
    try {
      await setEmployeeScore({ employeeId: employee._id, year, month, officeBehaviour: ob, dressUp: du }).unwrap();
      toast.success('Scores saved!');
    } catch {
      toast.error('Failed to save scores.');
    }
  };

  const savedOB = scoreData?.officeBehaviour ?? null;
  const savedDU = scoreData?.dressUp ?? null;

  const stats = useMemo(() => {
    const workingDays = attendanceData.filter(d =>
      d.status !== 'Holiday' && d.status !== 'Future' && d.status !== 'Pending'
    );
    const presentDays = attendanceData.filter(d => d.status === 'Present').length;
    const totalWorking = workingDays.length || 1;
    const attendanceEarned = Math.round((presentDays / totalWorking) * 100);

    const pcDays = pcDaysData?.pcDays ?? null;
    const punctualityEarned = employee.monitoringName && pcDays !== null && presentDays > 0
      ? Math.round((pcDays / presentDays) * 10)
      : null;

    const officeBehaviour = savedOB;
    const dressUp = savedDU;

    const totalMax = 100 + (punctualityEarned !== null ? 10 : 0) + 5 + 5;
    const totalEarned = attendanceEarned + (punctualityEarned ?? 0) + (officeBehaviour ?? 0) + (dressUp ?? 0);
    const score = Math.round((totalEarned / totalMax) * 100);

    return { attendanceEarned, punctualityEarned, pcDays, presentDays, score, officeBehaviour, dressUp };
  }, [attendanceData, pcDaysData, employee, savedOB, savedDU]);

  const initials = employee.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const circumference = 2 * Math.PI * 40;

  return (
    <div className="mt-6 rounded-2xl border border-purple-100 bg-white overflow-hidden shadow-sm">
      {/* Header — purple gradient */}
      <div className="flex items-center justify-between px-6 py-4 text-white" style={{ background: 'linear-gradient(135deg, #48306A, #8E5FD0)' }}>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {initials}
          </div>
          <div>
            <p className="font-bold text-white text-sm">{employee.name}</p>
            <p className="text-xs text-purple-200">{employee.department} · {employee.employeeId}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-purple-200 font-medium">Report Period</p>
          <p className="text-sm font-bold text-white">{monthName} {year}</p>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-8">
        {/* Left: Components */}
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Monthly Performance Components</p>
          <div className="space-y-4">
            {/* Attendance */}
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                <UserGroupIcon className="h-4 w-4 text-purple-500" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between mb-1.5">
                  <span className="text-sm text-slate-600">Attendance</span>
                  <span className="text-sm font-bold text-slate-800">{stats.attendanceEarned} / 100</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden bg-purple-100">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${stats.attendanceEarned}%`, background: 'linear-gradient(90deg, #48306A, #8E5FD0)' }} />
                </div>
              </div>
            </div>

            {/* Punctuality */}
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                <ClockIcon className="h-4 w-4 text-purple-500" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between mb-1.5">
                  <span className="text-sm text-slate-600">Punctuality</span>
                  {stats.punctualityEarned !== null
                    ? <span className="text-sm font-bold text-slate-800">{stats.punctualityEarned} / 10</span>
                    : <span className="text-xs text-slate-400">No monitoring data</span>
                  }
                </div>
                <div className="h-2 rounded-full overflow-hidden bg-purple-100">
                  {stats.punctualityEarned !== null && (
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${(stats.punctualityEarned / 10) * 100}%`, background: 'linear-gradient(90deg, #48306A, #8E5FD0)' }} />
                  )}
                </div>
              </div>
            </div>

            {/* Office Behaviour */}
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                <CheckCircleIcon className="h-4 w-4 text-purple-500" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between mb-1.5 items-center">
                  <span className="text-sm text-slate-600">Office Behaviour</span>
                  {canEdit ? (
                    <input type="number" min="0" max="5" step="0.5"
                      value={officeBehaviourInput}
                      onChange={e => setOfficeBehaviourInput(e.target.value)}
                      placeholder="0-5"
                      className="w-16 text-xs font-bold text-center border border-purple-200 rounded-lg px-2 py-1 outline-none focus:border-purple-500 text-slate-800"
                    />
                  ) : (
                    <span className="text-sm font-bold text-slate-800">
                      {stats.officeBehaviour !== null ? `${stats.officeBehaviour} / 5` : 'N/A'}
                    </span>
                  )}
                </div>
                <div className="h-2 rounded-full bg-purple-100">
                  {stats.officeBehaviour !== null && (
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${(stats.officeBehaviour / 5) * 100}%`, background: 'linear-gradient(90deg, #48306A, #8E5FD0)' }} />
                  )}
                </div>
              </div>
            </div>

            {/* Dress-up */}
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                <ComputerDesktopIcon className="h-4 w-4 text-purple-500" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between mb-1.5 items-center">
                  <span className="text-sm text-slate-600">Dress-up</span>
                  {canEdit ? (
                    <input type="number" min="0" max="5" step="0.5"
                      value={dressUpInput}
                      onChange={e => setDressUpInput(e.target.value)}
                      placeholder="0-5"
                      className="w-16 text-xs font-bold text-center border border-purple-200 rounded-lg px-2 py-1 outline-none focus:border-purple-500 text-slate-800"
                    />
                  ) : (
                    <span className="text-sm font-bold text-slate-800">
                      {stats.dressUp !== null ? `${stats.dressUp} / 5` : 'N/A'}
                    </span>
                  )}
                </div>
                <div className="h-2 rounded-full bg-purple-100">
                  {stats.dressUp !== null && (
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${(stats.dressUp / 5) * 100}%`, background: 'linear-gradient(90deg, #48306A, #8E5FD0)' }} />
                  )}
                </div>
              </div>
            </div>

            {/* Save button for admin/manager */}
            {canEdit && (
              <button onClick={handleSaveScore} disabled={isSaving}
                className="w-full py-2 rounded-xl text-xs font-bold text-white transition disabled:opacity-60 mt-1"
                style={{ background: 'linear-gradient(135deg, #48306A, #8E5FD0)' }}>
                {isSaving ? 'Saving...' : 'Save Scores'}
              </button>
            )}
          </div>
        </div>

        {/* Right: Score gauge */}
        <div className="flex flex-col items-center justify-center">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Combined Performance Score</p>
          <div className="relative h-36 w-36">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f0fa" strokeWidth="9" />
              <circle cx="50" cy="50" r="40" fill="none"
                stroke="url(#monthPerfGrad)" strokeWidth="9"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - stats.score / 100)}
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="monthPerfGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#48306A" />
                  <stop offset="100%" stopColor="#8E5FD0" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-4xl font-black text-slate-800">{stats.score}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide mt-0.5">out of 100</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full" style={{ background: 'linear-gradient(135deg,#48306A,#8E5FD0)' }} />
            <p className="text-xs text-slate-400">Attendance + Punctuality</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main AttendanceCalendar ---
const AttendanceCalendar = ({ employeeId, employee }) => {
  const [activeStartDate, setActiveStartDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);

  const year = activeStartDate.getUTCFullYear();
  const month = activeStartDate.getUTCMonth() + 1;

  const { data: attendanceData = [], isLoading } = useGetAttendanceForMonthQuery(
    { employeeId, year, month },
    { skip: !employeeId }
  );

  const attendanceMap = useMemo(() => {
    const map = new Map();
    attendanceData.forEach(item => map.set(item.date, item.status));
    return map;
  }, [attendanceData]);

  const legendItems = [
    { label: 'Present', className: 'present-tile' },
    { label: 'Absent', className: 'absent-tile' },
    { label: 'On Leave', className: 'leave-tile' },
    { label: 'Holiday', className: 'holiday-tile' },
    { label: 'Sunday', className: 'sunday-tile' },
  ];

  const getDateStr = (date) => {
    const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    return utcDate.toISOString().split('T')[0];
  };

  const tileContent = ({ date, view }) => {
    if (view !== 'month') return null;
    const dateStr = getDateStr(date);
    const status = attendanceMap.get(dateStr);
    if (status && status !== 'Future' && status !== 'Pending') {
      return <p className="tile-label">{status}</p>;
    }
    return null;
  };

  const tileClassName = ({ date, view }) => {
    if (view !== 'month') return null;
    const dateStr = getDateStr(date);
    const status = attendanceMap.get(dateStr);
    if (status === 'Present') return 'present-tile';
    if (status === 'Absent') return 'absent-tile';
    if (status === 'On Leave') return 'leave-tile';
    if (status === 'Holiday') return 'holiday-tile';
    if (date.getUTCDay() === 0) return 'sunday-tile';
    return null;
  };

  const handleDateClick = (date) => {
    if (!employee) return;
    const dateStr = getDateStr(date);
    const status = attendanceMap.get(dateStr);
    setSelectedDate(dateStr);
    setSelectedStatus(status);
  };

  const Legend = () => (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4 text-xs">
      {legendItems.map(({ label, className }) => (
        <div key={label} className="flex items-center gap-2">
          <span className={`h-3 w-3 rounded-full ${className}`}></span>
          <span className="dark:text-slate-300">{label}</span>
        </div>
      ))}
    </div>
  );

  // Wrapper for each tile to add hover tooltip
  const tileContentWithTooltip = ({ date, view }) => {
    if (view !== 'month') return null;
    const dateStr = getDateStr(date);
    const status = attendanceMap.get(dateStr);
    const isPast = date <= new Date();

    return (
      <PCStartTooltip
        employeeId={employeeId}
        monitoringName={employee?.monitoringName}
        date={dateStr}
      >
        <div className="w-full h-full flex items-center justify-center">
          {status && status !== 'Future' && status !== 'Pending' && (
            <p className="tile-label">{status}</p>
          )}
        </div>
      </PCStartTooltip>
    );
  };

  return (
    <div className="p-0 sm:p-2 lg:p-4">
      {isLoading && <div className="text-center p-4">Loading attendance...</div>}
      <Calendar
        className="custom-calendar"
        activeStartDate={activeStartDate}
        onActiveStartDateChange={({ activeStartDate }) => {
          setActiveStartDate(new Date(Date.UTC(activeStartDate.getFullYear(), activeStartDate.getMonth(), 1)));
        }}
        value={new Date()}
        tileContent={employee ? tileContentWithTooltip : tileContent}
        tileClassName={tileClassName}
        onClickDay={handleDateClick}
        showNeighboringMonth={false}
        prev2Label={null}
        next2Label={null}
        prevLabel={<ChevronLeftIcon className="h-6 w-6" />}
        nextLabel={<ChevronRightIcon className="h-6 w-6" />}
      />
      <Legend />

      {employee && attendanceData.length > 0 && (
        <MonthlyPerformanceReport
          employee={employee}
          attendanceData={attendanceData}
          year={year}
          month={month}
        />
      )}

      <PerformanceReportModal
        isOpen={!!selectedDate}
        onClose={() => setSelectedDate(null)}
        employee={employee}
        date={selectedDate}
        attendanceStatus={selectedStatus}
      />
    </div>
  );
};

export default AttendanceCalendar;
