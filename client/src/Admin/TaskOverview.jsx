import React, { useMemo, useState } from 'react';
import { useGetAllTasksQuery, useGetEmployeesQuery, useAddTaskCommentMutation } from '../services/EmployeApi.js';
import {
  ClockIcon,
  PlayIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/solid';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import {
  XMarkIcon,
  CalendarDaysIcon as CalendarOutlineIcon,
  InformationCircleIcon as InfoOutlineIcon,
  ChatBubbleLeftEllipsisIcon,
  PaperAirplaneIcon,
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  ExclamationCircleIcon,
  CheckBadgeIcon,
} from '@heroicons/react/24/outline';

// ─── Task Details Modal ───────────────────────────────────────────────────────

export const TaskDetailsModal = ({ isOpen, onClose, task, taskNumber }) => {
  const [comment, setComment] = useState('');
  const [addComment, { isLoading: isAddingComment }] = useAddTaskCommentMutation();
  if (!isOpen || !task) return null;

  const InfoField = ({ label, value, icon: Icon }) => (
    <div className="flex items-start gap-3">
      <Icon className="h-5 w-5 text-slate-400 mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm font-semibold text-slate-800">{value || 'N/A'}</p>
      </div>
    </div>
  );

  const handleAddComment = async () => {
    if (!comment.trim()) return;
    try {
      await addComment({ taskId: task._id, text: comment }).unwrap();
      setComment('');
      toast.success('Comment added!');
    } catch {
      toast.error('Failed to add comment.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col border border-purple-100">
        {/* Modal header */}
        <div className="px-6 py-4 border-b border-purple-100 flex justify-between items-center"
          style={{ background: 'linear-gradient(135deg,#48306A,#8E5FD0)' }}>
          <h3 className="text-base font-bold text-white">Task Details
            {taskNumber && <span className="ml-2 text-xs font-normal text-white/70">(Task {taskNumber})</span>}
          </h3>
          <button onClick={onClose} className="text-white/70 hover:text-white transition">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left — task info */}
            <div className="md:col-span-2 space-y-4">
              <h4 className="font-extrabold text-xl text-[#48306A]">{task.title}</h4>
              <p className="text-sm text-slate-600">{task.description || 'No description provided.'}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-purple-100">
                <InfoField label="Priority" value={task.priority} icon={InfoOutlineIcon} />
                <InfoField label="Status" value={task.status} icon={CheckCircleIcon} />
                <InfoField label="Start Date" value={task.startDate ? new Date(task.startDate).toLocaleDateString() : 'N/A'} icon={CalendarOutlineIcon} />
                <InfoField label="Due Date" value={task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'} icon={CalendarOutlineIcon} />
              </div>
            </div>

            {/* Right — comments */}
            <div className="md:col-span-1 bg-purple-50 p-3 rounded-2xl border border-purple-100 flex flex-col h-[350px]">
              <div className="flex items-center gap-2 mb-2 border-b border-purple-200 pb-2">
                <ChatBubbleLeftEllipsisIcon className="h-5 w-5 text-purple-500" />
                <h5 className="font-bold text-slate-700 text-sm">Comments</h5>
                <span className="ml-auto text-xs text-slate-400">{task.comments?.length || 0}</span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {task.comments?.length > 0 ? task.comments.map(c => (
                  <div key={c._id} className="flex items-start gap-2 bg-white rounded-xl p-2 border border-purple-100 shadow-sm">
                    <img
                      src={c.author.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.author.name)}&background=8E5FD0&color=fff`}
                      alt={c.author.name}
                      onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.author.name)}&background=8E5FD0&color=fff`; }}
                      className="h-7 w-7 rounded-full object-cover border border-purple-200 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-xs text-slate-800 truncate">{c.author.name}</span>
                        <span className="text-[10px] text-slate-400 ml-auto">{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5 break-words">{c.text}</p>
                    </div>
                  </div>
                )) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 py-8">
                    <ChatBubbleLeftEllipsisIcon className="h-7 w-7 mb-2" />
                    <p className="text-xs">No comments yet.</p>
                  </div>
                )}
              </div>
              <form className="flex gap-2 pt-2 border-t border-purple-200 mt-2"
                onSubmit={e => { e.preventDefault(); handleAddComment(); }}>
                <input
                  type="text" value={comment} onChange={e => setComment(e.target.value)}
                  placeholder="Add a comment..." disabled={isAddingComment} maxLength={300}
                  className="w-full text-xs border border-purple-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-purple-300 outline-none bg-white"
                />
                <button type="submit" disabled={isAddingComment || !comment.trim()}
                  className="p-2 rounded-xl text-white transition disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg,#48306A,#8E5FD0)' }}>
                  <PaperAirplaneIcon className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-purple-50 rounded-b-2xl flex justify-end border-t border-purple-100">
          <button onClick={onClose}
            className="text-sm font-bold text-white px-5 py-2 rounded-xl transition hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#48306A,#8E5FD0)' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Recharts Pie Chart ───────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { name, value, fill } = payload[0].payload;
  return (
    <div className="bg-white border border-purple-100 rounded-xl shadow-lg px-4 py-2.5 flex items-center gap-2">
      <span className="h-3 w-3 rounded-sm flex-shrink-0" style={{ backgroundColor: fill }} />
      <span className="text-sm font-bold text-slate-700">{name}</span>
      <span className="text-sm font-extrabold text-slate-900 ml-1">{value}</span>
    </div>
  );
};

