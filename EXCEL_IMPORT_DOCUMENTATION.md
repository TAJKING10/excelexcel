# Excel Import Flow Documentation

This documentation describes the Excel import functionality for payslip data in the Advensys Payroll application.

## Overview

The Excel import flow allows users to import payslip data from Excel files (.xlsx, .xls) through a 3-step wizard interface:

1. **Upload**: Select and upload an Excel file
2. **Map Columns**: Map Excel columns to payslip schema fields
3. **Validate & Import**: Preview data and validate before importing

## Components

### 1. ExcelImportDialog

**Location**: `C:\Users\Toufi\AndroidStudioProjects\excel\src\components\excel\ExcelImportDialog.tsx`

A complete 3-step wizard dialog component for importing payslip data from Excel.

#### Props

```typescript
interface ExcelImportDialogProps {
  open: boolean;                           // Dialog open state
  onOpenChange: (open: boolean) => void;   // Dialog state change handler
  companyId: string;                       // Company ID for imported payslips
  onImportComplete?: (data: any) => void;  // Callback when import completes
}
```

#### Features

- **Drag-and-drop file upload**: Users can drag Excel files directly into the dialog
- **File validation**: Only accepts .xlsx and .xls files
- **Automatic column mapping**: Intelligently suggests column mappings based on field names
- **Real-time validation**: Validates data before import with detailed error messages
- **Data preview**: Shows preview of imported data before final import
- **Internationalization**: Fully translated using i18next (English & French)
- **Loading states**: Shows loading indicators during file parsing and import
- **Error handling**: Graceful error handling with user-friendly messages

#### Step Details

##### Step 1: Upload

- File input with drag-and-drop support
- Accept only .xlsx and .xls files
- Parse Excel file using XLSX library
- Display file information (name, rows, columns)
- Option to change selected file

##### Step 2: Map Columns

- Display all Excel columns with example data
- Dropdown to map each column to a schema field
- Grouped schema fields by category:
  - Employee (firstName, lastName, email, etc.)
  - Period (month, year)
  - Earnings (grossMonthly, cotisable, imposable)
  - Employee Contributions (maladie, pension, incomeTax, etc.)
  - Employer Contributions (maladie, pension, sante, accident)
  - Pay (netPay)
  - Year to Date (YTD gross, net, contributions, taxes)
- Required fields marked with asterisk (*)
- Ability to remove column mappings
- Auto-mapping of similar column names

##### Step 3: Validate & Import

- Validation of mapped data
- Display validation errors if any
- Preview table showing first 5 rows:
  - Employee name
  - Period (month/year)
  - Gross pay
  - Net pay
- Success state with import button
- Error state with option to go back and fix issues

#### Usage Example

```typescript
import { ExcelImportDialog } from '@/components/excel';

function MyComponent() {
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleImportComplete = (data) => {
    console.log('Imported payslips:', data.payslips);
    // Handle the imported data (e.g., save to backend, update state)
  };

  return (
    <>
      <button onClick={() => setDialogOpen(true)}>
        Import from Excel
      </button>

      <ExcelImportDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        companyId="company-123"
        onImportComplete={handleImportComplete}
      />
    </>
  );
}
```

### 2. ExcelImportExample

**Location**: `C:\Users\Toufi\AndroidStudioProjects\excel\src\components\excel\ExcelImportExample.tsx`

A complete example component demonstrating how to use the ExcelImportDialog with buttons for import and template download.

#### Props

```typescript
interface ExcelImportExampleProps {
  companyId: string;  // Company ID for imported payslips
}
```

#### Features

- Import button to open the dialog
- Export template button to download Excel template
- Toast notifications for success/error messages
- Complete integration example

#### Usage

```typescript
import { ExcelImportExample } from '@/components/excel';

function PayslipsPage() {
  return (
    <div>
      <h1>Payslips</h1>
      <ExcelImportExample companyId="company-123" />
      {/* Rest of your payslips page */}
    </div>
  );
}
```

## Utility Functions

**Location**: `C:\Users\Toufi\AndroidStudioProjects\excel\src\lib\excelUtils.ts`

### parseExcelFile(file: File): Promise<any[]>

Parses an Excel file and returns the data as an array of objects.

```typescript
const data = await parseExcelFile(file);
// Returns: [{ "First Name": "John", "Last Name": "Doe", ... }, ...]
```

### getExcelColumns(data: any[]): string[]

Extracts column names from parsed Excel data.

```typescript
const columns = getExcelColumns(data);
// Returns: ["First Name", "Last Name", "Email", ...]
```

### validatePayslipData(data: any[], mapping: ExcelImportMapping): { valid: boolean, errors: string[] }

Validates the mapped payslip data and returns validation results.

