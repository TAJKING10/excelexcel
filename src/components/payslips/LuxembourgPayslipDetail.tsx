import React from 'react';
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
import { Download, FileText } from 'lucide-react';
import { generatePayslipPDF } from '@/lib/pdf';
import { formatCurrency, getMonthNameFr, getMonthAbbreviation } from '@/lib/luxembourgPayroll';

interface LuxembourgPayslipDetailProps {
  payslip: Payslip;
}

export function LuxembourgPayslipDetail({ payslip }: LuxembourgPayslipDetailProps) {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language as 'fr' | 'en';

  const handleDownloadPDF = () => {
    generatePayslipPDF(payslip);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(currentLanguage);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header with Download */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('payslips.payrollBook').toUpperCase()}</h1>
          <p className="text-lg text-muted-foreground mt-2">
            {payslip.period.year} - {getMonthNameFr(payslip.period.month)}
          </p>
        </div>
        <Button onClick={handleDownloadPDF} variant="outline" size="lg">
          <Download size={20} className="mr-2" />
          {t('payslips.download')}
        </Button>
      </div>

      {/* Company and Employee Header Card */}
      <Card className="border-2">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Company Info */}
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">{payslip.company.name}</h2>
              {payslip.company.address && (
                <p className="text-sm text-muted-foreground">{payslip.company.address}</p>
              )}
              {payslip.company.city && (
                <p className="text-sm text-muted-foreground">{payslip.company.city}</p>
              )}
              {payslip.company.registrationNumber && (
                <p className="text-sm text-muted-foreground font-mono">
                  {payslip.company.registrationNumber}
                </p>
              )}
            </div>

            {/* Employee Status Info */}
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-sm font-semibold text-muted-foreground min-w-[100px]">
                  {t('employee.seniority')}:
                </span>
                <span className="text-sm text-foreground">
                  {payslip.employee.hireDate ? formatDate(payslip.employee.hireDate) : '-'}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-sm font-semibold text-muted-foreground min-w-[100px]">
                  {t('employee.hire_date')}:
                </span>
                <span className="text-sm text-foreground">
                  {payslip.employee.hireDate ? formatDate(payslip.employee.hireDate) : '-'}
                </span>
              </div>
              {payslip.employee.terminationDate && (
                <div className="flex items-start gap-2">
                  <span className="text-sm font-semibold text-muted-foreground min-w-[100px]">
                    {t('employee.termination_date')}:
                  </span>
                  <span className="text-sm text-foreground">
                    {formatDate(payslip.employee.terminationDate)}
                  </span>
                </div>
              )}
            </div>

            {/* Employee Info */}
            <div className="space-y-2">
              {payslip.employee.matricule && (
                <p className="text-xs text-muted-foreground font-mono">
                  MATRICULE N° {payslip.employee.matricule}
                </p>
              )}
              {payslip.employee.identityNumber && (
                <p className="text-sm text-foreground font-mono">
                  {payslip.employee.identityNumber}
                </p>
              )}
              <h3 className="text-lg font-bold text-foreground">
                {payslip.employee.firstName} {payslip.employee.lastName}
              </h3>
              {payslip.employee.address && (
                <p className="text-sm text-muted-foreground">{payslip.employee.address}</p>
              )}
              {payslip.employee.city && (
                <p className="text-sm text-muted-foreground">{payslip.employee.city}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Payslip Table - SALAIRES PLUS AVANCES MALADIE */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-lg">
            {t('payslips.salariesPlusSickAdvances').toUpperCase()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted">
                  <TableHead className="text-xs">{t('analytics.annualPayslip.days')}</TableHead>
                  <TableHead className="text-xs text-center">{t('payslips.taxableDays')}</TableHead>
                  <TableHead className="text-xs text-center">{t('analytics.annualPayslip.stat')}</TableHead>
                  <TableHead className="text-xs text-center">{t('analytics.annualPayslip.class')} - %</TableHead>
                  <TableHead className="text-xs text-right">{t('analytics.annualPayslip.baseRemuneration')}</TableHead>
                  <TableHead className="text-xs text-right">{t('analytics.annualPayslip.monthlyGross')}</TableHead>
                  <TableHead className="text-xs text-right">{t('analytics.annualPayslip.contributable')}</TableHead>
                  <TableHead className="text-xs text-right">{t('analytics.annualPayslip.health')}</TableHead>
                  <TableHead className="text-xs text-right">{t('analytics.annualPayslip.pension')}</TableHead>
                  <TableHead className="text-xs text-right">{t('analytics.annualPayslip.ciCo2')}</TableHead>
                  <TableHead className="text-xs text-right">{t('analytics.annualPayslip.deductions')}</TableHead>
                  <TableHead className="text-xs text-right">{t('analytics.annualPayslip.taxable')}</TableHead>
                  <TableHead className="text-xs text-right">{t('analytics.annualPayslip.taxes')}</TableHead>
                  <TableHead className="text-xs text-right">{t('analytics.annualPayslip.cis')}</TableHead>
                  <TableHead className="text-xs text-right">{t('analytics.annualPayslip.cissm')}</TableHead>
                  <TableHead className="text-xs text-right font-bold">{t('analytics.annualPayslip.netSalary')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="hover:bg-muted/50">
                  <TableCell className="font-mono text-xs">
                    {getMonthAbbreviation(payslip.period.month)} 1-31
                  </TableCell>
                  <TableCell className="text-center text-xs">25</TableCell>
                  <TableCell className="text-center text-xs">{payslip.employee.class || 'Empl.'}</TableCell>
                  <TableCell className="text-center text-xs font-mono">
                    {payslip.monthlyData?.taxClass || '-'}
                  </TableCell>
                  <TableCell className="text-right text-xs font-mono">
                    {payslip.earnings.remunerationBase.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right text-xs font-mono font-semibold">
                    {payslip.earnings.grossMonthly.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right text-xs font-mono">
                    {payslip.earnings.cotisable.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right text-xs font-mono text-destructive">
                    {payslip.employeeContrib.maladie.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right text-xs font-mono text-destructive">
                    {payslip.employeeContrib.pension.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right text-xs font-mono text-destructive">
                    {payslip.employeeContrib.ciCo2}
                  </TableCell>
                  <TableCell className="text-right text-xs font-mono text-destructive">
                    {payslip.employeeContrib.deductions.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right text-xs font-mono">
                    {payslip.earnings.imposable.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right text-xs font-mono text-destructive">
                    {payslip.employeeContrib.incomeTax.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right text-xs font-mono text-destructive">
                    {payslip.employeeContrib.cis}
                  </TableCell>
                  <TableCell className="text-right text-xs font-mono text-destructive">
                    {payslip.employeeContrib.cissm}
                  </TableCell>
                  <TableCell className="text-right text-sm font-mono font-bold text-green-600">
                    {payslip.netPay.toFixed(2)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Working Hours Table - RECAPITULATION */}
      {payslip.workingHours && (
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-lg">
              {t('payslips.hoursAndLeaves').toUpperCase()}
            </CardTitle>
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
                  <TableRow>
                    <TableCell className="font-mono text-xs">
                      {getMonthAbbreviation(payslip.period.month)}
                    </TableCell>
                    <TableCell className="text-right text-xs font-mono">
                      {payslip.workingHours.normalHours}
                    </TableCell>
                    <TableCell className="text-right text-xs font-mono">
                      {payslip.workingHours.supplementaryHours || 0}
                    </TableCell>
                    <TableCell className="text-right text-xs font-mono">
                      {payslip.workingHours.holidays || 0}
                    </TableCell>
                    <TableCell className="text-right text-xs font-mono">
                      {payslip.workingHours.publicHolidayExtra || 0}
                    </TableCell>
                    <TableCell className="text-right text-xs font-mono">
                      {payslip.workingHours.familyLeave || 0}
                    </TableCell>
                    <TableCell className="text-right text-xs font-mono">
                      {payslip.workingHours.sickLeave || 0}
                    </TableCell>
                    <TableCell className="text-right text-xs font-mono">
                      {payslip.workingHours.unemployment || 0}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Gross Earnings */}
        <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-blue-700 dark:text-blue-400">
              {t('payslips.grossRemuneration')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">
              {formatCurrency(payslip.earnings.grossMonthly)}
            </p>
            <div className="mt-3 space-y-1 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>{t('analytics.annualPayslip.contributable')}:</span>
                <span className="font-mono">{formatCurrency(payslip.earnings.cotisable)}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('analytics.annualPayslip.taxable')}:</span>
                <span className="font-mono">{formatCurrency(payslip.earnings.imposable)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employee Contributions */}
        <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-red-700 dark:text-red-400">
              {t('payslips.employeeContributions')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-900 dark:text-red-300">
              -{formatCurrency(payslip.employeeContrib.total)}
            </p>
            <div className="mt-3 space-y-1 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>{t('analytics.annualPayslip.health')}:</span>
                <span className="font-mono">{formatCurrency(payslip.employeeContrib.maladie)}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('analytics.annualPayslip.pension')}:</span>
                <span className="font-mono">{formatCurrency(payslip.employeeContrib.pension)}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('analytics.annualPayslip.taxes')}:</span>
                <span className="font-mono">{formatCurrency(payslip.employeeContrib.incomeTax)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Net Pay */}
        <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20 border-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-green-700 dark:text-green-400">
              {t('analytics.annualPayslip.netSalary')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-900 dark:text-green-300">
              {formatCurrency(payslip.netPay)}
            </p>
            {payslip.credits && payslip.credits > 0 && (
              <div className="mt-3 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>{t('payslips.credits')}:</span>
                  <span className="font-mono">{formatCurrency(payslip.credits)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Employer Contributions - PARTS PATRONALES */}
      <Card className="border-orange-200">
        <CardHeader>
          <CardTitle className="text-center text-lg text-orange-700 dark:text-orange-400">
            {t('payslips.employerShares').toUpperCase()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">{t('analytics.annualPayslip.health')}</div>
              <div className="text-lg font-bold text-orange-600">
                {formatCurrency(payslip.employerContrib.maladie)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">{t('analytics.annualPayslip.pension')}</div>
              <div className="text-lg font-bold text-orange-600">
                {formatCurrency(payslip.employerContrib.pension)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">{t('analytics.sante')}</div>
              <div className="text-lg font-bold text-orange-600">
                {formatCurrency(payslip.employerContrib.sante)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">{t('analytics.accident')}</div>
              <div className="text-lg font-bold text-orange-600">
                {formatCurrency(payslip.employerContrib.accident)}
              </div>
            </div>
            <div className="text-center border-l-2 border-orange-300">
              <div className="text-xs text-muted-foreground mb-1 font-semibold">{t('common.total')}</div>
              <div className="text-xl font-bold text-orange-700">
                {formatCurrency(payslip.employerContrib.socialSecurityTotal)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Year to Date Summary */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-center">{t('payslips.yearRecapitulation', { year: payslip.period.year }).toUpperCase()}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-2">{t('payslips.annualGross')}</div>
              <div className="text-xl font-bold text-foreground">
                {formatCurrency(payslip.ytd.gross)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-2">{t('payslips.annualNet')}</div>
              <div className="text-xl font-bold text-green-600">
                {formatCurrency(payslip.ytd.net)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-2">{t('payslips.employeeContribShort')}</div>
              <div className="text-xl font-bold text-red-600">
                {formatCurrency(payslip.ytd.employeeContribTotal)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-2">{t('payslips.employerContribShort')}</div>
              <div className="text-xl font-bold text-orange-600">
                {formatCurrency(payslip.ytd.employerContribTotal)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-2">{t('analytics.annualPayslip.taxes')}</div>
              <div className="text-xl font-bold text-foreground">
                {formatCurrency(payslip.ytd.taxes)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
