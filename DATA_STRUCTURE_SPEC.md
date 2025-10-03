# Data Structure Specification for Payslip System

## Overview
This document defines the data structures needed to implement an automated payslip generation system based on the Luxembourg payroll Excel format.

---

## 1. EMPLOYEE PROFILE

### Employee Master Record

```typescript
interface Employee {
  // Primary identifiers
  employeeId: string;                    // Internal system ID (UUID)
  employeeNumber: string;                // Display number (e.g., "N° 1")
  matricule: string;                     // Social security number (e.g., "1989 11 24 004 47")

  // Personal information
  firstName: string;
  lastName: string;
  fullName: string;                      // Display name (e.g., "Miodrag MILIC")

  // Address
  addressStreet: string;                 // e.g., "52, Grand-Rue"
  addressPostal: string;                 // e.g., "L-9711"
  addressCity: string;                   // e.g., "CLERVAUX"

  // Employment dates
  ancienneteDate: Date;                  // Seniority date (first employment with company)
  entreeDate: Date;                      // Current position entry date
  sortieDate: Date | null;               // Exit date (null if still employed)

  // Employment status
  status: 'Empl.' | 'Other';             // Employment status
  isActive: boolean;                     // Currently employed

  // Tax and contribution profile
  taxProfile: TaxProfile;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}
```

### Tax and Contribution Profile

```typescript
interface TaxProfile {
  // Tax classification
  taxClass: string;                      // "0.15", "1", "1A", "2", "2-15%", "15% - 2"

  // Health insurance (Maladie) - employee-specific calculation
  maladieCalculationType: 'FORMULA' | 'FIXED' | 'PERCENTAGE';
  maladieFormula?: string;               // e.g., "71.99+6.43"
  maladieFixedAmount?: number;           // For fixed amount type
  maladiePercentage?: number;            // For percentage type

  // Deductions
  deductionCalculationType: 'TAX_CLASS' | 'CUSTOM';
  deductionFormula?: string;             // e.g., "33+460"
  deductionComponents?: {
    component1: number;                  // e.g., 33
    component2?: number;                 // e.g., 460
    component3?: number;
  };

  // Fixed monthly contributions
  ciCo2Amount: number;                   // 0 or 14
  cisAmount: number;                     // 0 or 50
  cissmAmount: number;                   // 0, 70, or variable
  cissmCalculationType: 'FIXED' | 'VARIABLE';

  // Effective dates for tax profile changes
  effectiveFrom: Date;
  effectiveTo: Date | null;

  // Tax profile history
  previousProfiles?: TaxProfile[];
}
```

---

## 2. MONTHLY PAYSLIP DATA

### Monthly Payslip Record

```typescript
interface MonthlyPayslip {
  // Identifiers
  payslipId: string;                     // UUID
  employeeId: string;                    // FK to Employee
  year: number;                          // e.g., 2024
  month: number;                         // 1-12

  // Month identifier for display
  monthLabel: string;                    // "J     1-31", "F    1-29", etc.

  // Working days
  joursImposables: number;               // Taxable days (typically 25)

  // Salary information
  remunerationBase: number;              // Base remuneration
  brutMensuel: number;                   // Monthly gross salary

  // Social security contributions (employee)
  cotisable: number;                     // = brutMensuel (for SS calculations)
  maladie: number;                       // Health insurance (employee part)
  pension: number;                       // Pension contribution (8% of cotisable)

  // Taxes and deductions
  ciCo2: number;                         // CI-CO2 tax
  deductions: number;                    // Other deductions
  imposable: number;                     // Taxable income for income tax
  impots: number;                        // Income tax
  cis: number;                           // CIS contribution
  cissm: number;                         // CISSM contribution

  // Net salary
  salaireNet: number;                    // Net salary

  // Hours breakdown
  hours: MonthlyHours;

  // Calculation metadata
  calculatedAt: Date;
  isLocked: boolean;                     // Prevent modifications after payment
  isPaid: boolean;
  paidAt: Date | null;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}
```

