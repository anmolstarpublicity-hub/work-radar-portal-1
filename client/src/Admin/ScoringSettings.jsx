import React, { useState, useEffect } from 'react';
import { useGetScoringSettingsQuery, useUpdateScoringSettingsMutation } from '../services/EmployeApi';
import toast from 'react-hot-toast';
import { ArrowPathIcon, Cog6ToothIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const ScoringSettings = () => {
  const { data: settings, isLoading, isError } = useGetScoringSettingsQuery();
  const [updateSettings, { isLoading: isUpdating }] = useUpdateScoringSettingsMutation();

  const [formState, setFormState] = useState({
    completedPoints: 0,
    moderatePoints: 0,
    lowPoints: 0,
    pendingPoints: 0,
  });

  useEffect(() => {
    if (settings) {
      setFormState({
        completedPoints: settings.completedPoints,
        moderatePoints: settings.moderatePoints,
        lowPoints: settings.lowPoints,
        pendingPoints: settings.pendingPoints,
      });
    }
  }, [settings]);

  const handleChange = (e) => {
    setFormState({
      ...formState,
      [e.target.name]: Number(e.target.value),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateSettings(formState).unwrap();
      toast.success('Scoring settings updated successfully!');
    } catch (err) {
      toast.error(err.data?.message || 'Failed to update settings.');
    }
  };

  const InputField = ({ label, name, value }) => (
    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
      <label htmlFor={name} className="block text-sm font-medium text-slate-600">{label}</label>
      <input
        type="number"
        id={name}
        name={name}
        value={value}
        onChange={handleChange}
        min="0"
        className="mt-1 w-full text-lg font-bold border-slate-300 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
  );

  if (isLoading) return <div className="p-8 text-center">Loading settings...</div>;
  if (isError) return <div className="p-8 text-center text-red-500">Failed to load settings.</div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Scoring Settings</h1>
        <p className="text-slate-500 mt-2">Configure the points awarded for each task grade to calculate the "Employee of the Month".</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg p-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <InputField label="'Completed' Grade Points" name="completedPoints" value={formState.completedPoints} /> {/* InputField needs dark mode styles */}
          <InputField label="'Moderate' Grade Points" name="moderatePoints" value={formState.moderatePoints} /> {/* InputField needs dark mode styles */}
          <InputField label="'Low' Grade Points" name="lowPoints" value={formState.lowPoints} /> {/* InputField needs dark mode styles */}
          <InputField label="'Pending' Grade Points" name="pendingPoints" value={formState.pendingPoints} /> {/* InputField needs dark mode styles */}
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="submit"
            disabled={isUpdating}
            className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-lg text-sm disabled:bg-blue-400 transition-colors shadow-lg shadow-blue-500/30"
          >
            {isUpdating ? (
              <ArrowPathIcon className="animate-spin h-5 w-5 mr-2" />
            ) : (
              <CheckCircleIcon className="h-5 w-5 mr-2" />
            )}
            {isUpdating ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ScoringSettings;