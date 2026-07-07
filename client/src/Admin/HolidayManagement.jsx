import React, { useState, useMemo } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useGetHolidaysQuery, useAddHolidayMutation, useDeleteHolidayMutation } from '../services/EmployeApi';
import toast from 'react-hot-toast';
import { PlusIcon, TrashIcon, XMarkIcon, ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

const AddHolidayModal = ({ isOpen, onClose, onSave, date, isAdding }) => {
  const [name, setName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter a name for the holiday.');
      return;
    }
    onSave(name);
    setName('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-sm">
        <div className="p-6 border-b dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Add Holiday</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">{date.toLocaleDateString('en-US', { dateStyle: 'full' })}</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <label htmlFor="holidayName" className="block text-sm font-medium text-slate-700 mb-1">Holiday Name</label>
            <input
              id="holidayName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., New Year's Day"
              className="w-full text-sm border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 dark:text-white"
            />
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="bg-white hover:bg-slate-100 text-slate-700 font-bold py-2 px-4 rounded-lg border border-slate-300 text-sm">Cancel</button>
            <button type="submit" disabled={isAdding} className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-sm disabled:bg-blue-400">
              {isAdding && <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" />}
              Save Holiday
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, holiday, isDeleting }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-sm">
        <div className="p-6 text-center">
          <div className="mx-auto bg-red-100 dark:bg-red-500/10 rounded-full h-12 w-12 flex items-center justify-center my-4"><ExclamationTriangleIcon className="h-6 w-6 text-red-600" /></div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Confirm Deletion</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Are you sure you want to remove "{holiday.name}" as a holiday?</p>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-b-lg flex justify-center gap-3">
          <button type="button" onClick={onClose} className="bg-white hover:bg-slate-100 text-slate-700 font-bold py-2 px-4 rounded-lg border border-slate-300 text-sm">Cancel</button>
          <button type="button" onClick={onConfirm} disabled={isDeleting} className="inline-flex items-center justify-center bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg text-sm disabled:bg-red-400">
            {isDeleting && <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" />}
            Confirm Delete
          </button>
        </div>
      </div>
    </div>
  );
};

const HolidayManagement = () => {
  const [date, setDate] = useState(new Date());
  const { data: holidays = [], isLoading } = useGetHolidaysQuery();
  const [addHoliday, { isLoading: isAdding }] = useAddHolidayMutation();
  const [deleteHoliday, { isLoading: isDeleting }] = useDeleteHolidayMutation();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDateForModal, setSelectedDateForModal] = useState(null);
  const [deletingHoliday, setDeletingHoliday] = useState(null);

  const holidayDates = useMemo(() => {
    const dateMap = new Map();
    if (holidays) {
      holidays.forEach(h => {
        const localDate = new Date(h.date);
        const localDateString = new Date(localDate.getFullYear(), localDate.getMonth(), localDate.getDate()).toDateString();
        dateMap.set(localDateString, h);
      });
    }
    return dateMap;
  }, [holidays]);

  const upcomingHolidays = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return holidays
      .filter(h => new Date(h.date) >= today)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [holidays]);

  const handleDateClick = async (value) => {
    const dateString = new Date(value.getFullYear(), value.getMonth(), value.getDate()).toDateString();

    if (value.getDay() === 0) {
      toast.error("Sunday is a permanent holiday and cannot be modified.");
      return;
    }

    const existingHoliday = holidayDates.get(dateString);

    if (existingHoliday) {
      // If it's already a holiday, confirm deletion
      setDeletingHoliday(existingHoliday);
    } else {
      // If it's not a holiday, prompt for a name and add it
      setSelectedDateForModal(value);
      setIsAddModalOpen(true);
    }
  };

  const handleSaveHoliday = async (name) => {
    try {
      const dateToSave = new Date(Date.UTC(selectedDateForModal.getFullYear(), selectedDateForModal.getMonth(), selectedDateForModal.getDate()));
      await addHoliday({ date: dateToSave.toISOString(), name }).unwrap();
      toast.success('Holiday added successfully!');
      setIsAddModalOpen(false);
      setSelectedDateForModal(null);
    } catch (err) {
      console.error('Failed to add holiday:', err);
      toast.error(err.data?.message || 'Failed to add holiday.');
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteHoliday(deletingHoliday._id).unwrap();
      toast.success('Holiday removed successfully!');
      setDeletingHoliday(null);
    } catch (err) {
      console.error('Failed to remove holiday:', err);
      toast.error('Failed to remove holiday.');
    }
  };

  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const dateString = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())).toDateString();
      const holiday = holidayDates.get(dateString);
      if (holiday) {
        return <p className="tile-label text-amber-800 dark:text-amber-200">{holiday.name}</p>;
      }
    }
    return null;
  };

  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      const dateString = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())).toDateString();
      if (date.getDay() === 0) {
        return 'sunday-tile';
      }
      if (holidayDates.has(dateString)) {
        return 'holiday-tile';
      }
    }
    return null;
  };

  const tileDisabled = ({ date, view }) => {
    // Disable Sundays in month view
    return view === 'month' && date.getDay() === 0;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full flex flex-col">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-200 tracking-tight">Holiday Management</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Manage your company's holiday calendar. Click on a date to add or remove a holiday.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg p-6">
          {isLoading ? (
            <p>Loading holidays...</p>
          ) : (
            <Calendar
              className="custom-calendar"
              onChange={setDate}
              value={date}
              onClickDay={handleDateClick}
              tileContent={tileContent}
              tileClassName={tileClassName}
              tileDisabled={tileDisabled}
            />
          )}
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg p-6 flex flex-col">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 border-b pb-3 dark:border-slate-700">Upcoming Holidays</h3>
          <div className="flex-1 overflow-y-auto">
            {upcomingHolidays.length > 0 ? (
              <ul className="space-y-3">
                {upcomingHolidays.map(holiday => (
                  <li key={holiday._id} className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-500/10">
                    <div>
                      <p className="font-semibold text-red-800 dark:text-red-300">{holiday.name}</p>
                      <p className="text-xs text-red-600 dark:text-red-400">{new Date(holiday.date).toLocaleDateString('en-US', { dateStyle: 'long', timeZone: 'UTC' })}</p>
                    </div>
                    <button onClick={() => setDeletingHoliday(holiday)} className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-full"><TrashIcon className="h-4 w-4" /></button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-sm text-slate-400 pt-10">No upcoming holidays found.</p>
            )}
          </div>
        </div>
      </div>
      <AddHolidayModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSave={handleSaveHoliday} date={selectedDateForModal} isAdding={isAdding} />
      <DeleteConfirmationModal isOpen={!!deletingHoliday} onClose={() => setDeletingHoliday(null)} onConfirm={handleConfirmDelete} holiday={deletingHoliday} isDeleting={isDeleting} />
    </div>
  );
};

export default HolidayManagement;