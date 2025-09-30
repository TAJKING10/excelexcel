import React, { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ExcelImportMapping } from '@/types';
import {
  parseExcelFile,
  getExcelColumns,
  validatePayslipData,
  transformToPayslips,
  getSchemaFieldOptions
} from '@/lib/excelUtils';

interface ExcelImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  onImportComplete?: (data: any) => void;
}

type ImportStep = 1 | 2 | 3;

export function ExcelImportDialog({
  open,
  onOpenChange,
  companyId,
  onImportComplete
}: ExcelImportDialogProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<ImportStep>(1);
  const [file, setFile] = useState<File | null>(null);
  const [excelData, setExcelData] = useState<any[]>([]);
  const [excelColumns, setExcelColumns] = useState<string[]>([]);
  const [mapping, setMapping] = useState<ExcelImportMapping>({});
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const schemaFields = getSchemaFieldOptions();

  // Reset state when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setStep(1);
      setFile(null);
      setExcelData([]);
      setExcelColumns([]);
      setMapping({});
      setValidationErrors([]);
      setIsLoading(false);
    }
    onOpenChange(newOpen);
  };

  // Handle file selection
  const handleFileSelect = async (selectedFile: File | null) => {
    if (!selectedFile) return;

    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      '.xlsx',
      '.xls'
    ];

    const isValidType = validTypes.some(type =>
      selectedFile.type === type || selectedFile.name.endsWith(type)
    );

    if (!isValidType) {
      alert(t('excel.import.error') + ': Only .xlsx and .xls files are supported');
      return;
    }

    setIsLoading(true);
    try {
      const data = await parseExcelFile(selectedFile);
      const columns = getExcelColumns(data);

      setFile(selectedFile);
      setExcelData(data);
      setExcelColumns(columns);

      // Auto-map columns with similar names
      const autoMapping: ExcelImportMapping = {};
      columns.forEach(col => {
        const normalizedCol = col.toLowerCase().replace(/[_\s]/g, '');
        schemaFields.forEach(field => {
          const normalizedField = field.label.toLowerCase().replace(/[_\s]/g, '');
          if (normalizedCol.includes(normalizedField) || normalizedField.includes(normalizedCol)) {
            autoMapping[col] = field.value;
          }
        });
      });
      setMapping(autoMapping);
    } catch (error) {
      alert(t('excel.import.error') + ': ' + (error instanceof Error ? error.message : 'Unknown error'));
      setFile(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, []);

  // Handle next step
  const handleNext = () => {
    if (step === 1 && file && excelData.length > 0) {
      setStep(2);
    } else if (step === 2) {
      // Validate mapping
      const validation = validatePayslipData(excelData, mapping);
      setValidationErrors(validation.errors);
      setStep(3);
    }
  };

  // Handle back step
  const handleBack = () => {
    if (step > 1) {
      setStep((prev) => (prev - 1) as ImportStep);
    }
  };

  // Handle import
  const handleImport = async () => {
    if (validationErrors.length > 0) {
      return;
    }

    setIsLoading(true);
    try {
      const payslips = transformToPayslips(excelData, mapping, companyId);

      // Call the completion handler
      if (onImportComplete) {
        onImportComplete({
          payslips,
          employeesCreated: payslips.length,
          payslipsCreated: payslips.length
        });
      }

      handleOpenChange(false);
    } catch (error) {
      alert(t('excel.import.error') + ': ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle column mapping change
  const handleMappingChange = (excelColumn: string, schemaField: string) => {
    setMapping(prev => ({
      ...prev,
      [excelColumn]: schemaField
    }));
  };

  // Remove mapping
  const handleRemoveMapping = (excelColumn: string) => {
    setMapping(prev => {
      const newMapping = { ...prev };
      delete newMapping[excelColumn];
      return newMapping;
    });
  };

  // Group schema fields by group
  const groupedFields = schemaFields.reduce((acc, field) => {
    if (!acc[field.group]) {
      acc[field.group] = [];
    }
    acc[field.group].push(field);
    return acc;
  }, {} as Record<string, typeof schemaFields>);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('excel.import.title')}</DialogTitle>
          <DialogDescription>
            {step === 1 && t('excel.import.step1')}
            {step === 2 && t('excel.import.step2')}
            {step === 3 && t('excel.import.step3')}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Step 1: Upload */}
          {step === 1 && (
            <div className="space-y-4">
              <div
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                  isDragging
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                  className="hidden"
                />

                {!file ? (
                  <div className="space-y-4">
                    <FileSpreadsheet className="w-16 h-16 mx-auto text-gray-400" />
                    <div>
                      <Button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isLoading}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {t('excel.import.selectFile')}
                      </Button>
                      <p className="text-sm text-gray-500 mt-2">
                        {t('excel.import.dragDrop')}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        .xlsx, .xls
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {excelData.length} rows, {excelColumns.length} columns
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setFile(null);
                          setExcelData([]);
                          setExcelColumns([]);
                        }}
                        className="mt-4"
                      >
                        Change File
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Map Columns */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="text-sm text-gray-600 mb-4">
                Map Excel columns to payslip fields. Required fields are marked with *.
              </div>
              <div className="max-h-96 overflow-y-auto space-y-3">
                {excelColumns.map((column) => (
                  <div key={column} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="flex-1">
                      <Label className="text-sm font-medium">{column}</Label>
                      {excelData[0] && (
                        <p className="text-xs text-gray-500 mt-1">
                          Example: {String(excelData[0][column]).substring(0, 50)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={mapping[column] || ''}
                        onValueChange={(value) => handleMappingChange(column, value)}
                      >
                        <SelectTrigger className="w-64">
                          <SelectValue placeholder="Select field..." />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(groupedFields).map(([group, fields]) => (
                            <div key={group}>
                              <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">
                                {group}
                              </div>
                              {fields.map((field) => (
                                <SelectItem key={field.value} value={field.value}>
                                  {field.label}
                                  {field.value.includes('firstName') ||
                                  field.value.includes('lastName') ||
                                  field.value.includes('email') ||
                                  field.value.includes('period.month') ||
                                  field.value.includes('period.year') ||
                                  field.value.includes('grossMonthly') ||
                                  field.value === 'netPay'
                                    ? ' *'
                                    : ''}
                                </SelectItem>
                              ))}
                            </div>
                          ))}
                        </SelectContent>
                      </Select>
                      {mapping[column] && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMapping(column)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Validate */}
          {step === 3 && (
            <div className="space-y-4">
              {validationErrors.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {t('common.success')}
                  </h3>
                  <p className="text-gray-600">
                    Ready to import {excelData.length} payslip(s)
                  </p>

                  {/* Preview first few rows */}
                  <div className="mt-6 text-left">
                    <h4 className="font-medium mb-2">Preview:</h4>
                    <div className="border rounded-lg overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left">Employee</th>
                            <th className="px-3 py-2 text-left">Period</th>
                            <th className="px-3 py-2 text-right">Gross</th>
                            <th className="px-3 py-2 text-right">Net</th>
                          </tr>
                        </thead>
                        <tbody>
                          {excelData.slice(0, 5).map((row, idx) => {
                            const firstNameCol = Object.keys(mapping).find(
                              k => mapping[k] === 'employee.firstName'
                            );
                            const lastNameCol = Object.keys(mapping).find(
                              k => mapping[k] === 'employee.lastName'
                            );
                            const monthCol = Object.keys(mapping).find(
                              k => mapping[k] === 'period.month'
                            );
                            const yearCol = Object.keys(mapping).find(
                              k => mapping[k] === 'period.year'
                            );
                            const grossCol = Object.keys(mapping).find(
                              k => mapping[k] === 'earnings.grossMonthly'
                            );
                            const netCol = Object.keys(mapping).find(
                              k => mapping[k] === 'netPay'
                            );

                            return (
                              <tr key={idx} className="border-t">
                                <td className="px-3 py-2">
                                  {firstNameCol && lastNameCol
                                    ? `${row[firstNameCol]} ${row[lastNameCol]}`
                                    : '-'}
                                </td>
                                <td className="px-3 py-2">
                                  {monthCol && yearCol
                                    ? `${row[monthCol]}/${row[yearCol]}`
                                    : '-'}
                                </td>
                                <td className="px-3 py-2 text-right">
                                  {grossCol ? Number(row[grossCol]).toFixed(2) : '-'}
                                </td>
                                <td className="px-3 py-2 text-right">
                                  {netCol ? Number(row[netCol]).toFixed(2) : '-'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    {excelData.length > 5 && (
                      <p className="text-xs text-gray-500 mt-2">
                        Showing 5 of {excelData.length} rows
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-red-900 mb-2">
                        {t('excel.import.error')}
                      </h4>
                      <ul className="space-y-1 text-sm text-red-700">
                        {validationErrors.map((error, idx) => (
                          <li key={idx} className="list-disc list-inside">
                            {error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Please go back and fix the errors before importing.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <div className="flex justify-between w-full">
            <div>
              {step > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={isLoading}
                >
                  {t('actions.back')}
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isLoading}
              >
                {t('actions.cancel')}
              </Button>
              {step < 3 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={isLoading || (step === 1 && !file)}
                >
                  {t('actions.next')}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleImport}
                  disabled={isLoading || validationErrors.length > 0}
                >
                  {isLoading ? t('excel.import.importing') : t('actions.import')}
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}