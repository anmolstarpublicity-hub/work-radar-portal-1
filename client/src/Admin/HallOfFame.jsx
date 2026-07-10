import React, { useState, useMemo, useEffect } from 'react';
import { useGetHallOfFameQuery } from '../services/EmployeApi';
import { TrophyIcon, BuildingLibraryIcon } from '@heroicons/react/24/outline';

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const WinnerCard = ({ winner }) => (
  <div className="flex flex-col items-center text-center p-4 bg-white rounded-xl shadow-md border border-slate-100">
    <img
      src={winner.employee?.profilePicture || `https://ui-avatars.com/api/?name=${winner.employee?.name}&background=random`}
      alt={winner.employee.name}
      onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${winner.employee?.name}&background=random`; }}
      className="h-20 w-20 rounded-full object-cover border-4 border-amber-300"
    />
    <h4 className="mt-3 font-bold text-slate-800">{winner.employee.name}</h4>
    <p className="text-sm font-semibold text-blue-600">{winner.employee.company}</p>
    <p className="text-xs text-slate-400">{winner.employee.employeeId}</p>
  </div>
);

const MonthSection = ({ month, year, winners }) => (
  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
    <h3 className="text-xl font-bold text-slate-700 mb-4">{monthNames[month - 1]} {year}</h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {winners.map(winner => (
        <WinnerCard key={winner._id} winner={winner} />
      ))}
    </div>
  </div>
);

const HallOfFame = () => {
  const { data: hallOfFameData = {}, isLoading } = useGetHallOfFameQuery();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  const availableYears = useMemo(() => {
    return Object.keys(hallOfFameData).sort((a, b) => b - a);
  }, [hallOfFameData]);

  useEffect(() => {
    if (availableYears.length > 0 && !availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[0]);
    }
  }, [availableYears, selectedYear]);

  const monthsForSelectedYear = useMemo(() => {
    if (!hallOfFameData[selectedYear]) return [];
    return Object.keys(hallOfFameData[selectedYear]).sort((a, b) => b - a);
  }, [hallOfFameData, selectedYear]);

  if (isLoading) {
    return <div className="p-8 text-center">Loading Hall of Fame...</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full bg-slate-50 dark:bg-slate-900">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
            <BuildingLibraryIcon className="h-8 w-8 text-blue-600" />
            Hall of Fame
          </h1>
          <p className="text-slate-500 mt-2">A legacy of excellence. Browse past Employee of the Month winners.</p>
        </div>
        {availableYears.length > 0 && (
          <div className="flex items-center gap-2">
            <label htmlFor="year-select" className="text-sm font-semibold text-slate-600">Year:</label>
            <select
              id="year-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500"
            >
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {monthsForSelectedYear.length > 0 ? (
        <div className="space-y-8">
          {monthsForSelectedYear.map(month => (
            <MonthSection
              key={`${selectedYear}-${month}`}
              month={month}
              year={selectedYear}
              winners={hallOfFameData[selectedYear][month]}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
          <TrophyIcon className="h-16 w-16 mx-auto text-slate-400 mb-4" />
          <p className="font-semibold text-lg">No Winners Found</p>
          <p className="text-sm mt-2">There are no "Employee of the Month" records for the selected year.</p>
        </div>
      )}
    </div>
  );
};

export default HallOfFame;