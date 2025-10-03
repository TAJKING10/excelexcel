import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDataStore } from '@/stores/data';
import { useAuthStore } from '@/stores/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react';
import { PayslipLine, LineType } from '@/types';
import { useToast } from '@/hooks/use-toast';

export function CreatePayslip() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuthStore();
  const { companies, employees, addPayslip, savePayrollTemplate, getPayrollTemplate } = useDataStore();

  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [lines, setLines] = useState<PayslipLine[]>([
    {
      id: '1',
      code: 'SAL-BASE',
      label_fr: 'Salaire de base',
      label_en: 'Base salary',
      quantity: 1,
      rate: 0,
      amount: 0,
      type: 'earning',
    },
  ]);

  // Guard: only Super Admin can access this page
  useEffect(() => {
    if (user && user.role !== 'SUPER_ADMIN') {
      navigate('/payslips');
    }
  }, [user, navigate]);

  // Companies available to Super Admin (page restricted by guard)
  const availableCompanies = companies;

  const filteredEmployees = selectedCompanyId
    ? employees.filter((e) => e.companyId === selectedCompanyId && e.status === 'active')
    : [];

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId);
  const selectedEmployee = employees.find((e) => e.id === selectedEmployeeId);

  const handleLineChange = (lineId: string, field: keyof PayslipLine, value: any) => {
    setLines((prevLines) =>
      prevLines.map((line) => {
        if (line.id === lineId) {
          const updatedLine = { ...line, [field]: value };

          // Recalculate amount if quantity or rate changes
          if (field === 'quantity' || field === 'rate') {
            const qty = field === 'quantity' ? parseFloat(value) || 0 : line.quantity;
            const rt = field === 'rate' ? parseFloat(value) || 0 : line.rate;
            updatedLine.amount = qty * rt;
          }

          return updatedLine;
        }
        return line;
      })
    );
  };

  const handleAddLine = () => {
    const newLine: PayslipLine = {
      id: `line-${Date.now()}`,
      code: '',
      label_fr: '',
      label_en: '',
      quantity: 1,
      rate: 0,
      amount: 0,
      type: 'earning',
    };
    setLines([...lines, newLine]);
  };

  const handleDeleteLine = (lineId: string) => {
    if (lines.length > 1) {
      setLines(lines.filter((line) => line.id !== lineId));
    }
  };

  const calculateTotals = () => {
    const earnings = lines
      .filter((line) => line.type === 'earning')
      .reduce((sum, line) => sum + line.amount, 0);

    const employeeDeductions = lines
      .filter((line) => line.type === 'deduction')
      .reduce((sum, line) => sum + Math.abs(line.amount), 0);

    const employerContributions = lines
      .filter((line) => line.type === 'employer_contrib')
      .reduce((sum, line) => sum + line.amount, 0);

    const maladie = lines
      .filter((line) => line.code.includes('CNS-MAL') && line.type === 'deduction')
      .reduce((sum, line) => sum + Math.abs(line.amount), 0);

    const pension = lines
      .filter((line) => line.code.includes('PENS') && line.type === 'deduction')
      .reduce((sum, line) => sum + Math.abs(line.amount), 0);

    const incomeTax = lines
      .filter((line) => line.code.includes('IMP') && line.type === 'deduction')
      .reduce((sum, line) => sum + Math.abs(line.amount), 0);

    const employerMaladie = lines
      .filter((line) => line.code.includes('CNS-MAL') && line.type === 'employer_contrib')
      .reduce((sum, line) => sum + line.amount, 0);

    const employerPension = lines
      .filter((line) => line.code.includes('PENS') && line.type === 'employer_contrib')
      .reduce((sum, line) => sum + line.amount, 0);

    const sante = lines
      .filter((line) => line.code.includes('SANTE') && line.type === 'employer_contrib')
      .reduce((sum, line) => sum + line.amount, 0);

    const accident = lines
      .filter((line) => line.code.includes('ACC') && line.type === 'employer_contrib')
      .reduce((sum, line) => sum + line.amount, 0);

    const netPay = earnings - employeeDeductions;

    return {
      earnings,
      employeeDeductions,
      employerContributions,
      netPay,
      maladie,
      pension,
      incomeTax,
      employerMaladie,
      employerPension,
      sante,
      accident,
    };
  };

  const totals = calculateTotals();

  const handleLoadTemplate = () => {
    if (!selectedCompanyId) {
      toast({ title: 'Error', description: 'Select a company first', variant: 'destructive' });
      return;
    }
    const templateLines = getPayrollTemplate(selectedCompanyId);
    if (!templateLines || templateLines.length === 0) {
      toast({ title: 'Info', description: 'No template found for this company' });
      return;
    }
    // Clone and assign fresh ids
    const cloned = templateLines.map((l) => ({ ...l, id: `line-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` }));
    setLines(cloned);
    toast({ title: 'Loaded', description: 'Company template loaded' });
  };

  const handleSaveTemplate = () => {
    if (!selectedCompanyId) {
      toast({ title: 'Error', description: 'Select a company first', variant: 'destructive' });
      return;
    }
    savePayrollTemplate(selectedCompanyId, lines);
    toast({ title: 'Saved', description: 'Company template saved' });
  };

  const handleSave = () => {
    if (!selectedCompanyId || !selectedEmployeeId) {
      toast({
        title: 'Error',
        description: 'Please select a company and employee',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedCompany || !selectedEmployee) return;

    const payslip = {
      employeeId: selectedEmployeeId,
      companyId: selectedCompanyId,
      period: { month, year },
      employee: {
        id: selectedEmployee.id,
        firstName: selectedEmployee.firstName,
        lastName: selectedEmployee.lastName,
        email: selectedEmployee.email,
        class: selectedEmployee.class,
        hireDate: selectedEmployee.hireDate,
        terminationDate: selectedEmployee.terminationDate,
      },
      company: {
        id: selectedCompany.id,
        name: selectedCompany.name,
        country: selectedCompany.country,
        currency: selectedCompany.currency,
      },
      earnings: {
        remunerationBase: totals.earnings,
        grossMonthly: totals.earnings,
        cotisable: totals.earnings,
        imposable: totals.earnings - totals.employeeDeductions,
      },
      employeeContrib: {
        maladie: totals.maladie,
        pension: totals.pension,
        ciCo2: 14,
        cis: 50,
        cissm: 70,
        deductions: totals.employeeDeductions - totals.maladie - totals.pension - totals.incomeTax - 14 - 50 - 70,
        incomeTax: totals.incomeTax,
        total: totals.employeeDeductions,
      },
      employerContrib: {
        maladie: totals.employerMaladie,
        pension: totals.employerPension,
        sante: totals.sante,
        accident: totals.accident,
        socialSecurityTotal: totals.employerContributions,
      },
      netPay: totals.netPay,
      ytd: {
        gross: totals.earnings,
        net: totals.netPay,
        employeeContribTotal: totals.employeeDeductions,
        employerContribTotal: totals.employerContributions,
        taxes: totals.incomeTax,
      },
      lines: lines,
    };

    addPayslip(payslip);

    toast({
      title: 'Success',
      description: 'Payslip created successfully',
    });

    navigate('/admin/payslips');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t('payslips.create')}</h1>
            <p className="text-muted-foreground">Create a new payslip</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={handleLoadTemplate}>
            Load Template
          </Button>
          <Button variant="secondary" onClick={handleSaveTemplate}>
            Save Template
          </Button>
          <Button onClick={handleSave} className="bg-primary text-primary-foreground">
            <Save size={16} className="mr-2" />
            {t('actions.save')}
          </Button>
        </div>
      </div>

      {/* Selection Section */}
      <Card>
        <CardHeader>
          <CardTitle>Payslip Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Company Selection */}
            <div className="space-y-2">
              <Label htmlFor="company">Company *</Label>
              <Select
                value={selectedCompanyId}
                onValueChange={setSelectedCompanyId}
                disabled={false}
              >
                <SelectTrigger id="company">
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  {availableCompanies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Employee Selection */}
            <div className="space-y-2">
              <Label htmlFor="employee">Employee *</Label>
              <Select
                value={selectedEmployeeId}
                onValueChange={setSelectedEmployeeId}
                disabled={!selectedCompanyId}
              >
                <SelectTrigger id="employee">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {filteredEmployees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.firstName} {employee.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Month */}
            <div className="space-y-2">
              <Label htmlFor="month">Month *</Label>
              <Select value={month.toString()} onValueChange={(val) => setMonth(parseInt(val))}>
                <SelectTrigger id="month">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <SelectItem key={m} value={m.toString()}>
                      {new Date(2024, m - 1, 1).toLocaleString('default', { month: 'long' })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Year */}
            <div className="space-y-2">
              <Label htmlFor="year">Year *</Label>
              <Input
                id="year"
                type="number"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value) || new Date().getFullYear())}
                min={2020}
                max={2050}
              />
            </div>
          </div>

          {/* Employee Info Display */}
          {selectedEmployee && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Employee Details</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Name:</span>{' '}
                  <span className="font-medium">
                    {selectedEmployee.firstName} {selectedEmployee.lastName}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Email:</span>{' '}
                  <span className="font-medium">{selectedEmployee.email}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Class:</span>{' '}
                  <span className="font-medium">{selectedEmployee.class}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Base Salary:</span>{' '}
                  <span className="font-medium">
                    {selectedCompany?.currency} {selectedEmployee.baseSalary.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Totals Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Gross Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {selectedCompany?.currency} {totals.earnings.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Employee Deductions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {selectedCompany?.currency} {totals.employeeDeductions.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Employer Contributions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {selectedCompany?.currency} {totals.employerContributions.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Net Pay
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {selectedCompany?.currency} {totals.netPay.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payslip Lines Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Payslip Lines</CardTitle>
            <Button onClick={handleAddLine} size="sm">
              <Plus size={16} className="mr-2" />
              Add Line
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Code</TableHead>
                <TableHead>Label (FR)</TableHead>
                <TableHead>Label (EN)</TableHead>
                <TableHead className="w-[100px]">Quantity</TableHead>
                <TableHead className="w-[120px]">Rate</TableHead>
                <TableHead className="w-[120px]">Amount</TableHead>
                <TableHead className="w-[150px]">Type</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map((line) => (
                <TableRow key={line.id}>
                  <TableCell>
                    <Input
                      value={line.code}
                      onChange={(e) => handleLineChange(line.id, 'code', e.target.value)}
                      placeholder="Code"
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={line.label_fr}
                      onChange={(e) => handleLineChange(line.id, 'label_fr', e.target.value)}
                      placeholder="French label"
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={line.label_en}
                      onChange={(e) => handleLineChange(line.id, 'label_en', e.target.value)}
                      placeholder="English label"
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={line.quantity}
                      onChange={(e) => handleLineChange(line.id, 'quantity', e.target.value)}
                      className="h-8"
                      step="0.01"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={line.rate}
                      onChange={(e) => handleLineChange(line.id, 'rate', e.target.value)}
                      className="h-8"
                      step="0.01"
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {selectedCompany?.currency} {line.amount.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <select
                      value={line.type}
                      onChange={(e) => handleLineChange(line.id, 'type', e.target.value as LineType)}
                      className="h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                    >
                      <option value="earning">Earning</option>
                      <option value="deduction">Deduction</option>
                      <option value="employer_contrib">Employer Contrib</option>
                      <option value="info">Info</option>
                    </select>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDeleteLine(line.id)}
                      disabled={lines.length === 1}
                      className="h-8 w-8"
                    >
                      <Trash2 size={16} className="text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default CreatePayslip;
