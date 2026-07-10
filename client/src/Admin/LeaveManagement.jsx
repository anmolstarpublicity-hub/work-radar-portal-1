import React, { useState, useMemo } from 'react';
import { useGetEmployeesQuery } from '../services/EmployeApi';
import { MagnifyingGlassIcon, CalendarIcon } from '@heroicons/react/24/outline';
import LeaveManagementModal from './LeaveManagementModal';

const EmployeeRow = ({ user, onLeave }) => (
  <tr className="hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="flex items-center">
        <div className="flex-shrink-0 h-10 w-10">
          <img className="h-10 w-10 rounded-full object-cover" src={user.profilePicture || `https://ui-avatars.com/api/?name=${user.name}&background=random`} alt={user.name} />
        </div>
        <div className="ml-4">
          <div className="text-sm font-medium text-slate-900 dark:text-white">{user.name}</div>
          <div className="text-sm text-slate-500 dark:text-slate-400">{user.email}</div>
        </div>
      </div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{user.employeeId}</td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{user.department}</td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{user.role}</td>
    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
      <button
        onClick={() => onLeave(user)}
        className="inline-flex items-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/50 dark:hover:bg-blue-900 dark:text-blue-300 font-semibold py-2 px-4 rounded-lg transition-colors"
      >
        <CalendarIcon className="h-4 w-4" />
        Manage Leave
      </button>
    </td>
  </tr>
);

const LeaveManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [leaveUser, setLeaveUser] = useState(null);

  const { data: users = [], isLoading, isError, error } = useGetEmployeesQuery();

  const handleOpenLeaveModal = (user) => {
    setLeaveUser(user);
  };

  const handleCloseLeaveModal = () => {
    setLeaveUser(null);
  };

  const filteredUsers = useMemo(() =>
    users.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
    ), [users, searchTerm]);

  if (isLoading) {
    return <div className="p-8 text-center">Loading employees...</div>;
  }

  if (isError) {
    return <div className="p-8 text-center text-red-500">Error fetching employees: {error.toString()}</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full bg-slate-50 dark:bg-slate-900">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl h-full flex flex-col p-8">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-10">
          <div>
            <h2 className="text-3xl font-extrabold text-blue-900 dark:text-white tracking-tight mb-1">Leave Management</h2>
            <p className="text-blue-500 dark:text-white text-sm">Manage leave days for all employees.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 text-blue-400 absolute top-1/2 left-3 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full sm:w-64 text-sm border border-blue-200 dark:border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-blue-50 dark:bg-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-x-auto overflow-y-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Employee ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Department</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Role</th>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              {filteredUsers.map(user => (
                <EmployeeRow key={user._id} user={user} onLeave={handleOpenLeaveModal} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <LeaveManagementModal
        isOpen={!!leaveUser}
        onClose={handleCloseLeaveModal}
        employee={leaveUser}
      />
    </div>
  );
};

export default LeaveManagement;