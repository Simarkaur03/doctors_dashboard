import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./AuthContext";
import Register from "./pages/Register";
import PatientLogin from "./pages/PatientLogin";
import ForgotPassword from "./pages/ForgotPassword";
import AdminLogin from "./pages/AdminLogin";
import ProtectedRoute from "./ProtectedRoute";

const PatientDashboard = () => <div><h2>Patient Dashboard (protected)</h2></div>;
const AdminDashboard = () => <div><h2>Admin Dashboard (protected)</h2></div>;

export default function AppRouter() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/patient/login" element={<PatientLogin />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/admin/login" element={<AdminLogin />} />

          <Route
            path="/patient/dashboard"
            element={
              <ProtectedRoute requiredRole="patient">
                <PatientDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<div>Public Home — go to /patient/login or /admin/login</div>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
