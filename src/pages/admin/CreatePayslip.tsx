import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDataStore } from '@/stores/data';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Save } from 'lucide-react';
import { calculatePayslip, formatCurrency, getMonthNameFr } from '@/lib/luxembourgPayroll';
import { useToast } from '@/hooks/use-toast';

interface MonthData {
  monthNumber: number;
  monthName: string;
  days: string;
  daysImposable: number;
  status: string;
  taxClass: string | number;
  remunerationBase: number;
  grossMonthly: number;
  cotisable: number;
  maladie: number;
  pension: number;
  ciCo2: number;
  deductions: number;
  imposable: number;
  incomeTax: number;
  cis: number;
  cissm: number;
  netPay: number;
  employerMaladie: number;
  employerPension: number;
  employerSante: number;
  employerAccident: number;
  employerTotal: number;
  normalHours: number;
}

export function CreatePayslip() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { companies, employees, generateEmployeeAnnualPayslip } = useDataStore();
  const [searchParams] = useSearchParams();

  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(searchParams.get('companyId') || '');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [autoCalc, setAutoCalc] = useState<boolean>(true);

  // Initialize 12 months with zeros
  const [monthsData, setMonthsData] = useState<MonthData[]>(() =>
    Array.from({ length: 12 }, (_, i) => ({
      monthNumber: i + 1,
      monthName: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][i],
      days: `1-${new Date(new Date().getFullYear(), i + 1, 0).getDate()}`,
      daysImposable: new Date(new Date().getFullYear(), i + 1, 0).getDate(),
      status: 'Empl.',
      taxClass: '2',
      remunerationBase: 0,
      grossMonthly: 0,
      cotisable: 0,
      maladie: 0,
      pension: 0,
      ciCo2: 0,
      deductions: 0,
      imposable: 0,
      incomeTax: 0,
      cis: 0,
      cissm: 0,
      netPay: 0,
      employerMaladie: 0,
      employerPension: 0,
      employerSante: 0,
      employerAccident: 0,
      employerTotal: 0,
      normalHours: 173,
    }))
  );

  useEffect(() => {
    if (user && user.role !== 'SUPER_ADMIN' && !user.access?.canEditPayslips) {
      navigate('/');
    }
  }, [user, navigate]);

  const availableCompanies = user?.role === 'SUPER_ADMIN'
    ? companies
    : user?.access?.hasAllCompaniesAccess
    ? companies
    : companies.filter((c) => user?.access?.companyIds.includes(c.id));

  const filteredEmployees = selectedCompanyId
    ? employees.filter((e) => e.companyId === selectedCompanyId && e.status === 'active')
    : employees.filter((e) => e.status === 'active');

  const selectedEmployee = employees.find((e) => e.id === selectedEmployeeId);
  const selectedCompany = companies.find((c) => c.id === selectedCompanyId);

  // Auto-fill from selected employee
  useEffect(() => {
    if (selectedEmployee && autoCalc) {
      const baseSalary = selectedEmployee.baseSalary;
      const taxClass = String(selectedEmployee.taxClass || '2');

      const newMonthsData = monthsData.map((month) => {
        const calc = calculatePayslip({
          remunerationBase: baseSalary,
          taxClass: taxClass,
        });

        return {
          ...month,
          taxClass: taxClass,
          remunerationBase: baseSalary,
          grossMonthly: calc.earnings.grossMonthly,
          cotisable: calc.earnings.cotisable,
          maladie: calc.employeeContrib.maladie,
          pension: calc.employeeContrib.pension,
          ciCo2: calc.employeeContrib.ciCo2,
          deductions: calc.employeeContrib.deductions,
          imposable: calc.earnings.imposable,
          incomeTax: calc.employeeContrib.incomeTax,
          cis: calc.employeeContrib.cis,
          cissm: calc.employeeContrib.cissm,
          netPay: calc.netPay,
          employerMaladie: calc.employerContrib.maladie,
          employerPension: calc.employerContrib.pension,
          employerSante: calc.employerContrib.sante,
          employerAccident: calc.employerContrib.accident,
          employerTotal: calc.employerContrib.socialSecurityTotal,
        };
      });
      setMonthsData(newMonthsData);
    }
  }, [selectedEmployee, autoCalc]);

  // Calculate totals
  const totals = useMemo(() => {
    return monthsData.reduce(
      (acc, month) => ({
        remunerationBase: acc.remunerationBase + month.remunerationBase,
        grossMonthly: acc.grossMonthly + month.grossMonthly,
        cotisable: acc.cotisable + month.cotisable,
        maladie: acc.maladie + month.maladie,
        pension: acc.pension + month.pension,
        ciCo2: acc.ciCo2 + month.ciCo2,
        deductions: acc.deductions + month.deductions,
        imposable: acc.imposable + month.imposable,
        incomeTax: acc.incomeTax + month.incomeTax,
        cis: acc.cis + month.cis,
        cissm: acc.cissm + month.cissm,
        netPay: acc.netPay + month.netPay,
        employerMaladie: acc.employerMaladie + month.employerMaladie,
        employerPension: acc.employerPension + month.employerPension,
        employerSante: acc.employerSante + month.employerSante,
        employerAccident: acc.employerAccident + month.employerAccident,
        employerTotal: acc.employerTotal + month.employerTotal,
        normalHours: acc.normalHours + month.normalHours,
        employeeContribTotal: acc.employeeContribTotal + (month.maladie + month.pension + month.ciCo2 + month.cis + month.cissm + month.deductions + month.incomeTax),
      }),
      {
        remunerationBase: 0,
        grossMonthly: 0,
        cotisable: 0,
        maladie: 0,
        pension: 0,
        ciCo2: 0,
        deductions: 0,
        imposable: 0,
        incomeTax: 0,
        cis: 0,
        cissm: 0,
        netPay: 0,
        employerMaladie: 0,
        employerPension: 0,
        employerSante: 0,
        employerAccident: 0,
        employerTotal: 0,
        normalHours: 0,
        employeeContribTotal: 0,
      }
    );
  }, [monthsData]);

  const handleMonthValueChange = (monthIndex: number, field: keyof MonthData, value: any) => {
    const newMonthsData = [...monthsData];
    const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;

    newMonthsData[monthIndex] = {
      ...newMonthsData[monthIndex],
      [field]: numValue,
    };

    // Recalculate if auto-calc is on and remuneration base changes
    if (autoCalc && field === 'remunerationBase' && numValue > 0) {
      const calc = calculatePayslip({
        remunerationBase: numValue,
        taxClass: newMonthsData[monthIndex].taxClass,
      });

      newMonthsData[monthIndex] = {
        ...newMonthsData[monthIndex],
        grossMonthly: calc.earnings.grossMonthly,
        cotisable: calc.earnings.cotisable,
        maladie: calc.employeeContrib.maladie,
        pension: calc.employeeContrib.pension,
        ciCo2: calc.employeeContrib.ciCo2,
        deductions: calc.employeeContrib.deductions,
        imposable: calc.earnings.imposable,
        incomeTax: calc.employeeContrib.incomeTax,
        cis: calc.employeeContrib.cis,
        cissm: calc.employeeContrib.cissm,
        netPay: calc.netPay,
        employerMaladie: calc.employerContrib.maladie,
        employerPension: calc.employerContrib.pension,
        employerSante: calc.employerContrib.sante,
        employerAccident: calc.employerContrib.accident,
        employerTotal: calc.employerContrib.socialSecurityTotal,
      };
    } else {
      // Always recalculate Net Pay and Employer Total based on current values
      const month = newMonthsData[monthIndex];

      // Net Pay = Gross - (Maladie + Pension + CI-CO2 + CIS + CISSM + Deductions + IncomeTax)
      month.netPay = month.grossMonthly - (
        month.maladie +
        month.pension +
        month.ciCo2 +
        month.cis +
        month.cissm +
        month.deductions +
        month.incomeTax
      );

      // Employer Total = Maladie + Pension + Santé + Accident
      month.employerTotal =
        month.employerMaladie +
        month.employerPension +
        month.employerSante +
        month.employerAccident;
    }

    setMonthsData(newMonthsData);
  };

  const handleSave = async () => {
    if (!selectedCompanyId || !selectedEmployeeId) {
      toast({
        title: 'Error',
        description: 'Please select a company and employee',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedCompany || !selectedEmployee) return;

    try {
      // Create a single annual payslip with all 12 months of data
      await generateEmployeeAnnualPayslip(selectedEmployeeId, year);

      toast({
        title: 'Success',
        description: `Annual payslip created successfully for ${selectedEmployee.firstName} ${selectedEmployee.lastName}`,
      });

      // Navigate back to company detail
      const basePath = user?.role === 'SUPER_ADMIN' ? '/admin' : '';
      navigate(`${basePath}/companies/${selectedCompanyId}`);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create annual payslip',
        variant: 'destructive',
      });
    }
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
            <h1 className="text-3xl font-bold text-foreground">{t('analytics.annualPayslip.title').toUpperCase()}</h1>
            <p className="text-muted-foreground">Create annual payslips - All 12 months</p>
          </div>
        </div>
        <div className="flex gap-2">
          <label className="flex items-center gap-2 text-sm px-3 py-2 bg-muted rounded-md">
            <input
              type="checkbox"
              checked={autoCalc}
              onChange={(e) => setAutoCalc(e.target.checked)}
              className="h-4 w-4"
            />
            Auto-calculate
          </label>
          <Button onClick={handleSave} className="bg-primary text-primary-foreground">
            <Save size={16} className="mr-2" />
            Save Payslips
          </Button>
        </div>
      </div>

      {/* Selection Section */}
      <Card>
        <CardHeader>
          <CardTitle>{t('payslips.payrollBook')} {year}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company">Company *</Label>
              <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
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

            <div className="space-y-2">
              <Label htmlFor="employee">Employee *</Label>
              <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId} disabled={!selectedCompanyId}>
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

          {selectedEmployee && selectedCompany && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="text-xs text-muted-foreground">employee.matricule</p>
                <p className="font-medium">{selectedEmployee.matricule || '1989 11 24 004 47'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">employee.class</p>
                <p className="font-medium">{selectedEmployee.class || 'Empl.'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">employee.hire_date</p>
                <p className="font-medium">
                  {selectedEmployee.hireDate ? new Date(selectedEmployee.hireDate).toLocaleDateString('fr-LU') : '-'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">employee.address</p>
                <p className="font-medium">{selectedEmployee.address || '52, Grand-Rue'}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Détail Mensuel Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('analytics.annualPayslip.monthlyBreakdown')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-bold">{t('analytics.annualPayslip.month').toUpperCase()}</TableHead>
                  <TableHead className="font-bold">{t('analytics.annualPayslip.days').toUpperCase()}</TableHead>
                  <TableHead className="font-bold">{t('analytics.annualPayslip.stat').toUpperCase()}</TableHead>
                  <TableHead className="font-bold">{t('analytics.annualPayslip.class').toUpperCase()}</TableHead>
                  <TableHead className="font-bold text-right">{t('analytics.annualPayslip.baseRemuneration').toUpperCase().split(' ').join('\n')}</TableHead>
                  <TableHead className="font-bold text-right">{t('analytics.annualPayslip.monthlyGross').toUpperCase().split(' ').join('\n')}</TableHead>
                  <TableHead className="font-bold text-right">{t('analytics.annualPayslip.contributable').toUpperCase()}</TableHead>
                  <TableHead className="font-bold text-right">{t('analytics.annualPayslip.health').toUpperCase()}</TableHead>
                  <TableHead className="font-bold text-right">{t('analytics.annualPayslip.pension').toUpperCase()}</TableHead>
                  <TableHead className="font-bold text-right">{t('analytics.annualPayslip.deductions').toUpperCase()}</TableHead>
                  <TableHead className="font-bold text-right">{t('analytics.annualPayslip.taxable').toUpperCase()}</TableHead>
                  <TableHead className="font-bold text-right">{t('analytics.annualPayslip.taxes').toUpperCase()}</TableHead>
                  <TableHead className="font-bold text-right">{t('analytics.annualPayslip.ciCo2').toUpperCase()}</TableHead>
                  <TableHead className="font-bold text-right">{t('analytics.annualPayslip.cis').toUpperCase()}</TableHead>
                  <TableHead className="font-bold text-right">{t('analytics.annualPayslip.cissm').toUpperCase()}</TableHead>
                  <TableHead className="font-bold text-right">{t('analytics.annualPayslip.netSalary').toUpperCase().split(' ').join('\n')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthsData.map((month, index) => (
                  <TableRow key={month.monthNumber} className="border-b">
                    <TableCell className="font-medium">{month.monthName} {month.days}</TableCell>
                    <TableCell>{month.daysImposable}</TableCell>
                    <TableCell>
                      <Input
                        value={month.status}
                        onChange={(e) => handleMonthValueChange(index, 'status', e.target.value)}
                        className="h-8 w-20 text-sm"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={month.taxClass}
                        onChange={(e) => handleMonthValueChange(index, 'taxClass', e.target.value)}
                        className="h-8 w-16 text-sm"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        value={month.remunerationBase || ''}
                        onChange={(e) => handleMonthValueChange(index, 'remunerationBase', e.target.value)}
                        className="h-8 w-32 text-right text-sm"
                        step="0.01"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        value={month.grossMonthly || ''}
                        onChange={(e) => handleMonthValueChange(index, 'grossMonthly', e.target.value)}
                        className="h-8 w-32 text-right text-sm"
                        step="0.01"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        value={month.cotisable || ''}
                        onChange={(e) => handleMonthValueChange(index, 'cotisable', e.target.value)}
                        className="h-8 w-32 text-right text-sm"
                        step="0.01"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        value={month.maladie || ''}
                        onChange={(e) => handleMonthValueChange(index, 'maladie', e.target.value)}
                        className="h-8 w-28 text-right text-sm"
                        step="0.01"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        value={month.pension || ''}
                        onChange={(e) => handleMonthValueChange(index, 'pension', e.target.value)}
                        className="h-8 w-28 text-right text-sm"
                        step="0.01"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        value={month.deductions || ''}
                        onChange={(e) => handleMonthValueChange(index, 'deductions', e.target.value)}
                        className="h-8 w-28 text-right text-sm"
                        step="0.01"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        value={month.imposable || ''}
                        onChange={(e) => handleMonthValueChange(index, 'imposable', e.target.value)}
                        className="h-8 w-32 text-right text-sm"
                        step="0.01"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        value={month.incomeTax || ''}
                        onChange={(e) => handleMonthValueChange(index, 'incomeTax', e.target.value)}
                        className="h-8 w-28 text-right text-sm"
                        step="0.01"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        value={month.ciCo2 || ''}
                        onChange={(e) => handleMonthValueChange(index, 'ciCo2', e.target.value)}
                        className="h-8 w-24 text-right text-sm"
                        step="0.01"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        value={month.cis || ''}
                        onChange={(e) => handleMonthValueChange(index, 'cis', e.target.value)}
                        className="h-8 w-24 text-right text-sm"
                        step="0.01"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        value={month.cissm || ''}
                        onChange={(e) => handleMonthValueChange(index, 'cissm', e.target.value)}
                        className="h-8 w-24 text-right text-sm"
                        step="0.01"
                      />
                    </TableCell>
                    <TableCell className="text-right font-bold text-sm bg-muted/30">{formatCurrency(month.netPay)}</TableCell>
                  </TableRow>
                ))}

                {/* Total Row */}
                <TableRow className="bg-primary/10 font-bold">
                  <TableCell colSpan={4}>{t('analytics.annualPayslip.annualTotal').toUpperCase()}</TableCell>
                  <TableCell className="text-right">{formatCurrency(totals.remunerationBase)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(totals.grossMonthly)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(totals.cotisable)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(totals.maladie)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(totals.pension)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(totals.deductions)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(totals.imposable)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(totals.incomeTax)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(totals.ciCo2)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(totals.cis)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(totals.cissm)}</TableCell>
                  <TableCell className="text-right text-lg">{formatCurrency(totals.netPay)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Cotisations Patronales */}
      <Card>
        <CardHeader>
          <CardTitle>{t('analytics.annualPayslip.employerContributions')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-bold">{t('analytics.annualPayslip.month').toUpperCase()}</TableHead>
                  <TableHead className="font-bold text-right">{t('analytics.annualPayslip.health').toUpperCase()}</TableHead>
                  <TableHead className="font-bold text-right">{t('analytics.annualPayslip.pension').toUpperCase()}</TableHead>
                  <TableHead className="font-bold text-right">{t('analytics.sante').toUpperCase()}</TableHead>
                  <TableHead className="font-bold text-right">{t('analytics.accident').toUpperCase()}</TableHead>
                  <TableHead className="font-bold text-right">{t('analytics.annualPayslip.socialSecurityTotal').toUpperCase()}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthsData.map((month, index) => (
                  <TableRow key={month.monthNumber} className="border-b">
                    <TableCell className="font-medium">{getMonthNameFr(month.monthNumber)}</TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        value={month.employerMaladie || ''}
                        onChange={(e) => handleMonthValueChange(index, 'employerMaladie', e.target.value)}
                        className="h-8 w-28 text-right text-sm"
                        step="0.01"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        value={month.employerPension || ''}
                        onChange={(e) => handleMonthValueChange(index, 'employerPension', e.target.value)}
                        className="h-8 w-28 text-right text-sm"
                        step="0.01"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        value={month.employerSante || ''}
                        onChange={(e) => handleMonthValueChange(index, 'employerSante', e.target.value)}
                        className="h-8 w-28 text-right text-sm"
                        step="0.01"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        value={month.employerAccident || ''}
                        onChange={(e) => handleMonthValueChange(index, 'employerAccident', e.target.value)}
                        className="h-8 w-28 text-right text-sm"
                        step="0.01"
                      />
                    </TableCell>
                    <TableCell className="text-right font-bold bg-muted/30">{formatCurrency(month.employerTotal)}</TableCell>
                  </TableRow>
                ))}

                <TableRow className="bg-primary/10 font-bold">
                  <TableCell>{t('analytics.annualPayslip.annualTotal').toUpperCase()}</TableCell>
                  <TableCell className="text-right">{formatCurrency(totals.employerMaladie)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(totals.employerPension)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(totals.employerSante)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(totals.employerAccident)}</TableCell>
                  <TableCell className="text-right text-lg">{formatCurrency(totals.employerTotal)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Récapitulation Annuelle */}
      <Card>
        <CardHeader>
          <CardTitle>{t('analytics.annualPayslip.annualRecapitulation')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">{t('analytics.annualPayslip.salaries')}</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('analytics.annualPayslip.totalGross')}</span>
                  <span className="font-bold">{formatCurrency(totals.grossMonthly)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('analytics.annualPayslip.totalNet')}</span>
                  <span className="font-bold text-green-600">{formatCurrency(totals.netPay)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-lg">{t('analytics.annualPayslip.contributions')}</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('analytics.annualPayslip.employee')}</span>
                  <span className="font-bold">{formatCurrency(totals.employeeContribTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('analytics.annualPayslip.employer')}</span>
                  <span className="font-bold">{formatCurrency(totals.employerTotal)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-lg">{t('analytics.annualPayslip.other')}</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('analytics.annualPayslip.taxesLabel')}</span>
                  <span className="font-bold">{formatCurrency(totals.incomeTax)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('analytics.annualPayslip.hoursWorked')}</span>
                  <span className="font-bold">{totals.normalHours}h</span>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-blue-600 font-medium dark:text-blue-400">{t('analytics.annualPayslip.annualGrossSalary')}</p>
                  <p className="text-2xl font-bold text-blue-700 mt-2 dark:text-blue-300">
                    {formatCurrency(totals.grossMonthly)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-200 dark:bg-green-950">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-green-600 font-medium dark:text-green-400">{t('analytics.annualPayslip.annualNetSalary')}</p>
                  <p className="text-2xl font-bold text-green-700 mt-2 dark:text-green-300">
                    {formatCurrency(totals.netPay)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-orange-50 border-orange-200 dark:bg-orange-950">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-orange-600 font-medium dark:text-orange-400">{t('analytics.annualPayslip.totalContributions')}</p>
                  <p className="text-2xl font-bold text-orange-700 mt-2 dark:text-orange-300">
                    {formatCurrency(totals.employeeContribTotal)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-purple-50 border-purple-200 dark:bg-purple-950">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-purple-600 font-medium dark:text-purple-400">{t('analytics.annualPayslip.annualTaxes')}</p>
                  <p className="text-2xl font-bold text-purple-700 mt-2 dark:text-purple-300">
                    {formatCurrency(totals.incomeTax)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CreatePayslip;
