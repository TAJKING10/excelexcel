import type { Earnings, EmployeeContrib, EmployerContrib } from '@/types';

// Luxembourg Social Security Rates (2024) - Based on Advensys Excel
export const LUXEMBOURG_RATES = {
  // Employee contributions
  employee: {
    pension: 0.08, // 8% (Pension) - from Excel formula
    ciCo2: 14, // Fixed amount CI-CO2
  },
  // Employer contributions (from Excel analysis)
  employer: {
    sante: 0.0011, // 0.11% (Santé) - calculated from Excel data
    accident: 0.0075, // 0.75% (Accident insurance) - calculated from Excel data
    pension: 0.08, // 8% matching employee pension
  },
  // Additional employee charges
  cis: 50, // Fixed CIS amount
  cissm: 81, // Fixed CISSM amount (can vary) - matches Excel formula
};

/**
 * Calculate employee health insurance contribution (Maladie)
 * Note: This is employee-specific in the Excel, using formulas like "71.99+6.43"
 * For now, we'll use a default calculation, but this should be overridden per employee
 */
export function calculateMaladie(cotisable: number, customFormula?: string): number {
  if (customFormula) {
    // Evaluate simple formulas like "71.99+6.43"
    try {
      const result = eval(customFormula);
      return parseFloat(result.toFixed(2));
    } catch {
      // Fall back to default
    }
  }
  // Default: use a percentage (this should be configured per employee)
  return parseFloat((cotisable * 0.03).toFixed(2));
}

/**
 * Calculate employee pension contribution
 */
export function calculatePension(cotisable: number): number {
  return parseFloat((cotisable * LUXEMBOURG_RATES.employee.pension).toFixed(2));
}

/**
 * Calculate CI-CO2 contribution
 */
export function calculateCiCo2(): number {
  return LUXEMBOURG_RATES.employee.ciCo2;
}

/**
 * Luxembourg 2025 Tax Brackets - Monthly Withholding (Barème 2025)
 * Based on ACD (Administration des Contributions Directes)
 * Format: [lowerBound, upperBound, rate, deduction]
 */
const TAX_BRACKETS_2025 = {
  // Class 1 - Single
  "1": [
    [0, 2299, 0.0000, 0.0000],
    [2299, 2435, 0.1000, 229.9000],
    [2435, 2580, 0.1125, 259.4625],
    [2580, 2725, 0.1250, 291.0000],
    [2725, 2870, 0.1375, 325.0625],
    [2870, 3030, 0.1500, 362.2500],
    [3030, 3175, 0.1705, 416.5900],
    [3175, 3350, 0.2000, 510.0000],
    [3350, 3515, 0.2200, 577.0000],
    [3515, 3740, 0.2600, 709.6000],
    [3740, 4070, 0.3000, 858.0000],
    [4070, 4460, 0.3500, 1061.5000],
    [4460, 4900, 0.3900, 1239.0000],
    [4900, 5480, 0.4200, 1387.4000],
    [5480, 19660, 0.4200, 1689.8000]
  ],
  // Class 1A - Single with children or other qualifying conditions
  "1A": [
    [0, 2272, 0.0000, 0.0000],
    [2272, 2415, 0.1000, 227.2000],
    [2415, 2560, 0.1125, 257.2125],
    [2560, 2715, 0.1250, 290.0000],
    [2715, 2860, 0.1375, 325.0625],
    [2860, 3030, 0.1500, 362.2500],
    [3030, 3175, 0.1705, 416.5900],
    [3175, 3350, 0.2000, 510.0000],
    [3350, 3515, 0.2200, 577.0000],
    [3515, 3740, 0.2600, 709.6000],
    [3740, 4070, 0.3000, 858.0000],
    [4070, 4460, 0.3500, 1061.5000],
    [4460, 4900, 0.3900, 1239.0000],
    [4900, 5480, 0.4200, 1387.4000],
    [5480, 19640, 0.4200, 1680.7800]
  ],
  // Class 2 - Married/Partnership (from barème 2025 official tables)
  "2": [
    [0, 2290, 0.0000, 0.0000],
    [2295, 2655, 0.0800, 183.2000],
    [2660, 3025, 0.0900, 209.7750],
    [3030, 3390, 0.1000, 240.0250],
    [3395, 3760, 0.1100, 273.9500],
    [3765, 4125, 0.1200, 311.5500],
    [4130, 4510, 0.1400, 394.1000],
    [4515, 4890, 0.1600, 484.3000],
    [4895, 5275, 0.1800, 582.1500],
    [5280, 5655, 0.2000, 687.6500],
    [5660, 6040, 0.2200, 800.8000],
    [6045, 6420, 0.2400, 921.6000],
    [6425, 6805, 0.2600, 1050.0500],
    [6810, 7185, 0.2800, 1186.1500],
    [7190, 7570, 0.3000, 1329.9000],
    [7575, 7950, 0.3200, 1481.3000],
    [7955, 8335, 0.3400, 1640.2500],
    [8340, 8715, 0.3600, 1806.7500],
    [8720, 9100, 0.3800, 1980.8000],
    [9105, 19660, 0.3900, 2071.9000],
    [19665, 29445, 0.4000, 2268.4500]
  ]
};

/**
 * Calculate income tax (IMPÔT) based on Luxembourg 2025 barème
 *
 * Formula: IMPÔT = (RevenuImposable × Taux) − Déduction
 * Then apply:
 * - +7% surcharge if monthly income ≤ 12,585 €
 * - Round to nearest 0.10 €
 * - Floor at 0 (no negative tax)
 *
 * @param revenuImposable - Total Imposable (taxable income)
 * @param taxClass - Tax class: "1", "1A", or "2"
 * @returns Calculated IMPÔT amount
 */
export function calculateIncomeTax(
  revenuImposable: number,
  taxClass: string | number,
  deductions: number = 0 // Keep for backward compatibility but not used in barème
): number {
  // Normalize tax class to string
  let classKey = String(taxClass).toUpperCase().trim();

  // Handle variations (1a, 1A, class 1a, etc.)
  if (classKey.includes('1A') || classKey.includes('1a')) {
    classKey = '1A';
  } else if (classKey.includes('1')) {
    classKey = '1';
  } else if (classKey.includes('2')) {
    classKey = '2';
  } else {
    // Default to Class 1 if unknown
    classKey = '1';
  }

  // Get brackets for this class
  const brackets = TAX_BRACKETS_2025[classKey as keyof typeof TAX_BRACKETS_2025] || TAX_BRACKETS_2025["1"];

  // Find the correct bracket
  let taux = 0;
  let deduction = 0;

  for (const [lowerBound, upperBound, rate, ded] of brackets) {
    if (revenuImposable >= lowerBound && revenuImposable < upperBound) {
      taux = rate;
      deduction = ded;
      break;
    }
  }

  // Calculate base tax
  let impot = revenuImposable * taux - deduction;

  // NOTE: Class 2 uses its own bracket table with different deductions
  // No need to divide by 2 - the brackets already account for joint filing

  // Apply 7% surcharge if income ≤ 12,585 €
  if (revenuImposable <= 12585) {
    impot = impot * 1.07;
  }

  // Round to nearest 0.10 € (multiply by 10, round, divide by 10)
  impot = Math.round(impot * 10) / 10;

  // Floor at 0 (no negative tax)
  impot = Math.max(0, impot);

  return parseFloat(impot.toFixed(2));
}

/**
 * Calculate all employee contributions
 */
export function calculateEmployeeContributions(
  earnings: Earnings,
  taxClass: string | number,
  additionalDeductions: number = 0
): EmployeeContrib {
  const maladie = calculateMaladie(earnings.cotisable);
  const pension = calculatePension(earnings.cotisable);
  const ciCo2 = calculateCiCo2();
  const cis = LUXEMBOURG_RATES.cis;
  const cissm = LUXEMBOURG_RATES.cissm;
  const deductions = additionalDeductions;

  const imposable = earnings.imposable - maladie - pension - ciCo2 - deductions;
  const incomeTax = calculateIncomeTax(imposable, taxClass, deductions);

  const total = maladie + pension + ciCo2 + cis + cissm + deductions + incomeTax;

  return {
    maladie,
    pension,
    ciCo2,
    cis,
    cissm,
    deductions,
    incomeTax,
    total: parseFloat(total.toFixed(2)),
  };
}

