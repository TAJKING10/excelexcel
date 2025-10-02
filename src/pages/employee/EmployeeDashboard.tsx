import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguageStore } from '@/stores/language';
import { useDataStore } from '@/stores/data';
import { useAuthStore } from '@/stores/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  const { employees, payslips, companies } = useDataStore();
  const [activeTab, setActiveTab] = useState('companies');

  // Get accessible companies and data
  const accessibleCompanies = companies.filter((c) =>
    user?.access?.companyIds.includes(c.id)
  );

  const accessibleEmployees = employees.filter((e) =>
    user?.access?.companyIds.includes(e.companyId)
  );

  const accessiblePayslips = payslips.filter((p) =>
    user?.access?.companyIds.includes(p.companyId)
  );

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
              <Button onClick={() => navigate('/companies/create')} className="gap-2">
                <Plus className="h-4 w-4" />
                {t('companies.add')}
              </Button>
            </CardHeader>
            <CardContent>
              {accessibleCompanies.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{t('dashboard.noCompaniesYet')}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t('dashboard.noCompaniesDesc')}
                  </p>
                  <Button onClick={() => navigate('/companies/create')}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('dashboard.createCompany')}
                  </Button>
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
              <Button onClick={() => navigate('/individuals/create')} className="gap-2">
                <Plus className="h-4 w-4" />
                {t('individuals.add')}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <UserCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('dashboard.noIndividualsYet')}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {t('dashboard.noIndividualsDesc')}
                </p>
                <Button onClick={() => navigate('/individuals/create')}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('dashboard.addIndividual')}
                </Button>
              </div>
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
          <Button variant="outline" size="sm" onClick={() => navigate('/companies/create')}>
            <Building2 className="h-4 w-4 mr-2" />
            {t('dashboard.createCompany')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/payslips')}>
            <FileText className="h-4 w-4 mr-2" />
            {t('dashboard.viewAllPayslips')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/individuals/create')}>
            <UserCircle className="h-4 w-4 mr-2" />
            {t('dashboard.addIndividual')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
