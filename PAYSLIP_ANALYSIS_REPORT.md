# Excel Payslip Analysis Report
## Groupe Advensys Luxembourg SA - Livre de paie 2024

**Analysis Date:** 2025-10-03
**File:** `Groupe Advensys Luxembourg SA - Livre de paie 2024.xlsx`

---

## 1. WORKBOOK STRUCTURE

### 1.1 Sheet Organization
- **Total Sheets:** 12
- **Employee Sheets:** 10 individual employee payroll sheets
- **Summary Sheets:** 2 aggregate/calculation sheets

#### Employee Sheets:
1. Miodrag MILIC
2. BERTHE Alexandra
3. SANDRI Sandro
4. JAUD Jean Paul
5. REBELO MATOS Daniel Filipe
6. BALDE Binta
7. Omigie Evbaguehize Stella
8. BEZGUBOV Tatiana
9. RIFFAUD Jean François
10. BROERING Lucas José

#### Summary Sheets:
1. **Salaire globale + Maladie** - Aggregates all employee data
2. **Part Patronales** - Employer contribution calculations

---

## 2. EMPLOYEE SHEET STRUCTURE

### 2.1 Header Section (Rows 1-8)

#### Row 2: Document Title & Matricule
- **B2-B3 (merged):** "LIVRE DE PAIE"
- **D2-D3 (merged):** "2024"
- **F2-I3 (merged):** "SALAIRES PLUS AVANCES MALADIE"
- **L2-N3 (merged):** "MATRICULE N° [employee social security number]"

#### Row 4: Company Information
- **A4-D4 (merged):** "Groupe Advensys Luxembourg SA"

#### Row 5: Company Address & Employee Info
- **A5-D5 (merged):** "Duarrefstrooss 49"
- **E5-F5 (merged):** "Ancienneté"
- **G5-H5 (merged):** [Date in format YYYY-MM-DD]
- **J5-K5 (merged):** [Employee ID number]
- **L5-M5 (merged):** [Employee Full Name]
- **P5:** "N° [employee number]"

#### Row 6: Company Postal & Employee Entry
- **A6-D6 (merged):** "L-9964 HULDANGE"
- **E6-F6 (merged):** "Entrée"
- **G6-H6 (merged):** [Entry date]
- **L6-M6 (merged):** [Employee Address]

#### Row 7: Company Registration & Exit Date
- **A7-D7 (merged):** "2015 22 06 748"
- **E7-F7 (merged):** "Sortie"
- **G7-H7 (merged):** [Exit date if applicable]
- **L7-M7 (merged):** [Employee Postal Code]

#### Row 8: Empty separator row

---

### 2.2 Monthly Payslip Data Section (Rows 9-22)

#### Row 9: Column Headers

| Column | Name | Description |
|--------|------|-------------|
| A | Jours | Month identifier (J 1-31, F 1-29, etc.) |
| B | Jours impos. | Taxable days (typically 25) |
| C | Stat. | Status (Empl. = Employee) |
| D | Classe - % | Tax class and percentage |
| E | Rémun. Base | Base remuneration |
| F | Brut Mensuel | Monthly gross salary |
| G | Cotisable | Taxable amount for social security |
| H | Maladie | Health insurance contribution (employee) |
| I | Pension | Pension contribution (employee) |
| J | CI-CO2 | CI-CO2 tax |
| K | Déductions | Other deductions |
| L | Imposable | Taxable income |
| M | Impots | Income tax |
| N | CIS | CIS contribution |
| O | CISSM | CISSM contribution |
| P | Salaire Net | Net salary |

#### Rows 10-21: Monthly Data
- **Row 10:** January (J 1-31)
- **Row 11:** February (F 1-29)
- **Row 12:** March (M 1-31)
- **Row 13:** April (A 1-30)
- **Row 14:** May (M 1-31)
- **Row 15:** June (J 1-30)
- **Row 16:** July (J 1-31)
- **Row 17:** August (A 1-31)
- **Row 18:** September (S 1-30)
- **Row 19:** October (O 1-31)
- **Row 20:** November (N 1-30)
- **Row 21:** December (D 1-31)

#### Row 22: Annual Totals
- Contains `=SUM(E10:E21)` type formulas for each numeric column

