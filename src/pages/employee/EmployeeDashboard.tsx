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
          Welcome, {user?.firstName}!
        </h1>
        <p className="text-muted-foreground">
          Manage payslips for companies and individuals
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Companies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accessibleCompanies.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Companies you manage
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Employees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accessibleEmployees.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total employees
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Payslips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accessiblePayslips.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total payslips created
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="companies" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Companies
          </TabsTrigger>
          <TabsTrigger value="individuals" className="flex items-center gap-2">
            <UserCircle className="h-4 w-4" />
            Individuals
          </TabsTrigger>
        </TabsList>

        {/* Companies Tab */}
        <TabsContent value="companies" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle>Client Companies</CardTitle>
                <CardDescription>
                  Create and manage companies, then add employees and payslips
                </CardDescription>
              </div>
              <Button onClick={() => navigate('/companies/create')} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Company
              </Button>
            </CardHeader>
            <CardContent>
              {accessibleCompanies.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Companies Yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Start by creating your first company
                  </p>
                  <Button onClick={() => navigate('/companies/create')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Company
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
                            <span className="text-muted-foreground">Employees</span>
                            <Badge variant="secondary">
                              {stats.activeEmployees}/{stats.totalEmployees}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Payslips</span>
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
                            View Details
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
                <CardTitle>Individual Freelancers</CardTitle>
                <CardDescription>
                  Manage payslips for individual freelancers (not part of a company)
                </CardDescription>
              </div>
              <Button onClick={() => navigate('/individuals/create')} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Individual
              </Button>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <UserCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Individuals Yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add freelancers who work independently
                </p>
                <Button onClick={() => navigate('/individuals/create')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Individual
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/companies/create')}>
            <Building2 className="h-4 w-4 mr-2" />
            Create Company
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/payslips')}>
            <FileText className="h-4 w-4 mr-2" />
            View All Payslips
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/individuals/create')}>
            <UserCircle className="h-4 w-4 mr-2" />
            Add Individual
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
