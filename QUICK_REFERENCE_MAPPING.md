# Quick Reference: Excel Payslip Structure Mapping

## Sheet: Individual Employee (e.g., "Miodrag MILIC")

### VISUAL LAYOUT

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ Row 1: [Empty]                                                                              │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│ Row 2: | LIVRE DE PAIE | 2024 | SALAIRES PLUS AVANCES MALADIE | MATRICULE N° [number]     │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│ Row 3: [Part of merged cells from Row 2]                                                    │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│ Row 4: | Groupe Advensys Luxembourg SA                                                      │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│ Row 5: | Duarrefstrooss 49 | Ancienneté | [date] | [ID] | [Name] | N° [num]               │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│ Row 6: | L-9964 HULDANGE | Entrée | [date] | [Employee Address]                            │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│ Row 7: | 2015 22 06 748 | Sortie | [date] | [Employee Postal]                              │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│ Row 8: [Empty separator]                                                                    │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│ Row 9: COLUMN HEADERS                                                                       │
│  A      B       C      D       E        F        G        H       I       J     K     L     │
│ Jours|Jours  |Stat.|Classe|Rémun.|Brut   |Cotis-|Mala-|Pen- |CI-CO2|Déduc|Impos|...        │
│      |impos. |     |  %   |Base  |Mensuel|able  |die  |sion |      |tions|able |...        │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│ Row 10: JANUARY DATA                                                                        │
│ Row 11: FEBRUARY DATA                                                                       │
│ Row 12: MARCH DATA                                                                          │
│ Row 13: APRIL DATA                                                                          │
│ Row 14: MAY DATA                                                                            │
│ Row 15: JUNE DATA                                                                           │
│ Row 16: JULY DATA                                                                           │
│ Row 17: AUGUST DATA                                                                         │
│ Row 18: SEPTEMBER DATA                                                                      │
│ Row 19: OCTOBER DATA                                                                        │
│ Row 20: NOVEMBER DATA                                                                       │
│ Row 21: DECEMBER DATA                                                                       │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│ Row 22: ANNUAL TOTALS (=SUM formulas)                                                       │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│ Row 23: [Empty]                                                                             │
│ Row 24: [Empty]                                                                             │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│ Row 25-26: RECAPITULATION HEADERS                                                           │
│  A     B      C      D      E       F       G      |    H-K: RECAPITULATION ANNEE          │
│ Heures|Normal|Suppl.|Congés|Férié |Congés  |Maladie|  Imposable | Impot | NET              │
│       |      |      |      |extra |famillal|       |            |       |                   │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│ Row 27: JANUARY RECAPITULATION                                                              │
│ Row 28: FEBRUARY RECAPITULATION                                                             │
│ Row 29: MARCH RECAPITULATION                                                                │
│ Row 30: APRIL RECAPITULATION                                                                │
│ Row 31: MAY RECAPITULATION                                                                  │
│ Row 32: JUNE RECAPITULATION                                                                 │
│ Row 33: JULY RECAPITULATION                                                                 │
│ Row 34: AUGUST RECAPITULATION                                                               │
│ Row 35: SEPTEMBER RECAPITULATION                                                            │
│ Row 36: OCTOBER RECAPITULATION                                                              │
│ Row 37: NOVEMBER RECAPITULATION                                                             │
│ Row 38: DECEMBER RECAPITULATION                                                             │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│ Row 39: ANNUAL RECAPITULATION TOTALS (=SUM formulas)                                        │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## MONTH-TO-ROW MAPPING

### Monthly Data Section
```
Row 10  → January
Row 11  → February
Row 12  → March
Row 13  → April
Row 14  → May
Row 15  → June
Row 16  → July
Row 17  → August
Row 18  → September
Row 19  → October
Row 20  → November
Row 21  → December
Row 22  → Annual Total
```

### Recapitulation Section
```
Row 27  → January
Row 28  → February
Row 29  → March
Row 30  → April
Row 31  → May
Row 32  → June
Row 33  → July
Row 34  → August
Row 35  → September
Row 36  → October
Row 37  → November
Row 38  → December
Row 39  → Annual Total
```

### Formula: Get Row from Month Number
```javascript
// Monthly data
monthlyRow = 9 + monthNumber  // monthNumber: 1-12

// Recapitulation
recapRow = 26 + monthNumber   // monthNumber: 1-12
```

---

## COLUMN MAPPING

### Monthly Data Columns (A-P)

