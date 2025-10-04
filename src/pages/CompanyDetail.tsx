import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguageStore } from '@/stores/language';
import { useDataStore } from '@/stores/data';
import { useAuthStore } from '@/stores/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { EmployeeList } from '@/components/employees/EmployeeList';
import { PayslipList } from '@/components/payslips/PayslipList';
import { CompanyAnalytics } from '@/components/analytics/CompanyAnalytics';
import { CompanyAnnualAnalytics } from '@/components/analytics/CompanyAnnualAnalytics';
import { LuxembourgPayslipDetail } from '@/components/payslips/LuxembourgPayslipDetail';
import { ArrowLeft, Plus, Users, Building2, CreditCard, TrendingUp, MoreHorizontal, Edit, Trash2, RotateCcw, Download, FileSpreadsheet, Eye } from 'lucide-react';
import { formatCurrency } from '@/lib/luxembourgPayroll';
import { generatePayslipPDF } from '@/lib/pdf';
import { AdvensysImportDialog } from '@/components/excel/AdvensysImportDialog';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Company } from '@/types';

export function CompanyDetail() {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const { t } = useLanguageStore();
  const { user } = useAuthStore();
  const { companies, employees, getCompanyAnalytics, addEmployee } = useDataStore();
  const { toast } = useToast();

  const [isAddEmployeeDialogOpen, setIsAddEmployeeDialogOpen] = useState(false);
  const [employeeForm, setEmployeeForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    class: '',
    hireDate: new Date().toISOString().split('T')[0],
    baseSalary: 0,
    status: 'active' as 'active' | 'terminated',
  });

  if (!companyId) {
    return <div>Company not found</div>;
  }

  const company = companies.find((c) => c.id === companyId);

  if (!company) {
    return <div>Company not found</div>;
  }

  const analytics = getCompanyAnalytics(companyId);
  const companyEmployees = employees.filter((e) => e.companyId === companyId);

  const handleAddEmployee = () => {
    if (!employeeForm.firstName.trim() || !employeeForm.lastName.trim()) {
      toast({ title: 'Error', description: 'Name fields are required', variant: 'destructive' });
      return;
    }
    if (!employeeForm.email.trim()) {
      toast({ title: 'Error', description: 'Email is required', variant: 'destructive' });
      return;
    }
    if (!employeeForm.baseSalary || employeeForm.baseSalary <= 0) {
      toast({ title: 'Error', description: 'Valid salary is required', variant: 'destructive' });
      return;
    }

    addEmployee({
      ...employeeForm,
      companyId: companyId!,
      terminationDate: null,
    });

    toast({ title: 'Success', description: 'Employee added successfully' });
    setEmployeeForm({
      firstName: '',
      lastName: '',
      email: '',
      class: '',
      hireDate: new Date().toISOString().split('T')[0],
      baseSalary: 0,
      status: 'active',
    });
    setIsAddEmployeeDialogOpen(false);
  };

  const StatCard = ({ icon: Icon, title, value, subtitle }: { icon: any; title: string; value: string | number; subtitle?: string }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(user?.role === 'SUPER_ADMIN' ? '/admin/companies' : '/')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{company.name}</h1>
            <p className="text-muted-foreground">
              {company.country} • {company.currency}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">
            <Building2 className="h-4 w-4 mr-2" />
            {t('companies.overview')}
          </TabsTrigger>
          <TabsTrigger value="employees">
            <Users className="h-4 w-4 mr-2" />
            {t('nav.employees')}
          </TabsTrigger>
          <TabsTrigger value="payslips">
            <CreditCard className="h-4 w-4 mr-2" />
            {t('nav.payslips')}
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <TrendingUp className="h-4 w-4 mr-2" />
            {t('companies.analytics')}
          </TabsTrigger>
          <TabsTrigger value="annual-analysis">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Analyse Annuelle
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={Users}
              title={t('dashboard.totalEmployees')}
              value={analytics.totalEmployees}
              subtitle={`${analytics.activeEmployees} ${t('dashboard.active')}`}
            />
            <StatCard
              icon={Users}
              title={t('dashboard.activeEmployees')}
              value={analytics.activeEmployees}
            />
            <StatCard
              icon={CreditCard}
              title={t('dashboard.monthlyPayroll')}
              value={`${company.currency} ${analytics.monthlyPayroll.toLocaleString()}`}
            />
            <StatCard
              icon={TrendingUp}
              title={t('dashboard.socialCharges')}
              value={`${company.currency} ${analytics.totalSocialCharges.toLocaleString()}`}
            />
          </div>

          {/* Company Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>{t('companies.information')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('companies.name')}
                  </p>
                  <p className="text-foreground">{company.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('companies.country')}
                  </p>
                  <p className="text-foreground">{company.country}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('companies.currency')}
                  </p>
                  <p className="text-foreground">{company.currency}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('companies.createdAt')}
                  </p>
                  <p className="text-foreground">
                    {new Date(company.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Employees Tab */}
        <TabsContent value="employees" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setIsAddEmployeeDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('employees.add')}
            </Button>
          </div>
          <EmployeeListFiltered companyId={companyId} />
        </TabsContent>

        {/* Payslips Tab */}
        <TabsContent value="payslips" className="space-y-4">
          <div className="flex justify-between items-center">
            <AdvensysImportDialog companyId={companyId} onSuccess={() => {}}
            />
            {user?.role === 'SUPER_ADMIN' && (
              <Button
                onClick={() => {
                  navigate('/admin/payslips/create');
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                {t('payslips.create')}
              </Button>
            )}
          </div>
          <PayslipListFiltered companyId={companyId} />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <CompanyAnalytics companyId={companyId} />
        </TabsContent>

        {/* Annual Analysis Tab */}
        <TabsContent value="annual-analysis">
          <CompanyAnnualAnalytics companyId={companyId} />
        </TabsContent>
      </Tabs>

      {/* Add Employee Dialog */}
      <Dialog open={isAddEmployeeDialogOpen} onOpenChange={setIsAddEmployeeDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('employees.add')}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="emp-firstName">{t('employees.firstname')}</Label>
              <Input
                id="emp-firstName"
                value={employeeForm.firstName}
                onChange={(e) => setEmployeeForm({ ...employeeForm, firstName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="emp-lastName">{t('employees.name')}</Label>
              <Input
                id="emp-lastName"
                value={employeeForm.lastName}
                onChange={(e) => setEmployeeForm({ ...employeeForm, lastName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="emp-email">{t('employees.email')}</Label>
              <Input
                id="emp-email"
                type="email"
                value={employeeForm.email}
                onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="emp-class">{t('employees.class') || 'Class'}</Label>
              <Input
                id="emp-class"
                value={employeeForm.class}
                onChange={(e) => setEmployeeForm({ ...employeeForm, class: e.target.value })}
                placeholder="e.g., Cadre A, Employé B"
              />
            </div>
            <div>
              <Label htmlFor="emp-hireDate">{t('employees.hireDate') || 'Hire Date'}</Label>
              <Input
                id="emp-hireDate"
                type="date"
                value={employeeForm.hireDate}
                onChange={(e) => setEmployeeForm({ ...employeeForm, hireDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="emp-salary">{t('employees.salary')}</Label>
              <Input
                id="emp-salary"
                type="number"
                value={employeeForm.baseSalary}
                onChange={(e) => setEmployeeForm({ ...employeeForm, baseSalary: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="emp-status">{t('employees.status')}</Label>
              <Select
                value={employeeForm.status}
                onValueChange={(value: 'active' | 'terminated') => setEmployeeForm({ ...employeeForm, status: value })}
              >
                <SelectTrigger id="emp-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddEmployeeDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleAddEmployee}>{t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Filtered Employee List Component
function EmployeeListFiltered({ companyId }: { companyId: string }) {
  const { t } = useLanguageStore();
  const navigate = useNavigate();
  const { employees, updateEmployee, deleteEmployee } = useDataStore();
  const { toast } = useToast();
  const [editingEmployee, setEditingEmployee] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [employeeForm, setEmployeeForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    class: '',
    taxClass: '',
    matricule: '',
    baseSalary: 0,
  });

  const filteredEmployees = employees.filter((e) => e.companyId === companyId);

  const handleEdit = (employee: any) => {
    setEditingEmployee(employee.id);
    setEmployeeForm({
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      class: employee.class,
      taxClass: String(employee.taxClass || ''),
      matricule: employee.matricule || '',
      baseSalary: employee.baseSalary,
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingEmployee) return;

    updateEmployee(editingEmployee, {
      ...employeeForm,
      taxClass: employeeForm.taxClass,
    });

    toast({
      title: 'Succès',
      description: 'Employé mis à jour avec succès',
    });

    setEditDialogOpen(false);
    setEditingEmployee(null);
  };

  const handleDelete = (employeeId: string, employeeName: string) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer ${employeeName} ?`)) {
      deleteEmployee(employeeId);
      toast({
        title: 'Succès',
        description: 'Employé supprimé avec succès',
      });
    }
  };

  const handleResetPassword = (employeeName: string) => {
    toast({
      title: 'Mot de passe réinitialisé',
      description: `Le mot de passe de ${employeeName} a été réinitialisé`,
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t('employees.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('employees.name')}</TableHead>
                <TableHead>{t('employees.firstname')}</TableHead>
                <TableHead>{t('employees.email')}</TableHead>
                <TableHead>Matricule</TableHead>
                <TableHead>{t('employees.status')}</TableHead>
                <TableHead>{t('employees.salary')}</TableHead>
                <TableHead>{t('employees.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>{employee.lastName}</TableCell>
                  <TableCell>{employee.firstName}</TableCell>
                  <TableCell>{employee.email}</TableCell>
                  <TableCell className="font-mono text-xs">{employee.matricule || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={employee.status === 'active' ? 'default' : 'secondary'}>
                      {employee.status}
                    </Badge>
                  </TableCell>
                  <TableCell>€{employee.baseSalary.toLocaleString()}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/admin/employees/${employee.id}/annual-payslip`)}>
                          <FileSpreadsheet size={16} className="mr-2" />
                          Fiche de Paie Annuelle
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(employee)}>
                          <Edit size={16} className="mr-2" />
                          {t('employees.edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleResetPassword(`${employee.firstName} ${employee.lastName}`)}>
                          <RotateCcw size={16} className="mr-2" />
                          {t('employees.reset')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(employee.id, `${employee.firstName} ${employee.lastName}`)}
                        >
                          <Trash2 size={16} className="mr-2" />
                          {t('employees.delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Employee Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier l'employé</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-firstName">Prénom</Label>
              <Input
                id="edit-firstName"
                value={employeeForm.firstName}
                onChange={(e) => setEmployeeForm({ ...employeeForm, firstName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-lastName">Nom</Label>
              <Input
                id="edit-lastName"
                value={employeeForm.lastName}
                onChange={(e) => setEmployeeForm({ ...employeeForm, lastName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={employeeForm.email}
                onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-matricule">Matricule</Label>
              <Input
                id="edit-matricule"
                value={employeeForm.matricule}
                onChange={(e) => setEmployeeForm({ ...employeeForm, matricule: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-class">Classe</Label>
              <Input
                id="edit-class"
                value={employeeForm.class}
                onChange={(e) => setEmployeeForm({ ...employeeForm, class: e.target.value })}
                placeholder="e.g., Empl., Cadre A"
              />
            </div>
            <div>
              <Label htmlFor="edit-taxClass">Classe d'impôt</Label>
              <Input
                id="edit-taxClass"
                value={employeeForm.taxClass}
                onChange={(e) => setEmployeeForm({ ...employeeForm, taxClass: e.target.value })}
                placeholder="e.g., 1, 2, 0.15"
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="edit-salary">Salaire de base</Label>
              <Input
                id="edit-salary"
                type="number"
                value={employeeForm.baseSalary}
                onChange={(e) => setEmployeeForm({ ...employeeForm, baseSalary: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveEdit}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Filtered Payslip List Component
function PayslipListFiltered({ companyId }: { companyId: string }) {
  const { t } = useLanguageStore();
  const navigate = useNavigate();
  const { payslips, employees } = useDataStore();
  const [selectedPayslip, setSelectedPayslip] = useState<string | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const filteredPayslips = payslips.filter((p) => p.companyId === companyId);

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find((e) => e.id === employeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : t('common.unknown');
  };

  const handleViewPayslip = (payslipId: string) => {
    setSelectedPayslip(payslipId);
    setViewDialogOpen(true);
  };

  const selectedPayslipData = payslips.find((p) => p.id === selectedPayslip);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t('payslips.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPayslips.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">{t('payslips.noPayslips')}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('payslips.period')}</TableHead>
                  <TableHead>{t('payslips.employee')}</TableHead>
                  <TableHead>{t('payslips.gross')}</TableHead>
                  <TableHead>{t('payslips.net')}</TableHead>
                  <TableHead>{t('employees.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayslips.map((payslip) => (
                  <TableRow key={payslip.id}>
                    <TableCell>
                      {String(payslip.period.month).padStart(2, '0')}/{payslip.period.year}
                    </TableCell>
                    <TableCell>{getEmployeeName(payslip.employeeId)}</TableCell>
                    <TableCell>{formatCurrency(payslip.earnings.grossMonthly)}</TableCell>
                    <TableCell>{formatCurrency(payslip.netPay)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" onClick={() => handleViewPayslip(payslip.id)}>
                          <Eye size={16} className="mr-2" />
                          Voir
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => navigate(`/admin/employees/${payslip.employeeId}/annual-payslip`)}>
                          <FileSpreadsheet size={16} className="mr-2" />
                          Annuelle
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => generatePayslipPDF(payslip)}>
                          <Download size={16} className="mr-2" />
                          PDF
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Payslip Detail Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Fiche de Paie</DialogTitle>
          </DialogHeader>
          {selectedPayslipData && (
            <LuxembourgPayslipDetail payslip={selectedPayslipData} />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}