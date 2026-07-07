import React, { useState, useMemo, useEffect } from 'react';
import { useGetTasksForApprovalQuery, useApproveTaskMutation, useRejectTaskMutation } from '../services/EmployeApi.js';
import toast from 'react-hot-toast';
import { CheckIcon, XMarkIcon, ArrowPathIcon, EyeIcon, InformationCircleIcon, InboxIcon, ArrowLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../app/authSlice';
import { TaskDetailsModal } from './TaskOverview';

const RejectModal = ({ isOpen, onClose, onConfirm, isRejecting }) => {
  const [reason, setReason] = useState('');
  const [finalPercentage, setFinalPercentage] = useState(80);

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setFinalPercentage(80);
    }
  }, [isOpen]);

  return (
    !isOpen ? null : (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 transition-opacity">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md border border-gray-100 dark:border-slate-700 transform transition-all scale-100">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Reject Task</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-100 dark:border-red-800/30">
             <p className="text-sm text-red-800 dark:text-red-300 font-medium flex items-center gap-2">
               <InformationCircleIcon className="h-5 w-5" />
               This action will return the task to the employee.
             </p>
          </div>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Please provide a clear reason for rejection..."
            className="w-full text-sm border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg p-3 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all resize-none"
            rows="4"
          />
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Set Final Progress Percentage</label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="99" // Cannot reject and give 100%
                step="10"
                value={finalPercentage}
                onChange={(e) => setFinalPercentage(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-600"
              />
              <span className="font-bold w-12 text-right text-gray-700 dark:text-white">{finalPercentage}%</span>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 bg-gray-50 dark:bg-slate-800/50 rounded-b-xl flex justify-end gap-3 border-t border-gray-100 dark:border-slate-800">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-gray-600 dark:text-slate-300 font-medium hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-sm">Cancel</button>
          <button onClick={() => {
            if (finalPercentage === 100) {
              toast.error("Cannot reject with 100% progress. Please use the 'Approve' flow.");
              return;
            }
            onConfirm(reason, finalPercentage);
          }} disabled={!reason || isRejecting} className="inline-flex items-center justify-center bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg text-sm disabled:bg-red-400 shadow-sm transition-all">
            {isRejecting ? <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" /> : <XMarkIcon className="h-4 w-4 mr-2" />}
            Submit Grade
          </button>
        </div>
      </div>
    </div>
    )
  );
};

const ApproveModal = ({ isOpen, onClose, onConfirm, isApproving, initialProgress }) => {
  const [comment, setComment] = useState('');
  const [finalPercentage, setFinalPercentage] = useState(100);

  useEffect(() => {
    if (isOpen) {
      setFinalPercentage(initialProgress || 100);
      setComment('');
    }
  }, [isOpen, initialProgress]);

  const getGradeFromPercentage = (p) => {
    if (p === 100) return { label: 'Completed', color: 'text-emerald-600' };
    if (p >= 80) return { label: 'Moderate', color: 'text-blue-600' };
    if (p >= 60) return { label: 'Low', color: 'text-amber-600' };
    return { label: 'Pending', color: 'text-red-600' };
  };

  const currentGrade = getGradeFromPercentage(finalPercentage);

  return (
    !isOpen ? null : (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 transition-opacity">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md border border-gray-200 dark:border-slate-700 transform transition-all scale-100">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Approve Task</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Final Progress</label>
            <div className="flex items-center gap-4">
              <input
                type="range" min="0" max="100" step="10"
                value={finalPercentage}
                onChange={(e) => setFinalPercentage(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-green-600"
              />
              <div className="text-right w-24">
                <span className="font-bold text-gray-800 dark:text-white text-lg">{finalPercentage}%</span>
                <span className={`block text-xs font-bold ${currentGrade.color}`}>{currentGrade.label}</span>
              </div>
            </div>
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add an optional comment... (e.g., Great work!)"
            className="w-full text-sm border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg p-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none"
            rows="3"
          />
        </div>
        <div className="px-6 py-4 bg-gray-50 dark:bg-slate-800/50 rounded-b-xl flex justify-end gap-3 border-t border-gray-100 dark:border-slate-800">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-gray-600 dark:text-slate-300 font-medium hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-sm">Cancel</button>
          <button onClick={() => onConfirm(finalPercentage, comment)} disabled={isApproving} className="inline-flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg text-sm disabled:bg-green-400 shadow-sm transition-all">
            {isApproving && <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" />}
            Confirm Approval
          </button>
        </div>
      </div>
    </div>
    )
  );
};

const TaskApprovals = () => {
  const { data: tasksForApproval = [], isLoading: isLoadingTasks } = useGetTasksForApprovalQuery(undefined, { pollingInterval: 30000 });
  const [approveTask, { isLoading: isApproving }] = useApproveTaskMutation();
  const [rejectTask, { isLoading: isRejecting }] = useRejectTaskMutation();
  const _currentUser = useSelector(selectCurrentUser); // currently unused
  const [rejectingTask, setRejectingTask] = useState(null);
  const [viewingTask, setViewingTask] = useState(null);
  const [approvingTask, setApprovingTask] = useState(null);
  const [selectedEmployeeData, setSelectedEmployeeData] = useState(null);

const pendingApprovalsByEmployee = useMemo(() => {
  if (!tasksForApproval) return {};
  return tasksForApproval.reduce((acc, task) => {
    const employeeId = task.assignedTo?._id;
    if (employeeId && task.assignedTo) {
      if (!acc[employeeId]) {
        acc[employeeId] = {
          employee: task.assignedTo,
          tasks: []
        };
      }
      acc[employeeId].tasks.push(task);
    }
    return acc;
  }, {});
}, [tasksForApproval]);

  const employeesWithPendingApprovals = Object.values(pendingApprovalsByEmployee);

  const handleApprove = (task) => {
    setApprovingTask(task);
  };

  const handleConfirmApprove = async (finalPercentage, comment) => {
    if (!approvingTask) return;
    try {
      await approveTask({ id: approvingTask._id, finalPercentage, comment }).unwrap();
      toast.success('Task approved!');
      setApprovingTask(null);
    } catch (err) {
      console.error('Failed to approve task:', err);
      toast.error('Failed to approve task.');
    }
  };

  const handleReject = (task) => {
    setRejectingTask(task);
  };

  const handleConfirmReject = async (reason, finalPercentage) => {
    try {
      await rejectTask({ id: rejectingTask._id, reason, finalPercentage }).unwrap();
      toast.success('Task rejected and feedback sent.');
      setRejectingTask(null);
    } catch (err) {
      console.error('Failed to reject task:', err);
      toast.error(err.data?.message || 'Failed to reject task.');
    }
  };

  if (isLoadingTasks) {
    return <div className="p-8 text-center">Loading approval requests...</div>;
  }

  // Main view showing team members with pending approvals
  if (!selectedEmployeeData) {
    return (
      <div className="p-6 lg:p-10 h-full flex flex-col bg-gray-50 dark:bg-black/50 font-manrope">
        <div className="mb-10 bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg border border-slate-100 dark:border-slate-700 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full blur-3xl -mr-16 -mt-16 transition-transform duration-700 group-hover:scale-110"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <CheckIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Pending Approvals</h1>
            </div>
            <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl">
              Select an employee to review their task submissions.
            </p>
          </div>
        </div>
        {employeesWithPendingApprovals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {employeesWithPendingApprovals.map(({ employee, tasks }) => (
              <div
                key={employee._id}
                onClick={() => setSelectedEmployeeData({ employee, tasks })}
                className="group relative bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border border-slate-200 dark:border-slate-700 overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500 transform scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-top"></div>
                
                <div className="flex items-start justify-between mb-6">
                   <div className="flex items-center gap-4">
                    <div className="relative">
                        <img src={employee.profilePicture || `https://ui-avatars.com/api/?name=${employee.name}`} alt={employee.name} className="h-16 w-16 rounded-full object-cover border-2 border-slate-100 dark:border-slate-700 group-hover:border-blue-200 transition-colors shadow-sm" />
                        <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-800 rounded-full p-0.5">
                            <div className="bg-green-500 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-slate-800"></div>
                        </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white group-hover:text-blue-600 transition-colors">{employee.name}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{employee.role}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{employee.department || 'Team Member'}</p>
                    </div>
                   </div>
                </div>
                
                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700 group-hover:border-blue-100 dark:group-hover:border-blue-900/30 transition-colors">
                   <div className="flex flex-col">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Pending Tasks</span>
                      <span className="text-2xl font-extrabold text-slate-800 dark:text-white">{tasks.length}</span>
                   </div>
                   <div className="h-10 w-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <ChevronRightIcon className="h-5 w-5" />
                   </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center py-24 text-gray-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-gray-300 dark:border-slate-700 w-full max-w-2xl">
              <div className="bg-slate-50 dark:bg-slate-800 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <InboxIcon className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">All Caught Up!</h3>
              <p className="text-slate-500 dark:text-slate-400">There are no pending task approvals from your team at this time.</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Detailed view showing tasks for the selected employee
  return (
    <div className="p-6 lg:p-10 h-full flex flex-col bg-gray-50 dark:bg-black/50 font-manrope">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => setSelectedEmployeeData(null)} className="p-2 rounded-lg hover:bg-white dark:hover:bg-slate-800 text-gray-500 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-slate-700">
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedEmployeeData.employee.name}</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">Reviewing {selectedEmployeeData.tasks.length} pending tasks</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {selectedEmployeeData.tasks.map(task => (
          <div key={task._id} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 shadow-sm flex flex-col lg:flex-row lg:items-center gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20 dark:bg-yellow-900/30 dark:text-yellow-300">Pending Review</span>
                <span className="text-xs text-gray-400">• Submitted {new Date(task.submittedForCompletionDate).toLocaleDateString()}</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">{task.title}</h3>
              <p className="text-sm text-gray-500 dark:text-slate-400 line-clamp-1">{task.description}</p>
            </div>

            <div className="w-full lg:w-48">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500 dark:text-slate-400">Progress</span>
                <span className="font-medium text-gray-900 dark:text-white">{task.progress}%</span>
              </div>
              <div className="h-2 w-full bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: `${task.progress}%` }}></div>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full lg:w-auto pt-4 lg:pt-0 border-t lg:border-t-0 border-gray-100 dark:border-slate-700">
              <button onClick={() => setViewingTask(task)} className="flex-1 lg:flex-none justify-center inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700">
                <EyeIcon className="h-4 w-4" /> View
              </button>
              <button onClick={() => handleReject(task)} disabled={isApproving || isRejecting} className="flex-1 lg:flex-none justify-center inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-200 rounded-lg hover:bg-red-50 dark:bg-slate-800 dark:text-red-400 dark:border-red-900/50 dark:hover:bg-red-900/20">
                <XMarkIcon className="h-4 w-4" /> Reject
              </button>
              <button onClick={() => handleApprove(task)} disabled={isApproving || isRejecting} className="flex-1 lg:flex-none justify-center inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 shadow-sm">
                {isApproving ? <ArrowPathIcon className="animate-spin h-4 w-4" /> : <CheckIcon className="h-4 w-4" />} Approve
              </button>
            </div>
          </div>
        ))}
      </div>
      <RejectModal
        isOpen={!!rejectingTask}
        onClose={() => setRejectingTask(null)}
        onConfirm={handleConfirmReject}
        isRejecting={isRejecting}
      />
      <ApproveModal
        isOpen={!!approvingTask}
        onClose={() => setApprovingTask(null)}
        onConfirm={handleConfirmApprove}
        isApproving={isApproving}
        initialProgress={approvingTask?.progress || 100}
      />
      <TaskDetailsModal
        isOpen={!!viewingTask}
        onClose={() => setViewingTask(null)}
        task={viewingTask}
      />
    </div>
  );
};

export default TaskApprovals;