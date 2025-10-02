import * as XLSX from 'xlsx';
import type { Payslip, Employee, MonthlyPayslipData, WorkingHours } from '@/types';
import { parseMonthName, getMonthAbbreviation } from './luxembourgPayroll';

export interface AdvensysExcelData {
  companyInfo: {
    name: string;
    address: string;
    city: string;
    registrationNumber: string;
  };
  employees: Array<{
    employee: Partial<Employee>;
    payslips: Payslip[];
  }>;
}

/**
 * Parse Advensys Luxembourg Excel payroll file
 * Structure: Each employee has their own sheet with 12 months of data
 */
export async function parseAdvensysExcel(file: File, companyId: string): Promise<AdvensysExcelData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });

        const result: AdvensysExcelData = {
          companyInfo: {
            name: '',
            address: '',
            city: '',
            registrationNumber: '',
          },
          employees: [],
        };

        // Process each employee sheet (skip summary sheets)
        workbook.SheetNames.forEach((sheetName) => {
          // Skip summary sheets
          if (
            sheetName.includes('Salaire globale') ||
            sheetName.includes('Part Patronales') ||
            sheetName.includes('Recapitulation')
          ) {
            return;
          }

          const worksheet = workbook.Sheets[sheetName];
          const employeeData = parseEmployeeSheet(worksheet, companyId, sheetName);

          if (employeeData) {
            // Extract company info from first employee
            if (result.employees.length === 0 && employeeData.companyInfo) {
              result.companyInfo = employeeData.companyInfo;
            }

            result.employees.push({
              employee: employeeData.employee,
              payslips: employeeData.payslips,
            });
          }
        });

        resolve(result);
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

interface EmployeeSheetData {
  companyInfo: {
    name: string;
    address: string;
    city: string;
    registrationNumber: string;
  };
  employee: Partial<Employee>;
  payslips: Payslip[];
}