### Monthly Hours Breakdown

```typescript
interface MonthlyHours {
  // Identifiers
  hoursId: string;                       // UUID
  payslipId: string;                     // FK to MonthlyPayslip

  // Month identifier
  monthLabel: string;                    // "J", "F", "M", etc. (single letter)

  // Working hours
  normalHours: number;                   // Normal hours (typically 173)
  supplementaryHours: number;            // Overtime hours

  // Leave and absences
  congesDays: number;                    // Vacation/leave days
  ferieExtraDays: number;                // Extra holidays
  congesFamillialeDays: number;          // Family leave (COVID-19, etc.)
  maladieDays: number;                   // Sick leave days

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 3. ANNUAL SUMMARY DATA

### Annual Employee Summary

```typescript
interface AnnualEmployeeSummary {
  // Identifiers
  summaryId: string;                     // UUID
  employeeId: string;                    // FK to Employee
  year: number;

  // Annual totals (sum of 12 months)
  totals: {
    remunerationBase: number;
    brutMensuel: number;
    cotisable: number;
    maladie: number;
    pension: number;
    ciCo2: number;
    deductions: number;
    imposable: number;
    impots: number;
    cis: number;
    cissm: number;
    salaireNet: number;
  };

  // Annual hours totals
  hoursTotals: {
    normalHours: number;
    supplementaryHours: number;
    congesDays: number;
    ferieExtraDays: number;
    congesFamillialeDays: number;
    maladieDays: number;
  };

  // Monthly breakdown (array of 12 payslips)
  monthlyPayslips: MonthlyPayslip[];

  // Metadata
  calculatedAt: Date;
  isLocked: boolean;
}
```

---

## 4. COMPANY-WIDE AGGREGATED DATA

### Monthly Company Summary

```typescript
interface MonthlyCompanySummary {
  // Identifiers
  summaryId: string;
  year: number;
  month: number;
  monthLabel: string;                    // "JAN", "FEV", "MAR", etc.

  // Aggregated employee contributions
  totalBrutMensuel: number;              // Sum of all employees
  totalCotisable: number;
  totalMaladie: number;
  totalPension: number;
  totalDeductions: number;
  totalImposable: number;
  totalImpots: number;
  totalSalaireNet: number;

  // Credits (CI-CO2 + CIS + CISSM)
  totalCredits: number;

  // Employer contributions
  employerContributions: EmployerContributions;

  // Number of employees
  employeeCount: number;

  // Employee details
  employees: string[];                   // Array of employee IDs

  // Metadata
  calculatedAt: Date;
}
```

### Employer Contributions

```typescript
interface EmployerContributions {
  // Identifiers
  contributionsId: string;
  year: number;
  month: number;

  // Contribution bases
  cotiMaladie: number;                   // = totalCotisable
  cotiPension: number;                   // = cotiMaladie
  cotiSante: number;                     // = cotiPension
  cotiAccident: number;                  // = cotiSante

  // Calculated contributions
  maladie: number;                       // Employee maladie total
  pension: number;                       // Employee pension total
  sante: number;                         // = cotiSante * 0.0011 (0.11%)
  accident: number;                      // = cotiAccident * 0.0075 (0.75%)

  // Totals
  totalMensuel: number;                  // = maladie + pension + sante + accident
  totalSecuriteSociale: number;          // = totalMensuel

  // Metadata
  calculatedAt: Date;
}
```

### Annual Company Summary

```typescript
interface AnnualCompanySummary {
  // Identifiers
  summaryId: string;
  year: number;

  // Annual totals
  totals: {
    brutMensuel: number;
    cotisable: number;
    maladie: number;
    pension: number;
    deductions: number;
    imposable: number;
    impots: number;
    salaireNet: number;
    credits: number;
  };

  // Annual employer contributions
  employerTotals: {
    maladie: number;
    pension: number;
    sante: number;
    accident: number;
    totalSecuriteSociale: number;
  };

