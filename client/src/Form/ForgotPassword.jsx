import React, { useState } from 'react';
import { useForgotPasswordMutation } from '../services/EmployeApi';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { ArrowPathIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import portalLogo from "../assets/portal_logo.png";

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address.');
      return;
    }
    try {
      const result = await forgotPassword({ email }).unwrap();
      toast.success(result.message || 'If an account with that email exists, a reset link has been sent.');
    } catch (err) {
      toast.error(err.data?.message || 'Failed to send reset email. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-lg">
        <div className="text-center">
          <img src={portalLogo} alt="Logo" className="h-20 w-20 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-slate-800">Forgot Password</h1>
          <p className="mt-2 text-sm text-slate-500">Enter your email address and we'll send you a link to reset your password.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="text-sm font-semibold text-slate-700">Email Address</label>
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
                className="pl-10 pr-4 py-2.5 w-full border border-slate-300 rounded-lg"
                placeholder="you@example.com"
              />
            </div>
          </div>
          <button type="submit" disabled={isLoading} className="w-full inline-flex items-center justify-center py-2.5 px-4 rounded-lg shadow-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400">
            {isLoading && <ArrowPathIcon className="animate-spin h-5 w-5 mr-2" />}
            Send Reset Link
          </button>
        </form>
        <div className="text-center">
          <Link to="/login" className="text-sm font-medium text-blue-600 hover:text-blue-800">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;