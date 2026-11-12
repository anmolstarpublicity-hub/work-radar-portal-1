import React, { useState, useRef, useEffect } from 'react';
import { CalendarDaysIcon, ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline';

const PRESETS = [
  { id: 'week',   label: 'This Week' },
  { id: 'month',  label: 'This Month' },
  { id: 'custom', label: 'Custom Range' },
];

function DateRow({ label, value, onChange }) {
  const inputRef = useRef(null);

  const openPicker = (e) => {
    e.stopPropagation();
    try { inputRef.current?.showPicker(); } catch { inputRef.current?.click(); }
  };

  return (
    <div className="flex items-center gap-2 bg-slate-50 border border-purple-100 rounded-xl px-3 py-2.5 hover:border-purple-300 transition-colors">
      <span className="text-[10px] font-bold text-slate-400 uppercase w-9 flex-shrink-0">{label}</span>
      <span className="text-sm font-semibold text-slate-700 flex-1 select-none">
        {value
          ? new Date(value + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
          : 'Pick date'}
      </span>
      {/* Calendar icon opens the native date picker */}
      <button
        type="button"
        onClick={openPicker}
        className="flex-shrink-0 p-1 rounded-lg hover:bg-purple-100 transition-colors"
        title="Pick date"
      >
        <CalendarDaysIcon className="h-4 w-4 text-purple-400" />
      </button>
      {/* Hidden real input */}
      <input
        ref={inputRef}
        type="date"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="sr-only"
        tabIndex={-1}
      />
    </div>
  );
}

export default function DurationFilter({ filterType, setFilterType, dateRange, setDateRange, variant = 'light' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const activeLabel = PRESETS.find(p => p.id === filterType)?.label || 'This Week';

  const displayRange = (filterType === 'custom' && dateRange.startDate && dateRange.endDate)
    ? (() => {
        const fmt = d => new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
        return `${fmt(dateRange.startDate)} → ${fmt(dateRange.endDate)}`;
      })()
    : null;

  /* ── Trigger styles per variant ── */
  const triggerClass = variant === 'theme'
    ? 'flex items-center gap-2 text-sm font-bold text-white px-4 py-2.5 rounded-xl shadow-sm transition hover:opacity-90 cursor-pointer'
    : 'flex items-center gap-2 bg-white/10 hover:bg-white/20 transition-colors rounded-xl px-4 py-2.5 cursor-pointer';

  const triggerStyle = variant === 'theme'
    ? { background: 'linear-gradient(135deg,#48306A,#8E5FD0)' }
    : {};

  const iconClass   = variant === 'theme' ? 'h-4 w-4 text-white/80 flex-shrink-0' : 'h-4 w-4 text-purple-200 flex-shrink-0';
  const labelClass  = variant === 'theme' ? 'text-sm font-bold text-white whitespace-nowrap' : 'text-sm font-semibold text-white whitespace-nowrap';
  const chevronClass = variant === 'theme' ? 'h-4 w-4 text-white/80 flex-shrink-0' : 'h-4 w-4 text-purple-200 flex-shrink-0';

  return (
    <div ref={ref} className="relative">
      {/* Trigger pill */}
      <button
        onClick={() => setOpen(o => !o)}
        className={triggerClass}
        style={triggerStyle}
      >
        <CalendarDaysIcon className={iconClass} />
        <span className={labelClass}>
          {displayRange || activeLabel}
        </span>
        <ChevronDownIcon className={`${chevronClass} transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-purple-100 z-50"
          style={{ animation: 'dropIn 0.15s ease-out' }}
        >
          <style>{`@keyframes dropIn { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }`}</style>

          {/* Preset options */}
          <div className="p-2">
            {PRESETS.map(preset => (
              <button
                key={preset.id}
                onClick={() => {
                  setFilterType(preset.id);
                  if (preset.id !== 'custom') setOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  filterType === preset.id ? 'text-white' : 'text-slate-600 hover:bg-purple-50'
                }`}
                style={filterType === preset.id ? { background: 'linear-gradient(135deg,#48306A,#8E5FD0)' } : {}}
              >
                {preset.label}
                {filterType === preset.id && <CheckIcon className="h-4 w-4 flex-shrink-0" />}
              </button>
            ))}
          </div>

          {/* Custom date pickers */}
          {filterType === 'custom' && (
            <div className="px-3 pb-3 pt-1 border-t border-purple-50 space-y-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1 mb-1">Select Date Range</p>
              <DateRow
                label="From"
                value={dateRange.startDate}
                onChange={v => setDateRange(p => ({ ...p, startDate: v }))}
              />
              <DateRow
                label="To"
                value={dateRange.endDate}
                onChange={v => setDateRange(p => ({ ...p, endDate: v }))}
              />
              {dateRange.startDate && dateRange.endDate && (
                <button
                  onClick={() => setOpen(false)}
                  className="w-full py-2 text-sm font-bold text-white rounded-xl transition mt-1"
                  style={{ background: 'linear-gradient(135deg,#48306A,#8E5FD0)' }}
                >
                  Apply Range
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
