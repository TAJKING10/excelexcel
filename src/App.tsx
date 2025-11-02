import { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { getDefaultRoute } from './lib/rbac';
import { ProtectedRoute } from './components/guards/ProtectedRoute2';
import { useDataStore } from './stores/data';
import { LoadingScreen, PageLoadingScreen } from './components/ui/loading-screen';

// Layouts - not lazy loaded for better UX
import { AdminShell } from './components/layout/AdminShell';
import { UserShell } from './components/layout/UserShell';

// Auth - not lazy loaded for immediate access
import LoginPage from './pages/LoginPage';

// Lazy load all pages for better performance
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const UserAccessManagement = lazy(() => import('./pages/admin/UserAccessManagement').then(m => ({ default: m.UserAccessManagement })));
const ActivityLogViewer = lazy(() => import('./pages/admin/ActivityLogViewer').then(m => ({ default: m.ActivityLogViewer })));
const CreatePayslip = lazy(() => import('./pages/admin/CreatePayslip'));
const CreateAnnualPayslip = lazy(() => import('./pages/admin/CreateAnnualPayslip'));
const AdminIndividuals = lazy(() => import('./pages/admin/Individuals').then(m => ({ default: m.Individuals })));
const IndividualPayslip = lazy(() => import('./pages/admin/IndividualPayslip').then(m => ({ default: m.IndividualPayslip })));
const AdminSettings = lazy(() => import('./pages/admin/Settings').then(m => ({ default: m.Settings })));
const TaxManagement = lazy(() => import('./pages/admin/TaxManagement'));
const CompanyList = lazy(() => import('./components/companies/CompanyList').then(m => ({ default: m.CompanyList })));
const CompanyDetail = lazy(() => import('./pages/CompanyDetail').then(m => ({ default: m.CompanyDetail })));
const IndividualDetail = lazy(() => import('./pages/IndividualDetail').then(m => ({ default: m.IndividualDetail })));
const EmployeeList = lazy(() => import('./components/employees/EmployeeList').then(m => ({ default: m.EmployeeList })));
const PayslipList = lazy(() => import('./components/payslips/PayslipList').then(m => ({ default: m.PayslipList })));
const AnnualPayslipList = lazy(() => import('./components/payslips/AnnualPayslipList').then(m => ({ default: m.AnnualPayslipList })));
const Explorer = lazy(() => import('./pages/payslips/Explorer'));
const EmployeeDashboard = lazy(() => import('./pages/employee/EmployeeDashboard').then(m => ({ default: m.EmployeeDashboard })));
const Payslips = lazy(() => import('./pages/employee/Payslips').then(m => ({ default: m.Payslips })));
const Profile = lazy(() => import('./pages/employee/Profile').then(m => ({ default: m.Profile })));
const AnnualPayslipPage = lazy(() => import('./pages/AnnualPayslipPage'));
const MonthlyPayslipPage = lazy(() => import('./pages/MonthlyPayslipPage'));

// Suspense wrapper helper - invisible fallback for instant feel
const SuspenseRoute = ({ children }: { children: React.ReactNode; message?: string }) => (
  <Suspense fallback={<div className="min-h-screen" />}>
    {children}
  </Suspense>
);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Only re-run when user changes, not when initializeData changes

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
        <Route path="dashboard" element={<SuspenseRoute><AdminDashboard /></SuspenseRoute>} />
        <Route path="companies" element={<SuspenseRoute><CompanyList /></SuspenseRoute>} />
        <Route path="companies/:companyId" element={<SuspenseRoute><CompanyDetail /></SuspenseRoute>} />
        <Route path="individuals" element={<SuspenseRoute><AdminIndividuals /></SuspenseRoute>} />
        <Route path="individuals/:individualId" element={<SuspenseRoute><IndividualDetail /></SuspenseRoute>} />
        <Route path="individuals/:individualId/payslip" element={<SuspenseRoute><IndividualPayslip /></SuspenseRoute>} />
        <Route path="individuals/:individualId/payslip/:payslipId" element={<SuspenseRoute><IndividualPayslip /></SuspenseRoute>} />
        <Route path="individuals/:individualId/annual-payslip" element={<SuspenseRoute><AnnualPayslipPage /></SuspenseRoute>} />
        <Route path="individuals/:individualId/monthly-payslip" element={<SuspenseRoute><MonthlyPayslipPage /></SuspenseRoute>} />
        <Route path="employees" element={<SuspenseRoute><EmployeeList /></SuspenseRoute>} />
        <Route path="employees/:employeeId/annual-payslip" element={<SuspenseRoute><AnnualPayslipPage /></SuspenseRoute>} />
        <Route path="employees/:employeeId/monthly-payslip" element={<SuspenseRoute><MonthlyPayslipPage /></SuspenseRoute>} />
        <Route path="payslips" element={<SuspenseRoute><PayslipList /></SuspenseRoute>} />
        <Route path="payslips/annual" element={<SuspenseRoute><AnnualPayslipList /></SuspenseRoute>} />
        <Route path="payslips/create" element={<SuspenseRoute><CreatePayslip /></SuspenseRoute>} />
        <Route path="payslips/create-annual" element={<SuspenseRoute><CreateAnnualPayslip /></SuspenseRoute>} />
        <Route path="payslips/create-annual/:employeeId" element={<SuspenseRoute><CreateAnnualPayslip /></SuspenseRoute>} />
        <Route path="payslips/explorer" element={<SuspenseRoute><Explorer /></SuspenseRoute>} />
        <Route path="users" element={<SuspenseRoute><UserAccessManagement /></SuspenseRoute>} />
        <Route path="activity-log" element={<SuspenseRoute><ActivityLogViewer /></SuspenseRoute>} />
        <Route path="tax-management" element={<SuspenseRoute><TaxManagement /></SuspenseRoute>} />
        <Route path="settings" element={<SuspenseRoute><AdminSettings /></SuspenseRoute>} />
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
        <Route path="dashboard" element={<SuspenseRoute><EmployeeDashboard /></SuspenseRoute>} />
        <Route path="companies/:companyId" element={<SuspenseRoute><CompanyDetail /></SuspenseRoute>} />
        <Route path="individuals/:individualId" element={<SuspenseRoute><IndividualDetail /></SuspenseRoute>} />
        <Route path="individuals/:individualId/annual-payslip" element={<SuspenseRoute><AnnualPayslipPage /></SuspenseRoute>} />
        <Route path="individuals/:individualId/monthly-payslip" element={<SuspenseRoute><MonthlyPayslipPage /></SuspenseRoute>} />
        <Route path="employees/:employeeId/annual-payslip" element={<SuspenseRoute><AnnualPayslipPage /></SuspenseRoute>} />
        <Route path="employees/:employeeId/monthly-payslip" element={<SuspenseRoute><MonthlyPayslipPage /></SuspenseRoute>} />
        <Route path="payslips" element={<SuspenseRoute><Payslips /></SuspenseRoute>} />
        <Route path="profile" element={<SuspenseRoute><Profile /></SuspenseRoute>} />
        <Route path="payslips/create" element={<SuspenseRoute><CreatePayslip /></SuspenseRoute>} />
        <Route path="payslips/create-annual" element={<SuspenseRoute><CreateAnnualPayslip /></SuspenseRoute>} />
        <Route path="payslips/create-annual/:employeeId" element={<SuspenseRoute><CreateAnnualPayslip /></SuspenseRoute>} />
        <Route path="settings" element={<SuspenseRoute><Profile /></SuspenseRoute>} />
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