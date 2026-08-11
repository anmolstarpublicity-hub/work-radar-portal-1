import React, { useState, useMemo, useEffect } from 'react';
import { useGetAllTasksQuery, useGetEmployeesQuery, useUpdateTaskMutation, useDeleteTaskMutation } from '../services/EmployeApi';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../app/authSlice';
import toast from 'react-hot-toast';
import {
  MagnifyingGlassIcon, XMarkIcon, PencilIcon, ArrowPathIcon,
  TrashIcon, ExclamationTriangleIcon, ArrowLeftIcon,
} from '@heroicons/react/24/outline';

// ── Edit Modal ──────────────────────────────────────────────────────────────

const EditTaskModal = ({ isOpen, onClose, task, onUpdate }) => {
  const [updateTask, { isLoading: isUpdating }] = useUpdateTaskMutation();
  const [taskData, setTaskData] = useState({});

  useEffect(() => {
    if (task) setTaskData({
      title: task.title || '',
      description: task.description || '',
      startDate: task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : '',
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      priority: task.priority || 'Medium',
    });
  }, [task]);

  if (!isOpen || !task) return null;

  const inputCls = "w-full text-sm border border-purple-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-purple-300 focus:border-purple-400 outline-none bg-slate-50";

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateTask({ id: task._id, ...taskData }).unwrap();
      toast.success('Task updated!');
      onUpdate();
      onClose();
    } catch (err) {
      toast.error(err.data?.message || 'Failed to update task.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-purple-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4"
          style={{ background: 'linear-gradient(135deg,#48306A,#8E5FD0)' }}>
          <h3 className="text-base font-bold text-white">Edit Task</h3>
          <button onClick={onClose} className="text-white/70 hover:text-white transition">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <input type="text" value={taskData.title} onChange={e => setTaskData(p => ({ ...p, title: e.target.value }))} className={inputCls} placeholder="Task Title" />
            <textarea value={taskData.description} onChange={e => setTaskData(p => ({ ...p, description: e.target.value }))} rows="3" className={inputCls} placeholder="Description" />
            <div className="grid grid-cols-2 gap-4">
              <input type="date" value={taskData.startDate} onChange={e => setTaskData(p => ({ ...p, startDate: e.target.value }))} className={inputCls} />
              <input type="date" value={taskData.dueDate} onChange={e => setTaskData(p => ({ ...p, dueDate: e.target.value }))} className={inputCls} />
              <select value={taskData.priority} onChange={e => setTaskData(p => ({ ...p, priority: e.target.value }))} className={inputCls}>
                <option>Low</option><option>Medium</option><option>High</option>
              </select>
            </div>
          </div>
          <div className="px-6 pb-6 flex justify-end gap-3">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-purple-200 rounded-xl hover:bg-purple-50 transition">
              Cancel
            </button>
            <button type="submit" disabled={isUpdating}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-bold text-white rounded-xl disabled:opacity-60 transition"
              style={{ background: 'linear-gradient(135deg,#48306A,#8E5FD0)' }}>
              {isUpdating && <ArrowPathIcon className="animate-spin h-4 w-4" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Delete Modal ────────────────────────────────────────────────────────────

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, task, isDeleting }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-purple-100 overflow-hidden">
        <div className="p-6 text-center">
          <div className="mx-auto bg-red-50 rounded-full h-12 w-12 flex items-center justify-center mb-4">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Confirm Deletion</h3>
          <p className="text-sm text-slate-500 mt-2">
            Delete "<strong className="text-slate-700">{task?.title}</strong>"? This cannot be undone.
          </p>
        </div>
        <div className="px-6 pb-6 flex justify-center gap-3">
          <button onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-purple-200 rounded-xl hover:bg-purple-50 transition">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={isDeleting}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl disabled:opacity-60 transition">
            {isDeleting && <ArrowPathIcon className="animate-spin h-4 w-4" />}
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Badge styles ─────────────────────────────────────────────────────────────

const statusStyles = {
  Pending:              'bg-slate-100 text-slate-700',
  'In Progress':        'bg-blue-100 text-blue-700',
  'Pending Verification':'bg-purple-100 text-purple-700',
  'Not Completed':      'bg-orange-100 text-orange-700',
  Completed:            'bg-emerald-100 text-emerald-700',
};
const priorityStyles = {
  High:   'bg-red-100 text-red-700',
  Medium: 'bg-amber-100 text-amber-700',
  Low:    'bg-green-100 text-green-700',
};
const gradeStyles = {
  Completed: 'bg-emerald-100 text-emerald-700',
  Moderate:  'bg-blue-100 text-blue-700',
  Low:       'bg-amber-100 text-amber-700',
  Pending:   'bg-red-100 text-red-700',
};

// ── Main Component ────────────────────────────────────────────────────────────

const ViewTeamTasks = ({ teamLeadId, initialFilters = {} }) => {
  const { data: allTasks = [], isLoading: isLoadingTasks, refetch } = useGetAllTasksQuery(undefined, { pollingInterval: 30000 });
  const { data: allEmployees = [], isLoading: isLoadingEmployees } = useGetEmployeesQuery();
  const [deleteTask, { isLoading: isDeleting }] = useDeleteTaskMutation();
  const currentUser = useSelector(selectCurrentUser);

  const [searchTerm, setSearchTerm]         = useState('');
  const [filters, setFilters]               = useState({ status: initialFilters.status || '', priority: initialFilters.priority || '' });
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [dateRange, setDateRange]           = useState({ startDate: '', endDate: '' });
  const [editingTask, setEditingTask]       = useState(null);
  const [deletingTask, setDeletingTask]     = useState(null);

  useEffect(() => {
    setFilters({ status: initialFilters.status || '', priority: initialFilters.priority || '' });
  }, [initialFilters.status, initialFilters.priority]);

  const handleSelectEmployee = (employee) => {
    setSelectedEmployee(employee);
    const today = new Date();
    const first = new Date(today.setDate(today.getDate() - today.getDay()));
    const last  = new Date(first); last.setDate(last.getDate() + 6);
    setDateRange({ startDate: first.toISOString().split('T')[0], endDate: last.toISOString().split('T')[0] });
  };

  const teamMemberIds = useMemo(() => {
    if (!allEmployees || !teamLeadId) return new Set();
    const getTeamLeadId = emp => emp.teamLead?._id || emp.teamLead;
    const subs = [];
    const queue = allEmployees.filter(e => getTeamLeadId(e) === teamLeadId);
    const visited = new Set(queue.map(e => e._id));
    while (queue.length) {
      const cur = queue.shift();
      subs.push(cur);
      allEmployees.filter(e => getTeamLeadId(e) === cur._id).forEach(r => {
        if (!visited.has(r._id)) { visited.add(r._id); queue.push(r); }
      });
    }
    return new Set(subs.map(e => e._id));
  }, [allEmployees, teamLeadId]);

  const filteredEmployees = useMemo(() => {
    const members = allEmployees.filter(e => teamMemberIds.has(e._id));
    if (!searchTerm) return members;
    return members.filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [allEmployees, teamMemberIds, searchTerm]);

  const filteredTasks = useMemo(() => {
    if (!selectedEmployee) return [];
    let tasks = allTasks.filter(t => t.assignedTo?._id === selectedEmployee._id);
    if (dateRange.startDate && dateRange.endDate) {
      const s = new Date(dateRange.startDate);
      const e = new Date(dateRange.endDate); e.setHours(23, 59, 59, 999);
      tasks = tasks.filter(t => { const d = new Date(t.createdAt); return d >= s && d <= e; });
    }
    return tasks.filter(t =>
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (filters.status   ? t.status   === filters.status   : true) &&
      (filters.priority ? t.priority === filters.priority : true)
    );
  }, [allTasks, searchTerm, filters, selectedEmployee, dateRange]);

  const handleConfirmDelete = async () => {
    if (!deletingTask) return;
    try {
      await deleteTask(deletingTask._id).unwrap();
      toast.success('Task deleted!');
      setDeletingTask(null);
    } catch (err) { toast.error(err.data?.message || 'Failed to delete task.'); }
  };

  if (isLoadingTasks || isLoadingEmployees) {
    return (
      <div className="min-h-full flex items-center justify-center" style={{ backgroundColor: '#DFCDFE' }}>
        <p className="text-slate-500 font-medium">Loading...</p>
      </div>
    );
  }

  // ── Employee selection ───────────────────────────────────────────────────
  if (!selectedEmployee) {
    return (
      <div className="min-h-full p-6 lg:p-8" style={{ backgroundColor: '#DFCDFE' }}>
        <div className="mb-2">
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">View Team Tasks</h2>
          <div className="h-1 w-12 rounded-full mt-1 mb-3" style={{ background: 'linear-gradient(90deg,#48306A,#8E5FD0)' }} />
          <p className="text-slate-500 text-sm">Select A Team Member To View Their Assigned Tasks</p>
        </div>

        <div className="my-6">
          <div className="relative w-full sm:w-80">
            <MagnifyingGlassIcon className="h-4 w-4 text-slate-400 absolute top-1/2 left-3 -translate-y-1/2" />
            <input type="text" placeholder="Search team members..." value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-purple-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-300 shadow-sm" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 pb-8">
          {filteredEmployees.map(emp => (
            <div key={emp._id} onClick={() => handleSelectEmployee(emp)}
              className="bg-white rounded-2xl border border-purple-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 overflow-hidden flex flex-col cursor-pointer">
              <div className="h-24 w-full relative flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,#48306A,#8E5FD0)' }}>
                <div className="absolute -bottom-14 left-1/2 -translate-x-1/2">
                  <img
                    src={emp.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=8E5FD0&color=fff`}
                    alt={emp.name}
                    onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=8E5FD0&color=fff`; }}
                    className="h-28 w-28 rounded-full object-cover border-4 border-white shadow-md"
                  />
                </div>
              </div>
              <div className="flex flex-col items-center pt-16 px-5 pb-5">
                <h3 className="mt-2 text-base font-bold text-slate-800 text-center">{emp.name}</h3>
                <p className="text-xs text-purple-500 font-semibold">{emp.role}</p>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">{emp.employeeId}</p>
              </div>
            </div>
          ))}
          {filteredEmployees.length === 0 && (
            <div className="col-span-full bg-white rounded-2xl border border-purple-100 p-16 text-center">
              <MagnifyingGlassIcon className="h-12 w-12 mx-auto text-purple-200 mb-4" />
              <p className="font-bold text-slate-600">No Team Members Found</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Task list ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-full p-6 lg:p-8" style={{ backgroundColor: '#DFCDFE' }}>
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <button onClick={() => { setSelectedEmployee(null); setSearchTerm(''); }}
          className="p-2 rounded-xl bg-white border border-purple-100 hover:bg-purple-50 shadow-sm transition">
          <ArrowLeftIcon className="h-5 w-5 text-purple-600" />
        </button>
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            Tasks — <span style={{ color: '#48306A' }}>{selectedEmployee.name}</span>
          </h2>
          <div className="h-1 w-12 rounded-full mt-1" style={{ background: 'linear-gradient(90deg,#48306A,#8E5FD0)' }} />
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 px-6 py-4 border-b border-slate-100">
          <div className="relative w-full lg:w-72">
            <MagnifyingGlassIcon className="h-4 w-4 text-slate-400 absolute top-1/2 left-3 -translate-y-1/2" />
            <input type="text" placeholder="Search tasks..." value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-purple-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-300" />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <input type="date" value={dateRange.startDate}
              onChange={e => setDateRange(p => ({ ...p, startDate: e.target.value }))}
              className="text-sm border border-purple-200 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-300" />
            <span className="text-slate-400 text-xs font-medium">to</span>
            <input type="date" value={dateRange.endDate}
              onChange={e => setDateRange(p => ({ ...p, endDate: e.target.value }))}
              className="text-sm border border-purple-200 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-300" />
            <select value={filters.status} onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}
              className="text-sm border border-purple-200 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-300 font-medium">
              <option value="">All Statuses</option>
              <option>Pending</option><option>In Progress</option>
              <option>Pending Verification</option><option>Completed</option><option>Not Completed</option>
            </select>
            <select value={filters.priority} onChange={e => setFilters(p => ({ ...p, priority: e.target.value }))}
              className="text-sm border border-purple-200 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-300 font-medium">
              <option value="">All Priorities</option>
              <option>Low</option><option>Medium</option><option>High</option>
            </select>
            {(filters.status || filters.priority) && (
              <button onClick={() => setFilters({ status: '', priority: '' })}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition">
                <XMarkIcon className="h-4 w-4 text-slate-500" />
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="text-xs text-slate-400 border-b border-slate-100">
                <th className="text-left px-6 py-3 font-semibold">Task Title</th>
                <th className="text-left px-6 py-3 font-semibold">Assigned By</th>
                <th className="text-left px-6 py-3 font-semibold">Due Date</th>
                <th className="text-left px-6 py-3 font-semibold">Completed On</th>
                <th className="text-left px-6 py-3 font-semibold">Status</th>
                <th className="text-left px-6 py-3 font-semibold">Priority</th>
                <th className="text-left px-6 py-3 font-semibold">Grade</th>
                <th className="text-right px-6 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredTasks.length > 0 ? filteredTasks.map(task => (
                <tr key={task._id} className="hover:bg-purple-50/40 transition-colors">
                  <td className="px-6 py-3">
                    <p className="font-semibold text-slate-800 leading-tight">{task.title}</p>
                    <p className="text-[11px] text-slate-400 truncate max-w-[200px] mt-0.5">{task.description}</p>
                  </td>
                  <td className="px-6 py-3 text-slate-600 text-xs">{task.assignedBy?.name || 'N/A'}</td>
                  <td className="px-6 py-3 text-slate-600 text-xs whitespace-nowrap">
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-6 py-3 text-xs whitespace-nowrap">
                    {task.status === 'Not Completed'
                      ? <span className="text-orange-600 font-semibold">Incomplete</span>
                      : task.status === 'Completed' && task.completionDate
                      ? <span className="text-slate-600">{new Date(task.completionDate).toLocaleDateString()}</span>
                      : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-6 py-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusStyles[task.status]}`}>
                      {task.status}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${priorityStyles[task.priority]}`}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    {['Completed', 'Not Completed'].includes(task.status) ? (
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${gradeStyles[task.completionCategory] || 'bg-slate-100 text-slate-600'}`}>
                        {task.completionCategory || 'Graded'}
                      </span>
                    ) : <span className="text-slate-300 text-xs">—</span>}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {(currentUser?.role === 'Admin' || currentUser?.canUpdateTask) && (
                        <button onClick={() => setEditingTask(task)}
                          className="h-8 w-8 flex items-center justify-center rounded-lg bg-purple-50 hover:bg-purple-100 transition">
                          <PencilIcon className="h-4 w-4 text-purple-500" />
                        </button>
                      )}
                      {(currentUser?.role === 'Admin' || currentUser?.canDeleteTask) && (
                        <button onClick={() => setDeletingTask(task)}
                          className="h-8 w-8 flex items-center justify-center rounded-lg bg-red-50 hover:bg-red-100 transition">
                          <TrashIcon className="h-4 w-4 text-red-500" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="8" className="text-center p-16 text-slate-400">
                    <MagnifyingGlassIcon className="h-12 w-12 mx-auto text-purple-200 mb-4" />
                    <p className="font-bold text-slate-600">No Tasks Found</p>
                    <p className="text-sm mt-1">Try adjusting your filters or date range.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <EditTaskModal isOpen={!!editingTask} onClose={() => setEditingTask(null)} task={editingTask} onUpdate={refetch} />
      <DeleteConfirmationModal isOpen={!!deletingTask} onClose={() => setDeletingTask(null)} onConfirm={handleConfirmDelete} task={deletingTask} isDeleting={isDeleting} />
    </div>
  );
};

export default ViewTeamTasks;
