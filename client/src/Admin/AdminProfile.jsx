import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { useUpdateEmployeeMutation, useForgotPasswordMutation } from '../services/EmployeApi';
import { setCredentials, selectCurrentToken } from '../app/authSlice';
import { ArrowPathIcon, CameraIcon, TrashIcon, LockClosedIcon, UserIcon, EnvelopeIcon, PhoneIcon, MapPinIcon, BuildingOfficeIcon, AcademicCapIcon, GlobeAltIcon } from '@heroicons/react/24/outline';

const InputField = ({ label, name, value, onChange, type = 'text', icon: Icon, placeholder }) => (
  <div>
    <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1.5">{label}</label>
    <div className="flex items-center gap-2 border border-purple-200 dark:border-purple-900/50 rounded-xl px-3 py-2.5 bg-white dark:bg-slate-800 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-200 dark:focus-within:ring-purple-900/40 transition">
      {Icon && (
        <span className="flex items-center justify-center h-7 w-7 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex-shrink-0">
          <Icon className="h-4 w-4 text-purple-500" />
        </span>
      )}
      {name === 'gender' ? (
        <select name={name} value={value} onChange={onChange}
          className="flex-1 bg-transparent text-sm text-slate-700 dark:text-slate-200 outline-none">
          <option value="">Select...</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>
      ) : (
        <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder || ''}
          className="flex-1 bg-transparent text-sm text-slate-700 dark:text-slate-200 outline-none placeholder:text-slate-300" />
      )}
    </div>
  </div>
);

