import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguageStore } from '@/stores/language';
import { useDataStore } from '@/stores/data';
import { useAuthStore } from '@/stores/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Building2,
  Users,
  Plus,
  ArrowRight,
  FileText,
  Eye,
  UserCircle,
} from 'lucide-react';

export function EmployeeDashboard() {
  const { t } = useLanguageStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { employees, payslips, companies, individuals, addCompany, addIndividual } = useDataStore();
  const [activeTab, setActiveTab] = useState('companies');

  // Dialog states
  const [isAddCompanyDialogOpen, setIsAddCompanyDialogOpen] = useState(false);
  const [isAddIndividualDialogOpen, setIsAddIndividualDialogOpen] = useState(false);

  // Form states
  const [companyForm, setCompanyForm] = useState({
    name: '',
    country: 'Luxembourg',
    currency: 'EUR',
  });

  const [individualForm, setIndividualForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    country: 'Luxembourg',
    currency: 'EUR',
    status: 'active' as 'active' | 'terminated',
    baseSalary: 0,
    taxClass: 2,
    matricule: '',
    address: '',
  });

  // Get accessible companies and data
  const accessibleCompanies = user?.access?.hasAllCompaniesAccess
    ? companies
    : companies.filter((c) => user?.access?.companyIds.includes(c.id));

  const accessibleEmployees = user?.access?.hasAllCompaniesAccess
    ? employees
    : employees.filter((e) => user?.access?.companyIds.includes(e.companyId));

  const accessiblePayslips = user?.access?.hasAllCompaniesAccess
    ? payslips
    : payslips.filter((p) => user?.access?.companyIds.includes(p.companyId));

  const accessibleIndividuals = user?.access?.hasAllIndividualsAccess
    ? individuals
    : individuals.filter((i) => user?.access?.individualIds?.includes(i.id));

  // Get stats for each company
  const getCompanyStats = (companyId: string) => {
    const companyEmployees = employees.filter(e => e.companyId === companyId);
    const companyPayslips = payslips.filter(p => p.companyId === companyId);
    return {
      totalEmployees: companyEmployees.length,
      activeEmployees: companyEmployees.filter(e => e.status === 'active').length,
      totalPayslips: companyPayslips.length,
    };
  };

  // Handlers for creating company and individual
  const handleAddCompany = () => {
    if (!companyForm.name.trim()) {
      toast({ title: t('common.error'), description: t('companies.nameRequired'), variant: 'destructive' });
      return;
    }
    addCompany(companyForm);
    toast({ title: t('common.success'), description: t('companies.createdSuccess') });
    setCompanyForm({ name: '', country: 'Luxembourg', currency: 'EUR' });
    setIsAddCompanyDialogOpen(false);
  };

  const handleAddIndividual = () => {
    if (!individualForm.firstName.trim() || !individualForm.lastName.trim()) {
      toast({ title: t('common.error'), description: t('individuals.nameRequired'), variant: 'destructive' });
      return;
    }
    if (!individualForm.baseSalary || individualForm.baseSalary <= 0) {
      toast({ title: t('common.error'), description: 'Valid base salary is required', variant: 'destructive' });
      return;
    }
    addIndividual(individualForm);
    toast({ title: t('common.success'), description: t('individuals.createdSuccess') });
    setIndividualForm({
      firstName: '',
      lastName: '',
      email: '',
      country: 'Luxembourg',
      currency: 'EUR',
      status: 'active',
      baseSalary: 0,
      taxClass: 2,
      matricule: '',
      address: '',
    });
    setIsAddIndividualDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          {t('dashboard.welcome')}, {user?.firstName}!
        </h1>
        <p className="text-muted-foreground">
          {t('dashboard.managePayslips')}
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              {t('nav.companies')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accessibleCompanies.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('dashboard.companiesManaged')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              {t('nav.employees')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accessibleEmployees.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('dashboard.totalEmployees')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              {t('nav.payslips')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accessiblePayslips.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('dashboard.totalPayslipsCreated')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="companies" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            {t('nav.companies')}
          </TabsTrigger>
          <TabsTrigger value="individuals" className="flex items-center gap-2">
            <UserCircle className="h-4 w-4" />
            {t('nav.individuals')}
          </TabsTrigger>
        </TabsList>

        {/* Companies Tab */}
        <TabsContent value="companies" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle>{t('dashboard.clientCompanies')}</CardTitle>
                <CardDescription>
                  {t('dashboard.clientCompaniesDesc')}
                </CardDescription>
              </div>
              {user?.access?.canCreateCompanies && (
                <Button onClick={() => setIsAddCompanyDialogOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  {t('companies.add')}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {accessibleCompanies.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{t('dashboard.noCompaniesYet')}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t('dashboard.noCompaniesDesc')}
                  </p>
                  {user?.access?.canCreateCompanies && (
                    <Button onClick={() => setIsAddCompanyDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      {t('dashboard.createCompany')}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {accessibleCompanies.map((company) => {
                    const stats = getCompanyStats(company.id);
                    return (
                      <Card
                        key={company.id}
                        className="hover:shadow-lg transition-shadow cursor-pointer border-2"
                        onClick={() => navigate(`/companies/${company.id}`)}
                      >
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <Building2 className="h-5 w-5 text-primary" />
                            {company.name}
                          </CardTitle>
                          <CardDescription>
                            {company.country} • {company.currency}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{t('nav.employees')}</span>
                            <Badge variant="secondary">
                              {stats.activeEmployees}/{stats.totalEmployees}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{t('nav.payslips')}</span>
                            <Badge variant="outline">{stats.totalPayslips}</Badge>
                          </div>
                          <Button
                            className="w-full mt-4"
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/companies/${company.id}`);
                            }}
                          >
                            {t('dashboard.viewDetails')}
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Individuals Tab */}
        <TabsContent value="individuals" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle>{t('dashboard.individualFreelancers')}</CardTitle>
                <CardDescription>
                  {t('dashboard.individualFreelancersDesc')}
                </CardDescription>
              </div>
              {user?.access?.canCreateIndividuals && (
                <Button onClick={() => setIsAddIndividualDialogOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  {t('individuals.add')}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {accessibleIndividuals.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <UserCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{t('dashboard.noIndividualsYet')}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t('dashboard.noIndividualsDesc')}
                  </p>
                  {user?.access?.canCreateIndividuals && (
                    <Button onClick={() => setIsAddIndividualDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      {t('dashboard.addIndividual')}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {accessibleIndividuals.map((individual) => (
                    <Card
                      key={individual.id}
                      className="hover:shadow-lg transition-shadow cursor-pointer border-2"
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <UserCircle className="h-5 w-5 text-primary" />
                          {individual.firstName} {individual.lastName}
                        </CardTitle>
                        <CardDescription>
                          {individual.country} • {individual.currency}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{t('employees.email')}</span>
                          <span className="text-xs">{individual.email}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{t('employees.status')}</span>
                          <Badge variant={individual.status === 'active' ? 'default' : 'secondary'}>
                            {individual.status}
                          </Badge>
                        </div>
                        <Button
                          className="w-full mt-4"
                          variant="outline"
                          size="sm"
                        >
                          {t('payslips.create')}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-base">{t('dashboard.quickActions')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {user?.access?.canCreateCompanies && (
            <Button variant="outline" size="sm" onClick={() => setIsAddCompanyDialogOpen(true)}>
              <Building2 className="h-4 w-4 mr-2" />
              {t('dashboard.createCompany')}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => navigate('/payslips')}>
            <FileText className="h-4 w-4 mr-2" />
            {t('dashboard.viewAllPayslips')}
          </Button>
          {user?.access?.canCreateIndividuals && (
            <Button variant="outline" size="sm" onClick={() => setIsAddIndividualDialogOpen(true)}>
              <UserCircle className="h-4 w-4 mr-2" />
              {t('dashboard.addIndividual')}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Create Company Dialog */}
      <Dialog open={isAddCompanyDialogOpen} onOpenChange={setIsAddCompanyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('companies.add')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="company-name">{t('companies.name')}</Label>
              <Input
                id="company-name"
                value={companyForm.name}
                onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                placeholder={t('companies.name')}
              />
            </div>
            <div>
              <Label htmlFor="company-country">{t('companies.country')}</Label>
              <Select
                value={companyForm.country}
                onValueChange={(value) => setCompanyForm({ ...companyForm, country: value })}
              >
                <SelectTrigger id="company-country">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Luxembourg">Luxembourg</SelectItem>
                  <SelectItem value="France">France</SelectItem>
                  <SelectItem value="Belgium">Belgium</SelectItem>
                  <SelectItem value="Germany">Germany</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="company-currency">{t('companies.currency')}</Label>
              <Select
                value={companyForm.currency}
                onValueChange={(value) => setCompanyForm({ ...companyForm, currency: value })}
              >
                <SelectTrigger id="company-currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddCompanyDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleAddCompany}>{t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Individual Dialog */}
      <Dialog open={isAddIndividualDialogOpen} onOpenChange={setIsAddIndividualDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('individuals.add')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="individual-firstName">{t('employees.firstname')}</Label>
              <Input
                id="individual-firstName"
                value={individualForm.firstName}
                onChange={(e) => setIndividualForm({ ...individualForm, firstName: e.target.value })}
                placeholder={t('employees.firstname')}
              />
            </div>
            <div>
              <Label htmlFor="individual-lastName">{t('employees.name')}</Label>
              <Input
                id="individual-lastName"
                value={individualForm.lastName}
                onChange={(e) => setIndividualForm({ ...individualForm, lastName: e.target.value })}
                placeholder={t('employees.name')}
              />
            </div>
            <div>
              <Label htmlFor="individual-email">{t('employees.email')}</Label>
              <Input
                id="individual-email"
                type="email"
                value={individualForm.email}
                onChange={(e) => setIndividualForm({ ...individualForm, email: e.target.value })}
                placeholder={t('employees.email')}
              />
            </div>
            <div>
              <Label htmlFor="individual-country">{t('companies.country')}</Label>
              <Select
                value={individualForm.country}
                onValueChange={(value) => setIndividualForm({ ...individualForm, country: value })}
              >
                <SelectTrigger id="individual-country">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Luxembourg">Luxembourg</SelectItem>
                  <SelectItem value="France">France</SelectItem>
                  <SelectItem value="Belgium">Belgium</SelectItem>
                  <SelectItem value="Germany">Germany</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="individual-currency">{t('companies.currency')}</Label>
              <Select
                value={individualForm.currency}
                onValueChange={(value) => setIndividualForm({ ...individualForm, currency: value })}
              >
                <SelectTrigger id="individual-currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="individual-baseSalary">Base Salary (Monthly)</Label>
              <Input
                id="individual-baseSalary"
                type="number"
                value={individualForm.baseSalary}
                onChange={(e) => setIndividualForm({ ...individualForm, baseSalary: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="individual-taxClass">Tax Class</Label>
              <Select
                value={individualForm.taxClass.toString()}
                onValueChange={(value) => setIndividualForm({ ...individualForm, taxClass: parseInt(value) })}
              >
                <SelectTrigger id="individual-taxClass">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Class 1</SelectItem>
                  <SelectItem value="1a">Class 1a</SelectItem>
                  <SelectItem value="2">Class 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="individual-matricule">Matricule (Optional)</Label>
              <Input
                id="individual-matricule"
                value={individualForm.matricule}
                onChange={(e) => setIndividualForm({ ...individualForm, matricule: e.target.value })}
                placeholder="1989 11 24 004 47"
              />
            </div>
            <div>
              <Label htmlFor="individual-address">Address (Optional)</Label>
              <Input
                id="individual-address"
                value={individualForm.address}
                onChange={(e) => setIndividualForm({ ...individualForm, address: e.target.value })}
                placeholder="52, Grand-Rue"
              />
            </div>
            <div>
              <Label htmlFor="individual-status">{t('employees.status')}</Label>
              <Select
                value={individualForm.status}
                onValueChange={(value: 'active' | 'terminated') => setIndividualForm({ ...individualForm, status: value })}
              >
                <SelectTrigger id="individual-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t('employees.active')}</SelectItem>
                  <SelectItem value="terminated">{t('employees.terminated')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddIndividualDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleAddIndividual}>{t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
