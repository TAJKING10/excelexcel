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
          <h1 className="text-3xl font-bold text-foreground">LIVRE DE PAIE</h1>
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
                  Ancienneté:
                </span>
                <span className="text-sm text-foreground">
                  {payslip.employee.hireDate ? formatDate(payslip.employee.hireDate) : '-'}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-sm font-semibold text-muted-foreground min-w-[100px]">
                  Entrée:
                </span>
                <span className="text-sm text-foreground">
                  {payslip.employee.hireDate ? formatDate(payslip.employee.hireDate) : '-'}
                </span>
              </div>
              {payslip.employee.terminationDate && (
                <div className="flex items-start gap-2">
                  <span className="text-sm font-semibold text-muted-foreground min-w-[100px]">
                    Sortie:
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
            SALAIRES PLUS AVANCES MALADIE
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted">
                  <TableHead className="text-xs">Jours</TableHead>
                  <TableHead className="text-xs text-center">Jours impos.</TableHead>
                  <TableHead className="text-xs text-center">Stat.</TableHead>
                  <TableHead className="text-xs text-center">Classe - %</TableHead>
                  <TableHead className="text-xs text-right">Rémun. Base</TableHead>
                  <TableHead className="text-xs text-right">Brut Mensuel</TableHead>
                  <TableHead className="text-xs text-right">Cotisable</TableHead>
                  <TableHead className="text-xs text-right">Maladie</TableHead>
                  <TableHead className="text-xs text-right">Pension</TableHead>
                  <TableHead className="text-xs text-right">CI-CO2</TableHead>
                  <TableHead className="text-xs text-right">Déductions</TableHead>
                  <TableHead className="text-xs text-right">Imposable</TableHead>
                  <TableHead className="text-xs text-right">Impôts</TableHead>
                  <TableHead className="text-xs text-right">CIS</TableHead>
                  <TableHead className="text-xs text-right">CISSM</TableHead>
                  <TableHead className="text-xs text-right font-bold">Salaire Net</TableHead>
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
              HEURES ET CONGÉS
            </CardTitle>
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
                    <TableHead className="text-xs text-right">Congés familliale</TableHead>
                    <TableHead className="text-xs text-right">Maladie</TableHead>
                    <TableHead className="text-xs text-right">Chômage</TableHead>
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
              Rémunération Brute
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">
              {formatCurrency(payslip.earnings.grossMonthly)}
            </p>
            <div className="mt-3 space-y-1 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Cotisable:</span>
                <span className="font-mono">{formatCurrency(payslip.earnings.cotisable)}</span>
              </div>
              <div className="flex justify-between">
                <span>Imposable:</span>
                <span className="font-mono">{formatCurrency(payslip.earnings.imposable)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employee Contributions */}
        <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-red-700 dark:text-red-400">
              Cotisations Salariales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-900 dark:text-red-300">
              -{formatCurrency(payslip.employeeContrib.total)}
            </p>
            <div className="mt-3 space-y-1 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Maladie:</span>
                <span className="font-mono">{formatCurrency(payslip.employeeContrib.maladie)}</span>
              </div>
              <div className="flex justify-between">
                <span>Pension:</span>
                <span className="font-mono">{formatCurrency(payslip.employeeContrib.pension)}</span>
              </div>
              <div className="flex justify-between">
                <span>Impôts:</span>
                <span className="font-mono">{formatCurrency(payslip.employeeContrib.incomeTax)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Net Pay */}
        <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20 border-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-green-700 dark:text-green-400">
              Salaire Net
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-900 dark:text-green-300">
              {formatCurrency(payslip.netPay)}
            </p>
            {payslip.credits && payslip.credits > 0 && (
              <div className="mt-3 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Crédits:</span>
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
            PARTS PATRONALES
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">Maladie</div>
              <div className="text-lg font-bold text-orange-600">
                {formatCurrency(payslip.employerContrib.maladie)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">Pension</div>
              <div className="text-lg font-bold text-orange-600">
                {formatCurrency(payslip.employerContrib.pension)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">Santé</div>
              <div className="text-lg font-bold text-orange-600">
                {formatCurrency(payslip.employerContrib.sante)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">Accident</div>
              <div className="text-lg font-bold text-orange-600">
                {formatCurrency(payslip.employerContrib.accident)}
              </div>
            </div>
            <div className="text-center border-l-2 border-orange-300">
              <div className="text-xs text-muted-foreground mb-1 font-semibold">Total</div>
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
          <CardTitle className="text-center">RÉCAPITULATION ANNÉE {payslip.period.year}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-2">Brut Annuel</div>
              <div className="text-xl font-bold text-foreground">
                {formatCurrency(payslip.ytd.gross)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-2">Net Annuel</div>
              <div className="text-xl font-bold text-green-600">
                {formatCurrency(payslip.ytd.net)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-2">Cotis. Salariales</div>
              <div className="text-xl font-bold text-red-600">
                {formatCurrency(payslip.ytd.employeeContribTotal)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-2">Cotis. Patronales</div>
              <div className="text-xl font-bold text-orange-600">
                {formatCurrency(payslip.ytd.employerContribTotal)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-2">Impôts</div>
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