  // Monthly breakdown (array of 12 months)
  monthlySummaries: MonthlyCompanySummary[];

  // Metadata
  calculatedAt: Date;
  isLocked: boolean;
}
```

---

## 5. CALCULATION RULES

### Calculation Configuration

```typescript
interface CalculationRules {
  // Version and effective date
  version: string;
  effectiveFrom: Date;
  effectiveTo: Date | null;

  // Social security rates
  rates: {
    pension: {
      employee: number;                  // 0.08 (8%)
      employer: number;                  // TBD
    };
    sante: {
      employer: number;                  // 0.0011 (0.11%)
    };
    accident: {
      employer: number;                  // 0.0075 (0.75%)
    };
  };

  // Tax class configurations
  taxClasses: {
    [taxClass: string]: TaxClassConfig;
  };

  // Default values
  defaults: {
    joursImposables: number;             // 25
    normalHours: number;                 // 173
  };

  // Calculation methods
  calculationMethods: {
    maladie: 'FORMULA' | 'PERCENTAGE' | 'FIXED';
    deductions: 'FORMULA' | 'TABLE' | 'FIXED';
    imposable: 'FORMULA' | 'TABLE';
    impots: 'TABLE' | 'FORMULA';
  };
}
```

### Tax Class Configuration

```typescript
interface TaxClassConfig {
  taxClass: string;
  description: string;

  // Deduction rules
  deductionRule: {
    type: 'FORMULA' | 'FIXED' | 'NONE';
    formula?: string;                    // e.g., "33+460"
    fixedAmount?: number;
    components?: number[];
  };

  // Tax calculation
  taxCalculation: {
    method: 'TABLE' | 'PERCENTAGE' | 'FORMULA';
    table?: TaxTable;
    percentage?: number;
    formula?: string;
  };

  // Applicable from/to
  effectiveFrom: Date;
  effectiveTo: Date | null;
}
```

### Tax Table

```typescript
interface TaxTable {
  taxClass: string;
  year: number;

  // Tax brackets
  brackets: TaxBracket[];
}

interface TaxBracket {
  minIncome: number;
  maxIncome: number | null;              // null for highest bracket
  taxRate: number;                       // Percentage
  fixedAmount: number;                   // Fixed tax for this bracket
  deduction: number;                     // Deduction amount
}
```

---

## 6. EXCEL GENERATION METADATA

### Excel Template Configuration

```typescript
interface ExcelTemplateConfig {
  // Template identification
  templateId: string;
  templateName: string;
  version: string;

  // Company information (for header)
  company: {
    name: string;                        // "Groupe Advensys Luxembourg SA"
    addressStreet: string;               // "Duarrefstrooss 49"
    addressPostal: string;               // "L-9964 HULDANGE"
    registrationNumber: string;          // "2015 22 06 748"
  };

  // Sheet structure
  sheets: {
    employeeSheet: EmployeeSheetConfig;
    summarySheet: SummarySheetConfig;
    patronalesSheet: PatronalesSheetConfig;
  };

  // Cell references
  cellReferences: CellReferenceMap;

  // Merged cells
  mergedCells: MergedCellRange[];

  // Formatting
  formatting: FormattingRules;
}
```

### Employee Sheet Configuration

```typescript
interface EmployeeSheetConfig {
  // Row ranges
  headerRows: {
    start: number;                       // 1
    end: number;                         // 8
  };

  monthlyDataRows: {
    headerRow: number;                   // 9
    dataStart: number;                   // 10
    dataEnd: number;                     // 21
    totalRow: number;                    // 22
  };

  recapitulationRows: {
    headerStart: number;                 // 25
    headerEnd: number;                   // 26
    dataStart: number;                   // 27
    dataEnd: number;                     // 38
    totalRow: number;                    // 39
  };

