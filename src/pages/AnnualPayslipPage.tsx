import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AnnualPayslipView } from '@/components/payslips/AnnualPayslipView';
import { useDataStore } from '@/stores/data';
import { useAuth } from '@/contexts/AuthContext';
import { Download, ArrowLeft, Edit, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { AnnualPayslip } from '@/types';

export default function AnnualPayslipPage() {
  const { employeeId, individualId } = useParams<{ employeeId?: string; individualId?: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [annualPayslip, setAnnualPayslip] = useState<AnnualPayslip | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const getEmployeeAnnualPayslip = useDataStore((state) => state.getEmployeeAnnualPayslip);
  const getIndividualAnnualPayslip = useDataStore((state) => state.getIndividualAnnualPayslip);
  const generateEmployeeAnnualPayslip = useDataStore((state) => state.generateEmployeeAnnualPayslip);
  const generateIndividualAnnualPayslip = useDataStore((state) => state.generateIndividualAnnualPayslip);
  const employees = useDataStore((state) => state.employees);
  const individuals = useDataStore((state) => state.individuals);

  const canEdit = user?.role === 'SUPER_ADMIN' || user?.access?.canEditPayslips;

  const personId = employeeId || individualId;
  const isIndividual = !!individualId;

  const employee = employees.find((e) => e.id === personId);
  const individual = individuals.find((i) => i.id === personId);
  const person = employee || individual;

  // Load annual payslip async
  useEffect(() => {
    async function loadPayslip() {
      if (!personId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const payslip = isIndividual
          ? await getIndividualAnnualPayslip(personId, selectedYear)
          : await getEmployeeAnnualPayslip(personId, selectedYear);
        setAnnualPayslip(payslip);
      } catch (error) {
        console.error('Error loading annual payslip:', error);
        setAnnualPayslip(undefined);
      } finally {
        setLoading(false);
      }
    }

    loadPayslip();
  }, [personId, selectedYear, isIndividual, getEmployeeAnnualPayslip, getIndividualAnnualPayslip]);

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

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading annual payslip...</p>
          </div>
        </div>
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
                No annual payslip found for {person?.firstName} {person?.lastName} ({selectedYear})
              </p>
              <p className="text-sm text-muted-foreground mb-2">
                {isIndividual ? 'Individual' : 'Employee'} ID: {personId} | Year: {selectedYear}
              </p>
              <div className="mt-6 flex gap-4 justify-center">
                <Button
                  onClick={async () => {
                    try {
                      setLoading(true);
                      const payslip = isIndividual
                        ? await generateIndividualAnnualPayslip(personId, selectedYear)
                        : await generateEmployeeAnnualPayslip(personId, selectedYear);
                      setAnnualPayslip(payslip);
                    } catch (error: any) {
                      console.error('Failed to generate:', error);
                      alert(`Error: ${error.message}`);
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="bg-primary"
                >
                  Generate Annual Payslip
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate(-1)}
                >
                  Go Back
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
