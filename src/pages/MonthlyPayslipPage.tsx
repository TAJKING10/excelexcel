import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useDataStore } from '@/stores/data';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Download, Calendar, Calculator, Edit2, Save, Check, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const MONTHS = [
  { value: 1, label: 'Janvier' },
  { value: 2, label: 'Février' },
  { value: 3, label: 'Mars' },
  { value: 4, label: 'Avril' },
  { value: 5, label: 'Mai' },
  { value: 6, label: 'Juin' },
  { value: 7, label: 'Juillet' },
  { value: 8, label: 'Août' },
  { value: 9, label: 'Septembre' },
  { value: 10, label: 'Octobre' },
  { value: 11, label: 'Novembre' },
  { value: 12, label: 'Décembre' },
];

// Social contributions rates (Luxembourg)
const RATES = {
  assuranceMaladie: 0.028,
  majoration: 0.0025,
  assurancePension: 0.08,
  assuranceDependance: 0.014,
  dependanceThreshold: 642.73,
};

interface PayslipData {
  employeeNumber: string;
  indice: string;
  emploi: string;
  dateEntree: string;
  matriculeAssure: string;
  matriculeEmployeur: string;
  hoursWorked: number;
  hourlyRate: number;
  holidayHours: number;
  sickLeaveHours: number;
  publicHolidayHours: number;
  fd: number;
  ac: number;
  ffo: number;
  fds: number;
  impot: number;
  chequeRepas: number;
  avanceSalaire: number;
  legalLeave: number;
  leaveReport: number;
  leaveTaken: number;
  // Manual overrides when auto-calculate is off
  manualAppointement?: number;
  manualJoursFeries?: number;
  manualTotalBrut?: number;
  manualAssuranceMaladie?: number;
  manualMajoration?: number;
  manualAssurancePension?: number;
  manualAssuranceDependance?: number;
  manualTotalCotisation?: number;
  manualTotalImposable?: number;
  manualCissm?: number;
  manualCisCipCim?: number;
  manualCiCo2?: number;
  manualNet?: number;
  manualNetAPayer?: number;
}

