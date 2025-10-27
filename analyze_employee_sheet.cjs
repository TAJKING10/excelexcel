const XLSX = require('xlsx');

const wb = XLSX.readFile('Groupe Advensys Luxembourg SA - Livre de paie 2024.xlsx');

console.log('=== FULL ANALYSIS OF FIRST EMPLOYEE SHEET ===\n');

// Find an employee with Brut ≈ 2570.93
wb.SheetNames.forEach(sheetName => {
  if (sheetName.includes('globale') || sheetName.includes('Patronales')) return;

  const ws = wb.Sheets[sheetName];

  // Look for value around 2570.93
  Object.keys(ws).forEach(cell => {
    if (cell[0] !== '!' && ws[cell].v) {
      if (Math.abs(ws[cell].v - 2570.93) < 1) {
        console.log(`\n=== Found matching Brut (2570.93) in sheet: ${sheetName} ===`);
        console.log(`Cell ${cell}: ${ws[cell].v}`);

        // Print surrounding area
        console.log('\n--- All cells with formulas and key values ---');
        const allCells = [];
        Object.keys(ws).forEach(c => {
          if (c[0] !== '!' && ws[c].v !== undefined) {
            allCells.push({
              cell: c,
              value: ws[c].v,
              formula: ws[c].f || null,
              type: ws[c].t
            });
          }
        });

        // Sort by cell reference
        allCells.sort((a, b) => {
          const colA = a.cell.match(/[A-Z]+/)[0];
          const rowA = parseInt(a.cell.match(/\d+/)[0]);
          const colB = b.cell.match(/[A-Z]+/)[0];
          const rowB = parseInt(b.cell.match(/\d+/)[0]);

          if (rowA !== rowB) return rowA - rowB;
          return colA.localeCompare(colB);
        });

        // Print cells with interesting values
        allCells.forEach(({cell, value, formula}) => {
          // Print if it's a number in relevant range or has formula
          if (typeof value === 'number') {
            if (
              Math.abs(value - 2570.93) < 1 ||  // Brut
              Math.abs(value - 78.42) < 1 ||     // Maladie
              Math.abs(value - 205.67) < 1 ||    // Pension
              Math.abs(value - 74.25) < 1 ||     // Déductions
              Math.abs(value - 2212.59) < 1 ||   // Imposable
              (value >= 125 && value <= 135) ||   // Impôt
              Math.abs(value - 2533) < 10        // Net
            ) {
              console.log(`${cell}: ${value}${formula ? ` = ${formula}` : ''}`);
            }
          }
        });
      }
    }
  });
});
