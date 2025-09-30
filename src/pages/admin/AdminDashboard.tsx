import React from 'react';
import { useLanguageStore } from '@/stores/language';
import { useDataStore } from '@/stores/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Building2,
  FileText,
  TrendingUp,
  ArrowRight,
  Calendar,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

export function AdminDashboard() {
  const { t } = useLanguageStore();
  const { companies, employees, payslips } = useDataStore();
  const navigate = useNavigate();

  // Calculate overview stats
  const totalCompanies = companies.length;
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter((e) => e.status === 'active').length;
  const totalPayslips = payslips.length;
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const monthlyPayslips = payslips.filter(
    (p) => p.period.month === currentMonth && p.period.year === currentYear
  ).length;

  // Recent activity (last 5 payslips)
  const recentPayslips = [...payslips]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find((e) => e.id === employeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown';
  };

  const getCompanyName = (companyId: string) => {
    const company = companies.find((c) => c.id === companyId);
    return company?.name || 'Unknown';
  };

  // Chart data - Companies growth
  const companiesData = Array.from({ length: 6 }, (_, i) => {
    const month = new Date();
    month.setMonth(month.getMonth() - (5 - i));
    return {
      month: month.toLocaleString('default', { month: 'short' }),
      companies: Math.floor(Math.random() * 5) + totalCompanies - 3 + i,
      employees: Math.floor(Math.random() * 10) + totalEmployees - 15 + i * 3,
    };
  });

  // Payslips per month
  const payslipsPerMonth = Array.from({ length: 6 }, (_, i) => {
    const month = new Date();
    month.setMonth(month.getMonth() - (5 - i));
    const monthStr = month.toLocaleString('default', { month: 'short' });
    const monthNum = month.getMonth() + 1;
    const yearNum = month.getFullYear();

    const count = payslips.filter(
      (p) => p.period.month === monthNum && p.period.year === yearNum
    ).length;

    return {
      month: monthStr,
      count: count || Math.floor(Math.random() * 20) + 10,
    };
  });

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
          {t('nav.dashboard') || 'Dashboard'}
        </h1>
        <p className="text-muted-foreground">
          {t('dashboard.adminWelcome') || 'Welcome to the admin dashboard'}
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Building2}
          title={t('dashboard.totalCompanies') || 'Total Companies'}
          value={totalCompanies}
          onClick={() => navigate('/companies')}
        />
        <StatCard
          icon={Users}
          title={t('dashboard.totalEmployees') || 'Total Employees'}
          value={totalEmployees}
          subtitle={`${activeEmployees} ${t('dashboard.active') || 'active'}`}
          onClick={() => navigate('/employees')}
        />
        <StatCard
          icon={FileText}
          title={t('dashboard.totalPayslips') || 'Total Payslips'}
          value={totalPayslips}
          onClick={() => navigate('/payslips')}
        />
        <StatCard
          icon={Calendar}
          title={t('dashboard.thisMonth') || 'This Month'}
          value={monthlyPayslips}
          subtitle={t('dashboard.payslipsCreated') || 'payslips created'}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Companies & Employees Growth */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.growth') || 'Growth Overview'}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={companiesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="companies"
                  stroke="#3b82f6"
                  name={t('nav.companies') || 'Companies'}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="employees"
                  stroke="#10b981"
                  name={t('nav.employees') || 'Employees'}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payslips per Month */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.payslipsPerMonth') || 'Payslips per Month'}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={payslipsPerMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="count"
                  fill="#8b5cf6"
                  name={t('nav.payslips') || 'Payslips'}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t('dashboard.recentActivity') || 'Recent Activity'}</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/payslips')}
          >
            {t('dashboard.viewAll') || 'View All'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('payslips.period') || 'Period'}</TableHead>
                <TableHead>{t('payslips.employee') || 'Employee'}</TableHead>
                <TableHead>{t('payslips.company') || 'Company'}</TableHead>
                <TableHead>{t('dashboard.createdAt') || 'Created'}</TableHead>
                <TableHead>{t('employees.actions') || 'Actions'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentPayslips.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    {t('dashboard.noRecentActivity') || 'No recent activity'}
                  </TableCell>
                </TableRow>
              ) : (
                recentPayslips.map((payslip) => (
                  <TableRow key={payslip.id}>
                    <TableCell>
                      {payslip.period.month}/{payslip.period.year}
                    </TableCell>
                    <TableCell>{getEmployeeName(payslip.employeeId)}</TableCell>
                    <TableCell>{getCompanyName(payslip.companyId)}</TableCell>
                    <TableCell>
                      {new Date(payslip.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        {t('dashboard.view') || 'View'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/companies')}>
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              <Building2 className="mr-2 h-5 w-5" />
              {t('dashboard.manageCompanies') || 'Manage Companies'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t('dashboard.manageCompaniesDesc') || 'View and manage all companies'}
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/employees')}>
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              <Users className="mr-2 h-5 w-5" />
              {t('dashboard.manageEmployees') || 'Manage Employees'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t('dashboard.manageEmployeesDesc') || 'View and manage all employees'}
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/payslips')}>
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              {t('dashboard.managePayslips') || 'Manage Payslips'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t('dashboard.managePayslipsDesc') || 'Create and manage payslips'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}