import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil, X, Save, Loader2 } from 'lucide-react';
import type { AnnualPayslip } from '@/types';
import { formatCurrency, getMonthNameFr } from '@/lib/luxembourgPayroll';
import { useTranslation } from 'react-i18next';
import { useDataStore } from '@/stores/data';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface AnnualPayslipViewProps {
  payslip: AnnualPayslip;
  onEmployeeUpdated?: () => void;
}

export function AnnualPayslipView({ payslip, onEmployeeUpdated }: AnnualPayslipViewProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const updateEmployee = useDataStore((state) => state.updateEmployee);

  const canEdit = user?.role === 'SUPER_ADMIN' || user?.access?.canEditPayslips;

  // Employee edit mode states
  const [isEditingEmployee, setIsEditingEmployee] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editableMatricule, setEditableMatricule] = useState(payslip.employee.matricule || '');
  const [editableClass, setEditableClass] = useState(payslip.employee.class || '');
  const [editableHireDate, setEditableHireDate] = useState(payslip.employee.hireDate || '');
  const [editableAddress, setEditableAddress] = useState(payslip.employee.address || '');

  // Reset editable fields when payslip changes
  useEffect(() => {
    setEditableMatricule(payslip.employee.matricule || '');
    setEditableClass(payslip.employee.class || '');
    setEditableHireDate(payslip.employee.hireDate || '');
    setEditableAddress(payslip.employee.address || '');
  }, [payslip]);

  const handleSaveEmployeeInfo = async () => {
    if (!payslip.employeeId) return;

    setIsSaving(true);
    try {
      const updates: any = {};

      if (editableMatricule !== (payslip.employee.matricule || '')) {
        updates.matricule = editableMatricule;
      }
      if (editableClass !== (payslip.employee.class || '')) {
        updates.class = editableClass;
      }
      if (editableHireDate !== (payslip.employee.hireDate || '')) {
        updates.hireDate = editableHireDate;
      }
      if (editableAddress !== (payslip.employee.address || '')) {
        updates.address = editableAddress;
      }

      if (Object.keys(updates).length > 0) {
        await updateEmployee(payslip.employeeId, updates);
        toast({
          title: 'Success',
          description: 'Employee information updated successfully',
        });
        onEmployeeUpdated?.();
      }

      setIsEditingEmployee(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update employee information',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditableMatricule(payslip.employee.matricule || '');
    setEditableClass(payslip.employee.class || '');
    setEditableHireDate(payslip.employee.hireDate || '');
    setEditableAddress(payslip.employee.address || '');
    setIsEditingEmployee(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">
                {t('analytics.annualPayslip.title')} {payslip.year}
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
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">Employee Information</span>
            {canEdit && (
              <div className="flex gap-2">
                {isEditingEmployee ? (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                      className="h-8 px-2"
                    >
                      <X size={14} className="mr-1" />
                      Cancel
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleSaveEmployeeInfo}
                      disabled={isSaving}
                      className="h-8 px-2"
                    >
                      {isSaving ? (
                        <Loader2 size={14} className="mr-1 animate-spin" />
                      ) : (
                        <Save size={14} className="mr-1" />
                      )}
                      Save
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingEmployee(true)}
                    className="h-8 px-2"
                  >
                    <Pencil size={14} className="mr-1" />
                    Edit
                  </Button>
                )}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{t('employee.matricule')}</p>
              {isEditingEmployee ? (
                <Input
                  value={editableMatricule}
                  onChange={(e) => setEditableMatricule(e.target.value)}
                  className="h-8 text-sm mt-1"
                  placeholder="1989 11 24 004 47"
                />
              ) : (
                <p className="font-medium">{payslip.employee.matricule || '-'}</p>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('employee.class')}</p>
              {isEditingEmployee ? (
                <Input
                  value={editableClass}
                  onChange={(e) => setEditableClass(e.target.value)}
                  className="h-8 text-sm mt-1"
                  placeholder="Empl."
                />
              ) : (
                <p className="font-medium">{payslip.employee.class || '-'}</p>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('employee.hire_date')}</p>
              {isEditingEmployee ? (
                <Input
                  type="date"
                  value={editableHireDate}
                  onChange={(e) => setEditableHireDate(e.target.value)}
                  className="h-8 text-sm mt-1"
                />
              ) : (
                <p className="font-medium">
                  {payslip.employee.hireDate ? new Date(payslip.employee.hireDate).toLocaleDateString('fr-LU') : '-'}
                </p>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('employee.address')}</p>
              {isEditingEmployee ? (
                <Input
                  value={editableAddress}
                  onChange={(e) => setEditableAddress(e.target.value)}
                  className="h-8 text-sm mt-1"
                  placeholder="52, Grand-Rue"
                />
              ) : (
                <p className="font-medium">{payslip.employee.address || '-'}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Breakdown Table - Détail Mensuel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{t('analytics.annualPayslip.monthlyBreakdown', 'Détail Mensuel')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-blue-100 dark:bg-blue-950">
                  <TableHead className="w-24 font-bold text-xs">{t('analytics.annualPayslip.month', 'Mois')}</TableHead>
                  <TableHead className="w-16 font-bold text-xs text-center">{t('analytics.annualPayslip.days', 'Jours')}</TableHead>
                  <TableHead className="w-16 font-bold text-xs text-center">{t('analytics.annualPayslip.stat', 'Stat.')}</TableHead>
                  <TableHead className="w-16 font-bold text-xs text-center">{t('analytics.annualPayslip.class', 'Classe')}</TableHead>
                  <TableHead className="text-right font-bold text-xs">{t('analytics.annualPayslip.baseRemuneration', 'Rémun. Base')}</TableHead>
                  <TableHead className="text-right font-bold text-xs">{t('analytics.annualPayslip.monthlyGross', 'Brut Mensuel')}</TableHead>
                  <TableHead className="text-right font-bold text-xs">{t('analytics.annualPayslip.contributable', 'Cotisable')}</TableHead>
                  <TableHead className="text-right font-bold text-xs">{t('analytics.annualPayslip.health', 'Maladie')}</TableHead>
                  <TableHead className="text-right font-bold text-xs">{t('analytics.annualPayslip.pension', 'Pension')}</TableHead>
                  <TableHead className="text-right font-bold text-xs">{t('analytics.annualPayslip.deductions', 'Déductions')}</TableHead>
                  <TableHead className="text-right font-bold text-xs">{t('analytics.annualPayslip.taxable', 'Imposable')}</TableHead>
                  <TableHead className="text-right font-bold text-xs">{t('analytics.annualPayslip.taxes', 'Impôts')}</TableHead>
                  <TableHead className="text-right font-bold text-xs">{t('analytics.annualPayslip.ciCo2', 'CI-CO2')}</TableHead>
                  <TableHead className="text-right font-bold text-xs">{t('analytics.annualPayslip.cis', 'CIS')}</TableHead>
                  <TableHead className="text-right font-bold text-xs">{t('analytics.annualPayslip.cissm', 'CISSM')}</TableHead>
                  <TableHead className="text-right font-bold text-xs bg-green-100 dark:bg-green-950">{t('analytics.annualPayslip.netSalary', 'Salaire Net')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payslip.monthlyData.map((month) => (
                  <TableRow key={month.monthNumber} className="hover:bg-muted/50 text-sm">
                    <TableCell className="font-medium">
                      {month.monthName} {month.days}
                    </TableCell>
                    <TableCell className="text-center">{month.daysImposable}</TableCell>
                    <TableCell className="text-center">{month.status}</TableCell>
                    <TableCell className="text-center">{month.taxClass}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(month.earnings.remunerationBase)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(month.earnings.grossMonthly)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(month.earnings.cotisable)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(month.employeeContrib.maladie)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(month.employeeContrib.pension)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(month.employeeContrib.deductions)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(month.earnings.imposable)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(month.employeeContrib.incomeTax)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(month.employeeContrib.ciCo2)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(month.employeeContrib.cis)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(month.employeeContrib.cissm)}
                    </TableCell>
                    <TableCell className="text-right font-bold tabular-nums bg-green-50 dark:bg-green-950/30">
                      {formatCurrency(month.netPay)}
                    </TableCell>
                  </TableRow>
                ))}

                {/* Annual Total Row */}
                <TableRow className="bg-blue-100 dark:bg-blue-950 font-bold text-sm">
                  <TableCell colSpan={4} className="text-left">{t('analytics.annualPayslip.annualTotal', 'TOTAL ANNUEL')}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(payslip.annualTotals.earnings.remunerationBase)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(payslip.annualTotals.earnings.grossMonthly)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(payslip.annualTotals.earnings.cotisable)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(payslip.annualTotals.employeeContrib.maladie)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(payslip.annualTotals.employeeContrib.pension)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(payslip.annualTotals.employeeContrib.deductions)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(payslip.annualTotals.earnings.imposable)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(payslip.annualTotals.employeeContrib.incomeTax)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(payslip.annualTotals.employeeContrib.ciCo2)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(payslip.annualTotals.employeeContrib.cis)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(payslip.annualTotals.employeeContrib.cissm)}
                  </TableCell>
                  <TableCell className="text-right text-base tabular-nums bg-green-200 dark:bg-green-900">
                    {formatCurrency(payslip.annualTotals.netPay)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Employer Contributions Table - Cotisations Patronales */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{t('analytics.annualPayslip.employerContributions', 'Cotisations Patronales')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-orange-100 dark:bg-orange-950">
                  <TableHead className="w-40 font-bold text-xs">{t('analytics.annualPayslip.month', 'Mois')}</TableHead>
                  <TableHead className="text-right font-bold text-xs">{t('analytics.annualPayslip.health', 'Maladie')}</TableHead>
                  <TableHead className="text-right font-bold text-xs">{t('analytics.annualPayslip.pension', 'Pension')}</TableHead>
                  <TableHead className="text-right font-bold text-xs">{t('analytics.sante', 'Santé')}</TableHead>
                  <TableHead className="text-right font-bold text-xs">{t('analytics.accident', 'Accident')}</TableHead>
                  <TableHead className="text-right font-bold text-xs bg-orange-200 dark:bg-orange-900">{t('analytics.annualPayslip.socialSecurityTotal', 'Total Séc. Sociale')}</TableHead>
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
                    <TableRow key={month.monthNumber} className="hover:bg-muted/50 text-sm">
                      <TableCell className="font-medium">
                        {getMonthNameFr(month.monthNumber)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(employerMaladie)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(employerPension)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(employerSante)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(employerAccident)}
                      </TableCell>
                      <TableCell className="text-right font-bold tabular-nums bg-orange-50 dark:bg-orange-950/30">
                        {formatCurrency(total)}
                      </TableCell>
                    </TableRow>
                  );
                })}

                {/* Total Row */}
                <TableRow className="bg-orange-100 dark:bg-orange-950 font-bold text-sm">
                  <TableCell>{t('analytics.annualPayslip.annualTotal', 'TOTAL ANNUEL')}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(payslip.annualTotals.employerContrib.maladie)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(payslip.annualTotals.employerContrib.pension)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(payslip.annualTotals.employerContrib.sante)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(payslip.annualTotals.employerContrib.accident)}
                  </TableCell>
                  <TableCell className="text-right text-base tabular-nums bg-orange-200 dark:bg-orange-900">
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
          <CardTitle>{t('analytics.annualPayslip.annualRecapitulation')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">{t('analytics.annualPayslip.salaries')}</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('analytics.annualPayslip.totalGross')}</span>
                  <span className="font-bold">
                    {formatCurrency(payslip.recapitulation.totalGrossSalary)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('analytics.annualPayslip.totalNet')}</span>
                  <span className="font-bold text-green-600">
                    {formatCurrency(payslip.recapitulation.totalNetSalary)}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-lg">{t('analytics.annualPayslip.contributions')}</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('analytics.annualPayslip.employee')}</span>
                  <span className="font-bold">
                    {formatCurrency(payslip.recapitulation.totalEmployeeContributions)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('analytics.annualPayslip.employer')}</span>
                  <span className="font-bold">
                    {formatCurrency(payslip.recapitulation.totalEmployerContributions)}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-lg">{t('analytics.annualPayslip.other')}</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('analytics.annualPayslip.taxesLabel')}</span>
                  <span className="font-bold">
                    {formatCurrency(payslip.recapitulation.totalTaxes)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('analytics.annualPayslip.hoursWorked')}</span>
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
                  <p className="text-sm text-blue-600 font-medium">{t('analytics.annualPayslip.annualGrossSalary')}</p>
                  <p className="text-2xl font-bold text-blue-700 mt-2">
                    {formatCurrency(payslip.annualTotals.earnings.grossMonthly)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-green-600 font-medium">{t('analytics.annualPayslip.annualNetSalary')}</p>
                  <p className="text-2xl font-bold text-green-700 mt-2">
                    {formatCurrency(payslip.annualTotals.netPay)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-orange-50 border-orange-200">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-orange-600 font-medium">{t('analytics.annualPayslip.totalContributions')}</p>
                  <p className="text-2xl font-bold text-orange-700 mt-2">
                    {formatCurrency(payslip.annualTotals.employeeContrib.total)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-purple-600 font-medium">{t('analytics.annualPayslip.annualTaxes')}</p>
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
