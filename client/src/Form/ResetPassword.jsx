import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useResetPasswordMutation } from '../services/EmployeApi'; // Changed import source
import toast from 'react-hot-toast';
import { ArrowPathIcon, LockClosedIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetPassword, { isLoading, isSuccess }] = useResetPasswordMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    try {
      await resetPassword({ token, password }).unwrap();
      toast.success("Password reset successfully! You can now log in.");
      navigate('/login');
    } catch (err) {
      toast.error(err.data?.message || "Failed to reset password. The link may be invalid or expired.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-800">Reset Your Password</h1>
          <p className="mt-2 text-sm text-slate-500">Enter your new password below.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-sm font-semibold text-slate-700">New Password</label>
            <div className="relative mt-1">
              <LockClosedIcon className="h-5 w-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 py-2.5 w-full border border-slate-300 rounded-lg"
                placeholder="••••••••"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600">
                {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700">Confirm New Password</label>
            <div className="relative mt-1">
              <LockClosedIcon className="h-5 w-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10 pr-4 py-2.5 w-full border border-slate-300 rounded-lg"
                placeholder="••••••••"
              />
            </div>
          </div>
          <button type="submit" disabled={isLoading} className="w-full inline-flex items-center justify-center py-2.5 px-4 rounded-lg shadow-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400">
            {isLoading && <ArrowPathIcon className="animate-spin h-5 w-5 mr-2" />}
            Reset Password
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;