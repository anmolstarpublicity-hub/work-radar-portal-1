import React, { useState, useMemo } from 'react';
import { useGetEmployeesQuery, useGetAllTasksQuery, useUpdateEmployeeMutation } from '../services/EmployeApi';
import {
  MagnifyingGlassIcon,
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const ROWS_PER_PAGE = 8;

// ── Pill badge ─────────────────────────────────────────────────────────────

const StatusBadge = ({ status }) => {
  const styles = {
    Present:     'border border-emerald-400 text-emerald-600 bg-white',
    Absent:      'border border-red-400    text-red-600    bg-white',
    'On Leave':  'border border-amber-400  text-amber-600  bg-white',
  };
  const dotColors = {
    Present:    'bg-emerald-500',
    Absent:     'bg-red-500',
    'On Leave': 'bg-amber-500',
  };
  const cls = styles[status] || 'border border-slate-300 text-slate-500 bg-white';
  const dot = dotColors[status] || 'bg-slate-400';
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${cls}`}>
      <span className={`h-2 w-2 rounded-full flex-shrink-0 ${dot}`} />
      {status}
    </span>
  );
};

const ReportBadge = ({ status }) => {
  const styles = {
    Submitted:        'border border-emerald-400 text-emerald-600 bg-white',
    Pending:          'border border-red-400    text-red-600    bg-white',
    'Missing Report': 'border border-orange-400 text-orange-600 bg-white',
    'No Task Assigned':'border border-slate-300  text-slate-500  bg-white',
    'Manual Override':'border border-purple-400 text-purple-600 bg-white',
  };
  const dotColors = {
    Submitted:         'bg-emerald-500',
    Pending:           'bg-red-500',
    'Missing Report':  'bg-orange-500',
    'No Task Assigned':'bg-slate-400',
    'Manual Override': 'bg-purple-500',
  };
  // Simplify display label
  const label =
    status === 'Report Submitted' ? 'Submitted' :
    status === 'Missing Report'   ? 'Pending'   :
    status === 'Manual Override'  ? 'Submitted' :
    status === 'No Task Assigned' ? 'Pending'   : status;

  const dotKey =
    label === 'Submitted' ? 'Submitted' :
    label === 'Pending'   ? 'Pending'   : status;

  const cls = styles[label] || 'border border-slate-300 text-slate-500 bg-white';
  const dot = dotColors[dotKey] || 'bg-slate-400';
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${cls}`}>
      <span className={`h-2 w-2 rounded-full flex-shrink-0 ${dot}`} />
      {label}
    </span>
  );
};

// ── Purple toggle ───────────────────────────────────────────────────────────

const PurpleToggle = ({ checked, onChange }) => (
  <label className="relative inline-flex items-center cursor-pointer">
    <input type="checkbox" className="sr-only peer" checked={checked} onChange={onChange} />
    <div
      className="w-11 h-6 rounded-full transition-colors duration-200 relative"
      style={{ background: checked ? 'linear-gradient(135deg,#48306A,#8E5FD0)' : '#e2e8f0' }}
    >
      <span
        className="absolute top-[2px] left-[2px] h-5 w-5 bg-white rounded-full shadow transition-transform duration-200"
        style={{ transform: checked ? 'translateX(20px)' : 'translateX(0)' }}
      />
    </div>
  </label>
);

// ── Column header with underline ────────────────────────────────────────────

const ColHeader = ({ children }) => (
  <th className="px-5 py-4 text-left">
    <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">{children}</span>
    <div className="h-0.5 w-full mt-1 rounded-full bg-slate-200" />
  </th>
);

// ── Main component ──────────────────────────────────────────────────────────