function parseEmployeeSheet(
  worksheet: XLSX.WorkSheet,
  companyId: string,
  sheetName: string
): EmployeeSheetData | null {
  try {
    // Convert sheet to 2D array
    const data: any[][] = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: '',
      blankrows: true,
    });

    if (!data || data.length < 10) return null;

    // Extract company info (rows 3-6)
    const companyName = data[3]?.[0] || '';
    const companyAddress = data[4]?.[0] || '';
    const companyCity = data[5]?.[0] || '';
    const companyRegistration = String(data[6]?.[0] || '');

    // Extract year from row 1
    const year = parseInt(String(data[1]?.[3] || new Date().getFullYear()));

    // Extract employee info from rows 4-6
    const matricule = String(data[1]?.[11] || '').replace('MATRICULE N° ', '');
    const identityNumber = String(data[4]?.[9] || '');
    const employeeName = sheetName; // Sheet name is employee name
    const employeeAddress = String(data[4]?.[11] || '');
    const employeeCity = String(data[5]?.[11] || '');

    // Parse employee name
    const nameParts = employeeName.split(' ');
    const firstName = nameParts.slice(0, -1).join(' ') || employeeName;
    const lastName = nameParts[nameParts.length - 1] || '';

    // Extract anciennete (seniority) - Excel date format
    const ancienneteValue = data[4]?.[6];
    const anciennete = ancienneteValue ? parseFloat(String(ancienneteValue)) : undefined;

    const employee: Partial<Employee> = {
      firstName,
      lastName,
      matricule,
      identityNumber,
      address: employeeAddress,
      city: employeeCity,
      postalCode: employeeCity?.match(/L-\d+/)?.[0] || '',
      anciennete,
      status: 'active',
    };

    // Parse monthly payslip data (rows 9-20, typically 12 months)
    const payslips: Payslip[] = [];
    const headerRow = 8; // Row with column headers
    const dataStartRow = 9; // First month row

    // Parse column positions from header row
    const headers = data[headerRow] || [];
    const colIdx = {
      days: 0,
      daysImposable: 1,
      status: 2,
      taxClass: 3,
      remunerationBase: 4,
      grossMonthly: 5,
      cotisable: 6,
      maladie: 7,
      pension: 8,
      ciCo2: 9,
      deductions: 10,
      imposable: 11,
      incomeTax: 12,
      cis: 13,
      cissm: 14,
      netPay: 15,
    };

    // Parse 12 months of data (rows 9-20)
    for (let i = 0; i < 12; i++) {
      const rowIdx = dataStartRow + i;
      const row = data[rowIdx];

      if (!row || row.length === 0) continue;

      // Extract month from first column (e.g., "J     1-31" -> "J")
      const daysCell = String(row[colIdx.days] || '').trim();
      const monthMatch = daysCell.match(/^([A-Z])/);
      const monthAbbr = monthMatch ? monthMatch[1] : '';
      const month = monthAbbr ? parseMonthName(monthAbbr) : i + 1;

      // Skip if no gross monthly amount
      const grossMonthly = parseFloat(String(row[colIdx.grossMonthly] || 0));
      if (grossMonthly === 0) continue;

      // Parse all monetary values
      const remunerationBase = parseFloat(String(row[colIdx.remunerationBase] || 0));
      const cotisable = parseFloat(String(row[colIdx.cotisable] || 0));
      const imposable = parseFloat(String(row[colIdx.imposable] || 0));
      const maladie = parseFloat(String(row[colIdx.maladie] || 0));
      const pension = parseFloat(String(row[colIdx.pension] || 0));
      const ciCo2 = parseFloat(String(row[colIdx.ciCo2] || 0));
      const deductions = parseFloat(String(row[colIdx.deductions] || 0));
      const incomeTax = parseFloat(String(row[colIdx.incomeTax] || 0));
      const cis = parseFloat(String(row[colIdx.cis] || 0));
      const cissm = parseFloat(String(row[colIdx.cissm] || 0));
      const netPay = parseFloat(String(row[colIdx.netPay] || 0));

      // Parse working hours from recapitulation section (rows 25-37)
      const hoursRowIdx = 26 + i; // Rows 26-37 contain hours data
      const hoursRow = data[hoursRowIdx] || [];
      const normalHours = parseFloat(String(hoursRow[1] || 0));
      const supplementaryHours = parseFloat(String(hoursRow[2] || 0));
      const holidays = parseFloat(String(hoursRow[3] || 0));
      const publicHolidayExtra = parseFloat(String(hoursRow[4] || 0));
      const familyLeave = parseFloat(String(hoursRow[5] || 0));
      const paternityLeave = parseFloat(String(hoursRow[5] || 0)); // Same column as family leave
      const sickLeave = parseFloat(String(hoursRow[6] || 0));
      const unemployment = parseFloat(String(hoursRow[5] || 0)); // Chômage

      const workingHours: WorkingHours = {
        normalHours,
        supplementaryHours,
        holidays,
        publicHolidayExtra,
        familyLeave,
        paternityLeave,
        sickLeave,
        unemployment,
      };

      // Calculate employer contributions (same rates as employee for maladie and pension)
      const employerMaladie = parseFloat((cotisable * 0.0305).toFixed(2));
      const employerPension = parseFloat((cotisable * 0.08).toFixed(2));
      const employerSante = parseFloat((cotisable * 0.04).toFixed(2));
      const employerAccident = parseFloat((cotisable * 0.01).toFixed(2));
      const employerSocialSecurityTotal = employerMaladie + employerPension + employerSante + employerAccident;

      const payslip: Payslip = {
        id: `payslip-${companyId}-${matricule}-${year}-${month}`,
        employeeId: `employee-${companyId}-${matricule}`,
        companyId,
        period: { month, year },
        employee: {
          id: `employee-${companyId}-${matricule}`,
          firstName: employee.firstName || '',
          lastName: employee.lastName || '',
          email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
          class: String(row[colIdx.status] || 'Empl.'),
          hireDate: '',
          terminationDate: null,
          matricule: employee.matricule,
          identityNumber: employee.identityNumber,
          address: employee.address,
          city: employee.city,
          postalCode: employee.postalCode,
        },
        company: {
          id: companyId,
          name: companyName,
          country: 'Luxembourg',
          currency: 'EUR',
          address: companyAddress,
          city: companyCity,
          postalCode: companyCity?.match(/L-\d+/)?.[0] || '',
          registrationNumber: companyRegistration,
        },
        earnings: {
          remunerationBase,
          grossMonthly,
          cotisable,
          imposable,
        },
        employeeContrib: {
          maladie,
          pension,
          ciCo2,
          cis,
          cissm,
          deductions,
          incomeTax,
          total: maladie + pension + ciCo2 + cis + cissm + deductions + incomeTax,
        },
        employerContrib: {
          maladie: employerMaladie,
          pension: employerPension,
          sante: employerSante,
          accident: employerAccident,
          socialSecurityTotal: employerSocialSecurityTotal,
        },
        workingHours,
        netPay,
        ytd: {
          gross: grossMonthly,
          net: netPay,
          employeeContribTotal: maladie + pension + ciCo2 + cis + cissm + deductions + incomeTax,
          employerContribTotal: employerSocialSecurityTotal,
          taxes: incomeTax,
        },
        lines: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      payslips.push(payslip);
    }

    return {
      companyInfo: {
        name: companyName,
        address: companyAddress,
        city: companyCity,
        registrationNumber: companyRegistration,
      },
      employee,
      payslips,
    };
  } catch (error) {
    console.error(`Error parsing sheet ${sheetName}:`, error);
    return null;
  }
}

/**
 * Import Advensys Excel file and create employees and payslips
 */
export async function importAdvensysExcel(
  file: File,
  companyId: string,
  onProgress?: (progress: number, message: string) => void
): Promise<{
  success: boolean;
  employeesCreated: number;
  payslipsCreated: number;
  errors: string[];
}> {
  try {
    onProgress?.(10, 'Parsing Excel file...');
    const data = await parseAdvensysExcel(file, companyId);

    onProgress?.(30, 'Processing employees...');

    let employeesCreated = 0;
    let payslipsCreated = 0;
    const errors: string[] = [];

    data.employees.forEach((employeeData, index) => {
      try {
        // Here you would normally save to database
        // For now, we'll just count them
        employeesCreated++;
        payslipsCreated += employeeData.payslips.length;

        const progress = 30 + ((index + 1) / data.employees.length) * 60;
        onProgress?.(progress, `Processed ${employeeData.employee.firstName} ${employeeData.employee.lastName}`);
      } catch (error) {
        errors.push(`Error processing employee ${employeeData.employee.firstName}: ${error}`);
      }
    });

    onProgress?.(100, 'Import complete');

    return {
      success: true,
      employeesCreated,
      payslipsCreated,
      errors,
    };
  } catch (error) {
    return {
      success: false,
      employeesCreated: 0,
      payslipsCreated: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}
