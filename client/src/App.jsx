import React from "react";
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import AdminDashboard from "./Admin/AdminDashboard";
import { Toaster } from "react-hot-toast";
import Login from "./Form/Login";
import { selectCurrentUser } from "./app/authSlice";
import EmployeeDashboard from "./Employee/EmployeDashboard";
import ResetPassword from "./Form/ResetPassword.jsx";
import ForgotPassword from "./Form/ForgotPassword.jsx";
import ManagerDashboard from "./Senior/ManagerDashboard"; 
import { useCheckAdminSetupQuery } from "./services/EmployeApi";
import AdminSetup from "./Form/AdminSetup";
import InactivityDetector from "./app/InactivityDetector";
import portalLogo from "./assets/portal_logo.png";

const AppLoader = () => (
  <div style={{
    position: 'fixed', inset: 0, zIndex: 9999,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '28px',
    background: 'linear-gradient(160deg, #1a0a35 0%, #2d1654 50%, #48306A 100%)',
  }}>
    <style>{`
      @keyframes app-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      @keyframes app-spin-r { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
      @keyframes app-pulse { 0%,100% { transform:scale(1); opacity:1; } 50% { transform:scale(1.1); opacity:0.85; } }
      @keyframes app-dot { 0%,100% { transform:translateY(0); opacity:0.5; } 50% { transform:translateY(-8px); opacity:1; } }
    `}</style>

    {/* Rings + logo */}
    <div style={{ position: 'relative', width: '140px', height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Outer ring */}
      <div style={{
        position: 'absolute', width: '140px', height: '140px', borderRadius: '50%',
        border: '2px solid transparent',
        borderTopColor: 'rgba(142,95,208,0.25)', borderLeftColor: 'rgba(192,132,252,0.2)',
        animation: 'app-spin-r 1.6s linear infinite',
      }} />
      {/* Inner ring */}
      <div style={{
        position: 'absolute', width: '112px', height: '112px', borderRadius: '50%',
        border: '3px solid transparent',
        borderTopColor: '#8E5FD0', borderRightColor: 'rgba(142,95,208,0.35)',
        animation: 'app-spin 1s linear infinite',
      }} />
      {/* Logo */}
      <img src={portalLogo} alt="Work Radar"
        style={{ width: '60px', height: '60px', objectFit: 'contain', position: 'relative', zIndex: 1,
          filter: 'drop-shadow(0 4px 20px rgba(142,95,208,0.6))',
          animation: 'app-pulse 1.8s ease-in-out infinite' }} />
    </div>

    {/* Brand name */}
    <div style={{ textAlign: 'center' }}>
      <p style={{ color: 'white', fontWeight: 800, fontSize: '20px', letterSpacing: '-0.01em', fontFamily: 'system-ui, sans-serif' }}>Work Radar</p>
      <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px', marginTop: '4px', fontFamily: 'system-ui, sans-serif' }}>Employee Portal</p>
    </div>

    {/* Dots */}
    <div style={{ display: 'flex', gap: '8px' }}>
      {[0, 0.2, 0.4].map((delay, i) => (
        <div key={i} style={{
          width: '6px', height: '6px', borderRadius: '50%',
          background: 'rgba(142,95,208,0.8)',
          animation: `app-dot 1.2s ease-in-out infinite`,
          animationDelay: `${delay}s`,
        }} />
      ))}
    </div>
  </div>
);

const hasDashboardAccess = (currentUser, expected) => {
  if (!currentUser) return false;

  const role = `${currentUser.role || ''}`.toLowerCase();
  const dashboardAccess = `${currentUser.dashboardAccess || ''}`.toLowerCase();

  if (expected === 'admin') {
    return dashboardAccess.includes('admin') || role === 'admin' || role === 'super admin' || role === 'super-admin';
  }

  if (expected === 'manager') {
    return dashboardAccess.includes('manager') || role === 'manager';
  }

  return dashboardAccess.includes('employee') || role === 'employee';
};

function App() {
  const user = useSelector(selectCurrentUser);
  const { data: setupData, isLoading, refetch } = useCheckAdminSetupQuery();

  const isAdminUser = hasDashboardAccess(user, 'admin');
  const isManagerUser = hasDashboardAccess(user, 'manager');
  const isEmployeeUser = hasDashboardAccess(user, 'employee');

  const getDefaultRoute = () => {
    if (!user) return '/login';
    if (isAdminUser) return '/admin-dashboard';
    if (isManagerUser) return '/manager-dashboard';
    if (isEmployeeUser) return '/employee-dashboard';
    return '/login';
  };

  if (isLoading) {
    return <AppLoader />;
  }

  if (setupData?.setupNeeded) {
    return <AdminSetup onSetupComplete={refetch} />;
  }

  return (
    <InactivityDetector>
      {/* CurrentUserProvider is now in main.jsx */}
      <Toaster position="top-right" />
      <Routes>
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/login" element={!user ? <Login /> : <Navigate to={getDefaultRoute()} />} />
        <Route
          path="/employee-dashboard"
          element={isEmployeeUser ? <EmployeeDashboard /> : <Navigate to={user ? getDefaultRoute() : '/login'} />}
        />
        <Route
          path="/manager-dashboard"
          element={isManagerUser ? <ManagerDashboard /> : <Navigate to={user ? getDefaultRoute() : '/login'} />}
        />
        <Route
          path="/admin-dashboard"
          element={isAdminUser ? <AdminDashboard /> : <Navigate to={user ? getDefaultRoute() : '/login'} />}
        />
        <Route 
          path="/*" 
          element={<Navigate to={getDefaultRoute()} />} 
        />
      </Routes>
    </InactivityDetector>
  );
}

export default App;