import { create } from 'zustand';
import type { Company, Employee, Payslip, CompanyAnalytics, User, UserAccess, Individual } from '@/types';

interface DataState {
  companies: Company[];
  employees: Employee[];
  payslips: Payslip[];
  users: User[];
  individuals: Individual[];
  addCompany: (company: Omit<Company, 'id' | 'createdAt'>) => void;
  updateCompany: (id: string, company: Partial<Company>) => void;
  deleteCompany: (id: string) => void;
  addEmployee: (employee: Omit<Employee, 'id'>) => void;
  updateEmployee: (id: string, employee: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  addIndividual: (individual: Omit<Individual, 'id' | 'createdAt'>) => void;
  updateIndividual: (id: string, individual: Partial<Individual>) => void;
  deleteIndividual: (id: string) => void;
  addPayslip: (payslip: Omit<Payslip, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updatePayslip: (id: string, payslip: Partial<Payslip>) => void;
  deletePayslip: (id: string) => void;
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (id: string, user: Partial<User>) => void;
  updateUserAccess: (userId: string, access: UserAccess) => void;
  deleteUser: (id: string) => void;
  getCompanyAnalytics: (companyId: string) => CompanyAnalytics;
  getAllAnalytics: () => {
    totalCompanies: number;
    totalEmployees: number;
    activeEmployees: number;
    totalPayslips: number;
    totalPayroll: number;
    companiesData: Array<{ company: Company; analytics: CompanyAnalytics }>;
  };
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
      maladie: 167.75,  // 3.05% of 5500
      pension: 440,     // 8% of 5500
      ciCo2: 14,
      cis: 50,
      cissm: 70,
      deductions: 0,
      incomeTax: 0,
      total: 741.75,
    },
    employerContrib: {
      maladie: 167.75,  // 3.05%
      pension: 440,     // 8%
      sante: 220,       // 4%
      accident: 55,     // 1%
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
];

const mockIndividuals: Individual[] = [];

export const useDataStore = create<DataState>((set, get) => ({
  companies: mockCompanies,
  employees: mockEmployees,
  payslips: mockPayslips,
  users: [],
  individuals: mockIndividuals,

  addCompany: (company) =>
    set((state) => ({
      companies: [
        ...state.companies,
        { ...company, id: `company-${Date.now()}`, createdAt: new Date().toISOString() },
      ],
    })),

  updateCompany: (id, company) =>
    set((state) => ({
      companies: state.companies.map((c) => (c.id === id ? { ...c, ...company } : c)),
    })),

  deleteCompany: (id) =>
    set((state) => ({
      companies: state.companies.filter((c) => c.id !== id),
    })),

  addEmployee: (employee) =>
    set((state) => ({
      employees: [...state.employees, { ...employee, id: `emp-${Date.now()}` }],
    })),

  updateEmployee: (id, employee) =>
    set((state) => ({
      employees: state.employees.map((e) => (e.id === id ? { ...e, ...employee } : e)),
    })),

  deleteEmployee: (id) =>
    set((state) => ({
      employees: state.employees.filter((e) => e.id !== id),
    })),

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

  getCompanyAnalytics: (companyId: string): CompanyAnalytics => {
    const state = get();
    const employees = state.employees.filter((e) => e.companyId === companyId);
    const payslips = state.payslips.filter((p) => p.companyId === companyId);

    const activeEmployees = employees.filter((e) => e.status === 'active').length;
    const terminatedEmployees = employees.filter((e) => e.status === 'terminated').length;
    const monthlyPayroll = payslips.reduce((sum, p) => sum + p.earnings.grossMonthly, 0);
    const totalSocialCharges = payslips.reduce(
      (sum, p) => sum + p.employerContrib.socialSecurityTotal,
      0
    );

    // Generate monthly data (last 12 months)
    const netVsGross = Array.from({ length: 12 }, (_, i) => {
      const month = new Date();
      month.setMonth(month.getMonth() - (11 - i));
      const monthStr = month.toLocaleString('default', { month: 'short', year: 'numeric' });

      const monthPayslips = payslips.filter(
        (p) =>
          p.period.month === month.getMonth() + 1 && p.period.year === month.getFullYear()
      );

      return {
        month: monthStr,
        gross: monthPayslips.reduce((sum, p) => sum + p.earnings.grossMonthly, 0),
        net: monthPayslips.reduce((sum, p) => sum + p.netPay, 0),
      };
    });

    const contributions = netVsGross.map((item) => ({
      month: item.month,
      maladie: Math.random() * 500 + 200,
      pension: Math.random() * 800 + 400,
      sante: Math.random() * 400 + 200,
      accident: Math.random() * 150 + 50,
    }));

    const taxes = netVsGross.map((item) => ({
      month: item.month,
      amount: Math.random() * 2000 + 1000,
    }));

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
}));