**Validations performed:**
- Required field mappings present
- Email format validation
- Month range validation (1-12)
- Year range validation (2000-2100)
- Numeric field type validation
- Row-by-row data validation

```typescript
const validation = validatePayslipData(data, mapping);
if (!validation.valid) {
  console.error(validation.errors);
}
```

### transformToPayslips(data: any[], mapping: ExcelImportMapping, companyId: string): Payslip[]

Transforms mapped Excel data into Payslip objects.

**Features:**
- Maps each row to a Payslip object
- Converts data types appropriately
- Generates default payslip lines if not provided
- Creates IDs for payslips and employees
- Sets timestamps

```typescript
const payslips = transformToPayslips(data, mapping, 'company-123');
// Returns array of Payslip objects
```

### exportExcelTemplate(): void

Downloads an Excel template file for payslip import with example data and correct column structure.

**Template includes:**
- All required and optional columns
- Example data row
- Proper column widths
- Formatted as .xlsx file

```typescript
exportExcelTemplate();
// Downloads "payslip_import_template.xlsx"
```

### getSchemaFieldOptions(): { value: string; label: string; group: string }[]

Returns available schema fields for column mapping, organized by groups.

```typescript
const fields = getSchemaFieldOptions();
// Returns grouped field options for mapping UI
```

## Data Types

### ExcelImportMapping

```typescript
interface ExcelImportMapping {
  [excelColumn: string]: string;  // Maps Excel column name to schema field path
}

// Example:
const mapping: ExcelImportMapping = {
  "First Name": "employee.firstName",
  "Last Name": "employee.lastName",
  "Email": "employee.email",
  "Gross Monthly": "earnings.grossMonthly",
  "Net Pay": "netPay"
};
```

### Payslip

See `C:\Users\Toufi\AndroidStudioProjects\excel\src\types\index.ts` for the complete Payslip type definition.

## Schema Fields

The import supports mapping to the following schema fields:

### Employee Fields
- `employee.firstName` * (required)
- `employee.lastName` * (required)
- `employee.email` * (required)
- `employee.class`
- `employee.hireDate`
- `employee.terminationDate`

### Period Fields
- `period.month` * (required, 1-12)
- `period.year` * (required, YYYY)

### Earnings Fields
- `earnings.grossMonthly` * (required)
- `earnings.cotisable`
- `earnings.imposable`

### Employee Contributions
- `employeeContrib.maladie`
- `employeeContrib.pension`
- `employeeContrib.otherDeductions`
- `employeeContrib.incomeTax`
- `employeeContrib.total`

### Employer Contributions
- `employerContrib.maladie`
- `employerContrib.pension`
- `employerContrib.sante`
- `employerContrib.accident`
- `employerContrib.socialSecurityTotal`

### Pay
- `netPay` * (required)

### Year to Date (YTD)
- `ytd.gross`
- `ytd.net`
- `ytd.employeeContribTotal`
- `ytd.employerContribTotal`
- `ytd.taxes`

**Note**: Fields marked with * are required for import.

## Excel Template

The exported template includes the following columns:

| Column | Type | Example | Required |
|--------|------|---------|----------|
| First Name | Text | John | Yes |
| Last Name | Text | Doe | Yes |
| Email | Email | john.doe@example.com | Yes |
| Class | Text | A1 | No |
| Hire Date | Date | 2024-01-01 | No |
| Month | Number | 1 | Yes |
| Year | Number | 2024 | Yes |
| Gross Monthly | Number | 5000 | Yes |
| Cotisable | Number | 5000 | No |
| Imposable | Number | 5000 | No |
| Employee Health | Number | 154.50 | No |
| Employee Pension | Number | 400.00 | No |
| Other Deductions | Number | 0 | No |
| Income Tax | Number | 850.00 | No |
| Employee Contrib Total | Number | 1404.50 | No |
| Employer Health | Number | 154.50 | No |
| Employer Pension | Number | 400.00 | No |
| Employer Healthcare | Number | 150.00 | No |
| Employer Accident | Number | 50.00 | No |
| Employer Social Security Total | Number | 754.50 | No |
| Net Pay | Number | 3595.50 | Yes |
| YTD Gross | Number | 5000 | No |
| YTD Net | Number | 3595.50 | No |
| YTD Employee Contrib | Number | 1404.50 | No |
| YTD Employer Contrib | Number | 754.50 | No |
| YTD Taxes | Number | 850.00 | No |

## Internationalization

All user-facing text is internationalized using i18next. Translation keys are located in:

- English: `C:\Users\Toufi\AndroidStudioProjects\excel\src\i18n\locales\en.json`
- French: `C:\Users\Toufi\AndroidStudioProjects\excel\src\i18n\locales\fr.json`

