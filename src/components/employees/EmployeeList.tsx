import React, { useState } from 'react';
import { useLanguageStore } from '@/stores/language';
import { useDataStore } from '@/stores/data';
import { useAuthStore } from '@/stores/auth';
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
import { Plus, MoreHorizontal, Edit, Trash2, RotateCcw, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Employee } from '@/types';

export function EmployeeList() {
  const { t } = useLanguageStore();
  const { toast } = useToast();
  const { user } = useAuthStore();
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
    return company?.name || 'Unknown';
  };

  const resetForm = () => {
    setFormData({
      companyId: user?.role === 'COMPANY_ADMIN' ? user.companyId || '' : '',
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

  const handleAdd = () => {
    if (
      !formData.companyId ||
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.baseSalary
    ) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    addEmployee({
      companyId: formData.companyId,
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
      title: 'Success',
      description: 'Employee added successfully',
    });

    resetForm();
    setIsAddDialogOpen(false);
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

  const handleUpdate = () => {
    if (!editingEmployee) return;

    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.baseSalary
    ) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    updateEmployee(editingEmployee.id, {
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
      title: 'Success',
      description: 'Employee updated successfully',
    });

    resetForm();
    setIsEditDialogOpen(false);
    setEditingEmployee(null);
  };

  const handleDelete = (employeeId: string) => {
    if (confirm('Are you sure you want to delete this employee?')) {
      deleteEmployee(employeeId);
      toast({
        title: 'Success',
        description: 'Employee deleted successfully',
      });
    }
  };

  const handleTerminate = (employee: Employee) => {
    if (employee.status === 'terminated') {
      // Reactivate
      updateEmployee(employee.id, {
        status: 'active',
        terminationDate: null,
      });
      toast({
        title: 'Success',
        description: 'Employee reactivated successfully',
      });
    } else {
      // Terminate
      const terminationDate = new Date().toISOString().split('T')[0];
      updateEmployee(employee.id, {
        status: 'terminated',
        terminationDate,
      });
      toast({
        title: 'Success',
        description: 'Employee terminated successfully',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">{t('employees.title')}</h2>
          <p className="text-sm text-muted-foreground">
            {filteredEmployees.length} employee(s)
          </p>
        </div>
        {(user?.role === 'SUPER_ADMIN' || user?.role === 'COMPANY_ADMIN') && (
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
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {user?.role === 'SUPER_ADMIN' && (
              <div className="space-y-2">
                <Label>Company</Label>
                <Select value={filterCompanyId} onValueChange={setFilterCompanyId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Companies</SelectItem>
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
              <Label>Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">Employees</CardTitle>
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
                  <TableHead className="text-muted-foreground">Company</TableHead>
                )}
                <TableHead className="text-muted-foreground">Class</TableHead>
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
                    No employees found
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
                          {(user?.role === 'SUPER_ADMIN' || user?.role === 'COMPANY_ADMIN') && (
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
                                {employee.status === 'active' ? 'Terminate' : 'Reactivate'}
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
            <DialogTitle>Add New Employee</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="add-company">Company *</Label>
              <Select
                value={formData.companyId}
                onValueChange={(val) => setFormData({ ...formData, companyId: val })}
                disabled={user?.role === 'COMPANY_ADMIN'}
              >
                <SelectTrigger id="add-company">
                  <SelectValue placeholder="Select company" />
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
              <Label htmlFor="add-firstName">First Name *</Label>
              <Input
                id="add-firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="John"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-lastName">Last Name *</Label>
              <Input
                id="add-lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-email">Email *</Label>
              <Input
                id="add-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john.doe@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-class">Class</Label>
              <Input
                id="add-class"
                value={formData.class}
                onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                placeholder="Cadre A"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-baseSalary">Base Salary *</Label>
              <Input
                id="add-baseSalary"
                type="number"
                value={formData.baseSalary}
                onChange={(e) => setFormData({ ...formData, baseSalary: e.target.value })}
                placeholder="5000"
                step="0.01"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-hireDate">Hire Date</Label>
              <Input
                id="add-hireDate"
                type="date"
                value={formData.hireDate}
                onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-status">Status</Label>
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
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
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
              Cancel
            </Button>
            <Button onClick={handleAdd}>Add Employee</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Employee Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-company">Company</Label>
              <Input
                id="edit-company"
                value={getCompanyName(formData.companyId)}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-firstName">First Name *</Label>
              <Input
                id="edit-firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-lastName">Last Name *</Label>
              <Input
                id="edit-lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-class">Class</Label>
              <Input
                id="edit-class"
                value={formData.class}
                onChange={(e) => setFormData({ ...formData, class: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-baseSalary">Base Salary *</Label>
              <Input
                id="edit-baseSalary"
                type="number"
                value={formData.baseSalary}
                onChange={(e) => setFormData({ ...formData, baseSalary: e.target.value })}
                step="0.01"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-hireDate">Hire Date</Label>
              <Input
                id="edit-hireDate"
                type="date"
                value={formData.hireDate}
                onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-terminationDate">Termination Date</Label>
              <Input
                id="edit-terminationDate"
                type="date"
                value={formData.terminationDate}
                onChange={(e) => setFormData({ ...formData, terminationDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
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
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
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
              Cancel
            </Button>
            <Button onClick={handleUpdate}>Update Employee</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
