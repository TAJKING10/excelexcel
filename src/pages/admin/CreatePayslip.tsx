import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDataStore } from '@/stores/data';
import { DEFAULT_LU_TEMPLATE } from '@/lib/payrollTemplates';
import { calculatePayslip } from '@/lib/luxembourgPayroll';
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
import { LuxembourgPayslipDetail } from '@/components/payslips/LuxembourgPayslipDetail';

export function CreatePayslip() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuthStore();
  const { companies, employees, payslips, addPayslip, savePayrollTemplate, getPayrollTemplate } = useDataStore();

  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [autoCalc, setAutoCalc] = useState<boolean>(true);
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

  const handleLoadDefaultTemplate = () => {
    // Clone default template and assign fresh ids
    const cloned = DEFAULT_LU_TEMPLATE.map((l) => ({
      ...l,
      id: `line-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      quantity: l.quantity ?? 1,
      rate: 0,
      amount: 0,
    }));
    setLines(cloned);
    toast({ title: 'Loaded', description: 'Default Luxembourg template loaded' });
  };

  const matchCode = (text: string | undefined, code: string) => {
    const norm = (s: string) => s.toUpperCase().trim();
    return !!text && norm(text).includes(norm(code));
  };

  const applyAutoCalc = () => {
    if (!autoCalc) return;
    // Determine remuneration base from earnings totals
    const earningsBase = lines
      .filter((l) => l.type === 'earning')
      .reduce((sum, l) => sum + (Number(l.amount) || 0), 0);

    if (!earningsBase || earningsBase <= 0) return;

    const taxClass = selectedEmployee?.taxClass || 'Empl.';
    const calc = calculatePayslip({ remunerationBase: earningsBase, taxClass });

    const updated = lines.map((l) => {
      const line = { ...l };
      // Employee
      if (matchCode(line.code, 'EE_MALADIE') || matchCode(line.label_fr, 'MALADIE') || matchCode(line.label_en, 'HEALTH')) {
        line.amount = calc.employeeContrib.maladie;
        line.rate = calc.employeeContrib.maladie;
      } else if (matchCode(line.code, 'EE_PENSION') || matchCode(line.label_en, 'PENSION') || matchCode(line.label_fr, 'PENSION')) {
        line.amount = calc.employeeContrib.pension;
        line.rate = calc.employeeContrib.pension;
      } else if (matchCode(line.code, 'EE_CI_CO2') || matchCode(line.label_en, 'CI-CO2') || matchCode(line.label_fr, 'CI-CO2')) {
        line.amount = calc.employeeContrib.ciCo2;
        line.rate = calc.employeeContrib.ciCo2;
      } else if (matchCode(line.code, 'EE_CIS') || matchCode(line.label_en, 'CIS') || matchCode(line.label_fr, 'CIS')) {
        line.amount = calc.employeeContrib.cis;
        line.rate = calc.employeeContrib.cis;
      } else if (matchCode(line.code, 'EE_CISSM') || matchCode(line.label_en, 'CISSM') || matchCode(line.label_fr, 'CISSM')) {
        line.amount = calc.employeeContrib.cissm;
        line.rate = calc.employeeContrib.cissm;
      } else if (matchCode(line.code, 'TAX') || matchCode(line.label_en, 'TAX') || matchCode(line.label_fr, 'IMPÔT')) {
        line.amount = calc.employeeContrib.incomeTax;
        line.rate = calc.employeeContrib.incomeTax;
      }

      // Employer
      if (matchCode(line.code, 'ER_MALADIE') || matchCode(line.label_fr, 'MALADIE') || matchCode(line.label_en, 'HEALTH')) {
        line.amount = calc.employerContrib.maladie;
        line.rate = calc.employerContrib.maladie;
      } else if (matchCode(line.code, 'ER_PENSION') || matchCode(line.label_en, 'PENSION') || matchCode(line.label_fr, 'PENSION')) {
        line.amount = calc.employerContrib.pension;
        line.rate = calc.employerContrib.pension;
      } else if (matchCode(line.code, 'ER_SANTE') || matchCode(line.label_en, 'SANTE') || matchCode(line.label_fr, 'SANTÉ')) {
        line.amount = calc.employerContrib.sante;
        line.rate = calc.employerContrib.sante;
      } else if (matchCode(line.code, 'ER_ACCIDENT') || matchCode(line.label_en, 'ACCIDENT') || matchCode(line.label_fr, 'ACCIDENT')) {
        line.amount = calc.employerContrib.accident;
        line.rate = calc.employerContrib.accident;
      }

      return line;
    });

    // Only update if amounts changed materially to avoid loops
    const prevTotal = lines.reduce((s, l) => s + (Number(l.amount) || 0), 0).toFixed(2);
    const nextTotal = updated.reduce((s, l) => s + (Number(l.amount) || 0), 0).toFixed(2);
    if (prevTotal !== nextTotal) {
      setLines(updated);
    }
  };

  useEffect(() => {
    applyAutoCalc();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoCalc, selectedEmployeeId, lines.length]);

  const handleDeleteLine = (lineId: string) => {
    if (lines.length > 1) {
      setLines(lines.filter((line) => line.id !== lineId));
    }
  };

  const calculateTotals = () => {
    const norm = (s: string) => (s || '').toUpperCase();

    const earnings = lines
      .filter((line) => line.type === 'earning')
      .reduce((sum, line) => sum + (Number(line.amount) || 0), 0);

    const employeeDeductions = lines
      .filter((line) => line.type === 'deduction')
      .reduce((sum, line) => sum + Math.abs(Number(line.amount) || 0), 0);

    const employerContributions = lines
      .filter((line) => line.type === 'employer_contrib')
      .reduce((sum, line) => sum + (Number(line.amount) || 0), 0);

    const maladie = lines
      .filter((line) => line.type === 'deduction')
      .filter((line) => {
        const c = norm(line.code);
        const lf = norm(line.label_fr);
        const le = norm(line.label_en);
        return c.includes('MAL') || c.includes('CNS') || lf.includes('MALADIE') || le.includes('HEALTH') || le.includes('MALADIE');
      })
      .reduce((sum, line) => sum + Math.abs(Number(line.amount) || 0), 0);

    const pension = lines
      .filter((line) => line.type === 'deduction')
      .filter((line) => {
        const c = norm(line.code);
        const lf = norm(line.label_fr);
        const le = norm(line.label_en);
        return c.includes('PENS') || lf.includes('PENSION') || le.includes('PENSION');
      })
      .reduce((sum, line) => sum + Math.abs(Number(line.amount) || 0), 0);

    const ciCo2 = lines
      .filter((line) => line.type === 'deduction')
      .filter((line) => {
        const c = norm(line.code);
        const lf = norm(line.label_fr);
        const le = norm(line.label_en);
        return c.includes('CO2') || c.includes('CI-CO2') || lf.includes('CO2') || le.includes('CO2');
      })
      .reduce((sum, line) => sum + Math.abs(Number(line.amount) || 0), 0);

    const cis = lines
      .filter((line) => line.type === 'deduction')
      .filter((line) => {
        const c = norm(line.code);
        const lf = norm(line.label_fr);
        const le = norm(line.label_en);
        return (c.includes('CIS') && !c.includes('CISSM')) || lf.includes('CIS') || (le.includes('CIS') && !le.includes('CISSM'));
      })
      .reduce((sum, line) => sum + Math.abs(Number(line.amount) || 0), 0);

    const cissm = lines
      .filter((line) => line.type === 'deduction')
      .filter((line) => {
        const c = norm(line.code);
        const lf = norm(line.label_fr);
        const le = norm(line.label_en);
        return c.includes('CISSM') || lf.includes('CISSM') || le.includes('CISSM');
      })
      .reduce((sum, line) => sum + Math.abs(Number(line.amount) || 0), 0);

    const incomeTax = lines
      .filter((line) => line.type === 'deduction')
      .filter((line) => {
        const c = norm(line.code);
        const lf = norm(line.label_fr);
        const le = norm(line.label_en);
        return c.includes('IMP') || c.includes('TAX') || lf.includes('IMPÔT') || le.includes('TAX');
      })
      .reduce((sum, line) => sum + Math.abs(Number(line.amount) || 0), 0);

    const employerMaladie = lines
      .filter((line) => line.type === 'employer_contrib')
      .filter((line) => {
        const c = norm(line.code);
        const lf = norm(line.label_fr);
        const le = norm(line.label_en);
        return c.includes('MAL') || c.includes('CNS') || lf.includes('MALADIE') || le.includes('HEALTH') || le.includes('MALADIE');
      })
      .reduce((sum, line) => sum + (Number(line.amount) || 0), 0);

    const employerPension = lines
      .filter((line) => line.type === 'employer_contrib')
      .filter((line) => {
        const c = norm(line.code);
        const lf = norm(line.label_fr);
        const le = norm(line.label_en);
        return c.includes('PENS') || lf.includes('PENSION') || le.includes('PENSION');
      })
      .reduce((sum, line) => sum + (Number(line.amount) || 0), 0);

    const sante = lines
      .filter((line) => line.type === 'employer_contrib')
      .filter((line) => {
        const c = norm(line.code);
        const lf = norm(line.label_fr);
        const le = norm(line.label_en);
        return c.includes('SANTE') || lf.includes('SANTÉ') || le.includes('HEALTH');
      })
      .reduce((sum, line) => sum + (Number(line.amount) || 0), 0);

    const accident = lines
      .filter((line) => line.type === 'employer_contrib')
      .filter((line) => {
        const c = norm(line.code);
        const lf = norm(line.label_fr);
        const le = norm(line.label_en);
        return c.includes('ACC') || lf.includes('ACCIDENT') || le.includes('ACCIDENT');
      })
      .reduce((sum, line) => sum + (Number(line.amount) || 0), 0);

    const deductionsOther = Math.max(
      0,
      employeeDeductions - (maladie + pension + incomeTax + ciCo2 + cis + cissm)
    );

    const netPay = earnings - employeeDeductions;

    // YTD from existing payslips + current preview
    const existing = payslips.filter(
      (p) => p.employeeId === selectedEmployeeId && p.period.year === year && p.period.month < month
    );
    const ytd = {
      gross: existing.reduce((sum, p) => sum + (p.earnings?.grossMonthly || 0), 0) + earnings,
      net: existing.reduce((sum, p) => sum + (p.netPay || 0), 0) + netPay,
      employeeContribTotal:
        existing.reduce((sum, p) => sum + (p.employeeContrib?.total || 0), 0) + employeeDeductions,
      employerContribTotal:
        existing.reduce((sum, p) => sum + (p.employerContrib?.socialSecurityTotal || 0), 0) + employerContributions,
      taxes: existing.reduce((sum, p) => sum + (p.employeeContrib?.incomeTax || 0), 0) + incomeTax,
    };

    return {
      earnings,
      employeeDeductions,
      employerContributions,
      netPay,
      maladie,
      pension,
      ciCo2,
      cis,
      cissm,
      deductionsOther,
      incomeTax,
      employerMaladie,
      employerPension,
      sante,
      accident,
      ytd,
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
        ciCo2: totals.ciCo2,
        cis: totals.cis,
        cissm: totals.cissm,
        deductions: totals.deductionsOther,
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
      ytd: totals.ytd,
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
          <Button variant="secondary" onClick={handleLoadDefaultTemplate}>
            Load Default
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
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={autoCalc}
                  onChange={(e) => setAutoCalc(e.target.checked)}
                />
                Auto-calc from base
              </label>
              <Button onClick={handleAddLine} size="sm">
                <Plus size={16} className="mr-2" />
                Add Line
              </Button>
            </div>
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

      {/* Preview (Excel-style monthly detail) */}
      {selectedCompany && selectedEmployee && (
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <LuxembourgPayslipDetail
              payslip={{
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
                  matricule: selectedEmployee.matricule,
                  identityNumber: selectedEmployee.identityNumber,
                  address: selectedEmployee.address,
                  city: selectedEmployee.city,
                  postalCode: selectedEmployee.postalCode,
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
                  ciCo2: totals.ciCo2,
                  cis: totals.cis,
                  cissm: totals.cissm,
                  deductions: totals.deductionsOther,
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
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default CreatePayslip;
