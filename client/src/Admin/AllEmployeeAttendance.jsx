import React, { useState, useMemo } from 'react';
import { useGetEmployeesQuery } from '../services/EmployeApi';
import AttendanceCalendar from '../services/AttendanceCalendar';
import { MagnifyingGlassIcon, XMarkIcon, UserCircleIcon } from '@heroicons/react/24/outline';

const AttendanceModal = ({ isOpen, onClose, employee }) => {
  if (!isOpen || !employee) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 backdrop-blur-sm dark:bg-black/70">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-700">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center gap-4">
            <img 
              src={employee.profilePicture || `https://ui-avatars.com/api/?name=${employee.name}&background=random`} 
              alt={employee.name} 
              onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${employee.name}&background=random`; }}
              className="h-12 w-12 rounded-full object-cover border-2 border-white shadow-sm" 
            />
            <div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">{employee.name}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{employee.role} &bull; {employee.employeeId}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500 dark:text-slate-400">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="flex-1 p-6 overflow-y-auto bg-white dark:bg-slate-800">
          <AttendanceCalendar employeeId={employee._id} />
        </div>
      </div>
    </div>
  );
};

const AllEmployeeAttendance = () => {
  const { data: allEmployees = [], isLoading: isLoadingEmployees } = useGetEmployeesQuery();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const filteredEmployees = useMemo(() => {
    if (!searchTerm) return allEmployees;
    return allEmployees.filter(emp =>
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.employeeId && emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [allEmployees, searchTerm]);

  if (isLoadingEmployees) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full flex flex-col bg-slate-50 dark:bg-slate-900 font-manrope">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">All Employee Attendance</h1>
        <p className="text-slate-500 dark:text-white mt-2">View attendance records for all employees in the organization.</p>
      </div>

      <div className="mb-8 max-w-md mx-auto relative">
        <MagnifyingGlassIcon className="h-5 w-5 text-slate-400 absolute top-1/2 left-3 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search by name or ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 text-sm border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredEmployees.map(employee => (
          <div
            key={employee._id}
            onClick={() => setSelectedEmployee(employee)}
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-100 dark:border-slate-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
          >
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-4">
                <img
                  src={employee.profilePicture || `https://ui-avatars.com/api/?name=${employee.name}&background=random`}
                  alt={employee.name}
                  onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${employee.name}&background=random`; }}
                  className="h-20 w-20 rounded-full object-cover border-4 border-slate-50 dark:border-slate-700 group-hover:border-blue-100 dark:group-hover:border-blue-900 transition-colors"
                />
                <div className="absolute bottom-0 right-0 bg-white dark:bg-slate-800 rounded-full p-1 border border-slate-200 dark:border-slate-600">
                  <UserCircleIcon className="h-4 w-4 text-blue-500" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{employee.name}</h3>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 mb-2">
                {employee.role}
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{employee.employeeId}</p>
            </div>
          </div>
        ))}
      </div>

      {filteredEmployees.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-500 dark:text-slate-400">No employees found matching your search.</p>
        </div>
      )}

      <AttendanceModal
        isOpen={!!selectedEmployee}
        onClose={() => setSelectedEmployee(null)}
        employee={selectedEmployee}
      />
    </div>
  );
};

export default AllEmployeeAttendance;