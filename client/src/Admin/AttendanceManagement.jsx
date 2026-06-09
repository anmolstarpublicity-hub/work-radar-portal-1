import React, { useState, useMemo } from 'react';
import { useGetEmployeesQuery, useGetAllTasksQuery, useUpdateEmployeeMutation } from '../services/EmployeApi';
import { 
  MagnifyingGlassIcon, 
  AdjustmentsHorizontalIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ShieldCheckIcon,
  CalendarDaysIcon 
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const AttendanceManagement = () => {
  const { data: employees = [], isLoading: isLoadingEmployees, refetch: refetchEmployees } = useGetEmployeesQuery();
  const { data: allTasks = [], isLoading: isLoadingTasks } = useGetAllTasksQuery();
  const [updateEmployee] = useUpdateEmployeeMutation();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [deptFilter, setDepartmentFilter] = useState('All Departments');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [localOverrides, setLocalOverrides] = useState({});

  // Extract unique departments dynamically
  const departments = useMemo(() => {
    const depts = new Set(employees.map(emp => emp.department).filter(Boolean));
    return ['All Departments', ...Array.from(depts)];
  }, [employees]);

  // Automated Core Attendance Rules Calculation
  const processedAttendanceData = useMemo(() => {
    const targetDate = new Date(dateFilter);
    targetDate.setHours(0, 0, 0, 0);

    // Filter tasks assigned exactly on the selected date
    const tasksOnDate = allTasks.filter(task => {
      const taskDate = new Date(task.createdAt);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === targetDate.getTime();
    });

    let filteredData = employees.map(emp => {
      const currentEmp = localOverrides[emp._id] ? { ...emp, ...localOverrides[emp._id] } : emp;
      const empTasks = tasksOnDate.filter(t => (t.assignedTo?._id || t.assignedTo) === currentEmp._id);
      
      let calculatedStatus = 'Present';
      let reportStatus = 'No Task Assigned';

      if (empTasks.length > 0) {
        // Condition A & B Evaluation: If ANY task is incomplete/unreported, mark Absent.
        const hasMissingReports = empTasks.some(t => !['Completed', 'Pending Verification', 'Not Completed'].includes(t.status) && (t.progress || 0) === 0);
        
        if (hasMissingReports) {
          calculatedStatus = 'Absent';
          reportStatus = 'Missing Report';
        } else {
          calculatedStatus = 'Present';
          reportStatus = 'Report Submitted';
        }
      }

      // Allow UI overrides from previous states if implemented in db schema
      if (currentEmp.manualAttendanceStatus && currentEmp.manualAttendanceDate === dateFilter) {
        calculatedStatus = currentEmp.manualAttendanceStatus;
        reportStatus = 'Manual Override';
      }

      return {
        ...currentEmp,
        calculatedStatus,
        reportStatus
      };
    });

    // Apply UI Filters
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filteredData = filteredData.filter(emp => 
        emp.name.toLowerCase().includes(lowerSearch) || 
        emp.email.toLowerCase().includes(lowerSearch) || 
        (emp.employeeId && emp.employeeId.toLowerCase().includes(lowerSearch))
      );
    }
    if (roleFilter !== 'All Roles') {
      filteredData = filteredData.filter(emp => emp.role === roleFilter);
    }
    if (deptFilter !== 'All Departments') {
      filteredData = filteredData.filter(emp => emp.department === deptFilter);
    }

    return filteredData;
  }, [employees, allTasks, dateFilter, searchTerm, roleFilter, deptFilter, localOverrides]);

  const handleTogglePower = async (emp) => {
    const newPowerState = !emp.hasAttendancePower;
    
    // Optimistic UI Update for instant visual feedback
    setLocalOverrides(prev => ({
      ...prev,
      [emp._id]: { ...(prev[emp._id] || {}), hasAttendancePower: newPowerState }
    }));
    
    try {
      const formData = new FormData();
      // Send as string 'true'/'false' depending on your backend parser
      formData.append('hasAttendancePower', newPowerState.toString()); 
      
      const response = await updateEmployee({ id: emp._id, formData }).unwrap();
      if (response && response.employee) {
        toast.success(`Attendance powers ${newPowerState ? 'granted to' : 'revoked from'} ${emp.name}!`);
        refetchEmployees(); // Sync with server in background
      } else {
        throw new Error('Backend update failed');
      }
    } catch (err) {
      // Rollback optimistic update on failure
      setLocalOverrides(prev => ({
        ...prev,
        [emp._id]: { ...(prev[emp._id] || {}), hasAttendancePower: !newPowerState }
      }));
      toast.error('Failed to update delegation powers.');
    }
  };

  const handleManualOverride = async (emp, status) => {
    // Optimistic UI Update for instant visual feedback
    setLocalOverrides(prev => ({
      ...prev,
      [emp._id]: { ...(prev[emp._id] || {}), manualAttendanceStatus: status, manualAttendanceDate: dateFilter }
    }));

    try {
      const formData = new FormData();
      formData.append('manualAttendanceStatus', status);
      formData.append('manualAttendanceDate', dateFilter);
      
      const response = await updateEmployee({ id: emp._id, formData }).unwrap();
      if (response && response.employee) {
        toast.success(`${emp.name} has been manually marked as ${status} for ${dateFilter}.`);
        refetchEmployees(); // Sync with server in background
      } else {
        throw new Error('Backend update failed');
      }
    } catch (err) {
      // Rollback optimistic update on failure
      setLocalOverrides(prev => ({
        ...prev,
        [emp._id]: { ...(prev[emp._id] || {}), manualAttendanceStatus: emp.manualAttendanceStatus, manualAttendanceDate: emp.manualAttendanceDate }
      }));
      toast.error(`Failed to manually override attendance for ${emp.name}.`);
    }
  };

  if (isLoadingEmployees || isLoadingTasks) {
    return <div className="p-8 text-center text-slate-500 font-semibold">Loading attendance data...</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full flex flex-col bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-black">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center p-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full shadow-lg mb-4 dark:from-blue-600 dark:to-indigo-700">
          <CalendarDaysIcon className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">Attendance Management</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Monitor daily attendance grids and delegate attendance powers to managers.</p>
      </div>

      {/* Control Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 sm:p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 text-slate-400 absolute top-1/2 left-3 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, email, or employee ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>
          {/* Date Picker */}
          <div>
            <input
              type="date"
              value={dateFilter}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-4 py-2.5 text-sm border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>
          {/* Role Filter */}
          <div className="relative">
            <AdjustmentsHorizontalIcon className="h-5 w-5 text-slate-400 absolute top-1/2 left-3 -translate-y-1/2" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 appearance-none transition-all"
            >
              <option value="All Roles">All Roles</option>
              <option value="Manager">Managers</option>
              <option value="Employee">Employees</option>
            </select>
          </div>
          {/* Department Filter */}
          <div>
            <select
              value={deptFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full px-4 py-2.5 text-sm border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 appearance-none transition-all"
            >
              {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Data Grid */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg flex-1 flex flex-col overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">User Details</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Report Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Delegation Power</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {processedAttendanceData.length > 0 ? processedAttendanceData.map(emp => (
                <tr key={emp._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  {/* User Details */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-4">
                      <img 
                        src={emp.profilePicture || `https://ui-avatars.com/api/?name=${emp.name}&background=random`} 
                        alt={emp.name} 
                        className="h-10 w-10 rounded-full object-cover border border-slate-200 dark:border-slate-600"
                      />
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white">{emp.name}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">{emp.employeeId || 'ID Pending'}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                          {emp.role}
                        </span>
                      </div>
                    </div>
                  </td>
                  
                  {/* Today's Calculated Status */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${emp.calculatedStatus === 'Present' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800' : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:border-red-800'}`}>
                      {emp.calculatedStatus === 'Present' ? <CheckCircleIcon className="h-4 w-4" /> : <XCircleIcon className="h-4 w-4" />}
                      {emp.calculatedStatus}
                    </span>
                  </td>
                  
                  {/* Report Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className={`text-xs font-semibold ${emp.reportStatus === 'Missing Report' ? 'text-orange-600' : 'text-slate-500 dark:text-slate-400'}`}>
                      {emp.reportStatus}
                    </p>
                  </td>

                  {/* Delegation Power */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-[10px] font-bold text-slate-500 uppercase hidden sm:block">Grant Power</span>
                      <label className="relative inline-flex items-center cursor-pointer" title="Toggle Attendance Delegation Power">
                        <input type="checkbox" className="sr-only peer" checked={emp.hasAttendancePower || false} onChange={() => handleTogglePower(emp)} />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
                      </label>
                      <ShieldCheckIcon className={`h-5 w-5 ${emp.hasAttendancePower ? 'text-indigo-600' : 'text-slate-300 dark:text-slate-600'}`} />
                    </div>
                  </td>

                  {/* Quick Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleManualOverride(emp, 'Present')} className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-colors shadow-sm dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300">Mark Present</button>
                      <button onClick={() => handleManualOverride(emp, 'Absent')} className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors shadow-sm dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300">Mark Absent</button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center text-sm text-slate-500 dark:text-slate-400">
                    No employees matched the active filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AttendanceManagement;