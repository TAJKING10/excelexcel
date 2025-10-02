import type { Earnings, EmployeeContrib, EmployerContrib } from '@/types';

// Luxembourg Social Security Rates (2024)
export const LUXEMBOURG_RATES = {
  // Employee contributions
  employee: {
    maladie: 0.0305, // 3.05% (Health insurance)
    pension: 0.08, // 8% (Pension)
    ciCo2: 14, // Fixed amount CI-CO2
  },
  // Employer contributions
  employer: {
    maladie: 0.0305, // 3.05%
    pension: 0.08, // 8%
    sante: 0.04, // 4% (Santé - additional health)
    accident: 0.01, // 1% (Accident insurance)
  },
  // Additional employee charges
  cis: 50, // Fixed CIS amount
  cissm: 70, // Fixed CISSM amount (can vary)
};

/**
 * Calculate employee health insurance contribution (Maladie)
 */
export function calculateMaladie(cotisable: number): number {
  return parseFloat((cotisable * LUXEMBOURG_RATES.employee.maladie).toFixed(2));
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
 * Calculate income tax based on Luxembourg tax classes
 * This is a simplified calculation - real tax calculation is more complex
 */
export function calculateIncomeTax(
  imposable: number,
  taxClass: string | number,
  deductions: number = 0
): number {
  const taxableIncome = imposable - deductions;

  // Convert tax class to numeric
  let taxRate = 0;
  let fixedDeduction = 0;

  // Parse tax class (e.g., "15% - 2" or just 1, 2, etc.)
  if (typeof taxClass === 'string') {
    const percentMatch = taxClass.match(/(\d+(?:\.\d+)?)%/);
    if (percentMatch) {
      taxRate = parseFloat(percentMatch[1]) / 100;
    } else if (taxClass.includes('0.15')) {
      taxRate = 0.15;
    } else {
      // Try to extract number for tax class
      const classNum = parseInt(taxClass);
      if (!isNaN(classNum)) {
        taxRate = getTaxRateForClass(classNum, taxableIncome);
      }
    }
  } else {
    taxRate = getTaxRateForClass(taxClass, taxableIncome);
  }

  const tax = Math.max(0, taxableIncome * taxRate - fixedDeduction);
  return parseFloat(tax.toFixed(2));
}

/**
 * Get tax rate based on tax class and income
 * Simplified Luxembourg tax brackets (2024)
 */
function getTaxRateForClass(taxClass: number, income: number): number {
  // Tax class 1 (Single)
  if (taxClass === 1) {
    if (income <= 12000) return 0;
    if (income <= 20000) return 0.08;
    if (income <= 30000) return 0.10;
    if (income <= 40000) return 0.12;
    if (income <= 50000) return 0.14;
    if (income <= 60000) return 0.16;
    if (income <= 100000) return 0.18;
    if (income <= 150000) return 0.20;
    if (income <= 200000) return 0.22;
    return 0.42;
  }

  // Tax class 2 (Married/Partnership)
  if (taxClass === 2) {
    if (income <= 24000) return 0;
    if (income <= 40000) return 0.08;
    if (income <= 60000) return 0.10;
    if (income <= 80000) return 0.12;
    if (income <= 100000) return 0.14;
    if (income <= 120000) return 0.16;
    if (income <= 200000) return 0.18;
    if (income <= 300000) return 0.20;
    if (income <= 400000) return 0.22;
    return 0.42;
  }

  // Default fallback
  return 0.15;
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
 */
export function calculateEmployerContributions(
  cotisable: number
): EmployerContrib {
  const maladie = parseFloat((cotisable * LUXEMBOURG_RATES.employer.maladie).toFixed(2));
  const pension = parseFloat((cotisable * LUXEMBOURG_RATES.employer.pension).toFixed(2));
  const sante = parseFloat((cotisable * LUXEMBOURG_RATES.employer.sante).toFixed(2));
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
  // Cotisable = Brut Mensuel
  // Imposable = Cotisable (before deductions)

  const earnings: Earnings = {
    remunerationBase: input.remunerationBase,
    grossMonthly: input.remunerationBase,
    cotisable: input.remunerationBase,
    imposable: input.remunerationBase,
  };

  const employeeContrib = calculateEmployeeContributions(
    earnings,
    input.taxClass,
    input.additionalDeductions || 0
  );

  const employerContrib = calculateEmployerContributions(earnings.cotisable);

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
