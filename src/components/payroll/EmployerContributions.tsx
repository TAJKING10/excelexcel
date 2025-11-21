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
import { Download, Building2 } from 'lucide-react';
import { formatCurrency, getMonthAbbreviation } from '@/lib/luxembourgPayroll';

interface EmployerContributionsProps {
  companyId: string;
  year: number;
  payslips: Payslip[];
  companyName?: string;
}

export function EmployerContributions({
  companyId,
  year,
  payslips,
  companyName,
}: EmployerContributionsProps) {
  const { t } = useTranslation();

  // Filter payslips for the company and year
  const yearlyPayslips = useMemo(() => {
    return payslips.filter((p) => p.companyId === companyId && p.period.year === year);
  }, [payslips, companyId, year]);

  // Group by month
  const monthlyData = useMemo(() => {
    const data = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const monthPayslips = yearlyPayslips.filter((p) => p.period.month === month);

      const totals = monthPayslips.reduce(
        (acc, p) => ({
          employees: acc.employees + 1,
          grossSalaries: acc.grossSalaries + p.earnings.grossMonthly,
          maladie: acc.maladie + p.employerContrib.maladie,
          pension: acc.pension + p.employerContrib.pension,
          sante: acc.sante + p.employerContrib.sante,
          accident: acc.accident + p.employerContrib.accident,
          total: acc.total + p.employerContrib.socialSecurityTotal,
        }),
        {
          employees: 0,
          grossSalaries: 0,
          maladie: 0,
          pension: 0,
          sante: 0,
          accident: 0,
          total: 0,
        }
      );

      return {
        month,
        monthAbbr: getMonthAbbreviation(month),
        ...totals,
      };
    });
    return data;
  }, [yearlyPayslips]);

  // Calculate annual totals
  const annualTotals = useMemo(() => {
    return monthlyData.reduce(
      (acc, m) => ({
        employees: Math.max(acc.employees, m.employees),
        grossSalaries: acc.grossSalaries + m.grossSalaries,
        maladie: acc.maladie + m.maladie,
        pension: acc.pension + m.pension,
        sante: acc.sante + m.sante,
        accident: acc.accident + m.accident,
        total: acc.total + m.total,
      }),
      {
        employees: 0,
        grossSalaries: 0,
        maladie: 0,
        pension: 0,
        sante: 0,
        accident: 0,
        total: 0,
      }
    );
  }, [monthlyData]);

  const handleExport = () => {
    // Prepare data for export
    const exportData = monthlyData.map((data) => ({
      'Month': getMonthAbbreviation(data.month),
      'Employees': data.employees,
      'Gross Salaries': data.grossSalaries,
      'Maladie': data.maladie,
      'Pension': data.pension,
      'Sante': data.sante,
      'Accident': data.accident,
      'Total': data.total,
    }));

    // Add totals row
    exportData.push({
      'Month': 'TOTAL',
      'Employees': '',
      'Gross Salaries': totals.grossSalaries,
      'Maladie': totals.maladie,
      'Pension': totals.pension,
      'Sante': totals.sante,
      'Accident': totals.accident,
      'Total': totals.total,
    });

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Employer Contributions ${year}`);

    // Download file
    const fileName = `employer_contributions_${companyName || companyId}_${year}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  if (yearlyPayslips.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          <Building2 size={48} className="mx-auto mb-4 opacity-50" />
          <p>{t('payroll.noDataFor')} {year}</p>
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
            {t('payslips.employerShares').toUpperCase()} - {year}
          </h2>
          {companyName && (
            <p className="text-lg text-muted-foreground mt-1">{companyName}</p>
          )}
        </div>
        <Button onClick={handleExport} variant="outline">
          <Download size={16} className="mr-2" />
          {t('actions.export')}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-orange-700 dark:text-orange-400">
              {t('analytics.annualPayslip.health')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-900 dark:text-orange-300">
              {formatCurrency(annualTotals.maladie)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">3.05%</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-orange-700 dark:text-orange-400">
              {t('analytics.annualPayslip.pension')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-900 dark:text-orange-300">
              {formatCurrency(annualTotals.pension)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">8%</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-orange-700 dark:text-orange-400">
              {t('analytics.sante')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-900 dark:text-orange-300">
              {formatCurrency(annualTotals.sante)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">4%</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-orange-700 dark:text-orange-400">
              {t('analytics.accident')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-900 dark:text-orange-300">
              {formatCurrency(annualTotals.accident)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">~1%</p>
          </CardContent>
        </Card>

        <Card className="border-orange-500 bg-orange-100/50 dark:bg-orange-900/30 border-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-orange-800 dark:text-orange-300">
              {t('payroll.annualTotal')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-950 dark:text-orange-200">
              {formatCurrency(annualTotals.total)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {((annualTotals.total / annualTotals.grossSalaries) * 100).toFixed(1)}% {t('payroll.ofGross')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('payroll.monthlyEmployerSharesDetail')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted">
                  <TableHead className="text-xs">{t('analytics.annualPayslip.month')}</TableHead>
                  <TableHead className="text-xs text-center">{t('common.employees')}</TableHead>
                  <TableHead className="text-xs text-right">{t('payroll.payrollMass')}</TableHead>
                  <TableHead className="text-xs text-right">{t('analytics.annualPayslip.health')} (3.05%)</TableHead>
                  <TableHead className="text-xs text-right">{t('analytics.annualPayslip.pension')} (8%)</TableHead>
                  <TableHead className="text-xs text-right">{t('analytics.sante')} (4%)</TableHead>
                  <TableHead className="text-xs text-right">{t('analytics.accident')} (~1%)</TableHead>
                  <TableHead className="text-xs text-right font-bold">{t('common.total')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlyData.map((data) => (
                  <TableRow
                    key={data.month}
                    className={data.employees > 0 ? 'hover:bg-muted/50' : 'opacity-40'}
                  >
                    <TableCell className="font-bold text-xs">{data.monthAbbr}</TableCell>
                    <TableCell className="text-center text-xs">
                      {data.employees || '-'}
                    </TableCell>
                    {data.employees > 0 ? (
                      <>
                        <TableCell className="text-right text-sm font-mono">
                          {formatCurrency(data.grossSalaries)}
                        </TableCell>
                        <TableCell className="text-right text-xs font-mono text-orange-600">
                          {formatCurrency(data.maladie)}
                        </TableCell>
                        <TableCell className="text-right text-xs font-mono text-orange-600">
                          {formatCurrency(data.pension)}
                        </TableCell>
                        <TableCell className="text-right text-xs font-mono text-orange-600">
                          {formatCurrency(data.sante)}
                        </TableCell>
                        <TableCell className="text-right text-xs font-mono text-orange-600">
                          {formatCurrency(data.accident)}
                        </TableCell>
                        <TableCell className="text-right text-sm font-mono font-bold text-orange-700">
                          {formatCurrency(data.total)}
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
                      </>
                    )}
                  </TableRow>
                ))}
                <TableRow className="bg-muted font-bold border-t-2 border-muted-foreground">
                  <TableCell>TOTAL</TableCell>
                  <TableCell className="text-center text-xs">-</TableCell>
                  <TableCell className="text-right text-sm font-mono">
                    {formatCurrency(annualTotals.grossSalaries)}
                  </TableCell>
                  <TableCell className="text-right text-sm font-mono text-orange-600">
                    {formatCurrency(annualTotals.maladie)}
                  </TableCell>
                  <TableCell className="text-right text-sm font-mono text-orange-600">
                    {formatCurrency(annualTotals.pension)}
                  </TableCell>
                  <TableCell className="text-right text-sm font-mono text-orange-600">
                    {formatCurrency(annualTotals.sante)}
                  </TableCell>
                  <TableCell className="text-right text-sm font-mono text-orange-600">
                    {formatCurrency(annualTotals.accident)}
                  </TableCell>
                  <TableCell className="text-right text-lg font-mono font-bold text-orange-700">
                    {formatCurrency(annualTotals.total)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Cost Breakdown */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle>{t('payroll.employerChargesBreakdown')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Maladie */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">{t('payroll.healthInsurance')}</span>
                <span className="text-sm font-bold text-orange-600">
                  {formatCurrency(annualTotals.maladie)}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-orange-500 h-2 rounded-full"
                  style={{
                    width: `${(annualTotals.maladie / annualTotals.total) * 100}%`,
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {((annualTotals.maladie / annualTotals.total) * 100).toFixed(1)}% {t('payroll.ofCharges')}
              </p>
            </div>

            {/* Pension */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">{t('payroll.pensionInsurance')}</span>
                <span className="text-sm font-bold text-orange-600">
                  {formatCurrency(annualTotals.pension)}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-orange-600 h-2 rounded-full"
                  style={{
                    width: `${(annualTotals.pension / annualTotals.total) * 100}%`,
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {((annualTotals.pension / annualTotals.total) * 100).toFixed(1)}% {t('payroll.ofCharges')}
              </p>
            </div>

            {/* Santé */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">{t('payroll.healthMutuality')}</span>
                <span className="text-sm font-bold text-orange-600">
                  {formatCurrency(annualTotals.sante)}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-orange-400 h-2 rounded-full"
                  style={{
                    width: `${(annualTotals.sante / annualTotals.total) * 100}%`,
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {((annualTotals.sante / annualTotals.total) * 100).toFixed(1)}% {t('payroll.ofCharges')}
              </p>
            </div>

            {/* Accident */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">{t('payroll.accidentInsurance')}</span>
                <span className="text-sm font-bold text-orange-600">
                  {formatCurrency(annualTotals.accident)}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-orange-300 h-2 rounded-full"
                  style={{
                    width: `${(annualTotals.accident / annualTotals.total) * 100}%`,
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {((annualTotals.accident / annualTotals.total) * 100).toFixed(1)}% {t('payroll.ofCharges')}
              </p>
            </div>
          </div>

          {/* Total Cost */}
          <div className="mt-6 pt-6 border-t-2 border-muted-foreground">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-lg font-semibold">{t('payroll.totalEmployerCost')}</p>
                <p className="text-xs text-muted-foreground">
                  {t('payroll.salariesPlusEmployerCharges')}
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-primary">
                  {formatCurrency(annualTotals.grossSalaries + annualTotals.total)}
                </p>
                <p className="text-xs text-muted-foreground">
                  ({formatCurrency(annualTotals.grossSalaries)} + {formatCurrency(annualTotals.total)})
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
