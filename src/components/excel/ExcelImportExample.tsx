import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileSpreadsheet, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExcelImportDialog } from './ExcelImportDialog';
import { exportExcelTemplate } from '@/lib/excelUtils';
import { useToast } from '@/hooks/use-toast';

interface ExcelImportExampleProps {
  companyId: string;
}

/**
 * Example component demonstrating how to use the ExcelImportDialog
 * This can be integrated into any page that needs Excel import functionality
 */
export function ExcelImportExample({ companyId }: ExcelImportExampleProps) {
  const { t } = useTranslation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleImportComplete = (data: any) => {
    const { payslips, employeesCreated, payslipsCreated } = data;

    // Here you would typically:
    // 1. Send the data to your backend API
    // 2. Update your local state/store
    // 3. Refresh the data grid/list
    // Show success message
    toast({
      title: t('excel.import.success'),
      description: `${payslipsCreated} ${t('excel.import.payslipsCreated')}`,
      variant: 'default'
    });
  };

  const handleExportTemplate = () => {
    exportExcelTemplate();

    toast({
      title: t('common.success'),
      description: 'Template downloaded successfully',
      variant: 'default'
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button onClick={() => setIsDialogOpen(true)}>
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          {t('payslips.import')}
        </Button>

        <Button variant="outline" onClick={handleExportTemplate}>
          <Download className="w-4 h-4 mr-2" />
          {t('payslips.exportTemplate')}
        </Button>
      </div>

      <ExcelImportDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        companyId={companyId}
        onImportComplete={handleImportComplete}
      />
    </div>
  );
}