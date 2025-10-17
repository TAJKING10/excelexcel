const XLSX = require('xlsx');

const wb = XLSX.readFile('monthly payslip advensys.xlsx');
const ws = wb.Sheets['janvier'];

const formulas = {};
Object.keys(ws).forEach(cell => {
  if (cell[0] !== '!' && ws[cell].f) {
    formulas[cell] = {
      formula: ws[cell].f,
      value: ws[cell].v
    };
  }
});

console.log(JSON.stringify(formulas, null, 2));