| Col | Index | Name | Formula/Type | Notes |
|-----|-------|------|--------------|-------|
| **A** | 1 | Jours | Literal | "J 1-31", "F 1-29", etc. |
| **B** | 2 | Jours impos. | Literal | Typically 25 |
| **C** | 3 | Stat. | Literal | "Empl." |
| **D** | 4 | Classe - % | Literal | Tax class |
| **E** | 5 | Rémun. Base | Literal | Base salary |
| **F** | 6 | Brut Mensuel | Literal | Gross monthly |
| **G** | 7 | Cotisable | `=F{row}` | Copy of Brut |
| **H** | 8 | Maladie | `=71.99+6.43` | Employee-specific |
| **I** | 9 | Pension | Calculated | `G * 0.08` |
| **J** | 10 | CI-CO2 | Literal | 0 or 14 |
| **K** | 11 | Déductions | `=33+460` | Tax class dependent |
| **L** | 12 | Imposable | Literal | Pre-calculated |
| **M** | 13 | Impots | Literal | Pre-calculated |
| **N** | 14 | CIS | Literal | 0 or 50 |
| **O** | 15 | CISSM | Literal | 0, 70, variable |
| **P** | 16 | Salaire Net | Literal | Net salary |

### Recapitulation Columns

| Col | Index | Name | Formula/Type | Notes |
|-----|-------|------|--------------|-------|
| **A** | 1 | Month | Literal | J, F, M, A, etc. |
| **B** | 2 | Normal | Literal | Typically 173 |
| **C** | 3 | Suppl. | Literal | Overtime hours |
| **D** | 4 | Congés | Literal | Leave days |
| **E** | 5 | Férié extra | Literal | Extra holidays |
| **F** | 6 | Congés familliale | Literal | Family leave |
| **G** | 7 | Maladie | Literal | Sick days |
| **H** | 8 | Imposable | `=L{monthly}` | Reference to col L |
| **I** | 9 | [merged with H] | - | - |
| **J** | 10 | Impot | `=M{monthly}` | Reference to col M |
| **K** | 11 | NET | `=P{monthly}` | Reference to col P |

---

## FORMULA REFERENCE MATRIX

### For Month = January (monthNumber = 1)

| Field | Monthly Row | Recap Row | Column | Formula |
|-------|-------------|-----------|--------|---------|
| Cotisable | 10 | - | G | `=F10` |
| Maladie | 10 | - | H | `=71.99+6.43` |
| Déductions | 10 | - | K | `=33+460` |
| Recap Imposable | - | 27 | H | `=L10` |
| Recap Impot | - | 27 | J | `=M10` |
| Recap NET | - | 27 | K | `=P10` |

### For Month = February (monthNumber = 2)

| Field | Monthly Row | Recap Row | Column | Formula |
|-------|-------------|-----------|--------|---------|
| Cotisable | 11 | - | G | `=F11` |
| Maladie | 11 | - | H | `=71.99+6.43` |
| Déductions | 11 | - | K | `=33+460` |
| Recap Imposable | - | 28 | H | `=L11` |
| Recap Impot | - | 28 | J | `=M11` |
| Recap NET | - | 28 | K | `=P11` |

### Annual Totals (Row 22 & 39)

```excel
Row 22 (Monthly Annual Total):
  E22: =SUM(E10:E21)
  F22: =SUM(F10:F21)
  G22: =SUM(G10:G21)
  ... (for all columns E through P)

Row 39 (Recapitulation Annual Total):
  B39: =SUM(B27:B38)
  C39: =SUM(C27:C38)
  D39: =SUM(D27:D38)
  ... (for columns with data)
```

---

## SUMMARY SHEETS

### "Salaire globale + Maladie" Sheet

**Structure:** Same as employee sheet (rows 10-21 for months, row 22 for total)

**Formula Pattern (January = Row 10, Column B):**
```excel
='Employee1'!F10+'Employee2'!F10+'Employee3'!F10+...
```

