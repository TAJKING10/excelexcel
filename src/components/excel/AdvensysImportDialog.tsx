import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileSpreadsheet, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { parseAdvensysExcel } from '@/lib/advensysExcelParser';
import { useDataStore } from '@/stores/data';

interface AdvensysImportDialogProps {
  companyId: string;
  onSuccess?: () => void;
}

export function AdvensysImportDialog({ companyId, onSuccess }: AdvensysImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [result, setResult] = useState<{
    success: boolean;
    employeesCreated: number;
    payslipsCreated: number;
    errors: string[];
  } | null>(null);

  const { addEmployee, addPayslip, addIndividual } = useDataStore();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setProgress(0);
    setProgressMessage('Démarrage de l\'import...');

    try {
      setProgressMessage('Analyse du fichier Excel...');
      const parsed = await parseAdvensysExcel(file, companyId);

      let employeesCreated = 0;
      let payslipsCreated = 0;

      for (const entry of parsed.employees) {
        const emp = entry.employee;
        const firstName = (emp.firstName || '').trim();
        const lastName = (emp.lastName || '').trim();
        // Fallback email if not provided in Excel
        const email = `${firstName}.${lastName}`
          .replace(/\s+/g, '.')
          .replace(/\.+/g, '.')
          .toLowerCase() + '@advensys.lu';

        // Base salary from first payslip remuneration base or gross
        const baseSalary = entry.payslips?.[0]?.earnings?.remunerationBase
          || entry.payslips?.[0]?.earnings?.grossMonthly
          || 0;

        // Create employee in store
        addEmployee({
          companyId,
          firstName: firstName || 'Inconnu',
          lastName: lastName || 'Inconnu',
          email,
          class: 'Empl.',
          taxClass: (entry.payslips?.[0]?.monthlyData?.taxClass ?? 1) as any,
          hireDate: new Date().toISOString().split('T')[0],
          terminationDate: null,
          baseSalary: Number(baseSalary) || 0,
          status: 'active',
          address: emp.address,
          city: emp.city,
          postalCode: emp.postalCode,
          identityNumber: emp.identityNumber,
          matricule: emp.matricule || '',
        });

        // Find the created employee by unique keys
        const state = useDataStore.getState();
        const createdEmployee = state.employees.find(
          (e) => e.companyId === companyId && e.matricule === (emp.matricule || '') && e.firstName === firstName && e.lastName === lastName
        ) || state.employees.find(
          (e) => e.companyId === companyId && e.firstName === firstName && e.lastName === lastName && e.email === email
        );

        if (!createdEmployee) {
          continue; // Skip if not found
        }

        employeesCreated++;

        // Create individual mirror profile
        addIndividual({
          firstName: createdEmployee.firstName,
          lastName: createdEmployee.lastName,
          email: createdEmployee.email,
          country: 'Luxembourg',
          currency: 'EUR',
          status: 'active',
        });

        const updatedState = useDataStore.getState();
        const createdIndividual = updatedState.individuals.find(
          (i) => i.email === createdEmployee.email && i.firstName === createdEmployee.firstName && i.lastName === createdEmployee.lastName
        );

        // Persist payslips for employee and mirrored individual
        for (const p of entry.payslips) {
          // Employee payslip
          addPayslip({
            employeeId: createdEmployee.id,
            companyId: companyId,
            period: p.period,
            employee: {
              id: createdEmployee.id,
              firstName: createdEmployee.firstName,
              lastName: createdEmployee.lastName,
              email: createdEmployee.email,
              class: createdEmployee.class,
              hireDate: createdEmployee.hireDate,
              terminationDate: createdEmployee.terminationDate,
              matricule: createdEmployee.matricule,
              identityNumber: createdEmployee.identityNumber,
              address: createdEmployee.address,
              city: createdEmployee.city,
              postalCode: createdEmployee.postalCode,
            },
            company: {
              id: companyId,
              name: useDataStore.getState().companies.find((c) => c.id === companyId)?.name || 'Entreprise',
              country: 'Luxembourg',
              currency: 'EUR',
            },
            monthlyData: p.monthlyData,
            earnings: p.earnings,
            employeeContrib: p.employeeContrib,
            employerContrib: p.employerContrib,
            workingHours: p.workingHours,
            netPay: p.netPay,
            ytd: p.ytd,
            lines: p.lines || [],
            credits: p.credits,
          });
          payslipsCreated++;

          // Mirror payslip for individual (separate synthetic company)
          if (createdIndividual) {
            addPayslip({
              employeeId: createdIndividual.id,
              companyId: `individual-${createdIndividual.id}`,
              period: p.period,
              employee: {
                id: createdIndividual.id,
                firstName: createdIndividual.firstName,
                lastName: createdIndividual.lastName,
                email: createdIndividual.email,
                class: 'Freelancer',
                hireDate: createdEmployee.hireDate,
                terminationDate: createdEmployee.terminationDate,
                matricule: createdEmployee.matricule,
                identityNumber: createdEmployee.identityNumber,
                address: createdEmployee.address,
                city: createdEmployee.city,
                postalCode: createdEmployee.postalCode,
              },
              company: {
                id: `individual-${createdIndividual.id}`,
                name: 'Individuel',
                country: 'Luxembourg',
                currency: 'EUR',
              },
              monthlyData: p.monthlyData,
              earnings: p.earnings,
              employeeContrib: p.employeeContrib,
              employerContrib: p.employerContrib,
              workingHours: p.workingHours,
              netPay: p.netPay,
              ytd: p.ytd,
              lines: p.lines || [],
              credits: p.credits,
            });
          }
        }

        // Update progress per employee
        setProgressMessage(`Import de ${createdEmployee.firstName} ${createdEmployee.lastName}`);
        setProgress((employeesCreated / parsed.employees.length) * 100);
      }

      setResult({
        success: true,
        employeesCreated,
        payslipsCreated,
        errors: [],
      });

      onSuccess?.();
    } catch (error) {
      setResult({
        success: false,
        employeesCreated: 0,
        payslipsCreated: 0,
        errors: [error instanceof Error ? error.message : 'Erreur inconnue'],
      });
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setFile(null);
    setResult(null);
    setProgress(0);
    setProgressMessage('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload size={16} className="mr-2" />
          Importer Livre de Paie
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importer un Livre de Paie Luxembourg</DialogTitle>
          <DialogDescription>
            Importez un fichier Excel au format Advensys (Livre de paie Luxembourg).
            Le fichier doit contenir une feuille par employé avec les données mensuelles.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Upload */}
          {!result && (
            <div>
              <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-8 text-center hover:border-muted-foreground/40 transition-colors">
                <FileSpreadsheet size={48} className="mx-auto mb-4 text-muted-foreground" />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <span className="text-sm font-medium text-primary hover:underline">
                    Cliquez pour sélectionner un fichier
                  </span>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={importing}
                  />
                </label>
                {file && (
                  <div className="mt-4 text-sm text-muted-foreground">
                    <CheckCircle2 size={16} className="inline mr-2 text-green-600" />
                    {file.name}
                  </div>
                )}
              </div>

              {/* Import Info */}
              <Alert className="mt-4">
                <AlertDescription className="text-xs">
                  <strong>Format attendu :</strong>
                  <ul className="mt-2 space-y-1 list-disc list-inside">
                    <li>Fichier Excel (.xlsx) au format Livre de Paie Luxembourg</li>
                    <li>Une feuille par employé (nom de la feuille = nom de l'employé)</li>
                    <li>Données mensuelles avec colonnes: Brut, Cotisations, Imposable, Impôts, Net</li>
                    <li>Section récapitulation des heures et congés</li>
                  </ul>
                </AlertDescription>
              </Alert>

              {/* Import Progress */}
              {importing && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{progressMessage}</span>
                    <span className="text-sm text-muted-foreground">{progress.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={handleClose} disabled={importing}>
                  Annuler
                </Button>
                <Button onClick={handleImport} disabled={!file || importing}>
                  {importing ? (
                    <>
                      <Loader2 size={16} className="mr-2 animate-spin" />
                      Import en cours...
                    </>
                  ) : (
                    <>
                      <Upload size={16} className="mr-2" />
                      Importer
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Import Result */}
          {result && (
            <div className="space-y-4">
              {result.success ? (
                <Alert className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription>
                    <p className="font-semibold text-green-900 dark:text-green-300 mb-2">
                      Import réussi !
                    </p>
                    <ul className="space-y-1 text-sm">
                      <li>✓ {result.employeesCreated} employé(s) importé(s)</li>
                      <li>✓ {result.payslipsCreated} fiche(s) de paie créée(s)</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription>
                    <p className="font-semibold text-red-900 dark:text-red-300 mb-2">
                      Erreur lors de l'import
                    </p>
                    {result.errors.length > 0 && (
                      <ul className="space-y-1 text-sm text-red-800 dark:text-red-200">
                        {result.errors.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end gap-3">
                {result.success ? (
                  <Button onClick={handleClose}>Fermer</Button>
                ) : (
                  <>
                    <Button variant="outline" onClick={handleClose}>
                      Annuler
                    </Button>
                    <Button
                      onClick={() => {
                        setResult(null);
                        setFile(null);
                      }}
                    >
                      Réessayer
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