const AdminProfile = ({ user = {} }) => {
  const dispatch = useDispatch();
  const token = useSelector(selectCurrentToken);
  const fileInputRef = useRef(null);
  const [updateProfile, { isLoading: isUpdating }] = useUpdateEmployeeMutation();
  const [forgotPassword, { isLoading: isSendingReset }] = useForgotPasswordMutation();
  const [previewUrl, setPreviewUrl] = useState(null);

  const [formData, setFormData] = useState({
    name: '', email: '', profilePicture: null,
    address: '', gender: '', country: '', city: '', qualification: '', phone: '',
  });

  useEffect(() => {
    setFormData({
      name: user.name || '', email: user.email || '', profilePicture: null,
      address: user.address || '', gender: user.gender || '', country: user.country || '',
      city: user.city || '', qualification: user.qualification || '', phone: user.phone || '',
    });
    setPreviewUrl(null);
  }, [user]);

  const handleChange = useCallback((e) => {
    if (e.target.type === 'file') {
      const file = e.target.files[0];
      if (file) {
        setFormData(prev => ({ ...prev, profilePicture: file }));
        setPreviewUrl(URL.createObjectURL(file));
      }
    } else {
      setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    }
  }, []);

  const handleDeletePhoto = () => {
    setPreviewUrl(null);
    setFormData(prev => ({ ...prev, profilePicture: null }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async () => {
    if (!formData.name?.trim()) { toast.error('Name is required.'); return; }
    if (!formData.email?.trim()) { toast.error('Email is required.'); return; }
    const data = new FormData();
    data.append('name', formData.name.trim());
    data.append('email', formData.email.trim());
    if (formData.profilePicture) data.append('profilePicture', formData.profilePicture);
    if (formData.address) data.append('address', formData.address.trim());
    if (formData.gender) data.append('gender', formData.gender);
    if (formData.country) data.append('country', formData.country.trim());
    if (formData.city) data.append('city', formData.city.trim());
    if (formData.qualification) data.append('qualification', formData.qualification.trim());
    if (formData.phone) data.append('phone', formData.phone.trim());
    try {
      const toastId = toast.loading('Updating profile...');
      const result = await updateProfile({ id: user._id, formData: data }).unwrap();
      toast.success('Profile updated!', { id: toastId });
      if (result.employee) dispatch(setCredentials({ user: result.employee, token: result.token || token }));
    } catch {
      toast.error('Failed to update profile.');
    }
  };

  const handleRequestPasswordReset = async () => {
    if (!user.email) { toast.error('No email on this account.'); return; }
    const toastId = toast.loading('Sending reset email...');
    try {
      const result = await forgotPassword({ email: user.email }).unwrap();
      toast.success(result.message || 'Reset email sent!', { id: toastId });
    } catch (err) {
      toast.error(err.data?.message || 'Failed to send reset email.', { id: toastId });
    }
  };

  const avatarSrc = previewUrl || user.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=8E5FD0&color=fff`;

  return (
    <div className="min-h-full dark:bg-slate-900" style={{ backgroundColor: '#DFCDFE' }}>
      {/* Hero Banner */}
      <div className="relative h-44 flex flex-col items-center justify-end pb-0"
        style={{ background: 'linear-gradient(135deg, #48306A, #8E5FD0)' }}>
        {/* Wave bottom */}
        <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 80" preserveAspectRatio="none" style={{ height: 60 }}>
          <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" fill="#DFCDFE" className="dark:fill-slate-900" />
        </svg>
        {/* Avatar */}
        <div className="relative z-10 mb-[-88px]">
          <div className="h-56 w-56 rounded-full border-4 border-dashed border-white/70 p-1 bg-white/10">
            <img src={avatarSrc}
              onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=8E5FD0&color=fff`; }}
              alt="Profile" className="h-full w-full rounded-full object-cover" />
          </div>
        </div>
      </div>

      {/* Name + role */}
      <div className="flex flex-col items-center pt-28 pb-4 dark:bg-slate-900" style={{ backgroundColor: '#DFCDFE' }}>
        <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">{user.name || 'Admin User'}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{user.role || 'Administrator'}</p>

        {/* Upload button */}
        <div className="flex items-center gap-3 mt-4">
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleChange} className="hidden" id="avatar-upload" />
          <label htmlFor="avatar-upload"
            className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold text-white cursor-pointer transition"
            style={{ background: 'linear-gradient(135deg, #48306A, #8E5FD0)' }}>
            <CameraIcon className="h-4 w-4" /> Upload
          </label>
        </div>
      </div>

      {/* Form Card */}
      <div className="px-4 pb-10 max-w-5xl mx-auto">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-purple-100 dark:border-slate-700 p-8">

          {/* Personal Information */}
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">Personal Information</h3>
            <p className="text-sm text-slate-400 mt-1">Manage Your Personal Information To Keep Your Account Accurate And Up To Date</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5 mb-8">
            <InputField label="Full Name"     name="name"          value={formData.name}          onChange={handleChange} icon={UserIcon} />
            <InputField label="E - Mail Address" name="email"      value={formData.email}         onChange={handleChange} icon={EnvelopeIcon} type="email" />
            <InputField label="Gender"        name="gender"        value={formData.gender}        onChange={handleChange} icon={UserIcon} />
            <InputField label="Qualification" name="qualification" value={formData.qualification} onChange={handleChange} icon={AcademicCapIcon} />
            <InputField label="Phone Number"  name="phone"         value={formData.phone}         onChange={handleChange} icon={PhoneIcon} type="tel" />
            <InputField label="Country"       name="country"       value={formData.country}       onChange={handleChange} icon={GlobeAltIcon} />
            <InputField label="City"          name="city"          value={formData.city}          onChange={handleChange} icon={BuildingOfficeIcon} />
            <InputField label="Address"       name="address"       value={formData.address}       onChange={handleChange} icon={MapPinIcon} />
          </div>

          {/* Divider */}
          <div className="border-t border-dashed border-slate-200 dark:border-slate-700 my-6" />

          {/* Security Setting */}
          <div className="text-center mb-5">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">Security Setting</h3>
            <p className="text-sm text-slate-400 mt-1">Protect Your Account With Secure Password Management</p>
          </div>
          <div className="flex justify-center mb-8">
            <button onClick={handleRequestPasswordReset} disabled={isSendingReset}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full border-2 border-purple-300 dark:border-purple-700 text-sm font-semibold text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition disabled:opacity-50">
              {isSendingReset ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <LockClosedIcon className="h-4 w-4" />}
              Request Password Change
            </button>
          </div>

          {/* Divider */}
          <div className="border-t border-dashed border-slate-200 dark:border-slate-700 mb-6" />

          {/* Actions */}
          <div className="flex justify-center gap-4">
            <button onClick={() => setFormData({ name: user.name || '', email: user.email || '', profilePicture: null, address: user.address || '', gender: user.gender || '', country: user.country || '', city: user.city || '', qualification: user.qualification || '', phone: user.phone || '' })}
              className="px-8 py-2.5 rounded-full border border-slate-300 dark:border-slate-600 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition">
              Cancel
            </button>
            <button onClick={handleSave} disabled={isUpdating}
              className="px-8 py-2.5 rounded-full text-sm font-semibold text-white transition disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #48306A, #8E5FD0)' }}>
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
