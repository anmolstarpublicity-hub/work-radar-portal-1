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

function App() {
  const user = useSelector(selectCurrentUser);
  const { data: setupData, isLoading, refetch } = useCheckAdminSetupQuery();

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
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
        <Route path="/login" element={!user ? <Login /> : <Navigate to={
          user.dashboardAccess === 'Admin Dashboard' ? '/admin-dashboard' :
          user.dashboardAccess === 'Manager Dashboard' ? '/manager-dashboard' :
          '/employee-dashboard'
        } />} />
        <Route
          path="/employee-dashboard"
          element={user && user.dashboardAccess === 'Employee Dashboard' ? <EmployeeDashboard /> : <Navigate to="/login" />}
        />
        <Route
          path="/manager-dashboard"
          element={user && user.dashboardAccess === 'Manager Dashboard' ? <ManagerDashboard /> : <Navigate to="/login" />}
        />
        <Route
          path="/admin-dashboard"
          element={user && user.dashboardAccess === 'Admin Dashboard' ? <AdminDashboard /> : <Navigate to="/login" />}
        />
        <Route 
          path="/*" 
          element={<Navigate to={!user ? "/login" : user.dashboardAccess === 'Admin Dashboard' ? "/admin-dashboard" : user.dashboardAccess === 'Manager Dashboard' ? '/manager-dashboard' : "/employee-dashboard"} />} 
        />
      </Routes>
    </InactivityDetector>
  );
}

export default App;