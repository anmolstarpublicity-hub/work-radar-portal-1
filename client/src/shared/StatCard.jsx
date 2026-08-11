import React, { memo } from 'react';

const StatCard = memo(({ title, value, icon: Icon }) => (
  <div className="flex flex-col items-start gap-3 rounded-2xl border border-purple-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm hover:shadow-md transition-all">
    <div className="flex items-center gap-3">
      {Icon && (
        <div className="rounded-xl p-2.5 bg-purple-50 dark:bg-purple-900/30">
          <Icon className="h-5 w-5 text-purple-500" />
        </div>
      )}
      <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{title}</p>
    </div>
    <p className="text-4xl font-extrabold text-slate-800 dark:text-white pl-1">{value}</p>
  </div>
));

StatCard.displayName = 'StatCard';
export default StatCard;
