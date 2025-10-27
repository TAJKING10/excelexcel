import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { User, UserAccess, Role } from '@/types';

type AuthContextType = {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  session: Session | null;
  loading: boolean;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  supabaseUser: null,
  session: null,
  loading: true,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let initialLoadComplete = false;

    // Fetch user profile from database
    const fetchUserProfile = async (userId: string): Promise<User | null> => {
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (profileError || !profile) {
          return null;
        }

        const { data: access, error: accessError } = await supabase
          .from('user_access')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        const userProfile: User = {
          id: profile.id,
          username: profile.username || profile.email.split('@')[0],
          email: profile.email,
          firstName: profile.first_name || '',
          lastName: profile.last_name || '',
          role: profile.role as Role,
          isActive: true,
          access: access
            ? {
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
              }
            : undefined,
        };

        return userProfile;
      } catch (err) {
        return null;
      }
    };

    // Listen to auth changes FIRST, before calling getSession
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;

      // Only process auth changes after initial load is complete
      // This prevents the race condition where SIGNED_IN fires before getSession completes
      if (!initialLoadComplete) {
        return;
      }

      setSession(newSession);

      if (newSession?.user) {
        const profile = await fetchUserProfile(newSession.user.id);
        if (mounted && profile) {
          setUser(profile);
        }
      } else {
        setUser(null);
      }
    });

    // Initialize session AFTER setting up listener
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();

        if (mounted) {
          const currentSession = data.session ?? null;
          setSession(currentSession);

          if (currentSession?.user) {
            const profile = await fetchUserProfile(currentSession.user.id);
            if (mounted && profile) {
              setUser(profile);
            }
          }
        }
      } catch (err) {
        // Silent error handling for production
      } finally {
        if (mounted) {
          initialLoadComplete = true;
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const value: AuthContextType = {
    user,
    supabaseUser: session?.user ?? null,
    session,
    loading,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
