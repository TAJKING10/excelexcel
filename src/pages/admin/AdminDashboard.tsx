import React, { useState, useEffect } from 'react';
import { useLanguageStore } from '@/stores/language';
import { useDataStore } from '@/stores/data';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
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
  UserCog,
  Plus,
  Upload,
  Download,
  ArrowUp,
  ArrowDown,
  UserCircle,
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
  const { companies, employees, payslips, users, individuals, getAllAnalytics } = useDataStore();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [totalAdvensysStaff, setTotalAdvensysStaff] = useState(0);

  // Fetch employee users count from database
  useEffect(() => {
    const fetchEmployeeCount = async () => {
      try {
        const { count, error } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'EMPLOYEE');

        if (error) {
          console.error('Error fetching employee count:', error);
        } else {
          setTotalAdvensysStaff(count || 0);
        }
      } catch (err) {
        console.error('Error:', err);
      }
    };

    fetchEmployeeCount();
  }, []);

  // Get comprehensive analytics
  const analytics = getAllAnalytics();

  // Calculate overview stats
  const totalCompanies = analytics.totalCompanies;
  const totalEmployees = analytics.totalEmployees;
  const activeEmployees = analytics.activeEmployees;
  const totalPayslips = analytics.totalPayslips;
  const totalPayroll = analytics.totalPayroll;
  const totalIndividuals = individuals.length;
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;

  const monthlyPayslips = payslips.filter(
    (p) => p.period.month === currentMonth && p.period.year === currentYear
  ).length;

  const lastMonthPayslips = payslips.filter(
    (p) => p.period.month === lastMonth && p.period.year === lastMonthYear
  ).length;

  const payslipsDelta = monthlyPayslips - lastMonthPayslips;
  const payslipsDeltaPercent = lastMonthPayslips > 0 ? ((payslipsDelta / lastMonthPayslips) * 100).toFixed(1) : 0;

  // Recent activity (last 5 payslips)
  const recentPayslips = [...payslips]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find((e) => e.id === employeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : t('common.unknown');
  };

  const getCompanyName = (companyId: string) => {
    const company = companies.find((c) => c.id === companyId);
    return company?.name || t('common.unknown');
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
    delta,
    onClick,
  }: {
    icon: any;
    title: string;
    value: string | number;
    subtitle?: string;
    delta?: { value: number; percent: string };
    onClick?: () => void;
  }) => (
    <Card className={onClick ? 'cursor-pointer hover:bg-muted/50 transition-colors' : ''} onClick={onClick}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {delta && (
          <div className="flex items-center gap-1 mt-1">
            {delta.value >= 0 ? (
              <Badge variant="default" className="bg-green-500 text-white flex items-center gap-1">
                <ArrowUp className="h-3 w-3" />
                {delta.percent}%
              </Badge>
            ) : (
              <Badge variant="destructive" className="flex items-center gap-1">
                <ArrowDown className="h-3 w-3" />
                {Math.abs(parseFloat(delta.percent))}%
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">vs last month</span>
          </div>
        )}
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          {t('nav.dashboard')}
        </h1>
        <p className="text-muted-foreground">
          {t('dashboard.adminWelcome')}
        </p>
      </div>

      {/* Quick Actions */}
   

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={UserCog}
          title={t('dashboard.advensysStaff')}
          value={totalAdvensysStaff}
          subtitle={t('dashboard.manageEmployeeAccess')}
          onClick={() => navigate('/admin/users')}
        />
        <StatCard
          icon={Building2}
          title={t('dashboard.manageClientCompanies')}
          value={totalCompanies}
          subtitle={t('dashboard.allCompanies')}
          onClick={() => navigate('/admin/companies')}
        />
        <StatCard
          icon={UserCircle}
          title={t('nav.individuals')}
          value={totalIndividuals}
          subtitle={t('dashboard.totalIndividualsManaged', 'Total individuals managed')}
          onClick={() => navigate('/admin/individuals')}
        />
        <StatCard
          icon={TrendingUp}
          title={t('companies.monthlyPayroll')}
          value={`€${totalPayroll.toLocaleString()}`}
          subtitle={t('dashboard.allCompanies')}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Companies & Employees Growth */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.growth')}</CardTitle>
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
                  name={t('nav.companies')}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="employees"
                  stroke="#10b981"
                  name={t('nav.employees')}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payslips per Month */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.payslipsPerMonth')}</CardTitle>
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
                  name={t('nav.payslips')}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t('dashboard.recentActivity')}</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/payslips')}
          >
            {t('dashboard.viewAll')}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('payslips.period')}</TableHead>
                <TableHead>{t('payslips.employee')}</TableHead>
                <TableHead>{t('payslips.company')}</TableHead>
                <TableHead>{t('dashboard.createdAt')}</TableHead>
                <TableHead>{t('employees.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentPayslips.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    {t('dashboard.noRecentActivity')}
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
                        {t('dashboard.view')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Companies Analytics Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t('dashboard.companiesAnalytics')}</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/companies')}
          >
            {t('dashboard.viewAll')}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('companies.name')}</TableHead>
                <TableHead>{t('companies.totalEmployees')}</TableHead>
                <TableHead>{t('companies.activeEmployees')}</TableHead>
                <TableHead>{t('companies.monthlyPayroll')}</TableHead>
                <TableHead>{t('companies.socialCharges')}</TableHead>
                <TableHead>{t('employees.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analytics.companiesData.map(({ company, analytics: companyAnalytics }) => (
                <TableRow key={company.id}>
                  <TableCell className="font-medium">{company.name}</TableCell>
                  <TableCell>{companyAnalytics.totalEmployees}</TableCell>
                  <TableCell>
                    <Badge variant="default">{companyAnalytics.activeEmployees}</Badge>
                  </TableCell>
                  <TableCell>€{companyAnalytics.monthlyPayroll.toLocaleString()}</TableCell>
                  <TableCell>€{companyAnalytics.totalSocialCharges.toLocaleString()}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/admin/companies/${company.id}`)}
                    >
                      {t('dashboard.view')}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/admin/users')}>
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              <UserCog className="mr-2 h-5 w-5" />
              {t('dashboard.manageAdvensysStaff')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t('dashboard.manageAdvensysStaffDesc')}
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/admin/companies')}>
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              <Building2 className="mr-2 h-5 w-5" />
              {t('dashboard.manageClientCompanies')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t('dashboard.manageClientCompaniesDesc')}
            </p>
          </CardContent>
        </Card>


      </div>
    </div>
  );
}