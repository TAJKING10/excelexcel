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
import { ArrowLeft, Download, Calendar, Calculator, Edit2, Save, Check, Loader2, History } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { monthlyPayslipService } from '@/services/supabase';
import { supabase } from '@/lib/supabase';
import { TaxRateSelector } from '@/components/tax/TaxRateSelector';
import { useTaxRatesStore } from '@/store/taxRatesStore';
import { recordPayslipEdit } from '@/services/payslipEditHistory';
import { PayslipHistoryButton } from '@/components/payslips/PayslipHistoryButton';
import { calculateIncomeTax } from '@/lib/luxembourgPayroll';
import { PageTransition } from '@/components/ui/page-transition';
import { logoGroupe } from '@/assets/logoGroupe';

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
// Updated to match 2024/2025 Excel "Livre de Paie"
const RATES = {
  assuranceMaladie: 0.028, // 2.80% - matches Excel Sept 2025 (90.84 / 3244.40)
  majoration: 0.0025, // 0.25% - matches Excel (8.11 / 3244.40)
  assurancePension: 0.08, // 8.00% - matches Excel (259.55 / 3244.40)
  assuranceDependance: 0.014, // 1.40% - matches Excel (35.96 / (3244.40 - 675.93))
  dependanceThreshold: 675.93,
};

interface PayslipData {
  // Tax rate information (immutable - stored at payslip creation)
  taxRateId?: string;
  taxRatePercentage?: number;
  taxClass?: string; // Tax class: "1", "1A", or "2"
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
  overtimeHours: number;
  avantageVehicule: number;
  travailTache: number;
  fd: number;
  ac: number;
  ffo: number;
  fds: number;
  impot: number;
  chequeRepas: number;
  avanceSalaire: number;
  customExpense1Label?: string;
  customExpense1Amount?: number;
  customExpense2Label?: string;
  customExpense2Amount?: number;
  customExpense3Label?: string;
  customExpense3Amount?: number;
  customExpense4Label?: string;
  customExpense4Amount?: number;
  customExpense5Label?: string;
  customExpense5Amount?: number;
  customExpense6Label?: string;
  customExpense6Amount?: number;
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
  m1OvertimeHours?: number;
  m1OvertimePremium?: number;
  m1AvantageVehicule?: number;
  m1TravailTache?: number;
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
  const [originalPayslipData, setOriginalPayslipData] = useState<PayslipData | null>(null);

  const employees = useDataStore((state) => state.employees);
  const individuals = useDataStore((state) => state.individuals);
  const companies = useDataStore((state) => state.companies);
  const taxRates = useTaxRatesStore((state) => state.taxRates);
  const { getTaxRateForDate, getTaxRateById, loadTaxRates } = useTaxRatesStore();

  // Reset states on component mount and cleanup on unmount
  useEffect(() => {
    // Reset loading states on mount to prevent stuck loading
    setIsLoading(false);
    setIsSaving(false);

    // Cleanup on unmount
    return () => {
      setIsLoading(false);
      setIsSaving(false);
    };
  }, []);

  // Load tax rates from Supabase on mount
  useEffect(() => {
    loadTaxRates();
  }, [loadTaxRates]);

  // Update payslip data with active tax rate when tax rates are loaded
  // IMPORTANT: This should ONLY run for NEW payslips ONCE, never change after
  const hasAppliedTaxRate = React.useRef(false);

  useEffect(() => {
    // Only run if tax rates are loaded, no payslip ID, and haven't applied yet
    if (taxRates.length > 0 && !payslipId && !hasAppliedTaxRate.current) {
      // Apply date-based tax rate ONCE for new payslips
      // Use the first day of the selected period to determine the correct tax rate
      const payslipDate = new Date(selectedYear, selectedMonth - 1, 1).toISOString();
      const applicableTaxRate = getTaxRateForDate(payslipDate);
      if (applicableTaxRate) {
        setPayslipData(prev => ({
          ...prev,
          taxRateId: applicableTaxRate.id,
          taxRatePercentage: applicableTaxRate.rate
        }));
        hasAppliedTaxRate.current = true; // LOCK - never apply again
      }
    }
  }, [taxRates, payslipId, selectedYear, selectedMonth, getTaxRateForDate]);

  const personId = employeeId || individualId;
  const employee = employees.find((e) => e.id === personId);
  const individual = individuals.find((i) => i.id === personId);
  const person = employee || individual;
  const company = person ? companies.find((c) => c.id === person.companyId) : null;

  const [payslipData, setPayslipData] = useState<PayslipData>({
    employeeNumber: '2',
    indice: '968.04', // Current Luxembourg salary index (updated automatically based on cost of living)
    emploi: person?.class || 'Comptable',
    dateEntree: person?.hireDate || '',
    matriculeAssure: person?.matricule || '',
    matriculeEmployeur: '20152206748',
    taxClass: employee?.taxClass || '2',
    hoursWorked: 173,
    hourlyRate: person?.baseSalary ? person.baseSalary / 173 : 18.2968,
    holidayHours: 16,
    sickLeaveHours: 0,
    publicHolidayHours: 0,
    overtimeHours: 0,
    avantageVehicule: 0,
    travailTache: 0,
    fd: 0, // Default to 0 - user can add manually
    ac: 0,
    ffo: 0,
    fds: 0,
    impot: 0, // Will be auto-calculated on load
    chequeRepas: 0,
    avanceSalaire: 0,
    customExpense1Label: '',
    customExpense1Amount: 0,
    customExpense2Label: '',
    customExpense2Amount: 0,
    customExpense3Label: '',
    customExpense3Amount: 0,
    customExpense4Label: '',
    customExpense4Amount: 0,
    customExpense5Label: '',
    customExpense5Amount: 0,
    customExpense6Label: '',
    customExpense6Amount: 0,
    legalLeave: 208,
    leaveReport: -4,
    leaveTaken: 16,
  });

  // Track which field was last changed for smart recalculation
  const [lastChangedField, setLastChangedField] = useState<string | null>(null);