const TaskPieChart = ({ data, total, colors }) => {
  const [activeIndex, setActiveIndex] = useState(null);
  const chartData = data.filter(d => d.value > 0);

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 w-full">
      {/* Chart */}
      <div className="flex-shrink-0" style={{ width: 240, height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              outerRadius={110}
              innerRadius={0}
              paddingAngle={2}
              dataKey="value"
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              stroke="none"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={colors[entry.name]}
                  opacity={activeIndex !== null && activeIndex !== index ? 0.6 : 1}
                  style={{ cursor: 'pointer', filter: activeIndex === index ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.25))' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.12))', outline: 'none' }}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-2 w-full min-w-0">
        {chartData.map((entry, index) => {
          const pct    = total > 0 ? Math.round((entry.value / total) * 100) : 0;
          const isHov  = activeIndex === index;
          const color  = colors[entry.name];
          return (
            <div
              key={entry.name}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 transition-all cursor-pointer ${isHov ? 'bg-purple-50 ring-1 ring-purple-200' : 'hover:bg-slate-50'}`}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              <span className="h-3.5 w-3.5 rounded-sm flex-shrink-0" style={{ backgroundColor: color }} />
              <span className={`text-sm flex-1 truncate ${isHov ? 'font-bold text-slate-800' : 'font-medium text-slate-600'}`}>
                {entry.name}
              </span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${isHov ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-500'}`}>
                {pct}%
              </span>
              <span className={`text-sm font-extrabold w-5 text-right flex-shrink-0 ${isHov ? 'text-slate-800' : 'text-slate-400'}`}>
                {entry.value}
              </span>
            </div>
          );
        })}
        <div className="mt-1 pt-2 border-t border-purple-100 flex items-center justify-between px-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Tasks</span>
          <span className="text-base font-extrabold text-slate-800">{total}</span>
        </div>
      </div>
    </div>
  );
};

const EmployeeTaskCard = ({ employee, onClick }) => (
  <div
    onClick={onClick}
    className="bg-white rounded-2xl border border-purple-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 overflow-hidden flex flex-col cursor-pointer"
  >
    {/* Banner */}
    <div className="h-24 w-full relative flex-shrink-0" style={{ background: 'linear-gradient(135deg,#48306A,#8E5FD0)' }}>
      {/* Avatar */}
      <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
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
    </div>
  </div>
);

// ─── Task List Item ───────────────────────────────────────────────────────────

const TaskListItem = ({ task, isOverdue }) => (
  <li className="flex items-center justify-between p-3 rounded-xl hover:bg-purple-50 transition-colors border border-transparent hover:border-purple-100">
    <div className="flex items-center gap-3">
      <img
        src={task.assignedTo?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(task.assignedTo?.name || '?')}&background=8E5FD0&color=fff`}
        alt={task.assignedTo?.name}
        onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(task.assignedTo?.name || '?')}&background=8E5FD0&color=fff`; }}
        className="h-8 w-8 rounded-full object-cover border-2 border-purple-100 flex-shrink-0"
      />
      <div>
        <p className="font-bold text-sm text-slate-800">{task.title}</p>
        <p className="text-xs text-slate-400">To: {task.assignedTo?.name || 'N/A'}</p>
      </div>
    </div>
    {isOverdue && task.dueDate && (
      <div className="text-right flex-shrink-0">
        <p className="text-xs font-bold text-red-600">Overdue</p>
        <p className="text-[10px] text-red-400">{new Date(task.dueDate).toLocaleDateString()}</p>
      </div>
    )}
  </li>
);

