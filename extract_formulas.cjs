const XLSX = require('xlsx');

const wb = XLSX.readFile('monthly payslip advensys.xlsx');
const ws = wb.Sheets['janvier'];

console.log('=== ALL CELLS WITH VALUES ===');
const allData = [];
Object.keys(ws).forEach(cell => {
  if (cell[0] !== '!') {
    allData.push({
      cell: cell,
      value: ws[cell].v,
      formula: ws[cell].f || null,
      type: ws[cell].t
    });
  }
});

allData.forEach(item => {
  if (item.formula) {
    console.log(`${item.cell}: ${item.value} = ${item.formula}`);
  }
});

console.log('\n=== COMPLETE DATA DUMP ===');
console.log(JSON.stringify(allData.filter(i => i.formula), null, 2));
