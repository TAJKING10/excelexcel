import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDataStore } from '@/stores/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LuxembourgPayslipDetail } from '@/components/payslips/LuxembourgPayslipDetail';
import { formatCurrency } from '@/lib/luxembourgPayroll';
import { generatePayslipPDF } from '@/lib/pdf';

export function Explorer() {
  const { t, i18n } = useTranslation();
  const { companies, employees, payslips } = useDataStore();

  const [companyId, setCompanyId] = useState<string>('');
  const [employeeId, setEmployeeId] = useState<string>('');
  const [year, setYear] = useState<number | ''>('');
  const [month, setMonth] = useState<number | ''>('');
  const [netMin, setNetMin] = useState<number | ''>('');
  const [netMax, setNetMax] = useState<number | ''>('');
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const filteredEmployees = useMemo(
    () => (companyId ? employees.filter((e) => e.companyId === companyId) : employees),
    [companyId, employees]
  );

  const results = useMemo(() => {
    return payslips.filter((p) => {
      if (companyId && p.companyId !== companyId) return false;
      if (employeeId && p.employeeId !== employeeId) return false;
      if (year && p.period.year !== year) return false;
      if (month && p.period.month !== month) return false;
      if (netMin !== '' && p.netPay < Number(netMin)) return false;
      if (netMax !== '' && p.netPay > Number(netMax)) return false;
      return true;
    });
  }, [payslips, companyId, employeeId, year, month, netMin, netMax]);

  const handlePDF = async (payslip: any) => {
    await generatePayslipPDF(payslip);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('nav.explorer', { defaultValue: 'Payslip Explorer' })}</h1>
        <p className="text-muted-foreground">{t('explorer.subtitle', { defaultValue: 'Filter, read, compare, and export payslips' })}</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>{t('common.filters', { defaultValue: 'Filters' })}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="space-y-2">
              <Label>{t('payslips.company', { defaultValue: 'Company' })}</Label>
              <Select value={companyId} onValueChange={setCompanyId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('explorer.allCompanies', { defaultValue: 'All companies' })} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t('common.all', { defaultValue: 'All' })}</SelectItem>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('payslips.employee', { defaultValue: 'Employee' })}</Label>
              <Select value={employeeId} onValueChange={setEmployeeId} disabled={!companyId && filteredEmployees.length === 0}>
                <SelectTrigger>
                  <SelectValue placeholder={companyId ? t('employees.select', { defaultValue: 'Select employee' }) : t('explorer.allEmployees', { defaultValue: 'All employees' })} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t('common.all', { defaultValue: 'All' })}</SelectItem>
                  {filteredEmployees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('payslips.year', { defaultValue: 'Year' })}</Label>
              <Input type="number" value={year} onChange={(e) => setYear(e.target.value ? parseInt(e.target.value) : '')} min={2020} max={2050} />
            </div>

            <div className="space-y-2">
              <Label>{t('payslips.month', { defaultValue: 'Month' })}</Label>
              <Select value={month ? String(month) : ''} onValueChange={(v) => setMonth(v ? parseInt(v) : '')}>
                <SelectTrigger>
                  <SelectValue placeholder={t('common.all', { defaultValue: 'All' })} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t('common.all', { defaultValue: 'All' })}</SelectItem>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <SelectItem key={m} value={String(m)}>
                      {new Date(2024, m - 1, 1).toLocaleString(i18n.language, { month: 'long' })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('explorer.netMin', { defaultValue: 'Net min' })}</Label>
              <Input type="number" value={netMin} onChange={(e) => setNetMin(e.target.value ? parseFloat(e.target.value) : '')} />
            </div>

            <div className="space-y-2">
              <Label>{t('explorer.netMax', { defaultValue: 'Net max' })}</Label>
              <Input type="number" value={netMax} onChange={(e) => setNetMax(e.target.value ? parseFloat(e.target.value) : '')} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>{t('common.results', { defaultValue: 'Results' })} ({results.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('payslips.employee', { defaultValue: 'Employee' })}</TableHead>
                <TableHead>{t('payslips.period', { defaultValue: 'Period' })}</TableHead>
                <TableHead className="text-right">{t('payslips.gross', { defaultValue: 'Gross' })}</TableHead>
                <TableHead className="text-right">{t('payslips.net', { defaultValue: 'Net' })}</TableHead>
                <TableHead className="text-right">EE</TableHead>
                <TableHead className="text-right">ER</TableHead>
                <TableHead className="text-right">{t('payslips.deductions.incomeTax', { defaultValue: 'Tax' })}</TableHead>
                <TableHead>{t('payslips.actions', { defaultValue: 'Actions' })}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-6">
                    {t('payslips.noPayslips', { defaultValue: 'No payslips found' })}
                  </TableCell>
                </TableRow>
              )}
              {results.map((p) => {
                const monthName = new Date(2024, p.period.month - 1, 1).toLocaleString(i18n.language, { month: 'short' });
                const period = `${monthName} ${p.period.year}`;
                const isExpanded = expandedRowId === p.id;
                const emp = employees.find((e) => e.id === p.employeeId);
                return (
                  <React.Fragment key={p.id}>
                    <TableRow className={isExpanded ? 'bg-muted/40' : ''}>
                      <TableCell>{emp ? `${emp.firstName} ${emp.lastName}` : `${p.employee?.firstName ?? ''} ${p.employee?.lastName ?? ''}`}</TableCell>
                      <TableCell>{period}</TableCell>
                      <TableCell className="text-right">{formatCurrency(p.earnings?.grossMonthly || 0)}</TableCell>
                      <TableCell className="text-right font-medium text-green-700">{formatCurrency(p.netPay || 0)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(p.employeeContrib?.total || 0)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(p.employerContrib?.socialSecurityTotal || 0)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(p.employeeContrib?.incomeTax || 0)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => setExpandedRowId(isExpanded ? null : p.id)}>
                            {isExpanded ? t('common.hide', { defaultValue: 'Hide' }) : t('payslips.view', { defaultValue: 'View' })}
                          </Button>
                          <Button size="sm" onClick={() => handlePDF(p)}>{t('payslips.downloadPDF', { defaultValue: 'PDF' })}</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={8}>
                          <div className="p-3 border rounded-lg">
                            <LuxembourgPayslipDetail payslip={p} />
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default Explorer;