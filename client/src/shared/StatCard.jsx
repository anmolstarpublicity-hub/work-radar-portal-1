import React, { memo } from 'react';
import { ArrowTrendingUpIcon } from '@heroicons/react/24/solid';

const StatCard = memo(({ title, value, trend, isWarning, isSuccess, isInfo, isDanger, subtext, icon: Icon }) => {
  const getBadgeColors = () => {
    if (isWarning) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400';
    if (isSuccess) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400';
    if (isInfo) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400';
    if (isDanger) return 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400';
    return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400';
  };

  const getIconColor = () => {
    if (isWarning) return 'text-orange-500 bg-orange-50 dark:bg-orange-900/20';
    if (isSuccess) return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20';
    if (isInfo) return 'text-blue-500 bg-blue-50 dark:bg-blue-900/20';
    if (isDanger) return 'text-rose-500 bg-rose-50 dark:bg-rose-900/20';
    return 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20';
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 flex flex-col justify-between shadow-sm transition-all hover:shadow-md">
      <div className="flex justify-between items-start">
        <p className="text-[13px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{title}</p>
        {Icon && <div className={`p-2 rounded-xl ${getIconColor()}`}><Icon className="h-5 w-5" /></div>}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <p className={`text-3xl font-extrabold ${isWarning ? 'text-orange-500' : isDanger ? 'text-rose-600' : 'text-slate-800 dark:text-white'}`}>{value}</p>
      </div>
      <div className="mt-3">
        {(isWarning || isSuccess || isInfo || isDanger) ? (
           <span className={`inline-flex items-center px-2 py-1 rounded-md text-[11px] font-bold ${getBadgeColors()}`}>
             {subtext}
           </span>
        ) : trend ? (
           <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400">
             <ArrowTrendingUpIcon className="h-3 w-3" />
             {trend}
           </span>
        ) : subtext ? (
           <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{subtext}</span>
        ) : <span className="text-xs font-semibold text-slate-400">Up to date</span>}
      </div>
    </div>
  );
});

StatCard.displayName = 'StatCard';
export default StatCard;