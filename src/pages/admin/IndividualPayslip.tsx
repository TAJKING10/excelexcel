import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguageStore } from '@/stores/language';
import { useDataStore } from '@/stores/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save } from 'lucide-react';
import type { Payslip } from '@/types';
import { calculateMaladie, calculatePension, calculateCiCo2, calculateIncomeTax, LUXEMBOURG_RATES } from '@/lib/luxembourgPayroll';

export function IndividualPayslip() {
  const { individualId, payslipId } = useParams<{ individualId: string; payslipId?: string }>();
  const navigate = useNavigate();
  const { t } = useLanguageStore();
  const { individuals, addPayslip, updatePayslip, getPayslipsByIndividual } = useDataStore();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [existingPayslip, setExistingPayslip] = useState<Payslip | null>(null);
  const [form, setForm] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    baseSalary: 0,
    bonus: 0,
    overtime: 0,
    grossSalary: 0,
    healthInsurance: 0,
    pension: 0,
    incomeTax: 0,
    totalDeductions: 0,
    netSalary: 0,
    notes: ''
  });

  const individual = individuals.find(i => i.id === individualId);

  useEffect(() => {
    if (individualId) {
      loadPayslips();
    }
  }, [individualId]);

  useEffect(() => {
    if (individual?.baseSalary) {
      setForm(prev => ({
        ...prev,
        baseSalary: individual.baseSalary,
        grossSalary: individual.baseSalary
      }));
      calculateDeductions(individual.baseSalary);
    }
  }, [individual]);

  const loadPayslips = async () => {
    if (!individualId) return;
    try {
      setLoading(true);
      const payslips = await getPayslipsByIndividual(individualId);

      if (payslipId) {
        const payslip = payslips.find(p => p.id === payslipId);
        if (payslip) {
          setExistingPayslip(payslip);
          setForm({
            month: payslip.period.month,
            year: payslip.period.year,
            baseSalary: payslip.earnings.remunerationBase || 0,
            bonus: payslip.earnings.bonus || 0,
            overtime: payslip.earnings.overtime || 0,
            grossSalary: payslip.earnings.grossMonthly,
            healthInsurance: payslip.employeeContrib.maladie,
            pension: payslip.employeeContrib.pension,
            incomeTax: payslip.employeeContrib.incomeTax,
            totalDeductions: payslip.employeeContrib.total,
            netSalary: payslip.netPay,
            notes: payslip.notes || ''
          });
        }
      } else {
        // Check if payslip exists for current month/year
        const currentPayslip = payslips.find(
          p => p.period.month === form.month && p.period.year === form.year
        );
        if (currentPayslip) {
          setExistingPayslip(currentPayslip);
          setForm({
            month: currentPayslip.period.month,
            year: currentPayslip.period.year,
            baseSalary: currentPayslip.earnings.remunerationBase || 0,
            bonus: currentPayslip.earnings.bonus || 0,
            overtime: currentPayslip.earnings.overtime || 0,
            grossSalary: currentPayslip.earnings.grossMonthly,
            healthInsurance: currentPayslip.employeeContrib.maladie,
            pension: currentPayslip.employeeContrib.pension,
            incomeTax: currentPayslip.employeeContrib.incomeTax,
            totalDeductions: currentPayslip.employeeContrib.total,
            netSalary: currentPayslip.netPay,
            notes: currentPayslip.notes || ''
          });
        }
      }
    } catch (error) {
      console.error('Failed to load payslips:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDeductions = (gross: number) => {
    // Use proper Luxembourg payroll calculations
    const cotisable = gross; // For individuals, cotisable = gross
    const healthInsurance = calculateMaladie(cotisable); // 3% by default
    const pension = calculatePension(cotisable); // 8%
    const ciCo2 = calculateCiCo2(); // 14€ fixed
    const cis = LUXEMBOURG_RATES.cis; // 50€ fixed
    const cissm = LUXEMBOURG_RATES.cissm; // 70€ fixed

    // Calculate imposable (taxable income after social contributions)
    const imposable = cotisable - healthInsurance - pension;

    // Use tax class 1 (single) as default for individuals
    const incomeTax = calculateIncomeTax(imposable, 1, 0);

    // Total deductions
    const total = healthInsurance + pension + ciCo2 + cis + cissm + incomeTax;
    const net = gross - total;

    setForm(prev => ({
      ...prev,
      grossSalary: gross,
      healthInsurance: Math.round(healthInsurance * 100) / 100,
      pension: Math.round(pension * 100) / 100,
      incomeTax: Math.round(incomeTax * 100) / 100,
      totalDeductions: Math.round(total * 100) / 100,
      netSalary: Math.round(net * 100) / 100
    }));
  };

  const handleSalaryChange = (field: string, value: number) => {
    const newForm = { ...form, [field]: value };
    const totalGross = newForm.baseSalary + newForm.bonus + newForm.overtime;
    calculateDeductions(totalGross);
  };

  const handleSave = async () => {
    if (!individual || !individualId) return;

    try {
      setLoading(true);

      // Calculate all components properly
      const cotisable = form.grossSalary;
      const healthInsurance = calculateMaladie(cotisable);
      const pension = calculatePension(cotisable);
      const ciCo2 = calculateCiCo2();
      const cis = LUXEMBOURG_RATES.cis;
      const cissm = LUXEMBOURG_RATES.cissm;
      const imposable = cotisable - healthInsurance - pension;
      const incomeTax = calculateIncomeTax(imposable, 1, 0);
      const totalDeductions = healthInsurance + pension + ciCo2 + cis + cissm + incomeTax;

      // Calculate employer contributions for individuals (matching employee contributions)
      const employerMaladie = healthInsurance;
      const employerPension = pension;
      const sante = Math.round(cotisable * LUXEMBOURG_RATES.employer.sante * 100) / 100;
      const accident = Math.round(cotisable * LUXEMBOURG_RATES.employer.accident * 100) / 100;
      const socialSecurityTotal = employerMaladie + employerPension + sante + accident;

      const payslipData: any = {
        individualId: individualId,
        companyId: null,
        employeeId: null,
        period: {
          month: form.month,
          year: form.year
        },
        employee: {
          id: individual.id,
          firstName: individual.firstName,
          lastName: individual.lastName,
          email: individual.email,
          class: 'Individual',
          hireDate: individual.createdAt,
          terminationDate: null,
          matricule: individual.matricule || '',
          address: individual.address || ''
        },
        company: {
          id: `individual-${individualId}`,
          name: `${individual.firstName} ${individual.lastName}`,
          country: individual.country,
          currency: individual.currency
        },
        earnings: {
          remunerationBase: form.baseSalary,
          bonus: form.bonus,
          overtime: form.overtime,
          grossMonthly: form.grossSalary,
          cotisable: cotisable,
          imposable: imposable
        },
        employeeContrib: {
          maladie: healthInsurance,
          pension: pension,
          ciCo2: ciCo2,
          cis: cis,
          cissm: cissm,
          incomeTax: incomeTax,
          total: totalDeductions,
          otherDeductions: 0,
          deductions: 0
        },
        employerContrib: {
          maladie: employerMaladie,
          pension: employerPension,
          sante: sante,
          accident: accident,
          socialSecurityTotal: socialSecurityTotal
        },
        netPay: form.netSalary,
        ytd: {
          gross: 0,
          net: 0,
          employeeContribTotal: 0,
          employerContribTotal: 0,
          taxes: 0
        },
        lines: [],
        notes: form.notes
      };

      if (existingPayslip) {
        await updatePayslip(existingPayslip.id, payslipData);
        toast({
          title: t('common.success'),
          description: 'Payslip updated successfully'
        });
      } else {
        await addPayslip(payslipData);
        toast({
          title: t('common.success'),
          description: 'Payslip created successfully'
        });
      }

      navigate(`/admin/individuals/${individualId}`);
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message || 'Failed to save payslip',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!individual) {
    return <div>Individual not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate(`/admin/individuals/${individualId}`)}
        >
          <ArrowLeft size={16} className="mr-2" />
          {t('common.back')}
        </Button>
        <div>
          <h2 className="text-2xl font-semibold text-foreground">
            {existingPayslip ? 'Edit Payslip' : 'Create Payslip'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {individual.firstName} {individual.lastName}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payslip Period</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="month">Month</Label>
              <Select
                value={String(form.month)}
                onValueChange={(val) => setForm({ ...form, month: parseInt(val) })}
              >
                <SelectTrigger id="month">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                    <SelectItem key={m} value={String(m)}>
                      {new Date(2024, m - 1, 1).toLocaleString('default', { month: 'long' })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Select
                value={String(form.year)}
                onValueChange={(val) => setForm({ ...form, year: parseInt(val) })}
              >
                <SelectTrigger id="year">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2023, 2024, 2025, 2026].map(y => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Earnings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="baseSalary">Base Salary (€)</Label>
              <Input
                id="baseSalary"
                type="number"
                step="0.01"
                value={form.baseSalary}
                onChange={(e) => handleSalaryChange('baseSalary', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bonus">Bonus (€)</Label>
              <Input
                id="bonus"
                type="number"
                step="0.01"
                value={form.bonus}
                onChange={(e) => handleSalaryChange('bonus', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="overtime">Overtime (€)</Label>
              <Input
                id="overtime"
                type="number"
                step="0.01"
                value={form.overtime}
                onChange={(e) => handleSalaryChange('overtime', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="grossSalary">Gross Salary (€)</Label>
              <Input
                id="grossSalary"
                type="number"
                step="0.01"
                value={form.grossSalary}
                disabled
                className="bg-muted"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Deductions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="healthInsurance">Health Insurance (€)</Label>
              <Input
                id="healthInsurance"
                type="number"
                step="0.01"
                value={form.healthInsurance}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pension">Pension (€)</Label>
              <Input
                id="pension"
                type="number"
                step="0.01"
                value={form.pension}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="incomeTax">Income Tax (€)</Label>
              <Input
                id="incomeTax"
                type="number"
                step="0.01"
                value={form.incomeTax}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalDeductions">Total Deductions (€)</Label>
              <Input
                id="totalDeductions"
                type="number"
                step="0.01"
                value={form.totalDeductions}
                disabled
                className="bg-muted font-bold"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Net Pay</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="netSalary">Net Salary (€)</Label>
            <Input
              id="netSalary"
              type="number"
              step="0.01"
              value={form.netSalary}
              disabled
              className="bg-muted font-bold text-lg"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Input
              id="notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Any additional information..."
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button
          variant="outline"
          onClick={() => navigate(`/admin/individuals/${individualId}`)}
        >
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={loading}>
          <Save size={16} className="mr-2" />
          {existingPayslip ? 'Update Payslip' : 'Create Payslip'}
        </Button>
      </div>
    </div>
  );
}
