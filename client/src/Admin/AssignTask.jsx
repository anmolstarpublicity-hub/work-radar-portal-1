import React, { useState, useMemo } from 'react';
import { useGetEmployeesQuery, useCreateMultipleTasksMutation } from '../services/EmployeApi';
import toast from 'react-hot-toast';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  ArrowPathIcon,
  ClipboardDocumentListIcon,
  PlusIcon,
  TrashIcon,
  ArrowLeftIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';

// ── Assign Task slide-over modal ────────────────────────────────────────────

const AssignTaskModal = ({ isOpen, onClose, employee, isAssigning, onAssign }) => {
  const initialTask = { id: Date.now(), title: '', description: '', startDate: '', dueDate: '', priority: 'Medium' };
  const [tasks, setTasks] = useState([initialTask]);

  React.useEffect(() => {
    if (isOpen) setTasks([{ ...initialTask, id: Date.now() }]);
  }, [isOpen]);

  if (!isOpen || !employee) return null;

  const handleChange = (index, e) => {
    const next = [...tasks];
    next[index][e.target.name] = e.target.value;
    setTasks(next);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (tasks.some(t => !t.title.trim())) { toast.error('Each task must have a title.'); return; }
    onAssign(tasks.map(t => ({ ...t, assignedTo: employee._id })));
  };

  const addTask    = () => setTasks(p => [...p, { ...initialTask, id: Date.now() }]);
  const removeTask = (i) => setTasks(p => p.filter((_, idx) => idx !== i));

  const inputCls = "w-full text-sm border border-purple-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-purple-300 focus:border-purple-400 outline-none bg-slate-50";

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col border-l border-purple-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-purple-100"
          style={{ background: 'linear-gradient(135deg,#48306A,#8E5FD0)' }}>
          <div className="flex items-center gap-2">
            <ClipboardDocumentListIcon className="h-5 w-5 text-white/80" />
            <span className="font-bold text-base text-white">Assign Task</span>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Employee info */}
        <div className="px-6 py-4 border-b border-purple-100 bg-purple-50">
          <div className="flex items-center gap-3">
            <img
              src={employee.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=8E5FD0&color=fff`}
              alt={employee.name}
              onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=8E5FD0&color=fff`; }}
              className="h-11 w-11 rounded-full object-cover border-2 border-purple-200 flex-shrink-0"
            />
            <div>
              <p className="font-bold text-slate-800">{employee.name}</p>
              <p className="text-xs text-purple-500 font-semibold">{employee.role} · {employee.department || 'N/A'}</p>
              <p className="text-[11px] text-slate-400 font-mono">{employee.employeeId}</p>
            </div>
          </div>
        </div>

        {/* Task forms */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 px-6 py-5 space-y-5 overflow-y-auto">
            {tasks.map((task, index) => (
              <div key={task.id} className="relative rounded-2xl bg-purple-50 border border-purple-100 shadow-sm p-4 space-y-3">
                {tasks.length > 1 && (
                  <button type="button" onClick={() => removeTask(index)}
                    className="absolute -top-2 -right-2 p-1.5 bg-white rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 border border-purple-100 shadow-sm transition">
                    <TrashIcon className="h-3.5 w-3.5" />
                  </button>
                )}
                <input type="text" name="title" required value={task.title}
                  onChange={e => handleChange(index, e)} placeholder="Task Title *"
                  className={inputCls} />
                <textarea name="description" value={task.description}
                  onChange={e => handleChange(index, e)} placeholder="Description (optional)"
                  rows={2} className={inputCls} />
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Start Date</label>
                    <input type="date" name="startDate" value={task.startDate}
                      onChange={e => handleChange(index, e)} className={`${inputCls} mt-1`} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Due Date</label>
                    <input type="date" name="dueDate" value={task.dueDate}
                      onChange={e => handleChange(index, e)} className={`${inputCls} mt-1`} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Priority</label>
                    <select name="priority" value={task.priority}
                      onChange={e => handleChange(index, e)} className={`${inputCls} mt-1`}>
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}

            <button type="button" onClick={addTask}
              className="w-full flex items-center justify-center gap-2 text-sm font-bold border-2 border-dashed border-purple-300 hover:border-purple-400 text-purple-500 hover:text-purple-600 rounded-2xl py-2.5 transition">
              <PlusIcon className="h-4 w-4" /> Add Another Task
            </button>
          </div>

          <div className="px-6 py-4 bg-purple-50 border-t border-purple-100 flex justify-end gap-3">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-purple-200 rounded-xl hover:bg-purple-50 transition">
              Cancel
            </button>
            <button type="submit" disabled={isAssigning}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-bold text-white rounded-xl disabled:opacity-60 transition"
              style={{ background: 'linear-gradient(135deg,#48306A,#8E5FD0)' }}>
              {isAssigning && <ArrowPathIcon className="animate-spin h-4 w-4" />}
              Assign Tasks
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Main component ──────────────────────────────────────────────────────────

const AssignTask = () => {
  const { data: employees = [], isLoading } = useGetEmployeesQuery();
  const [createMultipleTasks, { isLoading: isAssigning }] = useCreateMultipleTasksMutation();

  const [searchTerm, setSearchTerm]         = useState('');
  const [selectedManager, setSelectedManager] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const managers = useMemo(() =>
    employees.filter(e => e.dashboardAccess === 'Manager Dashboard'),
  [employees]);

  const teamMembers = useMemo(() => {
    if (!selectedManager) return [];
    const getAllSubs = (managerId, all) => {
      const subs = [];
      const queue = all.filter(e => e.teamLead?._id === managerId);
      const visited = new Set(queue.map(e => e._id));
      while (queue.length) {
        const cur = queue.shift();
        subs.push(cur);
        all.filter(e => e.teamLead?._id === cur._id).forEach(r => {
          if (!visited.has(r._id)) { visited.add(r._id); queue.push(r); }
        });
      }
      return subs;
    };
    return getAllSubs(selectedManager._id, employees);
  }, [employees, selectedManager]);

  const filteredMembers = useMemo(() =>
    teamMembers.filter(e =>
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.employeeId && e.employeeId.toLowerCase().includes(searchTerm.toLowerCase()))
    ),
  [teamMembers, searchTerm]);

  const handleAssignTask = async (tasks) => {
    try {
      await createMultipleTasks({ tasks }).unwrap();
      toast.success(`${tasks.length} task(s) assigned to ${selectedEmployee.name}!`);
      setSelectedEmployee(null);
    } catch (err) {
      toast.error(err.data?.message || 'Failed to assign task.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-full flex items-center justify-center" style={{ backgroundColor: '#DFCDFE' }}>
        <p className="text-slate-500 font-medium">Loading...</p>
      </div>
    );
  }

  // ── Manager not yet selected ────────────────────────────────────────────
  if (!selectedManager) {
    return (
      <div className="min-h-full p-6 lg:p-8" style={{ backgroundColor: '#DFCDFE' }}>
        {/* Header */}
        <div className="mb-2">
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Assign Task to Employee</h2>
          <div className="h-1 w-12 rounded-full mt-1 mb-3" style={{ background: 'linear-gradient(90deg,#48306A,#8E5FD0)' }} />
          <p className="text-slate-500 text-sm">Select A Manager To View Their Team And Assign Tasks</p>
        </div>

        {/* Manager picker */}
        <div className="my-6 flex items-center gap-3">
          <div className="relative w-full sm:w-72">
            <select
              onChange={e => {
                const m = managers.find(m => m._id === e.target.value);
                if (m) setSelectedManager(m);
              }}
              defaultValue=""
              className="w-full appearance-none text-sm border border-purple-200 rounded-xl pl-4 pr-9 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-purple-300 shadow-sm font-semibold text-slate-700"
            >
              <option value="" disabled>— Select a Manager —</option>
              {managers.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
            </select>
            <ChevronDownIcon className="h-4 w-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Manager cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {managers.map(m => (
            <div key={m._id} onClick={() => setSelectedManager(m)}
              className="bg-white rounded-2xl border border-purple-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 overflow-hidden flex flex-col cursor-pointer">
              <div className="h-24 w-full relative flex-shrink-0" style={{ background: 'linear-gradient(135deg,#48306A,#8E5FD0)' }}>
                <div className="absolute -bottom-14 left-1/2 -translate-x-1/2">
                  <img
                    src={m.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}&background=8E5FD0&color=fff`}
                    alt={m.name}
                    onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}&background=8E5FD0&color=fff`; }}
                    className="h-28 w-28 rounded-full object-cover border-4 border-white shadow-md"
                  />
                </div>
              </div>
              <div className="flex flex-col items-center pt-16 px-5 pb-5">
                <h3 className="mt-2 text-base font-bold text-slate-800 text-center">{m.name}</h3>
                <p className="text-xs text-purple-500 font-semibold">{m.role}</p>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">{m.employeeId}</p>
                <div className="mt-4 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-white"
                  style={{ background: 'linear-gradient(135deg,#48306A,#8E5FD0)' }}>
                  View Team
                </div>
              </div>
            </div>
          ))}
          {managers.length === 0 && (
            <div className="col-span-full bg-white rounded-2xl border border-purple-100 p-16 text-center">
              <p className="font-bold text-slate-600">No Managers Found</p>
              <p className="text-sm text-slate-400 mt-1">No employees have Manager Dashboard access.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Team member selection ───────────────────────────────────────────────
  return (
    <div className="min-h-full p-6 lg:p-8" style={{ backgroundColor: '#DFCDFE' }}>
      {/* Header with back */}
      <div className="mb-6 flex items-center gap-4">
        <button onClick={() => { setSelectedManager(null); setSearchTerm(''); }}
          className="p-2 rounded-xl bg-white border border-purple-100 hover:bg-purple-50 shadow-sm transition">
          <ArrowLeftIcon className="h-5 w-5 text-purple-600" />
        </button>
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            Team — <span style={{ color: '#48306A' }}>{selectedManager.name}</span>
          </h2>
          <div className="h-1 w-12 rounded-full mt-1" style={{ background: 'linear-gradient(90deg,#48306A,#8E5FD0)' }} />
        </div>
      </div>

      {/* Search */}
      <div className="my-6">
        <div className="relative w-full sm:w-80">
          <MagnifyingGlassIcon className="h-4 w-4 text-slate-400 absolute top-1/2 left-3 -translate-y-1/2" />
          <input type="text" placeholder="Search team members..." value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-purple-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-300 shadow-sm" />
        </div>
      </div>

      {/* Team member cards */}
      <div className="pb-8">
        {filteredMembers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredMembers.map(emp => (
              <div key={emp._id}
                className="bg-white rounded-2xl border border-purple-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 overflow-hidden flex flex-col">
                {/* Banner */}
                <div className="h-24 w-full relative flex-shrink-0" style={{ background: 'linear-gradient(135deg,#48306A,#8E5FD0)' }}>
                  <div className="absolute -bottom-14 left-1/2 -translate-x-1/2">
                    <img
                      src={emp.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=8E5FD0&color=fff`}
                      alt={emp.name}
                      onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=8E5FD0&color=fff`; }}
                      className="h-28 w-28 rounded-full object-cover border-4 border-white shadow-md"
                    />
                  </div>
                </div>
                {/* Content */}
                <div className="flex flex-col items-center pt-16 px-5 pb-5">
                  <h3 className="mt-2 text-base font-bold text-slate-800 text-center">{emp.name}</h3>
                  <p className="text-xs text-purple-500 font-semibold">{emp.role}</p>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">{emp.employeeId}</p>
                  {emp.department && (
                    <p className="text-[11px] text-slate-400 mt-0.5">{emp.department}</p>
                  )}
                  <button
                    onClick={() => setSelectedEmployee(emp)}
                    className="mt-4 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-white transition hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg,#48306A,#8E5FD0)' }}
                  >
                    <ClipboardDocumentListIcon className="h-3.5 w-3.5" />
                    Assign Task
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-purple-100 p-16 text-center">
            <MagnifyingGlassIcon className="h-12 w-12 mx-auto text-purple-200 mb-4" />
            <p className="font-bold text-slate-600">No Team Members Found</p>
            <p className="text-sm text-slate-400 mt-1">
              {teamMembers.length === 0
                ? 'This manager has no assigned team members.'
                : 'Try adjusting your search.'}
            </p>
          </div>
        )}
      </div>

      <AssignTaskModal
        isOpen={!!selectedEmployee}
        onClose={() => setSelectedEmployee(null)}
        employee={selectedEmployee}
        isAssigning={isAssigning}
        onAssign={handleAssignTask}
      />
    </div>
  );
};

export default AssignTask;
