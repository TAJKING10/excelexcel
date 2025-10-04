import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDataStore } from '@/stores/data';
import { useAuthStore } from '@/stores/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Save } from 'lucide-react';
import { calculatePayslip, formatCurrency, getMonthNameFr } from '@/lib/luxembourgPayroll';
import { useToast } from '@/hooks/use-toast';
import type { MonthlyPayslipData } from '@/types';

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
  // Employer contributions
  employerMaladie: number;
  employerPension: number;
  employerSante: number;
  employerAccident: number;
  employerTotal: number;
  // Working hours
  normalHours: number;
}

export function CreateAnnualPayslip() {
  const { employeeId } = useParams<{ employeeId?: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuthStore();
  const { companies, employees, addPayslip } = useDataStore();

  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(employeeId || '');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [baseSalary, setBaseSalary] = useState<number>(0);
  const [taxClass, setTaxClass] = useState<string>('2');
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

  // Guard: only Super Admin can access
  useEffect(() => {
    if (user && user.role !== 'SUPER_ADMIN') {
      navigate('/');
    }
  }, [user, navigate]);

  const availableCompanies = companies;
  const filteredEmployees = selectedCompanyId
    ? employees.filter((e) => e.companyId === selectedCompanyId && e.status === 'active')
    : employees.filter((e) => e.status === 'active');

  const selectedEmployee = employees.find((e) => e.id === selectedEmployeeId);
  const selectedCompany = companies.find((c) => c.id === selectedCompanyId);

  // Auto-fill from selected employee
  useEffect(() => {
    if (selectedEmployee) {
      setBaseSalary(selectedEmployee.baseSalary);
      setTaxClass(String(selectedEmployee.taxClass || '2'));
      setSelectedCompanyId(selectedEmployee.companyId);
    }
  }, [selectedEmployee]);

  // Auto-calculate when base salary or tax class changes
  useEffect(() => {
    if (autoCalc && baseSalary > 0) {
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
  }, [baseSalary, taxClass, autoCalc]);

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
      }
    );
  }, [monthsData]);

  const handleMonthValueChange = (monthIndex: number, field: keyof MonthData, value: any) => {
    const newMonthsData = [...monthsData];
    newMonthsData[monthIndex] = {
      ...newMonthsData[monthIndex],
      [field]: typeof value === 'string' ? parseFloat(value) || 0 : value,
    };
    setMonthsData(newMonthsData);
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

    // Create individual monthly payslips
    monthsData.forEach((month) => {
      const payslip = {
        employeeId: selectedEmployeeId,
        companyId: selectedCompanyId,
        period: { month: month.monthNumber, year },
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
          remunerationBase: month.remunerationBase,
          grossMonthly: month.grossMonthly,
          cotisable: month.cotisable,
          imposable: month.imposable,
        },
        employeeContrib: {
          maladie: month.maladie,
          pension: month.pension,
          ciCo2: month.ciCo2,
          cis: month.cis,
          cissm: month.cissm,
          deductions: month.deductions,
          incomeTax: month.incomeTax,
          total: month.maladie + month.pension + month.ciCo2 + month.cis + month.cissm + month.deductions + month.incomeTax,
        },
        employerContrib: {
          maladie: month.employerMaladie,
          pension: month.employerPension,
          sante: month.employerSante,
          accident: month.employerAccident,
          socialSecurityTotal: month.employerTotal,
        },
        netPay: month.netPay,
        ytd: {
          gross: 0,
          net: 0,
          employeeContribTotal: 0,
          employerContribTotal: 0,
          taxes: 0,
        },
        lines: [],
      };

      addPayslip(payslip);
    });

    toast({
      title: 'Success',
      description: `${monthsData.length} payslips created successfully`,
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
            <h1 className="text-3xl font-bold text-foreground">Créer Fiches de Paie Annuelles</h1>
            <p className="text-muted-foreground">Create annual payslips for an employee</p>
          </div>
        </div>
        <Button onClick={handleSave} className="bg-primary text-primary-foreground">
          <Save size={16} className="mr-2" />
          Save All Payslips
        </Button>
      </div>

      {/* Selection Section */}
      <Card>
        <CardHeader>
          <CardTitle>Employee & Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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

            <div className="space-y-2">
              <Label htmlFor="baseSalary">Base Salary *</Label>
              <Input
                id="baseSalary"
                type="number"
                value={baseSalary || ''}
                onChange={(e) => setBaseSalary(parseFloat(e.target.value) || 0)}
                min={0}
                step={0.01}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxClass">Tax Class *</Label>
              <Input
                id="taxClass"
                value={taxClass}
                onChange={(e) => setTaxClass(e.target.value)}
                placeholder="1, 2, etc."
              />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <input
              type="checkbox"
              id="autoCalc"
              checked={autoCalc}
              onChange={(e) => setAutoCalc(e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="autoCalc" className="cursor-pointer">
              Auto-calculate contributions and taxes
            </Label>
          </div>

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
                  <span className="text-muted-foreground">Matricule:</span>{' '}
                  <span className="font-medium">{selectedEmployee.matricule || '-'}</span>
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

      {/* Monthly Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>Détail Mensuel - {year}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Mois</TableHead>
                  <TableHead className="w-24">Jours</TableHead>
                  <TableHead className="w-20">Stat.</TableHead>
                  <TableHead className="w-24">Classe</TableHead>
                  <TableHead className="text-right">Rémun. Base</TableHead>
                  <TableHead className="text-right">Brut Mensuel</TableHead>
                  <TableHead className="text-right">Cotisable</TableHead>
                  <TableHead className="text-right">Maladie</TableHead>
                  <TableHead className="text-right">Pension</TableHead>
                  <TableHead className="text-right">Déductions</TableHead>
                  <TableHead className="text-right">Imposable</TableHead>
                  <TableHead className="text-right">Impôts</TableHead>
                  <TableHead className="text-right">CI-CO2</TableHead>
                  <TableHead className="text-right">CIS</TableHead>
                  <TableHead className="text-right">CISSM</TableHead>
                  <TableHead className="text-right font-bold">Salaire Net</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthsData.map((month, index) => (
                  <TableRow key={month.monthNumber}>
                    <TableCell className="font-medium">
                      {month.monthName} {month.days}
                    </TableCell>
                    <TableCell>{month.daysImposable}</TableCell>
                    <TableCell>
                      <Input
                        value={month.status}
                        onChange={(e) => handleMonthValueChange(index, 'status', e.target.value)}
                        className="h-8 w-20"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={month.taxClass}
                        onChange={(e) => handleMonthValueChange(index, 'taxClass', e.target.value)}
                        className="h-8 w-20"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        value={month.remunerationBase || ''}
                        onChange={(e) => handleMonthValueChange(index, 'remunerationBase', e.target.value)}
                        className="h-8 w-28 text-right"
                        step="0.01"
                        disabled={autoCalc}
                      />
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(month.grossMonthly)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(month.cotisable)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(month.maladie)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(month.pension)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(month.deductions)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(month.imposable)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(month.incomeTax)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(month.ciCo2)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(month.cis)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(month.cissm)}</TableCell>
                    <TableCell className="text-right font-bold">{formatCurrency(month.netPay)}</TableCell>
                  </TableRow>
                ))}

                {/* Annual Total Row */}
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell colSpan={4}>TOTAL ANNUEL</TableCell>
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

      {/* Employer Contributions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Cotisations Patronales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-40">Mois</TableHead>
                  <TableHead className="text-right">Maladie</TableHead>
                  <TableHead className="text-right">Pension</TableHead>
                  <TableHead className="text-right">Santé</TableHead>
                  <TableHead className="text-right">Accident</TableHead>
                  <TableHead className="text-right font-bold">Total Séc. Sociale</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthsData.map((month) => (
                  <TableRow key={month.monthNumber}>
                    <TableCell className="font-medium">{getMonthNameFr(month.monthNumber)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(month.employerMaladie)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(month.employerPension)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(month.employerSante)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(month.employerAccident)}</TableCell>
                    <TableCell className="text-right font-bold">{formatCurrency(month.employerTotal)}</TableCell>
                  </TableRow>
                ))}

                <TableRow className="bg-muted/50 font-bold">
                  <TableCell>TOTAL ANNUEL</TableCell>
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

      {/* Analytics Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Récapitulation & Analytiques</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-blue-600 font-medium">Salaire Brut Annuel</p>
                  <p className="text-2xl font-bold text-blue-700 mt-2">
                    {formatCurrency(totals.grossMonthly)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-green-600 font-medium">Salaire Net Annuel</p>
                  <p className="text-2xl font-bold text-green-700 mt-2">
                    {formatCurrency(totals.netPay)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-orange-50 border-orange-200">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-orange-600 font-medium">Cotisations Employé</p>
                  <p className="text-2xl font-bold text-orange-700 mt-2">
                    {formatCurrency(totals.maladie + totals.pension + totals.ciCo2 + totals.cis + totals.cissm + totals.deductions + totals.incomeTax)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-purple-600 font-medium">Cotisations Employeur</p>
                  <p className="text-2xl font-bold text-purple-700 mt-2">
                    {formatCurrency(totals.employerTotal)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-red-50 border-red-200">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-red-600 font-medium">Impôts Annuels</p>
                  <p className="text-2xl font-bold text-red-700 mt-2">
                    {formatCurrency(totals.incomeTax)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-indigo-50 border-indigo-200">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-indigo-600 font-medium">Heures Travaillées</p>
                  <p className="text-2xl font-bold text-indigo-700 mt-2">
                    {totals.normalHours}h
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-teal-50 border-teal-200">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-teal-600 font-medium">Coût Total Employeur</p>
                  <p className="text-2xl font-bold text-teal-700 mt-2">
                    {formatCurrency(totals.grossMonthly + totals.employerTotal)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-cyan-50 border-cyan-200">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-cyan-600 font-medium">Taux Charges Sociales</p>
                  <p className="text-2xl font-bold text-cyan-700 mt-2">
                    {totals.grossMonthly > 0
                      ? ((totals.employerTotal / totals.grossMonthly) * 100).toFixed(2) + '%'
                      : '0%'
                    }
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

export default CreateAnnualPayslip;
