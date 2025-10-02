import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguageStore } from '@/stores/language';
import { useDataStore } from '@/stores/data';
import { useAuthStore } from '@/stores/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Building2, Users, DollarSign, Plus, Edit, Trash2, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Company } from '@/types';

export function CompanyList() {
  const { t } = useLanguageStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuthStore();
  const { companies, employees, payslips, addCompany, updateCompany, deleteCompany } =
    useDataStore();

  // Filter companies based on user role and access
  const accessibleCompanies = useMemo(() => {
    if (user?.role === 'SUPER_ADMIN') {
      return companies;
    }

    // Employee - filter by access
    if (user?.role === 'EMPLOYEE' && user.access?.companyIds) {
      return companies.filter(c => user.access?.companyIds.includes(c.id));
    }

    return [];
  }, [companies, user]);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    country: 'Luxembourg',
    currency: 'EUR',
  });

  const getCompanyStats = (companyId: string) => {
    const companyEmployees = employees.filter((e) => e.companyId === companyId);
    const activeEmployees = companyEmployees.filter((e) => e.status === 'active').length;
    const companyPayslips = payslips.filter((p) => p.companyId === companyId);
    const totalPayroll = companyPayslips.reduce((sum, p) => sum + p.earnings.grossMonthly, 0);

    return {
      totalEmployees: companyEmployees.length,
      activeEmployees,
      totalPayroll,
      payslipsCount: companyPayslips.length,
    };
  };

  const handleAdd = () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'Company name is required',
        variant: 'destructive',
      });
      return;
    }

    addCompany({
      name: formData.name,
      country: formData.country,
      currency: formData.currency,
    });

    toast({
      title: 'Success',
      description: 'Company added successfully',
    });

    setFormData({ name: '', country: 'Luxembourg', currency: 'EUR' });
    setIsAddDialogOpen(false);
  };

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      country: company.country,
      currency: company.currency,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!editingCompany) return;

    if (!formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'Company name is required',
        variant: 'destructive',
      });
      return;
    }

    updateCompany(editingCompany.id, {
      name: formData.name,
      country: formData.country,
      currency: formData.currency,
    });

    toast({
      title: 'Success',
      description: 'Company updated successfully',
    });

    setFormData({ name: '', country: 'Luxembourg', currency: 'EUR' });
    setIsEditDialogOpen(false);
    setEditingCompany(null);
  };

  const handleDelete = (companyId: string) => {
    const companyEmployees = employees.filter((e) => e.companyId === companyId);

    if (companyEmployees.length > 0) {
      toast({
        title: 'Cannot delete',
        description: 'Company has employees. Please remove them first.',
        variant: 'destructive',
      });
      return;
    }

    if (confirm('Are you sure you want to delete this company?')) {
      deleteCompany(companyId);
      toast({
        title: 'Success',
        description: 'Company deleted successfully',
      });
    }
  };

  const canManageCompanies = user?.role === 'SUPER_ADMIN' || user?.access?.canEditPayslips;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">{t('companies.title')}</h2>
          <p className="text-sm text-muted-foreground">{accessibleCompanies.length} companies</p>
        </div>
        {canManageCompanies && (
          <Button
            className="bg-primary text-primary-foreground"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus size={16} className="mr-2" />
            Add Company
          </Button>
        )}
      </div>

      {/* Table View */}
      <Card>
        <CardHeader>
          <CardTitle>All Companies</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company Name</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead>Employees</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Total Payroll</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accessibleCompanies.map((company) => {
                const stats = getCompanyStats(company.id);
                return (
                  <TableRow key={company.id}>
                    <TableCell className="font-medium">{company.name}</TableCell>
                    <TableCell>{company.country}</TableCell>
                    <TableCell>{company.currency}</TableCell>
                    <TableCell>{stats.totalEmployees}</TableCell>
                    <TableCell>{stats.activeEmployees}</TableCell>
                    <TableCell>
                      {company.currency} {stats.totalPayroll.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            const basePath = user?.role === 'SUPER_ADMIN' ? '/admin' : '';
                            navigate(`${basePath}/companies/${company.id}`);
                          }}
                        >
                          <Eye size={16} />
                        </Button>
                        {canManageCompanies && (
                          <>
                            <Button size="sm" variant="ghost" onClick={() => handleEdit(company)}>
                              <Edit size={16} />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(company.id)}
                            >
                              <Trash2 size={16} className="text-destructive" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Card View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accessibleCompanies.map((company) => {
          const stats = getCompanyStats(company.id);
          return (
            <Card
              key={company.id}
              className="bg-card border-border hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => {
                const basePath = user?.role === 'SUPER_ADMIN' ? '/admin' : '';
                navigate(`${basePath}/companies/${company.id}`);
              }}
            >
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-card-foreground">
                  <Building2 size={20} className="text-primary" />
                  <span>{company.name}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users size={16} className="text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Employees</span>
                  </div>
                  <span className="font-semibold text-foreground">
                    {stats.activeEmployees}/{stats.totalEmployees}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <DollarSign size={16} className="text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Total Payroll</span>
                  </div>
                  <span className="font-semibold text-foreground">
                    {company.currency} {stats.totalPayroll.toLocaleString()}
                  </span>
                </div>

                <div className="text-xs text-muted-foreground">
                  {stats.payslipsCount} payslips • {company.country}
                </div>

                {canManageCompanies && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(company);
                      }}
                    >
                      <Edit size={14} className="mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(company.id);
                      }}
                    >
                      <Trash2 size={14} className="text-destructive" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add Company Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Company</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Company Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter company name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="Luxembourg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                placeholder="EUR"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd}>Add Company</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Company Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Company</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Company Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter company name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-country">Country</Label>
              <Input
                id="edit-country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="Luxembourg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-currency">Currency</Label>
              <Input
                id="edit-currency"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                placeholder="EUR"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>Update Company</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
