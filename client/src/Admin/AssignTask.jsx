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
  UserCircleIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';

const AssignTaskModal = ({ isOpen, onClose, employee, isAssigning, onAssign }) => {
  const initialTask = {
    id: Date.now(),
    title: '',
    description: '',
    startDate: '',
    dueDate: '',
    priority: 'Medium',
  };
  const [tasks, setTasks] = useState([initialTask]);

  React.useEffect(() => {
    if (isOpen) setTasks([initialTask]);
  }, [isOpen]);

  if (!isOpen || !employee) return null;

  const handleChange = (index, e) => {
    const newTasks = [...tasks];
    newTasks[index][e.target.name] = e.target.value;
    setTasks(newTasks);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (tasks.some(task => !task.title.trim())) {
      toast.error('Each task must have a title.');
      return;
    }
    onAssign(tasks.map(task => ({ ...task, assignedTo: employee._id })));
  };

  const addTask = () => setTasks([...tasks, { ...initialTask, id: Date.now() }]);
  const removeTask = (index) => setTasks(tasks.filter((_, i) => i !== index));

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      <div className="relative w-full max-w-lg bg-white dark:bg-black h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-700 animate-slide-in-right">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <ClipboardDocumentListIcon className="h-6 w-6 text-blue-600" />
            <span className="font-bold text-lg text-slate-800 dark:text-white">Assign Task</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="px-6 pt-4 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <img 
              src={employee.profilePicture || `https://ui-avatars.com/api/?name=${employee.name}&background=random`} 
              alt={employee.name} 
              onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${employee.name}&background=random`; }}
              className="h-10 w-10 rounded-full border border-blue-200" 
            />
            <div>
              <div className="font-semibold text-slate-800 dark:text-white">{employee.name}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{employee.role} &middot; {employee.department || 'N/A'}</div>
              <div className="text-xs text-slate-400">{employee.employeeId}</div>
            </div>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-y-auto">
          <div className="flex-1 px-6 py-4 space-y-6">
            {tasks.map((task, index) => (
              <div key={task.id} className="relative rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm p-4 space-y-3">
                {tasks.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTask(index)}
                    className="absolute -top-2 -right-2 p-1.5 bg-white dark:bg-slate-800 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-100 border dark:border-slate-700 shadow-sm"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                )}
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    name="title"
                    required
                    value={task.title}
                    onChange={(e) => handleChange(index, e)}
                    placeholder="Task Title"
                    className="w-full text-sm border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg p-2 focus:ring-2 focus:ring-blue-200"
                  />
                  <textarea
                    name="description"
                    value={task.description}
                    onChange={(e) => handleChange(index, e)}
                    placeholder="Description (optional)"
                    rows="2"
                    className="w-full text-sm border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg p-2 focus:ring-2 focus:ring-blue-200"
                  ></textarea>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-slate-500 dark:text-slate-400">Start Date</label>
                      <input
                        type="date"
                        name="startDate"
                        value={task.startDate}
                        onChange={(e) => handleChange(index, e)}
                        className="w-full text-sm border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg p-2 mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 dark:text-slate-400">Due Date</label>
                      <input
                        type="date"
                        name="dueDate"
                        value={task.dueDate}
                        onChange={(e) => handleChange(index, e)}
                        className="w-full text-sm border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg p-2 mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 dark:text-slate-400">Priority</label>
                      <select
                        name="priority"
                        value={task.priority}
                        onChange={(e) => handleChange(index, e)}
                        className="w-full text-sm border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg p-2 mt-1"
                      >
                        <option>Low</option>
                        <option>Medium</option>
                        <option>High</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addTask}
              className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 border-2 border-dashed border-blue-300 hover:border-blue-400 dark:border-slate-600 dark:hover:border-slate-500 rounded-lg py-2 transition-colors dark:text-blue-400"
            >
              <PlusIcon className="h-4 w-4" /> Add Another Task
            </button>
          </div>
          <div className="px-6 py-4 bg-slate-50 dark:bg-black border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              type="submit"
              disabled={isAssigning}
              className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-5 rounded-lg text-sm disabled:bg-blue-400 transition-colors shadow-sm"
            >
              {isAssigning && <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" />}
              Assign Tasks
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AssignTask = () => {
  const { data: employees = [], isLoading: isLoadingEmployees } = useGetEmployeesQuery();
  const [createMultipleTasks, { isLoading: isAssigning }] = useCreateMultipleTasksMutation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedManager, setSelectedManager] = useState(null);

  const managers = useMemo(() => {
    // Strictly count users as a manager ONLY if they have manager dashboard access
    return employees.filter(emp => emp.dashboardAccess === 'Manager Dashboard');
  }, [employees]);

  const teamMembers = useMemo(() => {
    const getAllSubordinates = (managerId, allEmployees) => {
      const subordinates = [];
      const queue = allEmployees.filter(emp => emp.teamLead?._id === managerId);
      const visited = new Set(queue.map(e => e._id));
      while (queue.length > 0) {
        const currentEmployee = queue.shift();
        subordinates.push(currentEmployee);
        const directReports = allEmployees.filter(emp => emp.teamLead?._id === currentEmployee._id);
        for (const report of directReports) {
          if (!visited.has(report._id)) {
            visited.add(report._id);
            queue.push(report);
          }
        }
      }
      return subordinates;
    };
    if (!selectedManager) return [];
    return getAllSubordinates(selectedManager._id, employees);
  }, [employees, selectedManager]);

  const filteredEmployees = useMemo(() => {
    return teamMembers.filter(employee =>
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (employee.employeeId && employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [teamMembers, searchTerm]);

  const handleAssignTask = async (tasks) => {
    try {
      await createMultipleTasks({ tasks }).unwrap();
      toast.success(`${tasks.length} task(s) assigned to ${selectedEmployee.name} successfully!`);
      setSelectedEmployee(null);
    } catch (err) {
      toast.error(err.data?.message || 'Failed to assign task.');
    }
  };

  if (isLoadingEmployees) {
    return <div className="p-8 text-center">Loading managers...</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full flex flex-col bg-slate-50/50 dark:bg-black/50">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">Assign Task to Employee</h1>
        <p className="text-slate-500 dark:text-white mt-2">Select a manager to view their team and assign tasks.</p>
      </div>
      <div className="bg-white dark:bg-black rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg flex-1 flex flex-col">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="relative w-full md:w-auto">
            <ChevronDownIcon className="h-5 w-5 text-slate-400 absolute top-1/2 right-3 -translate-y-1/2 pointer-events-none" />
            <select
              onChange={(e) => {
                const manager = managers.find(m => m._id === e.target.value);
                setSelectedManager(manager);
              }}
              className="w-full md:w-64 text-sm border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg p-3 focus:ring-blue-500 focus:border-blue-500 appearance-none"
              value={selectedManager?._id || ''}
            >
              <option value="">-- Select a Manager --</option>
              {managers.map(manager => (
                <option key={manager._id} value={manager._id}>{manager.name}</option>
              ))}
            </select>
          </div>
          <div className="relative w-full md:w-auto">
            <MagnifyingGlassIcon className="h-5 w-5 text-slate-400 absolute top-1/2 left-3 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search team members by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 w-full md:w-80 text-sm border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              disabled={!selectedManager}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto rounded-b-2xl p-6">
          {!selectedManager ? (
            <div className="text-center text-slate-400 dark:text-slate-500 py-16">Please select a manager to see their team members.</div>
          ) : filteredEmployees.length === 0 ? (
            <div className="text-center text-slate-400 dark:text-slate-500 py-16">No team members found for this manager.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEmployees.map(employee => (
                <div key={employee._id} className="bg-slate-50/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow hover:shadow-lg transition-shadow p-6 flex flex-col items-center">
                  <img
                    src={employee.profilePicture || `https://ui-avatars.com/api/?name=${employee.name}&background=random`}
                    alt={employee.name}
                    onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${employee.name}&background=random`; }}
                    className="h-16 w-16 rounded-full object-cover border-2 border-blue-200 dark:border-blue-800 mb-3"
                  />
                  <div className="text-center">
                    <div className="font-bold text-slate-900 dark:text-white text-lg">{employee.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">{employee.employeeId}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-300 mt-1">{employee.role}</div>
                    <div className="text-xs text-slate-400 dark:text-slate-500">{employee.department || 'N/A'}</div>
                  </div>
                  <button
                    onClick={() => setSelectedEmployee(employee)}
                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg text-sm transition-colors shadow"
                  >
                    Assign Task
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <AssignTaskModal isOpen={!!selectedEmployee} onClose={() => setSelectedEmployee(null)} employee={selectedEmployee} isAssigning={isAssigning} onAssign={handleAssignTask} />
    </div>
  );
};

export default AssignTask;

 