---

### 2.3 Recapitulation Section (Rows 25-39)

This section appears on the right side of the same employee sheet.

#### Row 25: Header Row 1
- **A25-A26 (merged):** "Heures"
- **B25-B26 (merged):** "Normal"
- **C25-C26 (merged):** "Suppl."
- **D25-D26 (merged):** "Congés"
- **E25-E26 (merged):** "Férié extra"
- **F25-F26 (merged):** "Congés familliale (COVID-19)"
- **G25-G26 (merged):** "Maladie"
- **H25-K25 (merged):** "RECAPITULATION ANNEE"

#### Row 26: Header Row 2 (under Recapitulation Annee)
- **H26-I26 (merged):** "Imposable"
- **J26:** "Impot"
- **K26:** "NET"

#### Rows 27-38: Monthly Recapitulation Data

| Row | Month | Col A | Col B | Col C | Col D | Col E | Col F | Col G | Col H | Col J | Col K |
|-----|-------|-------|-------|-------|-------|-------|-------|-------|-------|-------|-------|
| 27 | Jan | J | 173 | [hours] | [days] | [days] | [days] | [days] | =L10 | =M10 | =P10 |
| 28 | Feb | F | 173 | [hours] | [days] | [days] | [days] | [days] | =L11 | =M11 | =P11 |
| ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... |
| 38 | Dec | D | 173 | [hours] | [days] | [days] | [days] | [days] | =L21 | =M21 | =P21 |

#### Row 39: Annual Recapitulation Totals
- Contains `=SUM(B27:B38)` type formulas for each column

---

## 3. FORMULAS AND CALCULATIONS

### 3.1 Employee Monthly Data Formulas

#### Column G - Cotisable
```excel
=F10
```
- Simply copies the Brut Mensuel value
- Represents the base for social security contributions

#### Column H - Maladie (Health Insurance)
```excel
=71.99+6.43
```
- Result: 78.42
- **NOTE:** This appears to be employee-specific
- Different employees have different values (e.g., SANDRI Sandro has 414.8)
- Likely based on employee profile or salary bracket

#### Column I - Pension
- **Formula Pattern:** `Cotisable * 0.08`
- **Rate:** 8% of Cotisable
- Example: 2570.935 * 0.08 = 205.67

#### Column K - Déductions
```excel
=33+460
```
- Result: 493
- **NOTE:** Varies by tax class
- Example variations:
  - Class "15% - 2": 33 + 460 = 493
  - Class "2" (Nov/Dec): 33 only
  - Class "1": 0 (no deductions)

#### Other Columns (L, M, N, O, P)
- These appear to be literal values (pre-calculated externally)
- May require external tax tables or complex calculations

### 3.2 Annual Totals (Row 22)

All columns E through P use the same pattern:
```excel
=SUM(E10:E21)  // For column E
=SUM(F10:F21)  // For column F
=SUM(G10:G21)  // For column G
// ... and so on for H, I, J, K, L, M, N, O, P
```

### 3.3 Recapitulation Formulas

#### Monthly References (Rows 27-38)
```excel
H27: =L10  // References Imposable from January
J27: =M10  // References Impots from January
K27: =P10  // References Salaire Net from January

H28: =L11  // References Imposable from February
J28: =M11  // References Impots from February
K28: =P11  // References Salaire Net from February
// ... pattern continues for all months
```

#### Annual Recapitulation Total (Row 39)
```excel
B39: =SUM(B27:B38)  // Total Normal hours
C39: =SUM(C27:C38)  // Total Suppl. hours
D39: =SUM(D27:D38)  // Total Congés
// ... and so on
```

---

## 4. SUMMARY SHEETS

### 4.1 Salaire globale + Maladie Sheet

**Purpose:** Aggregate all employees' monthly payroll data

#### Structure
- **Rows 10-21:** Monthly data (Jan-Dec)
- **Row 22:** Annual totals

#### Columns

| Column | Name | Formula Pattern (Row 10 = January) |
|--------|------|-------------------------------------|
| A | Mois | "JAN", "FEV", "MAR", etc. |
| B | Brut Mensuel | Sum all employees' F10 |
| C | Cotisable | Sum all employees' G10 |
| D | Maladie | Sum all employees' H10 |
| E | Pension | Sum all employees' I10 |
| H | Déductions | Sum all employees' K10 |
| I | Imposable | Sum all employees' L10 |
| J | Impôt | Sum all employees' M10 |
| K | Salaire Net | Sum all employees' P10 |
| M | Imposable | =I10 (copy) |
| O | Impôt | =J10 (copy) |
| P | Crédits | Sum all employees' J10+N10+O10 |

#### Example Formula (B10 - Brut Mensuel for January):
```excel
='Miodrag MILIC'!F10+'BERTHE Alexandra'!F10+'SANDRI Sandro'!F10+'JAUD Jean Paul'!F10+'REBELO MATOS Daniel Filipe'!F10+'BALDE Binta'!F10+'Omigie Evbaguehize Stella'!F10+'BEZGUBOV Tatiana'!F10+'RIFFAUD Jean François '!F10+'BROERING Lucas José '!F10
```

#### Annual Totals (Row 22):
```excel
B22: =SUM(B10:B21)
C22: =SUM(C10:C21)
// ... etc.
```

---

### 4.2 Part Patronales Sheet

**Purpose:** Calculate employer social security contributions

#### Structure
- **Rows 10-21:** Monthly data (Jan-Dec)
- **Row 22:** Annual totals (labeled "Total Annuel")

#### Columns

| Column | Name | Formula (Row 10) | Rate/Description |
|--------|------|------------------|------------------|
| A | Mois | "JAN", "FEV", etc. | Month label |
| B | Coti. Maladie | ='Salaire globale + Maladie'!C10 | Copy of Cotisable |
| C | Coti. Pension | =B10 | Copy of Coti. Maladie |
| D | Coti. Santé | =C10 | Copy of Coti. Pension |
| E | Coti. Accident | =D10 | Copy of Coti. Santé |
| G | Maladie | ='Salaire globale + Maladie'!D10 | Employee Maladie total |
| H | Pension | ='Salaire globale + Maladie'!E10 | Employee Pension total |
| I | Santé | =D10*0.11/100 | **0.11% of Cotisable** |
| J | Accident | =E10*0.75/100 | **0.75% of Cotisable** |
| K | Total Mensuel | =G10+H10+I10+J10 | Sum of all contributions |
| M | Total Sécurité Sociale | =K10 | Copy of Total Mensuel |

---

## 5. CALCULATION RATES & RULES

### 5.1 Employee Contributions

#### Pension (Column I)
- **Rate:** 8% of Cotisable
- **Formula:** `=Cotisable * 0.08`
- **Example:** 2,570.935 × 0.08 = 205.67

#### Maladie (Column H)
- **Type:** Employee-specific calculation
- **Pattern:** Sum of components (e.g., `=71.99+6.43`)
- **Variations observed:**
  - Miodrag MILIC: 78.42 (71.99 + 6.43)
  - BERTHE Alexandra: 78.42 (71.99 + 6.43)
  - SANDRI Sandro: 414.8 (different calculation)
- **Note:** Appears to be based on salary level or employee profile

#### Déductions (Column K)
- **Type:** Tax class dependent
- **Examples:**
  - Class "15% - 2": 33 + 460 = 493
  - Class "2": 33 (in Nov/Dec when tax changes)
  - Class "1": 0 (no deductions)

### 5.2 Employer Contributions (Part Patronales)

#### Santé (Health)
- **Rate:** 0.11% of Cotisable
- **Formula:** `=Cotisable * 0.11/100`

#### Accident
- **Rate:** 0.75% of Cotisable
- **Formula:** `=Cotisable * 0.75/100`

### 5.3 Fixed Contributions (Vary by Employee)

#### CI-CO2 (Column J)
- **Possible values:** 0, 14
- **Type:** Fixed amount per month
- **Varies by:** Employee profile

#### CIS (Column N)
- **Possible values:** 0, 50
- **Type:** Fixed amount per month
- **Varies by:** Employee profile

#### CISSM (Column O)
- **Possible values:** 0, 70, or variable amounts
- **Type:** Fixed or variable amount per month
- **Varies by:** Employee profile

---

## 6. TAX CLASSES

