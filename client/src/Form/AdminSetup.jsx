import React, { useState } from 'react';
import toast from 'react-hot-toast';
import portalLogo from '../assets/portal_logo.png';
import { useCreateAdminMutation } from '../services/EmployeApi';
import { UserIcon, EnvelopeIcon, LockClosedIcon, ArrowPathIcon, IdentificationIcon, MapPinIcon, GlobeAltIcon, AcademicCapIcon, BriefcaseIcon, BuildingOfficeIcon, CalendarIcon, SunIcon, BuildingLibraryIcon, SparklesIcon, CheckIcon, ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

const InputField = ({ id, name, label, type = 'text', value, onChange, placeholder, icon: Icon, required = false }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-semibold text-slate-600 mb-1">
      {label}
    </label>
    <div className="relative">
      {Icon && <Icon className="h-5 w-5 text-blue-400 absolute left-3 top-1/2 -translate-y-1/2" />}
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        value={value}
        onChange={onChange}
        className="pl-10 pr-4 py-2.5 w-full border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 font-medium transition"
        placeholder={placeholder}
      />
    </div>
  </div>
);

const SelectField = ({ id, name, label, value, onChange, children, icon: Icon }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-semibold text-slate-600 mb-1">
      {label}
    </label>
    <div className="relative">
      {Icon && <Icon className="h-5 w-5 text-blue-400 absolute left-3 top-1/2 -translate-y-1/2" />}
      <select
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        className="pl-10 pr-4 py-2.5 w-full border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 font-medium appearance-none transition"
      >
        {children}
      </select>
    </div>
  </div>
);

const AdminSetup = ({ onSetupComplete }) => {
  const [formData, setFormData] = useState({ 
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    employeeId: '',
    profilePicture: null,
    address: '',
    gender: '',
    country: '',
    city: '',
    qualification: '',
    experience: '',
    workType: 'Full-time',
    company: '', // This was already here, which is great.
    workLocation: '',
    shift: 'Day',
    department: '',
  });
  const [step, setStep] = useState(1);

  const [createAdmin, { isLoading }] = useCreateAdminMutation();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    if (!formData.name || !formData.email || !formData.password || !formData.company || !formData.employeeId || !formData.department) {
      toast.error('Please ensure all required fields in every step are filled out.');
      return;
    }

    const adminFormData = new FormData();
    adminFormData.append('name', formData.name);
    adminFormData.append('email', formData.email);
    adminFormData.append('password', formData.password);
    adminFormData.append('employeeId', formData.employeeId);
    if (formData.profilePicture) adminFormData.append('profilePicture', formData.profilePicture);
    if (formData.address) adminFormData.append('address', formData.address);
    if (formData.gender) adminFormData.append('gender', formData.gender);
    if (formData.country) adminFormData.append('country', formData.country);
    if (formData.city) adminFormData.append('city', formData.city);
    if (formData.qualification) adminFormData.append('qualification', formData.qualification);
    if (formData.experience) adminFormData.append('experience', formData.experience);
    if (formData.workType) adminFormData.append('workType', formData.workType);
    if (formData.company) adminFormData.append('company', formData.company);
    if (formData.workLocation) adminFormData.append('workLocation', formData.workLocation);
    if (formData.shift) adminFormData.append('shift', formData.shift);
    if (formData.department) adminFormData.append('department', formData.department);

    try {
      await createAdmin(adminFormData).unwrap();
      toast.success('Admin account created successfully! You can now log in.');
      onSetupComplete();
    } catch (err) {
      toast.error(err.data?.message || 'Failed to create admin account.');
      console.error('Admin setup failed:', err);
    }
  };

  const nextStep = () => {
    if (step === 1) {
      if (!formData.name.trim() || !formData.email.trim() || !formData.password || !formData.confirmPassword) {
        toast.error("Please fill all required account fields.");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        toast.error("Passwords do not match.");
        return;
      }
      if (formData.password.length < 6) {
        toast.error("Password must be at least 6 characters long.");
        return;
      }
    }
    if (step === 2) {
      if (!formData.company.trim()) {
        toast.error("Company Name is required.");
        return;
      }
      if (!formData.employeeId.trim()) {
        toast.error("Employee ID is required.");
        return;
      }
      if (!formData.department) {
        toast.error("Please select a department.");
        return;
      }
    }
    setStep(s => s + 1);
  };

  const prevStep = () => setStep(s => s - 1);

  const steps = [
    { number: 1, title: 'Admin Account', icon: UserIcon },
    { number: 2, title: 'Company & Role', icon: BuildingOfficeIcon },
    { number: 3, title: 'Personal Details', icon: IdentificationIcon },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-manrope grid lg:grid-cols-2 overflow-hidden">
       <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Orbitron:wght@700;900&display=swap');
          .font-manrope { font-family: 'Manrope', sans-serif; }
          .font-orbitron { font-family: 'Orbitron', sans-serif; }
          .animate-slide-in-left { animation: slideInLeft 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) both; }
          @keyframes slideInLeft { 0% { transform: translateX(-100px); opacity: 0; } 100% { transform: translateX(0); opacity: 1; } }
          .wave-g { transform-origin: bottom; }
          .animate-wave-1 { animation: wave 7s ease-in-out infinite; }
          .animate-wave-2 { animation: wave 5s ease-in-out infinite .5s; }
          .animate-wave-3 { animation: wave 3.5s ease-in-out infinite 1s; }
          @keyframes wave { 0%, 100% { transform: scaleY(1); } 50% { transform: scaleY(1.08); } }
        `}
      </style>
        {/* Sidebar */}
        <div className="flex flex-col items-center justify-center p-8 lg:p-12 bg-slate-900 text-white relative lg:rounded-r-3xl overflow-hidden">
          <div className="absolute inset-0">
            <svg width="0" height="0" style={{position: 'absolute'}}>
              <defs>
                <linearGradient id="waveGradient1" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" style={{stopColor: '#1e293b', stopOpacity: 1}} /><stop offset="100%" style={{stopColor: '#0f172a', stopOpacity: 1}} /></linearGradient>
                <linearGradient id="waveGradient2" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" style={{stopColor: '#334155', stopOpacity: 1}} /><stop offset="100%" style={{stopColor: '#1e293b', stopOpacity: 1}} /></linearGradient>
              </defs>
            </svg>
            <svg className="absolute bottom-0 left-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320"><g className="wave-g animate-wave-1"><path fill="url(#waveGradient1)" d="M0,96L48,112C96,128,192,160,288,149.3C384,139,480,85,576,74.7C672,64,768,96,864,122.7C960,149,1056,171,1152,154.7C1248,139,1344,85,1392,58.7L1440,32L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path></g></svg>
            <svg className="absolute bottom-0 left-0 opacity-70" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320"><g className="wave-g animate-wave-2"><path fill="url(#waveGradient2)" d="M0,160L48,144C96,128,192,96,288,101.3C384,107,480,149,576,138.7C672,128,768,64,864,48C960,32,1056,64,1152,85.3C1248,107,1344,117,1392,122.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path></g></svg>
            <svg className="absolute bottom-0 left-0 opacity-40" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320"><g className="wave-g animate-wave-3"><path fill="url(#waveGradient2)" d="M0,192L48,176C96,160,192,128,288,133.3C384,139,480,181,576,186.7C672,192,768,160,864,144C960,128,1056,128,1152,149.3C1248,171,1344,213,1392,234.7L1440,256L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path></g></svg>
          </div>
          <div className="z-10 text-center animate-slide-in-left">
            <div className="p-4 bg-white/10 rounded-full inline-block shadow-lg mb-6 backdrop-blur-sm border border-white/10">
              <img src={portalLogo} alt="Logo" className="h-28 w-28" />
            </div>
            <h1 className="text-6xl font-orbitron font-bold tracking-wider text-white drop-shadow-lg">Work Radar</h1>
            <p className="mt-4 text-lg text-indigo-200 max-w-sm mx-auto">Initial Portal Setup</p>
          </div>
          <nav className="z-10 mt-12 w-full max-w-sm">
            <ul className="space-y-4 animate-slide-in-left" style={{animationDelay: '0.2s'}}>
              {steps.map((s) => (
                <li key={s.number} className="flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300 ${step >= s.number ? 'bg-green-400 text-white shadow-lg' : 'bg-white/10 text-indigo-200'}`}>
                    {step > s.number ? <CheckIcon className="h-6 w-6" /> : <s.icon className="h-6 w-6" />}
                  </div>
                  <div>
                    <p className={`text-sm font-bold transition-colors ${step >= s.number ? 'text-indigo-200' : 'text-slate-400'}`}>Step {s.number}</p>
                    <p className={`text-lg font-semibold transition-colors ${step >= s.number ? 'text-white' : 'text-slate-400'}`}>{s.title}</p>
                  </div>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Form Content */}
        <div className="flex items-center justify-center p-4 sm:p-8 bg-slate-50 dark:bg-slate-900"> {/* Changed form background */}
          <form onSubmit={handleSubmit} className="w-full max-w-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 p-8">
            <div className="flex-1 overflow-y-auto pr-4 -mr-4">
              {step === 1 && (
                <fieldset className="space-y-8 animate-fade-in">
                  <div className="relative">
                    <div className="absolute -left-4 -top-2 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800 text-white shadow-lg">
                      <UserIcon className="h-8 w-8" />
                    </div>
                    <div className="pl-16 pt-2">
                      <h3 className="text-2xl font-bold text-slate-800">Create Your Admin Account</h3>
                      <p className="text-sm text-slate-500">This will be the primary account for managing the portal.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField id="name" name="name" label="Full Name" value={formData.name} onChange={handleChange} placeholder="Admin Name" icon={UserIcon} required />
                    <InputField id="email" name="email" label="Email Address" type="email" value={formData.email} onChange={handleChange} placeholder="admin@example.com" icon={EnvelopeIcon} required />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField id="password" name="password" label="Create Password" type="password" value={formData.password} onChange={handleChange} placeholder="••••••••" icon={LockClosedIcon} required />
                    <InputField id="confirmPassword" name="confirmPassword" label="Confirm Password" type="password" value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••" icon={LockClosedIcon} required />
                  </div>
                </fieldset>
              )}

              {step === 2 && (
                <fieldset className="space-y-8 animate-fade-in">
                  <div className="relative">
                    <div className="absolute -left-4 -top-2 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800 text-white shadow-lg">
                      <BuildingOfficeIcon className="h-8 w-8" />
                    </div>
                    <div className="pl-16 pt-2">
                      <h3 className="text-2xl font-bold text-slate-800">Define Company & Role</h3>
                      <p className="text-sm text-slate-500">Set up the company details and admin's role.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField id="company" name="company" label="Company Name" value={formData.company} onChange={handleChange} placeholder="Your Company Inc." icon={BuildingOfficeIcon} required />
                    <InputField id="employeeId" name="employeeId" label="Employee ID" value={formData.employeeId} onChange={handleChange} placeholder="ADMIN-001" icon={IdentificationIcon} required />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SelectField id="department" name="department" label="Department" value={formData.department} onChange={handleChange} icon={BuildingLibraryIcon}>
                      <option value="">Select Department</option>
                      <option>Corporate management</option>
                      <option>Human Resource</option>
                      <option>Creative Designing</option>
                      <option>Finance & Accounts</option>
                      <option>Marketing Operations</option>
                      <option>Sales & Marketing</option>
                      <option>Tech & Development</option>
                    </SelectField>
                  </div>
                </fieldset>
              )}

              {step === 3 && (
                <fieldset className="space-y-8 animate-fade-in">
                  <div className="relative">
                    <div className="absolute -left-4 -top-2 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800 text-white shadow-lg">
                      <IdentificationIcon className="h-8 w-8" />
                    </div>
                    <div className="pl-16 pt-2">
                      <h3 className="text-2xl font-bold text-slate-800">Add Personal Details (Optional)</h3>
                      <p className="text-sm text-slate-500">These details can be filled out later if needed.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField id="address" name="address" label="Address" value={formData.address} onChange={handleChange} placeholder="123 Main St" icon={MapPinIcon} />
                    <SelectField id="gender" name="gender" label="Gender" value={formData.gender} onChange={handleChange} icon={UserIcon}>
                      <option value="">Select...</option>
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </SelectField>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField id="city" name="city" label="City" value={formData.city} onChange={handleChange} placeholder="New York" icon={MapPinIcon} />
                    <InputField id="country" name="country" label="Country" value={formData.country} onChange={handleChange} placeholder="USA" icon={GlobeAltIcon} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField id="qualification" name="qualification" label="Qualification" value={formData.qualification} onChange={handleChange} placeholder="B.Sc. in Computer Science" icon={AcademicCapIcon} />
                    <InputField id="experience" name="experience" label="Experience" value={formData.experience} onChange={handleChange} placeholder="5+ years" icon={BriefcaseIcon} />
                  </div>
                </fieldset>
              )}
            </div>

            <div className="mt-10 pt-6 border-t border-slate-200 flex justify-between items-center">
              {step > 1 && (
                <button type="button" onClick={prevStep} className="flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-all">
                  <ArrowLeftIcon className="h-5 w-5" />
                  Back
                </button>
              )}
              <div className="flex-grow"></div> {/* Spacer */}
              {step < 3 && (
                <button type="button" onClick={nextStep} className="w-full sm:w-auto flex items-center justify-center gap-2 py-3 px-8 rounded-xl shadow-lg font-semibold text-white bg-slate-700 hover:bg-slate-600 transition-all transform hover:scale-105">
                  Next
                  <ArrowRightIcon className="h-5 w-5" />
                </button>
              )}
              {step === 3 && (
                <button type="submit" disabled={isLoading} className="w-full sm:w-auto flex items-center justify-center py-3 px-8 rounded-xl shadow-lg font-semibold text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:from-slate-500 disabled:to-slate-600 transition-all duration-300 transform hover:scale-105">
                  {isLoading ? <ArrowPathIcon className="animate-spin h-5 w-5 mr-3" /> : <SparklesIcon className="h-5 w-5 mr-3" />}
                  {isLoading ? 'Setting Up...' : 'Create Admin & Launch'}
                </button>
              )}
            </div>
          </form>
        </div>
    </div>
  );
};

export default AdminSetup;