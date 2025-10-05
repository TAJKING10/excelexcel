// User & Auth Types
export type Role = 'SUPER_ADMIN' | 'EMPLOYEE';

export interface UserAccess {
  companyIds: string[]; // Companies the user has access to
  individualIds: string[]; // Individual freelancers the user has access to
  canViewPayslips: boolean;
  canEditPayslips: boolean;
  canDeletePayslips: boolean;
  canViewAnalytics: boolean;
  hasAllCompaniesAccess?: boolean; // Access to all companies (current and future)
  hasAllIndividualsAccess?: boolean; // Access to all individuals (current and future)
  canCreateCompanies?: boolean; // Can create new companies
  canCreateIndividuals?: boolean; // Can create new individuals
  canCreateEmployees?: boolean; // Can create employees inside companies
}

export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  password?: string; // Hashed password for authentication
  // Company Admins are associated with a single company
  companyId?: string;
  access?: UserAccess; // Access control for employees (managed by super admin)
  isActive?: boolean; // Can be disabled by super admin
  createdAt?: string;
  createdBy?: string; // Super admin who created this user
  lastLogin?: string;
}

// Activity Log for tracking user actions
export interface ActivityLog {
  id: string;
  userId: string;
  username: string;
  action: string; // e.g., "created_payslip", "edited_employee", "viewed_company"
  entityType: 'payslip' | 'employee' | 'company' | 'individual' | 'user' | 'other';
  entityId?: string;
  entityName?: string;
  details?: string;
  timestamp: string;
  ipAddress?: string;
}

// Company Types
export interface Company {
  id: string;
  name: string;
  country: string;
  currency: string;
  createdAt: string;
}

// Individual (Freelancer) Types
export interface Individual {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  country: string;
  currency: string;
  status: 'active' | 'terminated';
  createdAt: string;
  baseSalary?: number;
  taxClass?: number;
  matricule?: string;
  address?: string;
}

// Employee Types
export interface Employee {
  id: string;
  companyId: string;
  firstName: string;
  lastName: string;
  email: string;
  matricule: string; // Matricule number
  class: string;
  taxClass: string | number; // Tax class (e.g., "15% - 2", 1, 2, etc.)
  hireDate: string;
  terminationDate: string | null;
  baseSalary: number;
  status: 'active' | 'terminated';
  address?: string;
  city?: string;
  postalCode?: string;
  identityNumber?: string; // D588378, D608388-2022, etc.
  anciennete?: number; // Seniority in days (Excel date format)
}

// Payslip Types
export interface Period {
  month: number; // 1-12
  year: number;
}

export interface Earnings {
  remunerationBase: number; // Rémun. Base
  grossMonthly: number; // Brut Mensuel
  cotisable: number; // Cotisable
  imposable: number; // Imposable
}

export interface EmployeeContrib {
  maladie: number; // Maladie
  pension: number; // Pension
  ciCo2: number; // CI-CO2
  cis: number; // CIS
  cissm: number; // CISSM
  deductions: number; // Déductions
  incomeTax: number; // Impôts
  total: number;
}

export interface EmployerContrib {
  maladie: number;
  pension: number;
  sante: number; // Santé
  accident: number;
  socialSecurityTotal: number;
}

export interface WorkingHours {
  normalHours: number;
  supplementaryHours: number;
  holidays: number; // Congés
  publicHolidayExtra: number; // Férié extra
  familyLeave: number; // Congés familliale
  paternityLeave: number; // Congés paternité
  sickLeave: number; // Maladie
  unemployment: number; // Chômage
}

export interface YTD {
  gross: number;
  net: number;
  employeeContribTotal: number;
  employerContribTotal: number;
  taxes: number;
}

export type LineType = 'earning' | 'deduction' | 'employer_contrib' | 'info';

export interface PayslipLine {
  id: string;
  code: string;
  label_fr: string;
  label_en: string;
  quantity: number;
  rate: number;
  amount: number;
  type: LineType;
}

export interface MonthlyPayslipData {
  monthName: string; // "J", "F", "M", etc. or full month name
  monthNumber: number; // 1-12
  days: string; // "1-31", "1-29", etc.
  daysImposable: number; // Jours impos.
  status: string; // "Empl.", "-", etc.
  taxClass: string | number; // Tax class
  earnings: Earnings;
  employeeContrib: EmployeeContrib;
  workingHours: WorkingHours;
  netPay: number;
}

// Annual Payslip with all 12 months
export interface AnnualPayslip {
  id: string;
  employeeId: string;
  companyId: string;
  year: number;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    class: string;
    hireDate: string;
    terminationDate: string | null;
    matricule?: string;
    identityNumber?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    anciennete?: string; // Seniority date display
  };
  company: {
    id: string;
    name: string;
    country: string;
    currency: string;
    address?: string;
    city?: string;
    postalCode?: string;
    registrationNumber?: string;
  };
  monthlyData: MonthlyPayslipData[]; // All 12 months
  annualTotals: {
    earnings: Earnings;
    employeeContrib: EmployeeContrib;
    employerContrib: EmployerContrib;
    workingHours: WorkingHours;
    netPay: number;
  };
  recapitulation: {
    totalHoursWorked: number;
    totalGrossSalary: number;
    totalNetSalary: number;
    totalEmployeeContributions: number;
    totalEmployerContributions: number;
    totalTaxes: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Payslip {
  id: string;
  employeeId: string;
  companyId: string;
  period: Period;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    class: string;
    hireDate: string;
    terminationDate: string | null;
    matricule?: string;
    identityNumber?: string;
    address?: string;
    city?: string;
    postalCode?: string;
  };
  company: {
    id: string;
    name: string;
    country: string;
    currency: string;
    address?: string;
    city?: string;
    postalCode?: string;
    registrationNumber?: string; // 2015 22 06 748
  };
  monthlyData?: MonthlyPayslipData; // Detailed monthly data
  earnings: Earnings;
  employeeContrib: EmployeeContrib;
  employerContrib: EmployerContrib;
  workingHours?: WorkingHours;
  netPay: number;
  ytd: YTD;
  lines: PayslipLine[];
  credits?: number; // Crédits
  createdAt: string;
  updatedAt: string;
}

// Analytics Types
export interface CompanyAnalytics {
  totalEmployees: number;
  activeEmployees: number;
  terminatedEmployees: number;
  monthlyPayroll: number;
  totalSocialCharges: number;
  netVsGross: Array<{
    month: string;
    gross: number;
    net: number;
  }>;
  contributions: Array<{
    month: string;
    maladie: number;
    pension: number;
    sante: number;
    accident: number;
  }>;
  taxes: Array<{
    month: string;
    amount: number;
  }>;
}

// Excel Import Types
export interface ExcelImportMapping {
  [key: string]: string; // Excel column -> schema field
}

export interface ExcelImportResult {
  success: boolean;
  employeesCreated: number;
  employeesUpdated: number;
  payslipsCreated: number;
  errors: string[];
}

// Analysis Types
export interface CompanyAnnualAnalysis {
  companyId: string;
  year: number;
  totalEmployees: number;
  activeEmployees: number;
  totalGrossSalary: number;
  totalNetSalary: number;
  totalEmployeeContributions: number;
  totalEmployerContributions: number;
  totalTaxes: number;
  employeePayslips: AnnualPayslip[];
}