import React, { useMemo } from 'react';
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
    // TODO: Implement Excel export
    console.log('Exporting annual recapitulation...');
  };

  if (yearlyPayslips.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          <TrendingUp size={48} className="mx-auto mb-4 opacity-50" />
          <p>Aucune données pour l'année {year}</p>
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
            RÉCAPITULATION ANNÉE {year}
          </h2>
          {employeeName && (
            <p className="text-sm text-muted-foreground mt-1">{employeeName}</p>
          )}
        </div>
        <Button onClick={handleExport} variant="outline">
          <Download size={16} className="mr-2" />
          Exporter
        </Button>
      </div>

      {/* Annual Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-blue-700 dark:text-blue-400">
              Salaire Brut Annuel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">
              {formatCurrency(annualTotals.grossMonthly)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {yearlyPayslips.length} mois
            </p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-red-700 dark:text-red-400">
              Cotisations Totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-900 dark:text-red-300">
              {formatCurrency(annualTotals.employeeContribTotal)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {((annualTotals.employeeContribTotal / annualTotals.grossMonthly) * 100).toFixed(1)}% du brut
            </p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-orange-700 dark:text-orange-400">
              Impôts Annuels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-900 dark:text-orange-300">
              {formatCurrency(annualTotals.incomeTax)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {((annualTotals.incomeTax / annualTotals.grossMonthly) * 100).toFixed(1)}% du brut
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20 border-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-green-700 dark:text-green-400">
              Salaire Net Annuel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-900 dark:text-green-300">
              {formatCurrency(annualTotals.netPay)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {((annualTotals.netPay / annualTotals.grossMonthly) * 100).toFixed(1)}% du brut
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle>Détail Mensuel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted">
                  <TableHead className="text-xs">Mois</TableHead>
                  <TableHead className="text-xs text-right">Brut</TableHead>
                  <TableHead className="text-xs text-right">Maladie</TableHead>
                  <TableHead className="text-xs text-right">Pension</TableHead>
                  <TableHead className="text-xs text-right">CI-CO2</TableHead>
                  <TableHead className="text-xs text-right">Déductions</TableHead>
                  <TableHead className="text-xs text-right">Imposable</TableHead>
                  <TableHead className="text-xs text-right">Impôts</TableHead>
                  <TableHead className="text-xs text-right">CIS</TableHead>
                  <TableHead className="text-xs text-right">CISSM</TableHead>
                  <TableHead className="text-xs text-right font-bold">Net</TableHead>
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
          <CardTitle>Récapitulatif des Heures et Absences</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted">
                  <TableHead className="text-xs">Mois</TableHead>
                  <TableHead className="text-xs text-right">Normal</TableHead>
                  <TableHead className="text-xs text-right">Suppl.</TableHead>
                  <TableHead className="text-xs text-right">Congés</TableHead>
                  <TableHead className="text-xs text-right">Férié extra</TableHead>
                  <TableHead className="text-xs text-right">Congés fam.</TableHead>
                  <TableHead className="text-xs text-right">Maladie</TableHead>
                  <TableHead className="text-xs text-right">Chômage</TableHead>
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
