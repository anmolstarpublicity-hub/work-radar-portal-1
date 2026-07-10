import React, { useState, useMemo } from 'react';
import { useGetEmployeeOfTheMonthCandidatesQuery, useSetEmployeeOfTheMonthMutation, useGetOfficialEOMQuery } from '../services/EmployeApi.js';
import { TrophyIcon, ArrowDownTrayIcon, CheckBadgeIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const EmployeeOfTheMonth = () => {
  const currentMonth = new Date().getMonth() + 1; // 1-indexed
  const currentYear = new Date().getFullYear();

  const [selectedMonth, setSelectedMonth] = useState(currentMonth); 
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [companyFilter, setCompanyFilter] = useState('All'); // 'All', 'Star Publicity', 'Volga Infosys'

  const { data: candidates = [], isLoading, isFetching } = useGetEmployeeOfTheMonthCandidatesQuery(
    { month: selectedMonth, year: selectedYear },
    { refetchOnMountOrArgChange: true }
  );

  const { data: officialWinners = [] } = useGetOfficialEOMQuery(
    { month: selectedMonth, year: selectedYear },
    { refetchOnMountOrArgChange: true }
  );

  const [setWinner, { isLoading: isSettingWinner }] = useSetEmployeeOfTheMonthMutation();


  const years = useMemo(() => {
    const y = [];
    for (let i = currentYear; i >= currentYear - 5; i--) {
      y.push(i);
    }
    return y;
  }, [currentYear]);

  const months = useMemo(() => [
    { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
    { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
    { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' },
  ], []);

  const allCandidates = useMemo(() => (Array.isArray(candidates) ? candidates : []), [candidates]);

  const filteredCandidates = useMemo(() => {
    if (companyFilter === 'All') return allCandidates;
    return allCandidates.filter(c => c.employee.company === companyFilter);
  }, [allCandidates, companyFilter]);

  const officialWinnerIds = useMemo(() => new Set(officialWinners.map(w => w.employee._id)), [officialWinners]);
  const officialWinnersByCompany = useMemo(() => {
    return officialWinners.reduce((acc, winner) => {
      acc[winner.company] = winner.employee;
      return acc;
    }, {});
  }, [officialWinners]);

  const handleSetWinner = async (candidate) => {
    try {
      await setWinner({
        employeeId: candidate.employee._id,
        company: candidate.employee.company,
        month: selectedMonth,
        year: selectedYear,
        score: candidate.totalScore,
      }).unwrap();
      toast.success(`${candidate.employee.name} is now Employee of the Month!`);
    } catch (err) {
      console.error('Failed to set winner:', err);
      toast.error('Failed to set winner.');
    }
  };

  const handleExport = () => {
    if (filteredCandidates.length === 0) {
      toast.error("No data to export.");
      return;
    }
    const csvContent = [
      "Rank,Company,Employee Name,Employee ID,Average Completion (%),Total Tasks",
      ...filteredCandidates.map((c, index) => 
        [
          index + 1,
          `"${c.employee.company}"`,
          `"${c.employee.name}"`,
          c.employee.employeeId,
          c.totalScore.toFixed(2),
          c.totalTasks,
        ].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Employee_of_the_Month_${months.find(m => m.value === selectedMonth)?.label}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const CandidateCard = ({ candidate }) => {
    const hoursEarly = candidate.averageEarliness > 0 ? (candidate.averageEarliness / (1000 * 60 * 60)).toFixed(1) : 0;
    const isOfficialWinner = officialWinnerIds.has(candidate.employee._id);
    const isCompanyWinnerSet = !!officialWinnersByCompany[candidate.employee.company];

    return ( // Changed card background and border
      <div className={`bg-white dark:bg-slate-800 rounded-2xl shadow-lg border p-6 flex flex-col transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${isOfficialWinner ? 'border-amber-400' : 'border-slate-200 dark:border-slate-700'}`}>
        <div className="flex flex-col sm:flex-row items-center gap-5 mb-5">
          <div className="relative flex-shrink-0 self-start">
            <img
              src={candidate.employee.profilePicture || `https://ui-avatars.com/api/?name=${candidate.employee.name}&background=random`}
              alt={candidate.employee.name}
              onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${candidate.employee.name}&background=random`; }}
              className={`h-24 w-24 rounded-full object-cover border-4 ${isOfficialWinner ? 'border-amber-400' : 'border-blue-200'}`}
            />
            {isOfficialWinner && (
              <div className="absolute -top-2 -left-2 bg-amber-500 text-white p-2 rounded-full shadow-md">
                <TrophyIcon className="h-5 w-5" />
              </div>
            )}
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-800">{candidate.employee.name}</h3>
            <p className="text-md font-semibold text-blue-600">{candidate.employee.company}</p>
            <p className="text-sm text-slate-500">{candidate.employee.employeeId}</p>
            <div className="flex items-center gap-4 mt-1">
              <p className="text-sm text-slate-600">Avg. Completion: <span className="font-bold text-amber-600 text-lg">{candidate.totalScore.toFixed(2)}%</span></p>
              <p className="text-sm text-slate-600">Avg. Earliness: <span className="font-bold text-green-600 text-lg">{hoursEarly} hours</span></p>
            </div>
          </div>
        </div>
        <blockquote className="text-sm text-slate-600 mb-5 flex-1 border-l-4 border-slate-200 pl-4 italic">
          {candidate.reason}
        </blockquote>
        <div className="mt-auto pt-4 border-t border-slate-100">
          {isOfficialWinner ? (
            <div className="flex items-center justify-center gap-2 text-amber-600 font-bold py-2 px-4 rounded-lg bg-amber-100">
              <CheckBadgeIcon className="h-5 w-5" /> Official Winner
            </div>
          ) : (
            <button
              onClick={() => handleSetWinner(candidate)}
              disabled={isSettingWinner || isCompanyWinnerSet}
              className="w-full inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-sm disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              {isSettingWinner ? <ArrowPathIcon className="animate-spin h-5 w-5 mr-2" /> : <TrophyIcon className="h-5 w-5 mr-2" />}
              {isCompanyWinnerSet ? `Winner Already Selected for ${candidate.employee.company}` : 'Make Winner'}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-slate-50 dark:bg-slate-900">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Employee of the Month</h1>
          <p className="text-slate-500 mt-2">Identify top performers based on task completion grades.</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
            className="text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="All">All Companies</option>
            <option value="Star Publicity">Star Publicity</option>
            <option value="Volga Infosys">Volga Infosys</option>
          </select>
          <div className="flex gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500"
            >
              {months.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500"
            >
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <button onClick={handleExport} className="p-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-sm" title="Export as CSV">
            <ArrowDownTrayIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {(isLoading || isFetching) ? (
        <div className="text-center py-16 text-slate-500">Loading candidates...</div>
      ) : (
        <>
          {filteredCandidates.length > 0 ? ( 
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {filteredCandidates.map((candidate) => (
                <CandidateCard key={candidate.employee._id} candidate={candidate} />
              ))}
            </div>
          ) : ( // Changed no candidates background
            <div className="text-center py-16 text-slate-500 bg-white rounded-xl border border-dashed">
              <TrophyIcon className="h-16 w-16 mx-auto text-slate-400 mb-4" />
              <p className="font-semibold text-lg">No Employee of the Month candidates found for {months.find(m => m.value === selectedMonth)?.label} {selectedYear}.</p>
              <p className="text-sm mt-2">Ensure tasks were completed and approved during this period.</p>
            </div>
          )}
          <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-6 mt-8">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">How Grades Are Calculated</h3>
            <p className="text-sm text-slate-600">
              The "Employee of the Month" is determined by calculating the average completion percentage of all tasks assigned to an employee within the selected month. The employee with the highest average percentage is ranked as the top performer.
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default EmployeeOfTheMonth;