import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDataStore } from '@/stores/data';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Download, Loader2, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MONTHS = [
  { value: 1, label: 'Janvier' },
  { value: 2, label: 'Février' },
  { value: 3, label: 'Mars' },
  { value: 4, label: 'Avril' },
  { value: 5, label: 'Mai' },
  { value: 6, label: 'Juin' },
  { value: 7, label: 'Juillet' },
  { value: 8, label: 'Août' },
  { value: 9, label: 'Septembre' },
  { value: 10, label: 'Octobre' },
  { value: 11, label: 'Novembre' },
  { value: 12, label: 'Décembre' },
];

export default function MonthlyPayslipPage() {
  const { employeeId, individualId } = useParams<{ employeeId?: string; individualId?: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [loading, setLoading] = useState(false);

  const employees = useDataStore((state) => state.employees);
  const individuals = useDataStore((state) => state.individuals);
  const companies = useDataStore((state) => state.companies);

  const personId = employeeId || individualId;
  const isIndividual = !!individualId;

  const employee = employees.find((e) => e.id === personId);
  const individual = individuals.find((i) => i.id === personId);
  const person = employee || individual;

  const company = person ? companies.find((c) => c.id === person.companyId) : null;

  // Generate year options (last 5 years)
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const handleExportPDF = () => {
    // TODO: Implement PDF export functionality
    console.log('Export PDF for', selectedMonth, selectedYear);
  };

  if (!personId) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Erreur: Aucun ID d'employé</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate(-1)}>Retour</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('common.back', 'Retour')}
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Employé non trouvé</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              L'employé avec l'ID "{personId}" n'a pas été trouvé.
            </p>
            <Button onClick={() => navigate(-1)}>Retour</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header with Actions */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Calendar className="h-8 w-8" />
              Bulletin de Salaire Mensuel
            </h1>
            <p className="text-muted-foreground">
              {person.firstName} {person.lastName}
            </p>
          </div>
        </div>

        <div className="flex gap-2 items-center">
          <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((month) => (
                <SelectItem key={month.value} value={month.value.toString()}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={handleExportPDF}>
            <Download className="mr-2 h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      {/* Employee and Company Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informations Employé</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nom:</span>
              <span className="font-medium">{person.lastName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Prénom:</span>
              <span className="font-medium">{person.firstName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Matricule:</span>
              <span className="font-medium">{person.matricule || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Classe:</span>
              <span className="font-medium">{person.class || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email:</span>
              <span className="font-medium">{person.email}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informations Entreprise</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Entreprise:</span>
              <span className="font-medium">{company?.name || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Adresse:</span>
              <span className="font-medium">{company?.address || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ville:</span>
              <span className="font-medium">{company?.city || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Code Postal:</span>
              <span className="font-medium">{company?.postalCode || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pays:</span>
              <span className="font-medium">{company?.country || '-'}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payslip Details */}
      <Card>
        <CardHeader>
          <CardTitle>
            Bulletin de Salaire - {MONTHS.find(m => m.value === selectedMonth)?.label} {selectedYear}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Period Information */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold mb-3">Période</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Mois</p>
                <p className="font-medium">{MONTHS.find(m => m.value === selectedMonth)?.label}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Année</p>
                <p className="font-medium">{selectedYear}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Jours travaillés</p>
                <p className="font-medium">22</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Heures travaillées</p>
                <p className="font-medium">176h</p>
              </div>
            </div>
          </div>

          {/* Earnings */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold mb-3">Rémunération</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Salaire de base</span>
                <span className="font-medium">{person.baseSalary?.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Primes et indemnités</span>
                <span>0.00 €</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Heures supplémentaires</span>
                <span>0.00 €</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Salaire Brut</span>
                <span>{person.baseSalary?.toFixed(2)} €</span>
              </div>
            </div>
          </div>

          {/* Deductions */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold mb-3">Cotisations et Retenues</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-muted-foreground">
                <span>Sécurité sociale (Maladie)</span>
                <span>0.00 €</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Sécurité sociale (Pension)</span>
                <span>0.00 €</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Impôts sur le revenu</span>
                <span>0.00 €</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Autres retenues</span>
                <span>0.00 €</span>
              </div>
              <div className="flex justify-between font-bold pt-2 border-t">
                <span>Total Retenues</span>
                <span>0.00 €</span>
              </div>
            </div>
          </div>

          {/* Net Pay */}
          <div className="bg-primary/5 p-6 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Net à Payer</p>
                <p className="text-3xl font-bold text-primary">{person.baseSalary?.toFixed(2)} €</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Date de paiement</p>
                <p className="font-medium">Fin du mois</p>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-muted/50 p-4 rounded text-sm text-muted-foreground">
            <p className="font-medium mb-2">Notes:</p>
            <p>Ce bulletin de salaire est un aperçu. Les montants des cotisations et retenues sont à calculer selon la législation luxembourgeoise en vigueur.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
