import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { AnnualPayslip } from '@/types';
import { formatCurrency, getMonthNameFr } from '@/lib/luxembourgPayroll';
import { useTranslation } from 'react-i18next';

interface AnnualPayslipViewProps {
  payslip: AnnualPayslip;
}

export function AnnualPayslipView({ payslip }: AnnualPayslipViewProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">
                {t('payslip.annual_title', 'Livre de Paie')} {payslip.year}
              </CardTitle>
              <p className="text-lg font-semibold mt-2">
                {payslip.employee.lastName} {payslip.employee.firstName}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold">{payslip.company.name}</p>
              <p className="text-sm text-muted-foreground">{payslip.company.address}</p>
              <p className="text-sm text-muted-foreground">{payslip.company.city}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{t('employee.matricule')}</p>
              <p className="font-medium">{payslip.employee.matricule || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('employee.class')}</p>
              <p className="font-medium">{payslip.employee.class}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('employee.hire_date')}</p>
              <p className="font-medium">
                {new Date(payslip.employee.hireDate).toLocaleDateString('fr-LU')}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('employee.address')}</p>
              <p className="font-medium">{payslip.employee.address || '-'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('payslip.monthly_breakdown', 'Détail Mensuel')}</CardTitle>
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
                {payslip.monthlyData.map((month) => (
                  <TableRow key={month.monthNumber}>
                    <TableCell className="font-medium">
                      {month.monthName} {month.days}
                    </TableCell>
                    <TableCell>{month.daysImposable}</TableCell>
                    <TableCell>{month.status}</TableCell>
                    <TableCell>{month.taxClass}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(month.earnings.remunerationBase)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(month.earnings.grossMonthly)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(month.earnings.cotisable)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(month.employeeContrib.maladie)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(month.employeeContrib.pension)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(month.employeeContrib.deductions)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(month.earnings.imposable)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(month.employeeContrib.incomeTax)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(month.employeeContrib.ciCo2)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(month.employeeContrib.cis)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(month.employeeContrib.cissm)}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {formatCurrency(month.netPay)}
                    </TableCell>
                  </TableRow>
                ))}

                {/* Annual Total Row */}
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell colSpan={4}>TOTAL ANNUEL</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(payslip.annualTotals.earnings.remunerationBase)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(payslip.annualTotals.earnings.grossMonthly)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(payslip.annualTotals.earnings.cotisable)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(payslip.annualTotals.employeeContrib.maladie)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(payslip.annualTotals.employeeContrib.pension)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(payslip.annualTotals.employeeContrib.deductions)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(payslip.annualTotals.earnings.imposable)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(payslip.annualTotals.employeeContrib.incomeTax)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(payslip.annualTotals.employeeContrib.ciCo2)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(payslip.annualTotals.employeeContrib.cis)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(payslip.annualTotals.employeeContrib.cissm)}
                  </TableCell>
                  <TableCell className="text-right text-lg">
                    {formatCurrency(payslip.annualTotals.netPay)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Employer Contributions Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('payslip.employer_contributions', 'Cotisations Patronales')}</CardTitle>
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
                {payslip.monthlyData.map((month) => {
                  // Calculate employer contributions for each month
                  const employerMaladie = month.employeeContrib.maladie;
                  const employerPension = month.employeeContrib.pension;
                  const employerSante = month.earnings.cotisable * 0.0011;
                  const employerAccident = month.earnings.cotisable * 0.0075;
                  const total = employerMaladie + employerPension + employerSante + employerAccident;

                  return (
                    <TableRow key={month.monthNumber}>
                      <TableCell className="font-medium">
                        {getMonthNameFr(month.monthNumber)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(employerMaladie)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(employerPension)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(employerSante)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(employerAccident)}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {formatCurrency(total)}
                      </TableCell>
                    </TableRow>
                  );
                })}

                {/* Total Row */}
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell>TOTAL ANNUEL</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(payslip.annualTotals.employerContrib.maladie)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(payslip.annualTotals.employerContrib.pension)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(payslip.annualTotals.employerContrib.sante)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(payslip.annualTotals.employerContrib.accident)}
                  </TableCell>
                  <TableCell className="text-right text-lg">
                    {formatCurrency(payslip.annualTotals.employerContrib.socialSecurityTotal)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Annual Recapitulation */}
      <Card>
        <CardHeader>
          <CardTitle>{t('payslip.annual_recapitulation', 'Récapitulation Annuelle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Salaires</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Brut Total:</span>
                  <span className="font-bold">
                    {formatCurrency(payslip.recapitulation.totalGrossSalary)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Net Total:</span>
                  <span className="font-bold text-green-600">
                    {formatCurrency(payslip.recapitulation.totalNetSalary)}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Cotisations</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Employé:</span>
                  <span className="font-bold">
                    {formatCurrency(payslip.recapitulation.totalEmployeeContributions)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Employeur:</span>
                  <span className="font-bold">
                    {formatCurrency(payslip.recapitulation.totalEmployerContributions)}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Autres</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Impôts:</span>
                  <span className="font-bold">
                    {formatCurrency(payslip.recapitulation.totalTaxes)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Heures Travaillées:</span>
                  <span className="font-bold">
                    {payslip.recapitulation.totalHoursWorked}h
                  </span>
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-blue-600 font-medium">Salaire Brut Annuel</p>
                  <p className="text-2xl font-bold text-blue-700 mt-2">
                    {formatCurrency(payslip.annualTotals.earnings.grossMonthly)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-green-600 font-medium">Salaire Net Annuel</p>
                  <p className="text-2xl font-bold text-green-700 mt-2">
                    {formatCurrency(payslip.annualTotals.netPay)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-orange-50 border-orange-200">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-orange-600 font-medium">Total Cotisations</p>
                  <p className="text-2xl font-bold text-orange-700 mt-2">
                    {formatCurrency(payslip.annualTotals.employeeContrib.total)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-purple-600 font-medium">Impôts Annuels</p>
                  <p className="text-2xl font-bold text-purple-700 mt-2">
                    {formatCurrency(payslip.annualTotals.employeeContrib.incomeTax)}
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
