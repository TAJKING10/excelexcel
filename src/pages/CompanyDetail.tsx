import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguageStore } from '@/stores/language';
import { useDataStore } from '@/stores/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmployeeList } from '@/components/employees/EmployeeList';
import { PayslipList } from '@/components/payslips/PayslipList';
import { CompanyAnalytics } from '@/components/analytics/CompanyAnalytics';
import { ArrowLeft, Plus, Users, Building2, CreditCard, TrendingUp } from 'lucide-react';
import type { Company } from '@/types';

export function CompanyDetail() {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const { t } = useLanguageStore();
  const { companies, employees, getCompanyAnalytics } = useDataStore();

  if (!companyId) {
    return <div>Company not found</div>;
  }

  const company = companies.find((c) => c.id === companyId);

  if (!company) {
    return <div>Company not found</div>;
  }

  const analytics = getCompanyAnalytics(companyId);
  const companyEmployees = employees.filter((e) => e.companyId === companyId);

  const StatCard = ({ icon: Icon, title, value, subtitle }: { icon: any; title: string; value: string | number; subtitle?: string }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/companies')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{company.name}</h1>
            <p className="text-muted-foreground">
              {company.country} • {company.currency}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">
            <Building2 className="h-4 w-4 mr-2" />
            {t('companies.overview') || 'Overview'}
          </TabsTrigger>
          <TabsTrigger value="employees">
            <Users className="h-4 w-4 mr-2" />
            {t('nav.employees') || 'Employees'}
          </TabsTrigger>
          <TabsTrigger value="payslips">
            <CreditCard className="h-4 w-4 mr-2" />
            {t('nav.payslips') || 'Payslips'}
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <TrendingUp className="h-4 w-4 mr-2" />
            {t('companies.analytics') || 'Analytics'}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={Users}
              title={t('dashboard.totalEmployees') || 'Total Employees'}
              value={analytics.totalEmployees}
              subtitle={`${analytics.activeEmployees} ${t('dashboard.active') || 'active'}`}
            />
            <StatCard
              icon={Users}
              title={t('dashboard.activeEmployees') || 'Active Employees'}
              value={analytics.activeEmployees}
            />
            <StatCard
              icon={CreditCard}
              title={t('dashboard.monthlyPayroll') || 'Monthly Payroll'}
              value={`${company.currency} ${analytics.monthlyPayroll.toLocaleString()}`}
            />
            <StatCard
              icon={TrendingUp}
              title={t('dashboard.socialCharges') || 'Social Charges'}
              value={`${company.currency} ${analytics.totalSocialCharges.toLocaleString()}`}
            />
          </div>

          {/* Company Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>{t('companies.information') || 'Company Information'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('companies.name') || 'Company Name'}
                  </p>
                  <p className="text-foreground">{company.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('companies.country') || 'Country'}
                  </p>
                  <p className="text-foreground">{company.country}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('companies.currency') || 'Currency'}
                  </p>
                  <p className="text-foreground">{company.currency}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('companies.createdAt') || 'Created At'}
                  </p>
                  <p className="text-foreground">
                    {new Date(company.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Employees Tab */}
        <TabsContent value="employees">
          <EmployeeListFiltered companyId={companyId} />
        </TabsContent>

        {/* Payslips Tab */}
        <TabsContent value="payslips" className="space-y-4">
          <div className="flex justify-end">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t('payslips.create') || 'Create Payslip'}
            </Button>
          </div>
          <PayslipListFiltered companyId={companyId} />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <CompanyAnalytics companyId={companyId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Filtered Employee List Component
function EmployeeListFiltered({ companyId }: { companyId: string }) {
  const { t } = useLanguageStore();
  const { employees } = useDataStore();
  const { Badge } = require('@/components/ui/badge');
  const { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } = require('@/components/ui/table');
  const { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } = require('@/components/ui/dropdown-menu');
  const { MoreHorizontal, Edit, Trash2, RotateCcw } = require('lucide-react');

  const filteredEmployees = employees.filter((e) => e.companyId === companyId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('employees.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('employees.name')}</TableHead>
              <TableHead>{t('employees.firstname')}</TableHead>
              <TableHead>{t('employees.email')}</TableHead>
              <TableHead>{t('employees.status')}</TableHead>
              <TableHead>{t('employees.salary')}</TableHead>
              <TableHead>{t('employees.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEmployees.map((employee) => (
              <TableRow key={employee.id}>
                <TableCell>{employee.lastName}</TableCell>
                <TableCell>{employee.firstName}</TableCell>
                <TableCell>{employee.email}</TableCell>
                <TableCell>
                  <Badge variant={employee.status === 'active' ? 'default' : 'secondary'}>
                    {employee.status}
                  </Badge>
                </TableCell>
                <TableCell>€{employee.baseSalary.toLocaleString()}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit size={16} className="mr-2" />
                        {t('employees.edit')}
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <RotateCcw size={16} className="mr-2" />
                        {t('employees.reset')}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 size={16} className="mr-2" />
                        {t('employees.delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// Filtered Payslip List Component
function PayslipListFiltered({ companyId }: { companyId: string }) {
  const { t } = useLanguageStore();
  const { payslips, employees } = useDataStore();
  const { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } = require('@/components/ui/table');
  const { Download, FileSpreadsheet } = require('lucide-react');

  const filteredPayslips = payslips.filter((p) => p.companyId === companyId);

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find((e) => e.id === employeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('payslips.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        {filteredPayslips.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {t('payslips.noPayslips') || 'No payslips found'}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('payslips.period')}</TableHead>
                <TableHead>{t('payslips.employee')}</TableHead>
                <TableHead>{t('payslips.gross') || 'Gross'}</TableHead>
                <TableHead>{t('payslips.net') || 'Net'}</TableHead>
                <TableHead>{t('employees.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayslips.map((payslip) => (
                <TableRow key={payslip.id}>
                  <TableCell>
                    {payslip.period.month}/{payslip.period.year}
                  </TableCell>
                  <TableCell>{getEmployeeName(payslip.employeeId)}</TableCell>
                  <TableCell>€{payslip.earnings.grossMonthly.toLocaleString()}</TableCell>
                  <TableCell>€{payslip.netPay.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <Download size={16} className="mr-2" />
                        PDF
                      </Button>
                      <Button size="sm" variant="outline">
                        <FileSpreadsheet size={16} className="mr-2" />
                        Excel
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
  );
}