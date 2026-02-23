import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Payslip } from '@/types';
import i18n from '@/i18n';
import { logoGroupe } from '@/assets/logoGroupe';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: typeof autoTable;
  }
}

export function generatePayslipPDF(payslip: Payslip): void {
  const doc = new jsPDF();
  const currentLanguage = i18n.language as 'fr' | 'en';

  // Translations
  const translations = {
    fr: {
      payslip: 'FICHE DE PAIE',
      company: 'Entreprise',
      employee: 'Employé',
      period: 'Période',
      email: 'Email',
      class: 'Classe',
      hireDate: "Date d'embauche",
      earnings: 'GAINS',
      code: 'Code',
      label: 'Libellé',
      quantity: 'Quantité',
      rate: 'Taux',
      amount: 'Montant',
      grossTotal: 'Total Brut',
      employeeContrib: 'COTISATIONS EMPLOYÉ',
      employerContrib: 'COTISATIONS EMPLOYEUR',
      total: 'Total',
      netPay: 'SALAIRE NET À PAYER',
      ytd: 'CUMUL ANNUEL',
      gross: 'Brut',
      net: 'Net',
      employeeContribYTD: 'Cotisations Employé',
      employerContribYTD: 'Cotisations Employeur',
      taxes: 'Impôts',
      generatedOn: 'Généré le',
      thankYou: 'Merci',
    },
    en: {
      payslip: 'PAYSLIP',
      company: 'Company',
      employee: 'Employee',
      period: 'Period',
      email: 'Email',
      class: 'Class',
      hireDate: 'Hire Date',
      earnings: 'EARNINGS',
      code: 'Code',
      label: 'Label',
      quantity: 'Quantity',
      rate: 'Rate',
      amount: 'Amount',
      grossTotal: 'Gross Total',
      employeeContrib: 'EMPLOYEE CONTRIBUTIONS',
      employerContrib: 'EMPLOYER CONTRIBUTIONS',
      total: 'Total',
      netPay: 'NET PAY',
      ytd: 'YEAR TO DATE',
      gross: 'Gross',
      net: 'Net',
      employeeContribYTD: 'Employee Contributions',
      employerContribYTD: 'Employer Contributions',
      taxes: 'Taxes',
      generatedOn: 'Generated on',
      thankYou: 'Thank you',
    },
  };

  const t = translations[currentLanguage];

  // Helper function to format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat(currentLanguage, {
      style: 'currency',
      currency: payslip.company.currency,
    }).format(amount);
  };

  // Helper function to format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString(currentLanguage);
  };

  // Month names
  const monthNames = {
    fr: [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
    ],
    en: [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ],
  };

  const getMonthName = (month: number) => monthNames[currentLanguage][month - 1];

  let yPosition = 20;

  // ===== ADD LOGO =====
  try {
    // Use base64 encoded logo directly - works in both dev and production
    if (logoGroupe && logoGroupe.length > 0) {
      console.log('Adding logo to PDF, length:', logoGroupe.length);
      doc.addImage(logoGroupe, 'PNG', 14, yPosition, 50, 18);
      console.log('Logo added successfully');
    } else {
      console.warn('Logo data is empty or undefined');
    }
  } catch (error) {
    console.error('Failed to add logo to PDF:', error);
  }

  // Header - Company Name
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(payslip.company.name, 105, yPosition, { align: 'center' });
  yPosition += 10;

  // Payslip Title
  doc.setFontSize(16);
  doc.text(t.payslip, 105, yPosition, { align: 'center' });
  yPosition += 15;

  // Company and Employee Info Side by Side
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(t.company, 14, yPosition);
  doc.text(t.employee, 120, yPosition);
  yPosition += 6;

  doc.setFont('helvetica', 'normal');
  doc.text(payslip.company.name, 14, yPosition);
  doc.text(`${payslip.employee.firstName} ${payslip.employee.lastName}`, 120, yPosition);
  yPosition += 5;

  doc.text(`${payslip.company.country}`, 14, yPosition);
  doc.text(`${t.email}: ${payslip.employee.email}`, 120, yPosition);
  yPosition += 5;

  doc.text(`${payslip.company.currency}`, 14, yPosition);
  doc.text(`${t.class}: ${payslip.employee.class}`, 120, yPosition);
  yPosition += 5;

  doc.setFont('helvetica', 'bold');
  doc.text(`${t.period}: ${getMonthName(payslip.period.month)} ${payslip.period.year}`, 14, yPosition);
  doc.text(`${t.hireDate}: ${formatDate(payslip.employee.hireDate)}`, 120, yPosition);
  yPosition += 10;

  // Earnings Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(t.earnings, 14, yPosition);
  yPosition += 5;

  const earningsLines = payslip.lines.filter((line) => line.type === 'earning');
  const earningsData = earningsLines.map((line) => [
    line.code,
    currentLanguage === 'fr' ? line.label_fr : line.label_en,
    line.quantity.toString(),
    formatCurrency(line.rate),
    formatCurrency(line.amount),
  ]);

  doc.autoTable({
    startY: yPosition,
    head: [[t.code, t.label, t.quantity, t.rate, t.amount]],
    body: earningsData,
    foot: [[{ content: t.grossTotal, colSpan: 4, styles: { halign: 'right', fontStyle: 'bold' } }, formatCurrency(payslip.earnings.grossMonthly)]],
    theme: 'grid',
    headStyles: { fillColor: [66, 139, 202], textColor: 255, fontStyle: 'bold' },
    footStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold' },
    margin: { left: 14, right: 14 },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 10;

  // Employee Contributions Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(t.employeeContrib, 14, yPosition);
  yPosition += 5;

  const deductionLines = payslip.lines.filter((line) => line.type === 'deduction');
  const deductionsData = deductionLines.map((line) => [
    line.code,
    currentLanguage === 'fr' ? line.label_fr : line.label_en,
    line.quantity.toString(),
    formatCurrency(line.rate),
    '-' + formatCurrency(line.amount),
  ]);

  doc.autoTable({
    startY: yPosition,
    head: [[t.code, t.label, t.quantity, t.rate, t.amount]],
    body: deductionsData,
    foot: [[{ content: t.total, colSpan: 4, styles: { halign: 'right', fontStyle: 'bold' } }, '-' + formatCurrency(payslip.employeeContrib.total)]],
    theme: 'grid',
    headStyles: { fillColor: [217, 83, 79], textColor: 255, fontStyle: 'bold' },
    footStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold' },
    margin: { left: 14, right: 14 },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 10;

  // Employer Contributions Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(t.employerContrib, 14, yPosition);
  yPosition += 5;

  const employerContribLines = payslip.lines.filter((line) => line.type === 'employer_contrib');
  const employerContribData = employerContribLines.map((line) => [
    line.code,
    currentLanguage === 'fr' ? line.label_fr : line.label_en,
    line.quantity.toString(),
    formatCurrency(line.rate),
    formatCurrency(line.amount),
  ]);

  doc.autoTable({
    startY: yPosition,
    head: [[t.code, t.label, t.quantity, t.rate, t.amount]],
    body: employerContribData,
    foot: [[{ content: t.total, colSpan: 4, styles: { halign: 'right', fontStyle: 'bold' } }, formatCurrency(payslip.employerContrib.socialSecurityTotal)]],
    theme: 'grid',
    headStyles: { fillColor: [240, 173, 78], textColor: 255, fontStyle: 'bold' },
    footStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold' },
    margin: { left: 14, right: 14 },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 10;

  // Net Pay Box
  doc.setFillColor(92, 184, 92);
  doc.rect(14, yPosition, 182, 15, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(t.netPay, 20, yPosition + 10);
  doc.text(formatCurrency(payslip.netPay), 190, yPosition + 10, { align: 'right' });
  yPosition += 20;

  // Reset text color
  doc.setTextColor(0, 0, 0);

  // Year to Date Summary
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(t.ytd, 14, yPosition);
  yPosition += 5;

  const ytdData = [
    [t.gross, formatCurrency(payslip.ytd.gross)],
    [t.net, formatCurrency(payslip.ytd.net)],
    [t.employeeContribYTD, formatCurrency(payslip.ytd.employeeContribTotal)],
    [t.employerContribYTD, formatCurrency(payslip.ytd.employerContribTotal)],
    [t.taxes, formatCurrency(payslip.ytd.taxes)],
  ];

  doc.autoTable({
    startY: yPosition,
    body: ytdData,
    theme: 'plain',
    styles: { fontSize: 10 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 100 },
      1: { halign: 'right' },
    },
    margin: { left: 14, right: 14 },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 10;

  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(128, 128, 128);
  const today = new Date().toLocaleDateString(currentLanguage);
  doc.text(`${t.generatedOn}: ${today}`, 105, 282, { align: 'center' });
  doc.text(`${t.thankYou}`, 105, 288, { align: 'center' });

  // Save the PDF
  const fileName = `Payslip_${payslip.employee.lastName}_${payslip.period.month}-${payslip.period.year}.pdf`;
  doc.save(fileName);
}