### 6.1 Observed Tax Classes
1. **"0.15"** - Low tax rate
2. **"1"** - Standard single
3. **"1A"** - Single with adjustments
4. **"2"** - Married or higher bracket
5. **"2-15%"** - Married with 15% adjustment
6. **"15% - 2"** - Class 2 with 15% rate

### 6.2 Tax Class Impact
- **Déductions (Column K):** Amount varies significantly
- **Imposable (Column L):** Calculation differs
- **Impots (Column M):** Tax amount calculated differently
- **Example:** Class "15% - 2" has 493 deductions vs Class "1" has 0

---

## 7. SAMPLE DATA

### 7.1 Miodrag MILIC (January 2024)

**Employee Info:**
- Matricule: 1989 11 24 004 47
- Ancienneté: 2017-04-07
- Employee Number: N° 1
- Tax Class: 15% - 2

**Monthly Data:**
- Jours: J 1-31
- Jours impos.: 25
- Rémun. Base: 2,570.935
- Brut Mensuel: 2,570.935
- Cotisable: 2,570.935
- Maladie: 78.42
- Pension: 205.67
- CI-CO2: 14
- Déductions: 493
- Imposable: 1,793.84
- Impots: 269.08
- CIS: 50
- CISSM: 70
- **Salaire Net: 2,659.00**

**Annual Totals:**
- Brut Mensuel: 30,851.22
- Maladie: 941.04
- Pension: 2,468.04
- Déductions: 4,996
- Impots: 2,701.18
- **Salaire Net: 31,555.41**

---

### 7.2 BERTHE Alexandra (January 2024)

**Employee Info:**
- Ancienneté: 2021-09-16
- Tax Class: 1

**Monthly Data:**
- Brut Mensuel: 2,570.93
- Maladie: 78.42
- Pension: 205.67
- Déductions: 0 (Class 1 has no deductions)
- Imposable: 2,286.84
- Impots: 149.30
- **Salaire Net: 1,244.54**

**Annual Totals:**
- Brut Mensuel: 32,580.94
- Impots: 1,994.40
- **Salaire Net: 16,366.34**

---

### 7.3 SANDRI Sandro (January 2024)

**Employee Info:**
- Ancienneté: 2024-10-01 (New employee)
- Tax Class: 0.15

**Monthly Data:**
- Brut Mensuel: 13,600.00
- Maladie: 414.80 (Different calculation!)
- Pension: 1,088.00
- CI-CO2: 0
- Déductions: 575.50
- Imposable: 11,521.70
- Impots: 1,728.26
- CIS: 0
- CISSM: 0
- **Salaire Net: 10,131.54**

**Annual Totals:**
- Brut Mensuel: 99,100.00
- Impots: 11,981.43
- **Salaire Net: 85,432.02**

---

## 8. NET SALARY CALCULATION LOGIC

### 8.1 Net Salary Formula (Conceptual)

```
Net Salary = Brut Mensuel
             - Maladie
             - Pension
             - CI-CO2
             - Déductions
             - Impots
             - CIS
             - CISSM
```

### 8.2 Verification (Miodrag MILIC, January)

```
2,659 = 2,570.935
        - 78.42
        - 205.67
        - 14
        - 493
        - 269.08
        - 50
        - 70

Calculation: 2,570.935 - 1,180.17 = 1,390.765

NOTE: The actual net is 2,659, which suggests there are
ADDITIONS to the gross (like bonuses, reimbursements)
NOT visible in these columns, or the Net includes
some components differently.
```

**Important Discovery:** The Net Salary calculation is more complex than simple subtraction. There may be:
- Additional income components not shown in these columns
- Refunds or credits included in the net
- Different calculation methodology

---

## 9. DATA ENTRY & AUTOMATION REQUIREMENTS

### 9.1 Required Employee Master Data
1. **Personal Information:**
   - Full Name
   - Matricule (Social Security Number)
   - Employee Number
   - Address (Street, Postal Code, City)

2. **Employment Information:**
   - Ancienneté Date (Seniority/First employment date)
   - Entrée Date (Current position entry date)
   - Sortie Date (Exit date, if applicable)
   - Status (Empl. = Employee)