### Translation Keys

```json
{
  "excel": {
    "import": {
      "title": "Import from Excel",
      "upload": "Upload File",
      "mapColumns": "Map Columns",
      "validate": "Validate",
      "importing": "Importing...",
      "success": "Import successful",
      "error": "Import error",
      "step1": "Step 1: Upload",
      "step2": "Step 2: Map",
      "step3": "Step 3: Validate",
      "selectFile": "Select an Excel file",
      "dragDrop": "or drag and drop here",
      "employeesCreated": "Employees created",
      "employeesUpdated": "Employees updated",
      "payslipsCreated": "Payslips created"
    }
  },
  "actions": {
    "back": "Back",
    "next": "Next",
    "cancel": "Cancel",
    "import": "Import",
    "finish": "Finish"
  }
}
```

## Dependencies

- **XLSX** (v0.18.5): Excel file parsing and creation
- **React** (v18+): UI framework
- **Radix UI**: Dialog, Select components
- **i18next**: Internationalization
- **lucide-react**: Icons
- **TypeScript**: Type safety

## Error Handling

The import flow handles various error scenarios:

1. **Invalid file type**: Alert shown if non-Excel file is selected
2. **Parse errors**: Error message if Excel file cannot be parsed
3. **Validation errors**: Detailed list of validation errors shown before import
4. **Missing required mappings**: Validation fails if required fields not mapped
5. **Invalid data types**: Validation catches type mismatches
6. **Email format errors**: Invalid email addresses are flagged
7. **Out-of-range values**: Month, year, and other range validations

## Best Practices

1. **Always validate data** before importing
2. **Provide the Excel template** to users for consistent formatting
3. **Handle the onImportComplete callback** to process imported data
4. **Show toast notifications** for user feedback
5. **Test with various Excel formats** (.xlsx and .xls)
6. **Implement backend validation** as a second line of defense
7. **Log import operations** for audit purposes

## Integration Example

Here's a complete integration example:

```typescript
import React, { useState } from 'react';
import { ExcelImportDialog } from '@/components/excel';
import { exportExcelTemplate } from '@/lib/excelUtils';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet, Download } from 'lucide-react';

function PayslipsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleImportComplete = async (data: any) => {
    try {
      // Send to backend
      const response = await fetch('/api/payslips/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payslips: data.payslips })
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: `Imported ${data.payslipsCreated} payslips`,
        });

        // Refresh payslips list
        refreshPayslips();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to import payslips',
        variant: 'destructive'
      });
    }
  };

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <Button onClick={() => setDialogOpen(true)}>
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Import from Excel
        </Button>
        <Button variant="outline" onClick={exportExcelTemplate}>
          <Download className="w-4 h-4 mr-2" />
          Download Template
        </Button>
      </div>

      <ExcelImportDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        companyId="company-123"
        onImportComplete={handleImportComplete}
      />

      {/* Payslips table/list */}
    </div>
  );
}
```

## Files Created

1. **C:\Users\Toufi\AndroidStudioProjects\excel\src\lib\excelUtils.ts**
   - Excel parsing, validation, transformation utilities
   - Template export functionality
   - ~480 lines of TypeScript

2. **C:\Users\Toufi\AndroidStudioProjects\excel\src\components\excel\ExcelImportDialog.tsx**
   - 3-step wizard dialog component
   - ~630 lines of TypeScript/React

3. **C:\Users\Toufi\AndroidStudioProjects\excel\src\components\excel\ExcelImportExample.tsx**
   - Example integration component
   - ~65 lines of TypeScript/React

4. **C:\Users\Toufi\AndroidStudioProjects\excel\src\components\excel\index.ts**
   - Barrel export file
   - 2 lines

## Testing

The build was tested successfully:

```bash
npm run build
# ✓ built in 2.79s
```

All components compile without errors and are ready for use in the application.

## Future Enhancements

Potential improvements for future versions:

1. **Multi-sheet support**: Import from multiple Excel sheets
2. **Bulk employee creation**: Create employees during import if they don't exist
3. **Import history**: Track and display previous imports
4. **Undo import**: Ability to rollback an import
5. **Advanced validation**: Custom validation rules per company
6. **Column suggestions**: ML-based column mapping suggestions
7. **Import scheduling**: Schedule recurring imports
8. **CSV support**: Support CSV file format in addition to Excel
9. **Data transformation**: Custom transformation rules during import
10. **Duplicate detection**: Detect and handle duplicate payslips

## Support

For issues or questions:
- Check validation error messages for detailed information
- Review the Excel template for correct data format
- Ensure all required fields are mapped
- Verify data types match expected formats
- Check browser console for detailed error logs