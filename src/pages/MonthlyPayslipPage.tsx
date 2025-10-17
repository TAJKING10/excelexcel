import { useState } from 'react';
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
    const appointement = hoursWorked * hourlyRate;
    const joursFeries = publicHolidayHours * hourlyRate;
    const totalBrut = appointement + joursFeries;

    const assuranceMaladie = totalBrut * RATES.assuranceMaladie;
    const majorationEspece = totalBrut * RATES.majoration;
    const assurancePension = totalBrut * RATES.assurancePension;
    const assuranceDependance = Math.max(0, (totalBrut - RATES.dependanceThreshold) * RATES.assuranceDependance);
    const totalCotisation = assuranceMaladie + majorationEspece + assurancePension + assuranceDependance;

    const totalImposable = totalBrut - assuranceMaladie - majorationEspece - assurancePension -
                          payslipData.fd - payslipData.ac - payslipData.ffo - payslipData.fds;

    const cissm = totalBrut < 1800 ? 0 : totalBrut <= 3000 ? 81 : totalBrut >= 3600 ? 0 : 81 / 600 * (3600 - totalBrut);
    const cisCipCim = totalBrut < 78 ? 0 : totalBrut < 936 ? ((300 + (totalBrut * 12 - 936) * 0.029) / 12) : totalBrut < 3333.33 ? 50 : totalBrut > 6666.5 ? 0 : ((600 - (totalBrut * 12 - 40000) * 0.015) / 12);
    const ciCo2 = totalBrut < 78 ? 0 : totalBrut < 3333.33 ? 16 : totalBrut < 6667 ? (16 - (totalBrut - 3333.33) * 0.0042) : 0;

    const net = totalBrut - totalCotisation - payslipData.impot + cissm + cisCipCim + ciCo2;
    const netAPayer = net - payslipData.chequeRepas - payslipData.avanceSalaire;
    const leaveSolde = (payslipData.legalLeave + payslipData.leaveReport) - payslipData.leaveTaken;

    return {
      appointement, joursFeries, totalBrut,
      assuranceMaladie, majorationEspece, assurancePension, assuranceDependance, totalCotisation,
      totalImposable, cissm, cisCipCim, ciCo2, net, netAPayer, leaveSolde
    };
  };

  const calculated = calculatePayslip();

  const handleInputChange = (field: keyof PayslipData, value: any) => {
    setPayslipData(prev => ({ ...prev, [field]: value }));
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
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />Retour
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Calendar className="h-6 w-6 md:h-8 md:w-8" />
              DÉCOMPTE SALAIRE
            </h1>
            <p className="text-sm text-muted-foreground">{person.firstName} {person.lastName}</p>
          </div>
        </div>

        <div className="flex gap-2 items-center flex-wrap">
          <div className="flex items-center gap-2 bg-muted/50 p-2 rounded-lg border">
            <Calculator className="h-4 w-4" />
            <Label htmlFor="auto-calc" className="text-xs cursor-pointer">Auto</Label>
            <Switch id="auto-calc" checked={autoCalculate} onCheckedChange={setAutoCalculate} />
          </div>
          <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>{MONTHS.map((month) => (
              <SelectItem key={month.value} value={month.value.toString()}>{month.label}</SelectItem>
            ))}</SelectContent>
          </Select>
          <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
            <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
            <SelectContent>{years.map((year) => (
              <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
            ))}</SelectContent>
          </Select>
          <Button onClick={handleExportPDF} size="sm">
            <Download className="mr-2 h-4 w-4" />PDF
          </Button>
        </div>
      </div>

      <div className="text-xs md:text-sm text-muted-foreground bg-muted/30 p-2 rounded">
        Période: {MONTHS.find(m => m.value === selectedMonth)?.label} {selectedYear} • Montants en Euros
      </div>

      {/* Employee and Company Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base md:text-lg">Informations Employé</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {[
              ['N° Salarié', 'employeeNumber', 'text'],
              ['Indice', 'indice', 'text'],
              ['Emploi', 'emploi', 'text'],
              ['Date d\'entrée', 'dateEntree', 'date'],
              ['Matricule assuré', 'matriculeAssure', 'text'],
              ['Matricule employeur', 'matriculeEmployeur', 'text'],
            ].map(([label, field, type]) => (
              <div key={field} className="grid grid-cols-2 gap-2 items-center">
                <Label className="text-xs">{label}:</Label>
                <Input type={type as string} value={payslipData[field as keyof PayslipData] as string}
                  onChange={(e) => handleInputChange(field as keyof PayslipData, e.target.value)}
                  className="h-7 text-xs" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base md:text-lg">Informations Entreprise</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            {[
              ['Entreprise', company?.name || 'Groupe Advensys Luxembourg S.A'],
              ['Adresse', company?.address || 'Duarrefstrooss 49'],
              ['Code Postal', company?.postalCode || 'L-9964'],
              ['Ville', company?.city || 'Huldange'],
              ['Pays', company?.country || 'Luxembourg'],
              ['Nom complet', `${person.firstName} ${person.lastName}`],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between py-1">
                <span className="text-xs text-muted-foreground">{label}:</span>
                <span className="text-xs font-medium">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Main Payslip Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base md:text-lg">
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
                    <Input type="number" value={payslipData.hoursWorked}
                      onChange={(e) => handleInputChange('hoursWorked', parseFloat(e.target.value) || 0)}
                      className="h-6 w-16 text-right text-xs" />
                  </td>
                  <td className="text-right py-2 px-2">
                    <Input type="number" step="0.01" value={payslipData.hourlyRate.toFixed(2)}
                      onChange={(e) => handleInputChange('hourlyRate', parseFloat(e.target.value) || 0)}
                      className="h-6 w-20 text-right text-xs" />
                  </td>
                  <td className="text-right py-2 px-2 bg-blue-500/15 dark:bg-blue-500/25 font-medium text-foreground">
                    {calculated.appointement.toFixed(2)} €
                  </td>
                  <td className="text-right py-2 px-2 text-muted-foreground">-</td>
                  <td className="text-right py-2 px-2 bg-green-500/10 dark:bg-green-500/20 text-muted-foreground">-</td>
                </tr>

                {/* Jours fériés */}
                <tr className="border-b border-border hover:bg-muted/30">
                  <td className="py-2 px-2">Jours fériés</td>
                  <td className="text-right py-2 px-2">
                    <Input type="number" value={payslipData.publicHolidayHours}
                      onChange={(e) => handleInputChange('publicHolidayHours', parseFloat(e.target.value) || 0)}
                      className="h-6 w-16 text-right text-xs" />
                  </td>
                  <td className="text-right py-2 px-2 text-muted-foreground">0</td>
                  <td className="text-right py-2 px-2 bg-blue-500/15 dark:bg-blue-500/25 font-medium text-foreground">
                    {calculated.joursFeries.toFixed(2)} €
                  </td>
                  <td className="text-right py-2 px-2 text-muted-foreground">-</td>
                  <td className="text-right py-2 px-2 bg-green-500/10 dark:bg-green-500/20 text-muted-foreground">-</td>
                </tr>

                {/* Congés & Absences */}
                <tr className="border-b border-border hover:bg-muted/30">
                  <td className="py-2 px-2">Congés (H)</td>
                  <td className="text-right py-2 px-2">
                    <Input type="number" value={payslipData.holidayHours}
                      onChange={(e) => handleInputChange('holidayHours', parseFloat(e.target.value) || 0)}
                      className="h-6 w-16 text-right text-xs" />
                  </td>
                  <td className="text-right py-2 px-2 text-muted-foreground">0</td>
                  <td className="text-right py-2 px-2 bg-blue-500/15 dark:bg-blue-500/25 text-foreground">0.00 €</td>
                  <td className="text-right py-2 px-2 text-muted-foreground">-</td>
                  <td className="text-right py-2 px-2 bg-green-500/15 dark:bg-green-500/25 text-muted-foreground">-</td>
                </tr>

                <tr className="border-b border-border hover:bg-muted/30">
                  <td className="py-2 px-2">Absences Maladie (H)</td>
                  <td className="text-right py-2 px-2">
                    <Input type="number" value={payslipData.sickLeaveHours}
                      onChange={(e) => handleInputChange('sickLeaveHours', parseFloat(e.target.value) || 0)}
                      className="h-6 w-16 text-right text-xs" />
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
                  <td className="text-right py-2 px-2 bg-blue-500/35 dark:bg-blue-500/45 text-foreground">{calculated.totalBrut.toFixed(2)} €</td>
                  <td className="text-right py-2 px-2 text-foreground">0.00 €</td>
                  <td className="text-right py-2 px-2 bg-green-500/35 dark:bg-green-500/45 text-foreground">{calculated.totalBrut.toFixed(2)} €</td>
                </tr>

                <tr><td colSpan={6} className="py-1"></td></tr>

                {/* Cotisations */}
                <tr className="bg-muted/70 font-semibold"><td className="py-2 px-2 text-foreground" colSpan={6}>Cotisation</td></tr>

                {[
                  ['Assurance Maladie', RATES.assuranceMaladie, calculated.assuranceMaladie],
                  ['A-M Majoration espèce', RATES.majoration, calculated.majorationEspece],
                  ['Assurance Pension', RATES.assurancePension, calculated.assurancePension],
                  ['Assurance dépendance', RATES.assuranceDependance, calculated.assuranceDependance],
                ].map(([label, rate, value]) => (
                  <tr key={label as string} className="border-b border-border hover:bg-muted/30">
                    <td className="py-2 px-2">{label}</td>
                    <td className="text-right py-2 px-2 text-muted-foreground">{((rate as number) * 100).toFixed(2)}%</td>
                    <td className="text-right py-2 px-2 text-muted-foreground">-</td>
                    <td className="text-right py-2 px-2 bg-blue-500/15 dark:bg-blue-500/25 font-medium text-foreground">
                      {(value as number).toFixed(2)} €
                    </td>
                    <td className="text-right py-2 px-2 text-foreground">0.00 €</td>
                    <td className="text-right py-2 px-2 bg-green-500/15 dark:bg-green-500/25 text-foreground">{(value as number).toFixed(2)} €</td>
                  </tr>
                ))}

                <tr className="border-b-2 border-border bg-orange-500/20 dark:bg-orange-500/30 font-bold">
                  <td className="py-2 px-2 text-foreground">Total Cotisation</td>
                  <td className="text-right py-2 px-2 text-foreground">-</td>
                  <td className="text-right py-2 px-2 text-foreground">-</td>
                  <td className="text-right py-2 px-2 bg-orange-500/35 dark:bg-orange-500/45 text-foreground">{calculated.totalCotisation.toFixed(2)} €</td>
                  <td className="text-right py-2 px-2 text-foreground">0.00 €</td>
                  <td className="text-right py-2 px-2 bg-orange-500/35 dark:bg-orange-500/45 text-foreground">{calculated.totalCotisation.toFixed(2)} €</td>
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
                      <Input type="number" step="0.01" value={payslipData[field as keyof PayslipData] as number}
                        onChange={(e) => handleInputChange(field as keyof PayslipData, parseFloat(e.target.value) || 0)}
                        className="h-6 w-20 text-right text-xs" />
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
                  <td className="text-right py-2 px-2 bg-purple-500/35 dark:bg-purple-500/45 text-foreground">{calculated.totalImposable.toFixed(2)} €</td>
                  <td className="text-right py-2 px-2 text-foreground">0.00 €</td>
                  <td className="text-right py-2 px-2 bg-purple-500/35 dark:bg-purple-500/45 text-foreground">{calculated.totalImposable.toFixed(2)} €</td>
                </tr>

                <tr><td colSpan={6} className="py-1"></td></tr>

                {/* Impôts and Credits */}
                <tr className="border-b border-border hover:bg-muted/30">
                  <td className="py-2 px-2 font-semibold">IMPÔT</td>
                  <td className="text-right py-2 px-2 text-muted-foreground">-</td>
                  <td className="text-right py-2 px-2 text-muted-foreground">-</td>
                  <td className="text-right py-2 px-2 bg-blue-500/15 dark:bg-blue-500/25">
                    <Input type="number" step="0.01" value={payslipData.impot}
                      onChange={(e) => handleInputChange('impot', parseFloat(e.target.value) || 0)}
                      className="h-6 w-20 text-right text-xs" />
                  </td>
                  <td className="text-right py-2 px-2 text-foreground">0.00 €</td>
                  <td className="text-right py-2 px-2 bg-green-500/15 dark:bg-green-500/25 text-foreground">{payslipData.impot.toFixed(2)} €</td>
                </tr>

                {[
                  ['CISSM', calculated.cissm],
                  ['CIS-CIP-CIM', calculated.cisCipCim],
                  ['CI-CO2', calculated.ciCo2],
                ].map(([label, value]) => (
                  <tr key={label} className="border-b border-border hover:bg-muted/30">
                    <td className="py-2 px-2">{label}</td>
                    <td className="text-right py-2 px-2 text-muted-foreground">-</td>
                    <td className="text-right py-2 px-2 text-muted-foreground">-</td>
                    <td className="text-right py-2 px-2 bg-blue-500/15 dark:bg-blue-500/25 font-medium text-foreground">{(value as number).toFixed(2)} €</td>
                    <td className="text-right py-2 px-2 text-foreground">0.00 €</td>
                    <td className="text-right py-2 px-2 bg-green-500/15 dark:bg-green-500/25 text-foreground">{(value as number).toFixed(2)} €</td>
                  </tr>
                ))}

                <tr><td colSpan={6} className="py-1"></td></tr>

                {/* NET */}
                <tr className="border-b-2 border-border bg-green-500/20 dark:bg-green-500/30 font-bold">
                  <td className="py-3 px-2 text-base text-foreground">NET</td>
                  <td className="text-right py-3 px-2 text-foreground">-</td>
                  <td className="text-right py-3 px-2 text-foreground">-</td>
                  <td className="text-right py-3 px-2 bg-green-500/35 dark:bg-green-500/45 text-base text-foreground">{calculated.net.toFixed(2)} €</td>
                  <td className="text-right py-3 px-2 text-foreground">0.00 €</td>
                  <td className="text-right py-3 px-2 bg-green-500/40 dark:bg-green-500/50 text-base text-foreground">{calculated.net.toFixed(2)} €</td>
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
                      <Input type="number" step="0.01" value={payslipData[field as keyof PayslipData] as number}
                        onChange={(e) => handleInputChange(field as keyof PayslipData, parseFloat(e.target.value) || 0)}
                        className="h-6 w-20 text-right text-xs" />
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
                    {calculated.netAPayer.toFixed(2)} €
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Additional Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Congés (H)</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {[
              ['Légaux', 'legalLeave'],
              ['Report', 'leaveReport'],
              ['Pris', 'leaveTaken'],
            ].map(([label, field]) => (
              <div key={field} className="grid grid-cols-2 gap-2">
                <Label className="text-xs">{label}:</Label>
                <Input type="number" value={payslipData[field as keyof PayslipData] as number}
                  onChange={(e) => handleInputChange(field as keyof PayslipData, parseFloat(e.target.value) || 0)}
                  className="h-7 text-xs" />
              </div>
            ))}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
              <Label className="text-xs font-bold">Solde:</Label>
              <div className="text-right font-bold text-sm">{calculated.leaveSolde}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Rémunération & Fiche d'impôts</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            {[
              ['Salaire mensuel', `${calculated.totalBrut.toFixed(2)} €`],
              ['Heures', payslipData.hoursWorked.toString()],
              ['Salaire horaire', `${payslipData.hourlyRate.toFixed(4)} €`],
              ['N° de carte', 'D608388-2022'],
              ['Classe', '1'],
              ['Taux', '-'],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between py-1">
                <span className="text-xs text-muted-foreground">{label}:</span>
                <span className="text-xs font-medium">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Footer note */}
      <Card className="bg-yellow-500/10 dark:bg-yellow-500/20 border-yellow-500/30">
        <CardContent className="py-4">
          <p className="text-center text-xs md:text-sm font-semibold text-yellow-800 dark:text-yellow-200">
            CONSERVEZ CE BULLETIN DE PAIE SANS LIMITATION DE DURÉE
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
