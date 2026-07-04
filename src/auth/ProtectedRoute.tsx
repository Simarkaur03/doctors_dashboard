import React from "react";
import { useAuth } from "./AuthContext";

type Props = {
  requiredRole: "patient" | "admin";
  children: React.ReactElement;
};

export const ProtectedRoute: React.FC<Props> = ({ requiredRole, children }) => {
  const { user, role, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!user) return null;
  if (!role) return null;
  if (role !== requiredRole) return null;

  return children;
};

export default ProtectedRoute;
