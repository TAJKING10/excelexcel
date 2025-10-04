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
import { ArrowLeft, Plus, UserCircle, CreditCard, TrendingUp, FileText, Download, FileSpreadsheet } from 'lucide-react';
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
    return <div>Individual not found</div>;
  }

  const individual = individuals.find((i) => i.id === individualId);

  if (!individual) {
    return <div>Individual not found</div>;
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
      toast({ title: 'Error', description: 'Valid gross salary is required', variant: 'destructive' });
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

    toast({ title: 'Success', description: 'Payslip created successfully' });
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
        <Button onClick={() => setIsCreatePayslipDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Créer fiche de paie
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          icon={CreditCard}
          title="Total Net (YTD)"
          value={formatCurrency(ytdNet)}
          subtitle={`${ytdPayslips.length} payslips this year`}
        />
        <StatCard
          icon={FileText}
          title="Last Payslip"
          value={lastPayslip ? formatCurrency(lastPayslip.netPay) : 'N/A'}
          subtitle={lastPayslip ? `${String(lastPayslip.period.month).padStart(2, '0')}/${lastPayslip.period.year}` : 'No payslips yet'}
        />
        <StatCard
          icon={TrendingUp}
          title="YTD Gross"
          value={formatCurrency(ytdGross)}
          subtitle={`Year ${currentYear}`}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="payslips" className="space-y-4">
        <TabsList>
          <TabsTrigger value="payslips">
            <FileText className="h-4 w-4 mr-2" />
            Fiches de paie
          </TabsTrigger>
          <TabsTrigger value="info">
            <UserCircle className="h-4 w-4 mr-2" />
            Information
          </TabsTrigger>
        </TabsList>

        {/* Payslips Tab */}
        <TabsContent value="payslips" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fiches de paie</CardTitle>
            </CardHeader>
            <CardContent>
              {individualPayslips.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No payslips found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period</TableHead>
                      <TableHead>Gross</TableHead>
                      <TableHead>Net</TableHead>
                      <TableHead>Actions</TableHead>
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
                            <Button size="sm" variant="outline" onClick={() => generatePayslipPDF(payslip)}>
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
        </TabsContent>

        {/* Info Tab */}
        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle>Individual Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">First Name</p>
                  <p className="text-foreground">{individual.firstName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Last Name</p>
                  <p className="text-foreground">{individual.lastName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="text-foreground">{individual.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Country</p>
                  <p className="text-foreground">{individual.country}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Currency</p>
                  <p className="text-foreground">{individual.currency}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge variant={individual.status === 'active' ? 'default' : 'secondary'}>
                    {individual.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created At</p>
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
            <DialogTitle>Créer fiche de paie immédiate</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="month">Month</Label>
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
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                value={payslipForm.period.year}
                onChange={(e) => setPayslipForm({ ...payslipForm, period: { ...payslipForm.period, year: parseInt(e.target.value) } })}
              />
            </div>
            <div>
              <Label htmlFor="gross">Gross Monthly</Label>
              <Input
                id="gross"
                type="number"
                value={payslipForm.grossMonthly}
                onChange={(e) => setPayslipForm({ ...payslipForm, grossMonthly: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="cotisable">Cotisable</Label>
              <Input
                id="cotisable"
                type="number"
                value={payslipForm.cotisable}
                onChange={(e) => setPayslipForm({ ...payslipForm, cotisable: parseFloat(e.target.value) || 0 })}
                placeholder="Same as gross"
              />
            </div>
            <div>
              <Label htmlFor="imposable">Imposable</Label>
              <Input
                id="imposable"
                type="number"
                value={payslipForm.imposable}
                onChange={(e) => setPayslipForm({ ...payslipForm, imposable: parseFloat(e.target.value) || 0 })}
                placeholder="Same as gross"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreatePayslipDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePayslip}>Create Payslip</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