export default function MonthlyPayslipPage() {
  const { employeeId, individualId } = useParams<{ employeeId?: string; individualId?: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [autoCalculate, setAutoCalculate] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const employees = useDataStore((state) => state.employees);
  const individuals = useDataStore((state) => state.individuals);
  const companies = useDataStore((state) => state.companies);

  const personId = employeeId || individualId;
  const employee = employees.find((e) => e.id === personId);
  const individual = individuals.find((i) => i.id === personId);
  const person = employee || individual;
  const company = person ? companies.find((c) => c.id === person.companyId) : null;

  const [payslipData, setPayslipData] = useState<PayslipData>({
    employeeNumber: '2',
    indice: '21',
    emploi: person?.class || 'Comptable',
    dateEntree: person?.hireDate || '',
    matriculeAssure: person?.matricule || '',
    matriculeEmployeur: '20152206748',
    hoursWorked: 173,
    hourlyRate: person?.baseSalary ? person.baseSalary / 173 : 18.2968,
    holidayHours: 16,
    sickLeaveHours: 0,
    publicHolidayHours: 0,
    fd: 0,
    ac: 0,
    ffo: 0,
    fds: 0,
    impot: 225.3,
    chequeRepas: 56,
    avanceSalaire: 1000,
    legalLeave: 208,
    leaveReport: -4,
    leaveTaken: 16,
  });

  const calculatePayslip = () => {
    const { hoursWorked, hourlyRate, publicHolidayHours } = payslipData;

    // Use manual values if auto-calculate is off, otherwise calculate
    const appointement = !autoCalculate && payslipData.manualAppointement !== undefined
      ? payslipData.manualAppointement
      : hoursWorked * hourlyRate;

    const joursFeries = !autoCalculate && payslipData.manualJoursFeries !== undefined
      ? payslipData.manualJoursFeries
      : publicHolidayHours * hourlyRate;

    const totalBrut = !autoCalculate && payslipData.manualTotalBrut !== undefined
      ? payslipData.manualTotalBrut
      : appointement + joursFeries;

    const assuranceMaladie = !autoCalculate && payslipData.manualAssuranceMaladie !== undefined
      ? payslipData.manualAssuranceMaladie
      : totalBrut * RATES.assuranceMaladie;

    const majorationEspece = !autoCalculate && payslipData.manualMajoration !== undefined
      ? payslipData.manualMajoration
      : totalBrut * RATES.majoration;

    const assurancePension = !autoCalculate && payslipData.manualAssurancePension !== undefined
      ? payslipData.manualAssurancePension
      : totalBrut * RATES.assurancePension;

    const assuranceDependance = !autoCalculate && payslipData.manualAssuranceDependance !== undefined
      ? payslipData.manualAssuranceDependance
      : Math.max(0, (totalBrut - RATES.dependanceThreshold) * RATES.assuranceDependance);

    const totalCotisation = !autoCalculate && payslipData.manualTotalCotisation !== undefined
      ? payslipData.manualTotalCotisation
      : assuranceMaladie + majorationEspece + assurancePension + assuranceDependance;

    const totalImposable = !autoCalculate && payslipData.manualTotalImposable !== undefined
      ? payslipData.manualTotalImposable
      : totalBrut - assuranceMaladie - majorationEspece - assurancePension -
        payslipData.fd - payslipData.ac - payslipData.ffo - payslipData.fds;

    const cissm = !autoCalculate && payslipData.manualCissm !== undefined
      ? payslipData.manualCissm
      : totalBrut < 1800 ? 0 : totalBrut <= 3000 ? 81 : totalBrut >= 3600 ? 0 : 81 / 600 * (3600 - totalBrut);

    const cisCipCim = !autoCalculate && payslipData.manualCisCipCim !== undefined
      ? payslipData.manualCisCipCim
      : totalBrut < 78 ? 0 : totalBrut < 936 ? ((300 + (totalBrut * 12 - 936) * 0.029) / 12) : totalBrut < 3333.33 ? 50 : totalBrut > 6666.5 ? 0 : ((600 - (totalBrut * 12 - 40000) * 0.015) / 12);

    const ciCo2 = !autoCalculate && payslipData.manualCiCo2 !== undefined
      ? payslipData.manualCiCo2
      : totalBrut < 78 ? 0 : totalBrut < 3333.33 ? 16 : totalBrut < 6667 ? (16 - (totalBrut - 3333.33) * 0.0042) : 0;

    const net = !autoCalculate && payslipData.manualNet !== undefined
      ? payslipData.manualNet
      : totalBrut - totalCotisation - payslipData.impot + cissm + cisCipCim + ciCo2;

    const netAPayer = !autoCalculate && payslipData.manualNetAPayer !== undefined
      ? payslipData.manualNetAPayer
      : net - payslipData.chequeRepas - payslipData.avanceSalaire;

    const leaveSolde = (payslipData.legalLeave + payslipData.leaveReport) - payslipData.leaveTaken;

    return {
      appointement, joursFeries, totalBrut,
      assuranceMaladie, majorationEspece, assurancePension, assuranceDependance, totalCotisation,
      totalImposable, cissm, cisCipCim, ciCo2, net, netAPayer, leaveSolde
    };
  };

  const calculated = calculatePayslip();

  const handleInputChange = (field: keyof PayslipData, value: any) => {
    if (!isEditMode) return; // Only allow changes in edit mode

    setPayslipData(prev => {
      const newData = { ...prev, [field]: value };

      // If auto-calculate is ON and we're changing a base input field (not a manual override),
      // clear all manual override fields so they recalculate automatically
      if (autoCalculate && !field.startsWith('manual')) {
        return {
          ...newData,
          // Clear all manual overrides to trigger recalculation
          manualAppointement: undefined,
          manualJoursFeries: undefined,
          manualTotalBrut: undefined,
          manualAssuranceMaladie: undefined,
          manualMajoration: undefined,
          manualAssurancePension: undefined,
          manualAssuranceDependance: undefined,
          manualTotalCotisation: undefined,
          manualTotalImposable: undefined,
          manualCissm: undefined,
          manualCisCipCim: undefined,
          manualCiCo2: undefined,
          manualNet: undefined,
          manualNetAPayer: undefined,
        };
      }

      return newData;
    });

    setHasUnsavedChanges(true);
  };

  const handleEditToggle = () => {
    if (isEditMode && hasUnsavedChanges) {
      // Ask for confirmation before canceling
      const confirmed = window.confirm('Vous avez des modifications non sauvegardées. Voulez-vous vraiment annuler ?');
      if (!confirmed) return;
      setHasUnsavedChanges(false);
    }
    setIsEditMode(!isEditMode);
  };

  const handleSave = async () => {
    if (!personId) return;

    setIsSaving(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));

      // Here you can add logic to save the payslip data to your backend/database
      console.log('Saving payslip data:', {
        personId,
        year: selectedYear,
        month: selectedMonth,
        data: payslipData
      });

      // You can add: await updateMonthlyPayslip(personId, selectedYear, selectedMonth, payslipData);

      setHasUnsavedChanges(false);
      toast({
        title: "✓ Sauvegarde réussie",
        description: `Fiche de paie de ${MONTHS.find(m => m.value === selectedMonth)?.label} ${selectedYear} sauvegardée.`,
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Erreur de sauvegarde",
        description: "Une erreur s'est produite lors de la sauvegarde. Veuillez réessayer.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Keyboard shortcut for save (Ctrl+S / Cmd+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (hasUnsavedChanges && !isSaving) {
          handleSave();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasUnsavedChanges, isSaving, payslipData]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Clear manual overrides when auto-calculate is turned ON
  useEffect(() => {
    if (autoCalculate && isEditMode) {
      setPayslipData(prev => ({
        ...prev,
        manualAppointement: undefined,
        manualJoursFeries: undefined,
        manualTotalBrut: undefined,
        manualAssuranceMaladie: undefined,
        manualMajoration: undefined,
        manualAssurancePension: undefined,
        manualAssuranceDependance: undefined,
        manualTotalCotisation: undefined,
        manualTotalImposable: undefined,
        manualCissm: undefined,
        manualCisCipCim: undefined,
        manualCiCo2: undefined,
        manualNet: undefined,
        manualNetAPayer: undefined,
      }));
    }
  }, [autoCalculate, isEditMode]);

  // Component for editable calculated value - always editable in edit mode
  const EditableValue = ({ value, manualField, className = "" }: { value: number; manualField: keyof PayslipData; className?: string }) => {
    // If not in edit mode, show as read-only text
    if (!isEditMode) {
      return <span className={className}>{value.toFixed(2)} €</span>;
    }

    // In edit mode, determine which value to show:
    // - If Auto Calculate is ON: always show the calculated value (ignore manual overrides)
    // - If Auto Calculate is OFF: show manual override if exists, otherwise calculated value
    const displayValue = autoCalculate
      ? value
      : (payslipData[manualField] !== undefined ? payslipData[manualField] as number : value);

    const borderColorClass = autoCalculate
      ? "border-blue-300 focus:border-blue-500 focus:ring-blue-500"
      : "border-orange-300 focus:border-orange-500 focus:ring-orange-500 bg-orange-50/30";

    return (
      <Input
        type="number"
        step="0.01"
        value={displayValue}
        onChange={(e) => handleInputChange(manualField, parseFloat(e.target.value) || 0)}
        className={`h-7 w-28 text-right text-xs font-medium ${borderColorClass} ${className}`}
        disabled={autoCalculate}
      />
    );
  };

  // Component for editable input fields (hours, rates)
  const EditableInput = ({ field, value, type = "number", step = "1", className = "h-6 w-16 text-right text-xs" }: { field: keyof PayslipData; value: number | string; type?: string; step?: string; className?: string }) => {
    // If not in edit mode, show as read-only text
    if (!isEditMode) {
      return <span className={`${className} inline-block text-right`}>{value}</span>;
    }

    const baseInputClass = autoCalculate
      ? "border-blue-300 focus:border-blue-500 focus:ring-blue-500"
      : "border-orange-300 focus:border-orange-500 focus:ring-orange-500 bg-orange-50/30";

    return (
      <Input
        type={type}
        step={step}
        value={value}
        onChange={(e) => handleInputChange(field, type === "number" ? (parseFloat(e.target.value) || 0) : e.target.value)}
        className={`${className} ${baseInputClass} transition-colors`}
      />
    );
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(16);
    doc.text('DÉCOMPTE SALAIRE/TRAITEMENT', pageWidth / 2, 15, { align: 'center' });

    doc.setFontSize(9);
    doc.text(`N° Salarié: ${payslipData.employeeNumber}`, 14, 30);
    doc.text(`${company?.name || 'Groupe Advensys Luxembourg S.A'}`, pageWidth - 14, 30, { align: 'right' });
    doc.text(`Emploi: ${payslipData.emploi}`, 14, 35);
    doc.text(`${person?.firstName} ${person?.lastName}`, pageWidth - 14, 35, { align: 'right' });
    doc.text(`Période: ${MONTHS.find(m => m.value === selectedMonth)?.label} ${selectedYear}`, 14, 40);

    autoTable(doc, {
      startY: 50,
      head: [['Désignation', 'Quantité', 'Valeur', 'Total']],
      body: [
        ['Appointement', payslipData.hoursWorked.toFixed(0), payslipData.hourlyRate.toFixed(2), calculated.appointement.toFixed(2)],
        ['Total brut', '', '', calculated.totalBrut.toFixed(2)],
        ['Assurance Maladie', RATES.assuranceMaladie.toString(), '', calculated.assuranceMaladie.toFixed(2)],
        ['Total Cotisation', '', '', calculated.totalCotisation.toFixed(2)],
        ['Total Imposable', '', '', calculated.totalImposable.toFixed(2)],
        ['IMPÔT', '', '', payslipData.impot.toFixed(2)],
        ['NET', '', '', calculated.net.toFixed(2)],
        ['NET A PAYER', '', '', calculated.netAPayer.toFixed(2)],
      ],
      theme: 'striped',
      styles: { fontSize: 8 },
    });

    doc.save(`Bulletin_Salaire_${person?.lastName}_${MONTHS.find(m => m.value === selectedMonth)?.label}_${selectedYear}.pdf`);
  };

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  if (!personId || !person) {
    return (
      <div className="container mx-auto p-6">
        <Card><CardHeader><CardTitle>Erreur</CardTitle></CardHeader>
          <CardContent><p className="text-muted-foreground mb-4">Employé non trouvé.</p>
            <Button onClick={() => navigate(-1)}>Retour</Button></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Enhanced Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-start gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mt-1">
              <ArrowLeft className="mr-2 h-4 w-4" />Retour
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                <Calendar className="h-7 w-7 md:h-8 md:w-8 text-blue-600" />
                DÉCOMPTE SALAIRE
              </h1>
              <p className="text-base md:text-lg font-semibold text-foreground mt-1">
                {person.firstName} {person.lastName}
              </p>
              <p className="text-xs text-muted-foreground">
                {company?.name || 'Groupe Advensys Luxembourg S.A'}
              </p>
            </div>
          </div>

          <div className="flex gap-2 items-center flex-wrap">
            {isEditMode && (
              <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border border-blue-200 dark:border-blue-800 px-3 py-2 rounded-lg shadow-sm">
                <Calculator className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-semibold text-blue-900 dark:text-blue-100">Auto Calcul</span>
                <Switch
                  checked={autoCalculate}
                  onCheckedChange={setAutoCalculate}
                  className="data-[state=checked]:bg-blue-600"
                />
              </div>
            )}
            <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
              <SelectTrigger className="w-36 h-10"><SelectValue /></SelectTrigger>
              <SelectContent>{MONTHS.map((month) => (
                <SelectItem key={month.value} value={month.value.toString()}>{month.label}</SelectItem>
              ))}</SelectContent>
            </Select>
            <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
              <SelectTrigger className="w-28 h-10"><SelectValue /></SelectTrigger>
              <SelectContent>{years.map((year) => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}</SelectContent>
            </Select>

            {!isEditMode ? (
              <Button
                onClick={handleEditToggle}
                size="default"
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md transition-all"
              >
                <Edit2 className="mr-2 h-4 w-4" />
                Modifier
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleSave}
                  size="default"
                  disabled={!hasUnsavedChanges || isSaving}
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enregistrement...
                    </>
                  ) : hasUnsavedChanges ? (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Sauvegarder
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Sauvegardé
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleEditToggle}
                  size="default"
                  variant="outline"
                  className="shadow-sm border-2"
                >
                  Annuler
                </Button>
              </>
            )}

            <Button onClick={handleExportPDF} size="default" variant="outline" className="shadow-sm">
              <Download className="mr-2 h-4 w-4" />PDF
            </Button>
          </div>
        </div>

        {hasUnsavedChanges && (
          <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 rounded-md border border-amber-200 dark:border-amber-800">
            <span className="h-2 w-2 bg-amber-600 dark:bg-amber-400 rounded-full animate-pulse"></span>
            Modifications non sauvegardées • Appuyez sur Ctrl+S pour sauvegarder rapidement
          </div>
        )}
      </div>

      {isEditMode && !autoCalculate && (
        <Card className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 dark:from-orange-500/20 dark:to-amber-500/20 border-orange-400/40 shadow-sm">
          <CardContent className="py-4">
            <p className="text-center text-sm md:text-base font-semibold text-orange-900 dark:text-orange-100 flex items-center justify-center gap-3">
              <Edit2 className="h-5 w-5 animate-pulse" />
              MODE MANUEL ACTIVÉ
              <span className="text-xs font-normal bg-orange-100 dark:bg-orange-900 px-2 py-1 rounded">
                Modifiez tout manuellement - Aucun calcul automatique
              </span>
            </p>
          </CardContent>
        </Card>
      )}

      {isEditMode && autoCalculate && (
        <Card className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:to-indigo-500/20 border-blue-400/40 shadow-sm">
          <CardContent className="py-4">
            <p className="text-center text-sm md:text-base font-semibold text-blue-900 dark:text-blue-100 flex items-center justify-center gap-3">
              <Calculator className="h-5 w-5" />
              MODE AUTO ACTIVÉ
              <span className="text-xs font-normal bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
                Modifiez les champs - Les calculs se mettent à jour automatiquement
              </span>
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between text-sm bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span className="font-semibold text-blue-900 dark:text-blue-100">
            Période: {MONTHS.find(m => m.value === selectedMonth)?.label} {selectedYear}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          Montants en Euros (€)
        </span>
      </div>

      {/* Employee and Company Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="shadow-sm border-l-4 border-l-blue-500">
          <CardHeader className="pb-3 bg-gradient-to-r from-blue-50/50 to-transparent dark:from-blue-950/30">
            <CardTitle className="text-base md:text-lg flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">👤</span>
              </div>
              Informations Employé
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            {[
              ['N° Salarié', 'employeeNumber', 'text'],
              ['Indice', 'indice', 'text'],
              ['Emploi', 'emploi', 'text'],
              ['Date d\'entrée', 'dateEntree', 'date'],
              ['Matricule assuré', 'matriculeAssure', 'text'],
              ['Matricule employeur', 'matriculeEmployeur', 'text'],
            ].map(([label, field, type]) => (
              <div key={field} className="grid grid-cols-2 gap-3 items-center">
                <Label className="text-xs font-semibold text-muted-foreground">{label}:</Label>
                <EditableInput field={field as keyof PayslipData} value={payslipData[field as keyof PayslipData] as string} type={type as string} className="h-8 text-xs" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-green-500">
          <CardHeader className="pb-3 bg-gradient-to-r from-green-50/50 to-transparent dark:from-green-950/30">
            <CardTitle className="text-base md:text-lg flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <span className="text-sm font-bold text-green-600 dark:text-green-400">🏢</span>
              </div>
              Informations Entreprise
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-4">
            {[
              ['Entreprise', company?.name || 'Groupe Advensys Luxembourg S.A'],
              ['Adresse', company?.address || 'Duarrefstrooss 49'],
              ['Code Postal', company?.postalCode || 'L-9964'],
              ['Ville', company?.city || 'Huldange'],
              ['Pays', company?.country || 'Luxembourg'],
              ['Nom complet', `${person.firstName} ${person.lastName}`],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between py-1.5 border-b border-border/50 last:border-0">
                <span className="text-xs font-semibold text-muted-foreground">{label}:</span>
                <span className="text-xs font-medium text-foreground">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Main Payslip Table */}
      <Card className="shadow-md">
        <CardHeader className="pb-3 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950 dark:to-blue-950 border-b">
          <CardTitle className="text-lg md:text-xl flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
              <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">💰</span>
            </div>
            Bulletin de Salaire - {MONTHS.find(m => m.value === selectedMonth)?.label} {selectedYear}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 md:p-6">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs md:text-sm">
              <thead>
                <tr className="border-b-2 border-border bg-muted/70">
                  <th className="text-left py-2 px-2 font-semibold text-foreground">Désignation</th>
                  <th className="text-right py-2 px-2 font-semibold text-foreground whitespace-nowrap">Quantité</th>
                  <th className="text-right py-2 px-2 font-semibold text-foreground">Valeur</th>
                  <th className="text-right py-2 px-2 font-semibold text-foreground bg-blue-500/15 dark:bg-blue-500/25">Total</th>
                  <th className="text-right py-2 px-2 font-semibold text-foreground whitespace-nowrap">M-1</th>
                  <th className="text-right py-2 px-2 font-semibold text-foreground bg-green-500/15 dark:bg-green-500/25">Total</th>
                </tr>
              </thead>
              <tbody>
                {/* Appointement */}
                <tr className="border-b border-border hover:bg-muted/30">
                  <td className="py-2 px-2">Appointement</td>
                  <td className="text-right py-2 px-2">
                    <EditableInput field="hoursWorked" value={payslipData.hoursWorked} />
                  </td>
                  <td className="text-right py-2 px-2">
                    <EditableInput field="hourlyRate" value={payslipData.hourlyRate.toFixed(2)} step="0.01" className="h-6 w-20 text-right text-xs" />
                  </td>
                  <td className="text-right py-2 px-2 bg-blue-500/15 dark:bg-blue-500/25 font-medium text-foreground">
                    <EditableValue value={calculated.appointement} manualField="manualAppointement" />
                  </td>
                  <td className="text-right py-2 px-2 text-muted-foreground">-</td>
                  <td className="text-right py-2 px-2 bg-green-500/10 dark:bg-green-500/20 text-muted-foreground">-</td>
                </tr>

                {/* Jours fériés */}
                <tr className="border-b border-border hover:bg-muted/30">
                  <td className="py-2 px-2">Jours fériés</td>
                  <td className="text-right py-2 px-2">
                    <EditableInput field="publicHolidayHours" value={payslipData.publicHolidayHours} />
                  </td>
                  <td className="text-right py-2 px-2 text-muted-foreground">0</td>
                  <td className="text-right py-2 px-2 bg-blue-500/15 dark:bg-blue-500/25 font-medium text-foreground">
                    <EditableValue value={calculated.joursFeries} manualField="manualJoursFeries" />
                  </td>
                  <td className="text-right py-2 px-2 text-muted-foreground">-</td>
                  <td className="text-right py-2 px-2 bg-green-500/10 dark:bg-green-500/20 text-muted-foreground">-</td>
                </tr>

                {/* Congés & Absences */}
                <tr className="border-b border-border hover:bg-muted/30">
                  <td className="py-2 px-2">Congés (H)</td>
                  <td className="text-right py-2 px-2">
                    <EditableInput field="holidayHours" value={payslipData.holidayHours} />
                  </td>
                  <td className="text-right py-2 px-2 text-muted-foreground">0</td>
                  <td className="text-right py-2 px-2 bg-blue-500/15 dark:bg-blue-500/25 text-foreground">0.00 €</td>
                  <td className="text-right py-2 px-2 text-muted-foreground">-</td>
                  <td className="text-right py-2 px-2 bg-green-500/15 dark:bg-green-500/25 text-muted-foreground">-</td>
                </tr>

                <tr className="border-b border-border hover:bg-muted/30">
                  <td className="py-2 px-2">Absences Maladie (H)</td>
                  <td className="text-right py-2 px-2">
                    <EditableInput field="sickLeaveHours" value={payslipData.sickLeaveHours} />
                  </td>
                  <td className="text-right py-2 px-2 text-muted-foreground">0</td>
                  <td className="text-right py-2 px-2 bg-blue-500/15 dark:bg-blue-500/25 text-foreground">0.00 €</td>
                  <td className="text-right py-2 px-2 text-muted-foreground">-</td>
                  <td className="text-right py-2 px-2 bg-green-500/15 dark:bg-green-500/25 text-muted-foreground">-</td>
                </tr>

                {/* Total Brut */}
                <tr className="border-b-2 border-border bg-blue-500/20 dark:bg-blue-500/30 font-bold">
                  <td className="py-2 px-2 text-foreground">Total brut</td>
                  <td className="text-right py-2 px-2 text-foreground">-</td>
                  <td className="text-right py-2 px-2 text-foreground">-</td>
                  <td className="text-right py-2 px-2 bg-blue-500/35 dark:bg-blue-500/45 text-foreground">
                    <EditableValue value={calculated.totalBrut} manualField="manualTotalBrut" className="font-bold" />
                  </td>
                  <td className="text-right py-2 px-2 text-foreground">0.00 €</td>
                  <td className="text-right py-2 px-2 bg-green-500/35 dark:bg-green-500/45 text-foreground">
                    <EditableValue value={calculated.totalBrut} manualField="manualTotalBrut" className="font-bold" />
                  </td>
                </tr>

                <tr><td colSpan={6} className="py-1"></td></tr>

                {/* Cotisations */}
                <tr className="bg-muted/70 font-semibold"><td className="py-2 px-2 text-foreground" colSpan={6}>Cotisation</td></tr>

                {[
                  ['Assurance Maladie', RATES.assuranceMaladie, calculated.assuranceMaladie, 'manualAssuranceMaladie'],
                  ['A-M Majoration espèce', RATES.majoration, calculated.majorationEspece, 'manualMajoration'],
                  ['Assurance Pension', RATES.assurancePension, calculated.assurancePension, 'manualAssurancePension'],
                  ['Assurance dépendance', RATES.assuranceDependance, calculated.assuranceDependance, 'manualAssuranceDependance'],
                ].map(([label, rate, value, manualField]) => (
                  <tr key={label as string} className="border-b border-border hover:bg-muted/30">
                    <td className="py-2 px-2">{label}</td>
                    <td className="text-right py-2 px-2 text-muted-foreground">{((rate as number) * 100).toFixed(2)}%</td>
                    <td className="text-right py-2 px-2 text-muted-foreground">-</td>
                    <td className="text-right py-2 px-2 bg-blue-500/15 dark:bg-blue-500/25 font-medium text-foreground">
                      <EditableValue value={value as number} manualField={manualField as keyof PayslipData} />
                    </td>
                    <td className="text-right py-2 px-2 text-foreground">0.00 €</td>
                    <td className="text-right py-2 px-2 bg-green-500/15 dark:bg-green-500/25 text-foreground">
                      <EditableValue value={value as number} manualField={manualField as keyof PayslipData} />
                    </td>
                  </tr>
                ))}

                <tr className="border-b-2 border-border bg-orange-500/20 dark:bg-orange-500/30 font-bold">
                  <td className="py-2 px-2 text-foreground">Total Cotisation</td>
                  <td className="text-right py-2 px-2 text-foreground">-</td>
                  <td className="text-right py-2 px-2 text-foreground">-</td>
                  <td className="text-right py-2 px-2 bg-orange-500/35 dark:bg-orange-500/45 text-foreground">
                    <EditableValue value={calculated.totalCotisation} manualField="manualTotalCotisation" className="font-bold" />
                  </td>
                  <td className="text-right py-2 px-2 text-foreground">0.00 €</td>
                  <td className="text-right py-2 px-2 bg-orange-500/35 dark:bg-orange-500/45 text-foreground">
                    <EditableValue value={calculated.totalCotisation} manualField="manualTotalCotisation" className="font-bold" />
                  </td>
                </tr>

                <tr><td colSpan={6} className="py-1"></td></tr>

                {/* Deductions */}
                <tr className="bg-muted/70 font-semibold"><td className="py-2 px-2 text-foreground" colSpan={6}>Deduction</td></tr>

                {['fd', 'ac', 'ffo', 'fds'].map((field) => (
                  <tr key={field} className="border-b border-border hover:bg-muted/30">
                    <td className="py-2 px-2">{field.toUpperCase()}</td>
                    <td className="text-right py-2 px-2 text-muted-foreground">-</td>
                    <td className="text-right py-2 px-2 text-muted-foreground">-</td>
                    <td className="text-right py-2 px-2 bg-blue-500/15 dark:bg-blue-500/25">
                      <EditableInput field={field as keyof PayslipData} value={payslipData[field as keyof PayslipData] as number} step="0.01" className="h-6 w-20 text-right text-xs" />
                    </td>
                    <td className="text-right py-2 px-2 text-foreground">0.00 €</td>
                    <td className="text-right py-2 px-2 bg-green-500/15 dark:bg-green-500/25 text-foreground">
                      {(payslipData[field as keyof PayslipData] as number).toFixed(2)} €
                    </td>
                  </tr>
                ))}

                <tr><td colSpan={6} className="py-1"></td></tr>

                {/* Total Imposable */}
                <tr className="border-b-2 border-border bg-purple-500/20 dark:bg-purple-500/30 font-bold">
                  <td className="py-2 px-2 text-foreground">Total Imposable</td>
                  <td className="text-right py-2 px-2 text-foreground">-</td>
                  <td className="text-right py-2 px-2 text-foreground">-</td>
                  <td className="text-right py-2 px-2 bg-purple-500/35 dark:bg-purple-500/45 text-foreground">
                    <EditableValue value={calculated.totalImposable} manualField="manualTotalImposable" className="font-bold" />
                  </td>
                  <td className="text-right py-2 px-2 text-foreground">0.00 €</td>
                  <td className="text-right py-2 px-2 bg-purple-500/35 dark:bg-purple-500/45 text-foreground">
                    <EditableValue value={calculated.totalImposable} manualField="manualTotalImposable" className="font-bold" />
                  </td>
                </tr>

                <tr><td colSpan={6} className="py-1"></td></tr>

                {/* Impôts and Credits */}
                <tr className="border-b border-border hover:bg-muted/30">
                  <td className="py-2 px-2 font-semibold">IMPÔT</td>
                  <td className="text-right py-2 px-2 text-muted-foreground">-</td>
                  <td className="text-right py-2 px-2 text-muted-foreground">-</td>
                  <td className="text-right py-2 px-2 bg-blue-500/15 dark:bg-blue-500/25">
                    <EditableInput field="impot" value={payslipData.impot} step="0.01" className="h-6 w-20 text-right text-xs" />
                  </td>
                  <td className="text-right py-2 px-2 text-foreground">0.00 €</td>
                  <td className="text-right py-2 px-2 bg-green-500/15 dark:bg-green-500/25 text-foreground">{payslipData.impot.toFixed(2)} €</td>
                </tr>

                {[
                  ['CISSM', calculated.cissm, 'manualCissm'],
                  ['CIS-CIP-CIM', calculated.cisCipCim, 'manualCisCipCim'],
                  ['CI-CO2', calculated.ciCo2, 'manualCiCo2'],
                ].map(([label, value, manualField]) => (
                  <tr key={label} className="border-b border-border hover:bg-muted/30">
                    <td className="py-2 px-2">{label}</td>
                    <td className="text-right py-2 px-2 text-muted-foreground">-</td>
                    <td className="text-right py-2 px-2 text-muted-foreground">-</td>
                    <td className="text-right py-2 px-2 bg-blue-500/15 dark:bg-blue-500/25 font-medium text-foreground">
                      <EditableValue value={value as number} manualField={manualField as keyof PayslipData} />
                    </td>
                    <td className="text-right py-2 px-2 text-foreground">0.00 €</td>
                    <td className="text-right py-2 px-2 bg-green-500/15 dark:bg-green-500/25 text-foreground">
                      <EditableValue value={value as number} manualField={manualField as keyof PayslipData} />
                    </td>
                  </tr>
                ))}

                <tr><td colSpan={6} className="py-1"></td></tr>

                {/* NET */}
                <tr className="border-b-2 border-border bg-green-500/20 dark:bg-green-500/30 font-bold">
                  <td className="py-3 px-2 text-base text-foreground">NET</td>
                  <td className="text-right py-3 px-2 text-foreground">-</td>
                  <td className="text-right py-3 px-2 text-foreground">-</td>
                  <td className="text-right py-3 px-2 bg-green-500/35 dark:bg-green-500/45 text-base text-foreground">
                    <EditableValue value={calculated.net} manualField="manualNet" className="font-bold text-base" />
                  </td>
                  <td className="text-right py-3 px-2 text-foreground">0.00 €</td>
                  <td className="text-right py-3 px-2 bg-green-500/40 dark:bg-green-500/50 text-base text-foreground">
                    <EditableValue value={calculated.net} manualField="manualNet" className="font-bold text-base" />
                  </td>
                </tr>

                {/* Deductions from NET */}
                {[
                  ['Chèque repas', 'chequeRepas'],
                  ['Avance sur salaire', 'avanceSalaire'],
                ].map(([label, field]) => (
                  <tr key={field} className="border-b border-border hover:bg-muted/30">
                    <td className="py-2 px-2">{label}</td>
                    <td className="text-right py-2 px-2 text-muted-foreground">-</td>
                    <td className="text-right py-2 px-2 text-muted-foreground">-</td>
                    <td className="text-right py-2 px-2 bg-blue-500/15 dark:bg-blue-500/25">
                      <EditableInput field={field as keyof PayslipData} value={payslipData[field as keyof PayslipData] as number} step="0.01" className="h-6 w-20 text-right text-xs" />
                    </td>
                    <td className="text-right py-2 px-2 text-muted-foreground">-</td>
                    <td className="text-right py-2 px-2 bg-green-500/15 dark:bg-green-500/25 text-muted-foreground">-</td>
                  </tr>
                ))}

                {/* NET A PAYER */}
                <tr className="border-t-2 border-border bg-green-600/30 dark:bg-green-600/40">
                  <td colSpan={4}></td>
                  <td className="text-right py-3 px-2 font-bold text-base text-foreground">NET À PAYER</td>
                  <td className="text-right py-3 px-2 bg-green-600/50 dark:bg-green-600/60 font-bold text-base text-foreground">
                    <EditableValue value={calculated.netAPayer} manualField="manualNetAPayer" className="font-bold text-base" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Additional Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="shadow-sm border-l-4 border-l-purple-500">
          <CardHeader className="pb-3 bg-gradient-to-r from-purple-50/50 to-transparent dark:from-purple-950/30">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                <span className="text-sm font-bold text-purple-600 dark:text-purple-400">🏖️</span>
              </div>
              Congés (H)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            {[
              ['Légaux', 'legalLeave'],
              ['Report', 'leaveReport'],
              ['Pris', 'leaveTaken'],
            ].map(([label, field]) => (
              <div key={field} className="grid grid-cols-2 gap-3 items-center">
                <Label className="text-xs font-semibold text-muted-foreground">{label}:</Label>
                <EditableInput field={field as keyof PayslipData} value={payslipData[field as keyof PayslipData] as number} className="h-8 text-xs" />
              </div>
            ))}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t-2 border-purple-200 dark:border-purple-800 mt-3">
              <Label className="text-sm font-bold text-purple-900 dark:text-purple-100">Solde:</Label>
              <div className="text-right font-bold text-base text-purple-600 dark:text-purple-400">
                {calculated.leaveSolde} H
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-indigo-500">
          <CardHeader className="pb-3 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/30">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">📊</span>
              </div>
              Rémunération & Fiche d'impôts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-4">
            {[
              ['Salaire mensuel', `${calculated.totalBrut.toFixed(2)} €`],
              ['Heures', payslipData.hoursWorked.toString()],
              ['Salaire horaire', `${payslipData.hourlyRate.toFixed(4)} €`],
              ['N° de carte', 'D608388-2022'],
              ['Classe', '1'],
              ['Taux', '-'],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between py-1.5 border-b border-border/50 last:border-0">
                <span className="text-xs font-semibold text-muted-foreground">{label}:</span>
                <span className="text-xs font-medium text-foreground">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Footer note */}
      <Card className="bg-gradient-to-r from-yellow-500/10 to-amber-500/10 dark:from-yellow-500/20 dark:to-amber-500/20 border-yellow-500/40 shadow-sm">
        <CardContent className="py-5">
          <p className="text-center text-sm md:text-base font-bold text-yellow-900 dark:text-yellow-100 flex items-center justify-center gap-3">
            <span className="text-2xl">⚠️</span>
            CONSERVEZ CE BULLETIN DE PAIE SANS LIMITATION DE DURÉE
            <span className="text-2xl">⚠️</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
