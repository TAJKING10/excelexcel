import * as XLSX from 'xlsx';
import { Payslip, PayslipLine, ExcelImportMapping } from '@/types';

/**
 * Parse an Excel file and return the raw data as an array of objects
 */
export async function parseExcelFile(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });

        // Get the first worksheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          raw: false,
          defval: null
        });

        resolve(jsonData);
      } catch (error) {
        reject(new Error(`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsBinaryString(file);
  });
}

/**
 * Get column names from the parsed Excel data
 */
export function getExcelColumns(data: any[]): string[] {
  if (!data || data.length === 0) return [];
  return Object.keys(data[0]);
}

/**
 * Validate the mapped payslip data
 */
export function validatePayslipData(
  data: any[],
  mapping: ExcelImportMapping
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data || data.length === 0) {
    errors.push('No data found in Excel file');
    return { valid: false, errors };
  }

  // Check required mappings
  const requiredFields = [
    'employee.firstName',
    'employee.lastName',
    'employee.email',
    'period.month',
    'period.year',
    'earnings.grossMonthly',
    'netPay'
  ];

  const mappedFields = Object.values(mapping);
  const missingFields = requiredFields.filter(field => !mappedFields.includes(field));

  if (missingFields.length > 0) {
    errors.push(`Missing required field mappings: ${missingFields.join(', ')}`);
  }

  // Validate each row
  data.forEach((row, index) => {
    const rowNumber = index + 2; // Excel row number (1-based + header)

    // Validate email format
    const emailColumn = Object.keys(mapping).find(key => mapping[key] === 'employee.email');
    if (emailColumn && row[emailColumn]) {
      const email = String(row[emailColumn]);
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.push(`Row ${rowNumber}: Invalid email format "${email}"`);
      }
    }

    // Validate month (1-12)
    const monthColumn = Object.keys(mapping).find(key => mapping[key] === 'period.month');
    if (monthColumn && row[monthColumn]) {
      const month = Number(row[monthColumn]);
      if (isNaN(month) || month < 1 || month > 12) {
        errors.push(`Row ${rowNumber}: Month must be between 1 and 12`);
      }
    }

    // Validate year
    const yearColumn = Object.keys(mapping).find(key => mapping[key] === 'period.year');
    if (yearColumn && row[yearColumn]) {
      const year = Number(row[yearColumn]);
      if (isNaN(year) || year < 2000 || year > 2100) {
        errors.push(`Row ${rowNumber}: Invalid year "${row[yearColumn]}"`);
      }
    }

    // Validate numeric fields
    const numericFields = [
      'earnings.grossMonthly',
      'earnings.cotisable',
      'earnings.imposable',
      'employeeContrib.maladie',
      'employeeContrib.pension',
      'employeeContrib.otherDeductions',
      'employeeContrib.incomeTax',
      'employeeContrib.total',
      'employerContrib.maladie',
      'employerContrib.pension',
      'employerContrib.sante',
      'employerContrib.accident',
      'employerContrib.socialSecurityTotal',
      'netPay',
      'ytd.gross',
      'ytd.net',
      'ytd.employeeContribTotal',
      'ytd.employerContribTotal',
      'ytd.taxes'
    ];

    numericFields.forEach(field => {
      const column = Object.keys(mapping).find(key => mapping[key] === field);
      if (column && row[column] !== null && row[column] !== undefined && row[column] !== '') {
        const value = Number(row[column]);
        if (isNaN(value)) {
          errors.push(`Row ${rowNumber}: "${field}" must be a number, got "${row[column]}"`);
        }
      }
    });
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get nested object value using dot notation
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Set nested object value using dot notation
 */
function setNestedValue(obj: any, path: string, value: any): void {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  const target = keys.reduce((current, key) => {
    if (!current[key]) current[key] = {};
    return current[key];
  }, obj);
  target[lastKey] = value;
}

/**
 * Transform Excel data to Payslip objects
 */
export function transformToPayslips(
  data: any[],
  mapping: ExcelImportMapping,
  companyId: string
): Payslip[] {
  const payslips: Payslip[] = [];

  data.forEach((row, index) => {
    try {
      // Create base payslip object
      const payslip: any = {
        id: `payslip-${Date.now()}-${index}`,
        companyId,
        employeeId: `employee-${Date.now()}-${index}`,
        period: {
          month: 1,
          year: new Date().getFullYear()
        },
        employee: {
          id: `employee-${Date.now()}-${index}`,
          firstName: '',
          lastName: '',
          email: '',
          class: '',
          hireDate: new Date().toISOString().split('T')[0],
          terminationDate: null
        },
        company: {
          id: companyId,
          name: '',
          country: 'Luxembourg',
          currency: 'EUR'
        },
        earnings: {
          grossMonthly: 0,
          cotisable: 0,
          imposable: 0
        },
        employeeContrib: {
          maladie: 0,
          pension: 0,
          otherDeductions: 0,
          incomeTax: 0,
          total: 0
        },
        employerContrib: {
          maladie: 0,
          pension: 0,
          sante: 0,
          accident: 0,
          socialSecurityTotal: 0
        },
        netPay: 0,
        ytd: {
          gross: 0,
          net: 0,
          employeeContribTotal: 0,
          employerContribTotal: 0,
          taxes: 0
        },
        lines: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Map each column to the payslip structure
      Object.entries(mapping).forEach(([excelColumn, schemaField]) => {
        if (row[excelColumn] !== null && row[excelColumn] !== undefined && row[excelColumn] !== '') {
          let value = row[excelColumn];

          // Convert to appropriate type
          if (schemaField.includes('period.month') || schemaField.includes('period.year')) {
            value = Number(value);
          } else if (
            schemaField.includes('earnings.') ||
            schemaField.includes('employeeContrib.') ||
            schemaField.includes('employerContrib.') ||
            schemaField.includes('ytd.') ||
            schemaField === 'netPay'
          ) {
            value = Number(value);
          }

          setNestedValue(payslip, schemaField, value);
        }
      });

      // Generate lines if not mapped
      if (payslip.lines.length === 0) {
        const lines: PayslipLine[] = [];

        if (payslip.earnings.grossMonthly > 0) {
          lines.push({
            id: `line-${Date.now()}-${index}-1`,
            code: 'GROSS',
            label_fr: 'Salaire brut',
            label_en: 'Gross Salary',
            quantity: 1,
            rate: payslip.earnings.grossMonthly,
            amount: payslip.earnings.grossMonthly,
            type: 'earning'
          });
        }

        if (payslip.employeeContrib.maladie > 0) {
          lines.push({
            id: `line-${Date.now()}-${index}-2`,
            code: 'EE_MALADIE',
            label_fr: 'Cotisation maladie employé',
            label_en: 'Employee Health Contribution',
            quantity: 1,
            rate: payslip.employeeContrib.maladie,
            amount: payslip.employeeContrib.maladie,
            type: 'deduction'
          });
        }

        if (payslip.employeeContrib.pension > 0) {
          lines.push({
            id: `line-${Date.now()}-${index}-3`,
            code: 'EE_PENSION',
            label_fr: 'Cotisation pension employé',
            label_en: 'Employee Pension Contribution',
            quantity: 1,
            rate: payslip.employeeContrib.pension,
            amount: payslip.employeeContrib.pension,
            type: 'deduction'
          });
        }

        if (payslip.employeeContrib.incomeTax > 0) {
          lines.push({
            id: `line-${Date.now()}-${index}-4`,
            code: 'TAX',
            label_fr: 'Impôt sur le revenu',
            label_en: 'Income Tax',
            quantity: 1,
            rate: payslip.employeeContrib.incomeTax,
            amount: payslip.employeeContrib.incomeTax,
            type: 'deduction'
          });
        }

        payslip.lines = lines;
      }

      payslips.push(payslip as Payslip);
    } catch (error) {
    }
  });

  return payslips;
}

/**
 * Export an Excel template for payslip import
 */
export function exportExcelTemplate(): void {
  // Create template data
  const templateData = [
    {
      'First Name': 'John',
      'Last Name': 'Doe',
      'Email': 'john.doe@example.com',
      'Class': 'A1',
      'Hire Date': '2024-01-01',
      'Month': '1',
      'Year': '2024',
      'Gross Monthly': '5000',
      'Cotisable': '5000',
      'Imposable': '5000',
      'Employee Health': '154.50',
      'Employee Pension': '400.00',
      'Other Deductions': '0',
      'Income Tax': '850.00',
      'Employee Contrib Total': '1404.50',
      'Employer Health': '154.50',
      'Employer Pension': '400.00',
      'Employer Healthcare': '150.00',
      'Employer Accident': '50.00',
      'Employer Social Security Total': '754.50',
      'Net Pay': '3595.50',
      'YTD Gross': '5000',
      'YTD Net': '3595.50',
      'YTD Employee Contrib': '1404.50',
      'YTD Employer Contrib': '754.50',
      'YTD Taxes': '850.00'
    }
  ];

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(templateData);

  // Set column widths
  const colWidths = [
    { wch: 15 }, // First Name
    { wch: 15 }, // Last Name
    { wch: 25 }, // Email
    { wch: 10 }, // Class
    { wch: 12 }, // Hire Date
    { wch: 8 },  // Month
    { wch: 8 },  // Year
    { wch: 15 }, // Gross Monthly
    { wch: 15 }, // Cotisable
    { wch: 15 }, // Imposable
    { wch: 15 }, // Employee Health
    { wch: 15 }, // Employee Pension
    { wch: 15 }, // Other Deductions
    { wch: 15 }, // Income Tax
    { wch: 20 }, // Employee Contrib Total
    { wch: 15 }, // Employer Health
    { wch: 15 }, // Employer Pension
    { wch: 18 }, // Employer Healthcare
    { wch: 15 }, // Employer Accident
    { wch: 25 }, // Employer Social Security Total
    { wch: 15 }, // Net Pay
    { wch: 15 }, // YTD Gross
    { wch: 15 }, // YTD Net
    { wch: 20 }, // YTD Employee Contrib
    { wch: 20 }, // YTD Employer Contrib
    { wch: 15 }  // YTD Taxes
  ];
  worksheet['!cols'] = colWidths;

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Payslips');

  // Download file
  XLSX.writeFile(workbook, 'payslip_import_template.xlsx');
}

/**
 * Get schema field options for mapping
 */
export function getSchemaFieldOptions(): { value: string; label: string; group: string }[] {
  return [
    // Employee fields
    { value: 'employee.firstName', label: 'First Name', group: 'Employee' },
    { value: 'employee.lastName', label: 'Last Name', group: 'Employee' },
    { value: 'employee.email', label: 'Email', group: 'Employee' },
    { value: 'employee.class', label: 'Class', group: 'Employee' },
    { value: 'employee.hireDate', label: 'Hire Date', group: 'Employee' },
    { value: 'employee.terminationDate', label: 'Termination Date', group: 'Employee' },

    // Period fields
    { value: 'period.month', label: 'Month', group: 'Period' },
    { value: 'period.year', label: 'Year', group: 'Period' },

    // Earnings fields
    { value: 'earnings.grossMonthly', label: 'Gross Monthly', group: 'Earnings' },
    { value: 'earnings.cotisable', label: 'Cotisable', group: 'Earnings' },
    { value: 'earnings.imposable', label: 'Imposable', group: 'Earnings' },

    // Employee Contributions
    { value: 'employeeContrib.maladie', label: 'Employee Health', group: 'Employee Contributions' },
    { value: 'employeeContrib.pension', label: 'Employee Pension', group: 'Employee Contributions' },
    { value: 'employeeContrib.otherDeductions', label: 'Other Deductions', group: 'Employee Contributions' },
    { value: 'employeeContrib.incomeTax', label: 'Income Tax', group: 'Employee Contributions' },
    { value: 'employeeContrib.total', label: 'Employee Contrib Total', group: 'Employee Contributions' },

    // Employer Contributions
    { value: 'employerContrib.maladie', label: 'Employer Health', group: 'Employer Contributions' },
    { value: 'employerContrib.pension', label: 'Employer Pension', group: 'Employer Contributions' },
    { value: 'employerContrib.sante', label: 'Employer Healthcare', group: 'Employer Contributions' },
    { value: 'employerContrib.accident', label: 'Employer Accident', group: 'Employer Contributions' },
    { value: 'employerContrib.socialSecurityTotal', label: 'Social Security Total', group: 'Employer Contributions' },

    // Net Pay
    { value: 'netPay', label: 'Net Pay', group: 'Pay' },

    // Year to Date
    { value: 'ytd.gross', label: 'YTD Gross', group: 'Year to Date' },
    { value: 'ytd.net', label: 'YTD Net', group: 'Year to Date' },
    { value: 'ytd.employeeContribTotal', label: 'YTD Employee Contrib', group: 'Year to Date' },
    { value: 'ytd.employerContribTotal', label: 'YTD Employer Contrib', group: 'Year to Date' },
    { value: 'ytd.taxes', label: 'YTD Taxes', group: 'Year to Date' }
  ];
}