import { create } from 'zustand';
import type { Company, Employee, Payslip, CompanyAnalytics } from '@/types';

interface Individual {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  companyId?: string;
}

interface DataState {
  companies: Company[];
  employees: Employee[];
  individuals: Individual[];
  payslips: Payslip[];
  addCompany: (company: Omit<Company, 'id' | 'createdAt'>) => void;
  updateCompany: (id: string, company: Partial<Company>) => void;
  deleteCompany: (id: string) => void;
  addEmployee: (employee: Omit<Employee, 'id'>) => void;
  updateEmployee: (id: string, employee: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  addIndividual: (individual: Omit<Individual, 'id'>) => void;
  updateIndividual: (id: string, individual: Partial<Individual>) => void;
  deleteIndividual: (id: string) => void;
  addPayslip: (payslip: Omit<Payslip, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updatePayslip: (id: string, payslip: Partial<Payslip>) => void;
  deletePayslip: (id: string) => void;
  getCompanyAnalytics: (companyId: string) => CompanyAnalytics;
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
    class: 'Cadre A',
    hireDate: '2020-01-15',
    terminationDate: null,
    baseSalary: 5500,
    status: 'active',
  },
  {
    id: 'emp-2',
    companyId: 'company-1',
    firstName: 'Marie',
    lastName: 'Dupont',
    email: 'marie.dupont@advensys.lu',
    class: 'Employé B',
    hireDate: '2021-03-01',
    terminationDate: null,
    baseSalary: 4200,
    status: 'active',
  },
  {
    id: 'emp-3',
    companyId: 'company-1',
    firstName: 'Pierre',
    lastName: 'Martin',
    email: 'pierre.martin@advensys.lu',
    class: 'Cadre B',
    hireDate: '2019-06-15',
    terminationDate: '2024-12-31',
    baseSalary: 6000,
    status: 'terminated',
  },
  {
    id: 'emp-4',
    companyId: 'company-2',
    firstName: 'Sophie',
    lastName: 'Bernard',
    email: 'sophie.bernard@techcorp.lu',
    class: 'Employé A',
    hireDate: '2022-01-10',
    terminationDate: null,
    baseSalary: 4800,
    status: 'active',
  },
];

const mockIndividuals: Individual[] = [
  {
    id: 'ind-1',
    firstName: 'Jean',
    lastName: 'Consultant',
    email: 'jean.consultant@freelance.lu',
    companyId: 'company-1',
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
      class: 'Cadre A',
      hireDate: '2020-01-15',
      terminationDate: null,
    },
    company: {
      id: 'company-1',
      name: 'Groupe Advensys Luxembourg SA',
      country: 'Luxembourg',
      currency: 'EUR',
    },
    earnings: {
      grossMonthly: 5500,
      cotisable: 5500,
      imposable: 5200,
    },
    employeeContrib: {
      maladie: 154,
      pension: 440,
      otherDeductions: 50,
      incomeTax: 820,
      total: 1464,
    },
    employerContrib: {
      maladie: 154,
      pension: 440,
      sante: 220,
      accident: 55,
      socialSecurityTotal: 869,
    },
    netPay: 4036,
    ytd: {
      gross: 5500,
      net: 4036,
      employeeContribTotal: 1464,
      employerContribTotal: 869,
      taxes: 820,
    },
    lines: [
      {
        id: 'line-1',
        code: 'SAL-BASE',
        label_fr: 'Salaire de base',
        label_en: 'Base salary',
        quantity: 1,
        rate: 5500,
        amount: 5500,
        type: 'earning',
      },
      {
        id: 'line-2',
        code: 'CNS-MAL-EMP',
        label_fr: 'CNS Maladie (Employé 2.8%)',
        label_en: 'CNS Health (Employee 2.8%)',
        quantity: 1,
        rate: 0.028,
        amount: -154,
        type: 'deduction',
      },
      {
        id: 'line-3',
        code: 'CNS-PENS-EMP',
        label_fr: 'CNS Pension (Employé 8%)',
        label_en: 'CNS Pension (Employee 8%)',
        quantity: 1,
        rate: 0.08,
        amount: -440,
        type: 'deduction',
      },
      {
        id: 'line-4',
        code: 'IMP',
        label_fr: 'Impôt sur le revenu',
        label_en: 'Income tax',
        quantity: 1,
        rate: 0.15,
        amount: -820,
        type: 'deduction',
      },
      {
        id: 'line-5',
        code: 'CNS-MAL-EMP-R',
        label_fr: 'CNS Maladie (Employeur 2.8%)',
        label_en: 'CNS Health (Employer 2.8%)',
        quantity: 1,
        rate: 0.028,
        amount: 154,
        type: 'employer_contrib',
      },
      {
        id: 'line-6',
        code: 'CNS-PENS-EMP-R',
        label_fr: 'CNS Pension (Employeur 8%)',
        label_en: 'CNS Pension (Employer 8%)',
        quantity: 1,
        rate: 0.08,
        amount: 440,
        type: 'employer_contrib',
      },
    ],
    createdAt: '2024-01-31T12:00:00Z',
    updatedAt: '2024-01-31T12:00:00Z',
  },
];

export const useDataStore = create<DataState>((set, get) => ({
  companies: mockCompanies,
  employees: mockEmployees,
  individuals: mockIndividuals,
  payslips: mockPayslips,

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
      individuals: [...state.individuals, { ...individual, id: `ind-${Date.now()}` }],
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
}));