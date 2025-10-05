import React, { useState } from 'react';
import { useLanguageStore } from '@/stores/language';
import { useDataStore } from '@/stores/data';
import { useAuthStore } from '@/stores/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, FileSpreadsheet, Eye, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/luxembourgPayroll';
import { generatePayslipPDF } from '@/lib/pdf';
import { LuxembourgPayslipDetail } from '@/components/payslips/LuxembourgPayslipDetail';
import { AnnualRecapitulation } from '@/components/payroll/AnnualRecapitulation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function Payslips() {
  const { t } = useLanguageStore();
  const { user } = useAuthStore();
  const { payslips, employees, companies } = useDataStore();
  const [selectedPayslip, setSelectedPayslip] = useState<string | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const currentYear = new Date().getFullYear();

  // Filter payslips accessible to this employee
  const accessiblePayslips = user?.access?.hasAllCompaniesAccess
    ? payslips
    : payslips.filter((p) => user?.access?.companyIds.includes(p.companyId));

  // Get current employee ID (simplified - in real app, would be based on logged in user)
  const currentEmployeeId = accessiblePayslips[0]?.employeeId;

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find((e) => e.id === employeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : t('common.unknown');
  };

  const getCompanyName = (companyId: string) => {
    const company = companies.find((c) => c.id === companyId);
    return company?.name || t('common.unknown');
  };

  const handleViewPayslip = (payslipId: string) => {
    setSelectedPayslip(payslipId);
    setViewDialogOpen(true);
  };

  const selectedPayslipData = payslips.find((p) => p.id === selectedPayslip);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          {t('nav.payslips')}
        </h1>
        <p className="text-muted-foreground">
          {t('payslips.viewAndManage')}
        </p>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="list">
            <FileSpreadsheet size={16} className="mr-2" />
            {t('payslips.title', 'Payslips')}
          </TabsTrigger>
          <TabsTrigger value="annual">
            <TrendingUp size={16} className="mr-2" />
            {t('payslips.annualRecap', 'Annual Recap')}
          </TabsTrigger>
        </TabsList>

        {/* Monthly Payslips List */}
        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>{t('payslips.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              {accessiblePayslips.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    {t('payslips.noPayslips')}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('payslips.period')}</TableHead>
                      <TableHead>{t('companies.name')}</TableHead>
                      <TableHead>{t('payslips.employee')}</TableHead>
                      <TableHead>{t('payslips.gross')}</TableHead>
                      <TableHead>{t('payslips.net')}</TableHead>
                      <TableHead>{t('payslips.status')}</TableHead>
                      <TableHead>{t('employees.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accessiblePayslips.map((payslip) => (
                      <TableRow key={payslip.id}>
                        <TableCell>
                          {String(payslip.period.month).padStart(2, '0')}/{payslip.period.year}
                        </TableCell>
                        <TableCell>{getCompanyName(payslip.companyId)}</TableCell>
                        <TableCell>{getEmployeeName(payslip.employeeId)}</TableCell>
                        <TableCell>{formatCurrency(payslip.earnings.grossMonthly)}</TableCell>
                        <TableCell>{formatCurrency(payslip.netPay)}</TableCell>
                        <TableCell>
                          <Badge variant="default">{t('payslips.paid')}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewPayslip(payslip.id)}
                            >
                              <Eye size={16} className="mr-2" />
                              {t('payslips.view')}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => generatePayslipPDF(payslip)}>
                              <Download size={16} className="mr-2" />
                              PDF
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Annual Recapitulation */}
        <TabsContent value="annual">
          {currentEmployeeId ? (
            <AnnualRecapitulation
              employeeId={currentEmployeeId}
              year={currentYear}
              payslips={payslips}
              employeeName={getEmployeeName(currentEmployeeId)}
            />
          ) : (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                <p>{t('common.noData', 'No data available')}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Payslip Detail Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('payslips.title', 'Payslip')}</DialogTitle>
          </DialogHeader>
          {selectedPayslipData && (
            <LuxembourgPayslipDetail payslip={selectedPayslipData} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
