import React, { useEffect } from 'react';
import { SunIcon, MoonIcon } from '@heroicons/react/24/solid';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from './app/authSlice';
import { useUpdateEmployeeMutation } from './services/EmployeApi';
import toast from 'react-hot-toast';

const ThemeToggle = () => {
  const user = useSelector(selectCurrentUser);
  const [updateEmployee, { isLoading }] = useUpdateEmployeeMutation();
  // Default to 'light' if user or preference is not available
  const currentTheme = user?.themePreference || 'light';

  useEffect(() => {
    // This effect synchronizes the DOM with the theme from the user's profile
    if (currentTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [currentTheme]);

  const toggleTheme = async () => {
    if (isLoading || !user) return; // Prevent action if updating or no user
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    try {
      // Use FormData to be consistent with other profile updates
      const formData = new FormData();
      formData.append('themePreference', newTheme);
      // The `updateEmployee` mutation will invalidate the 'Employee' tag,
      // causing `useGetMeQuery` to refetch, which updates the user in Redux store.
      // This change in the Redux store will then trigger the useEffect above.
      await updateEmployee({ id: user._id, formData }).unwrap();
    } catch (err) {
      toast.error('Failed to switch theme.');
      console.error('Theme toggle failed:', err);
    }
  };

  return (
    <button
      onClick={toggleTheme}
      disabled={isLoading || !user}
      className="p-2 rounded-full text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 dark:text-slate-400 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
      title={`Switch to ${currentTheme === 'light' ? 'dark' : 'light'} mode`}
    >
      {currentTheme === 'light' ? <MoonIcon className="h-6 w-6" /> : <SunIcon className="h-6 w-6" />}
    </button>
  );
};

export default ThemeToggle;