import React, { useState, useMemo } from 'react';
import { useGetEmployeesQuery } from '../services/EmployeApi';
import AttendanceCalendar from '../services/AttendanceCalendar';
import { MagnifyingGlassIcon, XMarkIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';

// ── Attendance Modal ────────────────────────────────────────────────────────

const AttendanceModal = ({ isOpen, onClose, employee }) => {
  if (!isOpen || !employee) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden border border-purple-100">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#48306A,#8E5FD0)' }}>
          <div className="flex items-center gap-3">
            <img
              src={employee.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=8E5FD0&color=fff`}
              alt={employee.name}
              onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=8E5FD0&color=fff`; }}
              className="h-11 w-11 rounded-full object-cover border-2 border-white/40 flex-shrink-0"
            />
            <div>
              <h3 className="text-base font-bold text-white">{employee.name}</h3>
              <p className="text-xs text-white/70">{employee.role} · {employee.employeeId}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Calendar content */}
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          <AttendanceCalendar employeeId={employee._id} employee={employee} />
        </div>
      </div>
    </div>
  );
};

// ── Main Component ──────────────────────────────────────────────────────────

const AllEmployeeAttendance = () => {
  const { data: allEmployees = [], isLoading } = useGetEmployeesQuery();
  const [searchTerm, setSearchTerm]           = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const filteredEmployees = useMemo(() =>
    allEmployees.filter(emp =>
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.employeeId && emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()))
    ),
  [allEmployees, searchTerm]);

  if (isLoading) {
    return (
      <div className="min-h-full flex items-center justify-center" style={{ backgroundColor: '#DFCDFE' }}>
        <p className="text-slate-500 font-medium">Loading employees...</p>
      </div>
    );
  }

  return (
    <div className="min-h-full p-6 lg:p-8" style={{ backgroundColor: '#DFCDFE' }}>

      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="mb-2">
        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">All Employee Attendance</h2>
        <div className="h-1 w-12 rounded-full mt-1 mb-3" style={{ background: 'linear-gradient(90deg,#48306A,#8E5FD0)' }} />
        <p className="text-slate-500 text-sm">View Attendance Records For All Employees In The Organization</p>
      </div>

      {/* ── Search ───────────────────────────────────────────────── */}
      <div className="my-6">
        <div className="relative w-full sm:w-80">
          <MagnifyingGlassIcon className="h-4 w-4 text-slate-400 absolute top-1/2 left-3 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name or employee ID..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-purple-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-300 shadow-sm"
          />
        </div>
      </div>

      {/* ── Employee Cards ────────────────────────────────────────── */}
      <div className="pb-8">
        {filteredEmployees.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredEmployees.map(employee => (
              <div
                key={employee._id}
                onClick={() => setSelectedEmployee(employee)}
                className="bg-white rounded-2xl border border-purple-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 overflow-hidden flex flex-col cursor-pointer"
              >
                {/* Banner */}
                <div className="h-24 w-full relative flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#48306A,#8E5FD0)' }}>
                  <div className="absolute -bottom-14 left-1/2 -translate-x-1/2">
                    <img
                      src={employee.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=8E5FD0&color=fff`}
                      alt={employee.name}
                      onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=8E5FD0&color=fff`; }}
                      className="h-28 w-28 rounded-full object-cover border-4 border-white shadow-md"
                    />
                  </div>
                </div>

                {/* Content */}
                <div className="flex flex-col items-center pt-16 px-5 pb-5">
                  <h3 className="mt-2 text-base font-bold text-slate-800 text-center">{employee.name}</h3>
                  <p className="text-xs text-purple-500 font-semibold">{employee.role}</p>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">{employee.employeeId}</p>

                  <div
                    className="mt-4 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-white"
                    style={{ background: 'linear-gradient(135deg,#48306A,#8E5FD0)' }}
                  >
                    <CalendarDaysIcon className="h-3.5 w-3.5" />
                    View Attendance
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-purple-100 p-16 text-center">
            <MagnifyingGlassIcon className="h-12 w-12 mx-auto text-purple-200 mb-4" />
            <p className="font-bold text-slate-600">No Employees Found</p>
            <p className="text-sm text-slate-400 mt-1">Try adjusting your search.</p>
          </div>
        )}
      </div>

      <AttendanceModal
        isOpen={!!selectedEmployee}
        onClose={() => setSelectedEmployee(null)}
        employee={selectedEmployee}
      />
    </div>
  );
};

export default AllEmployeeAttendance;
