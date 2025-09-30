import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import { canAccessRoute, getDefaultRoute } from '@/lib/rbac';
import type { Role } from '@/types';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: Role | Role[];
  path?: string;
}

export function ProtectedRoute({ children, requiredRole, path }: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  // Check if user's role matches required role(s)
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!roles.includes(user.role)) {
      // Redirect to user's default route
      return <Navigate to={getDefaultRoute(user.role)} replace />;
    }
  }

  // Check if user can access the specific path
  if (path && !canAccessRoute(user.role, path)) {
    return <Navigate to={getDefaultRoute(user.role)} replace />;
  }

  return <>{children}</>;
}