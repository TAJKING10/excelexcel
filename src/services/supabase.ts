import { supabase } from '@/lib/supabase';
import type {
  Company,
  Employee,
  AnnualPayslip,
  ActivityLog,
  User,
  UserAccess
} from '@/types';

// ============================================
// COMPANY SERVICES
// ============================================

export const companyService = {
  async getAll(): Promise<Company[]> {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(row => ({
      id: row.id,
      name: row.name,
      country: row.country,
      currency: row.currency,
      createdAt: row.created_at,
      address: row.address,
      city: row.city,
      postalCode: row.postal_code,
      registrationNumber: row.registration_number
    }));
  },

  async getById(id: string): Promise<Company | null> {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return {
      id: data.id,
      name: data.name,
      country: data.country,
      currency: data.currency,
      createdAt: data.created_at,
      address: data.address,
      city: data.city,
      postalCode: data.postal_code,
      registrationNumber: data.registration_number
    };
  },

  async create(company: Omit<Company, 'id' | 'createdAt'>): Promise<Company> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('companies')
      .insert({
        name: company.name,
        country: company.country,
        currency: company.currency,
        address: company.address,
        city: company.city,
        postal_code: company.postalCode,
        registration_number: company.registrationNumber,
        created_by: user?.id
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      country: data.country,
      currency: data.currency,
      createdAt: data.created_at,
      address: data.address,
      city: data.city,
      postalCode: data.postal_code,
      registrationNumber: data.registration_number
    };
  },

  async update(id: string, updates: Partial<Company>): Promise<Company> {
    const { data, error } = await supabase
      .from('companies')
      .update({
        name: updates.name,
        country: updates.country,
        currency: updates.currency,
        address: updates.address,
        city: updates.city,
        postal_code: updates.postalCode,
        registration_number: updates.registrationNumber,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      country: data.country,
      currency: data.currency,
      createdAt: data.created_at,
      address: data.address,
      city: data.city,
      postalCode: data.postal_code,
      registrationNumber: data.registration_number
    };
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

// ============================================
// EMPLOYEE SERVICES
// ============================================

export const employeeService = {
  async getAll(companyId?: string): Promise<Employee[]> {
    let query = supabase
      .from('employees')
      .select('*')
      .order('created_at', { ascending: false });

    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map(row => ({
      id: row.id,
      companyId: row.company_id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      matricule: row.matricule,
      class: row.class,
      taxClass: row.tax_class,
      hireDate: row.hire_date,
      terminationDate: row.termination_date,
      baseSalary: parseFloat(row.base_salary),
      status: row.status,
      address: row.address,
      city: row.city,
      postalCode: row.postal_code,
      identityNumber: row.identity_number,
      anciennete: row.anciennete
    }));
  },

  async getById(id: string): Promise<Employee | null> {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return {
      id: data.id,
      companyId: data.company_id,
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      matricule: data.matricule,
      class: data.class,
      taxClass: data.tax_class,
      hireDate: data.hire_date,
      terminationDate: data.termination_date,
      baseSalary: parseFloat(data.base_salary),
      status: data.status,
      address: data.address,
      city: data.city,
      postalCode: data.postal_code,
      identityNumber: data.identity_number,
      anciennete: data.anciennete
    };
  },

  async create(employee: Omit<Employee, 'id'>): Promise<Employee> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('employees')
      .insert({
        company_id: employee.companyId,
        first_name: employee.firstName,
        last_name: employee.lastName,
        email: employee.email,
        matricule: employee.matricule,
        class: employee.class,
        tax_class: String(employee.taxClass),
        hire_date: employee.hireDate,
        termination_date: employee.terminationDate,
        base_salary: employee.baseSalary,
        status: employee.status,
        address: employee.address,
        city: employee.city,
        postal_code: employee.postalCode,
        identity_number: employee.identityNumber,
        anciennete: employee.anciennete,
        created_by: user?.id
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      companyId: data.company_id,
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      matricule: data.matricule,
      class: data.class,
      taxClass: data.tax_class,
      hireDate: data.hire_date,
      terminationDate: data.termination_date,
      baseSalary: parseFloat(data.base_salary),
      status: data.status,
      address: data.address,
      city: data.city,
      postalCode: data.postal_code,
      identityNumber: data.identity_number,
      anciennete: data.anciennete
    };
  },

  async update(id: string, updates: Partial<Employee>): Promise<Employee> {
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (updates.firstName !== undefined) updateData.first_name = updates.firstName;
    if (updates.lastName !== undefined) updateData.last_name = updates.lastName;
    if (updates.email !== undefined) updateData.email = updates.email;
    if (updates.matricule !== undefined) updateData.matricule = updates.matricule;
    if (updates.class !== undefined) updateData.class = updates.class;
    if (updates.taxClass !== undefined) updateData.tax_class = String(updates.taxClass);
    if (updates.hireDate !== undefined) updateData.hire_date = updates.hireDate;
    if (updates.terminationDate !== undefined) updateData.termination_date = updates.terminationDate;
    if (updates.baseSalary !== undefined) updateData.base_salary = updates.baseSalary;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.address !== undefined) updateData.address = updates.address;
    if (updates.city !== undefined) updateData.city = updates.city;
    if (updates.postalCode !== undefined) updateData.postal_code = updates.postalCode;
    if (updates.identityNumber !== undefined) updateData.identity_number = updates.identityNumber;
    if (updates.anciennete !== undefined) updateData.anciennete = updates.anciennete;

    const { data, error } = await supabase
      .from('employees')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      companyId: data.company_id,
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      matricule: data.matricule,
      class: data.class,
      taxClass: data.tax_class,
      hireDate: data.hire_date,
      terminationDate: data.termination_date,
      baseSalary: parseFloat(data.base_salary),
      status: data.status,
      address: data.address,
      city: data.city,
      postalCode: data.postal_code,
      identityNumber: data.identity_number,
      anciennete: data.anciennete
    };
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

// ============================================
// ANNUAL PAYSLIP SERVICES
// ============================================

export const annualPayslipService = {
  async getAll(filters?: { companyId?: string; employeeId?: string; year?: number }): Promise<AnnualPayslip[]> {
    let query = supabase
      .from('annual_payslips')
      .select(`
        *,
        employee:employees(*),
        company:companies(*)
      `)
      .order('year', { ascending: false });

    if (filters?.companyId) {
      query = query.eq('company_id', filters.companyId);
    }
    if (filters?.employeeId) {
      query = query.eq('employee_id', filters.employeeId);
    }
    if (filters?.year) {
      query = query.eq('year', filters.year);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map(row => ({
      id: row.id,
      employeeId: row.employee_id,
      companyId: row.company_id,
      year: row.year,
      employee: {
        id: row.employee.id,
        firstName: row.employee.first_name,
        lastName: row.employee.last_name,
        email: row.employee.email,
        class: row.employee.class,
        hireDate: row.employee.hire_date,
        terminationDate: row.employee.termination_date,
        matricule: row.employee.matricule,
        identityNumber: row.employee.identity_number,
        address: row.employee.address,
        city: row.employee.city,
        postalCode: row.employee.postal_code,
        anciennete: row.employee.anciennete
      },
      company: {
        id: row.company.id,
        name: row.company.name,
        country: row.company.country,
        currency: row.company.currency,
        address: row.company.address,
        city: row.company.city,
        postalCode: row.company.postal_code,
        registrationNumber: row.company.registration_number
      },
      monthlyData: row.monthly_data || [],
      annualTotals: row.annual_totals || {},
      recapitulation: row.recapitulation || {},
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  },

  async getById(id: string): Promise<AnnualPayslip | null> {
    const { data, error } = await supabase
      .from('annual_payslips')
      .select(`
        *,
        employee:employees(*),
        company:companies(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return {
      id: data.id,
      employeeId: data.employee_id,
      companyId: data.company_id,
      year: data.year,
      employee: {
        id: data.employee.id,
        firstName: data.employee.first_name,
        lastName: data.employee.last_name,
        email: data.employee.email,
        class: data.employee.class,
        hireDate: data.employee.hire_date,
        terminationDate: data.employee.termination_date,
        matricule: data.employee.matricule,
        identityNumber: data.employee.identity_number,
        address: data.employee.address,
        city: data.employee.city,
        postalCode: data.employee.postal_code,
        anciennete: data.employee.anciennete
      },
      company: {
        id: data.company.id,
        name: data.company.name,
        country: data.company.country,
        currency: data.company.currency,
        address: data.company.address,
        city: data.company.city,
        postalCode: data.company.postal_code,
        registrationNumber: data.company.registration_number
      },
      monthlyData: data.monthly_data || [],
      annualTotals: data.annual_totals || {},
      recapitulation: data.recapitulation || {},
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  },

  async getByEmployeeAndYear(employeeId: string, year: number): Promise<AnnualPayslip | null> {
    // First get the annual payslip
    const { data: payslipData, error: payslipError } = await supabase
      .from('annual_payslips')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('year', year)
      .maybeSingle();

    if (payslipError) throw payslipError;
    if (!payslipData) return null;

    // Then fetch employee and company separately
    const { data: employeeData } = await supabase
      .from('employees')
      .select('*')
      .eq('id', payslipData.employee_id)
      .single();

    const { data: companyData } = await supabase
      .from('companies')
      .select('*')
      .eq('id', payslipData.company_id)
      .single();

    if (!employeeData || !companyData) return null;

    return {
      id: payslipData.id,
      employeeId: payslipData.employee_id,
      companyId: payslipData.company_id,
      year: payslipData.year,
      employee: {
        id: employeeData.id,
        firstName: employeeData.first_name,
        lastName: employeeData.last_name,
        email: employeeData.email,
        class: employeeData.class,
        hireDate: employeeData.hire_date,
        terminationDate: employeeData.termination_date,
        matricule: employeeData.matricule,
        identityNumber: employeeData.identity_number,
        address: employeeData.address,
        city: employeeData.city,
        postalCode: employeeData.postal_code,
        anciennete: employeeData.anciennete
      },
      company: {
        id: companyData.id,
        name: companyData.name,
        country: companyData.country,
        currency: companyData.currency,
        address: companyData.address,
        city: companyData.city,
        postalCode: companyData.postal_code,
        registrationNumber: companyData.registration_number
      },
      monthlyData: payslipData.monthly_data || [],
      annualTotals: payslipData.annual_totals || {},
      recapitulation: payslipData.recapitulation || {},
      createdAt: payslipData.created_at,
      updatedAt: payslipData.updated_at
    };
  },

  async create(payslip: Omit<AnnualPayslip, 'id' | 'createdAt' | 'updatedAt'>): Promise<AnnualPayslip> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('annual_payslips')
      .insert({
        employee_id: payslip.employeeId,
        company_id: payslip.companyId,
        year: payslip.year,
        monthly_data: payslip.monthlyData,
        annual_totals: payslip.annualTotals,
        recapitulation: payslip.recapitulation,
        created_by: user?.id
      })
      .select(`
        *,
        employee:employees(*),
        company:companies(*)
      `)
      .single();

    if (error) throw error;

    return {
      id: data.id,
      employeeId: data.employee_id,
      companyId: data.company_id,
      year: data.year,
      employee: {
        id: data.employee.id,
        firstName: data.employee.first_name,
        lastName: data.employee.last_name,
        email: data.employee.email,
        class: data.employee.class,
        hireDate: data.employee.hire_date,
        terminationDate: data.employee.termination_date,
        matricule: data.employee.matricule,
        identityNumber: data.employee.identity_number,
        address: data.employee.address,
        city: data.employee.city,
        postalCode: data.employee.postal_code,
        anciennete: data.employee.anciennete
      },
      company: {
        id: data.company.id,
        name: data.company.name,
        country: data.company.country,
        currency: data.company.currency,
        address: data.company.address,
        city: data.company.city,
        postalCode: data.company.postal_code,
        registrationNumber: data.company.registration_number
      },
      monthlyData: data.monthly_data || [],
      annualTotals: data.annual_totals || {},
      recapitulation: data.recapitulation || {},
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  },

  async update(id: string, updates: Partial<Pick<AnnualPayslip, 'monthlyData' | 'annualTotals' | 'recapitulation'>>): Promise<AnnualPayslip> {
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (updates.monthlyData !== undefined) updateData.monthly_data = updates.monthlyData;
    if (updates.annualTotals !== undefined) updateData.annual_totals = updates.annualTotals;
    if (updates.recapitulation !== undefined) updateData.recapitulation = updates.recapitulation;

    const { data, error } = await supabase
      .from('annual_payslips')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        employee:employees(*),
        company:companies(*)
      `)
      .single();

    if (error) throw error;

    return {
      id: data.id,
      employeeId: data.employee_id,
      companyId: data.company_id,
      year: data.year,
      employee: {
        id: data.employee.id,
        firstName: data.employee.first_name,
        lastName: data.employee.last_name,
        email: data.employee.email,
        class: data.employee.class,
        hireDate: data.employee.hire_date,
        terminationDate: data.employee.termination_date,
        matricule: data.employee.matricule,
        identityNumber: data.employee.identity_number,
        address: data.employee.address,
        city: data.employee.city,
        postalCode: data.employee.postal_code,
        anciennete: data.employee.anciennete
      },
      company: {
        id: data.company.id,
        name: data.company.name,
        country: data.company.country,
        currency: data.company.currency,
        address: data.company.address,
        city: data.company.city,
        postalCode: data.company.postal_code,
        registrationNumber: data.company.registration_number
      },
      monthlyData: data.monthly_data || [],
      annualTotals: data.annual_totals || {},
      recapitulation: data.recapitulation || {},
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('annual_payslips')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

// ============================================
// ACTIVITY LOG SERVICES
// ============================================

export const activityLogService = {
  async create(log: Omit<ActivityLog, 'id' | 'timestamp'>): Promise<ActivityLog> {
    const { data, error } = await supabase
      .from('activity_logs')
      .insert({
        user_id: log.userId,
        username: log.username,
        action: log.action,
        entity_type: log.entityType,
        entity_id: log.entityId,
        entity_name: log.entityName,
        details: log.details,
        ip_address: log.ipAddress
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      userId: data.user_id,
      username: data.username,
      action: data.action,
      entityType: data.entity_type,
      entityId: data.entity_id,
      entityName: data.entity_name,
      details: data.details,
      timestamp: data.timestamp,
      ipAddress: data.ip_address
    };
  },

  async getAll(filters?: { userId?: string; entityType?: string; limit?: number }): Promise<ActivityLog[]> {
    let query = supabase
      .from('activity_logs')
      .select('*')
      .order('timestamp', { ascending: false });

    if (filters?.userId) {
      query = query.eq('user_id', filters.userId);
    }
    if (filters?.entityType) {
      query = query.eq('entity_type', filters.entityType);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map(row => ({
      id: row.id,
      userId: row.user_id,
      username: row.username,
      action: row.action,
      entityType: row.entity_type,
      entityId: row.entity_id,
      entityName: row.entity_name,
      details: row.details,
      timestamp: row.timestamp,
      ipAddress: row.ip_address
    }));
  }
};
