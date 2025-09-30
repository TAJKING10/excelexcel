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
import { Download } from 'lucide-react';
import { generatePayslipPDF } from '@/lib/pdf';

interface PayslipDetailProps {
  payslip: Payslip;
}

export function PayslipDetail({ payslip }: PayslipDetailProps) {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language as 'fr' | 'en';

  const handleDownloadPDF = () => {
    generatePayslipPDF(payslip);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(currentLanguage, {
      style: 'currency',
      currency: payslip.company.currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(currentLanguage);
  };

  const monthNames = {
    fr: [
      'Janvier',
      'Février',
      'Mars',
      'Avril',
      'Mai',
      'Juin',
      'Juillet',
      'Août',
      'Septembre',
      'Octobre',
      'Novembre',
      'Décembre',
    ],
    en: [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ],
  };

  const getMonthName = (month: number) => {
    return monthNames[currentLanguage][month - 1];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">
            {t('payslips.title')}
          </h2>
          <p className="text-sm text-muted-foreground">
            {getMonthName(payslip.period.month)} {payslip.period.year}
          </p>
        </div>
        <Button onClick={handleDownloadPDF} variant="outline">
          <Download size={16} className="mr-2" />
          {t('payslips.download')}
        </Button>
      </div>

      {/* Company & Employee Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{payslip.company.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('companies.country')}:</span>
              <span className="text-foreground font-medium">{payslip.company.country}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('companies.currency')}:</span>
              <span className="text-foreground font-medium">{payslip.company.currency}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {payslip.employee.firstName} {payslip.employee.lastName}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('employees.email')}:</span>
              <span className="text-foreground font-medium">{payslip.employee.email}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('employees.class')}:</span>
              <span className="text-foreground font-medium">{payslip.employee.class}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('employees.hireDate')}:</span>
              <span className="text-foreground font-medium">
                {formatDate(payslip.employee.hireDate)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Earnings Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>{t('payslips.earnings.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('payslips.lines.code')}</TableHead>
                <TableHead>{t('payslips.lines.label')}</TableHead>
                <TableHead className="text-right">{t('payslips.lines.quantity')}</TableHead>
                <TableHead className="text-right">{t('payslips.lines.rate')}</TableHead>
                <TableHead className="text-right">{t('payslips.lines.amount')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payslip.lines
                .filter((line) => line.type === 'earning')
                .map((line) => (
                  <TableRow key={line.id}>
                    <TableCell className="font-medium">{line.code}</TableCell>
                    <TableCell>
                      {currentLanguage === 'fr' ? line.label_fr : line.label_en}
                    </TableCell>
                    <TableCell className="text-right">{line.quantity}</TableCell>
                    <TableCell className="text-right">{formatCurrency(line.rate)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(line.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              <TableRow className="bg-muted/50 font-bold">
                <TableCell colSpan={4} className="text-right">
                  {t('payslips.earnings.grossMonthly')}
                </TableCell>
                <TableCell className="text-right">{formatCurrency(payslip.earnings.grossMonthly)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Employee Contributions */}
      <Card>
        <CardHeader>
          <CardTitle>{t('payslips.employeeContrib.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('payslips.lines.code')}</TableHead>
                <TableHead>{t('payslips.lines.label')}</TableHead>
                <TableHead className="text-right">{t('payslips.lines.quantity')}</TableHead>
                <TableHead className="text-right">{t('payslips.lines.rate')}</TableHead>
                <TableHead className="text-right">{t('payslips.lines.amount')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payslip.lines
                .filter((line) => line.type === 'deduction')
                .map((line) => (
                  <TableRow key={line.id}>
                    <TableCell className="font-medium">{line.code}</TableCell>
                    <TableCell>
                      {currentLanguage === 'fr' ? line.label_fr : line.label_en}
                    </TableCell>
                    <TableCell className="text-right">{line.quantity}</TableCell>
                    <TableCell className="text-right">{formatCurrency(line.rate)}</TableCell>
                    <TableCell className="text-right font-medium text-destructive">
                      -{formatCurrency(line.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              <TableRow className="bg-muted/50 font-bold">
                <TableCell colSpan={4} className="text-right">
                  {t('payslips.employeeContrib.total')}
                </TableCell>
                <TableCell className="text-right text-destructive">
                  -{formatCurrency(payslip.employeeContrib.total)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Employer Contributions */}
      <Card>
        <CardHeader>
          <CardTitle>{t('payslips.employerContrib.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('payslips.lines.code')}</TableHead>
                <TableHead>{t('payslips.lines.label')}</TableHead>
                <TableHead className="text-right">{t('payslips.lines.quantity')}</TableHead>
                <TableHead className="text-right">{t('payslips.lines.rate')}</TableHead>
                <TableHead className="text-right">{t('payslips.lines.amount')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payslip.lines
                .filter((line) => line.type === 'employer_contrib')
                .map((line) => (
                  <TableRow key={line.id}>
                    <TableCell className="font-medium">{line.code}</TableCell>
                    <TableCell>
                      {currentLanguage === 'fr' ? line.label_fr : line.label_en}
                    </TableCell>
                    <TableCell className="text-right">{line.quantity}</TableCell>
                    <TableCell className="text-right">{formatCurrency(line.rate)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(line.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              <TableRow className="bg-muted/50 font-bold">
                <TableCell colSpan={4} className="text-right">
                  {t('payslips.employerContrib.socialSecurityTotal')}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(payslip.employerContrib.socialSecurityTotal)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Net Pay Summary */}
      <Card className="border-2 border-primary">
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <span className="text-2xl font-bold text-foreground">
              {t('payslips.netPay')}
            </span>
            <span className="text-3xl font-bold text-green-600">
              {formatCurrency(payslip.netPay)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Year to Date Summary */}
      <Card>
        <CardHeader>
          <CardTitle>{t('payslips.ytd.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">
                {t('payslips.ytd.gross')}
              </div>
              <div className="text-lg font-semibold text-foreground">
                {formatCurrency(payslip.ytd.gross)}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">
                {t('payslips.ytd.net')}
              </div>
              <div className="text-lg font-semibold text-green-600">
                {formatCurrency(payslip.ytd.net)}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">
                {t('payslips.ytd.employeeContrib')}
              </div>
              <div className="text-lg font-semibold text-destructive">
                {formatCurrency(payslip.ytd.employeeContribTotal)}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">
                {t('payslips.ytd.employerContrib')}
              </div>
              <div className="text-lg font-semibold text-orange-600">
                {formatCurrency(payslip.ytd.employerContribTotal)}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">
                {t('payslips.ytd.taxes')}
              </div>
              <div className="text-lg font-semibold text-foreground">
                {formatCurrency(payslip.ytd.taxes)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}