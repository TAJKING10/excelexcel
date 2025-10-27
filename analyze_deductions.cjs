const XLSX = require('xlsx');

const wb = XLSX.readFile('Groupe Advensys Luxembourg SA - Livre de paie 2024.xlsx');

console.log('=== ANALYZING DEDUCTIONS IN 2024 EXCEL ===\n');

// Look at first employee sheet
const firstSheet = wb.SheetNames.find(name =>
  !name.includes('Salaire globale') &&
  !name.includes('Part Patronales') &&
  !name.includes('Recapitulation')
);

if (firstSheet) {
  console.log(`Analyzing sheet: ${firstSheet}\n`);
  const ws = wb.Sheets[firstSheet];

  // Look for Déductions-related cells
  console.log('=== Looking for Déductions (74.25) ===');
  Object.keys(ws).forEach(cell => {
    if (cell[0] !== '!' && ws[cell].v) {
      const value = ws[cell].v;
      if (Math.abs(value - 74.25) < 0.01) {
        console.log(`Found 74.25 at ${cell}: ${value}`);
        if (ws[cell].f) {
          console.log(`  Formula: ${ws[cell].f}`);
        }
      }
    }
  });

  // Look for Total Imposable (should be around 2212.59)
  console.log('\n=== Looking for Total Imposable (≈2212.59) ===');
  Object.keys(ws).forEach(cell => {
    if (cell[0] !== '!' && ws[cell].v) {
      const value = ws[cell].v;
      if (Math.abs(value - 2212.59) < 1) {
        console.log(`Found ${value} at ${cell}`);
        if (ws[cell].f) {
          console.log(`  Formula: ${ws[cell].f}`);
        }
      }
    }
  });

  // Look for IMPÔT (should be around 127)
  console.log('\n=== Looking for IMPÔT (≈127-135) ===');
  Object.keys(ws).forEach(cell => {
    if (cell[0] !== '!' && ws[cell].v) {
      const value = ws[cell].v;
      if (value >= 125 && value <= 140) {
        console.log(`Found ${value} at ${cell}`);
        if (ws[cell].f) {
          console.log(`  Formula: ${ws[cell].f}`);
        }
      }
    }
  });

  // Print key cells from typical payslip structure
  console.log('\n=== Key Monthly Values (First Month) ===');
  const keyCells = ['D20', 'D23', 'D25', 'D26', 'D27', 'D35', 'D37', 'D38', 'D39', 'D40', 'D42'];
  keyCells.forEach(cell => {
    if (ws[cell]) {
      console.log(`${cell}: ${ws[cell].v}${ws[cell].f ? ` (formula: ${ws[cell].f})` : ''}`);
    }
  });
}

console.log('\n=== ALL SHEETS ===');
console.log(wb.SheetNames.join(', '));
