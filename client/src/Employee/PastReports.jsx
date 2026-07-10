import React from 'react';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

const PastReportsList = ({ reports, onSelectReport, activeReportId }) => {
  const renderContent = () => {
    if (!reports) {
      return (
        <div className="p-4 text-sm text-red-500 flex items-center gap-2">
          <ExclamationCircleIcon className="h-5 w-5" /> Could not load reports.
        </div>
      );
    }

    return (
      <>
        {/* Past Reports */}
        {reports.map(report => (
          <button
            key={report._id}
            onClick={() => onSelectReport(report)}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors duration-200 ${
              activeReportId === report._id
                ? 'bg-blue-50 border border-blue-400'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-col flex-1 min-w-0">
                <p className={`font-semibold ${activeReportId === report._id ? 'text-blue-700' : 'text-gray-700'} truncate`}>
                  {new Date(report.reportDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {/* Example: show summary, achievements, etc. */}
                  {typeof report.summary === 'string' ? report.summary : ''}
                </p>
              </div>
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                report.status === 'Submitted' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {report.status}
              </span>
            </div>
          </button>
        ))}
      </>
    );
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700">
      <div className="p-4 border-b border-gray-200 flex-shrink-0 flex items-center justify-between">
        <h3 className="font-bold text-lg text-blue-700">Report History</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {renderContent()}
          </div>
    </div>
  );
};

export default PastReportsList;