// ─── Stat Card ────────────────────────────────────────────────────────────────

const StatCard = ({ icon: Icon, count, label, accentColor, gradientFrom, gradientTo }) => (
  <div className="bg-white rounded-2xl border border-purple-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
    <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg,${gradientFrom},${gradientTo})` }} />
    <div className="p-5 flex items-center gap-4">
      <div className="h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0"
        style={{ background: `linear-gradient(135deg,${gradientFrom}28,${gradientTo}40)` }}>
        <Icon className="h-6 w-6" style={{ color: accentColor }} />
      </div>
      <div>
        <p className="text-3xl font-extrabold text-slate-800 leading-none">{count}</p>
        <p className="text-xs font-bold text-slate-400 mt-1.5 uppercase tracking-wider">{label}</p>
      </div>
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const TASK_COLORS = {
  'Pending': '#F59E0B',
  'In Progress': '#3B82F6',
  'Verification': '#8B5CF6',
  'Completed': '#10B981',
  'Not Completed': '#F97316',
};

const TaskOverview = () => {
  const { data: allTasks = [], isLoading } = useGetAllTasksQuery(undefined, { pollingInterval: 30000 });
  const { data: employees = [], isLoading: isLoadingEmployees } = useGetEmployeesQuery();
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEmployees = useMemo(() =>
    employees.filter(emp =>
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.employeeId && emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()))
    ), [employees, searchTerm]);

  const overviewData = useMemo(() => {
    if (!selectedEmployee || !allTasks.length) {
      return { chartData: [], highPriorityTasks: [], overdueTasks: [], totalTasks: 0 };
    }
    const employeeTasks = allTasks.filter(task => {
      const id = task.assignedTo?._id || task.assignedTo;
      return id && String(id) === String(selectedEmployee._id);
    });

    const now = new Date();
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    const statusCounts = { Pending: 0, 'In Progress': 0, 'Pending Verification': 0, Completed: 0, 'Not Completed': 0 };
    employeeTasks.forEach(task => {
      if (Object.prototype.hasOwnProperty.call(statusCounts, task.status)) statusCounts[task.status]++;
    });

    return {
      chartData: [
        { name: 'Pending', value: statusCounts.Pending },
        { name: 'In Progress', value: statusCounts['In Progress'] },
        { name: 'Verification', value: statusCounts['Pending Verification'] },
        { name: 'Completed', value: statusCounts.Completed },
        { name: 'Not Completed', value: statusCounts['Not Completed'] },
      ],
      highPriorityTasks: employeeTasks.filter(t => !['Completed', 'Not Completed'].includes(t.status) && t.priority === 'High'),
      overdueTasks: employeeTasks.filter(t => ['Pending', 'In Progress'].includes(t.status) && t.dueDate && new Date(t.dueDate) < todayStart),
      totalTasks: employeeTasks.length,
    };
  }, [allTasks, selectedEmployee]);

  if (isLoading || isLoadingEmployees) {
    return (
      <div className="min-h-full flex items-center justify-center" style={{ backgroundColor: '#DFCDFE' }}>
        <p className="text-slate-500 font-medium">Loading...</p>
      </div>
    );
  }

  // ── Employee selection view ────────────────────────────────────────────────
  if (!selectedEmployee) {
    return (
      <div className="min-h-full p-6 lg:p-8" style={{ backgroundColor: '#DFCDFE' }}>
        {/* Header */}
        <div className="mb-2">
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Task Overview</h2>
          <div className="h-1 w-12 rounded-full mt-1 mb-3" style={{ background: 'linear-gradient(90deg,#48306A,#8E5FD0)' }} />
          <p className="text-slate-500 text-sm">Select an employee to view their detailed task analytics.</p>
        </div>

        {/* Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 my-6">
          <div className="relative w-full sm:w-80">
            <MagnifyingGlassIcon className="h-4 w-4 text-slate-400 absolute top-1/2 left-3 -translate-y-1/2" />
            <input
              type="text" placeholder="Search employee by name or ID..." value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-purple-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-300 shadow-sm"
            />
          </div>
        </div>

        {/* Card grid */}
        <div className="pb-8">
          {filteredEmployees.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredEmployees.map(emp => (
                <EmployeeTaskCard
                  key={emp._id}
                  employee={emp}
                  onClick={() => setSelectedEmployee(emp)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-purple-100 p-16 text-center">
              <MagnifyingGlassIcon className="h-12 w-12 mx-auto text-purple-200 mb-4" />
              <h3 className="text-base font-bold text-slate-600">No Employees Found</h3>
              <p className="text-sm text-slate-400 mt-1">Try adjusting your search.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Detail view ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-full p-6 lg:p-8" style={{ backgroundColor: '#DFCDFE' }}>
      {/* Header with back button */}
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={() => { setSelectedEmployee(null); setSearchTerm(''); }}
          className="flex items-center justify-center h-10 w-10 rounded-xl bg-white border border-purple-200 shadow-sm hover:bg-purple-50 transition flex-shrink-0"
        >
          <ArrowLeftIcon className="h-5 w-5 text-[#48306A]" />
        </button>
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            Task Overview: <span style={{ color: '#48306A' }}>{selectedEmployee.name}</span>
          </h2>
          <div className="h-1 w-12 rounded-full mt-1" style={{ background: 'linear-gradient(90deg,#48306A,#8E5FD0)' }} />
        </div>
      </div>

      {/* Chart + stat cards */}
      <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Custom SVG donut */}
          <div className="flex items-center justify-center">
            {overviewData.chartData.some(d => d.value > 0) ? (
              <TaskPieChart
                data={overviewData.chartData}
                total={overviewData.totalTasks}
                colors={TASK_COLORS}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 w-full">
                <CheckBadgeIcon className="h-12 w-12 text-purple-200 mb-3" />
                <p className="font-bold text-slate-500">No Tasks Assigned</p>
                <p className="text-sm mt-1">This employee has no tasks yet.</p>
              </div>
            )}
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StatCard icon={ClockIcon}             count={overviewData.chartData.find(d => d.name === 'Pending')?.value || 0}      label="Pending"      accentColor="#F59E0B" bgColor="bg-amber-50" />
            <StatCard icon={PlayIcon}              count={overviewData.chartData.find(d => d.name === 'In Progress')?.value || 0}   label="In Progress"  accentColor="#3B82F6" bgColor="bg-blue-50" />
            <StatCard icon={ExclamationTriangleIcon} count={overviewData.chartData.find(d => d.name === 'Verification')?.value || 0} label="Verification" accentColor="#8B5CF6" bgColor="bg-purple-50" />
            <StatCard icon={CheckCircleIcon}       count={overviewData.chartData.find(d => d.name === 'Completed')?.value || 0}     label="Completed"    accentColor="#10B981" bgColor="bg-emerald-50" />
          </div>
        </div>
      </div>

      {/* High-priority & overdue panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
        {/* High priority */}
        <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <ExclamationCircleIcon className="h-5 w-5 text-purple-500" />
            <h3 className="text-base font-bold text-slate-800">High-Priority Active Tasks</h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            {overviewData.highPriorityTasks.length > 0 ? (
              <ul className="space-y-1">
                {overviewData.highPriorityTasks.map(task => <TaskListItem key={task._id} task={task} />)}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                <CheckBadgeIcon className="h-10 w-10 mb-2 text-purple-200" />
                <p className="text-sm">No high-priority tasks active.</p>
              </div>
            )}
          </div>
        </div>

        {/* Overdue */}
        <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <ClockIcon className="h-5 w-5 text-red-400" />
            <h3 className="text-base font-bold text-slate-800">Overdue Tasks</h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            {overviewData.overdueTasks.length > 0 ? (
              <ul className="space-y-1">
                {overviewData.overdueTasks.map(task => <TaskListItem key={task._id} task={task} isOverdue />)}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                <CheckBadgeIcon className="h-10 w-10 mb-2 text-purple-200" />
                <p className="text-sm">No tasks are currently overdue.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskOverview;
