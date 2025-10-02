import React from 'react';
import { useLanguageStore } from '@/stores/language';
import { useDataStore } from '@/stores/data';
import { useAuthStore } from '@/stores/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, FileSpreadsheet, Eye } from 'lucide-react';

export function Payslips() {
  const { t } = useLanguageStore();
  const { user } = useAuthStore();
  const { payslips, employees, companies } = useDataStore();

  // Filter payslips accessible to this employee
  const accessiblePayslips = payslips.filter((p) =>
    user?.access?.companyIds.includes(p.companyId)
  );

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find((e) => e.id === employeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : t('common.unknown');
  };

  const getCompanyName = (companyId: string) => {
    const company = companies.find((c) => c.id === companyId);
    return company?.name || t('common.unknown');
  };

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
                    <TableCell>€{payslip.earnings.grossMonthly.toLocaleString()}</TableCell>
                    <TableCell>€{payslip.netPay.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="default">{t('payslips.paid')}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline">
                          <Eye size={16} className="mr-2" />
                          {t('payslips.view')}
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download size={16} className="mr-2" />
                          {t('payslips.downloadPDF')}
                        </Button>
                        <Button size="sm" variant="outline">
                          <FileSpreadsheet size={16} className="mr-2" />
                          {t('payslips.downloadExcel')}
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
    </div>
  );
}
