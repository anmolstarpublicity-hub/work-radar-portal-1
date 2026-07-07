import React, { useMemo, useState } from 'react';
import { useGetAllTasksQuery, useGetEmployeesQuery } from '../services/EmployeApi.js';
import {
  ClockIcon,
  PlayIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/solid';
import GooglePieChart from './GooglePieChart.jsx';
import { useAddTaskCommentMutation } from '../services/EmployeApi';
import toast from 'react-hot-toast';
import { XMarkIcon, CalendarDaysIcon as CalendarOutlineIcon, InformationCircleIcon as InfoOutlineIcon, ChatBubbleLeftEllipsisIcon, PaperAirplaneIcon, UserCircleIcon, ArrowLeftIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export const TaskDetailsModal = ({ isOpen, onClose, task, taskNumber }) => {
  const [comment, setComment] = useState('');
  const [addComment, { isLoading: isAddingComment }] = useAddTaskCommentMutation();
  if (!isOpen || !task) return null;

  const InfoField = ({ label, value, icon: Icon }) => (
    <div className="flex items-start gap-3">
      <Icon className="h-5 w-5 text-slate-400 mt-0.5" />
      <div>
        <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-sm font-medium text-slate-800">{value || 'N/A'}</p>
      </div>
    </div>
  );

  const handleAddComment = async () => {
    if (!comment.trim()) return;
    try {
      await addComment({ taskId: task._id, text: comment }).unwrap();
      setComment('');
      toast.success('Comment added!');
    } catch (err) {
      console.error('Failed to add comment:', err);
      toast.error('Failed to add comment.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-3xl h-auto max-h-[90vh] flex flex-col">
        <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-800">Task Details</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <h4 className="font-bold text-xl text-blue-700 dark:text-blue-400">
                {task.title}
                {taskNumber && <span className="ml-2 text-sm font-medium text-slate-400">(Task {taskNumber})</span>}
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-300">{task.description}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t dark:border-slate-700">
                <InfoField label="Priority" value={task.priority} icon={InfoOutlineIcon} />
                <InfoField label="Status" value={task.status} icon={CheckCircleIcon} />
                <InfoField label="Start Date" value={task.startDate ? new Date(task.startDate).toLocaleDateString() : 'N/A'} icon={CalendarOutlineIcon} />
                <InfoField label="Due Date" value={task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'} icon={CalendarOutlineIcon} />
              </div>
            </div>
            <div className="md:col-span-1 bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border dark:border-slate-700 flex flex-col h-[350px] w-full max-w-xs mx-auto">
              <div className="flex items-center gap-2 mb-2 border-b pb-2 dark:border-slate-700">
                <ChatBubbleLeftEllipsisIcon className="h-5 w-5 text-blue-500" />
                <h5 className="font-semibold text-slate-700 dark:text-slate-200 text-base">Comments</h5>
                <span className="ml-auto text-xs text-slate-400">{task.comments?.length || 0}</span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {task.comments?.length > 0 ? (
                  task.comments.map(c => (
                    <div key={c._id} className="flex items-start gap-2 bg-white dark:bg-slate-700 rounded-lg p-2 border border-slate-100 dark:border-slate-600 shadow-sm">
                      {c.author.profilePicture ? (
                        <img
                          src={c.author.profilePicture}
                          alt={c.author.name}
                          onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${c.author.name}&background=random`; }}
                          className="h-8 w-8 rounded-full object-cover border border-blue-100"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full flex items-center justify-center bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-bold text-sm border border-blue-100">
                          {c.author.name?.split(' ').map(n => n[0]).join('').slice(0,2)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0 dark:text-white">
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate">{c.author.name}</span>
                          <span className="text-[10px] text-slate-400 ml-auto">{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-xs text-slate-700 mt-0.5 break-words">{c.text}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 py-8">
                    <ChatBubbleLeftEllipsisIcon className="h-7 w-7 mb-2" />
                    <p className="text-xs">No comments yet.</p>
                  </div>
                )}
              </div>
              <form
                className="flex gap-2 pt-2 border-t dark:border-slate-700 mt-2"
                onSubmit={e => { e.preventDefault(); handleAddComment(); }} 
              >
                <input
                  type="text"
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="w-full text-xs border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-200"
                  disabled={isAddingComment}
                  maxLength={300}
                />
                <button
                  type="submit"
                  disabled={isAddingComment || !comment.trim()}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 dark:disabled:bg-blue-800"
                  title="Send"
                >
                  <PaperAirplaneIcon className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-b-lg flex justify-end">
          <button onClick={onClose} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-sm">Close</button>
        </div>
      </div>
    </div>
  );
};

const TaskListItem = ({ task, isOverdue }) => (
  <li className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors">
    <div className="flex items-center gap-3">
      <img 
        src={task.assignedTo?.profilePicture || `https://ui-avatars.com/api/?name=${task.assignedTo?.name || '?'}`} 
        alt={task.assignedTo?.name} 
        onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${task.assignedTo?.name || '?'}&background=random`; }}
        className="h-8 w-8 rounded-full object-cover" />
      <div>
        <p className="font-semibold text-sm text-slate-800 dark:text-white">{task.title}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">To: {task.assignedTo?.name || 'N/A'}</p>
      </div>
    </div>
    {isOverdue && task.dueDate && (
      <div className="text-right">
        <p className="text-sm font-bold text-red-600">Overdue</p>
        <p className="text-xs text-red-500">{new Date(task.dueDate).toLocaleDateString()}</p>
      </div>
    )}
  </li>
);

const TaskOverview = () => {
  const { data: allTasks = [], isLoading } = useGetAllTasksQuery(undefined, { pollingInterval: 30000 });
  const { data: employees = [], isLoading: isLoadingEmployees } = useGetEmployeesQuery();
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredEmployees = useMemo(() => {
    return employees.filter(employee =>
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (employee.employeeId && employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [employees, searchTerm]);

  const overviewData = useMemo(() => {
    if (!selectedEmployee || !allTasks || allTasks.length === 0) {
      return {
        chartData: [],
        highPriorityTasks: [],
        overdueTasks: [],
        totalTasks: 0,
      };
    }

    // Filter tasks for the selected employee
    const employeeTasks = allTasks.filter(task => {
      const id = task.assignedTo?._id || task.assignedTo;
      return id && String(id) === String(selectedEmployee._id);
    });

    const now = new Date();
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    
    // Get the start of the current week (Sunday)
    const firstDayOfWeek = new Date(todayStart);
    firstDayOfWeek.setDate(firstDayOfWeek.getDate() - todayStart.getDay());

    const endOfWeek = new Date(firstDayOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const statusCounts = {
      Pending: 0,
      'In Progress': 0,
      'Pending Verification': 0,
      Completed: 0,
      'Not Completed': 0,
    };

    employeeTasks.forEach(task => {
      if (Object.prototype.hasOwnProperty.call(statusCounts, task.status)) {
        statusCounts[task.status]++;
      }
    });

    const chartData = [
      { name: 'Pending', value: statusCounts.Pending },
      { name: 'In Progress', value: statusCounts['In Progress'] },
      { name: 'Verification', value: statusCounts['Pending Verification'] },
      { name: 'Completed', value: statusCounts.Completed },
      { name: 'Not Completed', value: statusCounts['Not Completed'] },
    ];

    return {
      chartData,
      highPriorityTasks: employeeTasks.filter(
        (t) =>
          !['Completed', 'Not Completed'].includes(t.status) &&
          t.priority === 'High'
      ),
      overdueTasks: employeeTasks.filter(
        t => ['Pending', 'In Progress'].includes(t.status) && t.dueDate && new Date(t.dueDate) < todayStart
      ),
      totalTasks: employeeTasks.length,
    };
  }, [allTasks, selectedEmployee]);

  const TASK_COLORS = {
    'Pending': '#F59E0B', // Amber
    'In Progress': '#3B82F6', // Blue
    'Verification': '#8B5CF6', // Purple
    'Completed': '#10B981', // Emerald
    'Not Completed': '#F97316', // Orange
  };

  if (isLoading || isLoadingEmployees) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (!selectedEmployee) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 h-full flex flex-col bg-slate-50/50 dark:bg-black/50">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">Task Overview</h1>
          <p className="text-slate-500 dark:text-white mt-2">Select an employee or manager to view their detailed task analytics.</p>
        </div>

        <div className="mb-8 max-w-md mx-auto relative">
          <MagnifyingGlassIcon className="h-5 w-5 text-slate-400 absolute top-1/2 left-3 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search employees..."
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
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full flex flex-col bg-slate-50/50 dark:bg-black/50">
      <div className="mb-8 text-center relative">
        <button onClick={() => { setSelectedEmployee(null); setSearchTerm(''); }} className="absolute left-0 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors">
          <ArrowLeftIcon className="h-5 w-5 text-slate-600 dark:text-white" />
        </button>
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">Task Overview: {selectedEmployee.name}</h1>
        <p className="text-slate-500 dark:text-white mt-2">Monitor the status of tasks assigned to {selectedEmployee.name}.</p>
      </div>

      <div className="bg-white dark:bg-black rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg p-4 sm:p-8 mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="relative h-[300px] sm:h-[400px]">
            <div className="w-full h-full">
              <GooglePieChart data={overviewData.chartData} title="" colors={TASK_COLORS} is3D={true} />
            </div>
            {overviewData.totalTasks > 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-5xl font-bold text-slate-800 dark:text-white">{overviewData.totalTasks}</p>
                <p className="text-sm font-semibold text-slate-500 dark:text-white">Total Tasks</p>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-yellow-50 dark:bg-slate-900 border-l-4 border-yellow-400 p-5 rounded-lg">
              <ClockIcon className="h-7 w-7 text-yellow-500 mb-2" />
              <p className="text-3xl font-bold text-slate-800 dark:text-white">{overviewData.chartData.find(d => d.name === 'Pending')?.value || 0}</p>
              <p className="text-sm font-semibold text-slate-600 dark:text-white">Pending</p>
            </div>
            <div className="bg-blue-50 dark:bg-slate-900 border-l-4 border-blue-400 p-5 rounded-lg">
              <PlayIcon className="h-7 w-7 text-blue-500 mb-2" />
              <p className="text-3xl font-bold text-slate-800 dark:text-white">{overviewData.chartData.find(d => d.name === 'In Progress')?.value || 0}</p>
              <p className="text-sm font-semibold text-slate-600 dark:text-white">In Progress</p>
            </div>
            <div className="bg-purple-50 dark:bg-slate-900 border-l-4 border-purple-400 p-5 rounded-lg">
              <ExclamationTriangleIcon className="h-7 w-7 text-purple-500 mb-2" />
              <p className="text-3xl font-bold text-slate-800 dark:text-white">{overviewData.chartData.find(d => d.name === 'Verification')?.value || 0}</p>
              <p className="text-sm font-semibold text-slate-600 dark:text-white">Verification</p>
            </div>
            <div className="bg-emerald-50 dark:bg-slate-900 border-l-4 border-emerald-400 p-5 rounded-lg">
              <CheckCircleIcon className="h-7 w-7 text-emerald-500 mb-2" />
              <p className="text-3xl font-bold text-slate-800 dark:text-white">{overviewData.chartData.find(d => d.name === 'Completed')?.value || 0}</p>
              <p className="text-sm font-semibold text-slate-600 dark:text-white">Completed</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-black rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg p-6 flex flex-col">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">High-Priority Active Tasks</h3>
          <div className="flex-1 overflow-y-auto -mr-2 pr-2">
            {overviewData.highPriorityTasks.length > 0 ? (
              <ul className="space-y-2">
                {overviewData.highPriorityTasks.map(task => <TaskListItem key={task._id} task={task} />)}
              </ul>
            ) : (
              <p className="text-center text-sm text-slate-400 dark:text-white pt-10">No high-priority tasks are active.</p>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-black rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg p-6 flex flex-col">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Overdue Tasks</h3>
          <div className="flex-1 overflow-y-auto -mr-2 pr-2">
            {overviewData.overdueTasks.length > 0 ? (
              <ul className="space-y-2">
                {overviewData.overdueTasks.map(task => <TaskListItem key={task._id} task={task} isOverdue={true} />)}
              </ul>
            ) : (
              <p className="text-center text-sm text-slate-400 dark:text-white pt-10">No tasks are currently overdue.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskOverview;