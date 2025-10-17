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
import { ArrowLeft, Download, Calendar, Calculator } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
  assuranceMaladie: 0.028, // 2.8%
  majoration: 0.0025, // 0.25%
  assurancePension: 0.08, // 8%
  assuranceDependance: 0.014, // 1.4%
  dependanceThreshold: 642.73, // Threshold for dependance calculation
};

interface PayslipData {
  // Employee info
  employeeNumber: string;
  indice: string;
  emploi: string;
  dateEntree: string;
  matriculeAssure: string;
  matriculeEmployeur: string;

  // Working hours
  hoursWorked: number;
  hourlyRate: number;
  holidayHours: number;
  sickLeaveHours: number;
  publicHolidayHours: number;

  // Deductions (manual inputs)
  fd: number;
  ac: number;
  ffo: number;
  fds: number;
  impot: number; // Tax (manual)

  // Other
  chequeRepas: number;
  avanceSalaire: number;

  // Leave tracking
  legalLeave: number;
  leaveReport: number;
  leaveTaken: number;
}

export default function MonthlyPayslipPage() {
  const { employeeId, individualId } = useParams<{ employeeId?: string; individualId?: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [autoCalculate, setAutoCalculate] = useState(true);

  const employees = useDataStore((state) => state.employees);
  const individuals = useDataStore((state) => state.individuals);
  const companies = useDataStore((state) => state.companies);

  const personId = employeeId || individualId;
  const isIndividual = !!individualId;

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

  // Calculate all values based on formulas
  const calculatePayslip = () => {
    const { hoursWorked, hourlyRate, holidayHours, sickLeaveHours, publicHolidayHours } = payslipData;

    // Appointement (Base salary)
    const appointement = hoursWorked * hourlyRate;

    // Jours fériés
    const joursFeries = publicHolidayHours * hourlyRate;

    // Congés
    const conges = holidayHours * 0; // Usually 0 as per Excel

    // Absences Maladie
    const absencesMaladie = sickLeaveHours * 0;

    // Total Brut (D20)
    const totalBrut = appointement + joursFeries;

    // Cotisations
    const assuranceMaladie = totalBrut * RATES.assuranceMaladie;
    const majorationEspece = totalBrut * RATES.majoration;
    const assurancePension = totalBrut * RATES.assurancePension;
    const assuranceDependance = (totalBrut - RATES.dependanceThreshold) * RATES.assuranceDependance;
    const totalCotisation = assuranceMaladie + majorationEspece + assurancePension + assuranceDependance;

    // Total Imposable (D35)
    const totalImposable = totalBrut - assuranceMaladie - majorationEspece - assurancePension -
                          payslipData.fd - payslipData.ac - payslipData.ffo - payslipData.fds;

    // CISSM - Complex formula from Excel
    const cissm = totalBrut < 1800 ? 0 :
                  totalBrut <= 3000 ? 81 :
                  totalBrut >= 3600 ? 0 :
                  81 / 600 * (3600 - totalBrut);

    // CIS-CIP-CIM - Complex formula from Excel
    const cisCipCim = totalBrut < 78 ? 0 :
                      totalBrut < 936 ? ((300 + (totalBrut * 12 - 936) * 0.029) / 12) :
                      totalBrut < 3333.33 ? 50 :
                      totalBrut > 6666.5 ? 0 :
                      ((600 - (totalBrut * 12 - 40000) * 0.015) / 12);

    // CI-CO2 - Complex formula from Excel
    const ciCo2 = totalBrut < 78 ? 0 :
                  totalBrut < 3333.33 ? 16 :
                  totalBrut < 6667 ? (16 - (totalBrut - 3333.33) * 0.0042) :
                  0;

    // NET (D42)
    const net = totalBrut - totalCotisation - payslipData.impot + cissm + cisCipCim + ciCo2;

    // NET A PAYER (G44)
    const netAPayer = net - payslipData.chequeRepas - payslipData.avanceSalaire;

    // Leave calculations
    const leaveSolde = (payslipData.legalLeave + payslipData.leaveReport) - payslipData.leaveTaken;

    return {
      appointement,
      joursFeries,
      conges,
      absencesMaladie,
      totalBrut,
      assuranceMaladie,
      majorationEspece,
      assurancePension,
      assuranceDependance,
      totalCotisation,
      totalImposable,
      cissm,
      cisCipCim,
      ciCo2,
      net,
      netAPayer,
      leaveSolde,
    };
  };

  const calculated = calculatePayslip();

  const handleInputChange = (field: keyof PayslipData, value: any) => {
    setPayslipData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title
    doc.setFontSize(16);
    doc.text('DÉCOMPTE SALAIRE/TRAITEMENT', pageWidth / 2, 15, { align: 'center' });

    // Company and Employee Info
    doc.setFontSize(9);
    doc.text(`N° Salarié: ${payslipData.employeeNumber}`, 14, 30);
    doc.text(`${company?.name || 'Groupe Advensys Luxembourg S.A'}`, pageWidth - 14, 30, { align: 'right' });
    doc.text(`Indice: ${payslipData.indice}`, 14, 35);
    doc.text(`${company?.address || 'Duarrefstrooss 49'}`, pageWidth - 14, 35, { align: 'right' });
    doc.text(`Emploi: ${payslipData.emploi}`, 14, 40);
    doc.text(`${company?.postalCode || 'L-9964'} ${company?.city || 'Huldange'}`, pageWidth - 14, 40, { align: 'right' });
    doc.text(`Matricule assuré: ${payslipData.matriculeAssure}`, 14, 45);
    doc.text(`${person?.firstName} ${person?.lastName}`, pageWidth - 14, 45, { align: 'right' });
    doc.text(`Période: ${MONTHS.find(m => m.value === selectedMonth)?.label} ${selectedYear}`, 14, 50);

    // Table
    autoTable(doc, {
      startY: 60,
      head: [['Désignation', 'Quantité (heures)', 'Valeur', 'Total']],
      body: [
        ['Appointement', payslipData.hoursWorked.toFixed(0), payslipData.hourlyRate.toFixed(2), calculated.appointement.toFixed(2)],
        ['Jours fériée', payslipData.publicHolidayHours.toFixed(0), '0', calculated.joursFeries.toFixed(2)],
        ['Congés (H)', payslipData.holidayHours.toFixed(0), '0', calculated.conges.toFixed(2)],
        ['Absences Maladie (H)', payslipData.sickLeaveHours.toFixed(0), '0', calculated.absencesMaladie.toFixed(2)],
        ['Total brut', '', '', calculated.totalBrut.toFixed(2)],
        ['', '', '', ''],
        ['Cotisation', '', '', ''],
        ['Assurance Maladie', RATES.assuranceMaladie.toString(), '', calculated.assuranceMaladie.toFixed(2)],
        ['A-M Majoration espèce', RATES.majoration.toString(), '', calculated.majorationEspece.toFixed(2)],
        ['Assurance Pension', RATES.assurancePension.toString(), '', calculated.assurancePension.toFixed(2)],
        ['Assurance dépendance', RATES.assuranceDependance.toString(), '', calculated.assuranceDependance.toFixed(2)],
        ['Total Cotisation', '', '', calculated.totalCotisation.toFixed(2)],
        ['', '', '', ''],
        ['Deduction', '', '', ''],
        ['FD', '', '', payslipData.fd.toFixed(2)],
        ['AC', '', '', payslipData.ac.toFixed(2)],
        ['FFO', '', '', payslipData.ffo.toFixed(2)],
        ['FDS', '', '', payslipData.fds.toFixed(2)],
        ['', '', '', ''],
        ['Total Imposable', '', '', calculated.totalImposable.toFixed(2)],
        ['', '', '', ''],
        ['IMPÔT', '', '', payslipData.impot.toFixed(2)],
        ['CISSM', '', '', calculated.cissm.toFixed(2)],
        ['CIS-CIP-CIM', '', '', calculated.cisCipCim.toFixed(2)],
        ['CI-CO2', '', '', calculated.ciCo2.toFixed(2)],
        ['', '', '', ''],
        ['NET', '', '', calculated.net.toFixed(2)],
        ['Chèque repas', '', '', payslipData.chequeRepas.toFixed(2)],
        ['Avance sur salaire', '', '', payslipData.avanceSalaire.toFixed(2)],
        ['NET A PAYER', '', '', calculated.netAPayer.toFixed(2)],
      ],
      theme: 'striped',
      styles: { fontSize: 8 },
    });

    doc.save(`Bulletin_Salaire_${person?.lastName}_${MONTHS.find(m => m.value === selectedMonth)?.label}_${selectedYear}.pdf`);
  };

  // Generate year options (last 5 years)
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  if (!personId || !person) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Erreur</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">Employé non trouvé.</p>
            <Button onClick={() => navigate(-1)}>Retour</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Calendar className="h-8 w-8" />
              DÉCOMPTE SALAIRE/TRAITEMENT
            </h1>
            <p className="text-muted-foreground">
              {person.firstName} {person.lastName}
            </p>
          </div>
        </div>

        <div className="flex gap-2 items-center flex-wrap">
          <div className="flex items-center gap-2 bg-muted p-2 rounded">
            <Calculator className="h-4 w-4" />
            <Label htmlFor="auto-calc" className="text-sm cursor-pointer">
              Auto-calcul
            </Label>
            <Switch
              id="auto-calc"
              checked={autoCalculate}
              onCheckedChange={setAutoCalculate}
            />
          </div>

          <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((month) => (
                <SelectItem key={month.value} value={month.value.toString()}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

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

          <Button onClick={handleExportPDF}>
            <Download className="mr-2 h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        Période: {MONTHS.find(m => m.value === selectedMonth)?.label} {selectedYear} • Les montants sont exprimés en Euros.
      </div>

      {/* Employee and Company Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informations Employé</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Label className="text-sm">N° Salarié:</Label>
              <Input
                type="text"
                value={payslipData.employeeNumber}
                onChange={(e) => handleInputChange('employeeNumber', e.target.value)}
                className="h-8"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Label className="text-sm">Indice:</Label>
              <Input
                type="text"
                value={payslipData.indice}
                onChange={(e) => handleInputChange('indice', e.target.value)}
                className="h-8"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Label className="text-sm">Emploi:</Label>
              <Input
                type="text"
                value={payslipData.emploi}
                onChange={(e) => handleInputChange('emploi', e.target.value)}
                className="h-8"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Label className="text-sm">Date d'entrée:</Label>
              <Input
                type="date"
                value={payslipData.dateEntree}
                onChange={(e) => handleInputChange('dateEntree', e.target.value)}
                className="h-8"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Label className="text-sm">Matricule assuré:</Label>
              <Input
                type="text"
                value={payslipData.matriculeAssure}
                onChange={(e) => handleInputChange('matriculeAssure', e.target.value)}
                className="h-8"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Label className="text-sm">Matricule employeur:</Label>
              <Input
                type="text"
                value={payslipData.matriculeEmployeur}
                onChange={(e) => handleInputChange('matriculeEmployeur', e.target.value)}
                className="h-8"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informations Entreprise</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between py-1">
              <span className="text-sm text-muted-foreground">Entreprise:</span>
              <span className="text-sm font-medium">{company?.name || 'Groupe Advensys Luxembourg S.A'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-sm text-muted-foreground">Adresse:</span>
              <span className="text-sm font-medium">{company?.address || 'Duarrefstrooss 49'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-sm text-muted-foreground">Code Postal:</span>
              <span className="text-sm font-medium">{company?.postalCode || 'L-9964'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-sm text-muted-foreground">Ville:</span>
              <span className="text-sm font-medium">{company?.city || 'Huldange'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-sm text-muted-foreground">Pays:</span>
              <span className="text-sm font-medium">{company?.country || 'Luxembourg'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-sm text-muted-foreground">Nom complet:</span>
              <span className="text-sm font-medium">{person.firstName} {person.lastName}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-sm text-muted-foreground">Adresse:</span>
              <span className="text-sm font-medium">93, Duarrefstrooss</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-sm text-muted-foreground">Localité:</span>
              <span className="text-sm font-medium">{company?.postalCode || 'L-9964'} {company?.city || 'Huldange'}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Payslip Table */}
      <Card>
        <CardHeader>
          <CardTitle>Bulletin de Salaire - {MONTHS.find(m => m.value === selectedMonth)?.label} {selectedYear}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left py-2 px-2 font-semibold text-sm">Désignation</th>
                  <th className="text-right py-2 px-2 font-semibold text-sm">Quantité (heures)</th>
                  <th className="text-right py-2 px-2 font-semibold text-sm">Valeur</th>
                  <th className="text-right py-2 px-2 font-semibold text-sm bg-blue-50">Total</th>
                  <th className="text-right py-2 px-2 font-semibold text-sm">Cumuls M-1</th>
                  <th className="text-right py-2 px-2 font-semibold text-sm bg-green-50">Total</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {/* Appointement */}
                <tr className="border-b">
                  <td className="py-2 px-2">Appointement</td>
                  <td className="text-right py-2 px-2">
                    <Input
                      type="number"
                      value={payslipData.hoursWorked}
                      onChange={(e) => handleInputChange('hoursWorked', parseFloat(e.target.value) || 0)}
                      className="h-7 w-20 text-right"
                    />
                  </td>
                  <td className="text-right py-2 px-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={payslipData.hourlyRate.toFixed(6)}
                      onChange={(e) => handleInputChange('hourlyRate', parseFloat(e.target.value) || 0)}
                      className="h-7 w-32 text-right"
                    />
                  </td>
                  <td className="text-right py-2 px-2 bg-blue-50 font-medium">{calculated.appointement.toFixed(2)} €</td>
                  <td className="text-right py-2 px-2">-</td>
                  <td className="text-right py-2 px-2 bg-green-50">-</td>
                </tr>

                {/* Jours fériés */}
                <tr className="border-b">
                  <td className="py-2 px-2">Jours fériés</td>
                  <td className="text-right py-2 px-2">
                    <Input
                      type="number"
                      value={payslipData.publicHolidayHours}
                      onChange={(e) => handleInputChange('publicHolidayHours', parseFloat(e.target.value) || 0)}
                      className="h-7 w-20 text-right"
                    />
                  </td>
                  <td className="text-right py-2 px-2">0</td>
                  <td className="text-right py-2 px-2 bg-blue-50 font-medium">{calculated.joursFeries.toFixed(2)} €</td>
                  <td className="text-right py-2 px-2">-</td>
                  <td className="text-right py-2 px-2 bg-green-50">-</td>
                </tr>

                {/* Congés */}
                <tr className="border-b">
                  <td className="py-2 px-2">Congés (H)</td>
                  <td className="text-right py-2 px-2">
                    <Input
                      type="number"
                      value={payslipData.holidayHours}
                      onChange={(e) => handleInputChange('holidayHours', parseFloat(e.target.value) || 0)}
                      className="h-7 w-20 text-right"
                    />
                  </td>
                  <td className="text-right py-2 px-2">0</td>
                  <td className="text-right py-2 px-2 bg-blue-50 font-medium">{calculated.conges.toFixed(2)} €</td>
                  <td className="text-right py-2 px-2">-</td>
                  <td className="text-right py-2 px-2 bg-green-50">-</td>
                </tr>

                {/* Absences Maladie */}
                <tr className="border-b">
                  <td className="py-2 px-2">Absences Maladie (H)</td>
                  <td className="text-right py-2 px-2">
                    <Input
                      type="number"
                      value={payslipData.sickLeaveHours}
                      onChange={(e) => handleInputChange('sickLeaveHours', parseFloat(e.target.value) || 0)}
                      className="h-7 w-20 text-right"
                    />
                  </td>
                  <td className="text-right py-2 px-2">0</td>
                  <td className="text-right py-2 px-2 bg-blue-50 font-medium">{calculated.absencesMaladie.toFixed(2)} €</td>
                  <td className="text-right py-2 px-2">-</td>
                  <td className="text-right py-2 px-2 bg-green-50">-</td>
                </tr>

                {/* Total Brut */}
                <tr className="border-b-2 border-gray-400 bg-blue-100 font-bold">
                  <td className="py-2 px-2">Total brut</td>
                  <td className="text-right py-2 px-2">-</td>
                  <td className="text-right py-2 px-2">-</td>
                  <td className="text-right py-2 px-2 bg-blue-200">{calculated.totalBrut.toFixed(2)} €</td>
                  <td className="text-right py-2 px-2">0.00 €</td>
                  <td className="text-right py-2 px-2 bg-green-100">{calculated.totalBrut.toFixed(2)} €</td>
                </tr>

                <tr><td colSpan={6} className="py-1"></td></tr>

                {/* Cotisations */}
                <tr className="bg-gray-100 font-semibold">
                  <td className="py-2 px-2" colSpan={6}>Cotisation</td>
                </tr>

                <tr className="border-b">
                  <td className="py-2 px-2">Assurance Maladie</td>
                  <td className="text-right py-2 px-2">{(RATES.assuranceMaladie * 100).toFixed(2)}%</td>
                  <td className="text-right py-2 px-2">-</td>
                  <td className="text-right py-2 px-2 bg-blue-50 font-medium">{calculated.assuranceMaladie.toFixed(2)} €</td>
                  <td className="text-right py-2 px-2">0.00 €</td>
                  <td className="text-right py-2 px-2 bg-green-50">{calculated.assuranceMaladie.toFixed(2)} €</td>
                </tr>

                <tr className="border-b">
                  <td className="py-2 px-2">A-M Majoration espèce</td>
                  <td className="text-right py-2 px-2">{(RATES.majoration * 100).toFixed(2)}%</td>
                  <td className="text-right py-2 px-2">-</td>
                  <td className="text-right py-2 px-2 bg-blue-50 font-medium">{calculated.majorationEspece.toFixed(2)} €</td>
                  <td className="text-right py-2 px-2">0.00 €</td>
                  <td className="text-right py-2 px-2 bg-green-50">{calculated.majorationEspece.toFixed(2)} €</td>
                </tr>

                <tr className="border-b">
                  <td className="py-2 px-2">Assurance Pension</td>
                  <td className="text-right py-2 px-2">{(RATES.assurancePension * 100).toFixed(2)}%</td>
                  <td className="text-right py-2 px-2">-</td>
                  <td className="text-right py-2 px-2 bg-blue-50 font-medium">{calculated.assurancePension.toFixed(2)} €</td>
                  <td className="text-right py-2 px-2">0.00 €</td>
                  <td className="text-right py-2 px-2 bg-green-50">{calculated.assurancePension.toFixed(2)} €</td>
                </tr>

                <tr className="border-b">
                  <td className="py-2 px-2">Assurance dépendance</td>
                  <td className="text-right py-2 px-2">{(RATES.assuranceDependance * 100).toFixed(2)}%</td>
                  <td className="text-right py-2 px-2">-</td>
                  <td className="text-right py-2 px-2 bg-blue-50 font-medium">{calculated.assuranceDependance.toFixed(2)} €</td>
                  <td className="text-right py-2 px-2">0.00 €</td>
                  <td className="text-right py-2 px-2 bg-green-50">{calculated.assuranceDependance.toFixed(2)} €</td>
                </tr>

                <tr className="border-b-2 border-gray-400 bg-orange-100 font-bold">
                  <td className="py-2 px-2">Total Cotisation</td>
                  <td className="text-right py-2 px-2">-</td>
                  <td className="text-right py-2 px-2">-</td>
                  <td className="text-right py-2 px-2 bg-orange-200">{calculated.totalCotisation.toFixed(2)} €</td>
                  <td className="text-right py-2 px-2">0.00 €</td>
                  <td className="text-right py-2 px-2 bg-orange-200">{calculated.totalCotisation.toFixed(2)} €</td>
                </tr>

                <tr><td colSpan={6} className="py-1"></td></tr>

                {/* Deductions */}
                <tr className="bg-gray-100 font-semibold">
                  <td className="py-2 px-2" colSpan={6}>Deduction</td>
                </tr>

                {['fd', 'ac', 'ffo', 'fds'].map((field) => (
                  <tr key={field} className="border-b">
                    <td className="py-2 px-2">{field.toUpperCase()}</td>
                    <td className="text-right py-2 px-2">-</td>
                    <td className="text-right py-2 px-2">-</td>
                    <td className="text-right py-2 px-2 bg-blue-50">
                      <Input
                        type="number"
                        step="0.01"
                        value={payslipData[field as keyof PayslipData] as number}
                        onChange={(e) => handleInputChange(field as keyof PayslipData, parseFloat(e.target.value) || 0)}
                        className="h-7 w-24 text-right"
                      />
                    </td>
                    <td className="text-right py-2 px-2">0.00 €</td>
                    <td className="text-right py-2 px-2 bg-green-50">{(payslipData[field as keyof PayslipData] as number).toFixed(2)} €</td>
                  </tr>
                ))}

                <tr><td colSpan={6} className="py-1"></td></tr>

                {/* Total Imposable */}
                <tr className="border-b-2 border-gray-400 bg-purple-100 font-bold">
                  <td className="py-2 px-2">Total Imposable</td>
                  <td className="text-right py-2 px-2">-</td>
                  <td className="text-right py-2 px-2">-</td>
                  <td className="text-right py-2 px-2 bg-purple-200">{calculated.totalImposable.toFixed(2)} €</td>
                  <td className="text-right py-2 px-2">0.00 €</td>
                  <td className="text-right py-2 px-2 bg-purple-200">{calculated.totalImposable.toFixed(2)} €</td>
                </tr>

                <tr><td colSpan={6} className="py-1"></td></tr>

                {/* Impôts and Credits */}
                <tr className="border-b">
                  <td className="py-2 px-2 font-semibold">IMPÔT</td>
                  <td className="text-right py-2 px-2">-</td>
                  <td className="text-right py-2 px-2">-</td>
                  <td className="text-right py-2 px-2 bg-blue-50">
                    <Input
                      type="number"
                      step="0.01"
                      value={payslipData.impot}
                      onChange={(e) => handleInputChange('impot', parseFloat(e.target.value) || 0)}
                      className="h-7 w-24 text-right"
                    />
                  </td>
                  <td className="text-right py-2 px-2">0.00 €</td>
                  <td className="text-right py-2 px-2 bg-green-50">{payslipData.impot.toFixed(2)} €</td>
                </tr>

                <tr className="border-b">
                  <td className="py-2 px-2">CISSM</td>
                  <td className="text-right py-2 px-2">-</td>
                  <td className="text-right py-2 px-2">-</td>
                  <td className="text-right py-2 px-2 bg-blue-50 font-medium">{calculated.cissm.toFixed(2)} €</td>
                  <td className="text-right py-2 px-2">0.00 €</td>
                  <td className="text-right py-2 px-2 bg-green-50">{calculated.cissm.toFixed(2)} €</td>
                </tr>

                <tr className="border-b">
                  <td className="py-2 px-2">CIS-CIP-CIM</td>
                  <td className="text-right py-2 px-2">-</td>
                  <td className="text-right py-2 px-2">-</td>
                  <td className="text-right py-2 px-2 bg-blue-50 font-medium">{calculated.cisCipCim.toFixed(2)} €</td>
                  <td className="text-right py-2 px-2">0.00 €</td>
                  <td className="text-right py-2 px-2 bg-green-50">{calculated.cisCipCim.toFixed(2)} €</td>
                </tr>

                <tr className="border-b">
                  <td className="py-2 px-2">CI-CO2</td>
                  <td className="text-right py-2 px-2">-</td>
                  <td className="text-right py-2 px-2">-</td>
                  <td className="text-right py-2 px-2 bg-blue-50 font-medium">{calculated.ciCo2.toFixed(2)} €</td>
                  <td className="text-right py-2 px-2">0.00 €</td>
                  <td className="text-right py-2 px-2 bg-green-50">{calculated.ciCo2.toFixed(2)} €</td>
                </tr>

                <tr><td colSpan={6} className="py-1"></td></tr>

                {/* NET */}
                <tr className="border-b-2 border-gray-400 bg-green-200 font-bold text-lg">
                  <td className="py-3 px-2">NET</td>
                  <td className="text-right py-3 px-2">-</td>
                  <td className="text-right py-3 px-2">-</td>
                  <td className="text-right py-3 px-2 bg-green-300">{calculated.net.toFixed(2)} €</td>
                  <td className="text-right py-3 px-2">0.00 €</td>
                  <td className="text-right py-3 px-2 bg-green-300">{calculated.net.toFixed(2)} €</td>
                </tr>

                {/* Deductions from NET */}
                <tr className="border-b">
                  <td className="py-2 px-2">Chèque repas</td>
                  <td className="text-right py-2 px-2">-</td>
                  <td className="text-right py-2 px-2">-</td>
                  <td className="text-right py-2 px-2 bg-blue-50">
                    <Input
                      type="number"
                      step="0.01"
                      value={payslipData.chequeRepas}
                      onChange={(e) => handleInputChange('chequeRepas', parseFloat(e.target.value) || 0)}
                      className="h-7 w-24 text-right"
                    />
                  </td>
                  <td className="text-right py-2 px-2">-</td>
                  <td className="text-right py-2 px-2 bg-green-50">-</td>
                </tr>

                <tr className="border-b">
                  <td className="py-2 px-2">Avance sur salaire</td>
                  <td className="text-right py-2 px-2">-</td>
                  <td className="text-right py-2 px-2">-</td>
                  <td className="text-right py-2 px-2 bg-blue-50">
                    <Input
                      type="number"
                      step="0.01"
                      value={payslipData.avanceSalaire}
                      onChange={(e) => handleInputChange('avanceSalaire', parseFloat(e.target.value) || 0)}
                      className="h-7 w-24 text-right"
                    />
                  </td>
                  <td className="text-right py-2 px-2 font-bold">NET A PAYER</td>
                  <td className="text-right py-2 px-2 bg-green-300 font-bold text-lg">{calculated.netAPayer.toFixed(2)} €</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Additional Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Congés (H)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Label className="text-sm">Légaux:</Label>
              <Input
                type="number"
                value={payslipData.legalLeave}
                onChange={(e) => handleInputChange('legalLeave', parseFloat(e.target.value) || 0)}
                className="h-8"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Label className="text-sm">Report:</Label>
              <Input
                type="number"
                value={payslipData.leaveReport}
                onChange={(e) => handleInputChange('leaveReport', parseFloat(e.target.value) || 0)}
                className="h-8"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Label className="text-sm">Pris:</Label>
              <Input
                type="number"
                value={payslipData.leaveTaken}
                onChange={(e) => handleInputChange('leaveTaken', parseFloat(e.target.value) || 0)}
                className="h-8"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t">
              <Label className="text-sm font-bold">Solde:</Label>
              <div className="text-right font-bold">{calculated.leaveSolde}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Rémunération & Fiche d'impôts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between py-1">
              <span className="text-sm text-muted-foreground">Salaire mensuel:</span>
              <span className="text-sm font-medium">{calculated.totalBrut.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-sm text-muted-foreground">Heures:</span>
              <span className="text-sm font-medium">{payslipData.hoursWorked}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-sm text-muted-foreground">Salaire horaire:</span>
              <span className="text-sm font-medium">{payslipData.hourlyRate.toFixed(6)} €</span>
            </div>
            <div className="border-t mt-3 pt-3">
              <div className="flex justify-between py-1">
                <span className="text-sm text-muted-foreground">N° de carte:</span>
                <span className="text-sm font-medium">D608388-2022</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-sm text-muted-foreground">Classe:</span>
                <span className="text-sm font-medium">1</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-sm text-muted-foreground">Taux:</span>
                <span className="text-sm font-medium">-</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer note */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="pt-6">
          <p className="text-center text-sm font-semibold text-yellow-800">
            CONSERVEZ CE BULLETIN DE PAIE SANS LIMITATION DE DURÉE
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
