import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

type Props = {
  requiredRole: "patient" | "admin";
  children: JSX.Element;
};

export const ProtectedRoute: React.FC<Props> = ({ requiredRole, children }) => {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div>Loading...</div>;

  if (!user) {
    const to = requiredRole === "admin" ? "/admin/login" : "/patient/login";
    return <Navigate to={to} state={{ from: location }} replace />;
  }

  if (!role) {
    // No role found: treat as unauthorized
    return <Navigate to={requiredRole === "admin" ? "/admin/login" : "/patient/login"} replace />;
  }

  if (role !== requiredRole) {
    // Redirect authenticated user to their dashboard based on their role
    const fallback = role === "admin" ? "/admin/dashboard" : "/patient/dashboard";
    return <Navigate to={fallback} replace />;
  }

  return children;
};

export default ProtectedRoute;
