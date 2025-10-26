const XLSX = require('xlsx');

const wb = XLSX.readFile('monthly payslip advensys.xlsx');

console.log('=== SEARCHING FOR VALUES ===\n');

wb.SheetNames.forEach(sheetName => {
  const ws = wb.Sheets[sheetName];

  // Look for key values
  let totalImposable, impot, net, netAPayer;

  Object.keys(ws).forEach(cell => {
    if (cell[0] !== '!' && ws[cell].v) {
      const value = ws[cell].v;

      // Check if this matches the user's values
      if (Math.abs(value - 2885.89) < 0.01) totalImposable = { cell, value };
      if (Math.abs(value - 240.60) < 0.01) impot = { cell, value };
      if (Math.abs(value - 2723.34) < 0.01) net = { cell, value };
      if (Math.abs(value - 2067.34) < 0.01) netAPayer = { cell, value };
    }
  });

  if (totalImposable || impot || net || netAPayer) {
    console.log(`\n=== SHEET: ${sheetName} ===`);
    if (totalImposable) console.log(`Total Imposable: ${totalImposable.value} at ${totalImposable.cell}`);
    if (impot) console.log(`IMPÔT: ${impot.value} at ${impot.cell}`);
    if (net) console.log(`NET: ${net.value} at ${net.cell}`);
    if (netAPayer) console.log(`NET À PAYER: ${netAPayer.value} at ${netAPayer.cell}`);

    // If we found these values, show the calculation details
    if (net || impot) {
      console.log('\n--- Key Values from this sheet ---');
      const d20 = ws['D20'] ? ws['D20'].v : null;
      const d27 = ws['D27'] ? ws['D27'].v : null;
      const d35 = ws['D35'] ? ws['D35'].v : null;
      const d37 = ws['D37'] ? ws['D37'].v : null;
      const d38 = ws['D38'] ? ws['D38'].v : null;
      const d39 = ws['D39'] ? ws['D39'].v : null;
      const d40 = ws['D40'] ? ws['D40'].v : null;
      const d42 = ws['D42'] ? ws['D42'].v : null;
      const d43 = ws['D43'] ? ws['D43'].v : null;
      const d44 = ws['D44'] ? ws['D44'].v : null;
      const g44 = ws['G44'] ? ws['G44'].v : null;

      if (d20) console.log(`D20 (Total Brut): ${d20}`);
      if (d27) console.log(`D27 (Total Cotisation): ${d27}`);
      if (d35) console.log(`D35 (Total Imposable): ${d35}`);
      if (d37) console.log(`D37 (IMPÔT): ${d37}`);
      if (d38) console.log(`D38 (CISSM): ${d38}`);
      if (d39) console.log(`D39 (CIS/CIP/CIM): ${d39}`);
      if (d40) console.log(`D40 (CI-CO2): ${d40}`);
      if (d42) console.log(`D42 (NET): ${d42}`);
      if (d43) console.log(`D43 (Chèque Repas?): ${d43}`);
      if (d44) console.log(`D44 (Avance?): ${d44}`);
      if (g44) console.log(`G44 (NET À PAYER): ${g44}`);

      // Show formulas if available
      console.log('\n--- Formulas ---');
      if (ws['D35'] && ws['D35'].f) console.log(`D35 formula: ${ws['D35'].f}`);
      if (ws['D37'] && ws['D37'].f) console.log(`D37 formula: ${ws['D37'].f}`);
      if (ws['D42'] && ws['D42'].f) console.log(`D42 formula: ${ws['D42'].f}`);
      if (ws['G44'] && ws['G44'].f) console.log(`G44 formula: ${ws['G44'].f}`);
    }
  }
});

console.log('\n\n=== ALL SHEETS ===');
console.log(wb.SheetNames.join(', '));
