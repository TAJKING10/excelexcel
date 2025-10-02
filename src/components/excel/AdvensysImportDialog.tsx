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
import { importAdvensysExcel } from '@/lib/advensysExcelParser';
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

  const { addEmployee, addPayslip } = useDataStore();

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
      const importResult = await importAdvensysExcel(
        file,
        companyId,
        (progress, message) => {
          setProgress(progress);
          setProgressMessage(message);
        }
      );

      setResult(importResult);

      if (importResult.success) {
        // In a real app, you would save to database here
        // For now, we'll just show the success message
        onSuccess?.();
      }
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
