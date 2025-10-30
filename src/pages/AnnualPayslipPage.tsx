import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AnnualPayslipView } from '@/components/payslips/AnnualPayslipView';
import { PayslipHistoryButton } from '@/components/payslips/PayslipHistoryButton';
import { useDataStore } from '@/stores/data';
import { useAuth } from '@/contexts/AuthContext';
import { Download, ArrowLeft, Edit, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { AnnualPayslip } from '@/types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from '@/lib/luxembourgPayroll';

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
        setAnnualPayslip(undefined);
      } finally {
        setLoading(false);
      }
    }

    loadPayslip();
  }, [personId, selectedYear, isIndividual, getEmployeeAnnualPayslip, getIndividualAnnualPayslip]);

  // Generate years from 2020 to 2050 for flexibility
  const startYear = 2020;
  const endYear = 2050;
  const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => endYear - i);

  const handleExportPDF = () => {
    if (!annualPayslip) return;

    const doc = new jsPDF('landscape');
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title
    doc.setFontSize(18);
    doc.text(`FICHE DE PAIE ANNUELLE ${annualPayslip.year}`, pageWidth / 2, 15, { align: 'center' });

    // Employee Info
    doc.setFontSize(10);
    doc.text(`Employé: ${annualPayslip.employee.lastName} ${annualPayslip.employee.firstName}`, 14, 25);
    doc.text(`Matricule: ${annualPayslip.employee.matricule || '-'}`, 14, 30);
    doc.text(`Classe: ${annualPayslip.employee.class}`, 14, 35);
    doc.text(`Date d'embauche: ${new Date(annualPayslip.employee.hireDate).toLocaleDateString('fr-LU')}`, 14, 40);

    doc.text(`Entreprise: ${annualPayslip.company.name}`, pageWidth - 14, 25, { align: 'right' });
    doc.text(`${annualPayslip.company.address}`, pageWidth - 14, 30, { align: 'right' });
    doc.text(`${annualPayslip.company.city}`, pageWidth - 14, 35, { align: 'right' });

    // Monthly Breakdown Table
    const monthlyHeaders = [
      ['Mois', 'Jours', 'Stat.', 'Classe', 'Rém. Base', 'Brut Mens.', 'Cotisable', 'Maladie', 'Pension', 'Déd.', 'Imposable', 'Impôts', 'CI-CO2', 'CIS', 'CISSM', 'Net']
    ];

    const monthlyBody = annualPayslip.monthlyData.map(month => [
      `${month.monthName.substring(0, 3)} ${month.days}`,
      month.daysImposable,
      month.status.substring(0, 4),
      month.taxClass,
      formatCurrency(month.earnings.remunerationBase),
      formatCurrency(month.earnings.grossMonthly),
      formatCurrency(month.earnings.cotisable),
      formatCurrency(month.employeeContrib.maladie),
      formatCurrency(month.employeeContrib.pension),
      formatCurrency(month.employeeContrib.deductions),
      formatCurrency(month.earnings.imposable),
      formatCurrency(month.employeeContrib.incomeTax),
      formatCurrency(month.employeeContrib.ciCo2),
      formatCurrency(month.employeeContrib.cis),
      formatCurrency(month.employeeContrib.cissm),
      formatCurrency(month.netPay)
    ]);

    const totals = annualPayslip.annualTotals;
    monthlyBody.push([
      'TOTAL', '', '', '',
      formatCurrency(totals.earnings.remunerationBase),
      formatCurrency(totals.earnings.grossMonthly),
      formatCurrency(totals.earnings.cotisable),
      formatCurrency(totals.employeeContrib.maladie),
      formatCurrency(totals.employeeContrib.pension),
      formatCurrency(totals.employeeContrib.deductions),
      formatCurrency(totals.earnings.imposable),
      formatCurrency(totals.employeeContrib.incomeTax),
      formatCurrency(totals.employeeContrib.ciCo2),
      formatCurrency(totals.employeeContrib.cis),
      formatCurrency(totals.employeeContrib.cissm),
      formatCurrency(totals.netPay)
    ]);

    autoTable(doc, {
      head: monthlyHeaders,
      body: monthlyBody,
      startY: 45,
      theme: 'grid',
      styles: { fontSize: 7, cellPadding: 1 },
      headStyles: { fillColor: [66, 139, 202], fontStyle: 'bold' },
      footStyles: { fillColor: [240, 240, 240], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 18 },
        1: { cellWidth: 12 },
        2: { cellWidth: 12 },
        3: { cellWidth: 12 },
      },
    });

    // Add new page for employer contributions
    doc.addPage();
    doc.setFontSize(14);
    doc.text('Cotisations Patronales', 14, 15);

    const employerHeaders = [['Mois', 'Maladie', 'Pension', 'Santé', 'Accident', 'Total Sécurité Sociale']];
    const employerBody = annualPayslip.monthlyData.map(month => {
      const employerMaladie = month.employeeContrib.maladie;
      const employerPension = month.employeeContrib.pension;
      const employerSante = month.earnings.cotisable * 0.0011;
      const employerAccident = month.earnings.cotisable * 0.0075;
      const total = employerMaladie + employerPension + employerSante + employerAccident;

      return [
        month.monthName,
        formatCurrency(employerMaladie),
        formatCurrency(employerPension),
        formatCurrency(employerSante),
        formatCurrency(employerAccident),
        formatCurrency(total)
      ];
    });

    employerBody.push([
      'TOTAL ANNUEL',
      formatCurrency(totals.employerContrib.maladie),
      formatCurrency(totals.employerContrib.pension),
      formatCurrency(totals.employerContrib.sante),
      formatCurrency(totals.employerContrib.accident),
      formatCurrency(totals.employerContrib.socialSecurityTotal)
    ]);

    autoTable(doc, {
      head: employerHeaders,
      body: employerBody,
      startY: 25,
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [66, 139, 202], fontStyle: 'bold' },
      footStyles: { fillColor: [240, 240, 240], fontStyle: 'bold' },
    });

    // Summary section
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text('Récapitulatif Annuel', 14, finalY);

    doc.setFontSize(10);
    let yPos = finalY + 10;
    doc.text(`Brut Total: ${formatCurrency(annualPayslip.recapitulation.totalGrossSalary)}`, 14, yPos);
    doc.text(`Net Total: ${formatCurrency(annualPayslip.recapitulation.totalNetSalary)}`, 14, yPos + 6);
    doc.text(`Cotisations Employé: ${formatCurrency(annualPayslip.recapitulation.totalEmployeeContributions)}`, 14, yPos + 12);
    doc.text(`Cotisations Employeur: ${formatCurrency(annualPayslip.recapitulation.totalEmployerContributions)}`, 14, yPos + 18);
    doc.text(`Impôts: ${formatCurrency(annualPayslip.recapitulation.totalTaxes)}`, 14, yPos + 24);
    doc.text(`Heures Travaillées: ${annualPayslip.recapitulation.totalHoursWorked}h`, 14, yPos + 30);

    // Download
    const filename = `Fiche_Paie_Annuelle_${annualPayslip.employee.lastName}_${annualPayslip.year}.pdf`;
    doc.save(filename);
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
            <Button onClick={() => navigate(-1)}>{t('common.back', 'Retour')}</Button>
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
            <p className="text-muted-foreground">{t('common.loading', 'Chargement...')}</p>
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
                {t('payslips.noPayslipsFound', 'Aucune fiche de paie trouvée')} - {person?.firstName} {person?.lastName} ({selectedYear})
              </p>
              <p className="text-sm text-muted-foreground mb-2">
                {isIndividual ? t('common.individual', 'Individu') : t('common.employee', 'Employé')} ID: {personId} | {t('payslips.year', 'Année')}: {selectedYear}
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
                      alert(`${t('common.error', 'Erreur')}: ${error.message}`);
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="bg-primary"
                >
                  {t('payslips.createAnnual', 'Créer Fiche de Paie Annuelle')}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate(-1)}
                >
                  {t('common.back', 'Retour')}
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
                const basePath = user?.role === 'SUPER_ADMIN' ? '/admin' : '/employee';
                navigate(`${basePath}/payslips/create-annual/${personId}`);
              }}
            >
              <Edit className="mr-2 h-4 w-4" />
              {t('common.edit', 'Modifier')}
            </Button>
          )}

          {annualPayslip?.id && (
            <PayslipHistoryButton payslipId={annualPayslip.id} payslipType="annual" />
          )}

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
