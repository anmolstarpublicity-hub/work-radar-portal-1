import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { useUpdateEmployeeMutation } from '../services/EmployeApi';
import { setCredentials, useForgotPasswordMutation } from '../app/authSlice';
import { CheckCircleIcon, KeyIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

const InfoField = ({ label, value }) => (
  <div>
    <p className="text-sm text-gray-500">{label}</p>
    <p className="text-md font-semibold text-gray-800">{value || 'N/A'}</p>
  </div>
);
  
const EditField = ({ label, name, value, onChange, type = 'text' }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-gray-700">{label}</label>
    <input
      type={type}
      name={name}
      id={name}
      value={value}
      onChange={onChange}
      className="mt-1 w-full text-sm border border-gray-300 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500"
    />
  </div>
);

const AdminProfile = ({ user }) => {
  const dispatch = useDispatch();
  const [isEditMode, setIsEditMode] = useState(false);
  const [updateProfile, { isLoading: isUpdating }] = useUpdateEmployeeMutation();
  const [forgotPassword, { isLoading: isSendingReset }] = useForgotPasswordMutation();
  const token = useSelector(state => state.auth.token);

  // Initialize state directly from the user prop.
  // This runs only on the initial render of this component instance.
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    profilePicture: null,
    address: user.address || '',
    gender: user.gender || '',
    country: user.country || '',
    city: user.city || '',
    qualification: user.qualification || '',
  });

  // This effect ensures that if the user prop changes (e.g., after a Redux store update),
  // the form data is reset to reflect the new user data.
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        profilePicture: null,
        ...Object.fromEntries(['address', 'gender', 'country', 'city', 'qualification'].map(key => [key, user[key] || ''])),
      });
    }
  }, [user]);

  const handleChange = (e) => {
    if (e.target.type === 'file') {
      setFormData({ ...formData, profilePicture: e.target.files[0] });
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const handleSave = async () => {
    // Validate required fields
    if (!formData.name || !formData.name.trim()) {
      toast.error('Name is required.');
      return;
    }
    if (!formData.email || !formData.email.trim()) {
      toast.error('Email is required.');
      return;
    }

    const profileData = new FormData();
    profileData.append('name', formData.name.trim());
    profileData.append('email', formData.email.trim());
    
    if (formData.profilePicture) {
      profileData.append('profilePicture', formData.profilePicture);
    }
    
    // Only append optional fields if they have values
    if (formData.address) profileData.append('address', formData.address.trim());
    if (formData.gender) profileData.append('gender', formData.gender);
    if (formData.country) profileData.append('country', formData.country.trim());
    if (formData.city) profileData.append('city', formData.city.trim());
    if (formData.qualification) profileData.append('qualification', formData.qualification.trim());

    try {
      const toastId = toast.loading('Updating profile...');
      const updatedData = await updateProfile({ id: user._id, formData: profileData }).unwrap();
      toast.success('Profile updated successfully!', { id: toastId, icon: <CheckCircleIcon className="h-6 w-6 text-green-500" /> });
      if (updatedData.employee) {
        dispatch(setCredentials({ user: updatedData.employee, token: token }));
      }
      setIsEditMode(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
      const errorMessage = err.data?.message || err.message || 'Failed to update profile. Please try again.';
      toast.error(errorMessage);
    }
  };

  const handleRequestPasswordReset = async () => {
    if (!user.email) {
      toast.error('Email is not available for this account.');
      return;
    }
    
    const toastId = toast.loading('Sending password reset email...');
    try {
      const result = await forgotPassword({ email: user.email }).unwrap();
      toast.success(result.message || 'Password reset email sent successfully!', { id: toastId });
    } catch (err) {
      console.error('Forgot password error:', err);
      const errorMessage = err.data?.message || err.message || 'Failed to send reset email. Please try again.';
      toast.error(errorMessage, { id: toastId });
    }
  };

  return (
    <div className="p-8">
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl border border-gray-200 shadow-xl p-8">
        <div className="flex justify-between items-start mb-8 pb-8 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-8">
            <img
              src={user.profilePicture || `https://ui-avatars.com/api/?name=${user.name}&background=random`}
              alt="Profile"
              onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${user.name}&background=random`; }}
              className="h-32 w-32 rounded-full object-cover border-4 border-blue-200 shadow-lg"
            />
            <div>
              <h2 className="text-3xl font-bold text-blue-800">{user.name}</h2>
              <p className="text-gray-600">{user.role}</p>
              <p className="text-sm text-gray-500 font-mono mt-1">{user.employeeId}</p>
            </div>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <button onClick={() => setIsEditMode(!isEditMode)} className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors w-full sm:w-auto">
              {isEditMode ? 'Cancel' : 'Edit Profile'}
            </button>
            <button onClick={handleRequestPasswordReset} disabled={isSendingReset} className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors w-full sm:w-auto inline-flex items-center justify-center gap-2 disabled:bg-red-300">
              {isSendingReset ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <KeyIcon className="h-4 w-4" />} Request to Change Password
            </button>
          </div>
        </div>

        {isEditMode ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <EditField label="Full Name" name="name" value={formData.name} onChange={handleChange} />
              <EditField label="Email" name="email" value={formData.email} onChange={handleChange} type="email" />
              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700">Gender</label>
                <select name="gender" id="gender" value={formData.gender} onChange={handleChange} className="mt-1 w-full text-sm border border-gray-300 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="">Select...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <EditField label="Address" name="address" value={formData.address} onChange={handleChange} />
              <EditField label="City" name="city" value={formData.city} onChange={handleChange} />
              <EditField label="Country" name="country" value={formData.country} onChange={handleChange} />
              <EditField label="Qualification" name="qualification" value={formData.qualification} onChange={handleChange} />
              <div>
                <label htmlFor="profilePicture" className="block text-sm font-medium text-gray-700">Profile Picture</label>
                <input type="file" name="profilePicture" id="profilePicture" onChange={handleChange} className="mt-1 w-full text-sm border border-gray-300 rounded-lg p-2" />
              </div>
            </div>
            <div className="flex justify-end">
              <button onClick={handleSave} disabled={isUpdating} className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400">
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <InfoField label="Email" value={user.email} />
            <InfoField label="Gender" value={user.gender} />
            <InfoField label="Address" value={user.address} />
            <InfoField label="City" value={user.city} />
            <InfoField label="Country" value={user.country} />
            <InfoField label="Qualification" value={user.qualification} />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProfile;