import React, { useState, useMemo } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useGetAttendanceForMonthQuery } from '../services/EmployeApi';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';

const AttendanceCalendar = ({ employeeId }) => {
  const [activeStartDate, setActiveStartDate] = useState(new Date());

  const year = activeStartDate.getUTCFullYear();
  const month = activeStartDate.getUTCMonth() + 1;

  const { data: attendanceData = [], isLoading } = useGetAttendanceForMonthQuery(
    { employeeId, year, month },
    { skip: !employeeId }
  );

  const attendanceMap = useMemo(() => {
    const map = new Map();
    attendanceData.forEach(item => {
      map.set(item.date, item.status);
    });
    return map;
  }, [attendanceData]);

  const legendItems = [
    { label: 'Present', className: 'present-tile' },
    { label: 'Absent', className: 'absent-tile' },
    { label: 'On Leave', className: 'leave-tile' },
    { label: 'Holiday', className: 'holiday-tile' },
    { label: 'Sunday', className: 'sunday-tile' },
  ];
  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const dateStr = date.toISOString().split('T')[0];
      // The calendar passes local time dates, we need to find the status for the corresponding UTC date string.
      const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      const status = attendanceMap.get(utcDate.toISOString().split('T')[0]);
      if (status && status !== 'Future' && status !== 'Pending') {
        return <p className="tile-label">{status}</p>;
      }
    }
    return null;
  };

  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      const status = attendanceMap.get(utcDate.toISOString().split('T')[0]);
      
      if (status === 'Present') return 'present-tile';
      if (status === 'Absent') return 'absent-tile';
      if (status === 'On Leave') return 'leave-tile';
      if (status === 'Holiday') return 'holiday-tile';
      if (date.getUTCDay() === 0) return 'sunday-tile';
    }
    return null;
  };

  const Legend = () => (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4 text-xs">
      {legendItems.map(({ label, className }) => (
        <div key={label} className="flex items-center gap-2">
          <span className={`h-3 w-3 rounded-full ${className}`}></span>
          <span className="dark:text-slate-300">{label}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="p-0 sm:p-2 lg:p-4">
        {isLoading && <div className="text-center p-4">Loading attendance...</div>}
        <Calendar
          className="custom-calendar"
          activeStartDate={activeStartDate}
          onActiveStartDateChange={({ activeStartDate }) => {
            // Ensure the new start date is also treated as UTC midnight
            setActiveStartDate(new Date(Date.UTC(activeStartDate.getFullYear(), activeStartDate.getMonth(), 1)));
          }}
          value={new Date()}
          tileContent={tileContent}
          tileClassName={tileClassName}
          showNeighboringMonth={false}
          prev2Label={null}
          next2Label={null}
          prevLabel={<ChevronLeftIcon className="h-6 w-6" />}
          nextLabel={<ChevronRightIcon className="h-6 w-6" />}
        />
        <Legend />
    </div>
  );
};

export default AttendanceCalendar;