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
  cissm: 70, // Fixed CISSM amount (can vary)
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
// Updated to match 2024 Excel "Livre de Paie"
const RATES = {
  assuranceMaladie: 0.0305026, // 3.05026% - matches Excel exactly (78.42/2570.93 = 0.0305026)
  majoration: 0.0025,
  assurancePension: 0.08, // 8% - matches Excel (205.67/2570.93)
  assuranceDependance: 0.014,
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

  // Fixed deduction amount from Excel
  const deductions = 74.25;

  // STEP 2: Calculate imposable (taxable income)
  // IMPOSABLE = COTISABLE - MALADIE - PENSION - DEDUCTIONS [Excel 2024 formula: 2570.93 - 78.42 - 205.67 - 74.25 = 2212.59]
  const totalImposable = grossSalary - assuranceMaladie - assurancePension - deductions;

  // STEP 3: Calculate tax using the provided tax rate
  const calculatedImpot = totalImposable * (taxRatePercentage / 100);

  console.log(`📅 Annual Payslip - ${year}-${month.toString().padStart(2, '0')}:`, {
    grossSalary,
    taxRatePercentage,
    totalImposable: totalImposable.toFixed(2),
    calculatedImpot: calculatedImpot.toFixed(2),
  });

  // STEP 4: Calculate tax credits - Updated to match Excel 2024
  const cissm = grossSalary < 1800 ? 0 : grossSalary <= 3000 ? 70 : grossSalary >= 3600 ? 0 : 70 / 600 * (3600 - grossSalary);
  const cisCipCim = grossSalary < 78 ? 0 : grossSalary < 936 ? ((300 + (grossSalary * 12 - 936) * 0.029) / 12) : grossSalary < 3333.33 ? 50 : grossSalary > 6666.5 ? 0 : ((600 - (grossSalary * 12 - 40000) * 0.015) / 12);
  const ciCo2 = grossSalary < 78 ? 0 : grossSalary < 3333.33 ? 14 : grossSalary < 6667 ? (14 - (grossSalary - 3333.33) * 0.0042) : 0;

  // STEP 5: Calculate NET (Excel 2024 formula)
  // NET = Imposable - Impôt + CISSM - CIS - CI-CO2 [CISSM is added back as credit]
  const net = totalImposable - calculatedImpot + cissm - cisCipCim - ciCo2;

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
    deductions: deductions, // Fixed monthly deduction (Excel 2024)
    incomeTax: parseFloat(calculatedImpot.toFixed(2)),
    total: parseFloat((assuranceMaladie + assurancePension + ciCo2 + cisCipCim + deductions + calculatedImpot).toFixed(2)),
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
    const taxRatePercentage = applicableTaxRate?.rate || 21; // Default to 21% if not found

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
