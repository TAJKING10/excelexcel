import { create } from 'zustand';
import { User, Role } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const mockUsers: User[] = [
  {
    id: '1',
    username: 'SuperAdmin',
    email: 'admin@advensys.lu',
    firstName: 'Super',
    lastName: 'Admin',
    role: 'SUPER_ADMIN',
  },
  {
    id: '2',
    username: 'companyadmin',
    email: 'companyadmin@advensys.lu',
    firstName: 'Company',
    lastName: 'Manager',
    role: 'COMPANY_ADMIN',
    companyId: 'company-1',
  },
  {
    id: '3',
    username: 'employee',
    email: 'employee@advensys.lu',
    firstName: 'John',
    lastName: 'Doe',
    role: 'EMPLOYEE',
    companyId: 'company-1',
    employeeId: 'emp-1',
  },
];

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  login: async (username: string, password: string) => {
    // Mock authentication - in production, this would be an API call
    const user = mockUsers.find(
      (u) => u.username.toLowerCase() === username.toLowerCase() && password === username
    );

    if (user) {
      set({ user, isAuthenticated: true });
      return true;
    }

    return false;
  },
  logout: () => {
    set({ user: null, isAuthenticated: false });
  },
}));
