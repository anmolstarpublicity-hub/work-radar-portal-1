import React, { useState, useMemo } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useGetLeavesForEmployeeQuery, useAddLeaveMutation, useRemoveLeaveMutation, useGetHolidaysQuery } from '../services/EmployeApi';
import toast from 'react-hot-toast';
import { XMarkIcon } from '@heroicons/react/24/outline';

const LeaveManagementModal = ({ isOpen, onClose, employee }) => {
  const [date, setDate] = useState(new Date());
  const { data: leaves = [], isLoading } = useGetLeavesForEmployeeQuery(employee?._id, { skip: !isOpen || !employee?._id });
  const { data: holidays = [] } = useGetHolidaysQuery();
  const [addLeave] = useAddLeaveMutation();
  const [removeLeave] = useRemoveLeaveMutation();

  const leaveDates = useMemo(() => {
    const dateMap = new Map();
    leaves.forEach(l => {
      const utcDate = new Date(l.date);
      const utcDateString = new Date(Date.UTC(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), utcDate.getUTCDate())).toDateString();
      dateMap.set(utcDateString, l);
    });
    return dateMap;
  }, [leaves]);

  const companyHolidayDates = useMemo(() => {
    return new Set(holidays.map(h => {
        const utcDate = new Date(h.date);
        return new Date(Date.UTC(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), utcDate.getUTCDate())).toDateString();
    }));
  }, [holidays]);

  if (!isOpen || !employee) return null;

  const handleDateClick = async (value) => {
    // `value` from react-calendar is a local date. We need its UTC equivalent string.
    const dateString = new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate())).toDateString();

    if (value.getDay() === 0) {
      toast.error("Sunday is a permanent holiday.");
      return;
    }

    if (companyHolidayDates.has(dateString)) {
      toast.error("This is a company-wide holiday and cannot be marked as personal leave.");
      return;
    }

    const existingLeave = leaveDates.get(dateString);

    if (existingLeave) {
      try {
        await removeLeave(existingLeave._id).unwrap();
        toast.success('Leave day removed.');
      } catch (err) {
        console.error('Failed to remove leave:', err);
        toast.error('Failed to remove leave.');
      }
    } else {
      try {
        // Create a new UTC date object from the clicked value to ensure no timezone shift.
        const utcDate = new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()));
        await addLeave({ employeeId: employee._id, date: utcDate.toISOString() }).unwrap();
        toast.success('Leave day added.');
      } catch (err) {
        console.error('Failed to add leave:', err);
        toast.error(err.data?.message || 'Failed to add leave.');
      }
    }
  };

  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      const utcDateString = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())).toDateString();
      if (date.getDay() === 0) return 'sunday-tile';
      if (companyHolidayDates.has(utcDateString)) return 'holiday-tile';
      if (leaveDates.has(utcDateString)) return 'leave-tile';
    }
    return null;
  };

  const tileDisabled = ({ date, view }) => {
    if (view === 'month') {
      const utcDateString = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())).toDateString();
      return date.getDay() === 0 || companyHolidayDates.has(utcDateString);
    }
    return false;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-xl">
        <div className="p-5 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-800">Manage Leave for {employee.name}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="p-6">
          {isLoading ? (
            <p>Loading leave data...</p>
          ) : (
            <Calendar
              className="custom-calendar"
              onChange={setDate}
              value={date}
              onClickDay={handleDateClick}
              tileClassName={tileClassName}
              tileDisabled={tileDisabled}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaveManagementModal;