import React, { useState, useEffect, useMemo } from 'react';
import {
  HomeIcon, UsersIcon, ClipboardDocumentCheckIcon, UserGroupIcon, CalendarDaysIcon, ClipboardDocumentListIcon, EyeIcon, ListBulletIcon, CheckBadgeIcon, ChartBarIcon, TrophyIcon, TrashIcon, MegaphoneIcon, ChevronDoubleLeftIcon, ArrowLeftIcon, BuildingOffice2Icon, BuildingLibraryIcon, ExclamationTriangleIcon, ArrowDownTrayIcon, BriefcaseIcon, CalendarIcon, DocumentTextIcon, Cog8ToothIcon, ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import EmployeeManagement from './EmployeeManagement';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../app/authSlice';
import AssignEmployee from './AssignEmployee';
import { useGetEmployeesQuery, useGetReportsByEmployeeQuery, useDeleteReportMutation, useProcessPastDueTasksMutation } from '../services/EmployeApi';
import Dashboard from './Dashboard.jsx';
import HolidayManagement from './HolidayManagement';
// logos imported previously but unused; removed to satisfy lint
import ViewAllTasks from './ViewAllTasks';
import TaskOverview from './TaskOverview';
import TaskApprovals from './TaskApprovals';
import AssignTask from './AssignTask';
import SeniorAssignTask from '../Senior/AssignTask';
import EmployeeOfTheMonth from './EmployeeOfTheMonth'; // New import
import Sidebar from '../shared/Sidebar.jsx';
import HallOfFame from './HallOfFame';
import AdminProfile from './AdminProfile'; 
import AppHeader from '../app/AppHeader.jsx';
import AttendanceManagement from './AttendanceManagement.jsx';
import ManageAnnouncements from './ManageAnnouncements';
import AllEmployeeAttendance from './AllEmployeeAttendance';
import GooglePieChart from './GooglePieChart.jsx';
import { TaskDetailsModal } from './TaskOverview.jsx';
import * as XLSX from 'xlsx'; 
import { Analytics } from '../Employee/EmployeDashboard.jsx';
// useLogoutMutation removed (unused)
import { XMarkIcon } from '@heroicons/react/24/outline';

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

  const handleDownloadSheet = () => {
    if (!selectedEmployee || !reports || reports.length === 0) {
      toast.error('No reports available to download for this employee.');
      return;
    }

    const dataForSheet = [];
    const headers = [
      'Employee Name', 'Employee ID', 'Report Date', 'Report Status', 'Employee Notes', 'Task Title', 'Task Description', 'Completion %'
    ];

    dataForSheet.push(headers);

    reports.forEach(report => {
      let data = {};
      try { data = JSON.parse(report.content); } catch { /* ignore */ }

      const reportDate = new Date(report.reportDate).toLocaleDateString();
      const baseRow = [
        selectedEmployee.name, selectedEmployee.employeeId, reportDate, report.status, data.reportNote || 'N/A'
      ];

      if (data.taskUpdates && data.taskUpdates.length > 0) {
        data.taskUpdates.forEach(update => {
          const taskRow = [
            update.taskId?.title || 'N/A',
            update.taskId?.description || 'N/A',
            update.completion || '0'
          ];
          dataForSheet.push([...baseRow, ...taskRow]);
        });
      } else {
        // If no task updates, add a row with just the report info
        const emptyTaskRow = ['No task updates in this report', '', ''];
        dataForSheet.push([...baseRow, ...emptyTaskRow]);
      }
    });

    // Create a new workbook and a worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(dataForSheet);

    // --- Professional Styling ---

    // 1. Set column widths
    const columnWidths = [
      { wch: 22 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 30 }, // Employee, ID, Date, Status, Notes
      { wch: 40 }, { wch: 55 }, { wch: 15 }  // Task Title, Description, Completion
    ];
    ws['!cols'] = columnWidths;

    // 2. Define styles
    const border = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };
    const headerStyle = {
      font: { bold: true, color: { rgb: "FFFFFFFF" } },
      fill: { fgColor: { rgb: "FF4F81BD" } }, // Dark Blue
      alignment: { vertical: "center", horizontal: "center" },
      border,
    };
    const cellStyle = (isAlt) => ({
      fill: { fgColor: { rgb: isAlt ? "FFF2F2F2" : "FFFFFFFF" } }, // Zebra stripes
      alignment: { vertical: "top", wrapText: true },
      border,
    });
    const centeredCellStyle = (isAlt) => ({
      ...cellStyle(isAlt),
      alignment: { ...cellStyle(isAlt).alignment, horizontal: "center" },
    });

    // 3. Apply styles to all cells
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cell_address = { c: C, r: R };
        const address = XLSX.utils.encode_cell(cell_address);
        if (!ws[address]) continue;

        if (R === 0) { // Header row
          ws[address].s = headerStyle;
        } else { // Data rows
          const isAltRow = R % 2 === 0;
          // Center align specific columns
          if ([2, 3, 7].includes(C)) { // Date, Status, Completion %
            ws[address].s = centeredCellStyle(isAltRow);
          } else {
            ws[address].s = cellStyle(isAltRow);
          }
        }
      }
    }

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Reports');

    // Generate and trigger the download of the .xlsx file
    XLSX.writeFile(wb, `Reports_${selectedEmployee.name.replace(/\s/g, '_')}.xlsx`);
  };

  const renderReportContent = (content) => {
    try {
      const data = JSON.parse(content);
      if (data.taskUpdates) { // Handle new progress-based reports
        return (
          <div className="space-y-3">
            {data.reportNote ? (
              <div className="mb-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Employee Notes</h4>
                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{data.reportNote}</p>
              </div>
            ) : null}
            {data.taskUpdates.map((update, i) => (
              <div key={i} className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-white">
                      Task {i + 1}: {update.taskId?.title || 'Unknown Task'}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Progress Submitted: <span className="font-bold text-blue-600 dark:text-blue-400">{update.completion}%</span></p>
                  </div>
                  {update.taskId && (
                    <button onClick={() => {
                      setViewingTask(update.taskId);
                      setViewingTaskNumber(i + 1);
                    }} className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mt-1">Details</button>
                  )}
                </div>
                {update.note && (
                  <div className="mt-3 bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                    <p className="text-sm text-slate-600 dark:text-slate-400"><span className="font-semibold text-slate-700 dark:text-slate-300">Note:</span> {update.note}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      }
      return (
        <p className="whitespace-pre-line break-words">{JSON.stringify(data, null, 2)}</p>
      );
    } catch {
      return <p className="whitespace-pre-line break-words">{content}</p>;
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

          {isLoadingReports && (
            <p className="text-slate-500 font-medium mb-4">Loading reports...</p>
          )}

          {/* Report cards */}
          <div className="space-y-4 pb-8">
            {reports?.length > 0 ? reports.map(report => (
              <div key={report._id} className="bg-white rounded-2xl border border-purple-100 shadow-sm p-6">
                {/* Report header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <h3 className="text-base font-bold text-slate-800">
                    {new Date(report.reportDate).toLocaleDateString('en-US', { dateStyle: 'full' })}
                  </h3>
                  <span className={`self-start sm:self-auto text-xs font-bold px-3 py-1 rounded-full ${
                    report.status === 'Submitted'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {report.status}
                  </span>
                </div>

                {/* Report content */}
                <div className="space-y-3">
                  {(() => {
                    try {
                      const data = JSON.parse(report.content);
                      if (data.taskUpdates) {
                        return (
                          <div className="space-y-3">
                            {data.reportNote && (
                              <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
                                <h4 className="text-[10px] font-bold text-purple-400 uppercase tracking-wider mb-1">Employee Notes</h4>
                                <p className="text-sm text-slate-700 whitespace-pre-wrap">{data.reportNote}</p>
                              </div>
                            )}
                            {data.taskUpdates.map((update, i) => (
                              <div key={i} className="bg-slate-50 border border-purple-100 rounded-xl p-4">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-bold text-slate-800 text-sm">
                                      Task {i + 1}: {update.taskId?.title || 'Unknown Task'}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                      Progress: <span className="font-bold text-purple-600">{update.completion}%</span>
                                    </p>
                                  </div>
                                  {update.taskId && (
                                    <button
                                      onClick={() => { setViewingTask(update.taskId); setViewingTaskNumber(i + 1); }}
                                      className="text-xs font-bold text-purple-600 hover:text-purple-700 px-3 py-1 rounded-lg bg-purple-50 border border-purple-200 transition"
                                    >
                                      Details
                                    </button>
                                  )}
                                </div>
                                {update.note && (
                                  <div className="mt-2 bg-white p-3 rounded-xl border border-purple-100">
                                    <p className="text-xs text-slate-600">
                                      <span className="font-bold text-slate-700">Note: </span>{update.note}
                                    </p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return <p className="text-sm text-slate-700 whitespace-pre-line">{JSON.stringify(data, null, 2)}</p>;
                    } catch {
                      return <p className="text-sm text-slate-700 whitespace-pre-line">{report.content}</p>;
                    }
                  })()}
                </div>

                {/* Delete action */}
                {(user?.role === 'Admin' || user?.role === 'Super Admin') && (
                  <div className="pt-4 mt-4 border-t border-purple-50 flex justify-end">
                    <button
                      onClick={() => setDeletingReport(report)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-red-500 hover:text-red-600 transition"
                    >
                      <TrashIcon className="h-4 w-4" /> Delete Report
                    </button>
                  </div>
                )}
              </div>
            )) : (
              <div className="bg-white rounded-2xl border border-purple-100 p-16 text-center">
                <DocumentTextIcon className="h-12 w-12 mx-auto text-purple-200 mb-4" />
                <p className="font-bold text-slate-600">No Reports Found</p>
                <p className="text-sm text-slate-400 mt-1">This employee has not submitted any reports yet.</p>
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
      case 'analytics': return <Analytics user={user} />;
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
        <main className="flex-1 overflow-y-auto">{renderActiveComponent()}</main>
      </div>
    </div>
  );
}