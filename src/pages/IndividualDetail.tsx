import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguageStore } from '@/stores/language';
import { useDataStore } from '@/stores/data';
import { useAuthStore } from '@/stores/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, UserCircle, CreditCard, TrendingUp, FileText, Download, FileSpreadsheet, Edit } from 'lucide-react';
import { formatCurrency } from '@/lib/luxembourgPayroll';
import { generatePayslipPDF } from '@/lib/pdf';

export function IndividualDetail() {
  const { individualId } = useParams<{ individualId: string }>();
  const navigate = useNavigate();
  const { t } = useLanguageStore();
  const { user } = useAuthStore();
  const { individuals, payslips, addPayslip } = useDataStore();
  const { toast } = useToast();

  const [isCreatePayslipDialogOpen, setIsCreatePayslipDialogOpen] = useState(false);
  const [payslipForm, setPayslipForm] = useState({
    period: { month: new Date().getMonth() + 1, year: new Date().getFullYear() },
    grossMonthly: 0,
    cotisable: 0,
    imposable: 0,
  });

  if (!individualId) {
    return <div>{t('individuals.notFound', 'Individual not found')}</div>;
  }

  const individual = individuals.find((i) => i.id === individualId);

  if (!individual) {
    return <div>{t('individuals.notFound', 'Individual not found')}</div>;
  }

  // Get payslips for this individual
  const individualPayslips = payslips.filter((p) => p.employeeId === individualId);

  // Calculate stats
  const lastPayslip = individualPayslips.sort((a, b) => {
    if (b.period.year !== a.period.year) return b.period.year - a.period.year;
    return b.period.month - a.period.month;
  })[0];

  const currentYear = new Date().getFullYear();
  const ytdPayslips = individualPayslips.filter((p) => p.period.year === currentYear);
  const ytdGross = ytdPayslips.reduce((sum, p) => sum + p.earnings.grossMonthly, 0);
  const ytdNet = ytdPayslips.reduce((sum, p) => sum + p.netPay, 0);

  const handleCreatePayslip = () => {
    if (!payslipForm.grossMonthly || payslipForm.grossMonthly <= 0) {
      toast({ title: t('common.error', 'Error'), description: t('payslips.validGrossRequired', 'Valid gross salary is required'), variant: 'destructive' });
      return;
    }

    // Calculate contributions (simplified)
    const maladie = payslipForm.grossMonthly * 0.028;
    const pension = payslipForm.grossMonthly * 0.08;
    const incomeTax = payslipForm.imposable * 0.15;
    const totalContrib = maladie + pension + incomeTax;
    const netPay = payslipForm.grossMonthly - totalContrib;

    addPayslip({
      employeeId: individualId,
      companyId: 'individual-' + individualId, // Individuals don't have a company
      period: payslipForm.period,
      employee: {
        id: individual.id,
        firstName: individual.firstName,
        lastName: individual.lastName,
        email: individual.email,
        class: 'Individual',
        hireDate: individual.createdAt,
        terminationDate: null,
      },
      company: {
        id: 'individual-' + individualId,
        name: `${individual.firstName} ${individual.lastName}`,
        country: individual.country,
        currency: individual.currency,
      },
      earnings: {
        grossMonthly: payslipForm.grossMonthly,
        cotisable: payslipForm.cotisable || payslipForm.grossMonthly,
        imposable: payslipForm.imposable || payslipForm.grossMonthly,
      },
      employeeContrib: {
        maladie,
        pension,
        otherDeductions: 0,
        incomeTax,
        total: totalContrib,
      },
      employerContrib: {
        maladie,
        pension,
        sante: payslipForm.grossMonthly * 0.04,
        accident: payslipForm.grossMonthly * 0.01,
        socialSecurityTotal: payslipForm.grossMonthly * 0.158,
      },
      netPay,
      ytd: {
        gross: ytdGross + payslipForm.grossMonthly,
        net: ytdNet + netPay,
        employeeContribTotal: totalContrib,
        employerContribTotal: payslipForm.grossMonthly * 0.158,
        taxes: incomeTax,
      },
      lines: [
        {
          id: 'line-1',
          code: 'SAL-BASE',
          label_fr: 'Salaire de base',
          label_en: 'Base salary',
          quantity: 1,
          rate: payslipForm.grossMonthly,
          amount: payslipForm.grossMonthly,
          type: 'earning',
        },
        {
          id: 'line-2',
          code: 'CNS-MAL-EMP',
          label_fr: 'CNS Maladie (2.8%)',
          label_en: 'CNS Health (2.8%)',
          quantity: 1,
          rate: 0.028,
          amount: -maladie,
          type: 'deduction',
        },
        {
          id: 'line-3',
          code: 'CNS-PENS-EMP',
          label_fr: 'CNS Pension (8%)',
          label_en: 'CNS Pension (8%)',
          quantity: 1,
          rate: 0.08,
          amount: -pension,
          type: 'deduction',
        },
        {
          id: 'line-4',
          code: 'IMP',
          label_fr: 'Impôt sur le revenu',
          label_en: 'Income tax',
          quantity: 1,
          rate: 0.15,
          amount: -incomeTax,
          type: 'deduction',
        },
      ],
    });

    toast({ title: t('common.success', 'Success'), description: t('payslips.createdSuccess', 'Payslip created successfully') });
    setPayslipForm({
      period: { month: new Date().getMonth() + 1, year: new Date().getFullYear() },
      grossMonthly: 0,
      cotisable: 0,
      imposable: 0,
    });
    setIsCreatePayslipDialogOpen(false);
  };

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
            onClick={() => navigate(user?.role === 'SUPER_ADMIN' ? '/admin/individuals' : '/')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <UserCircle className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">
                {individual.firstName} {individual.lastName}
              </h1>
              <Badge variant={individual.status === 'active' ? 'default' : 'secondary'}>
                {individual.status}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {individual.email} • {individual.country} • {individual.currency}
            </p>
          </div>
        </div>
        {(user?.role === 'SUPER_ADMIN' || user?.access?.canEditPayslips) && (
          <Button onClick={() => {
            const basePath = user?.role === 'SUPER_ADMIN' ? '/admin' : '';
            navigate(`${basePath}/payslips/create-annual/${individualId}`);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            {t('payslips.createAnnual', 'Create Annual Payslip')}
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          icon={CreditCard}
          title={t('payslips.totalNetYTD', 'Total Net (YTD)')}
          value={formatCurrency(ytdNet)}
          subtitle={`${ytdPayslips.length} ${t('payslips.payslipsThisYear', 'payslips this year')}`}
        />
        <StatCard
          icon={FileText}
          title={t('payslips.lastPayslip', 'Last Payslip')}
          value={lastPayslip ? formatCurrency(lastPayslip.netPay) : t('common.noData', 'N/A')}
          subtitle={lastPayslip ? `${String(lastPayslip.period.month).padStart(2, '0')}/${lastPayslip.period.year}` : t('payslips.noPayslipsYet', 'No payslips yet')}
        />
        <StatCard
          icon={TrendingUp}
          title={t('payslips.ytdGross', 'YTD Gross')}
          value={formatCurrency(ytdGross)}
          subtitle={`${t('payslips.year', 'Year')} ${currentYear}`}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="payslips" className="space-y-4">
        <TabsList>
          <TabsTrigger value="payslips">
            <FileText className="h-4 w-4 mr-2" />
            {t('payslips.title', 'Payslips')}
          </TabsTrigger>
          <TabsTrigger value="info">
            <UserCircle className="h-4 w-4 mr-2" />
            {t('common.info', 'Information')}
          </TabsTrigger>
        </TabsList>

        {/* Payslips Tab */}
        <TabsContent value="payslips" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">{t('payslips.title', 'Payslips')}</h3>
            {(user?.role === 'SUPER_ADMIN' || user?.access?.canEditPayslips) && (
              <Button onClick={() => {
                const basePath = user?.role === 'SUPER_ADMIN' ? '/admin' : '';
                navigate(`${basePath}/payslips/create-annual/${individualId}`);
              }}>
                <Plus className="mr-2 h-4 w-4" />
                {t('payslips.createAnnual', 'Create Annual Payslip')}
              </Button>
            )}
          </div>
          <Card>
            <CardHeader>
              <CardTitle>{t('payslips.title', 'Payslips')}</CardTitle>
            </CardHeader>
            <CardContent>
              {individualPayslips.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">{t('payslips.noPayslips', 'No payslips found')}</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('payslips.period', 'Period')}</TableHead>
                      <TableHead>{t('payslips.gross', 'Gross')}</TableHead>
                      <TableHead>{t('payslips.net', 'Net')}</TableHead>
                      <TableHead>{t('payslips.actions', 'Actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {individualPayslips.map((payslip) => (
                      <TableRow key={payslip.id}>
                        <TableCell>
                          {String(payslip.period.month).padStart(2, '0')}/{payslip.period.year}
                        </TableCell>
                        <TableCell>{formatCurrency(payslip.earnings.grossMonthly)}</TableCell>
                        <TableCell>{formatCurrency(payslip.netPay)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {(user?.role === 'SUPER_ADMIN' || user?.access?.canViewPayslips) && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const basePath = user?.role === 'SUPER_ADMIN' ? '/admin' : '';
                                  navigate(`${basePath}/individuals/${individualId}/annual-payslip`);
                                }}
                                title={t('payslips.viewAnnual', 'View Annual Payslip')}
                              >
                                <FileSpreadsheet size={16} className="mr-2" />
                                {t('payslips.annual', 'Annual')}
                              </Button>
                            )}
                            {(user?.role === 'SUPER_ADMIN' || user?.access?.canEditPayslips) && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const basePath = user?.role === 'SUPER_ADMIN' ? '/admin' : '';
                                  navigate(`${basePath}/payslips/create-annual/${individualId}`);
                                }}
                                title={t('payslips.editAnnual', 'Edit Annual Payslip')}
                              >
                                <Edit size={16} className="mr-2" />
                                {t('common.edit', 'Edit')}
                              </Button>
                            )}
                            <Button size="sm" variant="outline" onClick={() => generatePayslipPDF(payslip)}>
                              <Download size={16} />
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
        </TabsContent>

        {/* Info Tab */}
        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle>{t('individuals.information', 'Individual Information')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('employees.firstname', 'First Name')}</p>
                  <p className="text-foreground">{individual.firstName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('employees.name', 'Last Name')}</p>
                  <p className="text-foreground">{individual.lastName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('employees.email', 'Email')}</p>
                  <p className="text-foreground">{individual.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('companies.country', 'Country')}</p>
                  <p className="text-foreground">{individual.country}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('companies.currency', 'Currency')}</p>
                  <p className="text-foreground">{individual.currency}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('employees.status', 'Status')}</p>
                  <Badge variant={individual.status === 'active' ? 'default' : 'secondary'}>
                    {individual.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('dashboard.createdAt', 'Created At')}</p>
                  <p className="text-foreground">
                    {new Date(individual.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Payslip Dialog */}
      <Dialog open={isCreatePayslipDialogOpen} onOpenChange={setIsCreatePayslipDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('payslips.createQuick', 'Create Quick Payslip')}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="month">{t('payslips.month', 'Month')}</Label>
              <Select
                value={String(payslipForm.period.month)}
                onValueChange={(value) => setPayslipForm({ ...payslipForm, period: { ...payslipForm.period, month: parseInt(value) } })}
              >
                <SelectTrigger id="month">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <SelectItem key={m} value={String(m)}>
                      {String(m).padStart(2, '0')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="year">{t('payslips.year', 'Year')}</Label>
              <Input
                id="year"
                type="number"
                value={payslipForm.period.year}
                onChange={(e) => setPayslipForm({ ...payslipForm, period: { ...payslipForm.period, year: parseInt(e.target.value) } })}
              />
            </div>
            <div>
              <Label htmlFor="gross">{t('payslips.earnings.grossMonthly', 'Gross Monthly')}</Label>
              <Input
                id="gross"
                type="number"
                value={payslipForm.grossMonthly}
                onChange={(e) => setPayslipForm({ ...payslipForm, grossMonthly: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="cotisable">{t('payslips.earnings.cotisable', 'Contributable')}</Label>
              <Input
                id="cotisable"
                type="number"
                value={payslipForm.cotisable}
                onChange={(e) => setPayslipForm({ ...payslipForm, cotisable: parseFloat(e.target.value) || 0 })}
                placeholder={t('payslips.sameAsGross', 'Same as gross')}
              />
            </div>
            <div>
              <Label htmlFor="imposable">{t('payslips.earnings.imposable', 'Taxable')}</Label>
              <Input
                id="imposable"
                type="number"
                value={payslipForm.imposable}
                onChange={(e) => setPayslipForm({ ...payslipForm, imposable: parseFloat(e.target.value) || 0 })}
                placeholder={t('payslips.sameAsGross', 'Same as gross')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreatePayslipDialogOpen(false)}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button onClick={handleCreatePayslip}>{t('payslips.create', 'Create Payslip')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
