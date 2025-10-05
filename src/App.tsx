import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from './stores/auth';
import { supabase } from './lib/supabase';
import { getDefaultRoute } from './lib/rbac';
import { ProtectedRoute } from './components/guards/ProtectedRoute';

// Layouts
import { AdminShell } from './components/layout/AdminShell';
import { UserShell } from './components/layout/UserShell';

// Pages - Admin
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { UserAccessManagement } from './pages/admin/UserAccessManagement';
import { ActivityLogViewer } from './pages/admin/ActivityLogViewer';
import CreatePayslip from './pages/admin/CreatePayslip';
import CreateAnnualPayslip from './pages/admin/CreateAnnualPayslip';
import { Individuals as AdminIndividuals } from './pages/admin/Individuals';
import { CompanyList } from './components/companies/CompanyList';
import { CompanyDetail } from './pages/CompanyDetail';
import { IndividualDetail } from './pages/IndividualDetail';
import { EmployeeList } from './components/employees/EmployeeList';
import { PayslipList } from './components/payslips/PayslipList';
import { AnnualPayslipList } from './components/payslips/AnnualPayslipList';
import Explorer from './pages/payslips/Explorer';

// Pages - Employee
import { EmployeeDashboard } from './pages/employee/EmployeeDashboard';
import { Payslips } from './pages/employee/Payslips';
import { Profile } from './pages/employee/Profile';

// Annual Payslips
import AnnualPayslipPage from './pages/AnnualPayslipPage';

// Auth
import LoginPage from './pages/LoginPage';

function App() {
  const { isAuthenticated, user, isLoading, fetchUserProfile } = useAuthStore();
  const { i18n } = useTranslation();

  useEffect(() => {
    // Set default language
    i18n.changeLanguage('fr');

    // Check for existing session
    const checkSession = async () => {
      console.log('Checking session...');
      const { data: { session }, error } = await supabase.auth.getSession();
      console.log('Session:', session, 'Error:', error);

      if (session?.user) {
        await fetchUserProfile(session.user.id);
      } else {
        // No session, set loading to false
        useAuthStore.setState({ isLoading: false });
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session);
      if (event === 'SIGNED_IN' && session?.user) {
        await fetchUserProfile(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        // Session will be cleared by logout function
      }
    });

    return () => subscription.unsubscribe();
  }, [i18n, fetchUserProfile]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <LoginPage />;
  }

  // Redirect to role-specific default route
  const defaultRoute = getDefaultRoute(user.role);

  return (
    <Router>
      <Routes>
        {/* SUPER_ADMIN Routes */}
        {user.role === 'SUPER_ADMIN' && (
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute requiredRole="SUPER_ADMIN" path="/admin">
                <AdminShell />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="companies" element={<CompanyList />} />
            <Route path="companies/:companyId" element={<CompanyDetail />} />
            <Route path="individuals" element={<AdminIndividuals />} />
            <Route path="individuals/:individualId" element={<IndividualDetail />} />
            <Route path="individuals/:individualId/annual-payslip" element={<AnnualPayslipPage />} />
            <Route path="employees" element={<EmployeeList />} />
            <Route path="employees/:employeeId/annual-payslip" element={<AnnualPayslipPage />} />
            <Route path="payslips" element={<PayslipList />} />
            <Route path="payslips/annual" element={<AnnualPayslipList />} />
            <Route path="payslips/create" element={<CreatePayslip />} />
            <Route path="payslips/create-annual" element={<CreateAnnualPayslip />} />
            <Route path="payslips/create-annual/:employeeId" element={<CreateAnnualPayslip />} />
            <Route path="payslips/explorer" element={<Explorer />} />
            <Route path="users" element={<UserAccessManagement />} />
            <Route path="activity-log" element={<ActivityLogViewer />} />
            <Route path="settings" element={<div className="p-6">Settings (Coming Soon)</div>} />
          </Route>
        )}

        {/* EMPLOYEE Routes (Advensys staff) */}
        {user.role === 'EMPLOYEE' && (
          <Route
            path="/*"
            element={<UserShell />}
          >
            <Route index element={<EmployeeDashboard />} />
            <Route path="dashboard" element={<EmployeeDashboard />} />
            <Route path="companies/:companyId" element={<CompanyDetail />} />
            <Route path="individuals/:individualId" element={<IndividualDetail />} />
            <Route path="individuals/:individualId/annual-payslip" element={<AnnualPayslipPage />} />
            <Route path="employees/:employeeId/annual-payslip" element={<AnnualPayslipPage />} />
            <Route path="payslips" element={<Payslips />} />
            <Route path="profile" element={<Profile />} />
            <Route path="admin/payslips/create" element={<CreatePayslip />} />
            <Route path="admin/payslips/create-annual" element={<CreateAnnualPayslip />} />
            <Route path="admin/payslips/create-annual/:employeeId" element={<CreateAnnualPayslip />} />
            <Route path="payslips/create" element={<CreatePayslip />} />
            <Route path="payslips/create-annual" element={<CreateAnnualPayslip />} />
            <Route path="payslips/create-annual/:employeeId" element={<CreateAnnualPayslip />} />
          </Route>
        )}

        {/* COMPANY_ADMIN Routes removed */}

        {/* Root redirect */}
        <Route path="*" element={<Navigate to={defaultRoute} replace />} />
      </Routes>
    </Router>
  );
}

export default App;