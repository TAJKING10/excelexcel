import { create } from 'zustand';
import type { Company, Employee, Payslip, CompanyAnalytics, User, UserAccess, Individual, AnnualPayslip, CompanyAnnualAnalysis, PayslipLine, ActivityLog } from '@/types';
import { generateAnnualPayslip } from '@/lib/luxembourgPayroll';
import { companyService, employeeService, annualPayslipService, activityLogService } from '@/services/supabase';

interface DataState {
  companies: Company[];
  employees: Employee[];
  payslips: Payslip[];
  annualPayslips: AnnualPayslip[];
  users: User[];
  individuals: Individual[];
  activityLogs: ActivityLog[];
  payrollTemplates?: Record<string, PayslipLine[]>;
  isLoading: boolean;
  error: string | null;

  // Initialization
  initializeData: () => Promise<void>;

  // Company methods
  addCompany: (company: Omit<Company, 'id' | 'createdAt'>) => Promise<Company>;
  updateCompany: (id: string, company: Partial<Company>) => Promise<Company>;
  deleteCompany: (id: string) => Promise<void>;

  // Employee methods
  addEmployee: (employee: Omit<Employee, 'id'>) => Promise<Employee>;
  updateEmployee: (id: string, employee: Partial<Employee>) => Promise<Employee>;
  deleteEmployee: (id: string) => Promise<void>;
  addIndividual: (individual: Omit<Individual, 'id' | 'createdAt'>) => void;
  updateIndividual: (id: string, individual: Partial<Individual>) => void;
  deleteIndividual: (id: string) => void;
  addPayslip: (payslip: Omit<Payslip, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updatePayslip: (id: string, payslip: Partial<Payslip>) => void;
  deletePayslip: (id: string) => void;
  savePayrollTemplate: (companyId: string, lines: PayslipLine[]) => void;
  getPayrollTemplate: (companyId: string) => PayslipLine[];
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (id: string, user: Partial<User>) => void;
  updateUserAccess: (userId: string, access: UserAccess) => void;
  deleteUser: (id: string) => void;
  logActivity: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => void;
  getActivityLogs: (filters?: { userId?: string; entityType?: string; limit?: number }) => ActivityLog[];
  getCompanyAnalytics: (companyId: string) => CompanyAnalytics;
  getAllAnalytics: () => {
    totalCompanies: number;
    totalEmployees: number;
    activeEmployees: number;
    totalPayslips: number;
    totalPayroll: number;
    companiesData: Array<{ company: Company; analytics: CompanyAnalytics }>;
  };
  // Annual payslip methods
  generateEmployeeAnnualPayslip: (employeeId: string, year: number) => Promise<AnnualPayslip>;
  getEmployeeAnnualPayslip: (employeeId: string, year: number) => Promise<AnnualPayslip | undefined>;
  updateAnnualPayslip: (id: string, updates: Partial<Pick<AnnualPayslip, 'monthlyData' | 'annualTotals' | 'recapitulation'>>) => Promise<AnnualPayslip>;
  deleteAnnualPayslip: (id: string) => Promise<void>;
  getCompanyAnnualAnalysis: (companyId: string, year: number) => CompanyAnnualAnalysis;
}

const mockCompanies: Company[] = [
  {
    id: 'company-1',
    name: 'Groupe Advensys Luxembourg SA',
    country: 'Luxembourg',
    currency: 'EUR',
    createdAt: '2024-01-01',
  },
  {
    id: 'company-2',
    name: 'TechCorp Solutions',
    country: 'Luxembourg',
    currency: 'EUR',
    createdAt: '2024-02-01',
  },
];

const mockEmployees: Employee[] = [
  {
    id: 'emp-1',
    companyId: 'company-1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@advensys.lu',
    matricule: '1989 11 24 004 47',
    class: 'Empl.',
    taxClass: 2,
    hireDate: '2020-01-15',
    terminationDate: null,
    baseSalary: 5500,
    status: 'active',
    address: '52, Grand-Rue',
    city: 'L-9711 CLERVAUX',
    identityNumber: 'D588378',
  },
  {
    id: 'emp-2',
    companyId: 'company-1',
    firstName: 'Marie',
    lastName: 'Dupont',
    email: 'marie.dupont@advensys.lu',
    matricule: '1996 09 05 124 86',
    class: 'Empl.',
    taxClass: 1,
    hireDate: '2021-03-01',
    terminationDate: null,
    baseSalary: 4200,
    status: 'active',
    address: '93, Duarrefstrooss',
    city: 'L-9964 Huldange',
    identityNumber: 'D608388-2022',
  },
  {
    id: 'emp-3',
    companyId: 'company-1',
    firstName: 'Pierre',
    lastName: 'Martin',
    email: 'pierre.martin@advensys.lu',
    matricule: '1972 11 20 175 52',
    class: 'Empl.',
    taxClass: '0.15',
    hireDate: '2019-06-15',
    terminationDate: '2024-12-31',
    baseSalary: 6000,
    status: 'terminated',
    address: '24, Im Dahl',
    city: 'L-9759 Knaphoscheid',
    identityNumber: 'D796015-2021',
  },
  {
    id: 'emp-4',
    companyId: 'company-2',
    firstName: 'Sophie',
    lastName: 'Bernard',
    email: 'sophie.bernard@techcorp.lu',
    matricule: '1983 02 12 029 23',
    class: 'Empl.',
    taxClass: 2,
    hireDate: '2022-01-10',
    terminationDate: null,
    baseSalary: 4800,
    status: 'active',
    address: '5, rue Jean Pierre Sauvage',
    city: 'L-2514 Luxembourg',
  },
];

const mockPayslips: Payslip[] = [
  {
    id: 'pay-1',
    employeeId: 'emp-1',
    companyId: 'company-1',
    period: { month: 1, year: 2024 },
    employee: {
      id: 'emp-1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@advensys.lu',
      class: 'Empl.',
      hireDate: '2020-01-15',
      terminationDate: null,
      matricule: '1989 11 24 004 47',
      identityNumber: 'D588378',
      address: '52, Grand-Rue',
      city: 'L-9711 CLERVAUX',
    },
    company: {
      id: 'company-1',
      name: 'Groupe Advensys Luxembourg SA',
      country: 'Luxembourg',
      currency: 'EUR',
      address: 'Duarrefstrooss 49',
      city: 'L-9964 HULDANGE',
      registrationNumber: '2015 22 06 748',
    },
    earnings: {
      remunerationBase: 5500,
      grossMonthly: 5500,
      cotisable: 5500,
      imposable: 5500,
    },
    employeeContrib: {
      maladie: 167.75,
      pension: 440,
      ciCo2: 14,
      cis: 50,
      cissm: 70,
      deductions: 0,
      incomeTax: 0,
      total: 741.75,
    },
    employerContrib: {
      maladie: 167.75,
      pension: 440,
      sante: 220,
      accident: 55,
      socialSecurityTotal: 882.75,
    },
    workingHours: {
      normalHours: 173,
      supplementaryHours: 0,
      holidays: 16,
      publicHolidayExtra: 8,
      familyLeave: 0,
      paternityLeave: 0,
      sickLeave: 0,
      unemployment: 0,
    },
    netPay: 4758.25,
    ytd: {
      gross: 5500,
      net: 4758.25,
      employeeContribTotal: 741.75,
      employerContribTotal: 882.75,
      taxes: 0,
    },
    lines: [],
    createdAt: '2024-01-31T12:00:00Z',
    updatedAt: '2024-01-31T12:00:00Z',
  },
  {
    id: 'pay-2',
    employeeId: 'emp-2',
    companyId: 'company-1',
    period: { month: 1, year: 2024 },
    employee: {
      id: 'emp-2',
      firstName: 'Marie',
      lastName: 'Dupont',
      email: 'marie.dupont@advensys.lu',
      class: 'Empl.',
      hireDate: '2021-03-01',
      terminationDate: null,
      matricule: '1996 09 05 124 86',
      identityNumber: 'D608388-2022',
      address: '93, Duarrefstrooss',
      city: 'L-9964 Huldange',
    },
    company: {
      id: 'company-1',
      name: 'Groupe Advensys Luxembourg SA',
      country: 'Luxembourg',
      currency: 'EUR',
      address: 'Duarrefstrooss 49',
      city: 'L-9964 HULDANGE',
      registrationNumber: '2015 22 06 748',
    },
    earnings: {
      remunerationBase: 4200,
      grossMonthly: 4200,
      cotisable: 4200,
      imposable: 4200,
    },
    employeeContrib: {
      maladie: 128.1,
      pension: 336,
      ciCo2: 14,
      cis: 50,
      cissm: 70,
      deductions: 0,
      incomeTax: 139.9,
      total: 738,
    },
    employerContrib: {
      maladie: 128.1,
      pension: 336,
      sante: 168,
      accident: 42,
      socialSecurityTotal: 674.1,
    },
    workingHours: {
      normalHours: 173,
      supplementaryHours: 0,
      holidays: 8,
      publicHolidayExtra: 8,
      familyLeave: 0,
      paternityLeave: 0,
      sickLeave: 16,
      unemployment: 0,
    },
    netPay: 3462,
    ytd: {
      gross: 4200,
      net: 3462,
      employeeContribTotal: 738,
      employerContribTotal: 674.1,
      taxes: 139.9,
    },
    lines: [],
    createdAt: '2024-01-31T12:00:00Z',
    updatedAt: '2024-01-31T12:00:00Z',
  },
  {
    id: 'pay-3',
    employeeId: 'emp-1',
    companyId: 'company-1',
    period: { month: 2, year: 2024 },
    employee: {
      id: 'emp-1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@advensys.lu',
      class: 'Empl.',
      hireDate: '2020-01-15',
      terminationDate: null,
      matricule: '1989 11 24 004 47',
      identityNumber: 'D588378',
      address: '52, Grand-Rue',
      city: 'L-9711 CLERVAUX',
    },
    company: {
      id: 'company-1',
      name: 'Groupe Advensys Luxembourg SA',
      country: 'Luxembourg',
      currency: 'EUR',
      address: 'Duarrefstrooss 49',
      city: 'L-9964 HULDANGE',
      registrationNumber: '2015 22 06 748',
    },
    earnings: {
      remunerationBase: 5500,
      grossMonthly: 5500,
      cotisable: 5500,
      imposable: 5500,
    },
    employeeContrib: {
      maladie: 167.75,
      pension: 440,
      ciCo2: 14,
      cis: 50,
      cissm: 70,
      deductions: 0,
      incomeTax: 0,
      total: 741.75,
    },
    employerContrib: {
      maladie: 167.75,
      pension: 440,
      sante: 220,
      accident: 55,
      socialSecurityTotal: 882.75,
    },
    workingHours: {
      normalHours: 173,
      supplementaryHours: 0,
      holidays: 24,
      publicHolidayExtra: 0,
      familyLeave: 0,
      paternityLeave: 0,
      sickLeave: 16,
      unemployment: 0,
    },
    netPay: 4758.25,
    ytd: {
      gross: 11000,
      net: 9516.5,
      employeeContribTotal: 1483.5,
      employerContribTotal: 1765.5,
      taxes: 0,
    },
    lines: [],
    createdAt: '2024-02-29T12:00:00Z',
    updatedAt: '2024-02-29T12:00:00Z',
  },
];

const mockIndividuals: Individual[] = [];

export const useDataStore = create<DataState>((set, get) => ({
  companies: [],
  employees: [],
  payslips: [],
  annualPayslips: [],
  users: [],
  individuals: [],
  activityLogs: [],
  payrollTemplates: {},
  isLoading: true,
  error: null,

  // Initialize data from Supabase
  initializeData: async () => {
    console.log('🔄 Starting initializeData...');
    set({ isLoading: true, error: null });
    try {
      const [companies, employees, annualPayslips] = await Promise.all([
        companyService.getAll(),
        employeeService.getAll(),
        annualPayslipService.getAll()
      ]);

      console.log('✅ Data loaded:', {
        companiesCount: companies.length,
        employeesCount: employees.length,
        annualPayslipsCount: annualPayslips.length
      });

      set({
        companies,
        employees,
        annualPayslips,
        isLoading: false
      });
    } catch (error: any) {
      console.error('❌ Failed to initialize data:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  // Company CRUD with Supabase
  addCompany: async (company) => {
    set({ isLoading: true, error: null });
    try {
      const newCompany = await companyService.create(company);
      set((state) => ({
        companies: [...state.companies, newCompany],
        isLoading: false
      }));
      return newCompany;
    } catch (error: any) {
      console.error('Failed to add company:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  updateCompany: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      const updatedCompany = await companyService.update(id, updates);
      set((state) => ({
        companies: state.companies.map((c) => (c.id === id ? updatedCompany : c)),
        isLoading: false
      }));
      return updatedCompany;
    } catch (error: any) {
      console.error('Failed to update company:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  deleteCompany: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await companyService.delete(id);
      set((state) => ({
        companies: state.companies.filter((c) => c.id !== id),
        isLoading: false
      }));
    } catch (error: any) {
      console.error('Failed to delete company:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Employee CRUD with Supabase
  addEmployee: async (employee) => {
    set({ isLoading: true, error: null });
    try {
      const newEmployee = await employeeService.create(employee);
      set((state) => ({
        employees: [...state.employees, newEmployee],
        isLoading: false
      }));
      return newEmployee;
    } catch (error: any) {
      console.error('Failed to add employee:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  updateEmployee: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      const updatedEmployee = await employeeService.update(id, updates);
      set((state) => ({
        employees: state.employees.map((e) => (e.id === id ? updatedEmployee : e)),
        isLoading: false
      }));
      return updatedEmployee;
    } catch (error: any) {
      console.error('Failed to update employee:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  deleteEmployee: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await employeeService.delete(id);
      set((state) => ({
        employees: state.employees.filter((e) => e.id !== id),
        isLoading: false
      }));
    } catch (error: any) {
      console.error('Failed to delete employee:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  addIndividual: (individual) =>
    set((state) => ({
      individuals: [
        ...state.individuals,
        { ...individual, id: `ind-${Date.now()}`, createdAt: new Date().toISOString() },
      ],
    })),

  updateIndividual: (id, individual) =>
    set((state) => ({
      individuals: state.individuals.map((i) => (i.id === id ? { ...i, ...individual } : i)),
    })),

  deleteIndividual: (id) =>
    set((state) => ({
      individuals: state.individuals.filter((i) => i.id !== id),
    })),

  addPayslip: (payslip) =>
    set((state) => ({
      payslips: [
        ...state.payslips,
        {
          ...payslip,
          id: `pay-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    })),

  updatePayslip: (id, payslip) =>
    set((state) => ({
      payslips: state.payslips.map((p) =>
        p.id === id ? { ...p, ...payslip, updatedAt: new Date().toISOString() } : p
      ),
    })),

  deletePayslip: (id) =>
    set((state) => ({
      payslips: state.payslips.filter((p) => p.id !== id),
    })),

  // Save and load reusable company payroll templates (structured lines)
  savePayrollTemplate: (companyId: string, lines: PayslipLine[]) =>
    set((state) => ({
      payrollTemplates: { ...(state.payrollTemplates || {}), [companyId]: lines.map((l) => ({ ...l })) },
    })),

  getPayrollTemplate: (companyId: string): PayslipLine[] => {
    const state = get();
    return (state.payrollTemplates && state.payrollTemplates[companyId]) || [];
  },

  addUser: (user) =>
    set((state) => ({
      users: [...state.users, { ...user, id: `user-${Date.now()}` }],
    })),

  updateUser: (id, user) =>
    set((state) => ({
      users: state.users.map((u) => (u.id === id ? { ...u, ...user } : u)),
    })),

  updateUserAccess: (userId, access) =>
    set((state) => ({
      users: state.users.map((u) => (u.id === userId ? { ...u, access } : u)),
    })),

  deleteUser: (id) =>
    set((state) => ({
      users: state.users.filter((u) => u.id !== id),
    })),

  logActivity: async (log) => {
    try {
      const newLog = await activityLogService.create(log);
      set((state) => ({
        activityLogs: [newLog, ...state.activityLogs]
      }));
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  },

  getActivityLogs: async (filters) => {
    try {
      const logs = await activityLogService.getAll(filters);
      set({ activityLogs: logs });
      return logs;
    } catch (error) {
      console.error('Failed to get activity logs:', error);
      return get().activityLogs;
    }
  },

  getCompanyAnalytics: (companyId: string): CompanyAnalytics => {
    const state = get();
    const employees = state.employees.filter((e) => e.companyId === companyId);
    const currentYear = new Date().getFullYear();
    const annualPayslips = state.annualPayslips.filter(
      (p) => p.companyId === companyId && p.year === currentYear
    );

    const activeEmployees = employees.filter((e) => e.status === 'active').length;
    const terminatedEmployees = employees.filter((e) => e.status === 'terminated').length;

    // Calculate totals from annual payslips
    const monthlyPayroll = annualPayslips.reduce(
      (sum, p) => sum + (p.annualTotals?.earnings?.grossMonthly || 0),
      0
    );
    const totalSocialCharges = annualPayslips.reduce(
      (sum, p) => sum + (p.annualTotals?.employerContrib?.socialSecurityTotal || 0),
      0
    );

    // Generate monthly data from annual payslips (current year, 12 months)
    const netVsGross = Array.from({ length: 12 }, (_, i) => {
      const monthNumber = i + 1;
      const monthName = new Date(currentYear, i, 1).toLocaleString('default', {
        month: 'short',
        year: 'numeric'
      });

      // Sum up all employees' data for this month
      let gross = 0;
      let net = 0;

      annualPayslips.forEach((annualPayslip) => {
        const monthData = annualPayslip.monthlyData?.find((m: any) => m.monthNumber === monthNumber);
        if (monthData) {
          gross += monthData.earnings?.grossMonthly || 0;
          net += monthData.netPay || 0;
        }
      });

      return {
        month: monthName,
        gross,
        net,
      };
    });

    // Monthly contributions
    const contributions = Array.from({ length: 12 }, (_, i) => {
      const monthNumber = i + 1;
      const monthName = new Date(currentYear, i, 1).toLocaleString('default', {
        month: 'short',
        year: 'numeric'
      });

      let maladie = 0;
      let pension = 0;
      let sante = 0;
      let accident = 0;

      annualPayslips.forEach((annualPayslip) => {
        const monthData = annualPayslip.monthlyData?.find((m: any) => m.monthNumber === monthNumber);
        if (monthData) {
          maladie += monthData.employerContrib?.maladie || 0;
          pension += monthData.employerContrib?.pension || 0;
          sante += monthData.employerContrib?.sante || 0;
          accident += monthData.employerContrib?.accident || 0;
        }
      });

      return {
        month: monthName,
        maladie,
        pension,
        sante,
        accident,
      };
    });

    // Monthly taxes
    const taxes = Array.from({ length: 12 }, (_, i) => {
      const monthNumber = i + 1;
      const monthName = new Date(currentYear, i, 1).toLocaleString('default', {
        month: 'short',
        year: 'numeric'
      });

      let amount = 0;

      annualPayslips.forEach((annualPayslip) => {
        const monthData = annualPayslip.monthlyData?.find((m: any) => m.monthNumber === monthNumber);
        if (monthData) {
          amount += monthData.employeeContrib?.incomeTax || 0;
        }
      });

      return {
        month: monthName,
        amount,
      };
    });

    return {
      totalEmployees: employees.length,
      activeEmployees,
      terminatedEmployees,
      monthlyPayroll,
      totalSocialCharges,
      netVsGross,
      contributions,
      taxes,
    };
  },

  getAllAnalytics: () => {
    const state = get();
    const totalCompanies = state.companies.length;
    const totalEmployees = state.employees.length;
    const activeEmployees = state.employees.filter((e) => e.status === 'active').length;
    const totalPayslips = state.payslips.length;
    const totalPayroll = state.payslips.reduce((sum, p) => sum + p.earnings.grossMonthly, 0);

    const companiesData = state.companies.map((company) => ({
      company,
      analytics: get().getCompanyAnalytics(company.id),
    }));

    return {
      totalCompanies,
      totalEmployees,
      activeEmployees,
      totalPayslips,
      totalPayroll,
      companiesData,
    };
  },

  // Annual payslip methods with Supabase
  generateEmployeeAnnualPayslip: async (employeeId: string, year: number): Promise<AnnualPayslip> => {
    set({ isLoading: true, error: null });
    try {
      const state = get();
      const employee = state.employees.find((e) => e.id === employeeId);
      if (!employee) {
        throw new Error(`Employee ${employeeId} not found`);
      }

      const company = state.companies.find((c) => c.id === employee.companyId);
      if (!company) {
        throw new Error(`Company ${employee.companyId} not found`);
      }

      // Check if already exists in Supabase
      const existing = await annualPayslipService.getByEmployeeAndYear(employeeId, year);
      if (existing) {
        set({ isLoading: false });
        return existing;
      }

      // Generate new annual payslip
      const generatedPayslip = generateAnnualPayslip(
        {
          employeeId,
          year,
          baseSalary: employee.baseSalary,
          taxClass: employee.taxClass,
          workingHoursPerMonth: 173,
        },
        employee,
        company
      );

      // Save to Supabase
      const savedPayslip = await annualPayslipService.create(generatedPayslip);

      // Store it in local state (check for duplicates first)
      set((state) => {
        const alreadyExists = state.annualPayslips.some((p) => p.id === savedPayslip.id);
        return {
          annualPayslips: alreadyExists
            ? state.annualPayslips
            : [...state.annualPayslips, savedPayslip],
          isLoading: false
        };
      });

      return savedPayslip;
    } catch (error: any) {
      console.error('Failed to generate annual payslip:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  getEmployeeAnnualPayslip: async (employeeId: string, year: number): Promise<AnnualPayslip | undefined> => {
    try {
      const state = get();
      // First check local state
      let payslip = state.annualPayslips.find(
        (p) => p.employeeId === employeeId && p.year === year
      );

      // If not in local state, check Supabase
      if (!payslip) {
        payslip = await annualPayslipService.getByEmployeeAndYear(employeeId, year);

        if (payslip) {
          // Add to local state only if it doesn't already exist (double-check to prevent duplicates)
          const currentState = get();
          const alreadyExists = currentState.annualPayslips.some(
            (p) => p.id === payslip!.id
          );

          if (!alreadyExists) {
            set((state) => ({
              annualPayslips: [...state.annualPayslips, payslip as AnnualPayslip]
            }));
          }
        } else {
          // Auto-generate if not found
          payslip = await get().generateEmployeeAnnualPayslip(employeeId, year);
        }
      }

      return payslip;
    } catch (error) {
      console.error('Failed to get annual payslip:', error);
      return undefined;
    }
  },

  // Update annual payslip
  updateAnnualPayslip: async (id: string, updates: Partial<Pick<AnnualPayslip, 'monthlyData' | 'annualTotals' | 'recapitulation'>>): Promise<AnnualPayslip> => {
    set({ isLoading: true, error: null });
    try {
      const updatedPayslip = await annualPayslipService.update(id, updates);
      set((state) => ({
        annualPayslips: state.annualPayslips.map((p) => (p.id === id ? updatedPayslip : p)),
        isLoading: false
      }));
      return updatedPayslip;
    } catch (error: any) {
      console.error('Failed to update annual payslip:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Delete annual payslip
  deleteAnnualPayslip: async (id: string): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      await annualPayslipService.delete(id);
      set((state) => ({
        annualPayslips: state.annualPayslips.filter((p) => p.id !== id),
        isLoading: false
      }));
    } catch (error: any) {
      console.error('Failed to delete annual payslip:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  getCompanyAnnualAnalysis: (companyId: string, year: number): CompanyAnnualAnalysis => {
    const state = get();
    const company = state.companies.find((c) => c.id === companyId);
    if (!company) {
      throw new Error(`Company ${companyId} not found`);
    }

    const employees = state.employees.filter((e) => e.companyId === companyId);
    const activeEmployees = employees.filter((e) => e.status === 'active');

    // Get annual payslips from state (they should be pre-loaded)
    const employeePayslips: AnnualPayslip[] = state.annualPayslips.filter(
      (p) => p.companyId === companyId && p.year === year
    );

    // Calculate totals
    const totals = employeePayslips.reduce(
      (acc, payslip) => {
        acc.totalGrossSalary += payslip.recapitulation?.totalGrossSalary || 0;
        acc.totalNetSalary += payslip.recapitulation?.totalNetSalary || 0;
        acc.totalEmployeeContributions += payslip.recapitulation?.totalEmployeeContributions || 0;
        acc.totalEmployerContributions += payslip.recapitulation?.totalEmployerContributions || 0;
        acc.totalTaxes += payslip.recapitulation?.totalTaxes || 0;
        return acc;
      },
      {
        totalGrossSalary: 0,
        totalNetSalary: 0,
        totalEmployeeContributions: 0,
        totalEmployerContributions: 0,
        totalTaxes: 0,
      }
    );

    return {
      companyId,
      year,
      totalEmployees: employees.length,
      activeEmployees: activeEmployees.length,
      ...totals,
      employeePayslips,
    };
  },
}));