import { create } from 'zustand';
import { User, Role } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (userId: string, updates: Partial<User>) => void;
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
    username: 'employee',
    email: 'employee@advensys.lu',
    firstName: 'John',
    lastName: 'Doe',
    role: 'EMPLOYEE',
    access: {
      companyIds: ['company-1', 'company-2'], // Can manage these companies
      individualIds: ['ind-1'], // Can manage individual freelancers
      canViewPayslips: true,
      canEditPayslips: true,
      canDeletePayslips: true,
      canViewAnalytics: true,
    },
  },
  {
    id: '3',
    username: 'user1',
    email: 'user1@advensys.lu',
    firstName: 'Jane',
    lastName: 'Smith',
    role: 'EMPLOYEE',
    access: {
      companyIds: ['company-1'],
      individualIds: [],
      canViewPayslips: true,
      canEditPayslips: true,
      canDeletePayslips: false,
      canViewAnalytics: true,
    },
  },
];

export const useAuthStore = create<AuthState>((set, get) => ({
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
  updateUser: (userId: string, updates: Partial<User>) => {
    const currentUser = get().user;
    if (currentUser && currentUser.id === userId) {
      set({ user: { ...currentUser, ...updates } });
    }
  },
}));
