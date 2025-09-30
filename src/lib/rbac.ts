import { Role } from '@/types';

// RBAC Rules
const rbacRules: Record<Role, string[]> = {
  SUPER_ADMIN: ['*'],
  COMPANY_ADMIN: [
    'dashboard',
    'company:read',
    'company:update',
    'employees:*',
    'payslips:*',
    'analytics:read',
  ],
  EMPLOYEE: ['self:*', 'payslips:self', 'profile:*'],
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
  // Admin routes
  if (path.startsWith('/admin')) {
    return role === 'SUPER_ADMIN';
  }

  // Company admin routes
  if (path.startsWith('/org')) {
    return role === 'SUPER_ADMIN' || role === 'COMPANY_ADMIN';
  }

  // Employee routes
  if (path.startsWith('/me')) {
    return true; // All authenticated users
  }

  // Dashboard accessible to all
  if (path === '/dashboard' || path === '/') {
    return true;
  }

  return false;
}

// Get default route for role
export function getDefaultRoute(role: Role): string {
  switch (role) {
    case 'SUPER_ADMIN':
      return '/admin/dashboard';
    case 'COMPANY_ADMIN':
      return '/org/dashboard';
    case 'EMPLOYEE':
      return '/me/dashboard';
    default:
      return '/';
  }
}