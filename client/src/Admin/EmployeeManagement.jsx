import React, { useState, useMemo } from 'react';
import { 
  UserPlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon, XMarkIcon, ArrowPathIcon, ExclamationTriangleIcon, AtSymbolIcon, BuildingOffice2Icon, UserCircleIcon, EyeIcon, KeyIcon, CalendarIcon
} from '@heroicons/react/24/outline';
import { useAddEmployeeMutation, useGetEmployeesQuery, useGetEmployeeEOMHistoryQuery } from '../services/EmployeApi';
import { useUpdateEmployeeMutation, useDeleteEmployeeMutation} from '../services/EmployeApi';
import toast from 'react-hot-toast'; // Removed unused import of LeaveManagementModal
import LeaveManagementModal from './LeaveManagementModal';

const ActionBtn = ({ onClick, title, bg, children }) => (
  <button onClick={onClick} title={title}
    className={`h-9 w-9 rounded-xl flex items-center justify-center transition hover:opacity-80 ${bg}`}>
    {children}
  </button>
);

const EmployeeCard = ({ user, onEdit, onDelete, onView, onPermissions, onLeave }) => (
  <div className="bg-white rounded-2xl border border-purple-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 overflow-hidden flex flex-col">
    {/* Top gradient banner */}
    <div className="h-24 w-full relative flex-shrink-0" style={{ background: 'linear-gradient(135deg,#48306A,#8E5FD0)' }}>
      <div className="absolute -bottom-14 left-1/2 -translate-x-1/2">
        <img
          src={user.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=8E5FD0&color=fff`}
          alt={user.name}
          onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=8E5FD0&color=fff`; }}
          className="h-28 w-28 rounded-full object-cover border-4 border-white shadow-md"
        />
      </div>
    </div>

    {/* Content */}
    <div className="flex flex-col items-center pt-16 px-5 pb-5">
      <h3 className="mt-2 text-base font-bold text-slate-800 text-center">{user.name}</h3>
      <p className="text-xs text-purple-500 font-semibold">{user.role}</p>
      <p className="text-[11px] text-slate-400 font-mono mt-0.5">{user.employeeId}</p>

      {/* Email row */}
      <div className="flex items-center gap-2.5 bg-purple-50 rounded-xl px-3 py-2 w-full mt-4">
        <span className="flex items-center justify-center h-7 w-7 rounded-lg bg-purple-100 flex-shrink-0">
          <AtSymbolIcon className="h-3.5 w-3.5 text-purple-500" />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] text-slate-400 leading-none">Email</p>
          <p className="text-xs font-semibold text-slate-700 truncate mt-0.5">{user.email}</p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-center gap-2 mt-4">
        <ActionBtn onClick={() => onView(user)} title="View" bg="bg-blue-50">
          <EyeIcon className="h-4 w-4 text-blue-500" />
        </ActionBtn>
        <ActionBtn onClick={() => onPermissions(user)} title="Permissions" bg="bg-amber-50">
          <KeyIcon className="h-4 w-4 text-amber-500" />
        </ActionBtn>
        <ActionBtn onClick={() => onLeave(user)} title="Leave" bg="bg-green-50">
          <CalendarIcon className="h-4 w-4 text-green-500" />
        </ActionBtn>
        <ActionBtn onClick={() => onEdit(user)} title="Edit" bg="bg-purple-50">
          <PencilIcon className="h-4 w-4 text-purple-500" />
        </ActionBtn>
        <ActionBtn onClick={() => onDelete(user)} title="Delete" bg="bg-red-50">
          <TrashIcon className="h-4 w-4 text-red-500" />
        </ActionBtn>
      </div>
    </div>
  </div>
);

const EmployeeCardGrid = ({ users, ...actions }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
    {users.map(user => (
      <EmployeeCard key={user._id} user={user} {...actions} />
    ))}
  </div>
);

