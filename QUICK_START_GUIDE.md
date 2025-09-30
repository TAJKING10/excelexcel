# Excel Import - Quick Start Guide

## 🚀 Quick Integration (5 minutes)

### Step 1: Import the component

```typescript
import { ExcelImportDialog } from '@/components/excel';
import { exportExcelTemplate } from '@/lib/excelUtils';
```

### Step 2: Add to your page

```typescript
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet } from 'lucide-react';

function MyPage() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setDialogOpen(true)}>
        <FileSpreadsheet className="w-4 h-4 mr-2" />
        Import Excel
      </Button>

      <ExcelImportDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        companyId="your-company-id"
        onImportComplete={(data) => {
          console.log('Imported:', data.payslips);
          // Handle the imported payslips here
        }}
      />
    </>
  );
}
```

### Step 3: That's it!

You now have a complete Excel import flow. Users can:
1. Upload Excel files (drag & drop or click)
2. Map columns to payslip fields
3. Validate and preview data
4. Import payslips

## 📥 Template Export

Add a button to download the Excel template:

```typescript
import { exportExcelTemplate } from '@/lib/excelUtils';

<Button onClick={exportExcelTemplate}>
  Download Template
</Button>
```

## 🔧 Props

### ExcelImportDialog

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `open` | `boolean` | ✅ | Controls dialog visibility |
| `onOpenChange` | `(open: boolean) => void` | ✅ | Called when dialog opens/closes |
| `companyId` | `string` | ✅ | Company ID for imported payslips |
| `onImportComplete` | `(data: any) => void` | ❌ | Called when import succeeds |

### onImportComplete Data

```typescript
{
  payslips: Payslip[],        // Array of imported payslips
  employeesCreated: number,   // Count of employees
  payslipsCreated: number     // Count of payslips
}
```

## 📋 Required Excel Columns

At minimum, your Excel file should have:
- First Name *
- Last Name *
- Email *
- Month * (1-12)
- Year * (YYYY)
- Gross Monthly *
- Net Pay *

*Other fields are optional but can be included for complete payslip data.*

## 🎯 Complete Example with Backend

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
  const companyId = 'company-123'; // Get from auth/context

  const handleImportComplete = async (data: any) => {
    try {
      // Send to your backend
      const response = await fetch('/api/payslips/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          payslips: data.payslips
        })
      });

      if (!response.ok) throw new Error('Import failed');

      // Show success message
      toast({
        title: 'Success!',
        description: `Imported ${data.payslipsCreated} payslips`,
      });

      // Refresh your data
      // refreshPayslips();

    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to import payslips',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Payslips</h1>
        <div className="flex gap-2">
          <Button onClick={() => setDialogOpen(true)}>
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Import Excel
          </Button>
          <Button variant="outline" onClick={exportExcelTemplate}>
            <Download className="w-4 h-4 mr-2" />
            Download Template
          </Button>
        </div>
      </div>

      <ExcelImportDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        companyId={companyId}
        onImportComplete={handleImportComplete}
      />

      {/* Your payslips list/table here */}
    </div>
  );
}

export default PayslipsPage;
```

## 🎨 Styling

The components use Tailwind CSS and Radix UI, matching your existing design system. No additional styling needed!

## 🌍 Translations

All text is automatically translated based on your i18next configuration. Supports:
- 🇬🇧 English
- 🇫🇷 French

## ⚡ Utility Functions

### parseExcelFile
```typescript
import { parseExcelFile } from '@/lib/excelUtils';

const data = await parseExcelFile(file);
```

### validatePayslipData
```typescript
import { validatePayslipData } from '@/lib/excelUtils';

const validation = validatePayslipData(data, mapping);
if (!validation.valid) {
  console.error(validation.errors);
}
```

### transformToPayslips
```typescript
import { transformToPayslips } from '@/lib/excelUtils';

const payslips = transformToPayslips(data, mapping, companyId);
```

### exportExcelTemplate
```typescript
import { exportExcelTemplate } from '@/lib/excelUtils';

exportExcelTemplate(); // Downloads template file
```

## 🐛 Troubleshooting

### File won't upload?
- Check file extension (.xlsx or .xls)
- Try a different file
- Check browser console

### Validation errors?
- Read the error messages (they include row numbers)
- Download and use the template
- Ensure required fields are present

### Import not working?
- Check the `onImportComplete` callback
- Verify `companyId` is provided
- Check browser console for errors

## 📚 More Information

- **Full Documentation**: See `EXCEL_IMPORT_DOCUMENTATION.md`
- **Implementation Details**: See `IMPLEMENTATION_SUMMARY.md`
- **Example Component**: See `src/components/excel/ExcelImportExample.tsx`

## 🎉 You're Ready!

The Excel import flow is now integrated into your application. Users can easily import payslip data from Excel files with validation and preview.

**Need help?** Check the full documentation or the example component for more details.