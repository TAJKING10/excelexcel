import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from './stores/auth';
import { getDefaultRoute } from './lib/rbac';
import { ProtectedRoute } from './components/guards/ProtectedRoute';

// Layouts
import { AdminShell } from './components/layout/AdminShell';
import { UserShell } from './components/layout/UserShell';

// Pages - Admin
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { UserAccessManagement } from './pages/admin/UserAccessManagement';
import { CreatePayslip } from './pages/admin/CreatePayslip';
import { Individuals as AdminIndividuals } from './pages/admin/Individuals';
import { CompanyList } from './components/companies/CompanyList';
import { CompanyDetail } from './pages/CompanyDetail';
import { IndividualDetail } from './pages/IndividualDetail';
import { EmployeeList } from './components/employees/EmployeeList';
import { PayslipList } from './components/payslips/PayslipList';

// Pages - Employee
import { EmployeeDashboard } from './pages/employee/EmployeeDashboard';
import { Payslips } from './pages/employee/Payslips';
import { Profile } from './pages/employee/Profile';

// Annual Payslips
import AnnualPayslipPage from './pages/AnnualPayslipPage';

// Auth
import LoginPage from './pages/LoginPage';

function App() {
  const { isAuthenticated, user } = useAuthStore();
  const { i18n } = useTranslation();

  useEffect(() => {
    // Set default language
    i18n.changeLanguage('fr');
  }, [i18n]);

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
            <Route path="employees" element={<EmployeeList />} />
            <Route path="employees/:employeeId/annual-payslip" element={<AnnualPayslipPage />} />
            <Route path="payslips" element={<PayslipList />} />
            <Route path="payslips/create" element={<CreatePayslip />} />
            <Route path="users" element={<UserAccessManagement />} />
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
            <Route path="payslips" element={<Payslips />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        )}

        {/* Root redirect */}
        <Route path="*" element={<Navigate to={defaultRoute} replace />} />
      </Routes>
    </Router>
  );
}

export default App;