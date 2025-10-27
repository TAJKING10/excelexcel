import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { getDefaultRoute } from './lib/rbac';
import { ProtectedRoute } from './components/guards/ProtectedRoute2';
import { useDataStore } from './stores/data';

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
import { IndividualPayslip } from './pages/admin/IndividualPayslip';
import { Settings as AdminSettings } from './pages/admin/Settings';
import TaxManagement from './pages/admin/TaxManagement';
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
import MonthlyPayslipPage from './pages/MonthlyPayslipPage';

// Auth
import LoginPage from './pages/LoginPage';

function AppRoutes() {
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const initializeData = useDataStore((state) => state.initializeData);

  useEffect(() => {
    i18n.changeLanguage('fr');
  }, [i18n]);

  // Initialize data from Supabase when user is authenticated
  useEffect(() => {
    if (user) {
      initializeData();
    }
  }, [user, initializeData]);

  const defaultRoute = user ? getDefaultRoute(user.role) : '/login';

  return (
    <Routes>
      {/* Auth routes - always available */}
      <Route path="/login" element={<LoginPage />} />

      {/* Root redirect - redirect based on role */}
      <Route
        path="/"
        element={
          user ? (
            <Navigate to={defaultRoute} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* SUPER_ADMIN Routes */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute requiredRole="SUPER_ADMIN">
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
        <Route path="individuals/:individualId/payslip" element={<IndividualPayslip />} />
        <Route path="individuals/:individualId/payslip/:payslipId" element={<IndividualPayslip />} />
        <Route path="individuals/:individualId/annual-payslip" element={<AnnualPayslipPage />} />
        <Route path="individuals/:individualId/monthly-payslip" element={<MonthlyPayslipPage />} />
        <Route path="employees" element={<EmployeeList />} />
        <Route path="employees/:employeeId/annual-payslip" element={<AnnualPayslipPage />} />
        <Route path="employees/:employeeId/monthly-payslip" element={<MonthlyPayslipPage />} />
        <Route path="payslips" element={<PayslipList />} />
        <Route path="payslips/annual" element={<AnnualPayslipList />} />
        <Route path="payslips/create" element={<CreatePayslip />} />
        <Route path="payslips/create-annual" element={<CreateAnnualPayslip />} />
        <Route path="payslips/create-annual/:employeeId" element={<CreateAnnualPayslip />} />
        <Route path="payslips/explorer" element={<Explorer />} />
        <Route path="users" element={<UserAccessManagement />} />
        <Route path="activity-log" element={<ActivityLogViewer />} />
        <Route path="tax-management" element={<TaxManagement />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      {/* EMPLOYEE Routes */}
      <Route
        path="/employee/*"
        element={
          <ProtectedRoute requiredRole="EMPLOYEE">
            <UserShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/employee/dashboard" replace />} />
        <Route path="dashboard" element={<EmployeeDashboard />} />
        <Route path="companies/:companyId" element={<CompanyDetail />} />
        <Route path="individuals/:individualId" element={<IndividualDetail />} />
        <Route path="individuals/:individualId/annual-payslip" element={<AnnualPayslipPage />} />
        <Route path="individuals/:individualId/monthly-payslip" element={<MonthlyPayslipPage />} />
        <Route path="employees/:employeeId/annual-payslip" element={<AnnualPayslipPage />} />
        <Route path="employees/:employeeId/monthly-payslip" element={<MonthlyPayslipPage />} />
        <Route path="payslips" element={<Payslips />} />
        <Route path="profile" element={<Profile />} />
        <Route path="payslips/create" element={<CreatePayslip />} />
        <Route path="payslips/create-annual" element={<CreateAnnualPayslip />} />
        <Route path="payslips/create-annual/:employeeId" element={<CreateAnnualPayslip />} />
        <Route path="settings" element={<Profile />} />
      </Route>

      {/* Root redirect */}
      <Route path="*" element={<Navigate to={defaultRoute} replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;