const ViewEmployeeModal = ({ isOpen, onClose, employee }) => {
  const { data: eomHistory = [] } = useGetEmployeeEOMHistoryQuery(employee?._id, {
    skip: !isOpen || !employee,
  });

  const monthNames = useMemo(() => ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"], []);

  if (!isOpen || !employee) return null;

  const InfoField = ({ label, value }) => (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-medium text-slate-800">{value || 'N/A'}</p>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-black rounded-2xl shadow-xl w-full max-w-2xl h-auto max-h-[90vh] flex flex-col">
        <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Employee Details</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          <div className="flex flex-col sm:flex-row items-center gap-6 mb-6 pb-6 border-b border-slate-200 dark:border-slate-700">
            <img
              src={employee.profilePicture || `https://ui-avatars.com/api/?name=${employee.name}&background=random`}
              alt={employee.name}
              className="h-28 w-28 rounded-full object-cover border-4 border-blue-200 shadow-md"
            />
            <div>
              <h2 className="text-3xl font-bold text-slate-800 dark:text-white">{employee.name}</h2>
              <p className="text-md text-blue-600 dark:text-blue-400 font-semibold">{employee.role}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-mono mt-1">{employee.employeeId}</p>
            </div>
          </div>
          {eomHistory.length > 0 && (
            <div className="mb-6">
              <h4 className="text-md font-semibold text-slate-700 mb-3">Hall of Fame</h4>
              <div className="flex flex-wrap gap-2 dark:text-white">
                {eomHistory.map((win) => (
                  <div key={win._id} className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M8 1.75a.75.75 0 0 1 .692.462l1.41 3.393 3.663.293a.75.75 0 0 1 .428 1.317l-2.79 2.39.853 3.575a.75.75 0 0 1-1.12.814L8 11.97l-3.126 1.92a.75.75 0 0 1-1.12-.814l.852-3.574-2.79-2.39a.75.75 0 0 1 .427-1.318l3.663-.293L7.308 2.212A.75.75 0 0 1 8 1.75Z" clipRule="evenodd" /></svg>
                    <span>EOM: {monthNames[win.month - 1]} {win.year} <span className="font-normal opacity-80">(Avg. {win.score.toFixed(1)}%)</span></span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 dark:text-white">
            <InfoField label="Email" value={employee.email} /> 
            <InfoField label="Department" value={employee.department} />
            <InfoField label="Reports To" value={employee.teamLead?.name} />
            <InfoField label="Dashboard Access" value={employee.dashboardAccess} />
            <InfoField label="Gender" value={employee.gender} />
            <InfoField label="Address" value={employee.address} />
            <InfoField label="City" value={employee.city} />
            <InfoField label="Country" value={employee.country} />
            <InfoField label="Qualification" value={employee.qualification} />
            <InfoField label="Experience" value={employee.experience} />
            <InfoField label="Work Type" value={employee.workType} />
            <InfoField label="Company" value={employee.company} />
            <InfoField label="Joining Date" value={employee.joiningDate ? new Date(employee.joiningDate).toLocaleDateString() : 'N/A'} />
            <InfoField label="Work Location" value={employee.workLocation} />
            <InfoField label="Shift" value={employee.shift} />
          </div>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-black rounded-b-2xl flex justify-end">
          <button type="button" onClick={onClose} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg text-sm">Close</button>
        </div>
      </div>
    </div>
  );
};

const PermissionsModal = ({ isOpen, onClose, employee, onSave, isSaving }) => {
  const [permissions, setPermissions] = useState({
    canEditProfile: false,
    canViewTeam: false,
    canUpdateTask: false,
    canApproveTask: false,
    canAssignTask: false,
    canDeleteTask: false,
    canViewAnalytics: false,
  });

  React.useEffect(() => {
    if (employee) {
      setPermissions({
        canEditProfile: employee.canEditProfile || false,
        canViewTeam: employee.canViewTeam || false,
        canUpdateTask: employee.canUpdateTask || false,
        canApproveTask: employee.canApproveTask || false,
        canAssignTask: employee.canAssignTask || false,
        canDeleteTask: employee.canDeleteTask || false,
        canViewAnalytics: employee.canViewAnalytics || false,
      });
    }
  }, [employee]);

  if (!isOpen || !employee) return null;

  const handleToggle = (permission) => {
    setPermissions(prev => ({ ...prev, [permission]: !prev[permission] }));
  };

  const handleSave = () => {
    onSave(employee._id, permissions);
  };

  const PermissionToggle = ({ label, description, enabled, onToggle }) => (
    <div
      onClick={onToggle}
      className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all ${enabled ? 'bg-blue-50 border-blue-400' : 'bg-slate-50 border-slate-200 hover:border-slate-400'}`}
    >
      <div>
        <p className={`font-semibold ${enabled ? 'text-blue-800' : 'text-slate-700'}`}>{label}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
      <div className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${enabled ? 'bg-blue-500' : 'bg-slate-300'}`}>
        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${enabled ? 'translate-x-6' : ''}`}></div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-black rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Manage Permissions for {employee.name}</h3>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto">
          <PermissionToggle label="Can Edit Own Profile" description="Allows the user to edit their personal information." enabled={permissions.canEditProfile} onToggle={() => handleToggle('canEditProfile')} />
          <PermissionToggle label="Can View Team" description="Allows the user to view information about their assigned team members." enabled={permissions.canViewTeam} onToggle={() => handleToggle('canViewTeam')} />
          <PermissionToggle label="Can Edit Assigned Tasks" description="Allows the user to edit tasks they have assigned to others." enabled={permissions.canUpdateTask} onToggle={() => handleToggle('canUpdateTask')} />
          <PermissionToggle label="Can Approve Tasks" description="Allows the user to approve or reject tasks completed by their team." enabled={permissions.canApproveTask} onToggle={() => handleToggle('canApproveTask')} />
          <PermissionToggle label="Can Assign Tasks" description="Allows the user to assign new tasks to their team members." enabled={permissions.canAssignTask} onToggle={() => handleToggle('canAssignTask')} />
          <PermissionToggle label="Can Delete Tasks" description="Allows the user to delete tasks. Use with caution." enabled={permissions.canDeleteTask} onToggle={() => handleToggle('canDeleteTask')} />
          <PermissionToggle label="Can View Analytics" description="Allows the user to view the performance analytics page." enabled={permissions.canViewAnalytics} onToggle={() => handleToggle('canViewAnalytics')} />
        </div>
        <div className="p-4 bg-slate-50 dark:bg-black rounded-b-lg flex justify-end gap-3">
          <button type="button" onClick={onClose} className="bg-white hover:bg-slate-100 text-slate-700 font-bold py-2 px-4 rounded-lg border border-slate-300 text-sm">Cancel</button>
          <button type="button" onClick={handleSave} disabled={isSaving} className="inline-flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg text-sm disabled:bg-blue-300">
            {isSaving && <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" />}
            {isSaving ? 'Saving...' : 'Save Permissions'}
          </button>
        </div>
      </div>
    </div>
  );
};

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, isDeleting }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-black rounded-lg shadow-xl w-full max-w-sm">
        <div className="p-6 text-center">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">{title}</h3>
          <div className="mx-auto bg-red-100 dark:bg-red-500/10 rounded-full h-12 w-12 flex items-center justify-center my-4">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
          </div>
          <p className="text-sm text-slate-500 dark:text-white">{message}</p>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-black rounded-b-lg flex justify-center gap-3">
          <button type="button" onClick={onClose} className="bg-white hover:bg-slate-100 text-slate-700 font-bold py-2 px-4 rounded-lg border border-slate-300 text-sm">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} disabled={isDeleting} className="inline-flex items-center justify-center bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg text-sm disabled:bg-red-400">
            {isDeleting && <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" />}
            {isDeleting ? 'Deleting...' : 'Confirm Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

const EmployeeFormModal = ({ isOpen, onClose, onSave, employeeToEdit, isSaving }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    employeeId: '',
    password: '',
    profilePicture: null,
    address: '',
    gender: '',
    country: '',
    city: '',
    qualification: '',
    experience: '',
    workType: 'Full-time',
    company: '',
    joiningDate: '',
    workLocation: '',
    shift: 'Day',
    dashboardAccess: 'Employee Dashboard',
    department: '',
  });
  const [formError, setFormError] = useState('');

  const isEditMode = !!employeeToEdit;

  React.useEffect(() => {
    if (isEditMode) {
      setFormData({
        name: employeeToEdit.name || '',
        email: employeeToEdit.email || '',
        role: employeeToEdit.role || '',
        employeeId: employeeToEdit.employeeId || '',
        password: '', // Password should not be pre-filled for security
        profilePicture: null, // File input cannot be pre-filled
        address: employeeToEdit.address || '',
        gender: employeeToEdit.gender || '',
        country: employeeToEdit.country || '',
        city: employeeToEdit.city || '',
        qualification: employeeToEdit.qualification || '',
        experience: employeeToEdit.experience || '',
        workType: employeeToEdit.workType || 'Full-time',
        company: employeeToEdit.company || '',
        joiningDate: employeeToEdit.joiningDate ? new Date(employeeToEdit.joiningDate).toISOString().split('T')[0] : '',
        workLocation: employeeToEdit.workLocation || '',
        shift: employeeToEdit.shift || 'Day',
        dashboardAccess: employeeToEdit.dashboardAccess || 'Employee Dashboard',
        department: employeeToEdit.department || '',
        monitoringName: employeeToEdit.monitoringName || '',
      });
    } else {
      // Reset for "Add" mode
      setFormData({ name: '', email: '', role: '', employeeId: '', password: '', profilePicture: null, address: '', gender: '', country: '', city: '', qualification: '', experience: '', workType: 'Full-time', company: '', joiningDate: '', workLocation: '', shift: 'Day', dashboardAccess: 'Employee Dashboard', department: '', monitoringName: '' });
    }
  }, [employeeToEdit, isOpen]); // Rerun when the user to edit changes or modal opens

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (e.target.type === 'file') {
      setFormData(prev => ({ ...prev, [name]: e.target.files[0] }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');
    if (!formData.name.trim() || !formData.email.trim() || !formData.role.trim() || !formData.employeeId.trim() || !formData.company.trim() || !formData.department) {
      setFormError('Please fill out all required fields: Full Name, Email, Role, Employee ID, Company, and Department.');
      return;
    }
    // Password is only required when creating a new user
    if (!isEditMode && !formData.password) {
      setFormError('Password is required for new employees.');
      return;
    }
    if (formData.password && formData.password.length < 6) {
      setFormError('Password must be at least 6 characters long.');
      return;
    }
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(formData.email)) {
      setFormError('Please enter a valid email address.');
      return;
    }

    const employeeFormData = new FormData();
    employeeFormData.append('name', formData.name);
    employeeFormData.append('email', formData.email);
    employeeFormData.append('role', formData.role);
    employeeFormData.append('employeeId', formData.employeeId);
    if (formData.password) employeeFormData.append('password', formData.password);
    if (formData.profilePicture) employeeFormData.append('profilePicture', formData.profilePicture);
    Object.keys(formData).forEach(key => {
        if (!['name', 'email', 'role', 'employeeId', 'password', 'profilePicture'].includes(key) && formData[key] !== undefined && formData[key] !== null) {
            employeeFormData.append(key, formData[key]);
        }
    });

    onSave(employeeFormData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-black rounded-lg shadow-xl w-full max-w-3xl h-[90vh] flex flex-col">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">{isEditMode ? 'Edit Employee' : 'Add New Employee'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 overflow-y-auto text-slate-700 dark:text-white" style={{maxHeight: 'calc(90vh - 140px)'}}>
            <div >
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label >
              <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className="w-full text-sm border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
              <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} className="w-full text-sm border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Role</label>
                <input type="text" name="role" id="role" value={formData.role} onChange={handleChange} className="w-full text-sm border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label htmlFor="employeeId" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Employee ID</label>
                <input type="text" name="employeeId" id="employeeId" value={formData.employeeId} onChange={handleChange} className="w-full text-sm border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password {isEditMode && <span className="text-slate-400 font-normal">(Leave blank to keep unchanged)</span>}</label>
              <input type="password" name="password" id="password" value={formData.password} onChange={handleChange} className="w-full text-sm border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="profilePicture" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Profile Picture</label>
                <input type="file" name="profilePicture" id="profilePicture" onChange={handleChange} className="w-full text-sm border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Address</label>
                <input type="text" name="address" id="address" value={formData.address} onChange={handleChange} className="w-full text-sm border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Gender</label>
                <select name="gender" id="gender" value={formData.gender} onChange={handleChange} className="w-full text-sm border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Country</label>
                <input type="text" name="country" id="country" value={formData.country} onChange={handleChange} className="w-full text-sm border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">City</label>
                <input type="text" name="city" id="city" value={formData.city} onChange={handleChange} className="w-full text-sm border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="qualification" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Qualification</label>
                <input type="text" name="qualification" id="qualification" value={formData.qualification} onChange={handleChange} className="w-full text-sm border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label htmlFor="experience" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Experience</label>
                <input type="text" name="experience" id="experience" value={formData.experience} onChange={handleChange} className="w-full text-sm border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="workType" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Work-Type</label>
                <select name="workType" id="workType" value={formData.workType} onChange={handleChange} className="w-full text-sm border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>
              <div>
                <label htmlFor="company" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Company</label>
                <input type="text" name="company" id="company" value={formData.company} onChange={handleChange} className="w-full text-sm border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label htmlFor="joiningDate" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Joining Date</label>
                <input type="date" name="joiningDate" id="joiningDate" value={formData.joiningDate} onChange={handleChange} className="w-full text-sm border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="workLocation" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Work Location</label>
                <input type="text" name="workLocation" id="workLocation" value={formData.workLocation} onChange={handleChange} className="w-full text-sm border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label htmlFor="shift" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Shift Information</label>
                <select name="shift" id="shift" value={formData.shift} onChange={handleChange} className="w-full text-sm border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="Day">Day</option>
                  <option value="Night">Night</option>
                </select>
              </div>
              <div>
                <label htmlFor="dashboardAccess" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Dashboard Access</label>
                <select name="dashboardAccess" id="dashboardAccess" value={formData.dashboardAccess} onChange={handleChange} className="w-full text-sm border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="Employee Dashboard">Employee Dashboard</option>
                  <option value="Manager Dashboard">Manager Dashboard</option>
                  <option value="Admin Dashboard">Admin Dashboard</option>
                </select>
              </div>
              <div>
                <label htmlFor="department" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Department</label>
                <select name="department" id="department" value={formData.department} onChange={handleChange} className="w-full text-sm border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="">Select Department</option>
                  <option value="Corporate management">Corporate management</option>
                  <option value="Human Resource">Human Resource</option>
                  <option value="Creative Designing">Creative Designing</option>
                  <option value="Finance & Accounts">Finance & Accounts</option>
                  <option value="Marketing Operations">Marketing Operations</option>
                  <option value="Sales & Marketing">Sales & Marketing</option>
                  <option value="Tech & Development">Tech & Development</option>
                </select>
              </div>
              <div>
                <label htmlFor="monitoringName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Monitoring Name <span className="text-slate-400 font-normal">(exact name in Portal 3)</span></label>
                <input type="text" name="monitoringName" id="monitoringName" value={formData.monitoringName} onChange={handleChange} placeholder="e.g. Anmol" className="w-full text-sm border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
            </div>
            {formError && <p className="text-sm text-red-600 bg-red-50 p-2 rounded-md mt-4">{formError}</p>}
          </div>
          <div className="p-6 bg-slate-50 dark:bg-black rounded-b-lg flex justify-end gap-3">
            <button type="button" onClick={onClose} className="bg-white hover:bg-slate-100 text-slate-700 font-bold py-2 px-4 rounded-lg border border-slate-300 text-sm">
              Cancel
            </button>
            <button type="submit" disabled={isSaving} className="inline-flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg text-sm disabled:bg-blue-300">
              {isSaving && <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" />}
              {isSaving && isEditMode ? 'Updating...' : isSaving ? 'Saving...' : isEditMode ? 'Update Details' : 'Save Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EmployeeTable = ({ users, onEdit, onDelete, onView, onPermissions, onLeave }) => (
  <div className="overflow-x-auto rounded-xl shadow border border-gray-200 bg-white">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">#</th>
          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</th>
          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Department</th>
          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
          <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-100">
        {users.map((user, idx) => (
          <tr key={user._id} className="hover:bg-blue-50 transition">
            <td className="px-6 py-4 text-sm text-gray-500">{idx + 1}</td>
            <td className="px-6 py-4 flex items-center gap-3">
              <img
                src={user.profilePicture || `https://ui-avatars.com/api/?name=${user.name}&background=random`}
                alt={user.name}
                className="h-9 w-9 rounded-full border border-gray-200 object-cover"
              />
              <span className="font-medium text-gray-800">{user.name}</span>
            </td>
            <td className="px-6 py-4 text-sm text-blue-700">{user.role}</td>
            <td className="px-6 py-4 text-sm text-gray-700">{user.department || 'N/A'}</td>
            <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
            <td className="px-6 py-4 text-center">
              <div className="flex items-center justify-center gap-2">
                <button onClick={() => onView(user)} className="p-2 rounded hover:bg-blue-100" title="View">
                  <EyeIcon className="h-5 w-5 text-blue-600" />
                </button>
                <button onClick={() => onPermissions(user)} className="p-2 rounded hover:bg-indigo-100" title="Permissions">
                  <KeyIcon className="h-5 w-5 text-indigo-600" />
                </button>
                <button onClick={() => onLeave(user)} className="p-2 rounded hover:bg-green-100" title="Leave">
                  <CalendarIcon className="h-5 w-5 text-green-600" />
                </button>
                <button onClick={() => onEdit(user)} className="p-2 rounded hover:bg-amber-100" title="Edit">
                  <PencilIcon className="h-5 w-5 text-amber-600" />
                </button>
                <button onClick={() => onDelete(user)} className="p-2 rounded hover:bg-red-100" title="Delete">
                  <TrashIcon className="h-5 w-5 text-red-600" />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default function EmployeeManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);
  const [permissionsUser, setPermissionsUser] = useState(null);
  const [leaveUser, setLeaveUser] = useState(null);

  // RTK Query hook for fetching employees
  const { data: users = [], isLoading, isError, error } = useGetEmployeesQuery();

  // RTK Query mutation hook for adding an employee
  const [addEmployee, { isLoading: isAdding }] = useAddEmployeeMutation();

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleOpenViewModal = (user) => {
    setViewingUser(user);
  };

  const handleOpenPermissionsModal = (user) => {
    setPermissionsUser(user);
  };

  const handleOpenLeaveModal = (user) => {
    setLeaveUser(user);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };
  
  const handleOpenDeleteModal = (user) => {
    setDeletingUser(user);
  };

  const handleCloseViewModal = () => {
    setViewingUser(null);
  };

  const handleClosePermissionsModal = () => {
    setPermissionsUser(null);
  };

  const handleCloseLeaveModal = () => {
    setLeaveUser(null);
  };

  const [updateEmployee, { isLoading: isUpdating }] = useUpdateEmployeeMutation();
  const [deleteEmployee, { isLoading: isDeleting }] = useDeleteEmployeeMutation();

   const handleSaveEmployee = async (employeeData) => {
    if (editingUser) {
      try {
        // The `_id` is on editingUser, and the rest of the data is in employeeData
        await updateEmployee({ id: editingUser._id, formData: employeeData }).unwrap();
        handleCloseModal();
        toast.success('Employee updated successfully!');
      } catch (err) {
        console.error('Failed to update the employee: ', err); // Log error for debugging
        console.error('Failed to update the employee: ', err);
        toast.error(err.data?.message || 'Failed to update employee.');
      }
    } else {
      try {
        await addEmployee(employeeData).unwrap();
        handleCloseModal();
        toast.success('Employee added successfully!');
      } catch (err) {
        console.error('Failed to save the employee: ', err);
        toast.error(err.data?.message || 'Failed to save employee.');
      }
    }
  };

  const handleSavePermissions = async (employeeId, permissions) => {
    try {
      await updateEmployee({ id: employeeId, formData: permissions }).unwrap();
      handleClosePermissionsModal();
      toast.success('Permissions updated successfully!');
    } catch (err) {
      console.error('Failed to update permissions: ', err);
      toast.error(err.data?.message || 'Failed to update permissions.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingUser) return;
    try {
      await deleteEmployee(deletingUser._id).unwrap();
      setDeletingUser(null); // Close the modal
      toast.success(`Employee "${deletingUser?.name}" deleted.`);
    } catch (err) {
      console.error('Failed to delete the employee: ', err);
      toast.error(err.data?.message || 'Failed to delete employee.');
    }
  };
  const filteredUsers = useMemo(() =>
    users.filter(user =>
      user?.name && user?.employeeId &&
      (user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       user.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
       user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       user.role?.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (!deptFilter || user.department === deptFilter)
    ), [users, searchTerm, deptFilter]);

  if (isLoading) return <div className="p-8 text-center text-slate-500">Loading employees...</div>;
  if (isError) return <div className="p-8 text-center text-red-500">Error: {error.toString()}</div>;

  return (
    <div className="min-h-full p-6 lg:p-8" style={{ backgroundColor: '#DFCDFE' }}>
      {/* Header */}
      <div className="mb-2">
        <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">Employee Management</h2>
        <div className="h-1 w-12 rounded-full mt-1 mb-3" style={{ background: 'linear-gradient(90deg,#48306A,#8E5FD0)' }} />
        <p className="text-slate-500 dark:text-slate-400 text-sm">Manage Your Team Member Roles And Their Information</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 my-6">
        <div className="relative w-full sm:w-80">
          <MagnifyingGlassIcon className="h-4 w-4 text-slate-400 absolute top-1/2 left-3 -translate-y-1/2" />
          <input type="text" placeholder="Search Employee By Name, Role & Email...." value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-purple-200 bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-300 shadow-sm" />
        </div>
        <div className="flex items-center gap-3">
          <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
            className="text-sm border border-purple-200 rounded-xl px-4 py-2.5 bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-300 shadow-sm font-medium">
            <option value="">All Departments</option>
            <option value="Corporate management">Corporate management</option>
            <option value="Human Resource">Human Resource</option>
            <option value="Creative Designing">Creative Designing</option>
            <option value="Finance & Accounts">Finance & Accounts</option>
            <option value="Marketing Operations">Marketing Operations</option>
            <option value="Sales & Marketing">Sales & Marketing</option>
            <option value="Tech & Development">Tech & Development</option>
          </select>
          <button onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-sm transition hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#48306A,#8E5FD0)' }}>
            <UserPlusIcon className="h-4 w-4" /> Add Employee
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="pb-8">
        <EmployeeCardGrid
          users={filteredUsers}
          onEdit={handleOpenEditModal}
          onDelete={handleOpenDeleteModal}
          onView={handleOpenViewModal}
          onPermissions={handleOpenPermissionsModal}
          onLeave={handleOpenLeaveModal}
        />
      </div>
      <EmployeeFormModal
        isOpen={isModalOpen} 
        onClose={handleCloseModal}
        onSave={handleSaveEmployee}
        employeeToEdit={editingUser}
        isSaving={isAdding || isUpdating}
      />
      <ConfirmationModal
        isOpen={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
        title="Confirm Deletion"
        message={`Are you sure you want to delete the employee "${deletingUser?.name}"? This action cannot be undone.`}
      />
      <ViewEmployeeModal
        isOpen={!!viewingUser}
        onClose={handleCloseViewModal}
        employee={viewingUser}
      />
      <PermissionsModal
        isOpen={!!permissionsUser}
        onClose={handleClosePermissionsModal}
        employee={permissionsUser}
        onSave={handleSavePermissions}
        isSaving={isUpdating}
      />
      <LeaveManagementModal
        isOpen={!!leaveUser}
        onClose={handleCloseLeaveModal}
        employee={leaveUser}
      />
    </div>
  );
};
