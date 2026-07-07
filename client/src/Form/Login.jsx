import React, { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { ArrowPathIcon, UserIcon, LockClosedIcon, EyeIcon, EyeSlashIcon, ArrowRightOnRectangleIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { useGetCompanyInfoQuery, useLoginMutation } from "../services/EmployeApi";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setCredentials } from "../app/authSlice";
import portalLogo from "../assets/portal_logo.png";

// Unused legacy logo imports removed to satisfy lint rules
const wishes = [
  "Let's make today productive!",
  "Ready to achieve great things?",
  "Your hard work makes a difference.",
  "Let's get started on a great day!",
  "Time to shine!",
  "Welcome! Let's make an impact."
];

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return "Good Morning";
  }
  if (hour >= 12 && hour < 18) {
    return "Good Afternoon";
  }
  return "Good Evening";
};

const Login = () => {
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const isMounted = useRef(true);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  // companyInfo not currently used in the login screen

  const [wish, setWish] = useState('');

  useEffect(() => {
    setWish(wishes[Math.floor(Math.random() * wishes.length)]);
  }, []);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const [login, { isLoading }] = useLoginMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!employeeId || !password) {
      toast.error("Please enter both employee ID and password.");
      return;
    }

    try {
      const userData = await login({ employeeId, password }).unwrap();
      dispatch(setCredentials(userData));
      toast.success(`Welcome back, ${userData.user.name}!`);

      const dashboard = userData.user?.dashboardAccess || 'Employee Dashboard';
      if (dashboard === 'Admin Dashboard') {
        navigate('/admin-dashboard');
      } else if (dashboard === 'Manager Dashboard') {
        navigate('/manager-dashboard');
      } else {
        navigate('/employee-dashboard');
      }
    } catch (err) {
      if (err && err.status === 401) {
        toast.error('Invalid credentials. Please check your ID and password.');
      } else {
        toast.error(err.data?.message || 'Login failed. Please try again.');
      }
      console.error("Failed to login:", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-manrope grid lg:grid-cols-2 overflow-hidden">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Orbitron:wght@700;900&display=swap');
          .font-manrope {
            font-family: 'Manrope', sans-serif;
          }
          .font-orbitron {
            font-family: 'Orbitron', sans-serif;
          }
          .animate-slide-in-left { animation: slideInLeft 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) both; }
          @keyframes slideInLeft { 0% { transform: translateX(-100px); opacity: 0; } 100% { transform: translateX(0); opacity: 1; } }
          .animation-delay-300 { animation-delay: 0.3s; }
          
          /* --- IMPROVED STAGGERED WAVE ANIMATION --- */
          .wave-g {
            transform-origin: bottom; /* Anchors the animation to the bottom */
          }
          .animate-wave-1 {
            animation: wave 7s ease-in-out infinite;
          }
          .animate-wave-2 {
            animation: wave 5s ease-in-out infinite .5s; /* Staggered start */
          }
          .animate-wave-3 {
            animation: wave 3.5s ease-in-out infinite 1s; /* Staggered start */
          }
          @keyframes wave {
            0%, 100% { transform: scaleY(1); }
            50% { transform: scaleY(1.08); } /* Scales vertically */
          }
        `}
      </style>
      {/* Left side - Branding */}
      <div className="flex flex-col items-center justify-center p-8 lg:p-12 bg-slate-900 text-white relative lg:rounded-r-3xl overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full">
            {/* SVG definitions for gradients, reusable by all waves */}
            <svg width="0" height="0" style={{position: 'absolute'}}>
              <defs>
                <linearGradient id="waveGradient1" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style={{stopColor: '#1e293b', stopOpacity: 1}} />
                  <stop offset="100%" style={{stopColor: '#0f172a', stopOpacity: 1}} />
                </linearGradient>
                <linearGradient id="waveGradient2" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style={{stopColor: '#334155', stopOpacity: 1}} />
                  <stop offset="100%" style={{stopColor: '#1e293b', stopOpacity: 1}} />
                </linearGradient>
              </defs>
            </svg>

            {/* Back wave (calmest) */}
            <svg className="absolute bottom-0 left-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
              <g className="wave-g animate-wave-1">
                <path fill="url(#waveGradient1)" d="M0,96L48,112C96,128,192,160,288,149.3C384,139,480,85,576,74.7C672,64,768,96,864,122.7C960,149,1056,171,1152,154.7C1248,139,1344,85,1392,58.7L1440,32L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
              </g>
            </svg>

            {/* Middle wave */}
            <svg className="absolute bottom-0 left-0 opacity-70" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
              <g className="wave-g animate-wave-2">
                <path fill="url(#waveGradient2)" d="M0,160L48,144C96,128,192,96,288,101.3C384,107,480,149,576,138.7C672,128,768,64,864,48C960,32,1056,64,1152,85.3C1248,107,1344,117,1392,122.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
              </g>
            </svg>
            
            {/* Front wave (most active) */}
            <svg className="absolute bottom-0 left-0 opacity-40" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
              <g className="wave-g animate-wave-3">
                <path fill="url(#waveGradient2)" d="M0,192L48,176C96,160,192,128,288,133.3C384,139,480,181,576,186.7C672,192,768,160,864,144C960,128,1056,128,1152,149.3C1248,171,1344,213,1392,234.7L1440,256L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
              </g>
            </svg>
        </div>
        <div className="z-10 text-center animate-slide-in-left">
          <div className="p-4 bg-white/10 rounded-full inline-block shadow-lg mb-6 backdrop-blur-sm border border-white/10">
            <img src={portalLogo} alt="Logo" className="h-28 w-28" />
          </div>
            <h1 className="text-6xl font-orbitron font-bold tracking-wider text-white drop-shadow-lg">Work Radar</h1>
          <p className="mt-4 text-lg text-indigo-200 max-w-sm mx-auto">Your daily hub for productivity and progress.</p>
        </div>
        <div className="z-10 mt-12 text-left max-w-md animate-slide-in-left animation-delay-300">
            <h2 className="text-xl font-bold text-white mb-4 border-b border-white/10 pb-2">Portal Guidelines</h2>
            <ul className="space-y-3 text-indigo-200 text-sm">
                <li className="flex items-start gap-3">
                    <CheckCircleIcon className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Submit your daily progress report once every working day before 7:00 PM.</span>
                </li>
                <li className="flex items-start gap-3">
                    <CheckCircleIcon className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>For security, you will be automatically logged out after 15 minutes of inactivity.</span>
                </li>
                <li className="flex items-start gap-3">
                    <CheckCircleIcon className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Tasks past their due date will be automatically submitted for verification.</span>
                </li>
                <li className="flex items-start gap-3">
                    <CheckCircleIcon className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Once a task is graded by a manager, its status is final and cannot be changed.</span>
                </li>
                <li className="flex items-start gap-3">
                    <CheckCircleIcon className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Your performance, including task scores and timeliness, contributes to the 'Employee of the Month' selection.</span>
                </li>
            </ul>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex items-center justify-center p-4 sm:p-8 bg-slate-50 dark:bg-slate-900">
        <div className="relative z-10 w-full max-w-md p-8 sm:p-10 space-y-8 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl rounded-3xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 transition-transform duration-300 hover:-translate-y-1 hover:shadow-3xl">
          <div className="text-center">
            <div className="mx-auto mb-4 flex items-center justify-center h-24 w-24 rounded-full bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 dark:from-blue-900/50 dark:via-indigo-900/50 dark:to-purple-900/50 shadow-lg ring-4 ring-white/20 animate-bounce-slow">
              <img src={portalLogo} alt="Logo" className="h-20 w-20" />
            </div>
            <h1 className="text-4xl font-extrabold text-slate-800 dark:text-indigo-300 drop-shadow-md mb-2 tracking-tight animate-fade-in">
              {getGreeting()}!
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-base mb-2 animate-fade-in">{wish}</p>
          </div>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="employeeId" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Employee ID
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <UserIcon className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="employeeId"
                  name="employeeId"
                  type="text"
                  autoComplete="employeeId"
                  required
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="block w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 transition-all duration-200"
                  placeholder="ST-001"
                />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Password
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <LockClosedIcon className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 transition-all duration-200"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600">
                  {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full group inline-flex items-center justify-center py-3 px-4 rounded-xl shadow-lg font-semibold text-white bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 hover:from-slate-800 hover:to-slate-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-blue-500 disabled:from-slate-500 disabled:to-slate-600 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 hover:shadow-blue-500/20"
              >
                {isLoading && <ArrowPathIcon className="animate-spin h-5 w-5 mr-3" />}
                {!isLoading && <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2 transition-transform duration-300 group-hover:translate-x-1" />}
                <span>{isLoading ? "Signing In..." : "Sign In"}</span>
              </button>
            </div>
            <div className="text-center">
              <Link to="/forgot-password" className="text-sm font-medium text-blue-600 hover:text-blue-800">
                Forgot your password?
              </Link>
            </div>
          </form>
          <div className="text-center text-xs text-slate-400 dark:text-slate-500 mt-2">
            &copy; {new Date().getFullYear()} Work Radar
          </div>
        </div>
      </div>
      {/* Custom animations */}
      <style>
        {`
          @keyframes blob { 0% { transform: translate(0px, 0px) scale(1); } 33% { transform: translate(30px, -50px) scale(1.1); } 66% { transform: translate(-20px, 20px) scale(0.9); } 100% { transform: translate(0px, 0px) scale(1); } }
          .animate-blob { animation: blob 7s infinite; }
          .animation-delay-2000 { animation-delay: 2s; }
          .animation-delay-4000 { animation-delay: 4s; }
          .animate-bounce-slow {
            animation: bounce 2.5s infinite;
          }
          @keyframes bounce {
            0%, 100% { transform: translateY(0);}
            50% { transform: translateY(-10px);}
          }
          .animate-fade-in {
            animation: fadeIn 1.2s ease;
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px);}
            to { opacity: 1; transform: translateY(0);}
          }
          .hover\\:shadow-3xl:hover {
            box-shadow: 0 12px 32px 0 rgba(59,130,246,0.25), 0 1.5px 6px 0 rgba(99,102,241,0.10);
          }
        `}
      </style>
    </div>
  );
};

export default Login;