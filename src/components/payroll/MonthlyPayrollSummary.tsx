import React, { useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Payslip } from '@/types';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Download, Calendar } from 'lucide-react';
import { formatCurrency, getMonthNameFr } from '@/lib/luxembourgPayroll';

interface MonthlyPayrollSummaryProps {
  companyId: string;
  year: number;
  month: number;
  payslips: Payslip[];
}

export function MonthlyPayrollSummary({
  companyId,
  year,
  month,
  payslips,
}: MonthlyPayrollSummaryProps) {
  const { t } = useTranslation();

  // Filter payslips for the specified month and year
  const monthlyPayslips = useMemo(() => {
    return payslips.filter(
      (p) =>
        p.companyId === companyId &&
        p.period.year === year &&
        p.period.month === month
    );
  }, [payslips, companyId, year, month]);

  // Calculate totals
  const totals = useMemo(() => {
    return monthlyPayslips.reduce(
      (acc, p) => ({
        employees: acc.employees + 1,
        remunerationBase: acc.remunerationBase + p.earnings.remunerationBase,
        grossMonthly: acc.grossMonthly + p.earnings.grossMonthly,
        cotisable: acc.cotisable + p.earnings.cotisable,
        imposable: acc.imposable + p.earnings.imposable,
        maladie: acc.maladie + p.employeeContrib.maladie,
        pension: acc.pension + p.employeeContrib.pension,
        ciCo2: acc.ciCo2 + p.employeeContrib.ciCo2,
        cis: acc.cis + p.employeeContrib.cis,
        cissm: acc.cissm + p.employeeContrib.cissm,
        deductions: acc.deductions + p.employeeContrib.deductions,
        incomeTax: acc.incomeTax + p.employeeContrib.incomeTax,
        employeeContribTotal: acc.employeeContribTotal + p.employeeContrib.total,
        employerMaladie: acc.employerMaladie + p.employerContrib.maladie,
        employerPension: acc.employerPension + p.employerContrib.pension,
        employerSante: acc.employerSante + p.employerContrib.sante,
        employerAccident: acc.employerAccident + p.employerContrib.accident,
        employerContribTotal: acc.employerContribTotal + p.employerContrib.socialSecurityTotal,
        netPay: acc.netPay + p.netPay,
      }),
      {
        employees: 0,
        remunerationBase: 0,
        grossMonthly: 0,
        cotisable: 0,
        imposable: 0,
        maladie: 0,
        pension: 0,
        ciCo2: 0,
        cis: 0,
        cissm: 0,
        deductions: 0,
        incomeTax: 0,
        employeeContribTotal: 0,
        employerMaladie: 0,
        employerPension: 0,
        employerSante: 0,
        employerAccident: 0,
        employerContribTotal: 0,
        netPay: 0,
      }
    );
  }, [monthlyPayslips]);

  const handleExport = () => {
    // Prepare data for export
    const exportData = monthlyPayslips.map((p) => ({
      'Employee': `${p.employee.firstName} ${p.employee.lastName}`,
      'Matricule': p.employee.matricule || '',
      'Remuneration Base': p.earnings.remunerationBase || 0,
      'Gross Monthly': p.earnings.grossMonthly,
      'Cotisable': p.earnings.cotisable,
      'Imposable': p.earnings.imposable,
      'Employee Maladie': p.employeeContrib.maladie,
      'Employee Pension': p.employeeContrib.pension,
      'Employee Total': p.employeeContrib.total,
      'Employer Maladie': p.employerContrib.maladie,
      'Employer Pension': p.employerContrib.pension,
      'Employer Sante': p.employerContrib.sante || 0,
      'Employer Accident': p.employerContrib.accident || 0,
      'Employer Total': p.employerContrib.socialSecurityTotal,
      'Net Pay': p.netPay,
    }));

    // Add totals row
    exportData.push({
      'Employee': 'TOTAL',
      'Matricule': '',
      'Remuneration Base': totals.remunerationBase,
      'Gross Monthly': totals.grossMonthly,
      'Cotisable': totals.cotisable,
      'Imposable': totals.imposable,
      'Employee Maladie': totals.employeeMaladie,
      'Employee Pension': totals.employeePension,
      'Employee Total': totals.employeeContribTotal,
      'Employer Maladie': totals.employerMaladie,
      'Employer Pension': totals.employerPension,
      'Employer Sante': totals.employerSante,
      'Employer Accident': totals.employerAccident,
      'Employer Total': totals.employerContribTotal,
      'Net Pay': totals.netPay,
    });

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `${getMonthNameFr(month)} ${year}`);

    // Download file
    const fileName = `monthly_payroll_${year}_${month.toString().padStart(2, '0')}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  if (monthlyPayslips.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          <Calendar size={48} className="mx-auto mb-4 opacity-50" />
          <p>{t('payroll.noPayslipsFor')} {getMonthNameFr(month)} {year}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            {t('payroll.monthlySummary')} - {getMonthNameFr(month)} {year}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {totals.employees} {t('common.employee', { count: totals.employees })}
          </p>
        </div>
        <Button onClick={handleExport} variant="outline">
          <Download size={16} className="mr-2" />
          {t('actions.export')}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-blue-700 dark:text-blue-400">
              {t('payroll.grossPayroll')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">
              {formatCurrency(totals.grossMonthly)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-red-700 dark:text-red-400">
              {t('payslips.employeeContributions')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-900 dark:text-red-300">
              {formatCurrency(totals.employeeContribTotal)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-orange-700 dark:text-orange-400">
              {t('analytics.annualPayslip.employerContributions')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-900 dark:text-orange-300">
              {formatCurrency(totals.employerContribTotal)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-green-700 dark:text-green-400">
              {t('payroll.totalNetSalaries')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-900 dark:text-green-300">
              {formatCurrency(totals.netPay)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Employee List */}
      <Card>
        <CardHeader>
          <CardTitle>{t('payroll.detailByEmployee')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted">
                  <TableHead className="text-xs">{t('common.employee')}</TableHead>
                  <TableHead className="text-xs text-center">{t('employee.matricule')}</TableHead>
                  <TableHead className="text-xs text-right">{t('payroll.gross')}</TableHead>
                  <TableHead className="text-xs text-right">{t('analytics.annualPayslip.health')}</TableHead>
                  <TableHead className="text-xs text-right">{t('analytics.annualPayslip.pension')}</TableHead>
                  <TableHead className="text-xs text-right">{t('analytics.annualPayslip.taxes')}</TableHead>
                  <TableHead className="text-xs text-right">{t('payroll.contribTotal')}</TableHead>
                  <TableHead className="text-xs text-right font-bold">{t('payroll.net')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlyPayslips.map((payslip) => (
                  <TableRow key={payslip.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium text-sm">
                      {payslip.employee.firstName} {payslip.employee.lastName}
                    </TableCell>
                    <TableCell className="text-center text-xs font-mono">
                      {payslip.employee.matricule || '-'}
                    </TableCell>
                    <TableCell className="text-right text-sm font-mono">
                      {formatCurrency(payslip.earnings.grossMonthly)}
                    </TableCell>
                    <TableCell className="text-right text-xs font-mono text-destructive">
                      {formatCurrency(payslip.employeeContrib.maladie)}
                    </TableCell>
                    <TableCell className="text-right text-xs font-mono text-destructive">
                      {formatCurrency(payslip.employeeContrib.pension)}
                    </TableCell>
                    <TableCell className="text-right text-xs font-mono text-destructive">
                      {formatCurrency(payslip.employeeContrib.incomeTax)}
                    </TableCell>
                    <TableCell className="text-right text-sm font-mono text-destructive">
                      {formatCurrency(payslip.employeeContrib.total)}
                    </TableCell>
                    <TableCell className="text-right text-sm font-mono font-bold text-green-600">
                      {formatCurrency(payslip.netPay)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted font-bold border-t-2 border-muted-foreground">
                  <TableCell colSpan={2}>TOTAL</TableCell>
                  <TableCell className="text-right text-sm font-mono">
                    {formatCurrency(totals.grossMonthly)}
                  </TableCell>
                  <TableCell className="text-right text-xs font-mono text-destructive">
                    {formatCurrency(totals.maladie)}
                  </TableCell>
                  <TableCell className="text-right text-xs font-mono text-destructive">
                    {formatCurrency(totals.pension)}
                  </TableCell>
                  <TableCell className="text-right text-xs font-mono text-destructive">
                    {formatCurrency(totals.incomeTax)}
                  </TableCell>
                  <TableCell className="text-right text-sm font-mono text-destructive">
                    {formatCurrency(totals.employeeContribTotal)}
                  </TableCell>
                  <TableCell className="text-right text-sm font-mono font-bold text-green-600">
                    {formatCurrency(totals.netPay)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Employer Contributions Summary */}
      <Card className="border-orange-200">
        <CardHeader>
          <CardTitle>{t('payroll.totalEmployerShares')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">{t('analytics.annualPayslip.health')}</div>
              <div className="text-lg font-bold text-orange-600">
                {formatCurrency(totals.employerMaladie)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">{t('analytics.annualPayslip.pension')}</div>
              <div className="text-lg font-bold text-orange-600">
                {formatCurrency(totals.employerPension)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">{t('analytics.sante')}</div>
              <div className="text-lg font-bold text-orange-600">
                {formatCurrency(totals.employerSante)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">{t('analytics.accident')}</div>
              <div className="text-lg font-bold text-orange-600">
                {formatCurrency(totals.employerAccident)}
              </div>
            </div>
            <div className="text-center border-l-2 border-orange-300">
              <div className="text-xs text-muted-foreground mb-1 font-semibold">{t('common.total')}</div>
              <div className="text-xl font-bold text-orange-700">
                {formatCurrency(totals.employerContribTotal)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost Summary */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle>{t('payroll.totalEmployerCost')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-lg">
              <span className="text-muted-foreground">{t('payroll.grossSalaries')}:</span>
              <span className="font-bold">{formatCurrency(totals.grossMonthly)}</span>
            </div>
            <div className="flex justify-between items-center text-lg">
              <span className="text-muted-foreground">+ {t('payroll.employerContributions')}:</span>
              <span className="font-bold text-orange-600">
                {formatCurrency(totals.employerContribTotal)}
              </span>
            </div>
            <div className="border-t-2 border-muted-foreground pt-3 flex justify-between items-center text-2xl">
              <span className="font-bold">{t('payroll.totalCost')}:</span>
              <span className="font-bold text-primary">
                {formatCurrency(totals.grossMonthly + totals.employerContribTotal)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