/**
 * Calculate all employer contributions
 * Based on Excel formulas from Advensys
 */
export function calculateEmployerContributions(
  cotisable: number,
  employeeMaladie: number = 0
): EmployerContrib {
  // Employer contributions match employee for pension
  const pension = parseFloat((cotisable * LUXEMBOURG_RATES.employer.pension).toFixed(2));

  // Maladie: employer contribution equals employee contribution (from Excel analysis)
  const maladie = employeeMaladie;

  // Santé: 0.11% of cotisable
  const sante = parseFloat((cotisable * LUXEMBOURG_RATES.employer.sante).toFixed(2));

  // Accident: 0.75% of cotisable
  const accident = parseFloat((cotisable * LUXEMBOURG_RATES.employer.accident).toFixed(2));

  const socialSecurityTotal = maladie + pension + sante + accident;

  return {
    maladie,
    pension,
    sante,
    accident,
    socialSecurityTotal: parseFloat(socialSecurityTotal.toFixed(2)),
  };
}

/**
 * Calculate net pay
 */
export function calculateNetPay(
  grossMonthly: number,
  employeeContrib: EmployeeContrib
): number {
  const netPay = grossMonthly - employeeContrib.total;
  return parseFloat(netPay.toFixed(2));
}

/**
 * Calculate complete payslip amounts
 */
export interface PayslipCalculationInput {
  remunerationBase: number;
  taxClass: string | number;
  additionalDeductions?: number;
}

export interface PayslipCalculationResult {
  earnings: Earnings;
  employeeContrib: EmployeeContrib;
  employerContrib: EmployerContrib;
  netPay: number;
}

export function calculatePayslip(
  input: PayslipCalculationInput
): PayslipCalculationResult {
  // In Luxembourg, typically:
  // Brut Mensuel = Rémun. Base
  // Cotisable = Brut Mensuel (from Excel: Cotisable (G) = Brut Mensuel (F))
  // Imposable = Cotisable (before deductions)

  const earnings: Earnings = {
    remunerationBase: input.remunerationBase,
    grossMonthly: input.remunerationBase,
    cotisable: input.remunerationBase, // G = F
    imposable: input.remunerationBase,
  };

  const employeeContrib = calculateEmployeeContributions(
    earnings,
    input.taxClass,
    input.additionalDeductions || 0
  );

  const employerContrib = calculateEmployerContributions(
    earnings.cotisable,
    employeeContrib.maladie
  );

  const netPay = calculateNetPay(earnings.grossMonthly, employeeContrib);

  return {
    earnings,
    employeeContrib,
    employerContrib,
    netPay,
  };
}

/**
 * Format currency for Luxembourg (EUR)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-LU', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Parse month name to number
 */
export function parseMonthName(monthName: string): number {
  const monthMap: { [key: string]: number } = {
    'J': 1, 'JAN': 1, 'JANVIER': 1, 'JANUARY': 1,
    'F': 2, 'FEB': 2, 'FÉVRIER': 2, 'FEVRIER': 2, 'FEBRUARY': 2,
    'M': 3, 'MAR': 3, 'MARS': 3, 'MARCH': 3,
    'A': 4, 'APR': 4, 'AVRIL': 4, 'APRIL': 4,
    'MAI': 5, 'MAY': 5,
    'JUN': 6, 'JUIN': 6, 'JUNE': 6,
    'JUL': 7, 'JUILLET': 7, 'JULY': 7,
    'AOU': 8, 'AOÛT': 8, 'AOUT': 8, 'AUG': 8, 'AUGUST': 8,
    'S': 9, 'SEP': 9, 'SEPTEMBRE': 9, 'SEPTEMBER': 9,
    'O': 10, 'OCT': 10, 'OCTOBRE': 10, 'OCTOBER': 10,
    'N': 11, 'NOV': 11, 'NOVEMBRE': 11, 'NOVEMBER': 11,
    'D': 12, 'DEC': 12, 'DÉCEMBRE': 12, 'DECEMBRE': 12, 'DECEMBER': 12,
  };

  const normalized = monthName.trim().toUpperCase();
  return monthMap[normalized] || 1;
}

/**
 * Get month abbreviation
 */
export function getMonthAbbreviation(month: number): string {
  const months = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
  return months[month - 1] || 'J';
}

/**
 * Get full month name in French
 */
export function getMonthNameFr(month: number): string {
  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  return months[month - 1] || 'Janvier';
}

/**
 * Calculate annual totals from monthly payslips
 */
export interface AnnualTotals {
  totalGross: number;
  totalNet: number;
  totalEmployeeContrib: number;
  totalEmployerContrib: number;
  totalTax: number;
  totalHours: {
    normal: number;
    supplementary: number;
    holidays: number;
    publicHolidayExtra: number;
    familyLeave: number;
    paternityLeave: number;
    sickLeave: number;
    unemployment: number;
  };
}

export function calculateAnnualTotals(payslips: PayslipCalculationResult[]): AnnualTotals {
  const totals: AnnualTotals = {
    totalGross: 0,
    totalNet: 0,
    totalEmployeeContrib: 0,
    totalEmployerContrib: 0,
    totalTax: 0,
    totalHours: {
      normal: 0,
      supplementary: 0,
      holidays: 0,
      publicHolidayExtra: 0,
      familyLeave: 0,
      paternityLeave: 0,
      sickLeave: 0,
      unemployment: 0,
    },
  };

  payslips.forEach(payslip => {
    totals.totalGross += payslip.earnings.grossMonthly;
    totals.totalNet += payslip.netPay;
    totals.totalEmployeeContrib += payslip.employeeContrib.total;
    totals.totalEmployerContrib += payslip.employerContrib.socialSecurityTotal;
    totals.totalTax += payslip.employeeContrib.incomeTax;
  });

  return totals;
}

/**
 * Get days in month for a given year
 */
export function getDaysInMonth(month: number, year: number): string {
  const lastDay = new Date(year, month, 0).getDate();
  return `1-${lastDay}`;
}

/**
 * Generate monthly payslip data for a full year
 */
export interface GenerateAnnualPayslipInput {
  employeeId: string;
  year: number;
  baseSalary: number;
  taxClass: string | number;
  additionalDeductions?: number;
  maladieFormula?: string;
  workingHoursPerMonth?: number;
}

import type { MonthlyPayslipData, AnnualPayslip, Employee, Company } from '@/types';

// Social contributions rates (Luxembourg) - matching MonthlyPayslipPage.tsx
// Updated to match 2024/2025 Excel "Livre de Paie"
const RATES = {
  assuranceMaladie: 0.028, // 2.80% - matches Excel Sept 2025 (90.84 / 3244.40)
  majoration: 0.0025, // 0.25% - matches Excel (8.11 / 3244.40)
  assurancePension: 0.08, // 8.00% - matches Excel (259.55 / 3244.40)
  assuranceDependance: 0.014, // 1.40% - matches Excel (35.96 / (3244.40 - 675.93))
  dependanceThreshold: 675.93,
};

/**
 * Calculate monthly payslip with date-based tax rate
 * This matches the logic in MonthlyPayslipPage.tsx
 */
export function calculateMonthlyWithTaxRate(
  grossSalary: number,
  taxRatePercentage: number,
  month: number,
  year: number
): PayslipCalculationResult {
  // STEP 1: Calculate social contributions
  const assuranceMaladie = grossSalary * RATES.assuranceMaladie;
  const majorationEspece = grossSalary * RATES.majoration;
  const assurancePension = grossSalary * RATES.assurancePension;
  const assuranceDependance = Math.max(0, (grossSalary - RATES.dependanceThreshold) * RATES.assuranceDependance);

  const totalCotisation = assuranceMaladie + majorationEspece + assurancePension + assuranceDependance;

  // Fixed deduction amount from Excel (used for taxable income calculation only, not subtracted from net)
  const deductions = 74.25;

  // STEP 2: Calculate imposable (taxable income)
  // IMPOSABLE = COTISABLE - MALADIE - PENSION - DEDUCTIONS [Excel 2024 formula: 2570.93 - 78.42 - 205.67 - 74.25 = 2212.59]
  const totalImposable = grossSalary - assuranceMaladie - assurancePension - deductions;

  // STEP 3: Calculate tax using the provided tax rate
  const calculatedImpot = totalImposable * (taxRatePercentage / 100);

  // STEP 4: Calculate tax credits - Updated to match Excel 2024
  // These are TAX CREDITS that reduce the tax amount, not deductions from gross
  // CISSM formula from Excel: IF(D20<1800,0,IF(D20<3000,81,IF(D20>3600,0,81/600*(3600-D20))))
  const cissm = grossSalary < 1800 ? 0 : grossSalary <= 3000 ? 81 : grossSalary >= 3600 ? 0 : 81 / 600 * (3600 - grossSalary);
  const cisCipCim = grossSalary < 78 ? 0 : grossSalary < 936 ? ((300 + (grossSalary * 12 - 936) * 0.029) / 12) : grossSalary < 3333.33 ? 50 : grossSalary > 6666.5 ? 0 : ((600 - (grossSalary * 12 - 40000) * 0.015) / 12);
  const ciCo2 = grossSalary < 78 ? 0 : grossSalary < 3333.33 ? 16 : grossSalary < 6667 ? (16 - (grossSalary - 3333.33) * 0.0042) : 0;

  // STEP 5: Calculate final tax after credits
  const finalTax = Math.max(0, calculatedImpot - cisCipCim - ciCo2 - cissm);

  // STEP 6: Calculate NET (Excel 2024 formula)
  // NET = Brut Mensuel - (Maladie + Pension + Final Tax after credits)
  // Note: Deductions are used to calculate imposable but not subtracted from net
  const net = grossSalary - (assuranceMaladie + assurancePension + finalTax);

  const earnings: Earnings = {
    remunerationBase: grossSalary,
    grossMonthly: grossSalary,
    cotisable: grossSalary,
    imposable: totalImposable,
  };

  const employeeContrib: EmployeeContrib = {
    maladie: parseFloat(assuranceMaladie.toFixed(2)),
    pension: parseFloat(assurancePension.toFixed(2)),
    ciCo2: parseFloat(ciCo2.toFixed(2)),
    cis: parseFloat(cisCipCim.toFixed(2)),
    cissm: parseFloat(cissm.toFixed(2)),
    deductions: deductions, // Fixed monthly deduction (Excel 2024) - used for taxable calc only
    incomeTax: parseFloat(calculatedImpot.toFixed(2)),
    total: parseFloat((assuranceMaladie + assurancePension + finalTax).toFixed(2)),
  };

  const employerContrib: EmployerContrib = {
    maladie: parseFloat(assuranceMaladie.toFixed(2)),
    pension: parseFloat(assurancePension.toFixed(2)),
    sante: parseFloat((grossSalary * LUXEMBOURG_RATES.employer.sante).toFixed(2)),
    accident: parseFloat((grossSalary * LUXEMBOURG_RATES.employer.accident).toFixed(2)),
    socialSecurityTotal: parseFloat((assuranceMaladie + assurancePension + (grossSalary * LUXEMBOURG_RATES.employer.sante) + (grossSalary * LUXEMBOURG_RATES.employer.accident)).toFixed(2)),
  };

  return {
    earnings,
    employeeContrib,
    employerContrib,
    netPay: parseFloat(net.toFixed(2)),
  };
}

