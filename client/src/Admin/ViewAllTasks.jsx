import React, { useState, useMemo, useEffect } from 'react';
import { useGetAllTasksQuery, useGetEmployeesQuery, useUpdateTaskMutation, useDeleteTaskMutation } from '../services/EmployeApi';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../app/authSlice';
import toast from 'react-hot-toast';
import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon, PencilIcon, ArrowPathIcon, TrashIcon, ExclamationTriangleIcon, EyeIcon, ChatBubbleLeftEllipsisIcon, PaperAirplaneIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon, CalendarDaysIcon as CalendarOutlineIcon, InformationCircleIcon as InfoOutlineIcon } from '@heroicons/react/24/solid';
import { TaskDetailsModal } from './TaskOverview.jsx';

const EditTaskModal = ({ isOpen, onClose, task, onUpdate }) => {
  const [updateTask, { isLoading: isUpdating }] = useUpdateTaskMutation();
  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    startDate: '',
    dueDate: '',
    priority: 'Medium',
    status: 'Pending',
  });

  useEffect(() => {
    if (task) {
      setTaskData({
        title: task.title || '',
        description: task.description || '',
        startDate: task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : '',
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
        priority: task.priority || 'Medium',
        status: task.status || 'Pending',
      });
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const handleChange = (e) => {
    setTaskData({ ...taskData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateTask({ id: task._id, ...taskData }).unwrap();
      toast.success('Task updated successfully!');
      onUpdate(); // This will trigger a refetch in the parent
      onClose();
    } catch (err) {
      toast.error(err.data?.message || 'Failed to update task.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-black rounded-2xl shadow-xl w-full max-w-lg">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Edit Task</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="divide-y divide-slate-200 dark:divide-slate-700">
          <div className="p-6 space-y-4">
            <input type="text" name="title" value={taskData.title} onChange={handleChange} className="w-full text-sm border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg p-2.5" placeholder="Task Title" />
            <textarea name="description" value={taskData.description} onChange={handleChange} rows="3" className="w-full text-sm border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg p-2.5" placeholder="Description"></textarea>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input type="date" name="startDate" value={taskData.startDate} onChange={handleChange} className="w-full text-sm border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg p-2.5" />
              <input type="date" name="dueDate" value={taskData.dueDate} onChange={handleChange} className="w-full text-sm border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg p-2.5" />
              <select name="priority" value={taskData.priority} onChange={handleChange} className="w-full text-sm border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg p-2.5">
                <option>Low</option><option>Medium</option><option>High</option>
              </select>
            </div>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-black flex justify-end">
            <button type="submit" disabled={isUpdating} className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-sm disabled:bg-blue-400">
              {isUpdating && <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, task, isDeleting }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4 dark:bg-black/70">
      <div className="bg-white dark:bg-black rounded-lg shadow-xl w-full max-w-sm">
        <div className="p-6 text-center">
          <div className="mx-auto bg-red-100 rounded-full h-12 w-12 flex items-center justify-center my-4">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Confirm Deletion</h3>
          <p className="text-sm text-slate-500 dark:text-white mt-2">Are you sure you want to delete the task "{task?.title}"? This action cannot be undone.</p>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-black rounded-b-lg flex justify-center gap-3">
          <button type="button" onClick={onClose} className="bg-white hover:bg-slate-100 text-slate-700 font-bold py-2 px-4 rounded-lg border border-slate-300 text-sm">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} disabled={isDeleting} className="inline-flex items-center justify-center bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg text-sm disabled:bg-red-400">
            {isDeleting && <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" />}
            {isDeleting ? 'Deleting...' : 'Confirm Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

const ViewAllTasks = ({ initialFilters = {} }) => {
  const { data: tasks = [], isLoading: isLoadingTasks, refetch } = useGetAllTasksQuery(undefined, { pollingInterval: 30000 });
  const { data: employees = [], isLoading: isLoadingEmployees } = useGetEmployeesQuery();
  const [deleteTask, { isLoading: isDeleting }] = useDeleteTaskMutation();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ status: initialFilters.status || '', priority: initialFilters.priority || '' });
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [editingTask, setEditingTask] = useState(null);
  const [deletingTask, setDeletingTask] = useState(null);
  const [viewingTask, setViewingTask] = useState(null);
  const [viewingTaskNumber, setViewingTaskNumber] = useState(null);
  const currentUser = useSelector(selectCurrentUser);

  const isLoading = isLoadingTasks || isLoadingEmployees;

  const { status: initialStatus, priority: initialPriority } = initialFilters;

  useEffect(() => {
    setFilters({ status: initialStatus || '', priority: initialPriority || '' });
  }, [initialStatus, initialPriority]);

  const handleSelectEmployee = (employee) => {
    setSelectedEmployee(employee);
    // Set default date range to the current week
    const today = new Date();
    const firstDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const lastDayOfWeek = new Date(firstDayOfWeek);
    lastDayOfWeek.setDate(lastDayOfWeek.getDate() + 6);

    setDateRange({
      startDate: firstDayOfWeek.toISOString().split('T')[0],
      endDate: lastDayOfWeek.toISOString().split('T')[0],
    });
  };

  const filteredTasks = useMemo(() => {
    if (!selectedEmployee) return [];

    let employeeTasks = tasks.filter(task => task.assignedTo?._id === selectedEmployee._id);

    // Filter by date range (assignment date)
    if (dateRange.startDate && dateRange.endDate) {
      const start = new Date(dateRange.startDate);
      const end = new Date(dateRange.endDate);
      end.setHours(23, 59, 59, 999); // Include the whole end day

      employeeTasks = employeeTasks.filter(task => {
        const assignedDate = new Date(task.createdAt);
        return assignedDate >= start && assignedDate <= end;
      });
    }

    return employeeTasks.filter(task => {
      const matchesSearch =
        task.title.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = filters.status ? task.status === filters.status : true;
      const matchesPriority = filters.priority ? task.priority === filters.priority : true;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tasks, searchTerm, filters, selectedEmployee, dateRange]);

  const filteredEmployees = useMemo(() => {
    if (!employees) return [];
    return employees.filter(employee =>
      employee.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [employees, searchTerm]);

  const handleFilterChange = (type, value) => {
    setFilters(prev => ({ ...prev, [type]: value }));
  };

  const handleConfirmDelete = async () => {
    if (!deletingTask) return;
    try {
      await deleteTask(deletingTask._id).unwrap();
      toast.success('Task deleted successfully!');
      setDeletingTask(null);
    } catch (err) {
      console.error('Failed to delete task:', err);
      toast.error(err.data?.message || 'Failed to delete task.');
    }
  };
  const priorityStyles = {
    High: 'bg-red-100 text-red-800',
    Medium: 'bg-yellow-100 text-yellow-800',
    Low: 'bg-green-100 text-green-800',
  };

  const statusStyles = {
    Pending: 'bg-slate-100 text-slate-800',
    'In Progress': 'bg-blue-100 text-blue-800',
    'Pending Verification': 'bg-purple-100 text-purple-800',
    'Not Completed': 'bg-orange-100 text-orange-800',
    Completed: 'bg-emerald-100 text-emerald-800',
  };

  // completionCategoryStyles removed (unused)

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;

  if (!selectedEmployee) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 h-full flex flex-col bg-slate-50 dark:bg-slate-900">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">View Employee Tasks</h1>
          <p className="text-slate-500 dark:text-white mt-2">Select an employee to view their assigned tasks.</p>
        </div>
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md text-sm border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg p-3 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredEmployees.map(employee => ( // Changed card background
            <div
              key={employee._id}
              onClick={() => handleSelectEmployee(employee)}
            className="bg-white dark:bg-black rounded-2xl shadow-xl p-6 flex flex-col items-center text-center border-t-4 border-blue-500 hover:scale-105 transition-transform duration-200 cursor-pointer"
            >
            <img 
              src={employee.profilePicture || `https://ui-avatars.com/api/?name=${employee.name}&background=random`} 
              alt={employee.name} 
              onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${employee.name}&background=random`; }}
              className="h-20 w-20 rounded-full object-cover mb-4 border-4 border-slate-100 dark:border-slate-800" 
            />
            <p className="font-bold text-slate-800 dark:text-white">{employee.name}</p>
              <p className="text-sm text-blue-600 font-medium">{employee.role}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">{employee.employeeId}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }
  // Changed main background
  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full flex flex-col">
      <div className="mb-8 text-center">
        <div className="flex items-center gap-4">
          <button onClick={() => { setSelectedEmployee(null); setSearchTerm(''); }} className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors">
            <ArrowLeftIcon className="h-5 w-5 text-slate-600 dark:text-white" />
          </button>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">Tasks for {selectedEmployee.name}</h1>
            <p className="text-slate-500 dark:text-white mt-1">A complete overview of all tasks assigned to this employee.</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="relative w-full md:w-auto">
            <MagnifyingGlassIcon className="h-5 w-5 text-slate-400 absolute top-1/2 left-3 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search tasks or people..."
              value={searchTerm} // This now searches within the selected employee's tasks
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 w-full md:w-80 text-sm border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <input 
                type="date" 
                value={dateRange.startDate}
                onChange={e => setDateRange(prev => ({...prev, startDate: e.target.value}))}
                className="text-sm border border-slate-300 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              />
              <input 
                type="date" 
                value={dateRange.endDate}
                onChange={e => setDateRange(prev => ({...prev, endDate: e.target.value}))}
                className="text-sm border border-slate-300 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              />
            </div>
            <FunnelIcon className="h-5 w-5 text-slate-400" />
            <select onChange={(e) => handleFilterChange('status', e.target.value)} value={filters.status} className="text-sm border border-slate-300 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">All Statuses</option>
              <option>Pending</option><option>In Progress</option><option>Pending Verification</option><option>Completed</option><option>Not Completed</option>
            </select>
            <select onChange={(e) => handleFilterChange('priority', e.target.value)} value={filters.priority} className="text-sm border border-slate-300 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">All Priorities</option>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
            {(filters.status || filters.priority) && (
              <button onClick={() => setFilters({ status: '', priority: '' })} className="text-slate-500 hover:text-slate-800">
                <XMarkIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-auto rounded-b-xl">
          <table className="w-full text-sm text-left text-slate-600 min-w-[900px]">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50 sticky top-0 z-10">
              <tr>
                <th scope="col" className="px-6 py-3">Task Title</th>
                <th scope="col" className="px-6 py-3">Assigned By</th>
                <th scope="col" className="px-6 py-3">Due Date</th>
                <th scope="col" className="px-6 py-3">Completed On</th>
                <th scope="col" className="px-6 py-3">Status</th>
                <th scope="col" className="px-6 py-3">Priority</th>
                <th scope="col" className="px-6 py-3">Grade</th>
                <th scope="col" className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task, index) => (
                  <tr key={task._id} className="bg-white dark:bg-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 dark:text-white">{task.title}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs">{task.description}</div>
                    </td>
                    <td className="px-6 py-4">{task.assignedBy?.name || 'N/A'}</td>
                    <td className="px-6 py-4">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}</td>
                    <td className="px-6 py-4">
                      {task.status === 'Not Completed' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                          Incomplete
                        </span>
                      ) : task.status === 'Completed' && task.completionDate ? (
                        new Date(task.completionDate).toLocaleDateString()
                      ) : <span className="text-slate-400 dark:text-slate-500 text-xs">--</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusStyles[task.status]} dark:bg-opacity-20`}>
                        {task.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${priorityStyles[task.priority]} dark:bg-opacity-20`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {['Completed', 'Not Completed'].includes(task.status) ? (
                        <span className="text-sm font-semibold text-slate-700 dark:text-white">
                          {task.progress}%
                        </span>
                      ) : <span className="text-slate-400 dark:text-slate-500 text-xs">--</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => { setViewingTask(task); setViewingTaskNumber(index + 1); }} className="p-1.5 text-slate-500 hover:text-green-600 rounded-md hover:bg-green-100 dark:hover:bg-slate-800" title="View Details">
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        {(currentUser?._id === task.assignedBy?._id || currentUser?.role === 'Admin') && (
                          <button onClick={() => setEditingTask(task)} className="p-1.5 text-slate-500 hover:text-blue-600 rounded-md hover:bg-blue-100 dark:hover:bg-slate-800" title="Edit Task">
                            <PencilIcon className="h-4 w-4" />
                          </button>
                        )}
                        <button onClick={() => setDeletingTask(task)} className="p-1.5 text-slate-500 hover:text-red-600 rounded-md hover:bg-red-100 dark:hover:bg-slate-800" title="Delete Task">
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="text-center p-16 text-slate-500 dark:text-white">
                    <div className="flex flex-col items-center">
                      <MagnifyingGlassIcon className="h-12 w-12 text-slate-400 mb-4" />
                      <h3 className="text-lg font-semibold">No Tasks Found</h3>
                      <p className="text-sm">Try adjusting your search or filter criteria.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <EditTaskModal
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        task={editingTask}
        onUpdate={refetch}
      />
      <DeleteConfirmationModal
        isOpen={!!deletingTask}
        onClose={() => setDeletingTask(null)}
        onConfirm={handleConfirmDelete}
        task={deletingTask}
        isDeleting={isDeleting}
      />
      <TaskDetailsModal
        isOpen={!!viewingTask}
        onClose={() => setViewingTask(null)}
        task={viewingTask}
        taskNumber={viewingTaskNumber}
      />
    </div>
  );
};

export default ViewAllTasks;