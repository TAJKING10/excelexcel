import React from 'react';
import { useLanguageStore } from '@/stores/language';
import { useDataStore } from '@/stores/data';
import { useAuthStore } from '@/stores/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  User,
  CreditCard,
  Download,
  FileSpreadsheet,
  Calendar,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';

export function EmployeeDashboard() {
  const { t } = useLanguageStore();
  const { user } = useAuthStore();
  const { employees, payslips, companies } = useDataStore();

  // Get employee data for the logged-in user
  const employeeId = user?.employeeId;
  const companyId = user?.companyId;

  if (!employeeId || !companyId) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">
          {t('dashboard.noEmployee') || 'No employee profile associated with your account'}
        </p>
      </div>
    );
  }

  const employee = employees.find((e) => e.id === employeeId);
  const company = companies.find((c) => c.id === companyId);
  const employeePayslips = payslips
    .filter((p) => p.employeeId === employeeId)
    .sort((a, b) => {
      if (b.period.year !== a.period.year) return b.period.year - a.period.year;
      return b.period.month - a.period.month;
    });

  // Latest payslip
  const latestPayslip = employeePayslips[0];

  // Recent payslips (last 3)
  const recentPayslips = employeePayslips.slice(0, 3);

  // YTD (Year to Date) calculations
  const currentYear = new Date().getFullYear();
  const ytdPayslips = employeePayslips.filter((p) => p.period.year === currentYear);
  const ytdGross = ytdPayslips.reduce((sum, p) => sum + p.earnings.grossMonthly, 0);
  const ytdNet = ytdPayslips.reduce((sum, p) => sum + p.netPay, 0);
  const ytdTaxes = ytdPayslips.reduce((sum, p) => sum + p.employeeContrib.incomeTax, 0);
  const ytdContributions = ytdPayslips.reduce((sum, p) => sum + p.employeeContrib.total, 0);

  const formatPeriod = (period: { month: number; year: number }) => {
    const date = new Date(period.year, period.month - 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const StatCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon?: any;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          {t('dashboard.welcome') || 'Welcome'}, {user?.firstName || employee?.firstName}!
        </h1>
        <p className="text-muted-foreground">
          {company?.name} • {employee?.class}
        </p>
      </div>

      {/* Profile Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>
                  {employee?.firstName} {employee?.lastName}
                </CardTitle>
                <CardDescription>{employee?.email}</CardDescription>
              </div>
            </div>
            <Badge variant={employee?.status === 'active' ? 'default' : 'secondary'}>
              {employee?.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t('employees.class') || 'Class'}
              </p>
              <p className="text-foreground">{employee?.class}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t('employees.hireDate') || 'Hire Date'}
              </p>
              <p className="text-foreground">
                {employee?.hireDate ? new Date(employee.hireDate).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t('employees.salary') || 'Base Salary'}
              </p>
              <p className="text-foreground">
                {company?.currency || 'EUR'} {employee?.baseSalary.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t('employees.company') || 'Company'}
              </p>
              <p className="text-foreground">{company?.name}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Latest Payslip */}
      {latestPayslip && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t('dashboard.latestPayslip') || 'Latest Payslip'}</CardTitle>
                <CardDescription>
                  {formatPeriod(latestPayslip.period)}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  PDF
                </Button>
                <Button size="sm" variant="outline">
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Excel
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('payslips.grossSalary') || 'Gross Salary'}
                </p>
                <p className="text-lg font-semibold text-foreground">
                  {company?.currency || 'EUR'} {latestPayslip.earnings.grossMonthly.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('payslips.deductions') || 'Deductions'}
                </p>
                <p className="text-lg font-semibold text-destructive">
                  -{company?.currency || 'EUR'} {latestPayslip.employeeContrib.total.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('payslips.tax') || 'Income Tax'}
                </p>
                <p className="text-lg font-semibold text-destructive">
                  -{company?.currency || 'EUR'} {latestPayslip.employeeContrib.incomeTax.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('payslips.netPay') || 'Net Pay'}
                </p>
                <p className="text-lg font-semibold text-primary">
                  {company?.currency || 'EUR'} {latestPayslip.netPay.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* YTD Summary */}
      <div>
        <h2 className="text-xl font-semibold mb-4">
          {t('dashboard.ytdSummary') || 'Year-to-Date Summary'} ({currentYear})
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title={t('dashboard.ytdGross') || 'Total Gross'}
            value={`${company?.currency || 'EUR'} ${ytdGross.toLocaleString()}`}
            subtitle={`${ytdPayslips.length} ${t('dashboard.payslips') || 'payslips'}`}
            icon={TrendingUp}
          />
          <StatCard
            title={t('dashboard.ytdNet') || 'Total Net'}
            value={`${company?.currency || 'EUR'} ${ytdNet.toLocaleString()}`}
            icon={CreditCard}
          />
          <StatCard
            title={t('dashboard.ytdTaxes') || 'Total Taxes'}
            value={`${company?.currency || 'EUR'} ${ytdTaxes.toLocaleString()}`}
            icon={Calendar}
          />
          <StatCard
            title={t('dashboard.ytdContributions') || 'Total Contributions'}
            value={`${company?.currency || 'EUR'} ${ytdContributions.toLocaleString()}`}
            icon={TrendingUp}
          />
        </div>
      </div>

      {/* Recent Payslips */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t('dashboard.recentPayslips') || 'Recent Payslips'}</CardTitle>
          {employeePayslips.length > 3 && (
            <Button variant="ghost" size="sm">
              {t('dashboard.viewAll') || 'View All'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {recentPayslips.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {t('dashboard.noPayslips') || 'No payslips found'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentPayslips.map((payslip, index) => (
                <div key={payslip.id}>
                  {index > 0 && <Separator className="my-4" />}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {formatPeriod(payslip.period)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {t('payslips.netPay') || 'Net Pay'}: {company?.currency || 'EUR'}{' '}
                          {payslip.netPay.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <FileSpreadsheet className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help Card */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-base">
            {t('dashboard.needHelp') || 'Need Help?'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            {t('dashboard.helpText') || 'If you have any questions about your payslips or need assistance, please contact your HR department.'}
          </p>
          <Button variant="outline" size="sm">
            {t('dashboard.contactHR') || 'Contact HR'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}