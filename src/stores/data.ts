import { create } from 'zustand'

export interface Employee {
  id: string
  firstName: string
  lastName: string
  email: string
  status: 'active' | 'inactive'
  baseSalary: number
  companyId: string
  class: string
  startDate: string
  endDate?: string
}

export interface Company {
  id: string
  name: string
  employeeCount: number
  totalPayroll: number
}

export interface Individual {
  id: string
  firstName: string
  lastName: string
  email: string
}

export interface Payslip {
  id: string
  employeeId?: string
  individualId?: string
  companyId: string
  period: string
  lines: PayslipLine[]
  createdAt: string
}

export interface PayslipLine {
  id: string
  description: string
  monthly: number
  annual: number
  type: 'brut' | 'cotisable' | 'deduction' | 'pension' | 'charge' | 'total'
}

interface DataState {
  employees: Employee[]
  companies: Company[]
  individuals: Individual[]
  payslips: Payslip[]
  addEmployee: (employee: Omit<Employee, 'id'>) => void
  updateEmployee: (id: string, employee: Partial<Employee>) => void
  deleteEmployee: (id: string) => void
  addPayslip: (payslip: Omit<Payslip, 'id' | 'createdAt'>) => void
  updatePayslip: (id: string, payslip: Partial<Payslip>) => void
}

const mockEmployees: Employee[] = [
  {
    id: '1',
    firstName: 'Jean',
    lastName: 'Dupont',
    email: 'jean.dupont@example.com',
    status: 'active',
    baseSalary: 45000,
    companyId: '1',
    class: 'Cadre',
    startDate: '2023-01-15'
  },
  {
    id: '2',
    firstName: 'Marie',
    lastName: 'Martin',
    email: 'marie.martin@example.com',
    status: 'active',
    baseSalary: 38000,
    companyId: '1',
    class: 'Employé',
    startDate: '2023-03-01'
  },
  {
    id: '3',
    firstName: 'Pierre',
    lastName: 'Bernard',
    email: 'pierre.bernard@example.com',
    status: 'inactive',
    baseSalary: 42000,
    companyId: '2',
    class: 'Technicien',
    startDate: '2022-06-15',
    endDate: '2024-01-31'
  }
]

const mockCompanies: Company[] = [
  {
    id: '1',
    name: 'TechCorp Solutions',
    employeeCount: 25,
    totalPayroll: 125000
  },
  {
    id: '2',
    name: 'Innovation Labs',
    employeeCount: 18,
    totalPayroll: 98000
  },
  {
    id: '3',
    name: 'Digital Services',
    employeeCount: 32,
    totalPayroll: 156000
  }
]

const mockIndividuals: Individual[] = [
  {
    id: '1',
    firstName: 'Sophie',
    lastName: 'Consultant',
    email: 'sophie.consultant@freelance.com'
  }
]

export const useDataStore = create<DataState>((set) => ({
  employees: mockEmployees,
  companies: mockCompanies,
  individuals: mockIndividuals,
  payslips: [],
  
  addEmployee: (employee) => set((state) => ({
    employees: [...state.employees, { ...employee, id: Date.now().toString() }]
  })),
  
  updateEmployee: (id, employee) => set((state) => ({
    employees: state.employees.map(emp => 
      emp.id === id ? { ...emp, ...employee } : emp
    )
  })),
  
  deleteEmployee: (id) => set((state) => ({
    employees: state.employees.filter(emp => emp.id !== id)
  })),
  
  addPayslip: (payslip) => set((state) => ({
    payslips: [...state.payslips, { 
      ...payslip, 
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    }]
  })),
  
  updatePayslip: (id, payslip) => set((state) => ({
    payslips: state.payslips.map(ps => 
      ps.id === id ? { ...ps, ...payslip } : ps
    )
  }))
}))
