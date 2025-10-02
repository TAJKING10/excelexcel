// User & Auth Types
export type Role = 'SUPER_ADMIN' | 'EMPLOYEE';

export interface UserAccess {
  companyIds: string[]; // Companies the user has access to
  individualIds: string[]; // Individual freelancers the user has access to
  canViewPayslips: boolean;
  canEditPayslips: boolean;
  canDeletePayslips: boolean;
  canViewAnalytics: boolean;
}

export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  access?: UserAccess; // Access control for employees (managed by super admin)
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
}

// Employee Types
export interface Employee {
  id: string;
  companyId: string;
  firstName: string;
  lastName: string;
  email: string;
  class: string;
  hireDate: string;
  terminationDate: string | null;
  baseSalary: number;
  status: 'active' | 'terminated';
}

// Payslip Types
export interface Period {
  month: number; // 1-12
  year: number;
}

export interface Earnings {
  grossMonthly: number;
  cotisable: number;
  imposable: number;
}

export interface EmployeeContrib {
  maladie: number;
  pension: number;
  otherDeductions: number;
  incomeTax: number;
  total: number;
}

export interface EmployerContrib {
  maladie: number;
  pension: number;
  sante: number;
  accident: number;
  socialSecurityTotal: number;
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
  };
  company: {
    id: string;
    name: string;
    country: string;
    currency: string;
  };
  earnings: Earnings;
  employeeContrib: EmployeeContrib;
  employerContrib: EmployerContrib;
  netPay: number;
  ytd: YTD;
  lines: PayslipLine[];
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