  // Load payslip data from Supabase when period changes
  useEffect(() => {
    let isMounted = true; // Track if component is still mounted
    const loadPayslipData = async () => {
      if (!personId) {
        setIsLoading(false);
        return;
      }

      // Wait for tax rates to be loaded first
      if (taxRates.length === 0) {
        setIsLoading(false);
        return;
      }

      // Reset the tax rate application flag when loading a different payslip
      hasAppliedTaxRate.current = false;

      setIsLoading(true);
      setIsEditMode(false); // Exit edit mode when loading new data
      try {
        const isEmployee = !!employeeId;
        const savedPayslip = await monthlyPayslipService.getByPeriod(
          personId,
          selectedYear,
          selectedMonth,
          isEmployee
        );
        if (savedPayslip) {
          // Load all the saved data
          setPayslipId(savedPayslip.id);
          const loadedData = {
            taxRateId: savedPayslip.taxRateId,
            taxRatePercentage: savedPayslip.taxRatePercentage,
            taxClass: savedPayslip.taxClass || employee?.taxClass || '2',
            employeeNumber: savedPayslip.employeeNumber || '2',
            indice: savedPayslip.indice || '968.04', // Current Luxembourg salary index
            emploi: savedPayslip.emploi || person?.class || 'Comptable',
            dateEntree: savedPayslip.dateEntree || person?.hireDate || '',
            matriculeAssure: savedPayslip.matriculeAssure || person?.matricule || '',
            matriculeEmployeur: savedPayslip.matriculeEmployeur || '20152206748',
            hoursWorked: savedPayslip.hoursWorked || 173,
            hourlyRate: savedPayslip.hourlyRate || (person?.baseSalary ? person.baseSalary / 173 : 18.2968),
            holidayHours: savedPayslip.holidayHours || 0,
            sickLeaveHours: savedPayslip.sickLeaveHours || 0,
            publicHolidayHours: savedPayslip.publicHolidayHours || 0,
            overtimeHours: savedPayslip.overtimeHours || 0,
            avantageVehicule: savedPayslip.avantageVehicule || 0,
            travailTache: savedPayslip.travailTache || 0,
            fd: savedPayslip.fd || 0,
            ac: savedPayslip.ac || 0,
            ffo: savedPayslip.ffo || 0,
            fds: savedPayslip.fds || 0,
            impot: savedPayslip.impot || 0,
            chequeRepas: savedPayslip.chequeRepas || 0,
            avanceSalaire: savedPayslip.avanceSalaire || 0,
            customExpense1Label: savedPayslip.customExpense1Label || '',
            customExpense1Amount: savedPayslip.customExpense1Amount || 0,
            customExpense2Label: savedPayslip.customExpense2Label || '',
            customExpense2Amount: savedPayslip.customExpense2Amount || 0,
            customExpense3Label: savedPayslip.customExpense3Label || '',
            customExpense3Amount: savedPayslip.customExpense3Amount || 0,
            customExpense4Label: savedPayslip.customExpense4Label || '',
            customExpense4Amount: savedPayslip.customExpense4Amount || 0,
            customExpense5Label: savedPayslip.customExpense5Label || '',
            customExpense5Amount: savedPayslip.customExpense5Amount || 0,
            customExpense6Label: savedPayslip.customExpense6Label || '',
            customExpense6Amount: savedPayslip.customExpense6Amount || 0,
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
            m1OvertimeHours: savedPayslip.m1OvertimeHours,
            m1OvertimePremium: savedPayslip.m1OvertimePremium,
            m1AvantageVehicule: savedPayslip.m1AvantageVehicule,
            m1TravailTache: savedPayslip.m1TravailTache,
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
          };
          if (isMounted) {
            setPayslipData(loadedData);
            setOriginalPayslipData(loadedData); // Store original data for edit history tracking
            setHasUnsavedChanges(false);
          }
        } else {
          // No saved data - auto-create the payslip record so history tracking works
          // Use the first day of the selected period to determine the correct tax rate
          const payslipDate = new Date(selectedYear, selectedMonth - 1, 1).toISOString();
          const applicableTaxRate = getTaxRateForDate(payslipDate);
          const defaultData = {
            taxRateId: applicableTaxRate?.id,
            taxRatePercentage: applicableTaxRate?.rate,
            taxClass: employee?.taxClass || '2',
            employeeNumber: '2',
            indice: '968.04', // Current Luxembourg salary index (cost of living adjustment)
            emploi: person?.class || 'Comptable',
            dateEntree: person?.hireDate || '',
            matriculeAssure: person?.matricule || '',
            matriculeEmployeur: '20152206748',
            hoursWorked: 173,
            hourlyRate: person?.baseSalary ? person.baseSalary / 173 : 18.2968,
            holidayHours: 16,
            sickLeaveHours: 0,
            publicHolidayHours: 0,
            overtimeHours: 0,
            fd: 0, // Default to 0 - user can add manually
            ac: 0,
            ffo: 0,
            fds: 0,
            impot: 6.8, // Manual IMPOT value from previous month
            chequeRepas: 0,
            avanceSalaire: 0,
            legalLeave: 208,
            leaveReport: -4,
            leaveTaken: 16,
          };

          // Calculate values for the initial save
          // We need to temporarily set the data to calculate values
          const tempData = { ...defaultData };

          // Calculate using the same logic as the main calculatePayslip function
          const hoursWorked = tempData.hoursWorked;
          const hourlyRate = tempData.hourlyRate;
          const publicHolidayHours = tempData.publicHolidayHours;
          const overtimeHours = tempData.overtimeHours || 0;

          const appointement = hoursWorked * hourlyRate;
          const joursFeries = publicHolidayHours * hourlyRate;
          const heuresSuppl = overtimeHours * hourlyRate;
          const heuresSupplPremium = overtimeHours * hourlyRate * 0.40;
          const avantageVehicule = tempData.avantageVehicule || 0;
          const travailTache = tempData.travailTache || 0;
          const totalBrut = appointement + joursFeries + avantageVehicule + travailTache;
          const baseForCotisations = totalBrut;
          const baseWithOvertime = totalBrut + heuresSuppl;

          const assuranceMaladie = baseWithOvertime * RATES.assuranceMaladie;
          const majorationEspece = totalBrut * RATES.majoration;
          const assurancePension = totalBrut * RATES.assurancePension;
          const assuranceDependance = Math.max(0, (baseWithOvertime - RATES.dependanceThreshold) * RATES.assuranceDependance);
          const totalCotisation = assuranceMaladie + majorationEspece + assurancePension + assuranceDependance;

          // IMPOSABLE = BRUT - MALADIE - MAJORATION - PENSION - FD - AC - FFO - FDS (Excel: D20-D23-D24-D25-D30-D31-D32-D33)
          const totalImposable = totalBrut - assuranceMaladie - majorationEspece - assurancePension -
            (tempData.fd || 0) - (tempData.ac || 0) - (tempData.ffo || 0) - (tempData.fds || 0);

          // Calculate IMPÔT: use Luxembourg 2025 barème based on tax class
          const taxClass = payslipData.taxClass || '2'; // Default to Class 2 if not set
          const calculatedImpot = calculateIncomeTax(totalImposable, taxClass);

          // Fixed tax credit formulas
          const cissm = totalBrut < 1800 ? 0
                      : totalBrut <= 3000 ? 81
                      : totalBrut < 3600 ? (81 / 600 * (3600 - totalBrut))
                      : 0;

          const cisCipCim = totalBrut < 78 ? 0
                          : totalBrut < 936 ? ((300 + (totalBrut * 12 - 936) * 0.029) / 12)
                          : totalBrut <= 3333.33 ? 50
                          : totalBrut <= 6666.67 ? ((600 - (totalBrut * 12 - 40000) * 0.015) / 12)
                          : 0;

          const ciCo2 = totalBrut < 78 ? 0
                      : totalBrut <= 3333.33 ? 16
                      : totalBrut <= 6666.67 ? (16 - (totalBrut - 3333.33) * 0.0048)
                      : 0;
          // NET = BRUT - Total Cotisation - IMPÔT + CISSM + CIS-CIP-CIM + CI-CO2 + Heures Suppl + H-S majorée - Avantage N (Excel: D22-D29-D39+D40+D41+D42+D19+D20)
          const net = totalBrut - totalCotisation - calculatedImpot + cissm + cisCipCim + ciCo2 + heuresSuppl + heuresSupplPremium - avantageVehicule;
          const netAPayer = net - tempData.chequeRepas - tempData.avanceSalaire
            - (tempData.customExpense1Amount || 0) - (tempData.customExpense2Amount || 0) - (tempData.customExpense3Amount || 0)
            + (tempData.customExpense4Amount || 0) + (tempData.customExpense5Amount || 0) + (tempData.customExpense6Amount || 0);

          const calculations = {
            appointement,
            joursFeries,
            totalBrut,
            assuranceMaladie,
            majorationEspece,
            assurancePension,
            assuranceDependance,
            totalCotisation,
            totalImposable,
            calculatedImpot,
            cissm,
            cisCipCim,
            ciCo2,
            net,
            netAPayer
          };

          // Auto-save the payslip to database immediately
          try {
            // Determine company ID - employees have direct companyId, individuals don't
            let companyIdToSave = undefined;
            if (isEmployee && employee) {
              companyIdToSave = employee.companyId;
            } else if (company) {
              companyIdToSave = company.id;
            }

            const dataToSave = {
              [isEmployee ? 'employeeId' : 'individualId']: personId,
              companyId: companyIdToSave,
              periodYear: selectedYear,
              periodMonth: selectedMonth,
              taxRateId: applicableTaxRate?.id,
              taxRatePercentage: applicableTaxRate?.rate,
              employeeNumber: defaultData.employeeNumber,
              indice: defaultData.indice,
              emploi: defaultData.emploi,
              dateEntree: defaultData.dateEntree,
              matriculeAssure: defaultData.matriculeAssure,
              matriculeEmployeur: defaultData.matriculeEmployeur,
              hoursWorked: defaultData.hoursWorked,
              hourlyRate: defaultData.hourlyRate,
              holidayHours: defaultData.holidayHours,
              sickLeaveHours: defaultData.sickLeaveHours,
              publicHolidayHours: defaultData.publicHolidayHours,
              fd: defaultData.fd,
              ac: defaultData.ac,
              ffo: defaultData.ffo,
              fds: defaultData.fds,
              impot: calculations.calculatedImpot,
              chequeRepas: defaultData.chequeRepas,
              avanceSalaire: defaultData.avanceSalaire,
              legalLeave: defaultData.legalLeave,
              leaveReport: defaultData.leaveReport,
              leaveTaken: defaultData.leaveTaken,
              manualAppointement: calculations.appointement,
              manualTotalBrut: calculations.totalBrut,
              manualAssuranceMaladie: calculations.assuranceMaladie,
              manualMajoration: calculations.majorationEspece,
              manualAssurancePension: calculations.assurancePension,
              manualAssuranceDependance: calculations.assuranceDependance,
              manualTotalCotisation: calculations.totalCotisation,
              manualTotalImposable: calculations.totalImposable,
              manualCissm: calculations.cissm,
              manualCisCipCim: calculations.cisCipCim,
              manualCiCo2: calculations.ciCo2,
              manualNet: calculations.net,
              manualNetAPayer: calculations.netAPayer,
            };

            const autoCreatedPayslip = await monthlyPayslipService.save(dataToSave);
            // Set the payslip ID so history tracking works
            setPayslipId(autoCreatedPayslip.id);

            // Record the creation in history
            try {
              await recordPayslipEdit(
                autoCreatedPayslip.id,
                'monthly',
                null, // No old values for new payslips
                defaultData,
                `Created monthly payslip for ${MONTHS.find(m => m.value === selectedMonth)?.label} ${selectedYear}`
              );
            } catch (historyError) {
            }
          } catch (autoCreateError) {
            // Continue anyway with undefined payslipId
          }

          // Update defaultData with calculated impot before setting state
          const dataWithCalculatedImpot = {
            ...defaultData,
            impot: calculations.calculatedImpot,
          };

          if (isMounted) {
            setPayslipData(dataWithCalculatedImpot);
            setOriginalPayslipData(dataWithCalculatedImpot);
            setHasUnsavedChanges(false);
          }
        }
      } catch (error) {
        if (isMounted) {
          toast({
            title: t('payslips.loadError'),
            description: error instanceof Error ? error.message : t('payslips.unableToLoad'),
            variant: "destructive",
          });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadPayslipData();

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [personId, selectedYear, selectedMonth, employeeId, taxRates]); // Include taxRates to wait for them to load

  // Smart bidirectional auto-recalculation
  useEffect(() => {
    if (!autoCalculate || !isEditMode) return; // Only auto-calculate in edit mode with auto-calculate ON

    // IMPORTANT: Only run calculations when a field actually changed (lastChangedField is set)
    // This prevents recalculation when just entering edit mode or toggling auto-calculate
    if (!lastChangedField) return;

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
      setLastChangedField(null); // Clear to stop chain reaction
      return;
    }

    // REVERSE CALCULATION: If user manually changed Total Brut field, recalculate inputs
    // NOTE: Only do this if the user EXPLICITLY changed manualTotalBrut, not during auto-calculation
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
      setLastChangedField(null); // Clear after processing to stop the chain
      return;
    }

    // REVERSE CALCULATION: If user changed NET À PAYER, work backward
    if (lastChangedField === 'manualNetAPayer' && payslipData.manualNetAPayer !== undefined) {
      const targetNetAPayer = payslipData.manualNetAPayer;
      const chequeRepas = payslipData.chequeRepas || 0;
      const avanceSalaire = payslipData.avanceSalaire || 0;
      const customExpensesSubtract = (payslipData.customExpense1Amount || 0) + (payslipData.customExpense2Amount || 0) + (payslipData.customExpense3Amount || 0);
      const customExpensesAdd = (payslipData.customExpense4Amount || 0) + (payslipData.customExpense5Amount || 0) + (payslipData.customExpense6Amount || 0);

      // Work backward: NET = NET À PAYER + chequeRepas + avanceSalaire + customExpensesSubtract - customExpensesAdd
      const newNet = targetNetAPayer + chequeRepas + avanceSalaire + customExpensesSubtract - customExpensesAdd;

      setPayslipData(prev => ({
        ...prev,
        manualNet: newNet,
      }));
      setLastChangedField(null); // Clear to stop chain reaction
      return;
    }

    // FORWARD CALCULATION: If user manually changed chequeRepas, avanceSalaire, or custom expenses, only recalculate NET À PAYER
    if (lastChangedField === 'chequeRepas' || lastChangedField === 'avanceSalaire' ||
        lastChangedField === 'customExpense1Amount' || lastChangedField === 'customExpense2Amount' || lastChangedField === 'customExpense3Amount' ||
        lastChangedField === 'customExpense4Amount' || lastChangedField === 'customExpense5Amount' || lastChangedField === 'customExpense6Amount') {
      const net = payslipData.manualNet !== undefined
        ? payslipData.manualNet
        : calculated.net;

      const netAPayer = net - (payslipData.chequeRepas || 0) - (payslipData.avanceSalaire || 0)
        - (payslipData.customExpense1Amount || 0) - (payslipData.customExpense2Amount || 0) - (payslipData.customExpense3Amount || 0)
        + (payslipData.customExpense4Amount || 0) + (payslipData.customExpense5Amount || 0) + (payslipData.customExpense6Amount || 0);

      setPayslipData(prev => ({
        ...prev,
        manualNetAPayer: netAPayer,
      }));
      setLastChangedField(null);
      return;
    }

    // FORWARD CALCULATION: If user manually changed IMPÔT, recalculate NET and NET À PAYER
    if (lastChangedField === 'impot') {
      const hoursWorked = payslipData.hoursWorked || 0;
      const hourlyRate = payslipData.hourlyRate || 0;
      const publicHolidayHours = payslipData.publicHolidayHours || 0;
      const overtimeHours = payslipData.overtimeHours || 0;

      const appointement = hoursWorked * hourlyRate;
      const joursFeries = publicHolidayHours * hourlyRate;
      const heuresSuppl = overtimeHours * hourlyRate;
      const heuresSupplPremium = overtimeHours * hourlyRate * 0.40;
      const avantageVehicule = payslipData.avantageVehicule || 0;
      const travailTache = payslipData.travailTache || 0;
      const totalBrut = appointement + joursFeries + avantageVehicule + travailTache;
      const baseForCotisations = totalBrut;
      const baseWithOvertime = totalBrut + heuresSuppl;

      const assuranceMaladie = baseWithOvertime * RATES.assuranceMaladie;
      const majorationEspece = totalBrut * RATES.majoration;
      const assurancePension = totalBrut * RATES.assurancePension;
      const assuranceDependance = Math.max(0, (baseWithOvertime - RATES.dependanceThreshold) * RATES.assuranceDependance);
      const totalCotisation = assuranceMaladie + majorationEspece + assurancePension + assuranceDependance;

      // Fixed tax credit formulas
      const cissm = totalBrut < 1800 ? 0
                  : totalBrut <= 3000 ? 81
                  : totalBrut < 3600 ? (81 / 600 * (3600 - totalBrut))
                  : 0;

      const cisCipCim = totalBrut < 78 ? 0
                      : totalBrut < 936 ? ((300 + (totalBrut * 12 - 936) * 0.029) / 12)
                      : totalBrut <= 3333.33 ? 50
                      : totalBrut <= 6666.67 ? ((600 - (totalBrut * 12 - 40000) * 0.015) / 12)
                      : 0;

      const ciCo2 = totalBrut < 78 ? 0
                  : totalBrut <= 3333.33 ? 16
                  : totalBrut <= 6666.67 ? (16 - (totalBrut - 3333.33) * 0.0048)
                  : 0;

      // Use the manually entered impot value
      const manualImpot = payslipData.impot || 0;

      // Calculate NET using the manual IMPÔT (Excel: D22-D29-D39+D40+D41+D42+D19+D20)
      const net = totalBrut - totalCotisation - manualImpot + cissm + cisCipCim + ciCo2 + heuresSuppl + heuresSupplPremium - avantageVehicule;
      const netAPayer = net - (payslipData.chequeRepas || 0) - (payslipData.avanceSalaire || 0)
        - (payslipData.customExpense1Amount || 0) - (payslipData.customExpense2Amount || 0) - (payslipData.customExpense3Amount || 0)
        + (payslipData.customExpense4Amount || 0) + (payslipData.customExpense5Amount || 0) + (payslipData.customExpense6Amount || 0);

      setPayslipData(prev => ({
        ...prev,
        manualNet: net,
        manualNetAPayer: netAPayer,
      }));
      setLastChangedField(null); // Clear to stop chain reaction
      return;
    }

    // REVERSE CALCULATION: If user changed NET, work backward to Total Brut
    if (lastChangedField === 'manualNet' && payslipData.manualNet !== undefined) {
      const targetNet = payslipData.manualNet;
      const impot = payslipData.impot || 0;
      const avantageVehicule = payslipData.avantageVehicule || 0;

      // Estimate totalBrut through iteration (since credits depend on totalBrut)
      let totalBrut = targetNet; // Initial guess
      for (let i = 0; i < 10; i++) {
        // Fixed tax credit formulas
        const cissm = totalBrut < 1800 ? 0
                    : totalBrut <= 3000 ? 81
                    : totalBrut < 3600 ? (81 / 600 * (3600 - totalBrut))
                    : 0;

        const cisCipCim = totalBrut < 78 ? 0
                        : totalBrut < 936 ? ((300 + (totalBrut * 12 - 936) * 0.029) / 12)
                        : totalBrut <= 3333.33 ? 50
                        : totalBrut <= 6666.67 ? ((600 - (totalBrut * 12 - 40000) * 0.015) / 12)
                        : 0;

        const ciCo2 = totalBrut < 78 ? 0
                    : totalBrut <= 3333.33 ? 16
                    : totalBrut <= 6666.67 ? (16 - (totalBrut - 3333.33) * 0.0048)
                    : 0;

        const assuranceMaladie = totalBrut * RATES.assuranceMaladie;
        const majorationEspece = totalBrut * RATES.majoration;
        const assurancePension = totalBrut * RATES.assurancePension;
        const assuranceDependance = Math.max(0, (totalBrut - RATES.dependanceThreshold) * RATES.assuranceDependance);
        const totalCotisation = assuranceMaladie + majorationEspece + assurancePension + assuranceDependance;

        // Calculate NET using Excel formula: BRUT - Total Cotisation - IMPÔT + Credits - Avantage N (D20-D27-D37+D38+D39+D40-D19)
        const calculatedNet = totalBrut - totalCotisation - impot + cissm + cisCipCim + ciCo2 - avantageVehicule;
        const diff = targetNet - calculatedNet;

        if (Math.abs(diff) < 0.01) break; // Close enough
        totalBrut += diff; // Adjust
      }

      setPayslipData(prev => ({
        ...prev,
        manualTotalBrut: totalBrut,
      }));
      setLastChangedField(null); // Clear to stop chain reaction
      return;
    }

    // FORWARD CALCULATION: Standard calculation from inputs to outputs
    const hoursWorked = payslipData.hoursWorked || 0;
    const hourlyRate = payslipData.hourlyRate || 0;
    const publicHolidayHours = payslipData.publicHolidayHours || 0;
    const holidayHours = payslipData.holidayHours || 0;
    const sickLeaveHours = payslipData.sickLeaveHours || 0;
    const overtimeHours = payslipData.overtimeHours || 0;

    // STEP 1: Calculate base amounts
    const appointement = hoursWorked * hourlyRate;
    const joursFeries = publicHolidayHours * hourlyRate;
    const conges = holidayHours * hourlyRate;
    const maladie = sickLeaveHours * hourlyRate;
    // Overtime: base pay + 40% premium
    const heuresSuppl = overtimeHours * hourlyRate;
    const heuresSupplPremium = overtimeHours * hourlyRate * 0.40;

    // STEP 2: Calculate Total Brut
    // Excel formula: Total brut = Appointement + Jours fériée + Congés + Avantage N + Travail à la tâche
    // NOTE: Heures Suppl are NOT included in Total Brut - they are added directly to NET
    const avantageVehicule = payslipData.avantageVehicule || 0;
    const travailTache = payslipData.travailTache || 0;
    const totalBrut = parseFloat((appointement + joursFeries + avantageVehicule + travailTache).toFixed(2));

    // Base for cotisations = Total Brut (WITHOUT overtime)
    const baseForCotisations = totalBrut;

    // STEP 3: Calculate Cotisations (Social contributions) - Round to 2 decimals
    // Base including overtime for Maladie and Dépendance (Excel: D19+D22)
    const baseWithOvertime = totalBrut + heuresSuppl;

    // Assurance Maladie: =(D19+D22)*B25 (includes overtime!)
    const assuranceMaladie = parseFloat((baseWithOvertime * RATES.assuranceMaladie).toFixed(2));
    // A-M Majoration: =B26*D22 (just Total Brut, no overtime)
    const majorationEspece = parseFloat((totalBrut * RATES.majoration).toFixed(2));
    // Assurance Pension: =B27*D22 (just Total Brut, no overtime)
    const assurancePension = parseFloat((totalBrut * RATES.assurancePension).toFixed(2));
    // Assurance Dépendance: =B28*(D19+D22-675.93) (includes overtime!)
    const assuranceDependance = parseFloat((Math.max(0, (baseWithOvertime - RATES.dependanceThreshold) * RATES.assuranceDependance)).toFixed(2));

    // STEP 4: Total Cotisation
    const totalCotisation = parseFloat((assuranceMaladie + majorationEspece + assurancePension + assuranceDependance).toFixed(2));

    // STEP 5: Calculate Tax Credits FIRST (needed for IMPOSABLE calculation) - Round to 2 decimals
    // CISSM formula from Excel: IF(D20<1800,0,IF(D20<3000,81,IF(D20>3600,0,81/600*(3600-D20))))
    // Fixed: Properly handle all ranges
    const cissm = parseFloat((totalBrut < 1800 ? 0
                : totalBrut <= 3000 ? 81
                : totalBrut < 3600 ? (81 / 600 * (3600 - totalBrut))
                : 0).toFixed(2));

    // CIS/CIP/CIM formula - Fixed to handle all salary ranges correctly
    const cisCipCim = parseFloat((totalBrut < 78 ? 0
                    : totalBrut < 936 ? ((300 + (totalBrut * 12 - 936) * 0.029) / 12)
                    : totalBrut <= 3333.33 ? 50
                    : totalBrut <= 6666.67 ? ((600 - (totalBrut * 12 - 40000) * 0.015) / 12)
                    : 0).toFixed(2));

    // CI-CO2 formula - Fixed to handle all salary ranges correctly
    const ciCo2 = parseFloat((totalBrut < 78 ? 0
                : totalBrut <= 3333.33 ? 16
                : totalBrut <= 6666.67 ? (16 - (totalBrut - 3333.33) * 0.0048)
                : 0).toFixed(2));

    // STEP 6: Calculate Total Imposable (Luxembourg formula from your guide)
    // Excel formula: D20-D23-D24-D25-D30-D31-D32-D33
    // IMPOSABLE = BRUT - MALADIE - MAJORATION - PENSION - FD - AC - FFO - FDS
    // Note: Assurance Dépendance is NOT deducted per Luxembourg tax law
    const totalImposable = parseFloat((totalBrut - assuranceMaladie - majorationEspece - assurancePension -
      (payslipData.fd || 0) - (payslipData.ac || 0) - (payslipData.ffo || 0) - (payslipData.fds || 0)).toFixed(2));

    // STEP 7: Calculate Tax (IMPÔT)
    // IMPORTANT: Use Luxembourg 2025 barème based on tax class for accurate calculation
    // This ensures proper tax calculation for Class 1, 1A, and 2
    let calculatedImpot: number;

    // Always use Luxembourg barème calculation based on tax class
    const taxClass = payslipData.taxClass || '2'; // Default to Class 2 if not set
    calculatedImpot = calculateIncomeTax(totalImposable, taxClass);

    // STEP 8: Calculate NET (Excel formula: D22-D29-D39+D40+D41+D42+D19+D20)
    // NET = BRUT - Total Cotisation - IMPÔT + CISSM + CIS-CIP-CIM + CI-CO2 + Heures Suppl + H-S majorée - Avantage N
    const net = parseFloat((totalBrut - totalCotisation - calculatedImpot + cissm + cisCipCim + ciCo2 + heuresSuppl + heuresSupplPremium - avantageVehicule).toFixed(2));

    // STEP 9: Calculate NET À PAYER (NET - Chèque Repas - Avance Salaire - Custom Expenses 1-3 + Custom Expenses 4-6)
    const netAPayer = parseFloat((net - (payslipData.chequeRepas || 0) - (payslipData.avanceSalaire || 0)
      - (payslipData.customExpense1Amount || 0) - (payslipData.customExpense2Amount || 0) - (payslipData.customExpense3Amount || 0)
      + (payslipData.customExpense4Amount || 0) + (payslipData.customExpense5Amount || 0) + (payslipData.customExpense6Amount || 0)).toFixed(2));

    // Update ALL manual fields with calculated values
    setPayslipData(prev => ({
      ...prev,
      // Update IMPÔT using Luxembourg 2025 barème based on tax class
      impot: calculatedImpot,
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
    // CRITICAL: DO NOT watch any payslipData fields here!
    // Only react when lastChangedField is explicitly set by handleInputChange
    // This prevents recalculation on every keystroke
  ]);

  const calculatePayslip = () => {
    const { hoursWorked, hourlyRate, publicHolidayHours, overtimeHours } = payslipData;

    // Use manual values if set, otherwise calculate
    const appointement = payslipData.manualAppointement !== undefined
      ? payslipData.manualAppointement
      : hoursWorked * hourlyRate;

    const joursFeries = payslipData.manualJoursFeries !== undefined
      ? payslipData.manualJoursFeries
      : publicHolidayHours * hourlyRate;

    // Overtime calculations: base overtime pay + 40% premium
    const heuresSuppl = (overtimeHours || 0) * hourlyRate;
    const heuresSupplPremium = (overtimeHours || 0) * hourlyRate * 0.40;

    const avantageVehicule = payslipData.avantageVehicule || 0;
    const travailTache = payslipData.travailTache || 0;
    const totalBrut = payslipData.manualTotalBrut !== undefined
      ? payslipData.manualTotalBrut
      : appointement + joursFeries + avantageVehicule + travailTache + heuresSuppl + heuresSupplPremium;

    // Base for cotisations = Total Brut (which already includes all earnings)
    const baseForCotisations = totalBrut;

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

    // IMPOSABLE = BRUT - MALADIE - MAJORATION - PENSION - FD - AC - FFO - FDS (Luxembourg formula)
    const totalImposable = payslipData.manualTotalImposable !== undefined
      ? payslipData.manualTotalImposable
      : totalBrut - assuranceMaladie - majorationEspece - assurancePension -
        payslipData.fd - payslipData.ac - payslipData.ffo - payslipData.fds;

    // Calculate IMPÔT: use Luxembourg 2025 barème based on tax class
    const taxClass = payslipData.taxClass || '2'; // Default to Class 2 if not set
    const calculatedImpot = calculateIncomeTax(totalImposable, taxClass);

    // CISSM (Crédit d'Impôt Salaire Minimum) - Fixed formula
    const cissm = payslipData.manualCissm !== undefined
      ? payslipData.manualCissm
      : totalBrut < 1800 ? 0
      : totalBrut <= 3000 ? 81
      : totalBrut < 3600 ? (81 / 600 * (3600 - totalBrut))
      : 0;

    // CIS/CIP/CIM - Fixed formula
    const cisCipCim = payslipData.manualCisCipCim !== undefined
      ? payslipData.manualCisCipCim
      : totalBrut < 78 ? 0
      : totalBrut < 936 ? ((300 + (totalBrut * 12 - 936) * 0.029) / 12)
      : totalBrut <= 3333.33 ? 50
      : totalBrut <= 6666.67 ? ((600 - (totalBrut * 12 - 40000) * 0.015) / 12)
      : 0;

    // CI-CO2 - Fixed formula
    const ciCo2 = payslipData.manualCiCo2 !== undefined
      ? payslipData.manualCiCo2
      : totalBrut < 78 ? 0
      : totalBrut <= 3333.33 ? 16
      : totalBrut <= 6666.67 ? (16 - (totalBrut - 3333.33) * 0.0048)
      : 0;

    // NET = BRUT - Total Cotisation - IMPÔT + CISSM + CIS-CIP-CIM + CI-CO2 (Excel formula)
    const net = payslipData.manualNet !== undefined
      ? payslipData.manualNet
      : totalBrut - totalCotisation - calculatedImpot + cissm + cisCipCim + ciCo2;

    const netAPayer = payslipData.manualNetAPayer !== undefined
      ? payslipData.manualNetAPayer
      : net - payslipData.chequeRepas - payslipData.avanceSalaire
        - (payslipData.customExpense1Amount || 0) - (payslipData.customExpense2Amount || 0) - (payslipData.customExpense3Amount || 0)
        + (payslipData.customExpense4Amount || 0) + (payslipData.customExpense5Amount || 0) + (payslipData.customExpense6Amount || 0);

    const leaveSolde = (payslipData.legalLeave + payslipData.leaveReport) - payslipData.leaveTaken;

    return {
      appointement, joursFeries, heuresSuppl, heuresSupplPremium, totalBrut,
      assuranceMaladie, majorationEspece, assurancePension, assuranceDependance, totalCotisation,
      totalImposable, calculatedImpot, cissm, cisCipCim, ciCo2, net, netAPayer, leaveSolde
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
      const confirmed = window.confirm(t('payslips.unsavedChangesConfirm'));
      if (!confirmed) return;
      setHasUnsavedChanges(false);
    }
    setIsEditMode(!isEditMode);
  };

  const handleSave = async () => {
    if (!personId) return;

    // Force all input fields to blur and save their values before saving
    // This ensures any focused inputs get their values committed
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    // Give a small delay to ensure blur events complete
    await new Promise(resolve => setTimeout(resolve, 50));

    setIsSaving(true);

    // Add timeout protection to prevent stuck saving state
    const saveTimeout = setTimeout(() => {
      setIsSaving(false);
      toast({
        title: t('payslips.saveError'),
        description: 'Save operation timed out. Please try again.',
        variant: "destructive",
        duration: 5000,
      });
    }, 30000); // 30 second timeout

    try {
      const isEmployee = !!employeeId;

      // Determine company ID - employees have direct companyId, individuals don't
      let companyIdToSave = undefined;
      if (isEmployee && employee) {
        companyIdToSave = employee.companyId;
      } else if (company) {
        companyIdToSave = company.id;
      }

      // Helper function to ensure numeric values
      const ensureNumber = (val: any): number => {
        if (typeof val === 'string') {
          return parseFloat(val) || 0;
        }
        return typeof val === 'number' ? val : 0;
      };

      // Prepare the data to save
      const dataToSave = {
        id: payslipId,
        employeeId: isEmployee ? personId : undefined,
        individualId: !isEmployee ? personId : undefined,
        companyId: companyIdToSave,
        periodYear: selectedYear,
        periodMonth: selectedMonth,
        taxRateId: payslipData.taxRateId,
        taxRatePercentage: payslipData.taxRatePercentage,
        employeeNumber: payslipData.employeeNumber,
        indice: payslipData.indice,
        emploi: payslipData.emploi,
        dateEntree: payslipData.dateEntree,
        matriculeAssure: payslipData.matriculeAssure,
        matriculeEmployeur: payslipData.matriculeEmployeur,
        hoursWorked: ensureNumber(payslipData.hoursWorked),
        hourlyRate: ensureNumber(payslipData.hourlyRate),
        holidayHours: ensureNumber(payslipData.holidayHours),
        sickLeaveHours: ensureNumber(payslipData.sickLeaveHours),
        publicHolidayHours: ensureNumber(payslipData.publicHolidayHours),
        overtimeHours: ensureNumber(payslipData.overtimeHours),
        avantageVehicule: ensureNumber(payslipData.avantageVehicule),
        travailTache: ensureNumber(payslipData.travailTache),
        fd: ensureNumber(payslipData.fd),
        ac: ensureNumber(payslipData.ac),
        ffo: ensureNumber(payslipData.ffo),
        fds: ensureNumber(payslipData.fds),
        impot: ensureNumber(payslipData.impot),
        chequeRepas: ensureNumber(payslipData.chequeRepas),
        avanceSalaire: ensureNumber(payslipData.avanceSalaire),
        customExpense1Label: payslipData.customExpense1Label || '',
        customExpense1Amount: ensureNumber(payslipData.customExpense1Amount || 0),
        customExpense2Label: payslipData.customExpense2Label || '',
        customExpense2Amount: ensureNumber(payslipData.customExpense2Amount || 0),
        customExpense3Label: payslipData.customExpense3Label || '',
        customExpense3Amount: ensureNumber(payslipData.customExpense3Amount || 0),
        customExpense4Label: payslipData.customExpense4Label || '',
        customExpense4Amount: ensureNumber(payslipData.customExpense4Amount || 0),
        customExpense5Label: payslipData.customExpense5Label || '',
        customExpense5Amount: ensureNumber(payslipData.customExpense5Amount || 0),
        customExpense6Label: payslipData.customExpense6Label || '',
        customExpense6Amount: ensureNumber(payslipData.customExpense6Amount || 0),
        legalLeave: ensureNumber(payslipData.legalLeave),
        leaveReport: ensureNumber(payslipData.leaveReport),
        leaveTaken: ensureNumber(payslipData.leaveTaken),
        manualAppointement: payslipData.manualAppointement !== undefined ? ensureNumber(payslipData.manualAppointement) : undefined,
        manualJoursFeries: payslipData.manualJoursFeries !== undefined ? ensureNumber(payslipData.manualJoursFeries) : undefined,
        manualTotalBrut: payslipData.manualTotalBrut !== undefined ? ensureNumber(payslipData.manualTotalBrut) : undefined,
        manualAssuranceMaladie: payslipData.manualAssuranceMaladie !== undefined ? ensureNumber(payslipData.manualAssuranceMaladie) : undefined,
        manualMajoration: payslipData.manualMajoration !== undefined ? ensureNumber(payslipData.manualMajoration) : undefined,
        manualAssurancePension: payslipData.manualAssurancePension !== undefined ? ensureNumber(payslipData.manualAssurancePension) : undefined,
        manualAssuranceDependance: payslipData.manualAssuranceDependance !== undefined ? ensureNumber(payslipData.manualAssuranceDependance) : undefined,
        manualTotalCotisation: payslipData.manualTotalCotisation !== undefined ? ensureNumber(payslipData.manualTotalCotisation) : undefined,
        manualTotalImposable: payslipData.manualTotalImposable !== undefined ? ensureNumber(payslipData.manualTotalImposable) : undefined,
        manualCissm: payslipData.manualCissm !== undefined ? ensureNumber(payslipData.manualCissm) : undefined,
        manualCisCipCim: payslipData.manualCisCipCim !== undefined ? ensureNumber(payslipData.manualCisCipCim) : undefined,
        manualCiCo2: payslipData.manualCiCo2 !== undefined ? ensureNumber(payslipData.manualCiCo2) : undefined,
        manualNet: payslipData.manualNet !== undefined ? ensureNumber(payslipData.manualNet) : undefined,
        manualNetAPayer: payslipData.manualNetAPayer !== undefined ? ensureNumber(payslipData.manualNetAPayer) : undefined,
        m1Appointement: payslipData.m1Appointement !== undefined ? ensureNumber(payslipData.m1Appointement) : undefined,
        m1JoursFeries: payslipData.m1JoursFeries !== undefined ? ensureNumber(payslipData.m1JoursFeries) : undefined,
        m1OvertimeHours: payslipData.m1OvertimeHours !== undefined ? ensureNumber(payslipData.m1OvertimeHours) : undefined,
        m1OvertimePremium: payslipData.m1OvertimePremium !== undefined ? ensureNumber(payslipData.m1OvertimePremium) : undefined,
        m1AvantageVehicule: payslipData.m1AvantageVehicule !== undefined ? ensureNumber(payslipData.m1AvantageVehicule) : undefined,
        m1TravailTache: payslipData.m1TravailTache !== undefined ? ensureNumber(payslipData.m1TravailTache) : undefined,
        m1TotalBrut: payslipData.m1TotalBrut !== undefined ? ensureNumber(payslipData.m1TotalBrut) : undefined,
        m1AssuranceMaladie: payslipData.m1AssuranceMaladie !== undefined ? ensureNumber(payslipData.m1AssuranceMaladie) : undefined,
        m1Majoration: payslipData.m1Majoration !== undefined ? ensureNumber(payslipData.m1Majoration) : undefined,
        m1AssurancePension: payslipData.m1AssurancePension !== undefined ? ensureNumber(payslipData.m1AssurancePension) : undefined,
        m1AssuranceDependance: payslipData.m1AssuranceDependance !== undefined ? ensureNumber(payslipData.m1AssuranceDependance) : undefined,
        m1TotalCotisation: payslipData.m1TotalCotisation !== undefined ? ensureNumber(payslipData.m1TotalCotisation) : undefined,
        m1Fd: payslipData.m1FD !== undefined ? ensureNumber(payslipData.m1FD) : undefined,
        m1Ac: payslipData.m1AC !== undefined ? ensureNumber(payslipData.m1AC) : undefined,
        m1Ffo: payslipData.m1FFO !== undefined ? ensureNumber(payslipData.m1FFO) : undefined,
        m1Fds: payslipData.m1FDS !== undefined ? ensureNumber(payslipData.m1FDS) : undefined,
        m1TotalImposable: payslipData.m1TotalImposable !== undefined ? ensureNumber(payslipData.m1TotalImposable) : undefined,
        m1Impot: payslipData.m1Impot !== undefined ? ensureNumber(payslipData.m1Impot) : undefined,
        m1Cissm: payslipData.m1Cissm !== undefined ? ensureNumber(payslipData.m1Cissm) : undefined,
        m1CisCipCim: payslipData.m1CisCipCim !== undefined ? ensureNumber(payslipData.m1CisCipCim) : undefined,
        m1CiCo2: payslipData.m1CiCo2 !== undefined ? ensureNumber(payslipData.m1CiCo2) : undefined,
        m1Net: payslipData.m1Net !== undefined ? ensureNumber(payslipData.m1Net) : undefined,
      };
      // Save to Supabase
      const savedPayslip = await monthlyPayslipService.save(dataToSave);
      // Update the payslip ID if this was a new record
      const isNewPayslip = !payslipId;
      if (savedPayslip.id) {
        setPayslipId(savedPayslip.id);
      }

      // Record edit history for both creation and updates
      if (savedPayslip.id) {
        try {
          if (isNewPayslip) {
            // For new payslips, record creation with no old values
            await recordPayslipEdit(
              savedPayslip.id,
              'monthly',
              null, // No old values for new payslips
              payslipData,
              `Created monthly payslip for ${MONTHS.find(m => m.value === selectedMonth)?.label} ${selectedYear}`
            );
          } else if (originalPayslipData) {
            // For existing payslips, record the update
            await recordPayslipEdit(
              savedPayslip.id,
              'monthly',
              originalPayslipData,
              payslipData,
              `Updated monthly payslip for ${MONTHS.find(m => m.value === selectedMonth)?.label} ${selectedYear}`
            );
          } else {
          }
        } catch (historyError) {
          // Don't fail the save if history recording fails
        }
      }

      // Update original data to current
      setOriginalPayslipData(payslipData);

      setHasUnsavedChanges(false);
      const monthLabel = MONTHS.find(m => m.value === selectedMonth)?.label || selectedMonth;
      toast({
        title: t('payslips.saveSuccessTitle'),
        description: t('payslips.saveSuccessDesc', {
          month: monthLabel,
          year: selectedYear,
          id: savedPayslip.id?.substring(0, 8) + '...'
        }),
        duration: 3000,
      });
    } catch (error: any) {
      clearTimeout(saveTimeout); // Clear timeout on error
      toast({
        title: t('payslips.saveError'),
        description: error.message || t('payslips.saveErrorDesc'),
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      clearTimeout(saveTimeout); // Clear timeout in finally block
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
  const EditableValue = ({ value, manualField, className = "" }: { value: number; manualField: keyof PayslipData; className?: string }) => {
    const storedValue = payslipData[manualField] !== undefined ? (payslipData[manualField] as number) : value;
    const [localValue, setLocalValue] = React.useState<string>(String(storedValue || ''));
    const [isFocused, setIsFocused] = React.useState(false);

    // Update local value when prop changes, but only if not focused
    React.useEffect(() => {
      if (!isFocused) {
        setLocalValue(String(storedValue || ''));
      }
    }, [storedValue, isFocused]);

    // If not in edit mode, show as read-only text
    if (!isEditMode) {
      const displayValue = (value !== undefined && value !== null) ? value : 0;
      return <span className={className}>{displayValue.toFixed(2)} €</span>;
    }

    return (
      <Input
        type="number"
        step="0.01"
        value={localValue}
        onChange={(e) => {
          setLocalValue(e.target.value);
        }}
        onFocus={(e) => {
          setIsFocused(true);
          e.target.select();
        }}
        onBlur={(e) => {
          setIsFocused(false);
          // Convert to number and save
          const numVal = parseFloat(e.target.value) || 0;
          handleInputChange(manualField, numVal);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.currentTarget.blur();
          }
        }}
        className={`h-9 w-full px-2 text-right font-medium ${className} ${autoCalculate ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700' : ''}`}
      />
    );
  };

  // Component for editable input fields (hours, rates)
  const EditableInput = ({ field, value, type = "number", step = "1", className = "" }: { field: keyof PayslipData; value: number | string; type?: string; step?: string; className?: string }) => {
    const [localValue, setLocalValue] = React.useState<string>(String(value || ''));
    const [isFocused, setIsFocused] = React.useState(false);

    // Update local value when prop changes, but only if not focused
    React.useEffect(() => {
      if (!isFocused) {
        setLocalValue(String(value || ''));
      }
    }, [value, isFocused]);

    // If not in edit mode, show as read-only text
    if (!isEditMode) {
      const displayValue = type === "number" ? (typeof value === 'number' ? value.toFixed(2) : (parseFloat(String(value)) || 0).toFixed(2)) : value;
      return <span className="inline-block text-right px-2 py-1 font-medium">{displayValue}</span>;
    }

    return (
      <Input
        type={type}
        step={step}
        value={localValue}
        onChange={(e) => {
          setLocalValue(e.target.value);
        }}
        onFocus={(e) => {
          setIsFocused(true);
          e.target.select();
        }}
        onBlur={(e) => {
          setIsFocused(false);
          // Convert to number and save
          if (type === "number") {
            const numVal = parseFloat(e.target.value) || 0;
            handleInputChange(field, numVal);
          } else {
            handleInputChange(field, e.target.value);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.currentTarget.blur();
          }
        }}
        className={`h-9 w-full px-2 text-right font-medium ${className}`}
      />
    );
  };

  // Component for editable M-1 (previous month) values
  const EditableM1Value = ({ manualField, defaultValue = 0, className = "" }: { manualField: keyof PayslipData; defaultValue?: number; className?: string }) => {
    const storedValue = payslipData[manualField] !== undefined ? payslipData[manualField] as number : defaultValue;
    const [localValue, setLocalValue] = React.useState<string>(String(storedValue || ''));
    const [isFocused, setIsFocused] = React.useState(false);

    // Update local value when prop changes, but only if not focused
    React.useEffect(() => {
      if (!isFocused) {
        setLocalValue(String(storedValue || ''));
      }
    }, [storedValue, isFocused]);

    // If not in edit mode, show as read-only text
    if (!isEditMode) {
      const displayValue = payslipData[manualField] !== undefined ? payslipData[manualField] as number : defaultValue;
      const safeValue = (displayValue !== undefined && displayValue !== null) ? displayValue : 0;
      return <span className={className}>{safeValue.toFixed(2)} €</span>;
    }

    return (
      <Input
        type="number"
        step="0.01"
        value={localValue}
        onChange={(e) => {
          setLocalValue(e.target.value);
        }}
        onFocus={(e) => {
          setIsFocused(true);
          e.target.select();
        }}
        onBlur={(e) => {
          setIsFocused(false);
          // Convert to number and save
          const numVal = parseFloat(e.target.value) || 0;
          handleInputChange(manualField, numVal);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.currentTarget.blur();
          }
        }}
        className={`h-9 w-full px-2 text-right font-medium ${className}`}
      />
    );
  };

  const handleExportPDF = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 10;

    // ===== ADD LOGO =====
    try {
      // Use base64 encoded logo directly - works in both dev and production
      if (logoGroupe && logoGroupe.length > 0) {
        console.log('Adding logo to PDF, length:', logoGroupe.length);
        doc.addImage(logoGroupe, 'PNG', 14, yPos, 50, 18);
        console.log('Logo added successfully');
      } else {
        console.warn('Logo data is empty or undefined');
      }
    } catch (error) {
      console.error('Failed to add logo to PDF:', error);
    }

    // Move down to accommodate the logo
    yPos += 15;

    // ===== TITLE - Centered "DECOMPTE SALAIRE/TRAITEMENT" =====
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('DECOMPTE SALAIRE/TRAITEMENT', pageWidth / 2, yPos, { align: 'center' });

    yPos += 10;

    // ===== EMPLOYEE & COMPANY INFO SECTION =====
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');

    // Left side - Employee info
    doc.text(`N° Salarié : ${payslipData.employeeNumber}`, 14, yPos);
    doc.text(`Indice : ${payslipData.indice}`, 14, yPos + 5);
    doc.text(`Emploi : ${payslipData.emploi}`, 14, yPos + 10);
    doc.text(`Date d'entrée : ${new Date(payslipData.dateEntree).toLocaleDateString('fr-LU')}`, 14, yPos + 15);
    doc.text(`Matricule assuré : ${payslipData.matriculeAssure}`, 14, yPos + 20);
    doc.text(`Matricule employeur : ${payslipData.matriculeEmployeur}`, 14, yPos + 25);
    doc.text(`Période : ${MONTHS.find(m => m.value === selectedMonth)?.label} ${selectedYear}`, 14, yPos + 30);

    // Right side - Company and Employee name
    doc.text(`${company?.name || 'Groupe Advensys Luxembourg S.A'}`, pageWidth - 14, yPos, { align: 'right' });
    doc.text(`${company?.address || 'Duarrefstrooss 49'}`, pageWidth - 14, yPos + 5, { align: 'right' });
    doc.text(`${company?.city || 'L-9964 Huldange'}`, pageWidth - 14, yPos + 10, { align: 'right' });
    doc.text(`${person?.firstName} ${person?.lastName}`, pageWidth - 14, yPos + 20, { align: 'right' });
    if (person?.address) {
      doc.text(`${person.address}`, pageWidth - 14, yPos + 25, { align: 'right' });
    }

    yPos += 37;

    // Amounts in Euros note
    doc.setFontSize(8);
    doc.text('Les montants sont exprimées en Euros.', 14, yPos);
    yPos += 8;

    // ===== MAIN TABLE WITH CUMULATIVE COLUMNS =====
    const cumulM1TotalBrut = payslipData.m1TotalBrut || 0;
    const cumulM1AssuranceMaladie = payslipData.m1AssuranceMaladie || 0;
    const cumulM1Majoration = payslipData.m1Majoration || 0;
    const cumulM1AssurancePension = payslipData.m1AssurancePension || 0;
    const cumulM1AssuranceDependance = payslipData.m1AssuranceDependance || 0;
    const cumulM1TotalCotisation = payslipData.m1TotalCotisation || 0;
    const cumulM1TotalImposable = payslipData.m1TotalImposable || 0;
    const cumulM1Impot = payslipData.m1Impot || 0;
    const cumulM1Cissm = payslipData.m1Cissm || 0;
    const cumulM1CisCipCim = payslipData.m1CisCipCim || 0;
    const cumulM1CiCo2 = payslipData.m1CiCo2 || 0;
    const cumulM1Net = payslipData.m1Net || 0;

    autoTable(doc, {
      startY: yPos,
      head: [
        [
          { content: 'Désignation', styles: { halign: 'left', fontStyle: 'bold' } },
          { content: 'Quantité (heures)', styles: { halign: 'center', fontStyle: 'bold' } },
          { content: 'Valeur', styles: { halign: 'center', fontStyle: 'bold' } },
          { content: 'Total', styles: { halign: 'right', fontStyle: 'bold' } },
          { content: '', styles: { fillColor: [255, 255, 255] } },
          { content: 'Cumuls M-1', styles: { halign: 'right', fontStyle: 'bold' } },
          { content: 'Total', styles: { halign: 'right', fontStyle: 'bold' } },
        ]
      ],
      body: [
        // Empty row for spacing
        ['', '', '', '', '', '', ''],
        // Earnings section
        ['Appointement', payslipData.hoursWorked.toFixed(0), payslipData.hourlyRate.toFixed(4), calculated.appointement.toFixed(2), '', '', ''],
        ...(calculated.joursFeries > 0 ? [['Jours fériée', payslipData.publicHolidayHours.toFixed(0), payslipData.publicHolidayHours > 0 ? payslipData.hourlyRate.toFixed(4) : '0', calculated.joursFeries.toFixed(2), '', '', '']] : []),
        ...(payslipData.holidayHours > 0 ? [['Congés (H)', payslipData.holidayHours.toFixed(0), '0', '0', '', '', '']] : []),
        ...((payslipData.avantageVehicule || 0) > 0 || (payslipData.m1AvantageVehicule || 0) > 0 ? [['Avantage N (Véhic)', '1', '0', (payslipData.avantageVehicule || 0).toFixed(2), '', (payslipData.m1AvantageVehicule || 0).toFixed(2), ((payslipData.avantageVehicule || 0) + (payslipData.m1AvantageVehicule || 0)).toFixed(2)]] : []),
        ...((payslipData.travailTache || 0) > 0 || (payslipData.m1TravailTache || 0) > 0 ? [['Travail à la tâche', '1', '0', (payslipData.travailTache || 0).toFixed(2), '', (payslipData.m1TravailTache || 0).toFixed(2), ((payslipData.travailTache || 0) + (payslipData.m1TravailTache || 0)).toFixed(2)]] : []),
        ...(payslipData.overtimeHours > 0 ? [['Heures Suppl. (H)', payslipData.overtimeHours.toFixed(0), payslipData.overtimeHours > 0 ? payslipData.hourlyRate.toFixed(4) : '0', calculated.heuresSuppl.toFixed(2), '', (payslipData.m1OvertimeHours || 0).toFixed(2), ((calculated.heuresSuppl + calculated.heuresSupplPremium) + (payslipData.m1OvertimeHours || 0) + (payslipData.m1OvertimePremium || 0)).toFixed(2)]] : []),
        ...(payslipData.overtimeHours > 0 ? [['H-S part majorée 40% (H)', payslipData.overtimeHours.toFixed(0), payslipData.overtimeHours > 0 ? (payslipData.hourlyRate * 0.40).toFixed(4) : '0', calculated.heuresSupplPremium.toFixed(2), '', '', '']] : []),
        ...(payslipData.sickLeaveHours > 0 ? [['Absences Maladie (H)', payslipData.sickLeaveHours.toFixed(0), '0', '0', '', '', '']] : []),
        [{ content: 'Total brut', styles: { fontStyle: 'bold' } }, '', '', { content: calculated.totalBrut.toFixed(2), styles: { fontStyle: 'bold' } }, '', { content: cumulM1TotalBrut.toFixed(2), styles: { fontStyle: 'bold' } }, { content: (calculated.totalBrut + cumulM1TotalBrut).toFixed(2), styles: { fontStyle: 'bold' } }],
        // Empty row
        ['', '', '', '', '', '', ''],
        // Contributions section
        [{ content: 'Cotisation', styles: { fontStyle: 'bold' } }, '', '', '', '', '', ''],
        ['Assurance Maladie', RATES.assuranceMaladie.toFixed(4), '', calculated.assuranceMaladie.toFixed(2), '', cumulM1AssuranceMaladie.toFixed(2), (calculated.assuranceMaladie + cumulM1AssuranceMaladie).toFixed(2)],
        ['A-M Majoration espèce', RATES.majoration.toFixed(4), '', calculated.majorationEspece.toFixed(2), '', cumulM1Majoration.toFixed(2), (calculated.majorationEspece + cumulM1Majoration).toFixed(2)],
        ['Assurance Pension', RATES.assurancePension.toFixed(4), '', calculated.assurancePension.toFixed(2), '', cumulM1AssurancePension.toFixed(2), (calculated.assurancePension + cumulM1AssurancePension).toFixed(2)],
        ['Assurance dépendance', RATES.assuranceDependance.toFixed(4), '', calculated.assuranceDependance.toFixed(2), '', cumulM1AssuranceDependance.toFixed(2), (calculated.assuranceDependance + cumulM1AssuranceDependance).toFixed(2)],
        [{ content: 'Total Cotisation', styles: { fontStyle: 'bold' } }, '', '', { content: calculated.totalCotisation.toFixed(2), styles: { fontStyle: 'bold' } }, '', { content: cumulM1TotalCotisation.toFixed(2), styles: { fontStyle: 'bold' } }, { content: (calculated.totalCotisation + cumulM1TotalCotisation).toFixed(2), styles: { fontStyle: 'bold' } }],
        // Empty row
        ['', '', '', '', '', '', ''],
        // Deductions section
        [{ content: 'Deduction', styles: { fontStyle: 'bold' } }, '', '', '', '', '', ''],
        ['FD', '', '', payslipData.fd.toFixed(2), '', '0', payslipData.fd.toFixed(2)],
        ['AC', '', '', payslipData.ac.toFixed(2), '', '0', payslipData.ac.toFixed(2)],
        ['FFO', '', '', payslipData.ffo.toFixed(2), '', '0', payslipData.ffo.toFixed(2)],
        ['FDS', '', '', payslipData.fds.toFixed(2), '', '0', payslipData.fds.toFixed(2)],
        // Empty row
        ['', '', '', '', '', '', ''],
        [{ content: 'Total Imposable', styles: { fontStyle: 'bold' } }, '', '', { content: calculated.totalImposable.toFixed(2), styles: { fontStyle: 'bold' } }, '', { content: cumulM1TotalImposable.toFixed(2), styles: { fontStyle: 'bold' } }, { content: (calculated.totalImposable + cumulM1TotalImposable).toFixed(2), styles: { fontStyle: 'bold' } }],
        // Empty row
        ['', '', '', '', '', '', ''],
        ['IMPOT', '', '', payslipData.impot.toFixed(2), '', cumulM1Impot.toFixed(2), (payslipData.impot + cumulM1Impot).toFixed(2)],
        ['CISSM', '', '', calculated.cissm.toFixed(2), '', cumulM1Cissm.toFixed(2), (calculated.cissm + cumulM1Cissm).toFixed(2)],
        ['CIS-CIP-CIM', '', '', calculated.cisCipCim.toFixed(2), '', cumulM1CisCipCim.toFixed(2), (calculated.cisCipCim + cumulM1CisCipCim).toFixed(2)],
        ['CI-CO2', '', '', calculated.ciCo2.toFixed(2), '', cumulM1CiCo2.toFixed(2), (calculated.ciCo2 + cumulM1CiCo2).toFixed(2)],
        // Empty row
        ['', '', '', '', '', '', ''],
        [{ content: 'NET', styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }, '', '', { content: calculated.net.toFixed(2), styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }, '', { content: cumulM1Net.toFixed(2), styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }, { content: (calculated.net + cumulM1Net).toFixed(2), styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }],
        ...(payslipData.chequeRepas > 0 ? [['Chéque repas', '', '', payslipData.chequeRepas.toFixed(2), '', '', '']] : []),
        ...(payslipData.avanceSalaire > 0 ? [['Avance sur salaire', '', '', payslipData.avanceSalaire.toFixed(2), '', '', '']] : []),
        ...(payslipData.customExpense1Amount ? [[payslipData.customExpense1Label || 'Autre déduction 1', '', '', payslipData.customExpense1Amount.toFixed(2), '', '', '']] : []),
        ...(payslipData.customExpense2Amount ? [[payslipData.customExpense2Label || 'Autre déduction 2', '', '', payslipData.customExpense2Amount.toFixed(2), '', '', '']] : []),
        ...(payslipData.customExpense3Amount ? [[payslipData.customExpense3Label || 'Autre déduction 3', '', '', payslipData.customExpense3Amount.toFixed(2), '', '', '']] : []),
        ...(payslipData.customExpense4Amount ? [[payslipData.customExpense4Label || 'Autre ajout 4', '', '', '', '', payslipData.customExpense4Amount.toFixed(2)]] : []),
        ...(payslipData.customExpense5Amount ? [[payslipData.customExpense5Label || 'Autre ajout 5', '', '', '', '', payslipData.customExpense5Amount.toFixed(2)]] : []),
        ...(payslipData.customExpense6Amount ? [[payslipData.customExpense6Label || 'Autre ajout 6', '', '', '', '', payslipData.customExpense6Amount.toFixed(2)]] : []),
      ],
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 1.5, lineColor: [0, 0, 0], lineWidth: 0.1 },
      headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 48 },
        1: { cellWidth: 22, halign: 'center' },
        2: { cellWidth: 22, halign: 'center' },
        3: { cellWidth: 24, halign: 'right' },
        4: { cellWidth: 6 },
        5: { cellWidth: 24, halign: 'right' },
        6: { cellWidth: 24, halign: 'right' },
      },
    });

    // ===== NET A PAYER - Positioned separately like Excel =====
    const tableEndY = (doc as any).lastAutoTable.finalY;

    // Add 5-6 pixels spacing below the table (≈0.4-0.5 cm) for visual separation
    // This aligns the box horizontally with the NET row while keeping it visually distinct
    const netPayerYPosition = tableEndY + 5;

    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.setFillColor(66, 139, 202);
    doc.setTextColor(255, 255, 255);
    doc.rect(pageWidth - 14 - 50, netPayerYPosition, 50, 8, 'F');
    doc.text('NET A PAYER', pageWidth - 14 - 25, netPayerYPosition + 5, { align: 'center' });
    doc.setFontSize(12);
    doc.text(calculated.netAPayer.toFixed(2), pageWidth - 14 - 25, netPayerYPosition + 11, { align: 'center' });

    // ===== FOOTER SECTION =====
    // Position footer below the NET À PAYER box with proper spacing
    let footerY = netPayerYPosition + 20;

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');

    // Leave information
    doc.text('Congés (H)', 14, footerY);
    doc.setFont(undefined, 'normal');
    doc.text(`Légaux: ${payslipData.legalLeave}`, 14, footerY + 5);
    doc.text(`Report: ${payslipData.leaveReport}`, 14, footerY + 10);
    doc.text(`Pris: ${payslipData.leaveTaken}`, 14, footerY + 15);
    doc.text(`Solde: ${payslipData.legalLeave + payslipData.leaveReport - payslipData.leaveTaken}`, 14, footerY + 20);

    // Remuneration information
    doc.setFont(undefined, 'bold');
    doc.text('Rémunération', 80, footerY);
    doc.setFont(undefined, 'normal');
    doc.text(`Salaire mensuel: ${calculated.appointement.toFixed(2)}`, 80, footerY + 5);
    doc.text(`Heures: ${payslipData.hoursWorked}`, 80, footerY + 10);
    doc.text(`Salaire horaire: ${payslipData.hourlyRate.toFixed(4)}`, 80, footerY + 15);

    // Tax card information
    doc.setFont(undefined, 'bold');
    doc.text('Fiche d\'impôts', pageWidth - 70, footerY);
    doc.setFont(undefined, 'normal');
    if (employee?.taxCardNumber) {
      doc.text(`N° de carte: ${employee.taxCardNumber}`, pageWidth - 70, footerY + 5);
    }
    if (employee?.taxClass) {
      doc.text(`Classe: ${employee.taxClass}`, pageWidth - 70, footerY + 10);
    }
    if (payslipData.taxRatePercentage) {
      doc.text(`Taux: ${payslipData.taxRatePercentage}%`, pageWidth - 70, footerY + 15);
    } else {
      doc.text('Taux: -', pageWidth - 70, footerY + 15);
    }

    footerY += 28;
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text(`Document généré le ${new Date().toLocaleDateString('fr-LU')} à ${new Date().toLocaleTimeString('fr-LU')}`, pageWidth / 2, footerY, { align: 'center' });
    doc.text('Merci', pageWidth / 2, footerY + 4, { align: 'center' });

    doc.save(`Bulletin_Salaire_${person?.lastName}_${MONTHS.find(m => m.value === selectedMonth)?.label}_${selectedYear}.pdf`);
  };

  // Generate years from 2020 to 2050 for flexibility
  const startYear = 2020;
  const endYear = 2050;
  const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => endYear - i);

  if (!personId || !person) {
    return (
      <div className="container mx-auto p-6">
        <Card><CardHeader><CardTitle>{t('payslips.errorTitle')}</CardTitle></CardHeader>
          <CardContent><p className="text-muted-foreground mb-4">{t('payslips.employeeNotFound')}</p>
            <Button onClick={() => navigate(-1)}>{t('common.back')}</Button></CardContent></Card>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="container mx-auto p-4 md:p-6 space-y-6 relative">
      {/* Enhanced Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-start gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mt-1">
              <ArrowLeft className="mr-2 h-4 w-4" />{t('common.back')}
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                <Calendar className="h-7 w-7 md:h-8 md:w-8 text-blue-600" />
                {t('payslips.monthlyPayslip.title')}
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
                {t('common.edit')}
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
                      {t('payslips.saving')}
                    </>
                  ) : hasUnsavedChanges ? (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {t('common.save')}
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      {t('payslips.saved')}
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleEditToggle}
                  size="default"
                  variant="outline"
                  className="shadow-sm border-2"
                >
                  {t('common.cancel')}
                </Button>
              </>
            )}

            {(() => {
              // Debug: Log payslipId at render time
              if (payslipId) {
                return <PayslipHistoryButton payslipId={payslipId} payslipType="monthly" />;
              } else {
                return (
                  <Button variant="outline" size="default" className="gap-2" disabled title="Sauvegardez d'abord pour voir l'historique">
                    <History className="h-4 w-4" />
                    Historique
                  </Button>
                );
              }
            })()}

            <Button onClick={handleExportPDF} size="default" variant="outline" className="shadow-sm">
              <Download className="mr-2 h-4 w-4" />PDF
            </Button>
          </div>
        </div>

        {hasUnsavedChanges && (
          <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 rounded-md border border-amber-200 dark:border-amber-800">
            <span className="h-2 w-2 bg-amber-600 dark:bg-amber-400 rounded-full animate-pulse"></span>
            {t('payslips.unsavedChangesWarning')}
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
              {t('payslips.bidirectionalModeEnabled')}
              <span className="text-xs font-normal bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
                {t('payslips.bidirectionalModeDesc')}
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

      {/* Tax Rate Indicator - Prominent Display */}
      {payslipData.taxRatePercentage !== undefined && (
        <Card className={`shadow-lg border-2 ${
          getTaxRateById(payslipData.taxRateId || '')?.status === 'active'
            ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-400 dark:border-green-600'
            : 'bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-950 dark:to-sky-950 border-blue-400 dark:border-blue-600'
        }`}>
          <CardContent className="py-4 px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`h-16 w-16 rounded-full flex items-center justify-center ${
                  getTaxRateById(payslipData.taxRateId || '')?.status === 'active'
                    ? 'bg-green-500 dark:bg-green-600'
                    : 'bg-blue-500 dark:bg-blue-600'
                } shadow-lg`}>
                  <span className="text-3xl">💰</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Taux d'Imposition
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-4xl font-bold ${
                      getTaxRateById(payslipData.taxRateId || '')?.status === 'active'
                        ? 'text-green-700 dark:text-green-300'
                        : 'text-blue-700 dark:text-blue-300'
                    }`}>
                      {payslipData.taxRatePercentage}%
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      getTaxRateById(payslipData.taxRateId || '')?.status === 'active'
                        ? 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200'
                        : 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200'
                    }`}>
                      {getTaxRateById(payslipData.taxRateId || '')?.status === 'active' ? 'ACTUEL' : 'ARCHIVÉ'}
                    </span>
                  </div>
                  {payslipData.taxRateId && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Effectif depuis: {getTaxRateById(payslipData.taxRateId)?.effectiveFrom
                        ? new Date(getTaxRateById(payslipData.taxRateId)!.effectiveFrom).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                        : 'N/A'}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground mb-1">Identifiant du taux:</p>
                <code className="text-xs bg-black/10 dark:bg-white/10 px-2 py-1 rounded">
                  {payslipData.taxRateId?.substring(0, 16)}...
                </code>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {!payslipData.taxRatePercentage && (
        <Card className="shadow-md border-2 border-yellow-400 dark:border-yellow-600 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950 dark:to-amber-950">
          <CardContent className="py-4 px-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-yellow-500 dark:bg-yellow-600 flex items-center justify-center shadow-lg">
                <span className="text-3xl">⚠️</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-100 uppercase tracking-wide">
                  Taux d'Imposition
                </p>
                <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                  Non Défini
                </p>
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                  Veuillez sélectionner un taux d'imposition pour ce bulletin de paie
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Employee and Company Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="shadow-sm border-l-4 border-l-blue-500">
          <CardHeader className="pb-3 bg-gradient-to-r from-blue-50/50 to-transparent dark:from-blue-950/30">
            <CardTitle className="text-base md:text-lg flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">👤</span>
              </div>
              {t('payslips.monthlyPayslip.employeeInfo')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            {[
              [t('payslips.monthlyPayslip.employeeNumber'), 'employeeNumber', 'text'],
              [t('payslips.monthlyPayslip.index'), 'indice', 'text'],
              [t('payslips.monthlyPayslip.position'), 'emploi', 'text'],
              [t('payslips.monthlyPayslip.hireDate'), 'dateEntree', 'date'],
              [t('payslips.monthlyPayslip.insuredNumber'), 'matriculeAssure', 'text'],
              [t('payslips.monthlyPayslip.employerNumber'), 'matriculeEmployeur', 'text'],
            ].map(([label, field, type]) => (
              <div key={field} className="grid grid-cols-2 gap-3 items-center">
                <Label className="text-xs font-semibold text-muted-foreground">
                  {label}:
                  {field === 'indice' && (
                    <span className="ml-1 text-blue-600 dark:text-blue-400 cursor-help" title="Indice de salaire Luxembourg - Coefficient national d'ajustement au coût de la vie (968.04 = indice actuel)">ℹ️</span>
                  )}
                </Label>
                <EditableInput field={field as keyof PayslipData} value={payslipData[field as keyof PayslipData] as string} type={type as string} className="h-8 text-xs" />
              </div>
            ))}

            {/* Tax Rate Selector */}
            <div className="pt-3 border-t border-border">
              <Label className="text-xs font-semibold text-muted-foreground mb-2 block">Taux de Taxe:</Label>
              {isEditMode ? (
                <TaxRateSelector
                  value={payslipData.taxRateId}
                  onChange={(taxRateId, taxRate) => {
                    setPayslipData(prev => ({
                      ...prev,
                      taxRateId: taxRateId,
                      taxRatePercentage: taxRate.rate
                    }));
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full"
                />
              ) : (
                <div className="text-sm font-medium">
                  {payslipData.taxRatePercentage ? `${payslipData.taxRatePercentage}%` : 'Non défini'}
                  {payslipData.taxRateId && (
                    <span className="text-xs text-muted-foreground ml-2">
                      (ID: {payslipData.taxRateId.substring(0, 8)}...)
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Tax Class Selector */}
            <div className="pt-3 border-t border-border">
              <Label className="text-xs font-semibold text-muted-foreground mb-2 block">Classe d'impôt:</Label>
              {isEditMode ? (
                <Select
                  value={payslipData.taxClass || '2'}
                  onValueChange={(value) => {
                    handleInputChange('taxClass', value);
                  }}
                >
                  <SelectTrigger className="w-full h-8 text-xs">
                    <SelectValue placeholder="Sélectionner la classe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Classe 1 - Célibataire</SelectItem>
                    <SelectItem value="1A">Classe 1A - Célibataire avec enfants</SelectItem>
                    <SelectItem value="2">Classe 2 - Marié(e)/Partenariat</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-sm font-medium">
                  {payslipData.taxClass === '1' && 'Classe 1 - Célibataire'}
                  {payslipData.taxClass === '1A' && 'Classe 1A - Célibataire avec enfants'}
                  {payslipData.taxClass === '2' && 'Classe 2 - Marié(e)/Partenariat'}
                  {!payslipData.taxClass && (employee?.taxClass || '2')}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-green-500">
          <CardHeader className="pb-3 bg-gradient-to-r from-green-50/50 to-transparent dark:from-green-950/30">
            <CardTitle className="text-base md:text-lg flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <span className="text-sm font-bold text-green-600 dark:text-green-400">🏢</span>
              </div>
              {t('payslips.monthlyPayslip.companyInfo')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-4">
            {[
              [t('payslips.monthlyPayslip.company'), company?.name || 'Groupe Advensys Luxembourg S.A'],
              [t('payslips.monthlyPayslip.address'), company?.address || 'Duarrefstrooss 49'],
              [t('payslips.monthlyPayslip.postalCode'), company?.postalCode || 'L-9964'],
              [t('payslips.monthlyPayslip.city'), company?.city || 'Huldange'],
              [t('payslips.monthlyPayslip.country'), company?.country || 'Luxembourg'],
              [t('payslips.monthlyPayslip.fullName'), `${person.firstName} ${person.lastName}`],
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
            {t('payslips.monthlyPayslip.payslipFor', {
              month: MONTHS.find(m => m.value === selectedMonth)?.label,
              year: selectedYear
            })}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 md:p-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-left">{t('payslips.monthlyPayslip.designation')}</TableHead>
                  <TableHead className="text-right whitespace-nowrap">{t('payslips.monthlyPayslip.quantity')}</TableHead>
                  <TableHead className="text-right">{t('payslips.monthlyPayslip.value')}</TableHead>
                  <TableHead className="text-right bg-blue-50/50 dark:bg-blue-950/30">{t('payslips.monthlyPayslip.total')}</TableHead>
                  <TableHead className="text-right whitespace-nowrap">{t('payslips.monthlyPayslip.m1')}</TableHead>
                  <TableHead className="text-right bg-green-50/50 dark:bg-green-950/30">{t('payslips.monthlyPayslip.total')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Salary */}
                <TableRow>
                  <TableCell>{t('payslips.monthlyPayslip.salary')}</TableCell>
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

                {/* Public Holidays */}
                <TableRow>
                  <TableCell>{t('payslips.monthlyPayslip.publicHolidays')}</TableCell>
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

                {/* Holidays & Absences */}
                <TableRow>
                  <TableCell>{t('payslips.monthlyPayslip.holidays')}</TableCell>
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

                {/* Avantage N (Véhic) - Non-cash vehicle benefit */}
                <TableRow>
                  <TableCell>Avantage N (Véhic)</TableCell>
                  <TableCell className="text-right">
                    {isEditMode ? (
                      <span className="inline-block text-right px-2 py-1 font-medium">1</span>
                    ) : (
                      <span className="inline-block text-right px-2 py-1 font-medium">1</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {isEditMode ? (
                      <span className="inline-block text-right px-2 py-1 font-medium">-</span>
                    ) : (
                      <span className="inline-block text-right px-2 py-1 font-medium">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right bg-blue-50/50 dark:bg-blue-950/30">
                    <EditableInput field="avantageVehicule" value={(payslipData.avantageVehicule || 0).toFixed(2)} step="0.01" />
                  </TableCell>
                  <TableCell className="text-right">
                    {isEditMode ? (
                      <EditableM1Value manualField="m1AvantageVehicule" defaultValue={0} />
                    ) : (
                      <span>{(payslipData.m1AvantageVehicule || 0).toFixed(2)} €</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right bg-green-50/50 dark:bg-green-950/30">
                    {((payslipData.avantageVehicule || 0) + (payslipData.m1AvantageVehicule || 0)).toFixed(2)} €
                  </TableCell>
                </TableRow>

                {/* Travail à la tâche - Task work */}
                <TableRow>
                  <TableCell>Travail à la tâche</TableCell>
                  <TableCell className="text-right">
                    {isEditMode ? (
                      <span className="inline-block text-right px-2 py-1 font-medium">1</span>
                    ) : (
                      <span className="inline-block text-right px-2 py-1 font-medium">1</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {isEditMode ? (
                      <span className="inline-block text-right px-2 py-1 font-medium">-</span>
                    ) : (
                      <span className="inline-block text-right px-2 py-1 font-medium">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right bg-blue-50/50 dark:bg-blue-950/30">
                    <EditableInput field="travailTache" value={(payslipData.travailTache || 0).toFixed(2)} step="0.01" />
                  </TableCell>
                  <TableCell className="text-right">
                    {isEditMode ? (
                      <EditableM1Value manualField="m1TravailTache" defaultValue={0} />
                    ) : (
                      <span>{(payslipData.m1TravailTache || 0).toFixed(2)} €</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right bg-green-50/50 dark:bg-green-950/30">
                    {((payslipData.travailTache || 0) + (payslipData.m1TravailTache || 0)).toFixed(2)} €
                  </TableCell>
                </TableRow>

                {/* Overtime */}
                <TableRow>
                  <TableCell>Heures Suppl. (H)</TableCell>
                  <TableCell className="text-right">
                    <EditableInput field="overtimeHours" value={payslipData.overtimeHours} />
                  </TableCell>
                  <TableCell className="text-right">
                    {payslipData.overtimeHours > 0 ? payslipData.hourlyRate.toFixed(4) : '0.0000'}
                  </TableCell>
                  <TableCell className="text-right bg-blue-50/50 dark:bg-blue-950/30">
                    {calculated.heuresSuppl.toFixed(2)} €
                  </TableCell>
                  <TableCell className="text-right">
                    {isEditMode ? (
                      <EditableM1Value manualField="m1OvertimeHours" defaultValue={0} />
                    ) : (
                      <span>{(payslipData.m1OvertimeHours || 0).toFixed(2)} €</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right bg-green-50/50 dark:bg-green-950/30">
                    {((calculated.heuresSuppl + calculated.heuresSupplPremium) + (payslipData.m1OvertimeHours || 0) + (payslipData.m1OvertimePremium || 0)).toFixed(2)} €
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell>H-S part majorée 40% (H)</TableCell>
                  <TableCell className="text-right">
                    {payslipData.overtimeHours.toFixed(0)}
                  </TableCell>
                  <TableCell className="text-right">
                    {payslipData.overtimeHours > 0 ? (payslipData.hourlyRate * 0.40).toFixed(4) : '0.0000'}
                  </TableCell>
                  <TableCell className="text-right bg-blue-50/50 dark:bg-blue-950/30">
                    {calculated.heuresSupplPremium.toFixed(2)} €
                  </TableCell>
                  <TableCell className="text-right">
                  </TableCell>
                  <TableCell className="text-right bg-green-50/50 dark:bg-green-950/30">
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell>{t('payslips.monthlyPayslip.sickLeave')}</TableCell>
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

                {/* Gross Total */}
                <TableRow className="bg-blue-50 dark:bg-blue-950 font-bold">
                  <TableCell className="font-bold">{t('payslips.monthlyPayslip.grossTotal')}</TableCell>
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

                {/* Contributions */}
                <TableRow className="bg-muted/70 font-semibold"><TableCell className="font-semibold" colSpan={6}>{t('payslips.monthlyPayslip.contributions')}</TableCell></TableRow>

                {[
                  [t('payslips.monthlyPayslip.healthInsurance'), RATES.assuranceMaladie, calculated.assuranceMaladie, 'manualAssuranceMaladie', 'm1AssuranceMaladie'],
                  [t('payslips.monthlyPayslip.cashAllowance'), RATES.majoration, calculated.majorationEspece, 'manualMajoration', 'm1Majoration'],
                  [t('payslips.monthlyPayslip.pensionInsurance'), RATES.assurancePension, calculated.assurancePension, 'manualAssurancePension', 'm1AssurancePension'],
                  [t('payslips.monthlyPayslip.dependencyInsurance'), RATES.assuranceDependance, calculated.assuranceDependance, 'manualAssuranceDependance', 'm1AssuranceDependance'],
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
                  <TableCell className="font-bold">{t('payslips.monthlyPayslip.totalContributions')}</TableCell>
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

                {/* Taxable Total */}
                <TableRow className="bg-purple-50 dark:bg-purple-950 font-bold">
                  <TableCell className="font-bold">{t('payslips.monthlyPayslip.taxableTotal')}</TableCell>
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
                  <TableCell className="font-semibold">{t('payslips.monthlyPayslip.tax')}</TableCell>
                  <TableCell className="text-right text-muted-foreground">-</TableCell>
                  <TableCell className="text-right text-muted-foreground">-</TableCell>
                  <TableCell className="text-right bg-blue-50/50 dark:bg-blue-950/30">
                    <EditableInput field="impot" value={payslipData.impot || 0} step="0.01" />
                  </TableCell>
                  <TableCell className="text-right">
                    <EditableM1Value manualField="m1Impot" defaultValue={0} />
                  </TableCell>
                  <TableCell className="text-right bg-green-50/50 dark:bg-green-950/30">
                    {isEditMode ? (
                      <EditableInput field="impot" value={payslipData.impot || 0} step="0.01" />
                    ) : (
                      <span>{(payslipData.impot || 0).toFixed(2)} €</span>
                    )}
                  </TableCell>
                </TableRow>

                {[
                  [t('payslips.monthlyPayslip.taxCredit'), calculated.cissm, 'manualCissm', 'm1Cissm'],
                  [t('payslips.monthlyPayslip.taxCreditCIS'), calculated.cisCipCim, 'manualCisCipCim', 'm1CisCipCim'],
                  [t('payslips.monthlyPayslip.energyCredit'), calculated.ciCo2, 'manualCiCo2', 'm1CiCo2'],
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
                  <TableCell className="py-3 text-base font-bold">{t('payslips.monthlyPayslip.net')}</TableCell>
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
                  [t('payslips.monthlyPayslip.mealVouchers'), 'chequeRepas'],
                  [t('payslips.monthlyPayslip.advance'), 'avanceSalaire'],
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

                {/* Custom Expenses 1-3 (subtracted from total) */}
                {[1, 2, 3].map((num) => {
                  const labelField = `customExpense${num}Label` as keyof PayslipData;
                  const amountField = `customExpense${num}Amount` as keyof PayslipData;
                  const label = payslipData[labelField] as string || '';
                  const amount = payslipData[amountField] as number || 0;

                  return (
                    <TableRow key={`custom${num}`} className="border-b border-border hover:bg-muted/30">
                      <TableCell className="py-2 px-2">
                        {isEditMode ? (
                          <Input
                            type="text"
                            value={label}
                            placeholder={`Autres dépenses ${num}`}
                            onChange={(e) => handleInputChange(labelField, e.target.value)}
                            className="h-7 w-full text-xs"
                          />
                        ) : (
                          <span>{label || `Autres dépenses ${num}`}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right py-2 px-2 text-muted-foreground">-</TableCell>
                      <TableCell className="text-right py-2 px-2 text-muted-foreground">-</TableCell>
                      <TableCell className="text-right py-2 px-2 bg-blue-500/15 dark:bg-blue-500/25">
                        {isEditMode ? (
                          <EditableInput field={amountField} value={amount} step="0.01" className="h-6 w-20 text-right text-xs" />
                        ) : (
                          <span>{amount > 0 ? amount.toFixed(2) : '0'}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right py-2 px-2">
                        <span>-</span>
                      </TableCell>
                      <TableCell className="text-right py-2 px-2 bg-green-500/15 dark:bg-green-500/25">
                        <span>-</span>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {/* Custom Expenses 4-6 (added to net salary) */}
                {[4, 5, 6].map((num) => {
                  const labelField = `customExpense${num}Label` as keyof PayslipData;
                  const amountField = `customExpense${num}Amount` as keyof PayslipData;
                  const label = payslipData[labelField] as string || '';
                  const amount = payslipData[amountField] as number || 0;

                  return (
                    <TableRow key={`custom${num}`} className="border-b border-border hover:bg-muted/30">
                      <TableCell className="py-2 px-2">
                        {isEditMode ? (
                          <Input
                            type="text"
                            value={label}
                            placeholder={`Autres dépenses ${num}`}
                            onChange={(e) => handleInputChange(labelField, e.target.value)}
                            className="h-7 w-full text-xs"
                          />
                        ) : (
                          <span>{label || `Autres dépenses ${num}`}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right py-2 px-2 text-muted-foreground">-</TableCell>
                      <TableCell className="text-right py-2 px-2 text-muted-foreground">-</TableCell>
                      <TableCell className="text-right py-2 px-2">
                        <span>-</span>
                      </TableCell>
                      <TableCell className="text-right py-2 px-2 text-muted-foreground">-</TableCell>
                      <TableCell className="text-right py-2 px-2 bg-green-500/15 dark:bg-green-500/25">
                        {isEditMode ? (
                          <EditableInput field={amountField} value={amount} step="0.01" className="h-6 w-20 text-right text-xs" />
                        ) : (
                          <span>{amount > 0 ? amount.toFixed(2) : '0'}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}

                {/* NET TO PAY */}
                <TableRow className="border-t-2 border-border bg-green-600/30 dark:bg-green-600/40">
                  <TableCell colSpan={4}></TableCell>
                  <TableCell className="text-right py-3 px-2 font-bold text-base text-foreground">{t('payslips.monthlyPayslip.netToPay')}</TableCell>
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
              {t('payslips.monthlyPayslip.holidays')}
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
              ['N° de carte', person?.identityNumber || 'D608388-2022'],
              ['Classe d\'impôt', payslipData.taxClass || employee?.taxClass || '2'],
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
    </PageTransition>
  );
}
