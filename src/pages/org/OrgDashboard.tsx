import React from 'react';
import { useLanguageStore } from '@/stores/language';
import { useDataStore } from '@/stores/data';
import { useAuthStore } from '@/stores/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  CreditCard,
  TrendingUp,
  ArrowRight,
  Calendar,
  Download,
  FileSpreadsheet,
  Plus,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

export function OrgDashboard() {
  const { t } = useLanguageStore();
  const { user } = useAuthStore();
  const { companies, employees, payslips, getCompanyAnalytics } = useDataStore();
  const navigate = useNavigate();

  // Get company data for the logged-in user
  const companyId = user?.companyId;

  if (!companyId) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">
          {t('dashboard.noCompany') || 'No company associated with your account'}
        </p>
      </div>
    );
  }

  const company = companies.find((c) => c.id === companyId);
  const analytics = getCompanyAnalytics(companyId);
  const companyEmployees = employees.filter((e) => e.companyId === companyId);
  const companyPayslips = payslips.filter((p) => p.companyId === companyId);

  // Recent payslips (last 5)
  const recentPayslips = [...companyPayslips]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find((e) => e.id === employeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown';
  };

  // Current month stats
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const currentMonthPayslips = companyPayslips.filter(
    (p) => p.period.month === currentMonth && p.period.year === currentYear
  );
  const currentMonthPayroll = currentMonthPayslips.reduce(
    (sum, p) => sum + p.earnings.grossMonthly,
    0
  );

  const StatCard = ({
    icon: Icon,
    title,
    value,
    subtitle,
    onClick,
  }: {
    icon: any;
    title: string;
    value: string | number;
    subtitle?: string;
    onClick?: () => void;
  }) => (
    <Card className={onClick ? 'cursor-pointer hover:bg-muted/50 transition-colors' : ''} onClick={onClick}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          {company?.name || t('nav.dashboard') || 'Dashboard'}
        </h1>
        <p className="text-muted-foreground">
          {t('dashboard.orgWelcome') || 'Company dashboard overview'}
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          title={t('dashboard.totalEmployees') || 'Total Employees'}
          value={analytics.totalEmployees}
          subtitle={`${analytics.activeEmployees} ${t('dashboard.active') || 'active'}`}
          onClick={() => navigate('/employees')}
        />
        <StatCard
          icon={Users}
          title={t('dashboard.activeEmployees') || 'Active Employees'}
          value={analytics.activeEmployees}
        />
        <StatCard
          icon={CreditCard}
          title={t('dashboard.monthlyPayroll') || 'Monthly Payroll'}
          value={`${company?.currency || 'EUR'} ${currentMonthPayroll.toLocaleString()}`}
          subtitle={t('dashboard.currentMonth') || 'Current month'}
        />
        <StatCard
          icon={TrendingUp}
          title={t('dashboard.socialCharges') || 'Social Charges'}
          value={`${company?.currency || 'EUR'} ${analytics.totalSocialCharges.toLocaleString()}`}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Net vs Gross */}
        <Card>
          <CardHeader>
            <CardTitle>{t('analytics.netVsGross') || 'Net vs Gross Salary'}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.netVsGross.slice(-6)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="gross"
                  stroke="#3b82f6"
                  name={t('analytics.gross') || 'Gross'}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="net"
                  stroke="#10b981"
                  name={t('analytics.net') || 'Net'}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Contributions */}
        <Card>
          <CardHeader>
            <CardTitle>{t('analytics.contributions') || 'Social Contributions'}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.contributions.slice(-6)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="maladie"
                  stackId="a"
                  fill="#3b82f6"
                  name={t('analytics.maladie') || 'Health'}
                />
                <Bar
                  dataKey="pension"
                  stackId="a"
                  fill="#8b5cf6"
                  name={t('analytics.pension') || 'Pension'}
                />
                <Bar
                  dataKey="sante"
                  stackId="a"
                  fill="#10b981"
                  name={t('analytics.sante') || 'Health Care'}
                />
                <Bar
                  dataKey="accident"
                  stackId="a"
                  fill="#f59e0b"
                  name={t('analytics.accident') || 'Accident'}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Payslips */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t('dashboard.recentPayslips') || 'Recent Payslips'}</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/payslips')}
            >
              {t('dashboard.viewAll') || 'View All'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="sm" onClick={() => navigate('/payslips/create')}>
              <Plus className="mr-2 h-4 w-4" />
              {t('payslips.create') || 'Create Payslip'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentPayslips.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {t('dashboard.noPayslips') || 'No payslips found'}
              </p>
              <Button className="mt-4" onClick={() => navigate('/payslips/create')}>
                <Plus className="mr-2 h-4 w-4" />
                {t('payslips.createFirst') || 'Create your first payslip'}
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('payslips.period') || 'Period'}</TableHead>
                  <TableHead>{t('payslips.employee') || 'Employee'}</TableHead>
                  <TableHead>{t('payslips.gross') || 'Gross'}</TableHead>
                  <TableHead>{t('payslips.net') || 'Net'}</TableHead>
                  <TableHead>{t('dashboard.createdAt') || 'Created'}</TableHead>
                  <TableHead>{t('employees.actions') || 'Actions'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentPayslips.map((payslip) => (
                  <TableRow key={payslip.id}>
                    <TableCell>
                      {payslip.period.month}/{payslip.period.year}
                    </TableCell>
                    <TableCell>{getEmployeeName(payslip.employeeId)}</TableCell>
                    <TableCell>
                      {company?.currency || 'EUR'} {payslip.earnings.grossMonthly.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {company?.currency || 'EUR'} {payslip.netPay.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {new Date(payslip.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="ghost">
                          <Download size={14} />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <FileSpreadsheet size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/employees')}>
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              <Users className="mr-2 h-5 w-5" />
              {t('dashboard.manageEmployees') || 'Manage Employees'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t('dashboard.manageEmployeesDesc') || 'View and manage your employees'}
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/payslips')}>
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              <CreditCard className="mr-2 h-5 w-5" />
              {t('dashboard.managePayslips') || 'Manage Payslips'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t('dashboard.managePayslipsDesc') || 'Create and view payslips'}
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate(`/companies/${companyId}`)}>
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              <TrendingUp className="mr-2 h-5 w-5" />
              {t('dashboard.viewAnalytics') || 'View Analytics'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t('dashboard.viewAnalyticsDesc') || 'View detailed company analytics'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}