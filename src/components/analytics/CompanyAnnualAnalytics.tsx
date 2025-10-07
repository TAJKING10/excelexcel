import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDataStore } from '@/stores/data';
import { formatCurrency } from '@/lib/luxembourgPayroll';
import { useTranslation } from 'react-i18next';
import { Users, TrendingUp, DollarSign, FileText } from 'lucide-react';
import type { CompanyAnnualAnalysis } from '@/types';

interface CompanyAnnualAnalyticsProps {
  companyId: string;
  defaultYear?: number;
}

export function CompanyAnnualAnalytics({ companyId, defaultYear }: CompanyAnnualAnalyticsProps) {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(defaultYear || currentYear);
  const getCompanyAnnualAnalysis = useDataStore((state) => state.getCompanyAnnualAnalysis);

  const analysis: CompanyAnnualAnalysis = getCompanyAnnualAnalysis(companyId, selectedYear);

  // Calculate averages
  const avgGrossSalary = analysis.totalEmployees > 0
    ? analysis.totalGrossSalary / analysis.totalEmployees
    : 0;
  const avgNetSalary = analysis.totalEmployees > 0
    ? analysis.totalNetSalary / analysis.totalEmployees
    : 0;

  // Generate year options (last 5 years)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="space-y-6">
      {/* Header with Year Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          {t('analytics.company_annual', 'Analyse Annuelle de l\'Entreprise')} - {selectedYear}
        </h2>
        <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Employés Totaux</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analysis.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">
              {analysis.activeEmployees} actifs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Masse Salariale Brute</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analysis.totalGrossSalary)}</div>
            <p className="text-xs text-muted-foreground">
              Moyenne: {formatCurrency(avgGrossSalary)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Masse Salariale Nette</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analysis.totalNetSalary)}</div>
            <p className="text-xs text-muted-foreground">
              Moyenne: {formatCurrency(avgNetSalary)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cotisations Totales</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                analysis.totalEmployeeContributions + analysis.totalEmployerContributions
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Employé + Employeur
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Répartition des Cotisations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Cotisations Employés</span>
              <span className="text-lg font-bold text-blue-600">
                {formatCurrency(analysis.totalEmployeeContributions)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Cotisations Employeur</span>
              <span className="text-lg font-bold text-green-600">
                {formatCurrency(analysis.totalEmployerContributions)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-sm font-medium">Impôts Totaux</span>
              <span className="text-lg font-bold text-orange-600">
                {formatCurrency(analysis.totalTaxes)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Coût Total pour l'Entreprise</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Salaires Bruts</span>
              <span className="text-lg font-bold">
                {formatCurrency(analysis.totalGrossSalary)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Charges Patronales</span>
              <span className="text-lg font-bold">
                {formatCurrency(analysis.totalEmployerContributions)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-sm font-bold">Coût Total Entreprise</span>
              <span className="text-xl font-bold text-red-600">
                {formatCurrency(analysis.totalGrossSalary + analysis.totalEmployerContributions)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Coût moyen par employé: {formatCurrency(
                (analysis.totalGrossSalary + analysis.totalEmployerContributions) /
                (analysis.totalEmployees || 1)
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Employee Payslips Table */}
      <Card>
        <CardHeader>
          <CardTitle>Fiches de Paie des Employés - {selectedYear}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employé</TableHead>
                  <TableHead>Matricule</TableHead>
                  <TableHead className="text-right">Brut Annuel</TableHead>
                  <TableHead className="text-right">Net Annuel</TableHead>
                  <TableHead className="text-right">Cotis. Employé</TableHead>
                  <TableHead className="text-right">Cotis. Employeur</TableHead>
                  <TableHead className="text-right">Impôts</TableHead>
                  <TableHead className="text-right">Coût Total</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analysis.employeePayslips.map((payslip) => {
                  const totalCost =
                    payslip.recapitulation.totalGrossSalary +
                    payslip.recapitulation.totalEmployerContributions;

                  return (
                    <TableRow key={payslip.id}>
                      <TableCell className="font-medium">
                        {payslip.employee.lastName} {payslip.employee.firstName}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {payslip.employee.matricule}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(payslip.recapitulation.totalGrossSalary)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        {formatCurrency(payslip.recapitulation.totalNetSalary)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(payslip.recapitulation.totalEmployeeContributions)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(payslip.recapitulation.totalEmployerContributions)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(payslip.recapitulation.totalTaxes)}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {formatCurrency(totalCost)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Navigate to individual payslip view
                            window.location.href = `/employee/${payslip.employeeId}/payslip/${selectedYear}`;
                          }}
                        >
                          Voir
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {/* Total Row */}
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell colSpan={2}>TOTAL ENTREPRISE</TableCell>
                  <TableCell className="text-right text-lg">
                    {formatCurrency(analysis.totalGrossSalary)}
                  </TableCell>
                  <TableCell className="text-right text-lg text-green-600">
                    {formatCurrency(analysis.totalNetSalary)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(analysis.totalEmployeeContributions)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(analysis.totalEmployerContributions)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(analysis.totalTaxes)}
                  </TableCell>
                  <TableCell className="text-right text-lg">
                    {formatCurrency(
                      analysis.totalGrossSalary + analysis.totalEmployerContributions
                    )}
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
