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
import { Download, TrendingUp } from 'lucide-react';
import { formatCurrency, getMonthAbbreviation } from '@/lib/luxembourgPayroll';

interface AnnualRecapitulationProps {
  employeeId: string;
  year: number;
  payslips: Payslip[];
  employeeName?: string;
}

export function AnnualRecapitulation({
  employeeId,
  year,
  payslips,
  employeeName,
}: AnnualRecapitulationProps) {
  const { t } = useTranslation();

  // Filter and sort payslips for the employee and year
  const yearlyPayslips = useMemo(() => {
    return payslips
      .filter((p) => p.employeeId === employeeId && p.period.year === year)
      .sort((a, b) => a.period.month - b.period.month);
  }, [payslips, employeeId, year]);

  // Create array of all 12 months with data
  const monthlyData = useMemo(() => {
    const data = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const payslip = yearlyPayslips.find((p) => p.period.month === month);
      return {
        month,
        monthAbbr: getMonthAbbreviation(month),
        payslip,
      };
    });
    return data;
  }, [yearlyPayslips]);

  // Calculate annual totals
  const annualTotals = useMemo(() => {
    return yearlyPayslips.reduce(
      (acc, p) => ({
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
        netPay: acc.netPay + p.netPay,
        // Hours totals
        normalHours: acc.normalHours + (p.workingHours?.normalHours || 0),
        supplementaryHours: acc.supplementaryHours + (p.workingHours?.supplementaryHours || 0),
        holidays: acc.holidays + (p.workingHours?.holidays || 0),
        publicHolidayExtra: acc.publicHolidayExtra + (p.workingHours?.publicHolidayExtra || 0),
        familyLeave: acc.familyLeave + (p.workingHours?.familyLeave || 0),
        paternityLeave: acc.paternityLeave + (p.workingHours?.paternityLeave || 0),
        sickLeave: acc.sickLeave + (p.workingHours?.sickLeave || 0),
        unemployment: acc.unemployment + (p.workingHours?.unemployment || 0),
      }),
      {
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
        netPay: 0,
        normalHours: 0,
        supplementaryHours: 0,
        holidays: 0,
        publicHolidayExtra: 0,
        familyLeave: 0,
        paternityLeave: 0,
        sickLeave: 0,
        unemployment: 0,
      }
    );
  }, [yearlyPayslips]);

  const handleExport = () => {
    // Prepare data for export
    const exportData = monthlyData
      .filter((m) => m.payslip) // Only include months with payslips
      .map((m) => {
        const p = m.payslip!;
        return {
          'Month': m.monthAbbr,
          'Normal Hours': p.workingHours?.normalHours || 0,
          'Supplementary Hours': p.workingHours?.supplementaryHours || 0,
          'Holidays': p.workingHours?.holidays || 0,
          'Public Holiday Extra': p.workingHours?.publicHolidayExtra || 0,
          'Family Leave': p.workingHours?.familyLeave || 0,
          'Paternity Leave': p.workingHours?.paternityLeave || 0,
          'Sick Leave': p.workingHours?.sickLeave || 0,
          'Unemployment': p.workingHours?.unemployment || 0,
          'Gross Salary': p.earnings.grossMonthly,
          'Net Pay': p.netPay,
          'Employee Contrib': p.employeeContrib.total,
          'Employer Contrib': p.employerContrib.socialSecurityTotal,
        };
      });

    // Add totals row
    exportData.push({
      'Month': 'TOTAL',
      'Normal Hours': totals.normalHours,
      'Supplementary Hours': totals.supplementaryHours,
      'Holidays': totals.holidays,
      'Public Holiday Extra': totals.publicHolidayExtra,
      'Family Leave': totals.familyLeave,
      'Paternity Leave': totals.paternityLeave,
      'Sick Leave': totals.sickLeave,
      'Unemployment': totals.unemployment,
      'Gross Salary': totals.grossSalary,
      'Net Pay': totals.netPay,
      'Employee Contrib': totals.employeeContrib,
      'Employer Contrib': totals.employerContrib,
    });

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Annual Recap ${year}`);

    // Download file
    const fileName = `annual_recapitulation_${employeeName || employeeId}_${year}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  if (yearlyPayslips.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          <TrendingUp size={48} className="mx-auto mb-4 opacity-50" />
          <p>{t('payroll.noDataForYear', { year })}</p>
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
            {t('payroll.yearRecapitulation', { year }).toUpperCase()}
          </h2>
          {employeeName && (
            <p className="text-sm text-muted-foreground mt-1">{employeeName}</p>
          )}
        </div>
        <Button onClick={handleExport} variant="outline">
          <Download size={16} className="mr-2" />
          {t('actions.export')}
        </Button>
      </div>

      {/* Annual Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-blue-700 dark:text-blue-400">
              {t('analytics.annualPayslip.annualGrossSalary')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">
              {formatCurrency(annualTotals.grossMonthly)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {yearlyPayslips.length} {t('common.months')}
            </p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-red-700 dark:text-red-400">
              {t('analytics.annualPayslip.totalContributions')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-900 dark:text-red-300">
              {formatCurrency(annualTotals.employeeContribTotal)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {((annualTotals.employeeContribTotal / annualTotals.grossMonthly) * 100).toFixed(1)}% {t('payroll.ofGross')}
            </p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-orange-700 dark:text-orange-400">
              {t('analytics.annualPayslip.annualTaxes')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-900 dark:text-orange-300">
              {formatCurrency(annualTotals.incomeTax)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {((annualTotals.incomeTax / annualTotals.grossMonthly) * 100).toFixed(1)}% {t('payroll.ofGross')}
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20 border-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-green-700 dark:text-green-400">
              {t('analytics.annualPayslip.annualNetSalary')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-900 dark:text-green-300">
              {formatCurrency(annualTotals.netPay)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {((annualTotals.netPay / annualTotals.grossMonthly) * 100).toFixed(1)}% {t('payroll.ofGross')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('analytics.annualPayslip.monthlyBreakdown')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted">
                  <TableHead className="text-xs">{t('analytics.annualPayslip.month')}</TableHead>
                  <TableHead className="text-xs text-right">{t('payroll.gross')}</TableHead>
                  <TableHead className="text-xs text-right">{t('analytics.annualPayslip.health')}</TableHead>
                  <TableHead className="text-xs text-right">{t('analytics.annualPayslip.pension')}</TableHead>
                  <TableHead className="text-xs text-right">{t('analytics.annualPayslip.ciCo2')}</TableHead>
                  <TableHead className="text-xs text-right">{t('analytics.annualPayslip.deductions')}</TableHead>
                  <TableHead className="text-xs text-right">{t('analytics.annualPayslip.taxable')}</TableHead>
                  <TableHead className="text-xs text-right">{t('analytics.annualPayslip.taxes')}</TableHead>
                  <TableHead className="text-xs text-right">{t('analytics.annualPayslip.cis')}</TableHead>
                  <TableHead className="text-xs text-right">{t('analytics.annualPayslip.cissm')}</TableHead>
                  <TableHead className="text-xs text-right font-bold">{t('payroll.net')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlyData.map(({ month, monthAbbr, payslip }) => (
                  <TableRow key={month} className={payslip ? 'hover:bg-muted/50' : 'opacity-40'}>
                    <TableCell className="font-bold text-xs">{monthAbbr}</TableCell>
                    {payslip ? (
                      <>
                        <TableCell className="text-right text-xs font-mono">
                          {formatCurrency(payslip.earnings.grossMonthly)}
                        </TableCell>
                        <TableCell className="text-right text-xs font-mono text-destructive">
                          {formatCurrency(payslip.employeeContrib.maladie)}
                        </TableCell>
                        <TableCell className="text-right text-xs font-mono text-destructive">
                          {formatCurrency(payslip.employeeContrib.pension)}
                        </TableCell>
                        <TableCell className="text-right text-xs font-mono text-destructive">
                          {payslip.employeeContrib.ciCo2}
                        </TableCell>
                        <TableCell className="text-right text-xs font-mono text-destructive">
                          {formatCurrency(payslip.employeeContrib.deductions)}
                        </TableCell>
                        <TableCell className="text-right text-xs font-mono">
                          {formatCurrency(payslip.earnings.imposable)}
                        </TableCell>
                        <TableCell className="text-right text-xs font-mono text-destructive">
                          {formatCurrency(payslip.employeeContrib.incomeTax)}
                        </TableCell>
                        <TableCell className="text-right text-xs font-mono text-destructive">
                          {payslip.employeeContrib.cis}
                        </TableCell>
                        <TableCell className="text-right text-xs font-mono text-destructive">
                          {payslip.employeeContrib.cissm}
                        </TableCell>
                        <TableCell className="text-right text-sm font-mono font-bold text-green-600">
                          {formatCurrency(payslip.netPay)}
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell className="text-right text-xs">-</TableCell>
                        <TableCell className="text-right text-xs">-</TableCell>
                        <TableCell className="text-right text-xs">-</TableCell>
                        <TableCell className="text-right text-xs">-</TableCell>
                        <TableCell className="text-right text-xs">-</TableCell>
                        <TableCell className="text-right text-xs">-</TableCell>
                        <TableCell className="text-right text-xs">-</TableCell>
                        <TableCell className="text-right text-xs">-</TableCell>
                        <TableCell className="text-right text-xs">-</TableCell>
                        <TableCell className="text-right text-xs">-</TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
                <TableRow className="bg-muted font-bold border-t-2 border-muted-foreground">
                  <TableCell>TOTAL</TableCell>
                  <TableCell className="text-right text-sm font-mono">
                    {formatCurrency(annualTotals.grossMonthly)}
                  </TableCell>
                  <TableCell className="text-right text-xs font-mono text-destructive">
                    {formatCurrency(annualTotals.maladie)}
                  </TableCell>
                  <TableCell className="text-right text-xs font-mono text-destructive">
                    {formatCurrency(annualTotals.pension)}
                  </TableCell>
                  <TableCell className="text-right text-xs font-mono text-destructive">
                    {annualTotals.ciCo2}
                  </TableCell>
                  <TableCell className="text-right text-xs font-mono text-destructive">
                    {formatCurrency(annualTotals.deductions)}
                  </TableCell>
                  <TableCell className="text-right text-sm font-mono">
                    {formatCurrency(annualTotals.imposable)}
                  </TableCell>
                  <TableCell className="text-right text-xs font-mono text-destructive">
                    {formatCurrency(annualTotals.incomeTax)}
                  </TableCell>
                  <TableCell className="text-right text-xs font-mono text-destructive">
                    {annualTotals.cis}
                  </TableCell>
                  <TableCell className="text-right text-xs font-mono text-destructive">
                    {annualTotals.cissm}
                  </TableCell>
                  <TableCell className="text-right text-lg font-mono font-bold text-green-600">
                    {formatCurrency(annualTotals.netPay)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Hours Summary */}
      <Card>
        <CardHeader>
          <CardTitle>{t('payroll.hoursAndAbsencesSummary')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted">
                  <TableHead className="text-xs">{t('analytics.annualPayslip.month')}</TableHead>
                  <TableHead className="text-xs text-right">{t('payslips.hours.normal')}</TableHead>
                  <TableHead className="text-xs text-right">{t('payslips.hours.supplementary')}</TableHead>
                  <TableHead className="text-xs text-right">{t('payslips.hours.holidays')}</TableHead>
                  <TableHead className="text-xs text-right">{t('payslips.hours.publicHolidayExtra')}</TableHead>
                  <TableHead className="text-xs text-right">{t('payslips.hours.familyLeave')}</TableHead>
                  <TableHead className="text-xs text-right">{t('payslips.hours.sickLeave')}</TableHead>
                  <TableHead className="text-xs text-right">{t('payslips.hours.unemployment')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlyData.map(({ month, monthAbbr, payslip }) => (
                  <TableRow key={month} className={payslip ? 'hover:bg-muted/50' : 'opacity-40'}>
                    <TableCell className="font-bold text-xs">{monthAbbr}</TableCell>
                    <TableCell className="text-right text-xs font-mono">
                      {payslip?.workingHours?.normalHours || '-'}
                    </TableCell>
                    <TableCell className="text-right text-xs font-mono">
                      {payslip?.workingHours?.supplementaryHours || 0}
                    </TableCell>
                    <TableCell className="text-right text-xs font-mono">
                      {payslip?.workingHours?.holidays || 0}
                    </TableCell>
                    <TableCell className="text-right text-xs font-mono">
                      {payslip?.workingHours?.publicHolidayExtra || 0}
                    </TableCell>
                    <TableCell className="text-right text-xs font-mono">
                      {payslip?.workingHours?.familyLeave || 0}
                    </TableCell>
                    <TableCell className="text-right text-xs font-mono">
                      {payslip?.workingHours?.sickLeave || 0}
                    </TableCell>
                    <TableCell className="text-right text-xs font-mono">
                      {payslip?.workingHours?.unemployment || 0}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted font-bold border-t-2 border-muted-foreground">
                  <TableCell>TOTAL</TableCell>
                  <TableCell className="text-right text-sm font-mono">
                    {annualTotals.normalHours}
                  </TableCell>
                  <TableCell className="text-right text-sm font-mono">
                    {annualTotals.supplementaryHours}
                  </TableCell>
                  <TableCell className="text-right text-sm font-mono">
                    {annualTotals.holidays}
                  </TableCell>
                  <TableCell className="text-right text-sm font-mono">
                    {annualTotals.publicHolidayExtra}
                  </TableCell>
                  <TableCell className="text-right text-sm font-mono">
                    {annualTotals.familyLeave}
                  </TableCell>
                  <TableCell className="text-right text-sm font-mono">
                    {annualTotals.sickLeave}
                  </TableCell>
                  <TableCell className="text-right text-sm font-mono">
                    {annualTotals.unemployment}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
