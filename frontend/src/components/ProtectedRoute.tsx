import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";

import { useAuth } from "../context/AuthContext";
import type { Role } from "../constants/roles";

type ProtectedRouteProps = {
  children: ReactNode;
  allowedRoles: Role[];
};

function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const { role, loading } = useAuth();

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;