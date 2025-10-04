import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AnnualPayslipView } from '@/components/payslips/AnnualPayslipView';
import { useDataStore } from '@/stores/data';
import { Download, ArrowLeft, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function AnnualPayslipPage() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const getEmployeeAnnualPayslip = useDataStore((state) => state.getEmployeeAnnualPayslip);
  const employees = useDataStore((state) => state.employees);

  const employee = employees.find((e) => e.id === employeeId);
  const annualPayslip = employeeId
    ? getEmployeeAnnualPayslip(employeeId, selectedYear)
    : undefined;

  // Generate year options (last 5 years)
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const handleExportPDF = () => {
    // TODO: Implement PDF export
    alert('PDF export coming soon!');
  };

  const handleExportExcel = () => {
    // TODO: Implement Excel export
    alert('Excel export coming soon!');
  };

  if (!employee) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              {t('employee.not_found', 'Employé non trouvé')}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!annualPayslip) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              {t('payslip.not_found', 'Fiche de paie non trouvée')}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header with Actions */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('common.back', 'Retour')}
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {t('payslip.annual_title', 'Fiche de Paie Annuelle')}
            </h1>
            <p className="text-muted-foreground">
              {employee.firstName} {employee.lastName}
            </p>
          </div>
        </div>

        <div className="flex gap-2 items-center">
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

          <Button variant="outline" onClick={() => navigate(`/admin/payslips/create-annual/${employeeId}`)}>
            <Edit className="mr-2 h-4 w-4" />
            {t('common.edit', 'Edit')}
          </Button>

          <Button variant="outline" onClick={handleExportExcel}>
            <Download className="mr-2 h-4 w-4" />
            Excel
          </Button>

          <Button onClick={handleExportPDF}>
            <Download className="mr-2 h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      {/* Annual Payslip View */}
      <AnnualPayslipView payslip={annualPayslip} />
    </div>
  );
}