export function generateAnnualPayslip(
  input: GenerateAnnualPayslipInput,
  employee: Employee,
  company: Company,
  getTaxRateForDate?: (date: string) => { rate: number; id: string } | undefined
): AnnualPayslip {
  const monthlyData: MonthlyPayslipData[] = [];
  let annualTotalsEarnings = { remunerationBase: 0, grossMonthly: 0, cotisable: 0, imposable: 0 };
  let annualTotalsEmployeeContrib = { maladie: 0, pension: 0, ciCo2: 0, cis: 0, cissm: 0, deductions: 0, incomeTax: 0, total: 0 };
  let annualTotalsEmployerContrib = { maladie: 0, pension: 0, sante: 0, accident: 0, socialSecurityTotal: 0 };
  let annualTotalsNetPay = 0;
  let annualTotalsWorkingHours = {
    normalHours: 0,
    supplementaryHours: 0,
    holidays: 0,
    publicHolidayExtra: 0,
    familyLeave: 0,
    paternityLeave: 0,
    sickLeave: 0,
    unemployment: 0
  };

  // Generate payslip for each month (1-12)
  for (let month = 1; month <= 12; month++) {
    // Get date-based tax rate for this month
    const payslipDate = new Date(input.year, month - 1, 1).toISOString();
    const applicableTaxRate = getTaxRateForDate ? getTaxRateForDate(payslipDate) : undefined;

    // Use Excel-matching tax rates if no tax rate found in database
    // January: 6.137603% (135.80/2212.59), Feb-Dec: 5.744399% (127.10/2212.59)
    let taxRatePercentage = applicableTaxRate?.rate || 21; // Default to 21% if not found

    // Override with exact Excel tax rates for 2024 and 2025 if no tax rate found
    if ((input.year === 2024 || input.year === 2025) && !applicableTaxRate) {
      taxRatePercentage = month === 1 ? 6.137603 : 5.744399;
    }

    const payslip = calculateMonthlyWithTaxRate(
      input.baseSalary,
      taxRatePercentage,
      month,
      input.year
    );

    const monthData: MonthlyPayslipData = {
      monthName: getMonthAbbreviation(month),
      monthNumber: month,
      days: getDaysInMonth(month, input.year),
      daysImposable: new Date(input.year, month, 0).getDate(), // Days in month
      status: 'Empl.', // Employment status
      taxClass: input.taxClass,
      earnings: payslip.earnings,
      employeeContrib: payslip.employeeContrib,
      workingHours: {
        normalHours: input.workingHoursPerMonth || 173,
        supplementaryHours: 0,
        holidays: 0,
        publicHolidayExtra: 0,
        familyLeave: 0,
        paternityLeave: 0,
        sickLeave: 0,
        unemployment: 0
      },
      netPay: payslip.netPay
    };

    monthlyData.push(monthData);

    // Add to annual totals
    annualTotalsEarnings.remunerationBase += payslip.earnings.remunerationBase;
    annualTotalsEarnings.grossMonthly += payslip.earnings.grossMonthly;
    annualTotalsEarnings.cotisable += payslip.earnings.cotisable;
    annualTotalsEarnings.imposable += payslip.earnings.imposable;

    annualTotalsEmployeeContrib.maladie += payslip.employeeContrib.maladie;
    annualTotalsEmployeeContrib.pension += payslip.employeeContrib.pension;
    annualTotalsEmployeeContrib.ciCo2 += payslip.employeeContrib.ciCo2;
    annualTotalsEmployeeContrib.cis += payslip.employeeContrib.cis;
    annualTotalsEmployeeContrib.cissm += payslip.employeeContrib.cissm;
    annualTotalsEmployeeContrib.deductions += payslip.employeeContrib.deductions;
    annualTotalsEmployeeContrib.incomeTax += payslip.employeeContrib.incomeTax;
    annualTotalsEmployeeContrib.total += payslip.employeeContrib.total;

    annualTotalsEmployerContrib.maladie += payslip.employerContrib.maladie;
    annualTotalsEmployerContrib.pension += payslip.employerContrib.pension;
    annualTotalsEmployerContrib.sante += payslip.employerContrib.sante;
    annualTotalsEmployerContrib.accident += payslip.employerContrib.accident;
    annualTotalsEmployerContrib.socialSecurityTotal += payslip.employerContrib.socialSecurityTotal;

    annualTotalsNetPay += payslip.netPay;

    annualTotalsWorkingHours.normalHours += monthData.workingHours.normalHours;
  }

  // Round all annual totals
  annualTotalsEarnings.remunerationBase = parseFloat(annualTotalsEarnings.remunerationBase.toFixed(2));
  annualTotalsEarnings.grossMonthly = parseFloat(annualTotalsEarnings.grossMonthly.toFixed(2));
  annualTotalsEarnings.cotisable = parseFloat(annualTotalsEarnings.cotisable.toFixed(2));
  annualTotalsEarnings.imposable = parseFloat(annualTotalsEarnings.imposable.toFixed(2));

  annualTotalsEmployeeContrib.maladie = parseFloat(annualTotalsEmployeeContrib.maladie.toFixed(2));
  annualTotalsEmployeeContrib.pension = parseFloat(annualTotalsEmployeeContrib.pension.toFixed(2));
  annualTotalsEmployeeContrib.ciCo2 = parseFloat(annualTotalsEmployeeContrib.ciCo2.toFixed(2));
  annualTotalsEmployeeContrib.cis = parseFloat(annualTotalsEmployeeContrib.cis.toFixed(2));
  annualTotalsEmployeeContrib.cissm = parseFloat(annualTotalsEmployeeContrib.cissm.toFixed(2));
  annualTotalsEmployeeContrib.deductions = parseFloat(annualTotalsEmployeeContrib.deductions.toFixed(2));
  annualTotalsEmployeeContrib.incomeTax = parseFloat(annualTotalsEmployeeContrib.incomeTax.toFixed(2));
  annualTotalsEmployeeContrib.total = parseFloat(annualTotalsEmployeeContrib.total.toFixed(2));

  annualTotalsEmployerContrib.maladie = parseFloat(annualTotalsEmployerContrib.maladie.toFixed(2));
  annualTotalsEmployerContrib.pension = parseFloat(annualTotalsEmployerContrib.pension.toFixed(2));
  annualTotalsEmployerContrib.sante = parseFloat(annualTotalsEmployerContrib.sante.toFixed(2));
  annualTotalsEmployerContrib.accident = parseFloat(annualTotalsEmployerContrib.accident.toFixed(2));
  annualTotalsEmployerContrib.socialSecurityTotal = parseFloat(annualTotalsEmployerContrib.socialSecurityTotal.toFixed(2));

  annualTotalsNetPay = parseFloat(annualTotalsNetPay.toFixed(2));

  return {
    id: `annual-${input.employeeId}-${input.year}`,
    employeeId: input.employeeId,
    companyId: employee.companyId,
    year: input.year,
    employee: {
      id: employee.id,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      class: employee.class,
      hireDate: employee.hireDate,
      terminationDate: employee.terminationDate,
      matricule: employee.matricule,
      identityNumber: employee.identityNumber,
      address: employee.address,
      city: employee.city,
      postalCode: employee.postalCode,
      anciennete: employee.hireDate
    },
    company: {
      id: company.id,
      name: company.name,
      country: company.country,
      currency: company.currency
    },
    monthlyData,
    annualTotals: {
      earnings: annualTotalsEarnings,
      employeeContrib: annualTotalsEmployeeContrib,
      employerContrib: annualTotalsEmployerContrib,
      workingHours: annualTotalsWorkingHours,
      netPay: annualTotalsNetPay
    },
    recapitulation: {
      totalHoursWorked: annualTotalsWorkingHours.normalHours,
      totalGrossSalary: annualTotalsEarnings.grossMonthly,
      totalNetSalary: annualTotalsNetPay,
      totalEmployeeContributions: annualTotalsEmployeeContrib.total,
      totalEmployerContributions: annualTotalsEmployerContrib.socialSecurityTotal,
      totalTaxes: annualTotalsEmployeeContrib.incomeTax
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}
