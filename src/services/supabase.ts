import { supabase } from '@/lib/supabase';
import type {
  Company,
  Employee,
  Individual,
  Payslip,
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
      .select('*')
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

    // Fetch related data separately to avoid join issues with individuals
    const payslips = await Promise.all((data || []).map(async (row) => {
      let employeeData = null;
      let companyData = null;
      let individualData = null;

      // Try to fetch employee
      if (row.employee_id) {
        const { data: empData } = await supabase
          .from('employees')
          .select('*')
          .eq('id', row.employee_id)
          .maybeSingle();

        if (empData) {
          employeeData = empData;
        } else {
          // Try individual
          const { data: indData } = await supabase
            .from('individuals')
            .select('*')
            .eq('id', row.employee_id)
            .maybeSingle();
          individualData = indData;
        }
      }

      // Try to fetch company
      if (row.company_id) {
        const { data: compData } = await supabase
          .from('companies')
          .select('*')
          .eq('id', row.company_id)
          .maybeSingle();
        companyData = compData;
      }

      const personData = employeeData || individualData;
      if (!personData) return null;

      const employee = {
        id: personData.id,
        firstName: personData.first_name,
        lastName: personData.last_name,
        email: personData.email || '',
        class: personData.class || 'Individual',
        hireDate: personData.hire_date || personData.created_at,
        terminationDate: personData.termination_date || null,
        matricule: personData.matricule || '',
        identityNumber: personData.identity_number || '',
        address: personData.address || '',
        city: personData.city || '',
        postalCode: personData.postal_code || '',
        anciennete: personData.anciennete || null
      };

      const company = companyData ? {
        id: companyData.id,
        name: companyData.name,
        country: companyData.country,
        currency: companyData.currency,
        address: companyData.address || '',
        city: companyData.city || '',
        postalCode: companyData.postal_code || '',
        registrationNumber: companyData.registration_number || ''
      } : {
        id: `individual-${personData.id}`,
        name: `${personData.first_name} ${personData.last_name}`,
        country: personData.country || 'Luxembourg',
        currency: personData.currency || 'EUR',
        address: '',
        city: '',
        postalCode: '',
        registrationNumber: ''
      };

      return {
        id: row.id,
        employeeId: row.employee_id,
        individualId: individualData ? individualData.id : null,
        companyId: row.company_id,
        year: row.year,
        employee,
        company,
        monthlyData: row.monthly_data || [],
        annualTotals: row.annual_totals || {},
        recapitulation: row.recapitulation || {},
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    }));

    return payslips.filter(p => p !== null) as AnnualPayslip[];
  },

  async getById(id: string): Promise<AnnualPayslip | null> {
    const { data, error } = await supabase
      .from('annual_payslips')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    // Fetch employee/individual and company separately
    let employeeData = null;
    let companyData = null;
    let individualData = null;

    if (data.employee_id) {
      const { data: empData } = await supabase
        .from('employees')
        .select('*')
        .eq('id', data.employee_id)
        .maybeSingle();

      if (empData) {
        employeeData = empData;

        if (data.company_id) {
          const { data: compData } = await supabase
            .from('companies')
            .select('*')
            .eq('id', data.company_id)
            .maybeSingle();
          companyData = compData;
        }
      } else {
        const { data: indData } = await supabase
          .from('individuals')
          .select('*')
          .eq('id', data.employee_id)
          .maybeSingle();
        individualData = indData;
      }
    }

    const personData = employeeData || individualData;
    if (!personData) return null;

    const employee = {
      id: personData.id,
      firstName: personData.first_name,
      lastName: personData.last_name,
      email: personData.email || '',
      class: personData.class || 'Individual',
      hireDate: personData.hire_date || personData.created_at,
      terminationDate: personData.termination_date || null,
      matricule: personData.matricule || '',
      identityNumber: personData.identity_number || '',
      address: personData.address || '',
      city: personData.city || '',
      postalCode: personData.postal_code || '',
      anciennete: personData.anciennete || null
    };

    const company = companyData ? {
      id: companyData.id,
      name: companyData.name,
      country: companyData.country,
      currency: companyData.currency,
      address: companyData.address || '',
      city: companyData.city || '',
      postalCode: companyData.postal_code || '',
      registrationNumber: companyData.registration_number || ''
    } : {
      id: `individual-${personData.id}`,
      name: `${personData.first_name} ${personData.last_name}`,
      country: personData.country || 'Luxembourg',
      currency: personData.currency || 'EUR',
      address: '',
      city: '',
      postalCode: '',
      registrationNumber: ''
    };

    return {
      id: data.id,
      employeeId: data.employee_id,
      individualId: individualData ? individualData.id : null,
      companyId: data.company_id,
      year: data.year,
      employee,
      company,
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

    // Check if this is for an individual (no company_id) or employee
    let employeeData = null;
    let companyData = null;
    let individualData = null;

    if (payslipData.employee_id) {
      // Try to fetch as employee first
      const { data: empData } = await supabase
        .from('employees')
        .select('*')
        .eq('id', payslipData.employee_id)
        .maybeSingle();

      if (empData) {
        employeeData = empData;

        // Fetch company if employee exists
        if (payslipData.company_id) {
          const { data: compData } = await supabase
            .from('companies')
            .select('*')
            .eq('id', payslipData.company_id)
            .maybeSingle();
          companyData = compData;
        }
      } else {
        // Try to fetch as individual
        const { data: indData } = await supabase
          .from('individuals')
          .select('*')
          .eq('id', payslipData.employee_id)
          .maybeSingle();
        individualData = indData;
      }
    }

    // Build employee object from either employee or individual
    const personData = employeeData || individualData;
    if (!personData) return null;

    const employee = {
      id: personData.id,
      firstName: personData.first_name,
      lastName: personData.last_name,
      email: personData.email || '',
      class: personData.class || 'Individual',
      hireDate: personData.hire_date || personData.created_at,
      terminationDate: personData.termination_date || null,
      matricule: personData.matricule || '',
      identityNumber: personData.identity_number || '',
      address: personData.address || '',
      city: personData.city || '',
      postalCode: personData.postal_code || '',
      anciennete: personData.anciennete || null
    };

    // Build company object (or mock for individuals)
    const company = companyData ? {
      id: companyData.id,
      name: companyData.name,
      country: companyData.country,
      currency: companyData.currency,
      address: companyData.address || '',
      city: companyData.city || '',
      postalCode: companyData.postal_code || '',
      registrationNumber: companyData.registration_number || ''
    } : {
      id: `individual-${personData.id}`,
      name: `${personData.first_name} ${personData.last_name}`,
      country: personData.country || 'Luxembourg',
      currency: personData.currency || 'EUR',
      address: '',
      city: '',
      postalCode: '',
      registrationNumber: ''
    };

    return {
      id: payslipData.id,
      employeeId: payslipData.employee_id,
      individualId: individualData ? individualData.id : null,
      companyId: payslipData.company_id,
      year: payslipData.year,
      employee,
      company,
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
      .select('*')
      .single();

    if (error) throw error;

    // Use getById to fetch the complete payslip with proper employee/individual handling
    const fullPayslip = await this.getById(data.id);
    if (!fullPayslip) throw new Error('Failed to retrieve created payslip');

    return fullPayslip;
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

// ============================================
// INDIVIDUAL SERVICES
// ============================================

export const individualService = {
  async getAll(): Promise<Individual[]> {
    const { data, error } = await supabase
      .from('individuals')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(row => ({
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      matricule: row.matricule,
      address: row.address,
      country: row.country,
      currency: row.currency,
      baseSalary: parseFloat(row.base_salary),
      taxClass: row.tax_class,
      status: row.status,
      createdAt: row.created_at
    }));
  },

  async getById(id: string): Promise<Individual | null> {
    const { data, error } = await supabase
      .from('individuals')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return {
      id: data.id,
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      matricule: data.matricule,
      address: data.address,
      country: data.country,
      currency: data.currency,
      baseSalary: parseFloat(data.base_salary),
      taxClass: data.tax_class,
      status: data.status,
      createdAt: data.created_at
    };
  },

  async create(individual: Omit<Individual, 'id' | 'createdAt'>): Promise<Individual> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('individuals')
      .insert({
        first_name: individual.firstName,
        last_name: individual.lastName,
        email: individual.email,
        matricule: individual.matricule,
        address: individual.address,
        country: individual.country,
        currency: individual.currency,
        base_salary: individual.baseSalary,
        tax_class: String(individual.taxClass),
        status: individual.status || 'active',
        created_by: user?.id
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      matricule: data.matricule,
      address: data.address,
      country: data.country,
      currency: data.currency,
      baseSalary: parseFloat(data.base_salary),
      taxClass: data.tax_class,
      status: data.status,
      createdAt: data.created_at
    };
  },

  async update(id: string, updates: Partial<Individual>): Promise<Individual> {
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (updates.firstName !== undefined) updateData.first_name = updates.firstName;
    if (updates.lastName !== undefined) updateData.last_name = updates.lastName;
    if (updates.email !== undefined) updateData.email = updates.email;
    if (updates.matricule !== undefined) updateData.matricule = updates.matricule;
    if (updates.address !== undefined) updateData.address = updates.address;
    if (updates.country !== undefined) updateData.country = updates.country;
    if (updates.currency !== undefined) updateData.currency = updates.currency;
    if (updates.baseSalary !== undefined) updateData.base_salary = updates.baseSalary;
    if (updates.taxClass !== undefined) updateData.tax_class = String(updates.taxClass);
    if (updates.status !== undefined) updateData.status = updates.status;

    const { data, error } = await supabase
      .from('individuals')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      matricule: data.matricule,
      address: data.address,
      country: data.country,
      currency: data.currency,
      baseSalary: parseFloat(data.base_salary),
      taxClass: data.tax_class,
      status: data.status,
      createdAt: data.created_at
    };
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('individuals')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

// ============================================
// PAYSLIP SERVICES
// ============================================

export const payslipService = {
  async getAll(filters?: { companyId?: string; employeeId?: string; individualId?: string }): Promise<Payslip[]> {
    let query = supabase
      .from('payslips')
      .select('*')
      .order('period_year', { ascending: false })
      .order('period_month', { ascending: false });

    if (filters?.companyId) {
      query = query.eq('company_id', filters.companyId);
    }
    if (filters?.employeeId) {
      query = query.eq('employee_id', filters.employeeId);
    }
    if (filters?.individualId) {
      query = query.eq('individual_id', filters.individualId);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Transform database rows to Payslip type
    return (data || []).map(row => ({
      id: row.id,
      employeeId: row.employee_id,
      companyId: row.company_id,
      individualId: row.individual_id,
      period: {
        month: row.period_month,
        year: row.period_year
      },
      employee: row.employee || {},
      company: row.company || {},
      earnings: {
        grossMonthly: parseFloat(row.gross_salary || 0),
        cotisable: parseFloat(row.gross_salary || 0),
        imposable: parseFloat(row.gross_salary || 0),
        remunerationBase: parseFloat(row.base_salary || 0)
      },
      employeeContrib: {
        maladie: parseFloat(row.health_insurance || 0),
        pension: parseFloat(row.pension || 0),
        incomeTax: parseFloat(row.income_tax || 0),
        total: parseFloat(row.total_deductions || 0),
        otherDeductions: 0,
        ciCo2: 0,
        cis: 0,
        cissm: 0,
        deductions: 0
      },
      employerContrib: {
        maladie: 0,
        pension: 0,
        sante: 0,
        accident: 0,
        socialSecurityTotal: 0
      },
      netPay: parseFloat(row.net_salary || 0),
      ytd: {
        gross: 0,
        net: 0,
        employeeContribTotal: 0,
        employerContribTotal: 0,
        taxes: 0
      },
      lines: [],
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  },

  async getById(id: string): Promise<Payslip | null> {
    const { data, error } = await supabase
      .from('payslips')
      .select('*')
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
      individualId: data.individual_id,
      period: {
        month: data.period_month,
        year: data.period_year
      },
      employee: data.employee || {},
      company: data.company || {},
      earnings: {
        grossMonthly: parseFloat(data.gross_salary || 0),
        cotisable: parseFloat(data.gross_salary || 0),
        imposable: parseFloat(data.gross_salary || 0),
        remunerationBase: parseFloat(data.base_salary || 0)
      },
      employeeContrib: {
        maladie: parseFloat(data.health_insurance || 0),
        pension: parseFloat(data.pension || 0),
        incomeTax: parseFloat(data.income_tax || 0),
        total: parseFloat(data.total_deductions || 0),
        otherDeductions: 0,
        ciCo2: 0,
        cis: 0,
        cissm: 0,
        deductions: 0
      },
      employerContrib: {
        maladie: 0,
        pension: 0,
        sante: 0,
        accident: 0,
        socialSecurityTotal: 0
      },
      netPay: parseFloat(data.net_salary || 0),
      ytd: {
        gross: 0,
        net: 0,
        employeeContribTotal: 0,
        employerContribTotal: 0,
        taxes: 0
      },
      lines: [],
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  },

  async create(payslip: Omit<Payslip, 'id' | 'createdAt' | 'updatedAt'>): Promise<Payslip> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('payslips')
      .insert({
        company_id: payslip.companyId,
        employee_id: payslip.employeeId,
        individual_id: payslip.individualId,
        period_month: payslip.period.month,
        period_year: payslip.period.year,
        base_salary: payslip.earnings.remunerationBase || payslip.earnings.grossMonthly,
        bonus: payslip.earnings.bonus || 0,
        overtime: payslip.earnings.overtime || 0,
        gross_salary: payslip.earnings.grossMonthly,
        social_security: payslip.employeeContrib.pension || 0,
        health_insurance: payslip.employeeContrib.maladie || 0,
        pension: payslip.employeeContrib.pension || 0,
        income_tax: payslip.employeeContrib.incomeTax || 0,
        total_deductions: payslip.employeeContrib.total,
        net_salary: payslip.netPay,
        notes: payslip.notes || null,
        created_by: user?.id
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      employeeId: data.employee_id,
      companyId: data.company_id,
      individualId: data.individual_id,
      period: {
        month: data.period_month,
        year: data.period_year
      },
      employee: payslip.employee,
      company: payslip.company,
      earnings: payslip.earnings,
      employeeContrib: payslip.employeeContrib,
      employerContrib: payslip.employerContrib,
      netPay: parseFloat(data.net_salary),
      ytd: payslip.ytd,
      lines: payslip.lines || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  },

  async update(id: string, updates: Partial<Payslip>): Promise<Payslip> {
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (updates.earnings) {
      if (updates.earnings.remunerationBase !== undefined) updateData.base_salary = updates.earnings.remunerationBase;
      if (updates.earnings.grossMonthly !== undefined) updateData.gross_salary = updates.earnings.grossMonthly;
      if (updates.earnings.bonus !== undefined) updateData.bonus = updates.earnings.bonus;
      if (updates.earnings.overtime !== undefined) updateData.overtime = updates.earnings.overtime;
    }

    if (updates.employeeContrib) {
      if (updates.employeeContrib.maladie !== undefined) updateData.health_insurance = updates.employeeContrib.maladie;
      if (updates.employeeContrib.pension !== undefined) {
        updateData.pension = updates.employeeContrib.pension;
        updateData.social_security = updates.employeeContrib.pension;
      }
      if (updates.employeeContrib.incomeTax !== undefined) updateData.income_tax = updates.employeeContrib.incomeTax;
      if (updates.employeeContrib.total !== undefined) updateData.total_deductions = updates.employeeContrib.total;
    }

    if (updates.netPay !== undefined) updateData.net_salary = updates.netPay;
    if (updates.notes !== undefined) updateData.notes = updates.notes;

    const { data, error } = await supabase
      .from('payslips')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Get the full payslip to return
    const fullPayslip = await this.getById(id);
    if (!fullPayslip) throw new Error('Payslip not found after update');

    return fullPayslip;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('payslips')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

// ============================================
// INDIVIDUAL ANNUAL PAYSLIP SERVICE
// ============================================

export const individualAnnualPayslipService = {
  async getAll(filters?: { individualId?: string; year?: number }): Promise<AnnualPayslip[]> {
    let query = supabase
      .from('individual_payslips')
      .select('*')
      .order('year', { ascending: false });

    if (filters?.individualId) {
      query = query.eq('individual_id', filters.individualId);
    }
    if (filters?.year) {
      query = query.eq('year', filters.year);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Fetch related individual data
    const payslips = await Promise.all((data || []).map(async (row) => {
      const { data: individualData } = await supabase
        .from('individuals')
        .select('*')
        .eq('id', row.individual_id)
        .maybeSingle();

      if (!individualData) return null;

      const employee = {
        id: individualData.id,
        firstName: individualData.first_name,
        lastName: individualData.last_name,
        email: individualData.email || '',
        class: 'Individual',
        hireDate: individualData.created_at,
        terminationDate: null,
        matricule: individualData.matricule || '',
        identityNumber: '',
        address: individualData.address || '',
        city: '',
        postalCode: '',
        anciennete: null
      };

      // Mock company for individuals
      const company = {
        id: `individual-${individualData.id}`,
        name: `${individualData.first_name} ${individualData.last_name}`,
        country: individualData.country || 'Luxembourg',
        currency: individualData.currency || 'EUR',
        address: '',
        city: '',
        postalCode: '',
        registrationNumber: ''
      };

      // Calculate detailed annualTotals from monthlyData
      const monthlyData = row.monthly_data || [];
      const annualTotals = {
        earnings: {
          remunerationBase: monthlyData.reduce((sum, m) => sum + (m.earnings?.remunerationBase || 0), 0),
          grossMonthly: monthlyData.reduce((sum, m) => sum + (m.earnings?.grossMonthly || 0), 0),
          cotisable: monthlyData.reduce((sum, m) => sum + (m.earnings?.cotisable || 0), 0),
          imposable: monthlyData.reduce((sum, m) => sum + (m.earnings?.imposable || 0), 0)
        },
        employeeContrib: {
          maladie: monthlyData.reduce((sum, m) => sum + (m.employeeContrib?.maladie || 0), 0),
          pension: monthlyData.reduce((sum, m) => sum + (m.employeeContrib?.pension || 0), 0),
          ciCo2: monthlyData.reduce((sum, m) => sum + (m.employeeContrib?.ciCo2 || 0), 0),
          cis: monthlyData.reduce((sum, m) => sum + (m.employeeContrib?.cis || 0), 0),
          cissm: monthlyData.reduce((sum, m) => sum + (m.employeeContrib?.cissm || 0), 0),
          deductions: monthlyData.reduce((sum, m) => sum + (m.employeeContrib?.deductions || 0), 0),
          incomeTax: monthlyData.reduce((sum, m) => sum + (m.employeeContrib?.incomeTax || 0), 0),
          total: monthlyData.reduce((sum, m) => sum + (m.employeeContrib?.total || 0), 0)
        },
        employerContrib: {
          maladie: monthlyData.reduce((sum, m) => sum + (m.employerContrib?.maladie || 0), 0),
          pension: monthlyData.reduce((sum, m) => sum + (m.employerContrib?.pension || 0), 0),
          sante: monthlyData.reduce((sum, m) => sum + (m.employerContrib?.sante || 0), 0),
          accident: monthlyData.reduce((sum, m) => sum + (m.employerContrib?.accident || 0), 0),
          socialSecurityTotal: monthlyData.reduce((sum, m) => sum + (m.employerContrib?.socialSecurityTotal || 0), 0)
        },
        netPay: monthlyData.reduce((sum, m) => sum + (m.netPay || 0), 0)
      };

      return {
        id: row.id,
        employeeId: row.individual_id,
        individualId: row.individual_id,
        companyId: null,
        year: row.year,
        employee,
        company,
        monthlyData,
        annualTotals,
        recapitulation: {
          totalGrossSalary: annualTotals.earnings.grossMonthly,
          totalNetSalary: annualTotals.netPay,
          totalEmployeeContributions: annualTotals.employeeContrib.total,
          totalEmployerContributions: annualTotals.employerContrib.socialSecurityTotal,
          totalTaxes: annualTotals.employeeContrib.incomeTax,
          totalHoursWorked: 0
        },
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    }));

    return payslips.filter(p => p !== null) as AnnualPayslip[];
  },

  async getById(id: string): Promise<AnnualPayslip | null> {
    const { data, error } = await supabase
      .from('individual_payslips')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    const { data: individualData } = await supabase
      .from('individuals')
      .select('*')
      .eq('id', data.individual_id)
      .maybeSingle();

    if (!individualData) return null;

    const employee = {
      id: individualData.id,
      firstName: individualData.first_name,
      lastName: individualData.last_name,
      email: individualData.email || '',
      class: 'Individual',
      hireDate: individualData.created_at,
      terminationDate: null,
      matricule: individualData.matricule || '',
      identityNumber: '',
      address: individualData.address || '',
      city: '',
      postalCode: '',
      anciennete: null
    };

    const company = {
      id: `individual-${individualData.id}`,
      name: `${individualData.first_name} ${individualData.last_name}`,
      country: individualData.country || 'Luxembourg',
      currency: individualData.currency || 'EUR',
      address: '',
      city: '',
      postalCode: '',
      registrationNumber: ''
    };

    // Calculate detailed annualTotals from monthlyData
    const monthlyData = data.monthly_data || [];
    const annualTotals = {
      earnings: {
        remunerationBase: monthlyData.reduce((sum, m) => sum + (m.earnings?.remunerationBase || 0), 0),
        grossMonthly: monthlyData.reduce((sum, m) => sum + (m.earnings?.grossMonthly || 0), 0),
        cotisable: monthlyData.reduce((sum, m) => sum + (m.earnings?.cotisable || 0), 0),
        imposable: monthlyData.reduce((sum, m) => sum + (m.earnings?.imposable || 0), 0)
      },
      employeeContrib: {
        maladie: monthlyData.reduce((sum, m) => sum + (m.employeeContrib?.maladie || 0), 0),
        pension: monthlyData.reduce((sum, m) => sum + (m.employeeContrib?.pension || 0), 0),
        ciCo2: monthlyData.reduce((sum, m) => sum + (m.employeeContrib?.ciCo2 || 0), 0),
        cis: monthlyData.reduce((sum, m) => sum + (m.employeeContrib?.cis || 0), 0),
        cissm: monthlyData.reduce((sum, m) => sum + (m.employeeContrib?.cissm || 0), 0),
        deductions: monthlyData.reduce((sum, m) => sum + (m.employeeContrib?.deductions || 0), 0),
        incomeTax: monthlyData.reduce((sum, m) => sum + (m.employeeContrib?.incomeTax || 0), 0),
        total: monthlyData.reduce((sum, m) => sum + (m.employeeContrib?.total || 0), 0)
      },
      employerContrib: {
        maladie: monthlyData.reduce((sum, m) => sum + (m.employerContrib?.maladie || 0), 0),
        pension: monthlyData.reduce((sum, m) => sum + (m.employerContrib?.pension || 0), 0),
        sante: monthlyData.reduce((sum, m) => sum + (m.employerContrib?.sante || 0), 0),
        accident: monthlyData.reduce((sum, m) => sum + (m.employerContrib?.accident || 0), 0),
        socialSecurityTotal: monthlyData.reduce((sum, m) => sum + (m.employerContrib?.socialSecurityTotal || 0), 0)
      },
      netPay: monthlyData.reduce((sum, m) => sum + (m.netPay || 0), 0)
    };

    return {
      id: data.id,
      employeeId: data.individual_id,
      individualId: data.individual_id,
      companyId: null,
      year: data.year,
      employee,
      company,
      monthlyData,
      annualTotals,
      recapitulation: {
        totalGrossSalary: annualTotals.earnings.grossMonthly,
        totalNetSalary: annualTotals.netPay,
        totalEmployeeContributions: annualTotals.employeeContrib.total,
        totalEmployerContributions: annualTotals.employerContrib.socialSecurityTotal,
        totalTaxes: annualTotals.employeeContrib.incomeTax,
        totalHoursWorked: 0
      },
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  },

  async getByIndividualAndYear(individualId: string, year: number): Promise<AnnualPayslip | null> {
    const { data, error } = await supabase
      .from('individual_payslips')
      .select('*')
      .eq('individual_id', individualId)
      .eq('year', year)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return this.getById(data.id);
  },

  async create(payslip: Omit<AnnualPayslip, 'id' | 'createdAt' | 'updatedAt'>): Promise<AnnualPayslip> {
    const { data: { user } } = await supabase.auth.getUser();

    // Calculate totals from monthly data
    const totalGross = payslip.monthlyData.reduce((sum, month) => sum + (month.earnings?.grossMonthly || 0), 0);
    const totalNet = payslip.monthlyData.reduce((sum, month) => sum + (month.netPay || 0), 0);
    const totalEmployeeContrib = payslip.monthlyData.reduce((sum, month) => sum + (month.employeeContrib?.total || 0), 0);
    const totalEmployerContrib = payslip.monthlyData.reduce((sum, month) => sum + (month.employerContrib?.total || 0), 0);

    const { data, error } = await supabase
      .from('individual_payslips')
      .insert({
        individual_id: payslip.individualId || payslip.employeeId,
        year: payslip.year,
        monthly_data: payslip.monthlyData,
        total_gross: totalGross,
        total_net: totalNet,
        total_employee_contrib: totalEmployeeContrib,
        total_employer_contrib: totalEmployerContrib,
        created_by: user?.id
      })
      .select('*')
      .single();

    if (error) throw error;

    const fullPayslip = await this.getById(data.id);
    if (!fullPayslip) throw new Error('Failed to retrieve created payslip');

    return fullPayslip;
  },

  async update(id: string, updates: Partial<Pick<AnnualPayslip, 'monthlyData'>>): Promise<AnnualPayslip> {
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (updates.monthlyData !== undefined) {
      updateData.monthly_data = updates.monthlyData;

      // Recalculate totals
      updateData.total_gross = updates.monthlyData.reduce((sum, month) => sum + (month.earnings?.grossMonthly || 0), 0);
      updateData.total_net = updates.monthlyData.reduce((sum, month) => sum + (month.netPay || 0), 0);
      updateData.total_employee_contrib = updates.monthlyData.reduce((sum, month) => sum + (month.employeeContrib?.total || 0), 0);
      updateData.total_employer_contrib = updates.monthlyData.reduce((sum, month) => sum + (month.employerContrib?.total || 0), 0);
    }

    const { error } = await supabase
      .from('individual_payslips')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;

    const fullPayslip = await this.getById(id);
    if (!fullPayslip) throw new Error('Payslip not found after update');

    return fullPayslip;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('individual_payslips')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
