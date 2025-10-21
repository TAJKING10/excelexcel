import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
import { monthlyPayslipService } from '@/services/supabase';

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
  // M-1 (previous month) values
  m1Appointement?: number;
  m1JoursFeries?: number;
  m1TotalBrut?: number;
  m1AssuranceMaladie?: number;
  m1Majoration?: number;
  m1AssurancePension?: number;
  m1AssuranceDependance?: number;
  m1TotalCotisation?: number;
  m1FD?: number;
  m1AC?: number;
  m1FFO?: number;
  m1FDS?: number;
  m1TotalImposable?: number;
  m1Impot?: number;
  m1Cissm?: number;
  m1CisCipCim?: number;
  m1CiCo2?: number;
  m1Net?: number;
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
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [payslipId, setPayslipId] = useState<string | undefined>(undefined);

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

  // Track which field was last changed for smart recalculation
  const [lastChangedField, setLastChangedField] = useState<string | null>(null);

  // Load payslip data from Supabase when period changes
  useEffect(() => {
    const loadPayslipData = async () => {
      if (!personId) return;

      setIsLoading(true);
      setIsEditMode(false); // Exit edit mode when loading new data
      try {
        const isEmployee = !!employeeId;
        console.log('📂 Loading payslip data from Supabase:', {
          personId,
          isEmployee,
          period: `${selectedYear}-${selectedMonth}`,
          employee: employee ? `${employee.firstName} ${employee.lastName}` : 'N/A',
          individual: individual ? `${individual.firstName} ${individual.lastName}` : 'N/A'
        });

        const savedPayslip = await monthlyPayslipService.getByPeriod(
          personId,
          selectedYear,
          selectedMonth,
          isEmployee
        );

        console.log('📥 Database query result:', savedPayslip ? 'FOUND' : 'NOT FOUND');

        if (savedPayslip) {
          console.log('✅ Payslip data loaded from database:', {
            id: savedPayslip.id,
            hoursWorked: savedPayslip.hoursWorked,
            hourlyRate: savedPayslip.hourlyRate,
            totalBrut: savedPayslip.manualTotalBrut,
            net: savedPayslip.manualNet
          });

          // Load all the saved data
          setPayslipId(savedPayslip.id);
          setPayslipData({
            employeeNumber: savedPayslip.employeeNumber || '2',
            indice: savedPayslip.indice || '21',
            emploi: savedPayslip.emploi || person?.class || 'Comptable',
            dateEntree: savedPayslip.dateEntree || person?.hireDate || '',
            matriculeAssure: savedPayslip.matriculeAssure || person?.matricule || '',
            matriculeEmployeur: savedPayslip.matriculeEmployeur || '20152206748',
            hoursWorked: savedPayslip.hoursWorked || 173,
            hourlyRate: savedPayslip.hourlyRate || (person?.baseSalary ? person.baseSalary / 173 : 18.2968),
            holidayHours: savedPayslip.holidayHours || 0,
            sickLeaveHours: savedPayslip.sickLeaveHours || 0,
            publicHolidayHours: savedPayslip.publicHolidayHours || 0,
            fd: savedPayslip.fd || 0,
            ac: savedPayslip.ac || 0,
            ffo: savedPayslip.ffo || 0,
            fds: savedPayslip.fds || 0,
            impot: savedPayslip.impot || 225.3,
            chequeRepas: savedPayslip.chequeRepas || 56,
            avanceSalaire: savedPayslip.avanceSalaire || 0,
            legalLeave: savedPayslip.legalLeave || 208,
            leaveReport: savedPayslip.leaveReport || -4,
            leaveTaken: savedPayslip.leaveTaken || 0,
            manualAppointement: savedPayslip.manualAppointement,
            manualJoursFeries: savedPayslip.manualJoursFeries,
            manualTotalBrut: savedPayslip.manualTotalBrut,
            manualAssuranceMaladie: savedPayslip.manualAssuranceMaladie,
            manualMajoration: savedPayslip.manualMajoration,
            manualAssurancePension: savedPayslip.manualAssurancePension,
            manualAssuranceDependance: savedPayslip.manualAssuranceDependance,
            manualTotalCotisation: savedPayslip.manualTotalCotisation,
            manualTotalImposable: savedPayslip.manualTotalImposable,
            manualCissm: savedPayslip.manualCissm,
            manualCisCipCim: savedPayslip.manualCisCipCim,
            manualCiCo2: savedPayslip.manualCiCo2,
            manualNet: savedPayslip.manualNet,
            manualNetAPayer: savedPayslip.manualNetAPayer,
            m1Appointement: savedPayslip.m1Appointement,
            m1JoursFeries: savedPayslip.m1JoursFeries,
            m1TotalBrut: savedPayslip.m1TotalBrut,
            m1AssuranceMaladie: savedPayslip.m1AssuranceMaladie,
            m1Majoration: savedPayslip.m1Majoration,
            m1AssurancePension: savedPayslip.m1AssurancePension,
            m1AssuranceDependance: savedPayslip.m1AssuranceDependance,
            m1TotalCotisation: savedPayslip.m1TotalCotisation,
            m1FD: savedPayslip.m1Fd,
            m1AC: savedPayslip.m1Ac,
            m1FFO: savedPayslip.m1Ffo,
            m1FDS: savedPayslip.m1Fds,
            m1TotalImposable: savedPayslip.m1TotalImposable,
            m1Impot: savedPayslip.m1Impot,
            m1Cissm: savedPayslip.m1Cissm,
            m1CisCipCim: savedPayslip.m1CisCipCim,
            m1CiCo2: savedPayslip.m1CiCo2,
            m1Net: savedPayslip.m1Net,
          });
          setHasUnsavedChanges(false);
        } else {
          console.log('ℹ️ No saved payslip found, using defaults');
          // No saved data, reset to defaults
          setPayslipId(undefined);
          setPayslipData({
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
          setHasUnsavedChanges(false);
        }
      } catch (error) {
        console.error('❌ Error loading payslip data:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));

        toast({
          title: "Erreur de chargement",
          description: error instanceof Error ? error.message : "Impossible de charger les données de la fiche de paie.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadPayslipData();
  }, [personId, selectedYear, selectedMonth, employeeId]); // Don't include person or toast to avoid infinite loops

  // Smart bidirectional auto-recalculation
  useEffect(() => {
    if (!autoCalculate || !isEditMode) return; // Only auto-calculate in edit mode with auto-calculate ON

    // REVERSE CALCULATION: If user changed Total Cotisation, recalculate Total Brut
    if (lastChangedField === 'manualTotalCotisation' && payslipData.manualTotalCotisation !== undefined) {
      const targetTotalCotisation = payslipData.manualTotalCotisation;

      // Total Cotisation = assuranceMaladie + majorationEspece + assurancePension + assuranceDependance
      // = totalBrut * (RATES.assuranceMaladie + RATES.majoration + RATES.assurancePension) + assuranceDependance
      // Since assuranceDependance depends on totalBrut, we need to iterate

      let totalBrut = targetTotalCotisation / (RATES.assuranceMaladie + RATES.majoration + RATES.assurancePension); // Initial guess

      for (let i = 0; i < 10; i++) {
        const assuranceDependance = Math.max(0, (totalBrut - RATES.dependanceThreshold) * RATES.assuranceDependance);
        const fixedCotisations = totalBrut * (RATES.assuranceMaladie + RATES.majoration + RATES.assurancePension);
        const calculatedTotal = fixedCotisations + assuranceDependance;
        const diff = targetTotalCotisation - calculatedTotal;

        if (Math.abs(diff) < 0.01) break;
        totalBrut += diff / (RATES.assuranceMaladie + RATES.majoration + RATES.assurancePension + RATES.assuranceDependance);
      }

      setPayslipData(prev => ({
        ...prev,
        manualTotalBrut: totalBrut,
      }));
      setLastChangedField('manualTotalBrut'); // Chain to recalculate inputs
      return;
    }

    // REVERSE CALCULATION: If user changed a calculated field (like Total Brut), recalculate inputs
    if (lastChangedField === 'manualTotalBrut' && payslipData.manualTotalBrut !== undefined) {
      const newTotalBrut = payslipData.manualTotalBrut;
      const hoursWorked = payslipData.hoursWorked || 0;
      const publicHolidayHours = payslipData.publicHolidayHours || 0;
      const holidayHours = payslipData.holidayHours || 0;
      const sickLeaveHours = payslipData.sickLeaveHours || 0;

      const totalHours = hoursWorked + publicHolidayHours + holidayHours + sickLeaveHours;

      if (totalHours > 0) {
        const newHourlyRate = newTotalBrut / totalHours;
        setPayslipData(prev => ({
          ...prev,
          hourlyRate: newHourlyRate,
        }));
      }
      setLastChangedField(null); // Clear after processing
      return;
    }

    // REVERSE CALCULATION: If user changed NET À PAYER, work backward
    if (lastChangedField === 'manualNetAPayer' && payslipData.manualNetAPayer !== undefined) {
      const targetNetAPayer = payslipData.manualNetAPayer;
      const chequeRepas = payslipData.chequeRepas || 0;
      const avanceSalaire = payslipData.avanceSalaire || 0;

      // Work backward: NET = NET À PAYER + chequeRepas + avanceSalaire
      const newNet = targetNetAPayer + chequeRepas + avanceSalaire;

      setPayslipData(prev => ({
        ...prev,
        manualNet: newNet,
      }));
      setLastChangedField('manualNet'); // Chain to next calculation
      return;
    }

    // REVERSE CALCULATION: If user changed NET, work backward to Total Brut
    if (lastChangedField === 'manualNet' && payslipData.manualNet !== undefined) {
      const targetNet = payslipData.manualNet;
      const impot = payslipData.impot || 0;

      // Estimate totalBrut through iteration (since credits depend on totalBrut)
      let totalBrut = targetNet; // Initial guess
      for (let i = 0; i < 10; i++) {
        const cissm = totalBrut < 1800 ? 0 : totalBrut <= 3000 ? 81 : totalBrut >= 3600 ? 0 : 81 / 600 * (3600 - totalBrut);
        const cisCipCim = totalBrut < 78 ? 0 : totalBrut < 936 ? ((300 + (totalBrut * 12 - 936) * 0.029) / 12) : totalBrut < 3333.33 ? 50 : totalBrut > 6666.5 ? 0 : ((600 - (totalBrut * 12 - 40000) * 0.015) / 12);
        const ciCo2 = totalBrut < 78 ? 0 : totalBrut < 3333.33 ? 16 : totalBrut < 6667 ? (16 - (totalBrut - 3333.33) * 0.0042) : 0;

        const assuranceMaladie = totalBrut * RATES.assuranceMaladie;
        const majorationEspece = totalBrut * RATES.majoration;
        const assurancePension = totalBrut * RATES.assurancePension;
        const assuranceDependance = Math.max(0, (totalBrut - RATES.dependanceThreshold) * RATES.assuranceDependance);
        const totalCotisation = assuranceMaladie + majorationEspece + assurancePension + assuranceDependance;

        const calculatedNet = totalBrut - totalCotisation - impot + cissm + cisCipCim + ciCo2;
        const diff = targetNet - calculatedNet;

        if (Math.abs(diff) < 0.01) break; // Close enough
        totalBrut += diff; // Adjust
      }

      setPayslipData(prev => ({
        ...prev,
        manualTotalBrut: totalBrut,
      }));
      setLastChangedField('manualTotalBrut'); // Chain to recalculate inputs
      return;
    }

    // FORWARD CALCULATION: Standard calculation from inputs to outputs
    const hoursWorked = payslipData.hoursWorked || 0;
    const hourlyRate = payslipData.hourlyRate || 0;
    const publicHolidayHours = payslipData.publicHolidayHours || 0;
    const holidayHours = payslipData.holidayHours || 0;
    const sickLeaveHours = payslipData.sickLeaveHours || 0;

    // STEP 1: Calculate base amounts
    const appointement = hoursWorked * hourlyRate;
    const joursFeries = publicHolidayHours * hourlyRate;
    const conges = holidayHours * hourlyRate;
    const maladie = sickLeaveHours * hourlyRate;

    // STEP 2: Calculate Total Brut
    const totalBrut = appointement + joursFeries + conges + maladie;

    // STEP 3: Calculate Cotisations (Social contributions)
    const assuranceMaladie = totalBrut * RATES.assuranceMaladie;
    const majorationEspece = totalBrut * RATES.majoration;
    const assurancePension = totalBrut * RATES.assurancePension;
    const assuranceDependance = Math.max(0, (totalBrut - RATES.dependanceThreshold) * RATES.assuranceDependance);

    // STEP 4: Total Cotisation
    const totalCotisation = assuranceMaladie + majorationEspece + assurancePension + assuranceDependance;

    // STEP 5: Calculate Total Imposable (subtract cotisations and deductions)
    const totalImposable = totalBrut - assuranceMaladie - majorationEspece - assurancePension -
      (payslipData.fd || 0) - (payslipData.ac || 0) - (payslipData.ffo || 0) - (payslipData.fds || 0);

    // STEP 6: Calculate Tax Credits
    const cissm = totalBrut < 1800 ? 0 : totalBrut <= 3000 ? 81 : totalBrut >= 3600 ? 0 : 81 / 600 * (3600 - totalBrut);
    const cisCipCim = totalBrut < 78 ? 0 : totalBrut < 936 ? ((300 + (totalBrut * 12 - 936) * 0.029) / 12) : totalBrut < 3333.33 ? 50 : totalBrut > 6666.5 ? 0 : ((600 - (totalBrut * 12 - 40000) * 0.015) / 12);
    const ciCo2 = totalBrut < 78 ? 0 : totalBrut < 3333.33 ? 16 : totalBrut < 6667 ? (16 - (totalBrut - 3333.33) * 0.0042) : 0;

    // STEP 7: Calculate NET (Total Brut - Cotisations - Tax + Credits)
    const net = totalBrut - totalCotisation - (payslipData.impot || 0) + cissm + cisCipCim + ciCo2;

    // STEP 8: Calculate NET À PAYER (NET - other deductions)
    const netAPayer = net - (payslipData.chequeRepas || 0) - (payslipData.avanceSalaire || 0);

    // Update ALL manual fields with calculated values
    setPayslipData(prev => ({
      ...prev,
      manualAppointement: appointement,
      manualJoursFeries: joursFeries,
      manualTotalBrut: totalBrut,
      manualAssuranceMaladie: assuranceMaladie,
      manualMajoration: majorationEspece,
      manualAssurancePension: assurancePension,
      manualAssuranceDependance: assuranceDependance,
      manualTotalCotisation: totalCotisation,
      manualTotalImposable: totalImposable,
      manualCissm: cissm,
      manualCisCipCim: cisCipCim,
      manualCiCo2: ciCo2,
      manualNet: net,
      manualNetAPayer: netAPayer,
    }));
    setLastChangedField(null);
  }, [
    autoCalculate,
    isEditMode,
    lastChangedField,
    // Watch ALL input fields that affect calculations
    payslipData.hoursWorked,
    payslipData.hourlyRate,
    payslipData.publicHolidayHours,
    payslipData.holidayHours,
    payslipData.sickLeaveHours,
    payslipData.fd,
    payslipData.ac,
    payslipData.ffo,
    payslipData.fds,
    payslipData.impot,
    payslipData.chequeRepas,
    payslipData.avanceSalaire,
    // Also watch manual fields if user edits them directly
    payslipData.manualAppointement,
    payslipData.manualJoursFeries,
    payslipData.manualTotalBrut,
    payslipData.manualTotalCotisation,
    payslipData.manualNet,
    payslipData.manualNetAPayer,
  ]);

  const calculatePayslip = () => {
    const { hoursWorked, hourlyRate, publicHolidayHours } = payslipData;

    // Use manual values if set, otherwise calculate
    const appointement = payslipData.manualAppointement !== undefined
      ? payslipData.manualAppointement
      : hoursWorked * hourlyRate;

    const joursFeries = payslipData.manualJoursFeries !== undefined
      ? payslipData.manualJoursFeries
      : publicHolidayHours * hourlyRate;

    const totalBrut = payslipData.manualTotalBrut !== undefined
      ? payslipData.manualTotalBrut
      : appointement + joursFeries;

    const assuranceMaladie = payslipData.manualAssuranceMaladie !== undefined
      ? payslipData.manualAssuranceMaladie
      : totalBrut * RATES.assuranceMaladie;

    const majorationEspece = payslipData.manualMajoration !== undefined
      ? payslipData.manualMajoration
      : totalBrut * RATES.majoration;

    const assurancePension = payslipData.manualAssurancePension !== undefined
      ? payslipData.manualAssurancePension
      : totalBrut * RATES.assurancePension;

    const assuranceDependance = payslipData.manualAssuranceDependance !== undefined
      ? payslipData.manualAssuranceDependance
      : Math.max(0, (totalBrut - RATES.dependanceThreshold) * RATES.assuranceDependance);

    const totalCotisation = payslipData.manualTotalCotisation !== undefined
      ? payslipData.manualTotalCotisation
      : assuranceMaladie + majorationEspece + assurancePension + assuranceDependance;

    const totalImposable = payslipData.manualTotalImposable !== undefined
      ? payslipData.manualTotalImposable
      : totalBrut - assuranceMaladie - majorationEspece - assurancePension -
        payslipData.fd - payslipData.ac - payslipData.ffo - payslipData.fds;

    const cissm = payslipData.manualCissm !== undefined
      ? payslipData.manualCissm
      : totalBrut < 1800 ? 0 : totalBrut <= 3000 ? 81 : totalBrut >= 3600 ? 0 : 81 / 600 * (3600 - totalBrut);

    const cisCipCim = payslipData.manualCisCipCim !== undefined
      ? payslipData.manualCisCipCim
      : totalBrut < 78 ? 0 : totalBrut < 936 ? ((300 + (totalBrut * 12 - 936) * 0.029) / 12) : totalBrut < 3333.33 ? 50 : totalBrut > 6666.5 ? 0 : ((600 - (totalBrut * 12 - 40000) * 0.015) / 12);

    const ciCo2 = payslipData.manualCiCo2 !== undefined
      ? payslipData.manualCiCo2
      : totalBrut < 78 ? 0 : totalBrut < 3333.33 ? 16 : totalBrut < 6667 ? (16 - (totalBrut - 3333.33) * 0.0042) : 0;

    const net = payslipData.manualNet !== undefined
      ? payslipData.manualNet
      : totalBrut - totalCotisation - payslipData.impot + cissm + cisCipCim + ciCo2;

    const netAPayer = payslipData.manualNetAPayer !== undefined
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
    setLastChangedField(field); // Track which field was changed for smart recalculation
    setPayslipData(prev => ({ ...prev, [field]: value }));
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
      const isEmployee = !!employeeId;

      // Determine company ID - employees have direct companyId, individuals don't
      let companyIdToSave = undefined;
      if (isEmployee && employee) {
        companyIdToSave = employee.companyId;
      } else if (company) {
        companyIdToSave = company.id;
      }

      // Prepare the data to save
      const dataToSave = {
        id: payslipId,
        employeeId: isEmployee ? personId : undefined,
        individualId: !isEmployee ? personId : undefined,
        companyId: companyIdToSave,
        periodYear: selectedYear,
        periodMonth: selectedMonth,
        employeeNumber: payslipData.employeeNumber,
        indice: payslipData.indice,
        emploi: payslipData.emploi,
        dateEntree: payslipData.dateEntree,
        matriculeAssure: payslipData.matriculeAssure,
        matriculeEmployeur: payslipData.matriculeEmployeur,
        hoursWorked: payslipData.hoursWorked,
        hourlyRate: payslipData.hourlyRate,
        holidayHours: payslipData.holidayHours,
        sickLeaveHours: payslipData.sickLeaveHours,
        publicHolidayHours: payslipData.publicHolidayHours,
        fd: payslipData.fd,
        ac: payslipData.ac,
        ffo: payslipData.ffo,
        fds: payslipData.fds,
        impot: payslipData.impot,
        chequeRepas: payslipData.chequeRepas,
        avanceSalaire: payslipData.avanceSalaire,
        legalLeave: payslipData.legalLeave,
        leaveReport: payslipData.leaveReport,
        leaveTaken: payslipData.leaveTaken,
        manualAppointement: payslipData.manualAppointement,
        manualJoursFeries: payslipData.manualJoursFeries,
        manualTotalBrut: payslipData.manualTotalBrut,
        manualAssuranceMaladie: payslipData.manualAssuranceMaladie,
        manualMajoration: payslipData.manualMajoration,
        manualAssurancePension: payslipData.manualAssurancePension,
        manualAssuranceDependance: payslipData.manualAssuranceDependance,
        manualTotalCotisation: payslipData.manualTotalCotisation,
        manualTotalImposable: payslipData.manualTotalImposable,
        manualCissm: payslipData.manualCissm,
        manualCisCipCim: payslipData.manualCisCipCim,
        manualCiCo2: payslipData.manualCiCo2,
        manualNet: payslipData.manualNet,
        manualNetAPayer: payslipData.manualNetAPayer,
        m1Appointement: payslipData.m1Appointement,
        m1JoursFeries: payslipData.m1JoursFeries,
        m1TotalBrut: payslipData.m1TotalBrut,
        m1AssuranceMaladie: payslipData.m1AssuranceMaladie,
        m1Majoration: payslipData.m1Majoration,
        m1AssurancePension: payslipData.m1AssurancePension,
        m1AssuranceDependance: payslipData.m1AssuranceDependance,
        m1TotalCotisation: payslipData.m1TotalCotisation,
        m1Fd: payslipData.m1FD,
        m1Ac: payslipData.m1AC,
        m1Ffo: payslipData.m1FFO,
        m1Fds: payslipData.m1FDS,
        m1TotalImposable: payslipData.m1TotalImposable,
        m1Impot: payslipData.m1Impot,
        m1Cissm: payslipData.m1Cissm,
        m1CisCipCim: payslipData.m1CisCipCim,
        m1CiCo2: payslipData.m1CiCo2,
        m1Net: payslipData.m1Net,
      };

      console.log('💾 Saving payslip data to Supabase:', {
        id: dataToSave.id || 'NEW',
        personId,
        isEmployee,
        companyId: companyIdToSave,
        period: `${selectedYear}-${selectedMonth}`,
        totalBrut: dataToSave.manualTotalBrut,
        net: dataToSave.manualNet
      });

      // Save to Supabase
      const savedPayslip = await monthlyPayslipService.save(dataToSave);

      console.log('✅ Payslip saved successfully:', {
        id: savedPayslip.id,
        period: `${savedPayslip.periodYear}-${savedPayslip.periodMonth}`
      });

      // Update the payslip ID if this was a new record
      if (savedPayslip.id) {
        setPayslipId(savedPayslip.id);
      }

      setHasUnsavedChanges(false);
      toast({
        title: "✓ Sauvegarde réussie",
        description: `Fiche de paie de ${MONTHS.find(m => m.value === selectedMonth)?.label} ${selectedYear} sauvegardée dans Supabase (ID: ${savedPayslip.id?.substring(0, 8)}...).`,
        duration: 3000,
      });
    } catch (error: any) {
      console.error('❌ Error saving payslip:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });

      toast({
        title: "Erreur de sauvegarde",
        description: error.message || "Une erreur s'est produite lors de la sauvegarde. Veuillez réessayer.",
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

  // Component for editable calculated value - ALWAYS editable in edit mode (even with autocalculate ON)
  const EditableValue = React.useCallback(({ value, manualField, className = "" }: { value: number; manualField: keyof PayslipData; className?: string }) => {
    // If not in edit mode, show as read-only text
    if (!isEditMode) {
      return <span className={className}>{value.toFixed(2)} €</span>;
    }

    // In edit mode, ALWAYS show as editable input field (autocalculate will handle updates)
    const storedValue = payslipData[manualField] !== undefined ? (payslipData[manualField] as number) : value;

    return (
      <Input
        type="number"
        step="0.01"
        value={storedValue.toFixed(2)}
        onChange={(e) => {
          const val = parseFloat(e.target.value) || 0;
          handleInputChange(manualField, val);
        }}
        onFocus={(e) => e.target.select()}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.currentTarget.blur();
          }
        }}
        className={`h-9 w-full px-2 text-right font-medium ${className} ${autoCalculate ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700' : ''}`}
      />
    );
  }, [isEditMode, autoCalculate, payslipData, handleInputChange]);

  // Component for editable input fields (hours, rates)
  const EditableInput = React.useCallback(({ field, value, type = "number", step = "1", className = "" }: { field: keyof PayslipData; value: number | string; type?: string; step?: string; className?: string }) => {
    // If not in edit mode, show as read-only text
    if (!isEditMode) {
      return <span className="inline-block text-right px-2 py-1 font-medium">{value}</span>;
    }

    return (
      <Input
        type={type}
        step={step}
        value={value}
        onChange={(e) => {
          const val = type === "number" ? (parseFloat(e.target.value) || 0) : e.target.value;
          handleInputChange(field, val);
        }}
        onFocus={(e) => e.target.select()}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.currentTarget.blur();
          }
        }}
        className={`h-9 w-full px-2 text-right font-medium ${className}`}
      />
    );
  }, [isEditMode, handleInputChange]);

  // Component for editable M-1 (previous month) values
  const EditableM1Value = React.useCallback(({ manualField, defaultValue = 0, className = "" }: { manualField: keyof PayslipData; defaultValue?: number; className?: string }) => {
    // If not in edit mode, show as read-only text
    if (!isEditMode) {
      const displayValue = payslipData[manualField] !== undefined ? payslipData[manualField] as number : defaultValue;
      return <span className={className}>{displayValue.toFixed(2)} €</span>;
    }

    // In edit mode, show as editable input field
    const storedValue = payslipData[manualField] !== undefined ? payslipData[manualField] as number : defaultValue;

    return (
      <Input
        type="number"
        step="0.01"
        value={storedValue.toFixed(2)}
        onChange={(e) => {
          const val = parseFloat(e.target.value) || 0;
          handleInputChange(manualField, val);
        }}
        onFocus={(e) => e.target.select()}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.currentTarget.blur();
          }
        }}
        className={`h-9 w-full px-2 text-right font-medium ${className}`}
      />
    );
  }, [isEditMode, autoCalculate, payslipData]);

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
    <div className="container mx-auto p-4 md:p-6 space-y-6 relative">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <p className="text-lg font-semibold">Chargement des données...</p>
            </div>
          </Card>
        </div>
      )}
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
              MODE MODIFICATION MANUELLE ACTIVÉ
              <span className="text-xs font-normal bg-orange-100 dark:bg-orange-900 px-2 py-1 rounded">
                Toutes les valeurs sont modifiables
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
              MODE CALCUL BIDIRECTIONNEL ACTIVÉ
              <span className="text-xs font-normal bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
                Modifiez n'importe quelle valeur, les autres s'ajusteront automatiquement
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-left">Désignation</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Quantité</TableHead>
                  <TableHead className="text-right">Valeur</TableHead>
                  <TableHead className="text-right bg-blue-50/50 dark:bg-blue-950/30">Total</TableHead>
                  <TableHead className="text-right whitespace-nowrap">M-1</TableHead>
                  <TableHead className="text-right bg-green-50/50 dark:bg-green-950/30">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Appointement */}
                <TableRow>
                  <TableCell>Appointement</TableCell>
                  <TableCell className="text-right">
                    <EditableInput field="hoursWorked" value={payslipData.hoursWorked} />
                  </TableCell>
                  <TableCell className="text-right">
                    <EditableInput field="hourlyRate" value={payslipData.hourlyRate.toFixed(2)} step="0.01" />
                  </TableCell>
                  <TableCell className="text-right bg-blue-50/50 dark:bg-blue-950/30 font-medium">
                    <EditableValue value={calculated.appointement} manualField="manualAppointement" />
                  </TableCell>
                  <TableCell className="text-right">
                    <EditableM1Value manualField="m1Appointement" defaultValue={0} />
                  </TableCell>
                  <TableCell className="text-right bg-green-50/50 dark:bg-green-950/30">
                    <EditableValue value={calculated.appointement} manualField="manualAppointement" />
                  </TableCell>
                </TableRow>

                {/* Jours fériés */}
                <TableRow>
                  <TableCell>Jours fériés</TableCell>
                  <TableCell className="text-right">
                    <EditableInput field="publicHolidayHours" value={payslipData.publicHolidayHours} />
                  </TableCell>
                  <TableCell className="text-right">
                    <EditableInput field="hourlyRate" value={payslipData.hourlyRate.toFixed(2)} step="0.01" />
                  </TableCell>
                  <TableCell className="text-right bg-blue-50/50 dark:bg-blue-950/30 font-medium">
                    <EditableValue value={calculated.joursFeries} manualField="manualJoursFeries" />
                  </TableCell>
                  <TableCell className="text-right">
                    <EditableM1Value manualField="m1JoursFeries" defaultValue={0} />
                  </TableCell>
                  <TableCell className="text-right bg-green-50/50 dark:bg-green-950/30">
                    <EditableValue value={calculated.joursFeries} manualField="manualJoursFeries" />
                  </TableCell>
                </TableRow>

                {/* Congés & Absences */}
                <TableRow>
                  <TableCell>Congés (H)</TableCell>
                  <TableCell className="text-right">
                    <EditableInput field="holidayHours" value={payslipData.holidayHours} />
                  </TableCell>
                  <TableCell className="text-right">
                    <EditableInput field="hourlyRate" value={payslipData.hourlyRate.toFixed(2)} step="0.01" />
                  </TableCell>
                  <TableCell className="text-right bg-blue-50/50 dark:bg-blue-950/30">
                    {isEditMode ? (
                      <Input
                        type="number"
                        step="0.01"
                        value={0}
                        onChange={() => {}}
                        className="h-9 w-full text-right text-sm font-medium"
                      />
                    ) : (
                      <span>0.00 €</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {isEditMode ? (
                      <Input
                        type="number"
                        step="0.01"
                        value={0}
                        onChange={() => {}}
                        className="h-9 w-full text-right text-sm font-medium"
                      />
                    ) : (
                      <span>0.00 €</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right bg-green-50/50 dark:bg-green-950/30">
                    {isEditMode ? (
                      <Input
                        type="number"
                        step="0.01"
                        value={0}
                        onChange={() => {}}
                        className="h-9 w-full text-right text-sm font-medium"
                      />
                    ) : (
                      <span>0.00 €</span>
                    )}
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell>Absences Maladie (H)</TableCell>
                  <TableCell className="text-right">
                    <EditableInput field="sickLeaveHours" value={payslipData.sickLeaveHours} />
                  </TableCell>
                  <TableCell className="text-right">
                    <EditableInput field="hourlyRate" value={payslipData.hourlyRate.toFixed(2)} step="0.01" />
                  </TableCell>
                  <TableCell className="text-right bg-blue-50/50 dark:bg-blue-950/30">
                    {isEditMode ? (
                      <Input
                        type="number"
                        step="0.01"
                        value={0}
                        onChange={() => {}}
                        className="h-9 w-full text-right text-sm font-medium"
                      />
                    ) : (
                      <span>0.00 €</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {isEditMode ? (
                      <Input
                        type="number"
                        step="0.01"
                        value={0}
                        onChange={() => {}}
                        className="h-9 w-full text-right text-sm font-medium"
                      />
                    ) : (
                      <span>0.00 €</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right bg-green-50/50 dark:bg-green-950/30">
                    {isEditMode ? (
                      <Input
                        type="number"
                        step="0.01"
                        value={0}
                        onChange={() => {}}
                        className="h-9 w-full text-right text-sm font-medium"
                      />
                    ) : (
                      <span>0.00 €</span>
                    )}
                  </TableCell>
                </TableRow>

                {/* Total Brut */}
                <TableRow className="bg-blue-50 dark:bg-blue-950 font-bold">
                  <TableCell className="font-bold">Total brut</TableCell>
                  <TableCell className="text-right">-</TableCell>
                  <TableCell className="text-right">-</TableCell>
                  <TableCell className="text-right bg-blue-100 dark:bg-blue-900">
                    <EditableValue value={calculated.totalBrut} manualField="manualTotalBrut" className="font-bold" />
                  </TableCell>
                  <TableCell className="text-right">
                    <EditableM1Value manualField="m1TotalBrut" defaultValue={0} className="font-bold" />
                  </TableCell>
                  <TableCell className="text-right bg-green-100 dark:bg-green-900">
                    <EditableValue value={calculated.totalBrut} manualField="manualTotalBrut" className="font-bold" />
                  </TableCell>
                </TableRow>

                <TableRow><TableCell colSpan={6} className="py-1"></TableCell></TableRow>

                {/* Cotisations */}
                <TableRow className="bg-muted/70 font-semibold"><TableCell className="font-semibold" colSpan={6}>Cotisation</TableCell></TableRow>

                {[
                  ['Assurance Maladie', RATES.assuranceMaladie, calculated.assuranceMaladie, 'manualAssuranceMaladie', 'm1AssuranceMaladie'],
                  ['A-M Majoration espèce', RATES.majoration, calculated.majorationEspece, 'manualMajoration', 'm1Majoration'],
                  ['Assurance Pension', RATES.assurancePension, calculated.assurancePension, 'manualAssurancePension', 'm1AssurancePension'],
                  ['Assurance dépendance', RATES.assuranceDependance, calculated.assuranceDependance, 'manualAssuranceDependance', 'm1AssuranceDependance'],
                ].map(([label, rate, value, manualField, m1Field]) => (
                  <TableRow key={label as string}>
                    <TableCell>{label}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{((rate as number) * 100).toFixed(2)}%</TableCell>
                    <TableCell className="text-right text-muted-foreground">-</TableCell>
                    <TableCell className="text-right bg-blue-50/50 dark:bg-blue-950/30 font-medium">
                      <EditableValue value={value as number} manualField={manualField as keyof PayslipData} />
                    </TableCell>
                    <TableCell className="text-right">
                      <EditableM1Value manualField={m1Field as keyof PayslipData} defaultValue={0} />
                    </TableCell>
                    <TableCell className="text-right bg-green-50/50 dark:bg-green-950/30">
                      <EditableValue value={value as number} manualField={manualField as keyof PayslipData} />
                    </TableCell>
                  </TableRow>
                ))}

                <TableRow className="bg-orange-50 dark:bg-orange-950 font-bold">
                  <TableCell className="font-bold">Total Cotisation</TableCell>
                  <TableCell className="text-right">-</TableCell>
                  <TableCell className="text-right">-</TableCell>
                  <TableCell className="text-right bg-orange-100 dark:bg-orange-900">
                    <EditableValue value={calculated.totalCotisation} manualField="manualTotalCotisation" className="font-bold" />
                  </TableCell>
                  <TableCell className="text-right">
                    <EditableM1Value manualField="m1TotalCotisation" defaultValue={0} className="font-bold" />
                  </TableCell>
                  <TableCell className="text-right bg-orange-100 dark:bg-orange-900">
                    <EditableValue value={calculated.totalCotisation} manualField="manualTotalCotisation" className="font-bold" />
                  </TableCell>
                </TableRow>

                <TableRow><TableCell colSpan={6} className="py-1"></TableCell></TableRow>

                {/* Deductions */}
                <TableRow className="bg-muted/70 font-semibold"><TableCell className="font-semibold" colSpan={6}>Deduction</TableCell></TableRow>

                {[
                  ['fd', 'm1FD'],
                  ['ac', 'm1AC'],
                  ['ffo', 'm1FFO'],
                  ['fds', 'm1FDS']
                ].map(([field, m1Field]) => (
                  <TableRow key={field}>
                    <TableCell>{field.toUpperCase()}</TableCell>
                    <TableCell className="text-right text-muted-foreground">-</TableCell>
                    <TableCell className="text-right text-muted-foreground">-</TableCell>
                    <TableCell className="text-right bg-blue-50/50 dark:bg-blue-950/30">
                      <EditableInput field={field as keyof PayslipData} value={payslipData[field as keyof PayslipData] as number} step="0.01" />
                    </TableCell>
                    <TableCell className="text-right">
                      <EditableM1Value manualField={m1Field as keyof PayslipData} defaultValue={0} />
                    </TableCell>
                    <TableCell className="text-right bg-green-50/50 dark:bg-green-950/30">
                      {isEditMode ? (
                        <EditableInput field={field as keyof PayslipData} value={payslipData[field as keyof PayslipData] as number} step="0.01" />
                      ) : (
                        <span>{(payslipData[field as keyof PayslipData] as number).toFixed(2)} €</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}

                <TableRow><TableCell colSpan={6} className="py-1"></TableCell></TableRow>

                {/* Total Imposable */}
                <TableRow className="bg-purple-50 dark:bg-purple-950 font-bold">
                  <TableCell className="font-bold">Total Imposable</TableCell>
                  <TableCell className="text-right">-</TableCell>
                  <TableCell className="text-right">-</TableCell>
                  <TableCell className="text-right bg-purple-100 dark:bg-purple-900">
                    <EditableValue value={calculated.totalImposable} manualField="manualTotalImposable" className="font-bold" />
                  </TableCell>
                  <TableCell className="text-right">
                    <EditableM1Value manualField="m1TotalImposable" defaultValue={0} className="font-bold" />
                  </TableCell>
                  <TableCell className="text-right bg-purple-100 dark:bg-purple-900">
                    <EditableValue value={calculated.totalImposable} manualField="manualTotalImposable" className="font-bold" />
                  </TableCell>
                </TableRow>

                <TableRow><TableCell colSpan={6} className="py-1"></TableCell></TableRow>

                {/* Impôts and Credits */}
                <TableRow>
                  <TableCell className="font-semibold">IMPÔT</TableCell>
                  <TableCell className="text-right text-muted-foreground">-</TableCell>
                  <TableCell className="text-right text-muted-foreground">-</TableCell>
                  <TableCell className="text-right bg-blue-50/50 dark:bg-blue-950/30">
                    <EditableInput field="impot" value={payslipData.impot} step="0.01" />
                  </TableCell>
                  <TableCell className="text-right">
                    <EditableM1Value manualField="m1Impot" defaultValue={0} />
                  </TableCell>
                  <TableCell className="text-right bg-green-50/50 dark:bg-green-950/30">
                    {isEditMode ? (
                      <EditableInput field="impot" value={payslipData.impot} step="0.01" />
                    ) : (
                      <span>{payslipData.impot.toFixed(2)} €</span>
                    )}
                  </TableCell>
                </TableRow>

                {[
                  ['CISSM', calculated.cissm, 'manualCissm', 'm1Cissm'],
                  ['CIS-CIP-CIM', calculated.cisCipCim, 'manualCisCipCim', 'm1CisCipCim'],
                  ['CI-CO2', calculated.ciCo2, 'manualCiCo2', 'm1CiCo2'],
                ].map(([label, value, manualField, m1Field]) => (
                  <TableRow key={label}>
                    <TableCell>{label}</TableCell>
                    <TableCell className="text-right text-muted-foreground">-</TableCell>
                    <TableCell className="text-right text-muted-foreground">-</TableCell>
                    <TableCell className="text-right bg-blue-50/50 dark:bg-blue-950/30 font-medium">
                      <EditableValue value={value as number} manualField={manualField as keyof PayslipData} />
                    </TableCell>
                    <TableCell className="text-right">
                      <EditableM1Value manualField={m1Field as keyof PayslipData} defaultValue={0} />
                    </TableCell>
                    <TableCell className="text-right bg-green-50/50 dark:bg-green-950/30">
                      <EditableValue value={value as number} manualField={manualField as keyof PayslipData} />
                    </TableCell>
                  </TableRow>
                ))}

                <TableRow><TableCell colSpan={6} className="py-1"></TableCell></TableRow>

                {/* NET */}
                <TableRow className="bg-green-50 dark:bg-green-950 font-bold">
                  <TableCell className="py-3 text-base font-bold">NET</TableCell>
                  <TableCell className="text-right py-3">-</TableCell>
                  <TableCell className="text-right py-3">-</TableCell>
                  <TableCell className="text-right py-3 bg-green-100 dark:bg-green-900 text-base">
                    <EditableValue value={calculated.net} manualField="manualNet" className="font-bold text-base" />
                  </TableCell>
                  <TableCell className="text-right py-3">
                    <EditableM1Value manualField="m1Net" defaultValue={0} className="font-bold text-base" />
                  </TableCell>
                  <TableCell className="text-right py-3 bg-green-100 dark:bg-green-900 text-base">
                    <EditableValue value={calculated.net} manualField="manualNet" className="font-bold text-base" />
                  </TableCell>
                </TableRow>

                {/* Deductions from NET */}
                {[
                  ['Chèque repas', 'chequeRepas'],
                  ['Avance sur salaire', 'avanceSalaire'],
                ].map(([label, field]) => (
                  <TableRow key={field} className="border-b border-border hover:bg-muted/30">
                    <TableCell className="py-2 px-2">{label}</TableCell>
                    <TableCell className="text-right py-2 px-2 text-muted-foreground">-</TableCell>
                    <TableCell className="text-right py-2 px-2 text-muted-foreground">-</TableCell>
                    <TableCell className="text-right py-2 px-2 bg-blue-500/15 dark:bg-blue-500/25">
                      <EditableInput field={field as keyof PayslipData} value={payslipData[field as keyof PayslipData] as number} step="0.01" className="h-6 w-20 text-right text-xs" />
                    </TableCell>
                    <TableCell className="text-right py-2 px-2">
                      {isEditMode ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={0}
                          onChange={() => {}}
                          className="h-7 w-28 text-right text-xs font-medium border-blue-300 focus:border-blue-500 focus:ring-blue-500 transition-colors"
                        />
                      ) : (
                        <span>-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right py-2 px-2 bg-green-500/15 dark:bg-green-500/25">
                      {isEditMode ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={0}
                          onChange={() => {}}
                          className="h-7 w-28 text-right text-xs font-medium border-blue-300 focus:border-blue-500 focus:ring-blue-500 transition-colors"
                        />
                      ) : (
                        <span>-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}

                {/* NET A PAYER */}
                <TableRow className="border-t-2 border-border bg-green-600/30 dark:bg-green-600/40">
                  <TableCell colSpan={4}></TableCell>
                  <TableCell className="text-right py-3 px-2 font-bold text-base text-foreground">NET À PAYER</TableCell>
                  <TableCell className="text-right py-3 px-2 bg-green-600/50 dark:bg-green-600/60 font-bold text-base text-foreground">
                    <EditableValue value={calculated.netAPayer} manualField="manualNetAPayer" className="font-bold text-base" />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
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
