import React, { useState, useMemo } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useGetHolidaysQuery, useAddHolidayMutation, useDeleteHolidayMutation } from '../services/EmployeApi';
import toast from 'react-hot-toast';
import {
  TrashIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  CalendarDaysIcon,
  PlusCircleIcon,
} from '@heroicons/react/24/outline';

// ── Add Holiday Modal ───────────────────────────────────────────────────────

const AddHolidayModal = ({ isOpen, onClose, onSave, date, isAdding }) => {
  const [name, setName] = useState('');

  if (!isOpen || !date) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Please enter a name for the holiday.'); return; }
    onSave(name);
    setName('');
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-purple-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 flex items-center gap-3"
          style={{ background: 'linear-gradient(135deg,#48306A,#8E5FD0)' }}>
          <PlusCircleIcon className="h-5 w-5 text-white/80 flex-shrink-0" />
          <div>
            <h3 className="text-base font-bold text-white">Add Holiday</h3>
            <p className="text-xs text-white/70">{date.toLocaleDateString('en-US', { dateStyle: 'full' })}</p>
          </div>
          <button onClick={onClose} className="ml-auto text-white/70 hover:text-white transition">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Holiday Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., New Year's Day"
              className="w-full text-sm border border-purple-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-purple-300 focus:border-purple-400 outline-none bg-slate-50"
              autoFocus
            />
          </div>
          <div className="px-6 pb-6 flex justify-end gap-3">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-purple-200 rounded-xl hover:bg-purple-50 transition">
              Cancel
            </button>
            <button type="submit" disabled={isAdding}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-bold text-white rounded-xl disabled:opacity-60 transition"
              style={{ background: 'linear-gradient(135deg,#48306A,#8E5FD0)' }}>
              {isAdding && <ArrowPathIcon className="animate-spin h-4 w-4" />}
              Save Holiday
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Delete Confirmation Modal ───────────────────────────────────────────────

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, holiday, isDeleting }) => {
  if (!isOpen || !holiday) return null;
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-purple-100 overflow-hidden">
        <div className="p-6 text-center">
          <div className="mx-auto bg-red-50 rounded-full h-12 w-12 flex items-center justify-center mb-4">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Remove Holiday</h3>
          <p className="text-sm text-slate-500 mt-2">
            Remove <strong className="text-slate-700">"{holiday.name}"</strong> from the holiday list?
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
            Remove
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ──────────────────────────────────────────────────────────

const HolidayManagement = () => {
  const [date, setDate] = useState(new Date());
  const { data: holidays = [], isLoading } = useGetHolidaysQuery();
  const [addHoliday, { isLoading: isAdding }]       = useAddHolidayMutation();
  const [deleteHoliday, { isLoading: isDeleting }]  = useDeleteHolidayMutation();
  const [isAddModalOpen, setIsAddModalOpen]         = useState(false);
  const [selectedDateForModal, setSelectedDateForModal] = useState(null);
  const [deletingHoliday, setDeletingHoliday]       = useState(null);

  const holidayDates = useMemo(() => {
    const map = new Map();
    holidays.forEach(h => {
      const d = new Date(h.date);
      map.set(new Date(d.getFullYear(), d.getMonth(), d.getDate()).toDateString(), h);
    });
    return map;
  }, [holidays]);

  const upcomingHolidays = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return [...holidays]
      .filter(h => new Date(h.date) >= today)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [holidays]);

  const handleDateClick = (value) => {
    const key = new Date(value.getFullYear(), value.getMonth(), value.getDate()).toDateString();
    if (value.getDay() === 0) { toast.error('Sunday is a permanent holiday and cannot be modified.'); return; }
    const existing = holidayDates.get(key);
    if (existing) { setDeletingHoliday(existing); }
    else { setSelectedDateForModal(value); setIsAddModalOpen(true); }
  };

  const handleSaveHoliday = async (name) => {
    try {
      const d = selectedDateForModal;
      await addHoliday({ date: new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())).toISOString(), name }).unwrap();
      toast.success('Holiday added!');
      setIsAddModalOpen(false);
      setSelectedDateForModal(null);
    } catch (err) {
      toast.error(err.data?.message || 'Failed to add holiday.');
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteHoliday(deletingHoliday._id).unwrap();
      toast.success('Holiday removed!');
      setDeletingHoliday(null);
    } catch {
      toast.error('Failed to remove holiday.');
    }
  };

  const tileContent = ({ date: d, view }) => {
    if (view === 'month') {
      const key = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())).toDateString();
      const h = holidayDates.get(key);
      if (h) return <p className="tile-label text-amber-800">{h.name}</p>;
    }
    return null;
  };

  const tileClassName = ({ date: d, view }) => {
    if (view === 'month') {
      if (d.getDay() === 0) return 'sunday-tile';
      const key = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())).toDateString();
      if (holidayDates.has(key)) return 'holiday-tile';
    }
    return null;
  };

  const tileDisabled = ({ date: d, view }) => view === 'month' && d.getDay() === 0;

  return (
    <div className="min-h-full p-6 lg:p-8" style={{ backgroundColor: '#DFCDFE' }}>

      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="mb-2">
        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Holiday Management</h2>
        <div className="h-1 w-12 rounded-full mt-1 mb-3" style={{ background: 'linear-gradient(90deg,#48306A,#8E5FD0)' }} />
        <p className="text-slate-500 text-sm">Manage Your Company's Holiday Calendar. Click A Date To Add Or Remove A Holiday.</p>
      </div>

      {/* ── Two-column layout ─────────────────────────────────────── */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6 pb-8">

        {/* Calendar card */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-purple-100 shadow-sm p-6">
          {isLoading ? (
            <p className="text-slate-500 font-medium">Loading holidays...</p>
          ) : (
            <Calendar
              className="custom-calendar w-full"
              onChange={setDate}
              value={date}
              onClickDay={handleDateClick}
              tileContent={tileContent}
              tileClassName={tileClassName}
              tileDisabled={tileDisabled}
            />
          )}
        </div>

        {/* Upcoming holidays panel */}
        <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-6 flex flex-col">
          {/* Panel header */}
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-purple-100">
            <CalendarDaysIcon className="h-5 w-5 text-purple-500 flex-shrink-0" />
            <h3 className="text-base font-bold text-slate-800">Upcoming Holidays</h3>
            <span className="ml-auto text-xs font-bold text-purple-600 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
              {upcomingHolidays.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2">
            {upcomingHolidays.length > 0 ? upcomingHolidays.map(holiday => (
              <div key={holiday._id}
                className="flex items-center justify-between p-3 rounded-xl bg-purple-50 border border-purple-100 hover:bg-purple-100 transition">
                <div className="min-w-0">
                  <p className="font-bold text-sm text-slate-800 truncate">{holiday.name}</p>
                  <p className="text-xs text-purple-500 mt-0.5">
                    {new Date(holiday.date).toLocaleDateString('en-US', { dateStyle: 'long', timeZone: 'UTC' })}
                  </p>
                </div>
                <button
                  onClick={() => setDeletingHoliday(holiday)}
                  className="ml-3 flex-shrink-0 p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition"
                  title="Remove holiday"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                <CalendarDaysIcon className="h-10 w-10 text-purple-200 mb-2" />
                <p className="text-sm">No upcoming holidays.</p>
              </div>
            )}
          </div>

          {/* Quick-add tip */}
          <div className="mt-4 pt-3 border-t border-purple-100">
            <p className="text-[11px] text-slate-400 text-center leading-relaxed">
              Click any date on the calendar to add or remove a holiday
            </p>
          </div>
        </div>
      </div>

      <AddHolidayModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveHoliday}
        date={selectedDateForModal}
        isAdding={isAdding}
      />
      <DeleteConfirmationModal
        isOpen={!!deletingHoliday}
        onClose={() => setDeletingHoliday(null)}
        onConfirm={handleConfirmDelete}
        holiday={deletingHoliday}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default HolidayManagement;
