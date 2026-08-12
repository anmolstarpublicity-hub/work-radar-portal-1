import React, { useState, useMemo } from 'react';
import { useGetEmployeeOfTheMonthCandidatesQuery, useSetEmployeeOfTheMonthMutation, useGetOfficialEOMQuery } from '../services/EmployeApi.js';
import { TrophyIcon, StarIcon, CheckBadgeIcon } from '@heroicons/react/24/solid';
import { ArrowDownTrayIcon, ArrowPathIcon, ChevronDownIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const monthNames = [
  { value: 1,  label: 'January'   }, { value: 2,  label: 'February'  }, { value: 3,  label: 'March'     },
  { value: 4,  label: 'April'     }, { value: 5,  label: 'May'       }, { value: 6,  label: 'June'      },
  { value: 7,  label: 'July'      }, { value: 8,  label: 'August'    }, { value: 9,  label: 'September' },
  { value: 10, label: 'October'   }, { value: 11, label: 'November'  }, { value: 12, label: 'December'  },
];

// ── Candidate Card ──────────────────────────────────────────────────────────

const CandidateCard = ({ candidate, rank, isOfficialWinner, isCompanyWinnerSet, onSetWinner, isSettingWinner }) => {
  const hoursEarly = candidate.averageEarliness > 0
    ? (candidate.averageEarliness / (1000 * 60 * 60)).toFixed(1) : 0;

  // Medal styling for top 3
  const medalRing   = rank === 0 ? 'ring-amber-400' : rank === 1 ? 'ring-slate-400' : rank === 2 ? 'ring-orange-400' : 'ring-purple-200';
  const medalGlow   = rank === 0
    ? 'shadow-[0_0_16px_4px_rgba(251,191,36,0.45)]'
    : rank === 1 ? 'shadow-[0_0_12px_2px_rgba(148,163,184,0.4)]'
    : rank === 2 ? 'shadow-[0_0_12px_2px_rgba(249,115,22,0.35)]'
    : '';
  const medalBadgeBg = rank === 0 ? 'bg-amber-400' : rank === 1 ? 'bg-slate-400' : rank === 2 ? 'bg-orange-400' : 'bg-purple-400';

  return (
    <div className={`bg-white rounded-2xl border shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 overflow-hidden flex flex-col ${
      isOfficialWinner ? 'border-amber-300' : 'border-purple-100'
    }`}>
      {/* Card top strip — gold for winner, purple for others */}
      <div className="h-2 w-full"
        style={{ background: isOfficialWinner
          ? 'linear-gradient(90deg,#f59e0b,#fbbf24)'
          : 'linear-gradient(90deg,#48306A,#8E5FD0)' }} />

      <div className="p-6 flex flex-col flex-1">
        {/* Rank + info row */}
        <div className="flex items-start gap-4 mb-5">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <img
              src={candidate.employee.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(candidate.employee.name)}&background=8E5FD0&color=fff`}
              alt={candidate.employee.name}
              onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(candidate.employee.name)}&background=8E5FD0&color=fff`; }}
              className={`h-20 w-20 rounded-full object-cover ring-4 ${medalRing} ${medalGlow}`}
            />
            {/* Rank badge */}
            <div className={`absolute -top-2 -right-2 h-7 w-7 rounded-full flex items-center justify-center text-xs font-extrabold text-white shadow-md ${medalBadgeBg}`}>
              {rank + 1}
            </div>
            {/* Trophy for official winner */}
            {isOfficialWinner && (
              <div className="absolute -bottom-2 -right-2 h-7 w-7 rounded-full bg-amber-400 flex items-center justify-center shadow-md"
                style={{ boxShadow: '0 0 8px 2px rgba(251,191,36,0.6)' }}>
                <TrophyIcon className="h-4 w-4 text-white" />
              </div>
            )}
          </div>

          {/* Name + company */}
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-extrabold text-slate-800 leading-tight truncate">{candidate.employee.name}</h3>
            <p className="text-xs font-bold text-purple-500 mt-0.5">{candidate.employee.company}</p>
            <p className="text-[11px] text-slate-400 font-mono">{candidate.employee.employeeId}</p>

            {/* Score pills */}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                <StarIcon className="h-3 w-3 text-amber-400" />
                {candidate.totalScore.toFixed(1)}% avg
              </span>
              {hoursEarly > 0 && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  +{hoursEarly}h early
                </span>
              )}
              <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                {candidate.totalTasks} tasks
              </span>
            </div>
          </div>
        </div>

        {/* Reason */}
        {candidate.reason && (
          <blockquote className="text-xs text-slate-500 italic border-l-4 border-purple-200 pl-3 mb-5 line-clamp-3">
            {candidate.reason}
          </blockquote>
        )}

        {/* Action */}
        <div className="mt-auto pt-4 border-t border-purple-50">
          {isOfficialWinner ? (
            <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-amber-700 bg-amber-50 border border-amber-200 text-sm"
              style={{ boxShadow: '0 0 10px 2px rgba(251,191,36,0.2)' }}>
              <CheckBadgeIcon className="h-5 w-5 text-amber-500" />
              Official Winner
            </div>
          ) : (
            <button
              onClick={() => onSetWinner(candidate)}
              disabled={isSettingWinner || isCompanyWinnerSet}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#48306A,#8E5FD0)' }}
            >
              {isSettingWinner
                ? <ArrowPathIcon className="animate-spin h-4 w-4" />
                : <TrophyIcon className="h-4 w-4" />
              }
              {isCompanyWinnerSet
                ? `Winner Already Set for ${candidate.employee.company}`
                : 'Make Winner'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Purple select ───────────────────────────────────────────────────────────

const PurpleSelect = ({ value, onChange, children }) => (
  <div className="relative">
    <select
      value={value}
      onChange={onChange}
      className="appearance-none text-sm font-semibold border border-purple-200 rounded-xl pl-4 pr-8 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-purple-300 shadow-sm text-slate-700"
    >
      {children}
    </select>
    <ChevronDownIcon className="h-4 w-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
  </div>
);

// ── Main Component ──────────────────────────────────────────────────────────

const EmployeeOfTheMonth = () => {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear  = new Date().getFullYear();

  const [selectedMonth, setSelectedMonth]   = useState(currentMonth);
  const [selectedYear,  setSelectedYear]    = useState(currentYear);
  const [companyFilter, setCompanyFilter]   = useState('All');

  const { data: candidates = [], isLoading, isFetching } = useGetEmployeeOfTheMonthCandidatesQuery(
    { month: selectedMonth, year: selectedYear }, { refetchOnMountOrArgChange: true }
  );
  const { data: officialWinners = [] } = useGetOfficialEOMQuery(
    { month: selectedMonth, year: selectedYear }, { refetchOnMountOrArgChange: true }
  );
  const [setWinner, { isLoading: isSettingWinner }] = useSetEmployeeOfTheMonthMutation();

  const years = useMemo(() => {
    const y = [];
    for (let i = currentYear; i >= currentYear - 5; i--) y.push(i);
    return y;
  }, [currentYear]);

  const allCandidates       = useMemo(() => Array.isArray(candidates) ? candidates : [], [candidates]);
  const officialWinnerIds   = useMemo(() => new Set(officialWinners.map(w => w.employee._id)), [officialWinners]);
  const officialByCompany   = useMemo(() => officialWinners.reduce((a, w) => { a[w.company] = w.employee; return a; }, {}), [officialWinners]);

  const filteredCandidates  = useMemo(() =>
    companyFilter === 'All' ? allCandidates : allCandidates.filter(c => c.employee.company === companyFilter),
  [allCandidates, companyFilter]);

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
    } catch { toast.error('Failed to set winner.'); }
  };

  const handleExport = () => {
    if (!filteredCandidates.length) { toast.error('No data to export.'); return; }
    const csv = [
      'Rank,Company,Employee Name,Employee ID,Avg Completion (%),Total Tasks',
      ...filteredCandidates.map((c, i) => [
        i + 1, `"${c.employee.company}"`, `"${c.employee.name}"`,
        c.employee.employeeId, c.totalScore.toFixed(2), c.totalTasks,
      ].join(',')),
    ].join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    link.download = `EOM_${monthNames.find(m => m.value === selectedMonth)?.label}_${selectedYear}.csv`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const monthLabel = monthNames.find(m => m.value === selectedMonth)?.label;

  if (isLoading) {
    return (
      <div className="min-h-full flex items-center justify-center" style={{ backgroundColor: '#DFCDFE' }}>
        <p className="text-slate-500 font-medium">Loading candidates...</p>
      </div>
    );
  }

  return (
    <div className="min-h-full p-6 lg:p-8" style={{ backgroundColor: '#DFCDFE' }}>

      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="mb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl" style={{ background: 'linear-gradient(135deg,#48306A,#8E5FD0)' }}>
            <TrophyIcon className="h-6 w-6 text-amber-300" style={{ filter: 'drop-shadow(0 0 6px rgba(251,191,36,0.8))' }} />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Employee of the Month</h2>
        </div>
        <div className="h-1 w-12 rounded-full mt-2 mb-2 ml-14" style={{ background: 'linear-gradient(90deg,#48306A,#8E5FD0)' }} />
        <p className="text-slate-500 text-sm ml-14">Identify Top Performers Based On Task Completion Grades</p>
      </div>

      {/* ── Toolbar ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 my-6">
        <PurpleSelect value={companyFilter} onChange={e => setCompanyFilter(e.target.value)}>
          <option value="All">All Companies</option>
          <option value="Star Publicity">Star Publicity</option>
          <option value="Volga Infosys">Volga Infosys</option>
        </PurpleSelect>
        <PurpleSelect value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))}>
          {monthNames.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </PurpleSelect>
        <PurpleSelect value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))}>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </PurpleSelect>
        <button onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white rounded-xl shadow-sm transition hover:opacity-90"
          style={{ background: 'linear-gradient(135deg,#48306A,#8E5FD0)' }}
          title="Export as CSV">
          <ArrowDownTrayIcon className="h-4 w-4" /> Export CSV
        </button>
      </div>

      {/* ── Current period label ──────────────────────────────────── */}
      {officialWinners.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-6">
          {officialWinners.map(w => (
            <div key={w._id}
              className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5"
              style={{ boxShadow: '0 0 12px 2px rgba(251,191,36,0.3)' }}>
              <TrophyIcon className="h-5 w-5 text-amber-400" style={{ filter: 'drop-shadow(0 0 4px rgba(251,191,36,0.7))' }} />
              <div>
                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">{w.company} · {monthLabel} {selectedYear}</p>
                <p className="text-sm font-extrabold text-slate-800">{w.employee.name}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Candidates ───────────────────────────────────────────── */}
      {isFetching ? (
        <div className="flex items-center justify-center py-16">
          <ArrowPathIcon className="animate-spin h-8 w-8 text-purple-400" />
        </div>
      ) : filteredCandidates.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
            {filteredCandidates.map((candidate, index) => (
              <CandidateCard
                key={candidate.employee._id}
                candidate={candidate}
                rank={index}
                isOfficialWinner={officialWinnerIds.has(candidate.employee._id)}
                isCompanyWinnerSet={!!officialByCompany[candidate.employee.company]}
                onSetWinner={handleSetWinner}
                isSettingWinner={isSettingWinner}
              />
            ))}
          </div>

          {/* How it's calculated info card */}
          <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-5 pb-6">
            <div className="flex items-center gap-2 mb-2">
              <InformationCircleIcon className="h-5 w-5 text-purple-500 flex-shrink-0" />
              <h3 className="text-sm font-bold text-slate-700">How Rankings Are Calculated</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Rankings are based on the average completion percentage of all tasks assigned within the selected month.
              The employee with the highest average is ranked #1. Only approved (graded) tasks count toward the score.
            </p>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-2xl border border-purple-100 p-16 text-center pb-8">
          <TrophyIcon className="h-16 w-16 mx-auto text-amber-300 mb-4"
            style={{ filter: 'drop-shadow(0 0 10px rgba(251,191,36,0.5))' }} />
          <h3 className="text-lg font-bold text-slate-700">No Candidates Found</h3>
          <p className="text-sm text-slate-400 mt-1">
            No completed tasks found for {monthLabel} {selectedYear}.
            Ensure tasks were approved during this period.
          </p>
        </div>
      )}
    </div>
  );
};

export default EmployeeOfTheMonth;