3. **Tax & Contribution Profile:**
   - Tax Class (1, 1A, 2, 0.15, etc.)
   - Maladie calculation parameters
   - CI-CO2 applicability (0 or 14)
   - CIS applicability (0 or 50)
   - CISSM applicability (0, 70, or variable)

### 9.2 Required Monthly Input Data
1. **Basic Salary Information:**
   - Rémun. Base (Base Remuneration)
   - Brut Mensuel (if different from Base)
   - Jours impos. (Taxable days, typically 25)

2. **Time Data:**
   - Month identifier (J 1-31, F 1-29, etc.)
   - Normal hours worked (typically 173)
   - Supplementary hours (overtime)
   - Congés (leave days)
   - Férié extra (extra holidays)
   - Congés familliale (family leave)
   - Maladie (sick leave days)

3. **Pre-calculated Values** (if not automated):
   - Imposable amount
   - Impots amount
   - Déductions (if varying from standard)

### 9.3 Automated Calculations
1. **Column G (Cotisable):** = Brut Mensuel
2. **Column I (Pension):** = Cotisable × 0.08
3. **Column H (Maladie):** Based on employee profile
4. **Column K (Déductions):** Based on tax class
5. **Row 22 (Annual Totals):** SUM of rows 10-21
6. **Recapitulation (Rows 27-38):** Reference monthly data
7. **Row 39 (Recap Annual):** SUM of rows 27-38

### 9.4 Summary Sheet Automation
1. **Salaire globale + Maladie:**
   - Auto-sum each column across all employee sheets
   - Calculate Crédits (CI-CO2 + CIS + CISSM totals)

2. **Part Patronales:**
   - Reference Cotisable from summary sheet
   - Calculate Santé (0.11%)
   - Calculate Accident (0.75%)
   - Sum total contributions

---

## 10. IMPLEMENTATION RECOMMENDATIONS

### 10.1 Database Schema Requirements

#### Employees Table
```sql
- employee_id (PK)
- matricule (Social Security Number)
- employee_number
- first_name
- last_name
- address_street
- address_postal
- address_city
- anciennete_date
- entree_date
- sortie_date
- status (default: 'Empl.')
- tax_class
- maladie_formula (employee-specific calculation)
- ci_co2_amount
- cis_amount
- cissm_amount
```

#### Monthly_Payslips Table
```sql
- payslip_id (PK)
- employee_id (FK)
- year
- month (1-12)
- jours_label (e.g., 'J 1-31')
- jours_impos (taxable days)
- remun_base
- brut_mensuel
- cotisable (calculated)
- maladie (calculated)
- pension (calculated)
- ci_co2
- deductions
- imposable
- impots
- cis
- cissm
- salaire_net
```

#### Monthly_Hours Table
```sql
- hours_id (PK)
- payslip_id (FK)
- normal_hours
- supplementary_hours
- conges_days
- ferie_extra_days
- conges_familliale_days
- maladie_days
```

### 10.2 Calculation Engine

#### Core Calculation Functions
1. **calculateCotisable(brut_mensuel)** → brut_mensuel
2. **calculatePension(cotisable)** → cotisable × 0.08
3. **calculateMaladie(employee_profile)** → based on employee-specific formula
4. **calculateDeductions(tax_class, month)** → tax class dependent
5. **calculateEmployerSante(cotisable)** → cotisable × 0.0011
6. **calculateEmployerAccident(cotisable)** → cotisable × 0.0075

#### Tax Calculation Functions
1. **calculateImposable(...)** → complex tax calculation (requires tax tables)
2. **calculateImpots(imposable, tax_class)** → tax table lookup
3. **calculateNetSalary(...)** → comprehensive calculation

### 10.3 Excel Generation

#### Sheet Structure
1. **Create employee sheet template**
2. **Populate header section** with employee data
3. **Fill monthly data** (rows 10-21)
4. **Apply formulas** for calculated fields
5. **Generate recapitulation section** (rows 25-39)
6. **Create summary sheets** with aggregation formulas
7. **Apply formatting** (merged cells, borders, fonts)

