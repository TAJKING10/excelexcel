import React, { useState } from 'react';
import { Payslip, PayslipLine, LineType } from '@/types';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Save, Download, Plus, Trash2 } from 'lucide-react';
import { generatePayslipPDF } from '@/lib/pdf';

interface PayslipEditorProps {
  payslip: Payslip;
  onSave: (payslip: Payslip) => void;
}

export function PayslipEditor({ payslip, onSave }: PayslipEditorProps) {
  const { t, i18n } = useTranslation();
  const [editablePayslip, setEditablePayslip] = useState<Payslip>(payslip);
  const [editingLineId, setEditingLineId] = useState<string | null>(null);

  const currentLanguage = i18n.language as 'fr' | 'en';

  const handleLineChange = (lineId: string, field: keyof PayslipLine, value: string | number) => {
    const updatedLines = editablePayslip.lines.map((line) => {
      if (line.id === lineId) {
        const updatedLine = { ...line, [field]: value };

        // Recalculate amount if quantity or rate changes
        if (field === 'quantity' || field === 'rate') {
          updatedLine.amount = updatedLine.quantity * updatedLine.rate;
        }

        return updatedLine;
      }
      return line;
    });

    setEditablePayslip({ ...editablePayslip, lines: updatedLines });
    recalculateTotals(updatedLines);
  };

  const recalculateTotals = (lines: PayslipLine[]) => {
    const earnings = lines
      .filter((line) => line.type === 'earning')
      .reduce((sum, line) => sum + line.amount, 0);

    const employeeDeductions = lines
      .filter((line) => line.type === 'deduction')
      .reduce((sum, line) => sum + line.amount, 0);

    const employerContributions = lines
      .filter((line) => line.type === 'employer_contrib')
      .reduce((sum, line) => sum + line.amount, 0);

    const netPay = earnings - employeeDeductions;

    setEditablePayslip((prev) => ({
      ...prev,
      earnings: {
        ...prev.earnings,
        grossMonthly: earnings,
      },
      employeeContrib: {
        ...prev.employeeContrib,
        total: employeeDeductions,
      },
      employerContrib: {
        ...prev.employerContrib,
        socialSecurityTotal: employerContributions,
      },
      netPay,
    }));
  };

  const handleAddLine = () => {
    const newLine: PayslipLine = {
      id: `line-${Date.now()}`,
      code: '',
      label_fr: '',
      label_en: '',
      quantity: 1,
      rate: 0,
      amount: 0,
      type: 'earning',
    };

    setEditablePayslip({
      ...editablePayslip,
      lines: [...editablePayslip.lines, newLine],
    });
    setEditingLineId(newLine.id);
  };

  const handleDeleteLine = (lineId: string) => {
    const updatedLines = editablePayslip.lines.filter((line) => line.id !== lineId);
    setEditablePayslip({ ...editablePayslip, lines: updatedLines });
    recalculateTotals(updatedLines);
  };

  const handleSave = () => {
    onSave(editablePayslip);
  };

  const handleDownloadPDF = () => {
    generatePayslipPDF(editablePayslip);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(currentLanguage, {
      style: 'currency',
      currency: editablePayslip.company.currency,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">
            {t('payslips.edit')}
          </h2>
          <p className="text-sm text-muted-foreground">
            {editablePayslip.employee.firstName} {editablePayslip.employee.lastName} -{' '}
            {t('payslips.month')} {editablePayslip.period.month}/{editablePayslip.period.year}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave} className="bg-primary text-primary-foreground">
            <Save size={16} className="mr-2" />
            {t('actions.save')}
          </Button>
          <Button onClick={handleDownloadPDF} variant="outline">
            <Download size={16} className="mr-2" />
            {t('payslips.download')}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('payslips.earnings.grossMonthly')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(editablePayslip.earnings.grossMonthly)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('payslips.employeeContrib.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {formatCurrency(editablePayslip.employeeContrib.total)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('payslips.employerContrib.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(editablePayslip.employerContrib.socialSecurityTotal)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('payslips.netPay')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(editablePayslip.netPay)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Editable Lines Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>{t('payslips.lines.label')}</CardTitle>
            <Button onClick={handleAddLine} size="sm">
              <Plus size={16} className="mr-2" />
              {t('actions.add')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">{t('payslips.lines.code')}</TableHead>
                <TableHead>{t('payslips.lines.label')}</TableHead>
                <TableHead className="w-[100px]">{t('payslips.lines.quantity')}</TableHead>
                <TableHead className="w-[120px]">{t('payslips.lines.rate')}</TableHead>
                <TableHead className="w-[120px]">{t('payslips.lines.amount')}</TableHead>
                <TableHead className="w-[150px]">{t('payslips.lines.type')}</TableHead>
                <TableHead className="w-[80px]">{t('employees.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {editablePayslip.lines.map((line) => {
                const isEditing = editingLineId === line.id;
                const label = currentLanguage === 'fr' ? line.label_fr : line.label_en;

                return (
                  <TableRow
                    key={line.id}
                    className="hover:bg-muted/50"
                    onClick={() => setEditingLineId(line.id)}
                  >
                    <TableCell>
                      {isEditing ? (
                        <Input
                          value={line.code}
                          onChange={(e) => handleLineChange(line.id, 'code', e.target.value)}
                          className="h-8"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span>{line.code}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          value={label}
                          onChange={(e) =>
                            handleLineChange(
                              line.id,
                              currentLanguage === 'fr' ? 'label_fr' : 'label_en',
                              e.target.value
                            )
                          }
                          className="h-8"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span>{label}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={line.quantity}
                          onChange={(e) =>
                            handleLineChange(line.id, 'quantity', parseFloat(e.target.value) || 0)
                          }
                          className="h-8"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span>{line.quantity}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={line.rate}
                          onChange={(e) =>
                            handleLineChange(line.id, 'rate', parseFloat(e.target.value) || 0)
                          }
                          className="h-8"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span>{formatCurrency(line.rate)}</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(line.amount)}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <select
                          value={line.type}
                          onChange={(e) =>
                            handleLineChange(line.id, 'type', e.target.value as LineType)
                          }
                          className="h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="earning">{t('payslips.lines.earning')}</option>
                          <option value="deduction">{t('payslips.lines.deduction')}</option>
                          <option value="employer_contrib">
                            {t('payslips.lines.employer_contrib')}
                          </option>
                          <option value="info">{t('payslips.lines.info')}</option>
                        </select>
                      ) : (
                        <span>{t(`payslips.lines.${line.type}`)}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteLine(line.id);
                        }}
                        className="h-8 w-8"
                      >
                        <Trash2 size={16} className="text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}