import React, { memo } from 'react';
import { ArrowTrendingUpIcon } from '@heroicons/react/24/solid';

const StatCard = memo(({ title, value, trend, isWarning, isSuccess, isInfo, isDanger, subtext, icon: Icon }) => {
  const getBadgeColors = () => {
    if (isWarning) return 'bg-orange-100 text-orange-700';
    if (isSuccess) return 'bg-emerald-100 text-emerald-700';
    if (isInfo) return 'bg-blue-100 text-blue-700';
    if (isDanger) return 'bg-rose-100 text-rose-700';
    return 'bg-blue-50 text-blue-700';
  };

  const getIconColor = () => {
    if (isWarning) return 'bg-orange-50 text-orange-500';
    if (isSuccess) return 'bg-emerald-50 text-emerald-500';
    if (isInfo) return 'bg-blue-50 text-blue-600';
    if (isDanger) return 'bg-rose-50 text-rose-500';
    return 'bg-blue-50 text-blue-600';
  };

  return (
    <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:bg-slate-800 dark:border-slate-700">
      <div className="flex items-start justify-between">
        <p className="text-[13px] font-bold uppercase tracking-[0.2em] text-slate-500">{title}</p>
        {Icon && <div className={`rounded-xl p-2 ${getIconColor()}`}><Icon className="h-5 w-5" /></div>}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <p className={`text-3xl font-extrabold ${isWarning ? 'text-orange-500' : isDanger ? 'text-rose-600' : 'text-slate-800'}`}>{value}</p>
      </div>
      <div className="mt-3">
        {(isWarning || isSuccess || isInfo || isDanger) ? (
          <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-[11px] font-bold ${getBadgeColors()}`}>
            {subtext}
          </span>
        ) : trend ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600">
            <ArrowTrendingUpIcon className="h-3 w-3" />
            {trend}
          </span>
        ) : subtext ? (
          <span className="text-xs font-semibold text-slate-500">{subtext}</span>
        ) : <span className="text-xs font-semibold text-slate-400">Up to date</span>}
      </div>
    </div>
  );
});

StatCard.displayName = 'StatCard';
export default StatCard;