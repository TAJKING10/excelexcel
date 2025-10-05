import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AnnualPayslipView } from '@/components/payslips/AnnualPayslipView';
import { useDataStore } from '@/stores/data';
import { useAuthStore } from '@/stores/auth';
import { Download, ArrowLeft, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function AnnualPayslipPage() {
  const { employeeId, individualId } = useParams<{ employeeId?: string; individualId?: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const getEmployeeAnnualPayslip = useDataStore((state) => state.getEmployeeAnnualPayslip);
  const generateEmployeeAnnualPayslip = useDataStore((state) => state.generateEmployeeAnnualPayslip);
  const employees = useDataStore((state) => state.employees);
  const individuals = useDataStore((state) => state.individuals);

  const canEdit = user?.role === 'SUPER_ADMIN' || user?.access?.canEditPayslips;

  const personId = employeeId || individualId;

  const employee = employees.find((e) => e.id === personId);
  const individual = individuals.find((i) => i.id === personId);
  const person = employee || individual;

  let annualPayslip;
  try {
    annualPayslip = personId ? getEmployeeAnnualPayslip(personId, selectedYear) : undefined;

    // If not found, try to generate it
    if (!annualPayslip && personId && person) {
      annualPayslip = generateEmployeeAnnualPayslip(personId, selectedYear);
    }
  } catch (error) {
    console.error('Error with annual payslip:', error);
  }

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

  // Early return with visible content for debugging
  if (!personId) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Debug: No Person ID</CardTitle>
          </CardHeader>
          <CardContent>
            <p>employeeId: {employeeId || 'undefined'}</p>
            <p>individualId: {individualId || 'undefined'}</p>
            <Button onClick={() => navigate(-1)}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('common.back', 'Retour')}
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{t('payslips.employeeNotFound', 'Employé non trouvé')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-muted-foreground">
              {t('payslips.employeeNotFoundDesc', 'L\'employé avec l\'ID "{id}" n\'a pas été trouvé.').replace('{id}', personId || '')}
            </p>
            <p className="text-sm">{t('payslips.employeesAvailable', 'Employés disponibles')}: {employees.length}</p>
            <div className="mt-4">
              <Button onClick={() => navigate(-1)}>{t('common.back', 'Retour')}</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!annualPayslip) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('common.back', 'Retour')}
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{t('payslips.annualTitle', 'Fiche de Paie Annuelle')} {selectedYear}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                {t('payslips.cannotGenerate', 'Impossible de générer la fiche de paie annuelle pour {name}').replace('{name}', `${person?.firstName} ${person?.lastName}`)}
              </p>
              <p className="text-sm text-muted-foreground mb-2">
                Employee ID: {personId} | {t('payslips.year', 'Année')}: {selectedYear}
              </p>
              <div className="mt-6">
                <Button onClick={() => {
                  const basePath = user?.role === 'SUPER_ADMIN' ? '/admin' : '';
                  navigate(`${basePath}/payslips/create-annual/${personId}`);
                }}>
                  {t('payslips.createAnnual', 'Créer Fiche de Paie Annuelle')} {selectedYear}
                </Button>
              </div>
            </div>
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
              {person.firstName} {person.lastName}
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

          {canEdit && (
            <Button
              variant="outline"
              onClick={() => {
                const basePath = user?.role === 'SUPER_ADMIN' ? '/admin' : '';
                navigate(`${basePath}/payslips/create-annual/${personId}`);
              }}
            >
              <Edit className="mr-2 h-4 w-4" />
              {t('common.edit', 'Edit')}
            </Button>
          )}

          <Button variant="outline" onClick={handleExportExcel}>
            <Download className="mr-2 h-4 w-4" />
            {t('common.excel', 'Excel')}
          </Button>

          <Button onClick={handleExportPDF}>
            <Download className="mr-2 h-4 w-4" />
            {t('common.pdf', 'PDF')}
          </Button>
        </div>
      </div>

      {/* Annual Payslip View */}
      <AnnualPayslipView payslip={annualPayslip} />
    </div>
  );
}
