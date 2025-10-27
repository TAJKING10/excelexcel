import { create } from 'zustand';
import { User, Role, UserAccess } from '@/types';
import { supabase } from '@/lib/supabase';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (userId: string, updates: Partial<User>) => void;
  fetchUserProfile: (userId: string) => Promise<void>;
  createUser: (email: string, password: string, userData: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  updateUserAccess: (userId: string, access: Partial<UserAccess>) => Promise<{ success: boolean; error?: string }>;
  deleteUser: (userId: string) => Promise<{ success: boolean; error?: string }>;
  getAllUsers: () => Promise<User[]>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (emailOrUsername: string, password: string) => {
    try {
      let email = emailOrUsername;

      // If input doesn't contain @, treat it as username and lookup email
      if (!emailOrUsername.includes('@')) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('username', emailOrUsername)
          .maybeSingle();
        if (profileError || !profile) {
          return false;
        }

        email = profile.email;
      }
      // Sign in with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !authData.user) {
        return false;
      }
      // Fetch user profile and access
      await get().fetchUserProfile(authData.user.id);
      return true;
    } catch (error) {
      return false;
    }
  },

  logout: async () => {
    try {
      await supabase.auth.signOut();
      set({ user: null, isAuthenticated: false });
    } catch (error) {
    }
  },

  fetchUserProfile: async (userId: string) => {
    try {
      // Fetch profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        set({ isLoading: false, isAuthenticated: false });
        return;
      }

      if (!profile) {
        set({ isLoading: false, isAuthenticated: false });
        return;
      }
      // Fetch user access
      const { data: access, error: accessError } = await supabase
        .from('user_access')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (accessError) {
      }
      // Map to User type
      const user: User = {
        id: profile.id,
        username: profile.username || profile.email.split('@')[0],
        email: profile.email,
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        role: profile.role as Role,
        isActive: true,
        access: access ? {
          companyIds: access.company_ids || [],
          individualIds: access.individual_ids || [],
          canViewPayslips: access.can_view_payslips,
          canEditPayslips: access.can_edit_payslips,
          canDeletePayslips: access.can_delete_payslips,
          canViewAnalytics: access.can_view_analytics,
          hasAllCompaniesAccess: access.has_all_companies_access,
          hasAllIndividualsAccess: access.has_all_individuals_access,
          canCreateCompanies: access.can_create_companies,
          canCreateIndividuals: access.can_create_individuals,
          canCreateEmployees: access.can_create_employees,
        } : undefined,
      };

      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
    }
  },

  updateUser: (userId: string, updates: Partial<User>) => {
    const currentUser = get().user;
    if (currentUser && currentUser.id === userId) {
      set({ user: { ...currentUser, ...updates } });
    }
  },

  createUser: async (email: string, password: string, userData: Partial<User>) => {
    try {
      // Create auth user (requires admin API or service role)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: userData.role || 'EMPLOYEE',
          },
        },
      });

      if (authError || !authData.user) {
        return { success: false, error: authError?.message || 'Failed to create user' };
      }

      // Update profile with additional data
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          username: userData.username,
          first_name: userData.firstName,
          last_name: userData.lastName,
          role: userData.role || 'EMPLOYEE',
        })
        .eq('id', authData.user.id);

      if (profileError) {
        return { success: false, error: profileError.message };
      }

      // Update access if provided
      if (userData.access) {
        const { error: accessError } = await supabase
          .from('user_access')
          .update({
            company_ids: userData.access.companyIds,
            individual_ids: userData.access.individualIds,
            can_view_payslips: userData.access.canViewPayslips,
            can_edit_payslips: userData.access.canEditPayslips,
            can_delete_payslips: userData.access.canDeletePayslips,
            can_view_analytics: userData.access.canViewAnalytics,
            has_all_companies_access: userData.access.hasAllCompaniesAccess,
            has_all_individuals_access: userData.access.hasAllIndividualsAccess,
            can_create_companies: userData.access.canCreateCompanies,
            can_create_individuals: userData.access.canCreateIndividuals,
            can_create_employees: userData.access.canCreateEmployees,
          })
          .eq('user_id', authData.user.id);

        if (accessError) {
          return { success: false, error: accessError.message };
        }
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  updateUserAccess: async (userId: string, access: Partial<UserAccess>) => {
    try {
      const { error } = await supabase
        .from('user_access')
        .update({
          company_ids: access.companyIds,
          individual_ids: access.individualIds,
          can_view_payslips: access.canViewPayslips,
          can_edit_payslips: access.canEditPayslips,
          can_delete_payslips: access.canDeletePayslips,
          can_view_analytics: access.canViewAnalytics,
          has_all_companies_access: access.hasAllCompaniesAccess,
          has_all_individuals_access: access.hasAllIndividualsAccess,
          can_create_companies: access.canCreateCompanies,
          can_create_individuals: access.canCreateIndividuals,
          can_create_employees: access.canCreateEmployees,
        })
        .eq('user_id', userId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  deleteUser: async (userId: string) => {
    try {
      // Delete from auth.users will cascade to profiles and user_access
      const { error } = await supabase.auth.admin.deleteUser(userId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  getAllUsers: async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*, user_access(*)');

      if (profilesError) {
        return [];
      }

      return profiles.map((profile: any) => ({
        id: profile.id,
        username: profile.username || profile.email.split('@')[0],
        email: profile.email,
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        role: profile.role as Role,
        isActive: true,
        access: profile.user_access ? {
          companyIds: profile.user_access.company_ids || [],
          individualIds: profile.user_access.individual_ids || [],
          canViewPayslips: profile.user_access.can_view_payslips,
          canEditPayslips: profile.user_access.can_edit_payslips,
          canDeletePayslips: profile.user_access.can_delete_payslips,
          canViewAnalytics: profile.user_access.can_view_analytics,
          hasAllCompaniesAccess: profile.user_access.has_all_companies_access,
          hasAllIndividualsAccess: profile.user_access.has_all_individuals_access,
          canCreateCompanies: profile.user_access.can_create_companies,
          canCreateIndividuals: profile.user_access.can_create_individuals,
          canCreateEmployees: profile.user_access.can_create_employees,
        } : undefined,
      }));
    } catch (error) {
      return [];
    }
  },
}));
