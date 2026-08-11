import React, { useState, useMemo, useEffect } from 'react';
import { useGetHallOfFameQuery } from '../services/EmployeApi';
import { TrophyIcon, StarIcon } from '@heroicons/react/24/solid';
import { BuildingLibraryIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

const monthNames = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

// ── Winner Card ─────────────────────────────────────────────────────────────

const WinnerCard = ({ winner, rank }) => {
  const ringColors = ['ring-amber-400', 'ring-slate-400', 'ring-orange-400'];
  const badgeColors = ['bg-amber-400', 'bg-slate-400', 'bg-orange-400'];
  const badgeShadow = [
    'shadow-[0_0_14px_4px_rgba(251,191,36,0.5)]',
    'shadow-[0_0_10px_2px_rgba(148,163,184,0.4)]',
    'shadow-[0_0_10px_2px_rgba(249,115,22,0.4)]',
  ];
  const ri = Math.min(rank, 2);

  return (
    <div className="bg-white rounded-2xl border border-purple-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 overflow-hidden flex flex-col items-center p-6 relative">
      {/* Rank badge */}
      <div className={`absolute top-3 right-3 h-7 w-7 rounded-full flex items-center justify-center text-xs font-extrabold text-white ${badgeColors[ri]} ${badgeShadow[ri]}`}>
        {rank + 1}
      </div>

      {/* Avatar */}
      <div className={`relative rounded-full ring-4 ${ringColors[ri]} ${badgeShadow[ri]} mb-4`}>
        <img
          src={winner.employee?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(winner.employee?.name || 'User')}&background=8E5FD0&color=fff`}
          alt={winner.employee?.name}
          onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(winner.employee?.name || 'User')}&background=8E5FD0&color=fff`; }}
          className="h-20 w-20 rounded-full object-cover"
        />
        {/* Trophy icon overlay for #1 */}
        {rank === 0 && (
          <div className="absolute -bottom-2 -right-2 h-7 w-7 rounded-full bg-amber-400 flex items-center justify-center shadow-md">
            <TrophyIcon className="h-4 w-4 text-white" />
          </div>
        )}
      </div>

      <h4 className="font-extrabold text-slate-800 text-base text-center">{winner.employee?.name}</h4>
      <p className="text-xs font-bold text-purple-500 mt-0.5">{winner.employee?.role || winner.employee?.company}</p>
      <p className="text-[11px] text-slate-400 font-mono mt-0.5">{winner.employee?.employeeId}</p>

      {/* Score */}
      {winner.score != null && (
        <div className="mt-3 flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
          <StarIcon className="h-3.5 w-3.5 text-amber-400" />
          <span className="text-xs font-extrabold text-amber-700">{winner.score} pts</span>
        </div>
      )}
    </div>
  );
};

// ── Month Section ───────────────────────────────────────────────────────────

const MonthSection = ({ month, year, winners }) => (
  <div className="bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden">
    {/* Month header */}
    <div className="flex items-center gap-3 px-6 py-4 border-b border-purple-100"
      style={{ background: 'linear-gradient(135deg,#48306A,#8E5FD0)' }}>
      <TrophyIcon className="h-5 w-5 text-amber-300 flex-shrink-0" />
      <h3 className="text-base font-extrabold text-white">
        {monthNames[month - 1]} <span className="text-white/70">{year}</span>
      </h3>
      <span className="ml-auto text-xs font-bold text-white/60 bg-white/10 px-2.5 py-0.5 rounded-full">
        {winners.length} winner{winners.length !== 1 ? 's' : ''}
      </span>
    </div>

    <div className="p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {winners.map((winner, i) => (
          <WinnerCard key={winner._id} winner={winner} rank={i} />
        ))}
      </div>
    </div>
  </div>
);

// ── Main Component ──────────────────────────────────────────────────────────

const HallOfFame = () => {
  const { data: hallOfFameData = {}, isLoading } = useGetHallOfFameQuery();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  const availableYears = useMemo(() =>
    Object.keys(hallOfFameData).sort((a, b) => b - a),
  [hallOfFameData]);

  useEffect(() => {
    if (availableYears.length > 0 && !availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[0]);
    }
  }, [availableYears, selectedYear]);

  const monthsForYear = useMemo(() => {
    if (!hallOfFameData[selectedYear]) return [];
    return Object.keys(hallOfFameData[selectedYear]).sort((a, b) => b - a);
  }, [hallOfFameData, selectedYear]);

  if (isLoading) {
    return (
      <div className="min-h-full flex items-center justify-center" style={{ backgroundColor: '#DFCDFE' }}>
        <p className="text-slate-500 font-medium">Loading Hall of Fame...</p>
      </div>
    );
  }

  return (
    <div className="min-h-full p-6 lg:p-8" style={{ backgroundColor: '#DFCDFE' }}>

      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl" style={{ background: 'linear-gradient(135deg,#48306A,#8E5FD0)' }}>
              <BuildingLibraryIcon className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Hall of Fame</h2>
          </div>
          <div className="h-1 w-12 rounded-full mt-1 mb-2 ml-14" style={{ background: 'linear-gradient(90deg,#48306A,#8E5FD0)' }} />
          <p className="text-slate-500 text-sm ml-14">A Legacy Of Excellence — Past Employee Of The Month Winners</p>
        </div>

        {/* Year selector */}
        {availableYears.length > 0 && (
          <div className="relative">
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
              className="appearance-none text-sm font-bold border border-purple-200 rounded-xl pl-4 pr-9 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-purple-300 shadow-sm text-slate-700"
            >
              {availableYears.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <ChevronDownIcon className="h-4 w-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        )}
      </div>

      {/* ── Content ──────────────────────────────────────────────── */}
      {monthsForYear.length > 0 ? (
        <div className="space-y-6 pb-8">
          {monthsForYear.map(month => (
            <MonthSection
              key={`${selectedYear}-${month}`}
              month={parseInt(month)}
              year={selectedYear}
              winners={hallOfFameData[selectedYear][month]}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-purple-100 p-16 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <TrophyIcon className="h-14 w-14 text-amber-300" style={{ filter: 'drop-shadow(0 0 10px rgba(251,191,36,0.5))' }} />
          </div>
          <h3 className="text-lg font-bold text-slate-700">No Winners Yet</h3>
          <p className="text-sm text-slate-400 mt-1">There are no Employee of the Month records for {selectedYear}.</p>
        </div>
      )}
    </div>
  );
};

export default HallOfFame;
