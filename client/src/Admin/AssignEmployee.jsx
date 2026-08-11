import React, { useState, useMemo, useEffect } from 'react';
import { useGetEmployeesQuery, useAssignEmployeeMutation, useUnassignEmployeeMutation } from '../services/EmployeApi';
import toast from 'react-hot-toast';
import { MagnifyingGlassIcon, ArrowPathIcon, ExclamationCircleIcon, XMarkIcon, UserPlusIcon, UserMinusIcon, BuildingOffice2Icon, UserCircleIcon } from '@heroicons/react/24/outline';

const ActionBtn = ({ onClick, title, bg, children }) => (
  <button onClick={onClick} title={title}
    className={`h-9 w-9 rounded-xl flex items-center justify-center transition hover:opacity-80 ${bg}`}>
    {children}
  </button>
);

const AssignCard = ({ employee, onAssign, onUnassign }) => {
  const isAssigned = employee.department && employee.teamLead;
  return (
    <div className="bg-white rounded-2xl border border-purple-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 overflow-hidden flex flex-col">
      {/* Top gradient banner */}
      <div className="h-24 w-full relative flex-shrink-0" style={{ background: 'linear-gradient(135deg,#48306A,#8E5FD0)' }}>
        <div className="absolute top-2 right-3">
          {isAssigned ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Assigned
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Unassigned
            </span>
          )}
        </div>
        {/* Avatar centered on banner bottom edge */}
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
          <img
            src={employee.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=8E5FD0&color=fff`}
            alt={employee.name}
            onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=8E5FD0&color=fff`; }}
            className="h-28 w-28 rounded-full object-cover border-4 border-white shadow-md"
          />
        </div>
      </div>

      {/* Content below avatar */}
      <div className="flex flex-col items-center pt-16 px-5 pb-5">
        <h3 className="mt-2 text-base font-bold text-slate-800 text-center">{employee.name}</h3>
        <p className="text-xs text-purple-500 font-semibold">{employee.role}</p>
        <p className="text-[11px] text-slate-400 font-mono mt-0.5">{employee.employeeId}</p>

        {/* Info rows */}
        <div className="w-full mt-4 space-y-2">
          <div className="flex items-center gap-2.5 bg-purple-50 rounded-xl px-3 py-2">
            <span className="flex items-center justify-center h-7 w-7 rounded-lg bg-purple-100 flex-shrink-0">
              <BuildingOffice2Icon className="h-3.5 w-3.5 text-purple-500" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] text-slate-400 leading-none">Department</p>
              <p className="text-xs font-semibold text-slate-700 truncate mt-0.5">{employee.department || '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 bg-purple-50 rounded-xl px-3 py-2">
            <span className="flex items-center justify-center h-7 w-7 rounded-lg bg-purple-100 flex-shrink-0">
              <UserCircleIcon className="h-3.5 w-3.5 text-purple-500" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] text-slate-400 leading-none">Reports To</p>
              <p className="text-xs font-semibold text-slate-700 truncate mt-0.5">{employee.teamLead?.name || '—'}</p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 mt-4 w-full">
          <button
            onClick={() => onAssign(employee)}
            title={isAssigned ? 'Re-assign' : 'Assign'}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-white transition hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#48306A,#8E5FD0)' }}
          >
            <UserPlusIcon className="h-3.5 w-3.5" />
            {isAssigned ? 'Re-assign' : 'Assign'}
          </button>
          {isAssigned && (
            <button
              onClick={() => onUnassign(employee)}
              title="Unassign"
              className="flex items-center justify-center h-9 w-9 rounded-xl bg-red-50 hover:bg-red-100 transition flex-shrink-0"
            >
              <UserMinusIcon className="h-4 w-4 text-red-500" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const AssignModal = ({ isOpen, onClose, employee, employees, onAssign, isAssigning }) => {
  const [selectedLead, setSelectedLead] = useState('');
  const [department, setDepartment] = useState('');

  useEffect(() => {
    if (employee) {
      setSelectedLead(employee.teamLead?._id || '');
      setDepartment(employee.department || '');
    }
  }, [employee]);

  if (!isOpen || !employee) return null;

  const potentialLeads = employees.filter(emp => emp._id !== employee._id);
  const departments = ['Corporate management', 'Human Resource', 'Creative Designing', 'Finance & Accounts', 'Marketing Operations', 'Sales & Marketing', 'Tech & Development'];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!department || !selectedLead) { toast.error('Please select a department and a manager.'); return; }
    onAssign({ employeeId: employee._id, teamLeadId: selectedLead, department });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md">
        <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Assign — {employee.name}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Department</label>
              <select value={department} onChange={e => setDepartment(e.target.value)}
                className="w-full text-sm border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg p-2.5 focus:ring-purple-400 focus:border-purple-400 outline-none">
                <option value="" disabled>Select a department</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Reports To (Manager)</label>
              <select value={selectedLead} onChange={e => setSelectedLead(e.target.value)}
                className="w-full text-sm border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg p-2.5 focus:ring-purple-400 focus:border-purple-400 outline-none">
                <option value="" disabled>Select a manager</option>
                {potentialLeads.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
              </select>
            </div>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-b-2xl flex justify-end gap-3">
            <button type="button" onClick={onClose} className="bg-white hover:bg-slate-100 text-slate-700 font-bold py-2 px-4 rounded-lg border border-slate-300 text-sm">Cancel</button>
            <button type="submit" disabled={isAssigning}
              className="inline-flex items-center gap-2 text-white font-bold py-2 px-4 rounded-lg text-sm disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg,#48306A,#8E5FD0)' }}>
              {isAssigning && <ArrowPathIcon className="animate-spin h-4 w-4" />}
              Save Assignment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const UnassignModal = ({ isOpen, onClose, onConfirm, employee, isUnassigning }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm">
        <div className="p-6 text-center">
          <div className="mx-auto bg-red-100 dark:bg-red-500/10 rounded-full h-12 w-12 flex items-center justify-center my-4">
            <ExclamationCircleIcon className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Confirm Unassignment</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Remove <strong className="text-slate-700 dark:text-white">{employee?.name}</strong> from their department and manager?
          </p>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-b-2xl flex justify-center gap-3">
          <button onClick={onClose} className="bg-white hover:bg-slate-100 text-slate-700 font-bold py-2 px-4 rounded-lg border border-slate-300 text-sm">Cancel</button>
          <button onClick={onConfirm} disabled={isUnassigning}
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg text-sm disabled:bg-red-400">
            {isUnassigning && <ArrowPathIcon className="animate-spin h-4 w-4" />}
            {isUnassigning ? 'Removing...' : 'Unassign'}
          </button>
        </div>
      </div>
    </div>
  );
};

const AssignEmployee = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [filter, setFilter] = useState('all');
  const [assigningEmployee, setAssigningEmployee] = useState(null);
  const [unassigningEmployee, setUnassigningEmployee] = useState(null);

  const { data: employees = [], isLoading, isError, error } = useGetEmployeesQuery();
  const [assignEmployee, { isLoading: isAssigning }] = useAssignEmployeeMutation();
  const [unassignEmployee, { isLoading: isUnassigning }] = useUnassignEmployeeMutation();

  const filteredEmployees = useMemo(() => employees.filter(emp => {
    const isAssigned = emp.department && emp.teamLead;
    const matchesFilter = filter === 'all' || (filter === 'assigned' && isAssigned) || (filter === 'unassigned' && !isAssigned);
    const matchesDept = !deptFilter || emp.department === deptFilter;
    const matchesSearch = emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesDept && matchesSearch;
  }), [employees, searchTerm, deptFilter, filter]);

  const handleAssign = async (data) => {
    try {
      await assignEmployee(data).unwrap();
      toast.success('Employee assigned successfully!');
      setAssigningEmployee(null);
    } catch (err) {
      toast.error(err.data?.message || 'Could not complete assignment.');
    }
  };

  const handleConfirmUnassign = async () => {
    if (!unassigningEmployee) return;
    try {
      await unassignEmployee(unassigningEmployee._id).unwrap();
      toast.success(`${unassigningEmployee.name} has been unassigned.`);
      setUnassigningEmployee(null);
    } catch (err) {
      toast.error(err.data?.message || 'Could not unassign employee.');
    }
  };

  if (isLoading) return <div className="p-8 text-center text-slate-500">Loading employees...</div>;
  if (isError) return <div className="p-8 text-center text-red-500">Error: {error?.toString()}</div>;

  return (
    <div className="min-h-full p-6 lg:p-8" style={{ backgroundColor: '#DFCDFE' }}>
      {/* Header */}
      <div className="mb-2">
        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Employee Assignment</h2>
        <div className="h-1 w-12 rounded-full mt-1 mb-3" style={{ background: 'linear-gradient(90deg,#48306A,#8E5FD0)' }} />
        <p className="text-slate-500 text-sm">Manage Department And Manager Assignments For All Employees</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 my-6">
        <div className="relative w-full sm:w-80">
          <MagnifyingGlassIcon className="h-4 w-4 text-slate-400 absolute top-1/2 left-3 -translate-y-1/2" />
          <input type="text" placeholder="Search Employee By Name or ID..." value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-purple-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-300 shadow-sm" />
        </div>
        <div className="flex items-center gap-3">
          <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
            className="text-sm border border-purple-200 rounded-xl px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-purple-300 shadow-sm font-medium">
            <option value="">All Departments</option>
            <option value="Corporate management">Corporate management</option>
            <option value="Human Resource">Human Resource</option>
            <option value="Creative Designing">Creative Designing</option>
            <option value="Finance & Accounts">Finance & Accounts</option>
            <option value="Marketing Operations">Marketing Operations</option>
            <option value="Sales & Marketing">Sales & Marketing</option>
            <option value="Tech & Development">Tech & Development</option>
          </select>
          <select value={filter} onChange={e => setFilter(e.target.value)}
            className="text-sm border border-purple-200 rounded-xl px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-purple-300 shadow-sm font-medium">
            <option value="all">All</option>
            <option value="assigned">Assigned</option>
            <option value="unassigned">Unassigned</option>
          </select>
        </div>
      </div>

      {/* Card Grid */}
      <div className="pb-8">
        {filteredEmployees.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredEmployees.map(emp => (
              <AssignCard
                key={emp._id}
                employee={emp}
                onAssign={setAssigningEmployee}
                onUnassign={setUnassigningEmployee}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-purple-100 p-16 text-center">
            <MagnifyingGlassIcon className="h-12 w-12 mx-auto text-purple-200 mb-4" />
            <h3 className="text-base font-bold text-slate-600">No Employees Found</h3>
            <p className="text-sm text-slate-400 mt-1">Try adjusting your search or filter.</p>
          </div>
        )}
      </div>

      <AssignModal
        isOpen={!!assigningEmployee}
        onClose={() => setAssigningEmployee(null)}
        employee={assigningEmployee}
        employees={employees}
        onAssign={handleAssign}
        isAssigning={isAssigning}
      />
      <UnassignModal
        isOpen={!!unassigningEmployee}
        onClose={() => setUnassigningEmployee(null)}
        onConfirm={handleConfirmUnassign}
        employee={unassigningEmployee}
        isUnassigning={isUnassigning}
      />
    </div>
  );
};

export default AssignEmployee;
