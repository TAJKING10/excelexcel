import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguageStore } from '@/stores/language';
import { useDataStore } from '@/stores/data';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileSpreadsheet, Eye, Filter, RefreshCw, MoreHorizontal, Calendar, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/luxembourgPayroll';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function AnnualPayslipList() {
  const navigate = useNavigate();
  const { t } = useLanguageStore();
  const { toast } = useToast();
  const {
    employees,
    companies,
    annualPayslips,
    generateEmployeeAnnualPayslip
  } = useDataStore();
  const { user } = useAuth();

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [filterCompanyId, setFilterCompanyId] = useState<string>('all');
  const [filterEmployeeId, setFilterEmployeeId] = useState<string>('all');
  const [isGenerating, setIsGenerating] = useState(false);

  // Generate year options (last 5 years)
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  // Filter companies based on user access
  const availableCompanies =
    user?.role === 'SUPER_ADMIN'
      ? companies
      : user?.access?.companyIds
      ? companies.filter((c) => user.access?.companyIds.includes(c.id))
      : [];

  // Filter employees based on company filter
  const availableEmployees = filterCompanyId !== 'all'
    ? employees.filter(e => e.companyId === filterCompanyId)
    : employees;

  // Get annual payslips for selected year
  const yearPayslips = annualPayslips.filter(p => p.year === selectedYear);

  // Filter payslips based on user access and filters
  const filteredPayslips = yearPayslips.filter((payslip) => {
    // Role-based access control
    if (user?.role === 'SUPER_ADMIN') {
      // SuperAdmin sees all
    } else if (user?.role === 'EMPLOYEE' && user?.access) {
      // Employee - check access to companies
      if (!user.access.companyIds.includes(payslip.companyId)) {
        return false;
      }
    } else {
      return false;
    }

    // Company filter
    if (filterCompanyId !== 'all' && payslip.companyId !== filterCompanyId) {
      return false;
    }

    // Employee filter
    if (filterEmployeeId !== 'all' && payslip.employeeId !== filterEmployeeId) {
      return false;
    }

    return true;
  });

  // Auto-generate payslips for all employees
  const handleGenerateAll = async () => {
    setIsGenerating(true);
    try {
      const employeesToGenerate = filterCompanyId !== 'all'
        ? employees.filter(e => e.companyId === filterCompanyId && e.status === 'active')
        : employees.filter(e => e.status === 'active');

      let generated = 0;
      for (const employee of employeesToGenerate) {
        try {
          // Check if already exists
          const exists = annualPayslips.some(
            p => p.employeeId === employee.id && p.year === selectedYear
          );
          if (!exists) {
            generateEmployeeAnnualPayslip(employee.id, selectedYear);
            generated++;
          }
        } catch (error) {
        }
      }

      toast({
        title: 'Succès',
        description: `${generated} fiche(s) de paie générée(s) pour ${selectedYear}`,
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Échec de la génération des fiches de paie',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getCompanyName = (companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    return company?.name || 'Unknown';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">
            Fiches de Paie Annuelles
          </h2>
          <p className="text-sm text-muted-foreground">
            {filteredPayslips.length} fiche(s) de paie pour {selectedYear}
          </p>
        </div>
        <div className="flex gap-2">
          <Select
            value={selectedYear.toString()}
            onValueChange={(v) => setSelectedYear(parseInt(v))}
          >
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
          <Button
            variant="outline"
            onClick={handleGenerateAll}
            disabled={isGenerating}
          >
            <RefreshCw size={16} className={`mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'Génération...' : 'Générer Tout'}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter size={18} />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {user?.role === 'SUPER_ADMIN' && (
              <div className="space-y-2">
                <Label>Entreprise</Label>
                <Select
                  value={filterCompanyId}
                  onValueChange={(val) => {
                    setFilterCompanyId(val);
                    setFilterEmployeeId('all');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les entreprises</SelectItem>
                    {availableCompanies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Employé</Label>
              <Select
                value={filterEmployeeId}
                onValueChange={setFilterEmployeeId}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les employés</SelectItem>
                  {availableEmployees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.firstName} {employee.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payslips Table */}
      <Card>
        <CardContent className="pt-6">
          {filteredPayslips.length === 0 ? (
            <div className="text-center py-12">
              <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Aucune fiche de paie trouvée pour {selectedYear}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Cliquez sur "Générer Tout" pour créer les fiches de paie
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employé</TableHead>
                  <TableHead>Entreprise</TableHead>
                  <TableHead>Année</TableHead>
                  <TableHead className="text-right">Brut Annuel</TableHead>
                  <TableHead className="text-right">Net Annuel</TableHead>
                  <TableHead className="text-right">Cotisations</TableHead>
                  <TableHead className="text-right">Impôts</TableHead>
                  <TableHead className="text-center">Statut</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayslips.map((payslip) => (
                  <TableRow key={payslip.id}>
                    <TableCell className="font-medium">
                      {payslip.employee.lastName} {payslip.employee.firstName}
                    </TableCell>
                    <TableCell>{getCompanyName(payslip.companyId)}</TableCell>
                    <TableCell>{payslip.year}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(payslip.recapitulation.totalGrossSalary)}
                    </TableCell>
                    <TableCell className="text-right font-medium text-green-600">
                      {formatCurrency(payslip.recapitulation.totalNetSalary)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(payslip.recapitulation.totalEmployeeContributions)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(payslip.recapitulation.totalTaxes)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Complète
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0"
                          >
                            <MoreHorizontal size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              const basePath = user?.role === 'SUPER_ADMIN' ? '/admin' : '';
                              navigate(`${basePath}/employees/${payslip.employeeId}/annual-payslip`);
                            }}
                          >
                            <FileText size={16} className="mr-2" />
                            Fiche de Paie Annuelle
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              const basePath = user?.role === 'SUPER_ADMIN' ? '/admin' : '';
                              navigate(`${basePath}/employees/${payslip.employeeId}/monthly-payslip`);
                            }}
                          >
                            <Calendar size={16} className="mr-2" />
                            Bulletin de Salaire Mensuel
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
