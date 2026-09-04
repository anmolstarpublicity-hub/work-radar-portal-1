import React, { useState, useMemo, useEffect } from 'react';
import { useGetTasksForApprovalQuery, useApproveTaskMutation, useRejectTaskMutation } from '../services/EmployeApi.js';
import toast from 'react-hot-toast';
import {
  CheckIcon,
  XMarkIcon,
  ArrowPathIcon,
  EyeIcon,
  InformationCircleIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/solid';
import {
  CheckBadgeIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../app/authSlice';
import { TaskDetailsModal } from './TaskOverview';

// ── Reject Modal ───────────────────────────────────────────────────────────

const RejectModal = ({ isOpen, onClose, onConfirm, isRejecting }) => {
  const [reason, setReason] = useState('');
  const [finalPercentage, setFinalPercentage] = useState(80);

  useEffect(() => {
    if (isOpen) { setReason(''); setFinalPercentage(80); }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-purple-100 overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg,#dc2626,#ef4444)' }}>
          <div className="flex items-center gap-2">
            <XMarkIcon className="h-5 w-5 text-white/80" />
            <h3 className="text-base font-bold text-white">Reject Task</h3>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex items-start gap-2">
            <InformationCircleIcon className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs font-semibold text-red-700">This action will return the task to the employee with your feedback.</p>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Rejection Reason *</label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Provide a clear reason for rejection..."
              rows={4}
              className="w-full text-sm border border-purple-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-red-300 focus:border-red-400 outline-none bg-slate-50 resize-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Final Progress</label>
            <div className="flex items-center gap-4">
              <input type="range" min="0" max="99" step="10"
                value={finalPercentage}
                onChange={e => setFinalPercentage(parseInt(e.target.value, 10))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-red-500"
              />
              <span className="font-extrabold text-slate-800 w-12 text-right">{finalPercentage}%</span>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 flex justify-end gap-3">
          <button onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-purple-200 rounded-xl hover:bg-slate-50 transition">
            Cancel
          </button>
          <button
            onClick={() => {
              if (finalPercentage === 100) { toast.error("Cannot reject with 100%. Use Approve."); return; }
              onConfirm(reason, finalPercentage);
            }}
            disabled={!reason.trim() || isRejecting}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl disabled:opacity-50 transition"
          >
            {isRejecting && <ArrowPathIcon className="animate-spin h-4 w-4" />}
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Approve Modal ──────────────────────────────────────────────────────────

const ApproveModal = ({ isOpen, onClose, onConfirm, isApproving, initialProgress }) => {
  const [comment, setComment] = useState('');
  const [finalPercentage, setFinalPercentage] = useState(100);

  useEffect(() => {
    if (isOpen) { setFinalPercentage(initialProgress || 100); setComment(''); }
  }, [isOpen, initialProgress]);

  const getGrade = (p) => {
    if (p === 100) return { label: 'Completed', color: 'text-emerald-600', bg: 'bg-emerald-50' };
    if (p >= 80)  return { label: 'Moderate',  color: 'text-blue-600',    bg: 'bg-blue-50' };
    if (p >= 60)  return { label: 'Low',       color: 'text-amber-600',   bg: 'bg-amber-50' };
    return               { label: 'Pending',   color: 'text-red-600',     bg: 'bg-red-50' };
  };

  const grade = getGrade(finalPercentage);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-purple-100 overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg,#48306A,#8E5FD0)' }}>
          <div className="flex items-center gap-2">
            <CheckIcon className="h-5 w-5 text-white/80" />
            <h3 className="text-base font-bold text-white">Approve Task</h3>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Final Progress</label>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${grade.bg} ${grade.color}`}>
                {finalPercentage}% · {grade.label}
              </span>
            </div>
            <input type="range" min="0" max="100" step="10"
              value={finalPercentage}
              onChange={e => setFinalPercentage(parseInt(e.target.value, 10))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Comment (optional)</label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="e.g., Great work! Well done."
              rows={3}
              className="w-full text-sm border border-purple-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-purple-300 focus:border-purple-400 outline-none bg-slate-50 resize-none"
            />
          </div>
        </div>

        <div className="px-6 pb-6 flex justify-end gap-3">
          <button onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-purple-200 rounded-xl hover:bg-slate-50 transition">
            Cancel
          </button>
          <button onClick={() => onConfirm(finalPercentage, comment)} disabled={isApproving}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-bold text-white rounded-xl disabled:opacity-50 transition"
            style={{ background: 'linear-gradient(135deg,#48306A,#8E5FD0)' }}>
            {isApproving && <ArrowPathIcon className="animate-spin h-4 w-4" />}
            Confirm Approval
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────────────────

const TaskApprovals = () => {
  const { data: tasksForApproval = [], isLoading } = useGetTasksForApprovalQuery(undefined, { pollingInterval: 30000 });
  const [approveTask, { isLoading: isApproving }] = useApproveTaskMutation();
  const [rejectTask,  { isLoading: isRejecting  }] = useRejectTaskMutation();
  const [rejectingTask, setRejectingTask]         = useState(null);
  const [viewingTask, setViewingTask]             = useState(null);
  const [approvingTask, setApprovingTask]         = useState(null);
  const [selectedEmployeeData, setSelectedEmployeeData] = useState(null);
  const [searchTerm, setSearchTerm]               = useState('');

  const pendingByEmployee = useMemo(() => {
    if (!tasksForApproval) return {};
    return tasksForApproval.reduce((acc, task) => {
      const id = task.assignedTo?._id;
      if (id && task.assignedTo) {
        if (!acc[id]) acc[id] = { employee: task.assignedTo, tasks: [] };
        acc[id].tasks.push(task);
      }
      return acc;
    }, {});
  }, [tasksForApproval]);

  const employeeList = useMemo(() =>
    Object.values(pendingByEmployee).filter(({ employee }) =>
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (employee.employeeId && employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase()))
    ),
  [pendingByEmployee, searchTerm]);

  const handleConfirmApprove = async (finalPercentage, comment) => {
    if (!approvingTask) return;
    try {
      await approveTask({ id: approvingTask._id, finalPercentage, comment }).unwrap();
      toast.success('Task approved!');
      setApprovingTask(null);
      // If last task, go back
      if (selectedEmployeeData?.tasks.length === 1) setSelectedEmployeeData(null);
    } catch { toast.error('Failed to approve task.'); }
  };

  const handleConfirmReject = async (reason, finalPercentage) => {
    try {
      await rejectTask({ id: rejectingTask._id, reason, finalPercentage }).unwrap();
      toast.success('Task rejected and feedback sent.');
      setRejectingTask(null);
      if (selectedEmployeeData?.tasks.length === 1) setSelectedEmployeeData(null);
    } catch (err) { toast.error(err.data?.message || 'Failed to reject task.'); }
  };

  if (isLoading) {
    return (
      <div className="min-h-full flex items-center justify-center" style={{ backgroundColor: '#DFCDFE' }}>
        <p className="text-slate-500 font-medium">Loading approval requests...</p>
      </div>
    );
  }

  // ── Employee selection view ──────────────────────────────────────────────
  if (!selectedEmployeeData) {
    return (
      <div className="min-h-full p-6 lg:p-8" style={{ backgroundColor: '#DFCDFE' }}>
        {/* Header */}
        <div className="mb-2">
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Pending Approvals</h2>
          <div className="h-1 w-12 rounded-full mt-1 mb-3" style={{ background: 'linear-gradient(90deg,#48306A,#8E5FD0)' }} />
          <p className="text-slate-500 text-sm">Select An Employee To Review Their Task Submissions</p>
        </div>

        {/* Search */}
        <div className="my-6">
          <div className="relative w-full sm:w-80">
            <MagnifyingGlassIcon className="h-4 w-4 text-slate-400 absolute top-1/2 left-3 -translate-y-1/2" />
            <input type="text" placeholder="Search employees..." value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-purple-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-300 shadow-sm" />
          </div>
        </div>

        {employeeList.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-8">
            {employeeList.map(({ employee, tasks }) => (
              <div key={employee._id}
                onClick={() => setSelectedEmployeeData({ employee, tasks })}
                className="bg-white rounded-2xl border border-purple-100 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:scale-[1.01] transition-all duration-300 overflow-hidden flex flex-col cursor-pointer">
                {/* Banner */}
                <div className="h-24 w-full relative flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#48306A,#8E5FD0)' }}>
                  {/* Task count badge */}
                  <div className="absolute top-2 right-3">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white px-2.5 py-1 rounded-full shadow-lg"
                      style={{
                        background: 'linear-gradient(135deg,#dc2626,#ef4444)',
                        boxShadow: '0 0 10px 2px rgba(239,68,68,0.6), 0 0 20px 4px rgba(239,68,68,0.3)',
                      }}>
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                      </span>
                      {tasks.length} pending
                    </span>
                  </div>
                  <div className="absolute -bottom-14 left-1/2 -translate-x-1/2">
                    <img
                      src={employee.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=8E5FD0&color=fff`}
                      alt={employee.name}
                      onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=8E5FD0&color=fff`; }}
                      className="h-28 w-28 rounded-full object-cover border-4 border-white shadow-md"
                    />
                  </div>
                </div>
                <div className="flex flex-col items-center pt-16 px-5 pb-5">
                  <h3 className="mt-2 text-base font-bold text-slate-800 text-center">{employee.name}</h3>
                  <p className="text-xs text-purple-500 font-semibold">{employee.role}</p>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">{employee.employeeId}</p>
                  <div className="mt-4 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-white"
                    style={{ background: 'linear-gradient(135deg,#48306A,#8E5FD0)' }}>
                    Review Tasks
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-purple-100 p-16 text-center">
            <CheckBadgeIcon className="h-16 w-16 mx-auto text-purple-200 mb-4" />
            <h3 className="text-lg font-bold text-slate-700">All Caught Up!</h3>
            <p className="text-sm text-slate-400 mt-1">No pending task approvals at this time.</p>
          </div>
        )}
      </div>
    );
  }

  // ── Task review view ────────────────────────────────────────────────────
  return (
    <div className="min-h-full p-6 lg:p-8" style={{ backgroundColor: '#DFCDFE' }}>
      {/* Header with back */}
      <div className="mb-6 flex items-center gap-4">
        <button onClick={() => setSelectedEmployeeData(null)}
          className="p-2 rounded-xl bg-white border border-purple-200 hover:bg-purple-50 shadow-sm transition">
          <ArrowLeftIcon className="h-5 w-5 text-purple-600" />
        </button>
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            Review — <span style={{ color: '#48306A' }}>{selectedEmployeeData.employee.name}</span>
          </h2>
          <div className="h-1 w-12 rounded-full mt-1" style={{ background: 'linear-gradient(90deg,#48306A,#8E5FD0)' }} />
        </div>
      </div>

      {/* Task cards */}
      <div className="space-y-4 pb-8">
        {selectedEmployeeData.tasks.map(task => (
          <div key={task._id}
            className="bg-white rounded-2xl border border-purple-100 shadow-sm p-5 flex flex-col lg:flex-row lg:items-center gap-5">

            {/* Task info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="inline-flex items-center text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                  Pending Review
                </span>
                {task.submittedForCompletionDate && (
                  <span className="text-[11px] text-slate-400">
                    Submitted {new Date(task.submittedForCompletionDate).toLocaleDateString()}
                  </span>
                )}
                <span className={`inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-full ml-auto ${
                  task.priority === 'High'   ? 'bg-red-50 text-red-600 border border-red-200' :
                  task.priority === 'Medium' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                  'bg-green-50 text-green-600 border border-green-200'
                }`}>
                  {task.priority}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-800 truncate">{task.title}</h3>
              {task.description && (
                <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{task.description}</p>
              )}
            </div>

            {/* Progress bar */}
            <div className="w-full lg:w-44 flex-shrink-0">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-semibold text-slate-500">Progress</span>
                <span className="font-extrabold text-purple-600">{task.progress}%</span>
              </div>
              <div className="h-3 w-full bg-purple-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all flex items-center justify-end pr-2 text-[10px] font-bold text-white"
                  style={{ width: `${task.progress}%`, background: 'linear-gradient(90deg,#48306A,#8E5FD0)' }}>
                  {task.progress > 15 ? `${task.progress}%` : ''}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => setViewingTask(task)}
                className="h-9 px-3 flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition">
                <EyeIcon className="h-4 w-4" /> View
              </button>
              <button onClick={() => setRejectingTask(task)} disabled={isApproving || isRejecting}
                className="h-9 px-3 flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition disabled:opacity-50">
                <XMarkIcon className="h-4 w-4" /> Reject
              </button>
              <button onClick={() => setApprovingTask(task)} disabled={isApproving || isRejecting}
                className="h-9 px-4 flex items-center gap-1.5 text-xs font-bold text-white rounded-xl transition disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#48306A,#8E5FD0)' }}>
                {isApproving ? <ArrowPathIcon className="animate-spin h-4 w-4" /> : <CheckIcon className="h-4 w-4" />}
                Approve
              </button>
            </div>
          </div>
        ))}
      </div>

      <RejectModal  isOpen={!!rejectingTask} onClose={() => setRejectingTask(null)} onConfirm={handleConfirmReject} isRejecting={isRejecting} />
      <ApproveModal isOpen={!!approvingTask} onClose={() => setApprovingTask(null)} onConfirm={handleConfirmApprove} isApproving={isApproving} initialProgress={approvingTask?.progress || 100} />
      <TaskDetailsModal isOpen={!!viewingTask} onClose={() => setViewingTask(null)} task={viewingTask} />
    </div>
  );
};

export default TaskApprovals;