**Columns:**
- A: Mois (JAN, FEV, MAR, etc.)
- B: Brut Mensuel (sum all employees' F)
- C: Cotisable (sum all employees' G)
- D: Maladie (sum all employees' H)
- E: Pension (sum all employees' I)
- H: Déductions (sum all employees' K)
- I: Imposable (sum all employees' L)
- J: Impôt (sum all employees' M)
- K: Salaire Net (sum all employees' P)
- M: Imposable copy (=I10)
- O: Impôt copy (=J10)
- P: Crédits (sum all employees' J+N+O)

---

### "Part Patronales" Sheet

**Structure:** Same (rows 10-21 for months, row 22 for total)

**Columns:**
- A: Mois
- B: Coti. Maladie = `='Salaire globale + Maladie'!C10`
- C: Coti. Pension = `=B10`
- D: Coti. Santé = `=C10`
- E: Coti. Accident = `=D10`
- G: Maladie = `='Salaire globale + Maladie'!D10`
- H: Pension = `='Salaire globale + Maladie'!E10`
- I: Santé = `=D10*0.11/100`
- J: Accident = `=E10*0.75/100`
- K: Total Mensuel = `=G10+H10+I10+J10`
- M: Total Sécurité Sociale = `=K10`

---

## CODE GENERATION SNIPPETS

### JavaScript/TypeScript

```javascript
// Get monthly data row from month number (1-12)
function getMonthlyRow(monthNumber) {
  return 9 + monthNumber;
}

// Get recapitulation row from month number (1-12)
function getRecapRow(monthNumber) {
  return 26 + monthNumber;
}

// Get column letter from index
function getColumnLetter(index) {
  return String.fromCharCode(64 + index);
}

// Generate cell reference
function getCellRef(column, row) {
  const colLetter = typeof column === 'number' ? getColumnLetter(column) : column;
  return `${colLetter}${row}`;
}

// Example: Get January Cotisable cell reference
const januaryCotisableCell = getCellRef('G', getMonthlyRow(1)); // "G10"

// Example: Get December Recap NET cell reference
const decemberRecapNetCell = getCellRef('K', getRecapRow(12)); // "K38"
```

### Python

```python
def get_monthly_row(month_number):
    """Get row number for monthly data (1-12 -> 10-21)"""
    return 9 + month_number

def get_recap_row(month_number):
    """Get row number for recapitulation (1-12 -> 27-38)"""
    return 26 + month_number

def get_column_letter(index):
    """Convert column index to letter (1-26 -> A-Z)"""
    from openpyxl.utils import get_column_letter
    return get_column_letter(index)

def get_cell_ref(column, row):
    """Generate cell reference like 'G10'"""
    if isinstance(column, int):
        column = get_column_letter(column)
    return f"{column}{row}"

# Example usage
january_cotisable = get_cell_ref('G', get_monthly_row(1))  # "G10"
december_recap_net = get_cell_ref('K', get_recap_row(12))  # "K38"

# Generate formula
def formula_cotisable(month_number):
    """Generate Cotisable formula for a given month"""
    row = get_monthly_row(month_number)
    return f"=F{row}"

def formula_recap_imposable(month_number):
    """Generate Recapitulation Imposable formula"""
    monthly_row = get_monthly_row(month_number)
    return f"=L{monthly_row}"

# Example
print(formula_cotisable(1))           # "=F10"
print(formula_recap_imposable(12))    # "=L21"
```

---

## CALCULATION REFERENCE

### Employee-Side Calculations

```
1. Cotisable = Brut Mensuel
2. Pension = Cotisable × 0.08
3. Maladie = Employee-specific (e.g., 71.99 + 6.43)
4. Déductions = Tax class dependent (e.g., 33 + 460)
5. Net Salary = Complex calculation (requires all components)
```

### Employer-Side Calculations (Part Patronales)

```
1. Santé = Cotisable × 0.0011 (0.11%)
2. Accident = Cotisable × 0.0075 (0.75%)
3. Total = Maladie + Pension + Santé + Accident
```

---

## MONTH IDENTIFIERS

```
January:    "J     1-31"  or "JAN"
February:   "F    1-29"   or "FEV"
March:      "M   1-31"    or "MAR"
April:      "A   1-30"    or "AVR"
May:        "M  1-31"     or "MAI"
June:       "J    1-30"   or "JUIN"
July:       "J    1-31"   or "JUIL"
August:     "A   1-31"    or "AOÛ"
September:  "S    1-30"   or "SEP"
October:    "O   1-31"    or "OCT"
November:   "N   1-30"    or "NOV"
December:   "D   1-31"    or "DEC"
```

---

## CELL MERGE REFERENCE

### Header Section Merges
- **B2:B3** - "LIVRE DE PAIE"
- **D2:D3** - "2024"
- **F2:I3** - "SALAIRES PLUS AVANCES MALADIE"
- **L2:N3** - "MATRICULE N° [number]"
- **A4:D4** - Company name
- **A5:D5** - Company address
- **E5:F5** - "Ancienneté"
- **G5:H5** - Ancienneté date
- **J5:K5** - Employee ID
- **L5:M5** - Employee name
- **A6:D6** - Company postal
- **E6:F6** - "Entrée"
- **G6:H6** - Entry date
- **L6:M6** - Employee address
- **A7:D7** - Company registration
- **E7:F7** - "Sortie"
- **G7:H7** - Exit date
- **L7:M7** - Employee postal

### Recapitulation Section Merges
- **A25:A26** - "Heures"
- **B25:B26** - "Normal"
- **C25:C26** - "Suppl."
- **D25:D26** - "Congés"
- **E25:E26** - "Férié extra"
- **F25:F26** - "Congés familliale"
- **G25:G26** - "Maladie"
- **H25:K25** - "RECAPITULATION ANNEE"
- **H26:I26** - "Imposable"
- **H27:I27 through H38:I38** - Monthly Imposable values

---

**Quick Reference Version:** 1.0
**Generated:** 2025-10-03
**File Location:** `C:\Users\Toufi\AndroidStudioProjects\excelexcelexcel\QUICK_REFERENCE_MAPPING.md`
