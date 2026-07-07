import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForgotPasswordMutation } from '../services/EmployeApi'; // Changed import source
import toast from 'react-hot-toast';
import { ArrowPathIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address.');
      return;
    }

    const toastId = toast.loading('Sending reset link...');
    try {
      const result = await forgotPassword({ email }).unwrap();
      toast.success(result.message || 'If an account with that email exists, a reset link has been sent.', { id: toastId });
      setEmail(''); // Clear the email field
    } catch (err) {
      console.error('Forgot password error:', err);
      const errorMessage = err.data?.message || err.message || 'Failed to send reset email. Please try again.';
      toast.error(errorMessage, { id: toastId });
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-4 font-manrope">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Forgot Your Password?</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Enter your email address below and we'll send you a link to reset your password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Email Address
            </label>
            <div className="relative mt-1">
              <EnvelopeIcon className="h-5 w-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 transition-all duration-200"
                placeholder="you@example.com"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full inline-flex items-center justify-center py-2.5 px-4 rounded-lg shadow-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
          >
            {isLoading && <ArrowPathIcon className="animate-spin h-5 w-5 mr-2" />}
            Send Reset Link
          </button>
        </form>
        <div className="text-center text-sm">
          <Link to="/login" className="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-500">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;