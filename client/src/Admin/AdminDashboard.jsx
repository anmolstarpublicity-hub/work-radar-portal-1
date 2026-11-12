import React, { useState, useEffect, useMemo } from 'react';
import {
  HomeIcon, UsersIcon, ClipboardDocumentCheckIcon, UserGroupIcon, CalendarDaysIcon, ClipboardDocumentListIcon, EyeIcon, ListBulletIcon, CheckBadgeIcon, ChartBarIcon, TrophyIcon, TrashIcon, MegaphoneIcon, ChevronDoubleLeftIcon, ArrowLeftIcon, BuildingOffice2Icon, BuildingLibraryIcon, ExclamationTriangleIcon, ArrowDownTrayIcon, BriefcaseIcon, CalendarIcon, DocumentTextIcon, Cog8ToothIcon, ArrowRightOnRectangleIcon, ChevronDownIcon, ClockIcon, LinkIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../app/authSlice';
import { useGetEmployeesQuery, useGetReportsByEmployeeQuery, useDeleteReportMutation, useProcessPastDueTasksMutation } from '../services/EmployeApi';
import Sidebar from '../shared/Sidebar.jsx';
import AppHeader from '../app/AppHeader.jsx';
import DurationFilter from '../shared/DurationFilter.jsx';
// useLogoutMutation removed (unused)
import { XMarkIcon } from '@heroicons/react/24/outline';

const EmployeeManagement = React.lazy(() => import('./EmployeeManagement'));
const AssignEmployee = React.lazy(() => import('./AssignEmployee'));
const Dashboard = React.lazy(() => import('./Dashboard.jsx'));
const HolidayManagement = React.lazy(() => import('./HolidayManagement'));
const ViewAllTasks = React.lazy(() => import('./ViewAllTasks'));
const TaskOverview = React.lazy(() => import('./TaskOverview'));
const TaskApprovals = React.lazy(() => import('./TaskApprovals'));
const AssignTask = React.lazy(() => import('./AssignTask'));
const SeniorAssignTask = React.lazy(() => import('../Senior/AssignTask'));
const EmployeeOfTheMonth = React.lazy(() => import('./EmployeeOfTheMonth'));
const HallOfFame = React.lazy(() => import('./HallOfFame'));
const AdminProfile = React.lazy(() => import('./AdminProfile'));
const AttendanceManagement = React.lazy(() => import('./AttendanceManagement.jsx'));
const ManageAnnouncements = React.lazy(() => import('./ManageAnnouncements'));
const AllEmployeeAttendance = React.lazy(() => import('./AllEmployeeAttendance'));
const TaskDetailsModal = React.lazy(() => import('./TaskOverview.jsx')
  .then(module => ({ default: module.TaskDetailsModal })));
const Analytics = React.lazy(() => import('../Employee/EmployeDashboard.jsx')
  .then(module => ({ default: module.Analytics })));

const DeleteReportModal = ({ isOpen, onClose, onConfirm, report, isDeleting }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 dark:bg-black/70">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-sm">
        <div className="p-6 text-center">
          <div className="mx-auto bg-red-100 dark:bg-red-500/10 rounded-full h-12 w-12 flex items-center justify-center my-4">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Confirm Deletion</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Are you sure you want to permanently delete the report from <strong className="text-slate-700 dark:text-slate-300">{new Date(report.reportDate).toLocaleDateString()}</strong>? This action cannot be undone.</p>
        </div>
        <div className="p-4 bg-slate-50 rounded-b-lg flex justify-center gap-3">
          <button type="button" onClick={onClose} className="bg-white hover:bg-slate-100 text-slate-700 font-bold py-2 px-4 rounded-lg border border-slate-300 text-sm">Cancel</button>
          <button type="button" onClick={onConfirm} disabled={isDeleting} className="inline-flex items-center justify-center bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg text-sm disabled:bg-red-400">
            {isDeleting && <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" />}
            {isDeleting ? 'Deleting...' : 'Confirm Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

export const TeamReports = ({ seniorId }) => {
  const user = useSelector(selectCurrentUser);
  const isAuthenticated = !!user?._id;
  
  const { data: employees, isLoading: isLoadingEmployees, isError: isErrorEmployees } = useGetEmployeesQuery(undefined, { skip: !isAuthenticated });
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [viewingTask, setViewingTask] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingReport, setDeletingReport] = useState(null);
  const [viewingTaskNumber, setViewingTaskNumber] = useState(null);
  const [expandedReportId, setExpandedReportId] = useState(null);
  const [lightboxUrl, setLightboxUrl] = useState(null);
  const [filterType, setFilterType] = useState('month');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [deleteReport, { isLoading: isDeleting }] = useDeleteReportMutation();

  const { data: reports, isLoading: isLoadingReports } = useGetReportsByEmployeeQuery(selectedEmployee?._id, {
    skip: !selectedEmployee,
  });

  const filteredEmployees = useMemo(() => {
    if (!employees) return [];
    
    let employeesToShow = employees;

    // If a seniorId is provided (Manager/Team Lead view), filter for their subordinates
    if (seniorId) {
      const getAllSubordinates = (managerId, allEmps) => {
        const getTeamLeadId = (emp) => emp.teamLead?._id || emp.teamLead;
        const subordinates = [];
        const queue = allEmps.filter(emp => getTeamLeadId(emp) === managerId);
        const visited = new Set(queue.map(e => e._id));
        while (queue.length > 0) {
          const currentEmployee = queue.shift();
          subordinates.push(currentEmployee);
          const directReports = allEmps.filter(emp => getTeamLeadId(emp) === currentEmployee._id);
          for (const report of directReports) {
            if (!visited.has(report._id)) {
              visited.add(report._id);
              queue.push(report);
            }
          }
        }
        return subordinates;
      };
      employeesToShow = getAllSubordinates(seniorId, employees);
    }

    return employeesToShow.filter(employee =>
      employee.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [employees, searchTerm, seniorId]);

  // Set default filter to current month
  useEffect(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setDateRange({
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    });
  }, []);

  // Update date range when filterType changes
  useEffect(() => {
    if (filterType === 'week') {
      const now = new Date();
      const day = now.getDay();
      const start = new Date(now); start.setDate(now.getDate() - day);
      const end = new Date(start); end.setDate(start.getDate() + 6);
      setDateRange({ startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] });
    } else if (filterType === 'month') {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setDateRange({ startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] });
    }
  }, [filterType]);

  const filteredReports = useMemo(() => {
    if (!reports) return [];
    if (!dateRange.startDate || !dateRange.endDate) return reports;
    const start = new Date(dateRange.startDate);
    const end = new Date(dateRange.endDate);
    end.setHours(23, 59, 59, 999);
    return reports.filter(r => {
      const d = new Date(r.reportDate);
      return d >= start && d <= end;
    });
  }, [reports, dateRange]);

  const handleDownloadSheet = async () => {
    if (!selectedEmployee || !reports || reports.length === 0) {
      toast.error('No reports available to download for this employee.');
      return;
    }

    try {
      const { downloadReportSpreadsheet } = await import('../utils/reportSpreadsheet.js');
      const headers = [
        'Employee Name', 'Employee ID', 'Report Date', 'Report Status', 'Employee Notes',
        'Task Title', 'Task Description', 'Completion %', 'Time Spent (hours)', 'Reference Link',
      ];
      const rows = [headers];

      reports.forEach(report => {
        let data = {};
        try { data = JSON.parse(report.content); } catch { /* ignore */ }

        const reportDate = new Date(report.reportDate).toLocaleDateString();
        const baseRow = [
          selectedEmployee.name, selectedEmployee.employeeId, reportDate, report.status,
          data.reportNote || 'N/A',
        ];

        if (data.taskUpdates && data.taskUpdates.length > 0) {
          data.taskUpdates.forEach(update => {
            rows.push([
              ...baseRow,
              update.taskId?.title || 'N/A',
              update.taskId?.description || 'N/A',
              update.completion || '0',
              update.timeSpent ?? 'N/A',
              update.link || 'N/A',
            ]);
          });
        } else {
          rows.push([...baseRow, 'No task updates in this report', '', '', '', '']);
        }
      });

      downloadReportSpreadsheet(
        rows,
        `Reports_${selectedEmployee.name.replace(/\s/g, '_')}.xlsx`
      );
    } catch (error) {
      console.error('Failed to generate the report spreadsheet:', error);
      toast.error('Failed to generate the report spreadsheet.');
    }
  };

  const renderScreenshots = (update) => {
    const urls = update.screenshotUrls?.length ? update.screenshotUrls
      : update.screenshotUrl ? [update.screenshotUrl]
      : [];
    if (!urls.length) return null;
    return (
      <div className="px-4 py-3 border-t border-purple-100">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
          Screenshots ({urls.length})
        </p>
        <div className="flex flex-wrap gap-2">
          {urls.map((url, idx) => (
            <button key={idx} onClick={() => setLightboxUrl(url)}
              className="flex-shrink-0 h-20 w-20 rounded-xl overflow-hidden border border-purple-100 hover:ring-2 hover:ring-purple-400 transition focus:outline-none">
              <img src={url} alt={`screenshot-${idx+1}`} className="w-full h-full object-cover"/>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderReportContent = (content) => {
    try {
      const data = JSON.parse(content);
      if (data.taskUpdates) {
        return (
          <div className="space-y-3">
            {data.reportNote ? (
              <div className="mb-4 bg-purple-50 border border-purple-100 rounded-xl p-4">
                <h4 className="text-[10px] font-bold text-purple-400 uppercase tracking-wider mb-1">Employee Notes</h4>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{data.reportNote}</p>
              </div>
            ) : null}
            {data.taskUpdates.map((update, i) => (
              <div key={i} className="bg-white border border-purple-100 rounded-xl overflow-hidden">
                <div className="flex justify-between items-center px-4 py-2.5 bg-purple-50 border-b border-purple-100">
                  <p className="font-bold text-slate-800 text-sm">
                    Task {i + 1}: {update.taskId?.title || 'Unknown Task'}
                  </p>
                  {update.taskId && (
                    <button onClick={() => {
                      setViewingTask(update.taskId);
                      setViewingTaskNumber(i + 1);
                    }} className="text-xs font-bold px-3 py-1 rounded-lg text-white transition flex-shrink-0 ml-2"
                      style={{ background: 'linear-gradient(135deg,#48306A,#8E5FD0)' }}>
                      Details
                    </button>
                  )}
                </div>
                {update.note ? (
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap px-4 py-3">{update.note}</p>
                ) : (
                  <p className="text-xs text-slate-400 italic px-4 py-3">No description submitted for this task.</p>
                )}
                {(update.timeSpent !== undefined || update.link) && (
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-4 pb-3 text-xs text-slate-500">
                    {update.timeSpent !== undefined && update.timeSpent !== '' && (
                      <span><strong className="text-slate-600">Time spent:</strong> {update.timeSpent} {Number(update.timeSpent) === 1 ? 'hour' : 'hours'}</span>
                    )}
                    {update.link && (
                      <a href={update.link} target="_blank" rel="noreferrer" className="text-purple-600 hover:text-purple-800 underline">
                        Open submitted link
                      </a>
                    )}
                  </div>
                )}
                {renderScreenshots(update)}
              </div>
            ))}
          </div>
        );
      }
      return <p className="whitespace-pre-line break-words text-sm text-slate-700">{JSON.stringify(data, null, 2)}</p>;
    } catch {
      return <p className="whitespace-pre-line break-words text-sm text-slate-700">{content}</p>;
    }
  };

  return (
    <div className="min-h-full p-6 lg:p-8" style={{ backgroundColor: '#DFCDFE' }}>

      {/* ── Employee selection ──────────────────────────────────── */}
      {!selectedEmployee ? (
        <>
          {/* Header */}
          <div className="mb-2">
            <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Team Reports</h2>
            <div className="h-1 w-12 rounded-full mt-1 mb-3" style={{ background: 'linear-gradient(90deg,#48306A,#8E5FD0)' }} />
            <p className="text-slate-500 text-sm">Select An Employee To View Their Submitted Reports</p>
          </div>

          {/* Search */}
          <div className="my-6">
            <div className="relative w-full sm:w-80">
              <svg className="h-4 w-4 text-slate-400 absolute top-1/2 left-3 -translate-y-1/2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
              <input
                type="text"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-purple-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-300 shadow-sm"
              />
            </div>
          </div>

          {isLoadingEmployees ? (
            <p className="text-slate-500 font-medium">Loading employees...</p>
          ) : isErrorEmployees ? (
            <p className="text-red-500 font-medium">Failed to load employees.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 pb-8">
              {filteredEmployees.map(employee => (
                <div
                  key={employee._id}
                  onClick={() => setSelectedEmployee(employee)}
                  className="bg-white rounded-2xl border border-purple-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 overflow-hidden flex flex-col cursor-pointer"
                >
                  {/* Banner */}
                  <div className="h-24 w-full relative flex-shrink-0" style={{ background: 'linear-gradient(135deg,#48306A,#8E5FD0)' }}>
                    <div className="absolute -bottom-14 left-1/2 -translate-x-1/2">
                      <img
                        src={employee.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=8E5FD0&color=fff`}
                        alt={employee.name}
                        onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=8E5FD0&color=fff`; }}
                        className="h-28 w-28 rounded-full object-cover border-4 border-white shadow-md"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col items-center pt-16 px-5 pb-5">
                    <h3 className="mt-2 text-base font-bold text-slate-800 text-center">{employee.name}</h3>
                    <p className="text-xs text-purple-500 font-semibold">{employee.role}</p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">{employee.employeeId}</p>
                    <div className="mt-4 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-white"
                      style={{ background: 'linear-gradient(135deg,#48306A,#8E5FD0)' }}>
                      View Reports
                    </div>
                  </div>
                </div>
              ))}
              {filteredEmployees.length === 0 && (
                <div className="col-span-full bg-white rounded-2xl border border-purple-100 p-16 text-center">
                  <p className="font-bold text-slate-600">No Employees Found</p>
                  <p className="text-sm text-slate-400 mt-1">Try adjusting your search.</p>
                </div>
              )}
            </div>
          )}
        </>
      ) : (

        /* ── Report list view ──────────────────────────────────── */
        <div>
          {/* Header with back */}
          <div className="mb-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSelectedEmployee(null)}
                className="p-2 rounded-xl bg-white border border-purple-200 hover:bg-purple-50 shadow-sm transition"
              >
                <ArrowLeftIcon className="h-5 w-5 text-purple-600" />
              </button>
              <div>
                <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
                  Reports — <span style={{ color: '#48306A' }}>{selectedEmployee.name}</span>
                </h2>
                <div className="h-1 w-12 rounded-full mt-1" style={{ background: 'linear-gradient(90deg,#48306A,#8E5FD0)' }} />
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <DurationFilter filterType={filterType} setFilterType={setFilterType} dateRange={dateRange} setDateRange={setDateRange} variant="theme" />
              <button
                onClick={handleDownloadSheet}
                disabled={!reports || reports.length === 0}
                className="inline-flex items-center gap-2 text-sm font-bold text-white px-4 py-2.5 rounded-xl shadow-sm transition hover:opacity-90 disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg,#48306A,#8E5FD0)' }}
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                Download Sheet
              </button>
            </div>
          </div>

          {isLoadingReports && (
            <p className="text-slate-500 font-medium mb-4">Loading reports...</p>
          )}

          {/* Report accordion cards */}
          <div className="space-y-3 pb-8">
            {filteredReports.length > 0 ? filteredReports.map(report => {
              let taskUpdates = [];
              let reportNote = '';
              try {
                const data = JSON.parse(report.content);
                taskUpdates = data.taskUpdates || [];
                reportNote = data.reportNote || '';
              } catch { /* ignore */ }

              const isOpen = expandedReportId === report._id;
              const taskCount = taskUpdates.length;

              return (
                <div key={report._id} className="bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden">

                  {/* Date card header — always visible */}
                  <button
                    onClick={() => setExpandedReportId(isOpen ? null : report._id)}
                    className="w-full flex items-center justify-between px-6 py-4 hover:bg-purple-50/50 transition"
                  >
                    <div className="flex items-center gap-4">
                      {/* Calendar icon block */}
                      <div className="flex-shrink-0 h-11 w-11 rounded-xl flex flex-col items-center justify-center border border-purple-100"
                        style={{ background: 'linear-gradient(135deg,#48306A,#8E5FD0)' }}>
                        <span className="text-[10px] font-bold text-purple-200 uppercase leading-none">
                          {new Date(report.reportDate).toLocaleDateString('en-US', { month: 'short' })}
                        </span>
                        <span className="text-lg font-extrabold text-white leading-tight">
                          {new Date(report.reportDate).getUTCDate()}
                        </span>
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-slate-800 text-sm">
                          {new Date(report.reportDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {taskCount} task{taskCount !== 1 ? 's' : ''} reported
                          {reportNote ? ' · has notes' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                        report.status === 'Submitted'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {report.status}
                      </span>
                      <ChevronDownIcon className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  {/* Expanded content */}
                  {isOpen && (
                    <div className="border-t border-purple-100 px-6 py-4 space-y-3 bg-slate-50/40">

                      {/* Notes */}
                      {reportNote && (
                        <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
                          <h4 className="text-[10px] font-bold text-purple-400 uppercase tracking-wider mb-1">Employee Notes</h4>
                          <p className="text-sm text-slate-700 whitespace-pre-wrap">{reportNote}</p>
                        </div>
                      )}

                      {/* Task cards */}
                      {taskUpdates.map((update, i) => (
                        <div key={i} className="bg-white border border-purple-100 rounded-xl overflow-hidden">
                          <div className="flex justify-between items-center px-4 py-2.5 bg-white border-b border-purple-100">
                            <p className="font-bold text-slate-800 text-sm truncate">
                              Task {i + 1}: {update.taskId?.title || 'Unknown Task'}
                            </p>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {update.timeSpent !== undefined && update.timeSpent !== '' && (
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-100 px-2.5 py-1.5 text-orange-800 shadow-sm ring-1 ring-orange-100/80 whitespace-nowrap">
                                  <ClockIcon className="h-3.5 w-3.5 text-orange-600" aria-hidden="true" />
                                  <span className="text-xs font-extrabold tabular-nums">{update.timeSpent}</span>
                                  <span className="text-[9px] font-bold uppercase tracking-wider text-orange-700">
                                    {Number(update.timeSpent) === 1 ? 'hr' : 'hrs'}
                                  </span>
                                </span>
                              )}
                              {update.taskId && (
                                <button
                                  onClick={() => { setViewingTask(update.taskId); setViewingTaskNumber(i + 1); }}
                                  className="text-xs font-bold px-3 py-1 rounded-lg text-white transition flex-shrink-0 ml-2"
                                  style={{ background: 'linear-gradient(135deg,#48306A,#8E5FD0)' }}
                                >
                                  Details
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between gap-3 px-4 py-2.5" style={{ background: 'linear-gradient(135deg,#48306A,#8E5FD0)' }}>
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500 text-white uppercase tracking-wide flex-shrink-0">Task Update</span>
                              {update.note ? (
                                <p className="text-sm text-white leading-relaxed whitespace-pre-wrap min-w-0">{update.note}</p>
                              ) : (
                                <p className="text-xs text-white/70 italic">No description submitted for this task.</p>
                              )}
                            </div>
                            {update.link && (
                              <a
                                href={update.link}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-full border border-white/40 bg-white/15 px-3 py-1 text-[10px] font-bold text-white whitespace-nowrap transition hover:bg-white/25 focus:outline-none focus:ring-2 focus:ring-white/70"
                              >
                                <LinkIcon className="h-3 w-3" aria-hidden="true" />
                                Open Link
                              </a>
                            )}
                          </div>
                          {renderScreenshots(update)}
                        </div>
                      ))}

                      {taskUpdates.length === 0 && !reportNote && (
                        <p className="text-sm text-slate-400 italic text-center py-4">No content in this report.</p>
                      )}

                      {/* Delete action */}
                      {(user?.role === 'Admin' || user?.role === 'Super Admin') && (
                        <div className="pt-3 flex justify-end">
                          <button
                            onClick={() => setDeletingReport(report)}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-red-500 hover:text-red-600 transition"
                          >
                            <TrashIcon className="h-4 w-4" /> Delete Report
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            }) : (
              <div className="bg-white rounded-2xl border border-purple-100 p-16 text-center">
                <DocumentTextIcon className="h-12 w-12 mx-auto text-purple-200 mb-4" />
                <p className="font-bold text-slate-600">No Reports Found</p>
                <p className="text-sm text-slate-400 mt-1">
                  {reports && reports.length > 0
                    ? 'No reports match the selected date range.'
                    : 'This employee has not submitted any reports yet.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <TaskDetailsModal
        isOpen={!!viewingTask}
        onClose={() => setViewingTask(null)}
        task={viewingTask}
        taskNumber={viewingTaskNumber}
      />
      <DeleteReportModal
        isOpen={!!deletingReport}
        onClose={() => setDeletingReport(null)}
        onConfirm={async () => {
          await deleteReport(deletingReport._id).unwrap();
          toast.success('Report deleted.');
          setDeletingReport(null);
        }}
        report={deletingReport}
        isDeleting={isDeleting}
      />

      {/* Lightbox */}
      {lightboxUrl && (
        <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}>
          <div className="relative max-w-4xl w-full max-h-[90vh] flex items-center justify-center"
            onClick={e => e.stopPropagation()}>
            <img src={lightboxUrl} alt="Screenshot" className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain"/>
            <button onClick={() => setLightboxUrl(null)}
              className="absolute -top-4 -right-4 h-9 w-9 rounded-full bg-white flex items-center justify-center shadow-lg hover:bg-slate-100 transition">
              <XMarkIcon className="h-5 w-5 text-slate-700"/>
            </button>
            <a href={lightboxUrl} target="_blank" rel="noreferrer"
              className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs font-bold text-white bg-black/50 rounded-full px-4 py-1.5 hover:bg-black/70 transition">
              Open full size
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

const ManagePermissionsModal = ({ isOpen, onClose, employee, permissions, onChange, onSave, isSaving }) => {
  if (!isOpen || !employee) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/70">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-bold text-gray-800">Manage Permissions</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-blue-600 transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {/* Content */}
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <img
              src={employee.profilePicture || `https://ui-avatars.com/api/?name=${employee.name}&background=random`}
              alt={employee.name}
              onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${employee.name}&background=random`; }}
              className="h-10 w-10 rounded-full border border-blue-200 object-cover"
            />
            <div>
              <div className="font-semibold text-blue-900">{employee.name}</div>
              <div className="text-xs text-gray-500">{employee.role}</div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-medium text-gray-700">Edit Own Profile</span>
              <input
                type="checkbox"
                checked={permissions.canEditProfile}
                onChange={() => onChange('canEditProfile')}
                className="h-5 w-5 accent-blue-600"
              />
            </div>
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-medium text-gray-700">View Team</span>
              <input
                type="checkbox"
                checked={permissions.canViewTeam}
                onChange={() => onChange('canViewTeam')}
                className="h-5 w-5 accent-blue-600"
              />
            </div>
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-medium text-gray-700">Edit Assigned Tasks</span>
              <input
                type="checkbox"
                checked={permissions.canUpdateTask}
                onChange={() => onChange('canUpdateTask')}
                className="h-5 w-5 accent-blue-600"
              />
            </div>
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-medium text-gray-700">Approve Tasks</span>
              <input
                type="checkbox"
                checked={permissions.canApproveTask}
                onChange={() => onChange('canApproveTask')}
                className="h-5 w-5 accent-blue-600"
              />
            </div>
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-medium text-gray-700">Assign Tasks</span>
              <input
                type="checkbox"
                checked={permissions.canAssignTask}
                onChange={() => onChange('canAssignTask')}
                className="h-5 w-5 accent-blue-600"
              />
            </div>
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-medium text-gray-700">Delete Tasks</span>
              <input
                type="checkbox"
                checked={permissions.canDeleteTask}
                onChange={() => onChange('canDeleteTask')}
                className="h-5 w-5 accent-blue-600"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-700">View Analytics</span>
              <input
                type="checkbox"
                checked={permissions.canViewAnalytics}
                onChange={() => onChange('canViewAnalytics')}
                className="h-5 w-5 accent-blue-600"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={isSaving}
              className="px-5 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition disabled:bg-gray-400"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function AdminPageLayout() {
  const [activeView, setActiveView] = useState({ component: 'dashboard', props: {} });
  const user = useSelector(selectCurrentUser);
  const isAuthenticated = !!user?._id;
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [processPastDueTasks] = useProcessPastDueTasksMutation();

  useEffect(() => {
    // When the admin's dashboard loads, trigger the backend to process any past-due tasks.
    // This automatically moves tasks to 'Pending Verification' after their due date has passed.
    if (isAuthenticated) {
      const processTasks = async () => {
        await processPastDueTasks();
      };
      processTasks();
    }
  }, [processPastDueTasks, isAuthenticated]);

  const pageTitles = {
    dashboard: 'Dashboard',
    employees: 'Employee Management',
    assign: 'Employee Assignment',
    'attendance-management': 'Attendance Management',
    'team-reports': 'Team Reports',
    'assign-task': 'Assign Task to Employee',
    'assign-to-managers': 'Assign to Managers',
    holidays: 'Holiday Management',
    profile: 'My Profile',
    'view-tasks': 'View Employee Tasks',
    'task-overview': 'Task Overview',
    'task-approvals': 'Pending Approvals',
    'employee-of-the-month': 'Employee of the Month',
    'hall-of-fame': 'Hall of Fame',
    'analytics': 'Performance Analytics',
    'all-attendance': 'All Employee Attendance',
    'announcements': 'Manage Announcements',
  };

  const handleNavigation = (view) => {
    if (typeof view === 'string') {
      setActiveView({ component: view, props: {} });
    } else {
      setActiveView(view);
    }
  };

  const renderActiveComponent = () => {
    switch (activeView.component) {
      case 'dashboard': return <Dashboard onNavigate={handleNavigation} />;
      case 'employees': return <EmployeeManagement />;
      case 'assign': return <AssignEmployee />;
      case 'attendance-management': return <AttendanceManagement />;
      case 'team-reports': return <TeamReports />;
      case 'holidays': return <HolidayManagement />; 
      case 'assign-task': return <AssignTask />;
      case 'assign-to-managers': return <SeniorAssignTask assignToManagers={true} />;
      case 'view-tasks': return <ViewAllTasks {...activeView.props} />;
      case 'task-overview': return <TaskOverview />;
      case 'task-approvals': return <TaskApprovals />;
      case 'employee-of-the-month': return <EmployeeOfTheMonth />; // New component
      case 'hall-of-fame': return <HallOfFame />;
      case 'analytics':
        return (
          <React.Suspense fallback={<div className="p-6 text-sm text-slate-500">Loading analytics...</div>}>
            <Analytics user={user} />
          </React.Suspense>
        );
      case 'announcements': return <ManageAnnouncements />;
      case 'all-attendance': return <AllEmployeeAttendance />;
      case 'profile': return <AdminProfile user={user} onNavigate={handleNavigation} />;
      default: return <Dashboard />;
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
        `}
      </style>
      <Sidebar activeComponent={activeView.component} setActiveComponent={handleNavigation} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} isCollapsed={isSidebarCollapsed} setIsCollapsed={setIsSidebarCollapsed} />
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)}></div>}
      <div className="flex flex-1 flex-col overflow-hidden rounded-2xl bg-white shadow-sm">
        <AppHeader pageTitle={pageTitles[activeView.component]} setActiveComponent={handleNavigation} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <React.Suspense fallback={<div className="p-6 text-sm text-slate-500">Loading section...</div>}>
            {renderActiveComponent()}
          </React.Suspense>
        </main>
      </div>
    </div>
  );
}