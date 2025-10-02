import { Role } from '@/types';

// RBAC Rules
const rbacRules: Record<Role, string[]> = {
  SUPER_ADMIN: ['*'],
  EMPLOYEE: [
    'dashboard',
    'companies:*',
    'payslips:*',
    'analytics:read',
  ],
};

// Check if role can access resource
export function canAccess(role: Role, resource: string): boolean {
  const allowed = rbacRules[role] || [];

  // SUPER_ADMIN has access to everything
  if (allowed.includes('*')) {
    return true;
  }

  // Check for exact match or wildcard match
  return allowed.some(rule => {
    if (rule === resource) return true;
    if (rule.endsWith(':*')) {
      const prefix = rule.slice(0, -2);
      return resource.startsWith(prefix);
    }
    return false;
  });
}

// Route access checks
export function canAccessRoute(role: Role, path: string): boolean {
  // Admin routes - only super admin
  if (path.startsWith('/admin')) {
    return role === 'SUPER_ADMIN';
  }

  // Employee routes - accessible to all authenticated users
  if (path === '/dashboard' || path === '/' || path.startsWith('/companies') || path.startsWith('/payslips')) {
    return true;
  }

  return false;
}

// Get default route for role
export function getDefaultRoute(role: Role): string {
  switch (role) {
    case 'SUPER_ADMIN':
      return '/admin/dashboard';
    case 'EMPLOYEE':
      return '/dashboard';
    default:
      return '/dashboard';
  }
}