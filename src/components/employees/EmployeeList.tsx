import React, { useState } from 'react';
import { useLanguageStore } from '@/stores/language';
import { useDataStore } from '@/stores/data';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, MoreHorizontal, Edit, Trash2, RotateCcw, Filter, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Employee } from '@/types';
import { useNavigate } from 'react-router-dom';

export function EmployeeList() {
  const { t } = useLanguageStore();
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { employees, companies, addEmployee, updateEmployee, deleteEmployee } = useDataStore();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [filterCompanyId, setFilterCompanyId] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [formData, setFormData] = useState({
    companyId: '',
    firstName: '',
    lastName: '',
    email: '',
    class: '',
    hireDate: '',
    terminationDate: '',
    baseSalary: '',
    status: 'active' as 'active' | 'terminated',
  });

  // Filter companies based on user role and access
  const availableCompanies =
    user?.role === 'SUPER_ADMIN'
      ? companies
      : user?.access?.companyIds
      ? companies.filter((c) => user.access?.companyIds.includes(c.id))
      : [];

  // Filter employees based on user role and filters
  const filteredEmployees = employees.filter((employee) => {
    // Role-based filtering
    if (user?.role === 'SUPER_ADMIN') {
      // Super admin sees all
    } else if (user?.role === 'EMPLOYEE' && user?.access) {
      // Employee - only see employees from companies they have access to
      if (!user.access.companyIds.includes(employee.companyId)) {
        return false;
      }
    } else {
      return false;
    }

    // Company filter
    if (filterCompanyId !== 'all' && employee.companyId !== filterCompanyId) {
      return false;
    }

    // Status filter
    if (filterStatus !== 'all' && employee.status !== filterStatus) {
      return false;
    }

    return true;
  });

  const getCompanyName = (companyId: string) => {
    const company = companies.find((c) => c.id === companyId);
    return company?.name || t('common.unknown');
  };

  const resetForm = () => {
    setFormData({
      companyId: '',
      firstName: '',
      lastName: '',
      email: '',
      class: '',
      hireDate: '',
      terminationDate: '',
      baseSalary: '',
      status: 'active',
    });
  };

  const handleAdd = async () => {
    if (
      !formData.companyId ||
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.baseSalary
    ) {
      toast({
        title: t('common.error'),
        description: t('employees.fillRequired'),
        variant: 'destructive',
      });
      return;
    }

    try {
      await addEmployee({
        companyId: formData.companyId,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        matricule: '', // Add default or make it required
        class: formData.class,
        taxClass: '2', // Add default
        hireDate: formData.hireDate,
        terminationDate: formData.terminationDate || null,
        baseSalary: parseFloat(formData.baseSalary),
        status: formData.status,
      });

      toast({
        title: t('common.success'),
        description: t('employees.addedSuccess'),
      });

      resetForm();
      setIsAddDialogOpen(false);
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message || 'Failed to add employee',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      companyId: employee.companyId,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      class: employee.class,
      hireDate: employee.hireDate,
      terminationDate: employee.terminationDate || '',
      baseSalary: employee.baseSalary.toString(),
      status: employee.status,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingEmployee) return;

    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.baseSalary
    ) {
      toast({
        title: t('common.error'),
        description: t('employees.fillRequired'),
        variant: 'destructive',
      });
      return;
    }

    try {
      await updateEmployee(editingEmployee.id, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        class: formData.class,
        hireDate: formData.hireDate,
        terminationDate: formData.terminationDate || null,
        baseSalary: parseFloat(formData.baseSalary),
        status: formData.status,
      });

      toast({
        title: t('common.success'),
        description: t('employees.updatedSuccess'),
      });

      resetForm();
      setIsEditDialogOpen(false);
      setEditingEmployee(null);
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message || 'Failed to update employee',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (employeeId: string) => {
    if (confirm(t('employees.confirmDelete'))) {
      try {
        await deleteEmployee(employeeId);
        toast({
          title: t('common.success'),
          description: t('employees.deletedSuccess'),
        });
      } catch (error: any) {
        toast({
          title: t('common.error'),
          description: error.message || 'Failed to delete employee',
          variant: 'destructive',
        });
      }
    }
  };

  const handleTerminate = async (employee: Employee) => {
    try {
      if (employee.status === 'terminated') {
        // Reactivate
        await updateEmployee(employee.id, {
          status: 'active',
          terminationDate: null,
        });
        toast({
          title: t('common.success'),
          description: t('employees.reactivatedSuccess'),
        });
      } else {
        // Terminate
        const terminationDate = new Date().toISOString().split('T')[0];
        await updateEmployee(employee.id, {
          status: 'terminated',
          terminationDate,
        });
        toast({
          title: t('common.success'),
          description: t('employees.terminatedSuccess'),
        });
      }
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message || 'Failed to update employee status',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">{t('employees.title')}</h2>
          <p className="text-sm text-muted-foreground">
            {filteredEmployees.length} {t('employees.count')}
          </p>
        </div>
        {user?.role === 'SUPER_ADMIN' && (
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => {
              resetForm();
              setIsAddDialogOpen(true);
            }}
          >
            <Plus size={16} className="mr-2" />
            {t('employees.add')}
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter size={18} />
            {t('employees.filters')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {user?.role === 'SUPER_ADMIN' && (
              <div className="space-y-2">
                <Label>{t('companies.name')}</Label>
                <Select value={filterCompanyId} onValueChange={setFilterCompanyId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('employees.allCompanies')}</SelectItem>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>{t('employees.status')}</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('employees.allStatuses')}</SelectItem>
                  <SelectItem value="active">{t('employees.active')}</SelectItem>
                  <SelectItem value="terminated">{t('employees.terminated')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">{t('employees.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-muted-foreground">{t('employees.name')}</TableHead>
                <TableHead className="text-muted-foreground">
                  {t('employees.firstname')}
                </TableHead>
                <TableHead className="text-muted-foreground">{t('employees.email')}</TableHead>
                {user?.role === 'SUPER_ADMIN' && (
                  <TableHead className="text-muted-foreground">{t('companies.name')}</TableHead>
                )}
                <TableHead className="text-muted-foreground">{t('employees.class')}</TableHead>
                <TableHead className="text-muted-foreground">{t('employees.status')}</TableHead>
                <TableHead className="text-muted-foreground">{t('employees.salary')}</TableHead>
                <TableHead className="text-muted-foreground">{t('employees.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={user?.role === 'SUPER_ADMIN' ? 8 : 7}
                    className="text-center text-muted-foreground"
                  >
                    {t('employees.noEmployees')}
                  </TableCell>
                </TableRow>
              ) : (
                filteredEmployees.map((employee) => (
                  <TableRow key={employee.id} className="hover:bg-muted/50">
                    <TableCell className="text-foreground">{employee.lastName}</TableCell>
                    <TableCell className="text-foreground">{employee.firstName}</TableCell>
                    <TableCell className="text-foreground">{employee.email}</TableCell>
                    {user?.role === 'SUPER_ADMIN' && (
                      <TableCell className="text-foreground">
                        {getCompanyName(employee.companyId)}
                      </TableCell>
                    )}
                    <TableCell className="text-foreground">{employee.class}</TableCell>
                    <TableCell>
                      <Badge variant={employee.status === 'active' ? 'default' : 'secondary'}>
                        {employee.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-foreground">
                      €{employee.baseSalary.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
                          >
                            <MoreHorizontal size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="text-foreground hover:bg-muted"
                            onClick={() => navigate(`/admin/employees/${employee.id}/annual-payslip`)}
                          >
                            <FileText size={16} className="mr-2" />
                            Fiche de Paie Annuelle
                          </DropdownMenuItem>
                          {user?.role === 'SUPER_ADMIN' && (
                            <>
                              <DropdownMenuItem
                                className="text-foreground hover:bg-muted"
                                onClick={() => handleEdit(employee)}
                              >
                                <Edit size={16} className="mr-2" />
                                {t('employees.edit')}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-foreground hover:bg-muted"
                                onClick={() => handleTerminate(employee)}
                              >
                                <RotateCcw size={16} className="mr-2" />
                                {employee.status === 'active' ? t('employees.terminate') : t('employees.reactivate')}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive hover:bg-muted"
                                onClick={() => handleDelete(employee.id)}
                              >
                                <Trash2 size={16} className="mr-2" />
                                {t('employees.delete')}
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Employee Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('employees.addNew')}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="add-company">{t('companies.name')} *</Label>
              <Select
                value={formData.companyId}
                onValueChange={(val) => setFormData({ ...formData, companyId: val })}
                disabled={false}
              >
                <SelectTrigger id="add-company">
                  <SelectValue placeholder={t('companies.select')} />
                </SelectTrigger>
                <SelectContent>
                  {availableCompanies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-firstName">{t('employees.firstname')} *</Label>
              <Input
                id="add-firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder={t('employees.firstnamePlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-lastName">{t('employees.name')} *</Label>
              <Input
                id="add-lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder={t('employees.lastnamePlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-email">{t('employees.email')} *</Label>
              <Input
                id="add-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder={t('employees.emailPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-class">{t('employees.class')}</Label>
              <Input
                id="add-class"
                value={formData.class}
                onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                placeholder={t('employees.classPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-baseSalary">{t('employees.baseSalary')} *</Label>
              <Input
                id="add-baseSalary"
                type="number"
                value={formData.baseSalary}
                onChange={(e) => setFormData({ ...formData, baseSalary: e.target.value })}
                placeholder={t('employees.salaryPlaceholder')}
                step="0.01"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-hireDate">{t('employees.hireDate')}</Label>
              <Input
                id="add-hireDate"
                type="date"
                value={formData.hireDate}
                onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-status">{t('employees.status')}</Label>
              <Select
                value={formData.status}
                onValueChange={(val: 'active' | 'terminated') =>
                  setFormData({ ...formData, status: val })
                }
              >
                <SelectTrigger id="add-status">
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
            <Button
              variant="outline"
              onClick={() => {
                resetForm();
                setIsAddDialogOpen(false);
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button onClick={handleAdd}>{t('employees.add')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Employee Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('employees.editEmployee')}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-company">{t('companies.name')}</Label>
              <Input
                id="edit-company"
                value={getCompanyName(formData.companyId)}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-firstName">{t('employees.firstname')} *</Label>
              <Input
                id="edit-firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-lastName">{t('employees.name')} *</Label>
              <Input
                id="edit-lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">{t('employees.email')} *</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-class">{t('employees.class')}</Label>
              <Input
                id="edit-class"
                value={formData.class}
                onChange={(e) => setFormData({ ...formData, class: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-baseSalary">{t('employees.baseSalary')} *</Label>
              <Input
                id="edit-baseSalary"
                type="number"
                value={formData.baseSalary}
                onChange={(e) => setFormData({ ...formData, baseSalary: e.target.value })}
                step="0.01"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-hireDate">{t('employees.hireDate')}</Label>
              <Input
                id="edit-hireDate"
                type="date"
                value={formData.hireDate}
                onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-terminationDate">{t('employees.terminationDate')}</Label>
              <Input
                id="edit-terminationDate"
                type="date"
                value={formData.terminationDate}
                onChange={(e) => setFormData({ ...formData, terminationDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">{t('employees.status')}</Label>
              <Select
                value={formData.status}
                onValueChange={(val: 'active' | 'terminated') =>
                  setFormData({ ...formData, status: val })
                }
              >
                <SelectTrigger id="edit-status">
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
            <Button
              variant="outline"
              onClick={() => {
                resetForm();
                setIsEditDialogOpen(false);
                setEditingEmployee(null);
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button onClick={handleUpdate}>{t('employees.update')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