  // Column definitions
  columns: ColumnDefinition[];
}
```

### Column Definition

```typescript
interface ColumnDefinition {
  letter: string;
  index: number;
  name: string;
  dataType: 'STRING' | 'NUMBER' | 'DATE' | 'FORMULA';
  formulaPattern?: string;               // e.g., "=F{row}"
  isCalculated: boolean;
  width?: number;
  alignment?: 'left' | 'center' | 'right';
  numberFormat?: string;                 // e.g., "#,##0.00"
}
```

### Cell Reference Map

```typescript
interface CellReferenceMap {
  // Header cells
  header: {
    title: string;                       // "B2"
    year: string;                        // "D2"
    description: string;                 // "F2"
    matricule: string;                   // "L2"
    companyName: string;                 // "A4"
    companyAddress: string;              // "A5"
    ancienneteLabel: string;             // "E5"
    ancienneteValue: string;             // "G5"
    employeeId: string;                  // "J5"
    employeeName: string;                // "L5"
    employeeNumber: string;              // "P5"
    // ... etc.
  };

  // Monthly data columns
  monthlyData: {
    jours: string;                       // "A"
    joursImpos: string;                  // "B"
    status: string;                      // "C"
    taxClass: string;                    // "D"
    remunerationBase: string;            // "E"
    brutMensuel: string;                 // "F"
    cotisable: string;                   // "G"
    maladie: string;                     // "H"
    pension: string;                     // "I"
    ciCo2: string;                       // "J"
    deductions: string;                  // "K"
    imposable: string;                   // "L"
    impots: string;                      // "M"
    cis: string;                         // "N"
    cissm: string;                       // "O"
    salaireNet: string;                  // "P"
  };

  // Recapitulation columns
  recapitulation: {
    month: string;                       // "A"
    normal: string;                      // "B"
    supplementary: string;               // "C"
    conges: string;                      // "D"
    ferieExtra: string;                  // "E"
    congesFamilliale: string;            // "F"
    maladie: string;                     // "G"
    imposable: string;                   // "H"
    impot: string;                       // "J"
    net: string;                         // "K"
  };
}
```

---

## 7. API RESPONSE FORMATS

### Employee Payslip Response

```typescript
interface PayslipResponse {
  employee: {
    employeeId: string;
    employeeNumber: string;
    fullName: string;
    matricule: string;
  };

  year: number;
  month: number;

  // Salary details
  salary: {
    base: number;
    gross: number;
    net: number;
  };

  // Contributions
  contributions: {
    employee: {
      maladie: number;
      pension: number;
      ciCo2: number;
      cis: number;
      cissm: number;
      total: number;
    };
    employer: {
      maladie: number;
      pension: number;
      sante: number;
      accident: number;
      total: number;
    };
  };

  // Taxes
  taxes: {
    imposable: number;
    impots: number;
    deductions: number;
  };

  // Hours
  hours: {
    normal: number;
    supplementary: number;
    leave: number;
    sick: number;
  };