const AttendanceManagement = () => {
  const { data: employees = [], isLoading: isLoadingEmployees, refetch: refetchEmployees } = useGetEmployeesQuery();
  const { data: allTasks = [], isLoading: isLoadingTasks } = useGetAllTasksQuery();
  const [updateEmployee] = useUpdateEmployeeMutation();

  const [searchTerm, setSearchTerm]   = useState('');
  const [roleFilter, setRoleFilter]   = useState('All Roles');
  const [dateFilter, setDateFilter]   = useState(new Date().toISOString().split('T')[0]);
  const [localOverrides, setLocalOverrides] = useState({});
  const [page, setPage]               = useState(1);

  // Format date for display: "12 June 2026"
  const formattedDate = useMemo(() => {
    const d = new Date(dateFilter);
    return isNaN(d) ? dateFilter : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }, [dateFilter]);

  // Build processed rows
  const allRows = useMemo(() => {
    const targetDate = new Date(dateFilter);
    targetDate.setHours(0, 0, 0, 0);

    const tasksOnDate = allTasks.filter(task => {
      const d = new Date(task.createdAt);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === targetDate.getTime();
    });

    return employees.map(emp => {
      const cur = localOverrides[emp._id] ? { ...emp, ...localOverrides[emp._id] } : emp;
      const empTasks = tasksOnDate.filter(t => String(t.assignedTo?._id || t.assignedTo) === String(cur._id));

      let calculatedStatus = 'Present';
      let reportStatus     = 'No Task Assigned';

      if (empTasks.length > 0) {
        const hasMissing = empTasks.some(t =>
          !['Completed', 'Pending Verification', 'Not Completed'].includes(t.status) &&
          (t.progress || 0) === 0
        );
        calculatedStatus = hasMissing ? 'Absent' : 'Present';
        reportStatus     = hasMissing ? 'Missing Report' : 'Report Submitted';
      }

      if (cur.manualAttendanceStatus && cur.manualAttendanceDate === dateFilter) {
        calculatedStatus = cur.manualAttendanceStatus;
        reportStatus     = 'Manual Override';
      }

      return { ...cur, calculatedStatus, reportStatus };
    });
  }, [employees, allTasks, dateFilter, localOverrides]);

  // Apply search + role filter
  const filteredRows = useMemo(() => {
    let rows = allRows;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      rows = rows.filter(e =>
        e.name.toLowerCase().includes(q) ||
        (e.employeeId && e.employeeId.toLowerCase().includes(q))
      );
    }
    if (roleFilter !== 'All Roles') rows = rows.filter(e => e.role === roleFilter);
    return rows;
  }, [allRows, searchTerm, roleFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / ROWS_PER_PAGE));
  const pageRows   = filteredRows.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  const handleApply = () => { setPage(1); };
  const handleReset = () => {
    setSearchTerm('');
    setRoleFilter('All Roles');
    setDateFilter(new Date().toISOString().split('T')[0]);
    setPage(1);
  };

  const handleTogglePower = async (emp) => {
    const next = !emp.hasAttendancePower;
    setLocalOverrides(p => ({ ...p, [emp._id]: { ...(p[emp._id] || {}), hasAttendancePower: next } }));
    try {
      const fd = new FormData();
      fd.append('hasAttendancePower', next.toString());
      const res = await updateEmployee({ id: emp._id, formData: fd }).unwrap();
      if (res?.employee) {
        toast.success(`Attendance power ${next ? 'granted to' : 'revoked from'} ${emp.name}!`);
        refetchEmployees();
      } else throw new Error();
    } catch {
      setLocalOverrides(p => ({ ...p, [emp._id]: { ...(p[emp._id] || {}), hasAttendancePower: !next } }));
      toast.error('Failed to update delegation power.');
    }
  };

  const handleManualOverride = async (emp, status) => {
    setLocalOverrides(p => ({ ...p, [emp._id]: { ...(p[emp._id] || {}), manualAttendanceStatus: status, manualAttendanceDate: dateFilter } }));
    try {
      const fd = new FormData();
      fd.append('manualAttendanceStatus', status);
      fd.append('manualAttendanceDate', dateFilter);
      const res = await updateEmployee({ id: emp._id, formData: fd }).unwrap();
      if (res?.employee) {
        toast.success(`${emp.name} marked as ${status}.`);
        refetchEmployees();
      } else throw new Error();
    } catch {
      setLocalOverrides(p => ({ ...p, [emp._id]: { ...(p[emp._id] || {}), manualAttendanceStatus: emp.manualAttendanceStatus, manualAttendanceDate: emp.manualAttendanceDate } }));
      toast.error(`Failed to override attendance for ${emp.name}.`);
    }
  };

  if (isLoadingEmployees || isLoadingTasks) {
    return (
      <div className="min-h-full flex items-center justify-center" style={{ backgroundColor: '#DFCDFE' }}>
        <p className="text-slate-500 font-medium">Loading attendance data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-full p-6 lg:p-8" style={{ backgroundColor: '#DFCDFE' }}>

      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="mb-2">
        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Attendance Management</h2>
        <div className="h-1 w-12 rounded-full mt-1 mb-3" style={{ background: 'linear-gradient(90deg,#48306A,#8E5FD0)' }} />
        <p className="text-slate-500 text-sm">Monitor Daily Attendance Grids And Delegate Attendance Power To Managers</p>
      </div>

      {/* ── Toolbar ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 my-6">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px] max-w-xs">
          <MagnifyingGlassIcon className="h-4 w-4 text-slate-400 absolute top-1/2 left-3 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search By Name, Or Employee ID..."
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-purple-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-300 shadow-sm"
          />
        </div>

        {/* Date picker styled like image */}
        <div className="flex items-center gap-1.5 bg-white border border-purple-200 rounded-xl px-3 py-2.5 shadow-sm">
          <CalendarDaysIcon className="h-4 w-4 text-purple-400 flex-shrink-0" />
          <input
            type="date"
            value={dateFilter}
            max={new Date().toISOString().split('T')[0]}
            onChange={e => { setDateFilter(e.target.value); setPage(1); }}
            className="text-sm text-slate-700 font-semibold outline-none bg-transparent"
          />
          <svg className="h-4 w-4 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
        </div>

        {/* Role filter */}
        <div className="relative">
          <select
            value={roleFilter}
            onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
            className="appearance-none text-sm border border-purple-200 rounded-xl pl-4 pr-8 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-purple-300 shadow-sm font-semibold text-slate-700"
          >
            <option value="All Roles">All Roles</option>
            <option value="Manager">Managers</option>
            <option value="Employee">Employees</option>
          </select>
          <svg className="h-4 w-4 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
        </div>

        {/* Apply */}
        <button
          onClick={handleApply}
          className="px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-sm transition hover:opacity-90"
          style={{ background: 'linear-gradient(135deg,#48306A,#8E5FD0)' }}
        >
          Apply Filter
        </button>

        {/* Reset */}
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 bg-white border border-purple-200 shadow-sm hover:bg-purple-50 transition"
        >
          Reset <ArrowPathIcon className="h-4 w-4" />
        </button>
      </div>

      {/* ── Table card ───────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden pb-6">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-purple-100">
                <ColHeader>User Detail</ColHeader>
                <ColHeader>Role</ColHeader>
                <ColHeader>Status</ColHeader>
                <ColHeader>Report Status</ColHeader>
                <ColHeader>Delegation Power</ColHeader>
                <ColHeader>Quick Actions</ColHeader>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {pageRows.length > 0 ? pageRows.map(emp => (
                <tr key={emp._id} className="hover:bg-purple-50/40 transition-colors">

                  {/* User Detail */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <img
                        src={emp.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=8E5FD0&color=fff`}
                        alt={emp.name}
                        onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=8E5FD0&color=fff`; }}
                        className="h-9 w-9 rounded-full object-cover border-2 border-purple-100 flex-shrink-0"
                      />
                      <div>
                        <p className="text-sm font-bold text-slate-800">{emp.name}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{emp.employeeId || '—'}</p>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className="text-sm text-slate-600 font-medium">{emp.role || '—'}</span>
                  </td>

                  {/* Status */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <StatusBadge status={emp.calculatedStatus} />
                  </td>

                  {/* Report Status */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <ReportBadge status={emp.reportStatus} />
                  </td>

                  {/* Delegation Power */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-500">Grant Power</span>
                      <PurpleToggle
                        checked={emp.hasAttendancePower || false}
                        onChange={() => handleTogglePower(emp)}
                      />
                    </div>
                  </td>

                  {/* Quick Actions */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleManualOverride(emp, 'Present')}
                        className="px-3 py-1.5 rounded-full text-xs font-bold border border-emerald-400 text-emerald-600 bg-white hover:bg-emerald-50 transition"
                      >
                        Present
                      </button>
                      <button
                        onClick={() => handleManualOverride(emp, 'Absent')}
                        className="px-3 py-1.5 rounded-full text-xs font-bold border border-red-400 text-red-600 bg-white hover:bg-red-50 transition"
                      >
                        Absent
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-sm text-slate-400">
                    No employees matched the active filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ─────────────────────────────────────────── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-6 px-6">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="h-9 w-9 flex items-center justify-center rounded-full border border-purple-200 bg-white text-slate-500 hover:bg-purple-50 disabled:opacity-40 transition"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className="h-9 w-9 flex items-center justify-center rounded-full text-sm font-bold transition"
                style={n === page
                  ? { background: 'linear-gradient(135deg,#48306A,#8E5FD0)', color: '#fff' }
                  : { background: '#fff', border: '1px solid #e9d5ff', color: '#48306A' }
                }
              >
                {n}
              </button>
            ))}

            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="h-9 w-9 flex items-center justify-center rounded-full border border-purple-200 bg-white text-slate-500 hover:bg-purple-50 disabled:opacity-40 transition"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceManagement;