### 10.4 Validation & Quality Checks
1. **Annual total verification:** Sum of 12 months = Row 22
2. **Recapitulation matching:** Rows 27-38 match rows 10-21
3. **Summary sheet totals:** Match sum of all employees
4. **Employer contribution rates:** Verify 0.11% and 0.75%
5. **Net salary calculation:** Verify components add up correctly

---

## 11. MISSING INFORMATION & QUESTIONS

### 11.1 Tax Calculation Details
- **Imposable calculation:** How is taxable income derived from gross?
- **Impots calculation:** What tax tables or formulas are used?
- **Tax class impact:** Exact rules for each tax class
- **Monthly variations:** Why does tax class change mid-year (e.g., Nov/Dec)?

### 11.2 Net Salary Discrepancy
- **Net calculation:** The simple subtraction doesn't match the net salary
- **Hidden components:** Are there bonuses, refunds, or other additions?
- **Calculation methodology:** What's the actual formula for net salary?

### 11.3 Employee-Specific Values
- **Maladie formula:** How is the employee-specific health insurance calculated?
- **CI-CO2, CIS, CISSM:** What determines which employees pay these?
- **Deduction variations:** What drives different deduction amounts?

### 11.4 Hours Data
- **Hour rates:** How are normal vs. supplementary hours paid?
- **Leave impact:** How do various leave types affect salary?
- **Hour tracking:** Is this informational or does it affect calculations?

---

## 12. FILE LOCATION & NEXT STEPS

### 12.1 Analysis Files Created
1. **C:\Users\Toufi\AndroidStudioProjects\excelexcelexcel\payslip_analysis.json**
   - Structured JSON with all findings

2. **C:\Users\Toufi\AndroidStudioProjects\excelexcelexcel\PAYSLIP_ANALYSIS_REPORT.md**
   - This comprehensive markdown report

### 12.2 Source File
- **C:\Users\Toufi\AndroidStudioProjects\excelexcelexcel\Groupe Advensys Luxembourg SA - Livre de paie 2024.xlsx**

### 12.3 Recommended Next Steps
1. **Clarify missing calculations:**
   - Obtain tax calculation formulas
   - Understand net salary calculation
   - Get employee-specific Maladie calculation rules

2. **Design database schema:**
   - Implement tables as recommended
   - Create relationships
   - Add necessary indexes

3. **Develop calculation engine:**
   - Implement core calculation functions
   - Create tax calculation module
   - Build validation framework

4. **Build Excel generator:**
   - Create template system
   - Implement formula generation
   - Add formatting engine

5. **Testing & validation:**
   - Compare generated files with original
   - Validate all calculations
   - Verify annual totals

---

## APPENDIX A: COLUMN REFERENCE QUICK GUIDE

### Monthly Data Columns (Rows 10-21)
| Col | Name | Type | Formula/Calculation |
|-----|------|------|---------------------|
| A | Jours | Literal | Month identifier |
| B | Jours impos. | Literal | 25 (typically) |
| C | Stat. | Literal | "Empl." |
| D | Classe - % | Literal | Tax class |
| E | Rémun. Base | Literal | Base salary |
| F | Brut Mensuel | Literal | Gross salary |
| G | Cotisable | Formula | =F{row} |
| H | Maladie | Formula | Employee-specific |
| I | Pension | Calculated | G × 0.08 |
| J | CI-CO2 | Literal | 0 or 14 |
| K | Déductions | Formula | Tax class dependent |
| L | Imposable | Literal | Pre-calculated |
| M | Impots | Literal | Pre-calculated |
| N | CIS | Literal | 0 or 50 |
| O | CISSM | Literal | 0, 70, or variable |
| P | Salaire Net | Literal | Pre-calculated |

### Recapitulation Columns (Rows 27-38)
| Col | Name | Type | Formula |
|-----|------|------|---------|
| A | Month | Literal | J, F, M, etc. |
| B | Normal | Literal | 173 (typically) |
| C | Suppl. | Literal | Overtime hours |
| D | Congés | Literal | Leave days |
| E | Férié extra | Literal | Extra holidays |
| F | Congés familliale | Literal | Family leave |
| G | Maladie | Literal | Sick days |
| H | Imposable | Formula | =L{monthly_row} |
| J | Impot | Formula | =M{monthly_row} |
| K | NET | Formula | =P{monthly_row} |

---

**End of Report**