  // Metadata
  generatedAt: Date;
  isPaid: boolean;
}
```

---

## 8. DATABASE SCHEMA (SQL)

### Schema Definition

```sql
-- Employees table
CREATE TABLE employees (
  employee_id UUID PRIMARY KEY,
  employee_number VARCHAR(10) NOT NULL,
  matricule VARCHAR(50) NOT NULL UNIQUE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  full_name VARCHAR(200) NOT NULL,
  address_street VARCHAR(200),
  address_postal VARCHAR(20),
  address_city VARCHAR(100),
  anciennete_date DATE NOT NULL,
  entree_date DATE NOT NULL,
  sortie_date DATE,
  status VARCHAR(20) DEFAULT 'Empl.',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tax profiles table
CREATE TABLE tax_profiles (
  profile_id UUID PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(employee_id),
  tax_class VARCHAR(20) NOT NULL,
  maladie_calculation_type VARCHAR(20) NOT NULL,
  maladie_formula VARCHAR(100),
  maladie_fixed_amount DECIMAL(10, 2),
  maladie_percentage DECIMAL(5, 4),
  deduction_calculation_type VARCHAR(20),
  deduction_formula VARCHAR(100),
  deduction_component1 DECIMAL(10, 2),
  deduction_component2 DECIMAL(10, 2),
  deduction_component3 DECIMAL(10, 2),
  ci_co2_amount DECIMAL(10, 2) DEFAULT 0,
  cis_amount DECIMAL(10, 2) DEFAULT 0,
  cissm_amount DECIMAL(10, 2) DEFAULT 0,
  cissm_calculation_type VARCHAR(20) DEFAULT 'FIXED',
  effective_from DATE NOT NULL,
  effective_to DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Monthly payslips table
CREATE TABLE monthly_payslips (
  payslip_id UUID PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(employee_id),
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  month_label VARCHAR(20),
  jours_imposables INTEGER DEFAULT 25,
  remuneration_base DECIMAL(10, 2) NOT NULL,
  brut_mensuel DECIMAL(10, 2) NOT NULL,
  cotisable DECIMAL(10, 2) NOT NULL,
  maladie DECIMAL(10, 2) NOT NULL,
  pension DECIMAL(10, 2) NOT NULL,
  ci_co2 DECIMAL(10, 2) DEFAULT 0,
  deductions DECIMAL(10, 2) DEFAULT 0,
  imposable DECIMAL(10, 2) NOT NULL,
  impots DECIMAL(10, 2) NOT NULL,
  cis DECIMAL(10, 2) DEFAULT 0,
  cissm DECIMAL(10, 2) DEFAULT 0,
  salaire_net DECIMAL(10, 2) NOT NULL,
  calculated_at TIMESTAMP,
  is_locked BOOLEAN DEFAULT FALSE,
  is_paid BOOLEAN DEFAULT FALSE,
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(employee_id, year, month)
);

-- Monthly hours table
CREATE TABLE monthly_hours (
  hours_id UUID PRIMARY KEY,
  payslip_id UUID NOT NULL REFERENCES monthly_payslips(payslip_id),
  month_label VARCHAR(5),
  normal_hours DECIMAL(6, 2) DEFAULT 173,
  supplementary_hours DECIMAL(6, 2) DEFAULT 0,
  conges_days DECIMAL(5, 2) DEFAULT 0,
  ferie_extra_days DECIMAL(5, 2) DEFAULT 0,
  conges_familliale_days DECIMAL(5, 2) DEFAULT 0,
  maladie_days DECIMAL(5, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_payslips_employee_year ON monthly_payslips(employee_id, year);
CREATE INDEX idx_payslips_year_month ON monthly_payslips(year, month);
CREATE INDEX idx_tax_profiles_employee ON tax_profiles(employee_id);
CREATE INDEX idx_tax_profiles_effective ON tax_profiles(effective_from, effective_to);
```

---

## 9. VALIDATION RULES

### Data Validation

```typescript
interface ValidationRules {
  // Employee validation
  employee: {
    matricule: {
      required: true;
      pattern: /^\d{4}\s\d{2}\s\d{2}\s\d{3}\s\d{2}$/;
      message: 'Matricule must be in format: YYYY MM DD XXX XX';
    };
    employeeNumber: {
      required: true;
      pattern: /^N°\s\d+$/;
      message: 'Employee number must be in format: N° X';
    };
    ancienneteDate: {
      required: true;
      maxDate: 'today';
      message: 'Ancienneté date cannot be in the future';
    };
  };

  // Payslip validation
  payslip: {
    month: {
      required: true;
      min: 1;
      max: 12;
    };
    year: {
      required: true;
      min: 2000;
      max: 2100;
    };
    brutMensuel: {
      required: true;
      min: 0;
      message: 'Brut mensuel must be positive';
    };
    salaireNet: {
      required: true;
      validate: 'netSalaryLogic';
      message: 'Net salary calculation error';
    };
  };

  // Calculation validation
  calculation: {
    annualTotal: {
      validate: 'sumOfMonthlyValues';
      tolerance: 0.01;                   // Allow 1 cent difference due to rounding
      message: 'Annual total must equal sum of monthly values';
    };
    cotisable: {
      validate: 'equalsToBrutMensuel';
      message: 'Cotisable must equal Brut Mensuel';
    };
    pension: {
      validate: 'equals8PercentOfCotisable';
      tolerance: 0.01;
      message: 'Pension must be 8% of Cotisable';
    };
  };
}
```

---

## 10. ENUMS AND CONSTANTS

### Enumerations

```typescript
enum EmploymentStatus {
  EMPLOYEE = 'Empl.',
  OTHER = 'Other'
}

enum TaxClass {
  CLASS_0_15 = '0.15',
  CLASS_1 = '1',
  CLASS_1A = '1A',
  CLASS_2 = '2',
  CLASS_2_15 = '2-15%',
  CLASS_15_2 = '15% - 2'
}

enum CalculationType {
  FORMULA = 'FORMULA',
  FIXED = 'FIXED',
  PERCENTAGE = 'PERCENTAGE',
  TABLE = 'TABLE',
  CUSTOM = 'CUSTOM'
}

enum MonthLabel {
  JANUARY = 'J     1-31',
  FEBRUARY = 'F    1-29',
  MARCH = 'M   1-31',
  APRIL = 'A   1-30',
  MAY = 'M  1-31',
  JUNE = 'J    1-30',
  JULY = 'J    1-31',
  AUGUST = 'A   1-31',
  SEPTEMBER = 'S    1-30',
  OCTOBER = 'O   1-31',
  NOVEMBER = 'N   1-30',
  DECEMBER = 'D   1-31'
}

enum MonthLabelShort {
  JANUARY = 'J       ',
  FEBRUARY = 'F      ',
  MARCH = 'M     ',
  APRIL = 'A      ',
  MAY = 'M     ',
  JUNE = 'J       ',
  JULY = 'J       ',
  AUGUST = 'A      ',
  SEPTEMBER = 'S       ',
  OCTOBER = 'O      ',
  NOVEMBER = 'N      ',
  DECEMBER = 'D      '
}

enum SummaryMonthLabel {
  JANUARY = 'JAN',
  FEBRUARY = 'FEV',
  MARCH = 'MAR',
  APRIL = 'AVR',
  MAY = 'MAI',
  JUNE = 'JUIN',
  JULY = 'JUIL',
  AUGUST = 'AOÛ',
  SEPTEMBER = 'SEP',
  OCTOBER = 'OCT',
  NOVEMBER = 'NOV',
  DECEMBER = 'DEC'
}
```

### Constants

```typescript
const PAYSLIP_CONSTANTS = {
  // Default values
  DEFAULT_JOURS_IMPOSABLES: 25,
  DEFAULT_NORMAL_HOURS: 173,

  // Social security rates
  PENSION_RATE_EMPLOYEE: 0.08,         // 8%
  SANTE_RATE_EMPLOYER: 0.0011,         // 0.11%
  ACCIDENT_RATE_EMPLOYER: 0.0075,      // 0.75%

  // Row numbers
  HEADER_START_ROW: 1,
  HEADER_END_ROW: 8,
  MONTHLY_HEADER_ROW: 9,
  MONTHLY_DATA_START_ROW: 10,
  MONTHLY_DATA_END_ROW: 21,
  MONTHLY_TOTAL_ROW: 22,
  RECAP_HEADER_START_ROW: 25,
  RECAP_HEADER_END_ROW: 26,
  RECAP_DATA_START_ROW: 27,
  RECAP_DATA_END_ROW: 38,
  RECAP_TOTAL_ROW: 39,

  // Company information
  COMPANY: {
    NAME: 'Groupe Advensys Luxembourg SA',
    ADDRESS_STREET: 'Duarrefstrooss 49',
    ADDRESS_POSTAL: 'L-9964 HULDANGE',
    REGISTRATION: '2015 22 06 748'
  }
};
```

---

**Document Version:** 1.0
**Generated:** 2025-10-03
**File Location:** `C:\Users\Toufi\AndroidStudioProjects\excelexcelexcel\DATA_STRUCTURE_SPEC.md`
