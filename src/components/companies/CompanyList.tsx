import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguageStore } from '@/stores/language';
import { useDataStore } from '@/stores/data';
import { useAuth } from '@/contexts/AuthContext';
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
  const { user } = useAuth();
  const { companies, employees, payslips, addCompany, updateCompany, deleteCompany } =
    useDataStore();

  // Filter companies based on user role and access
  const accessibleCompanies = useMemo(() => {
    if (user?.role === 'SUPER_ADMIN') {
      return companies;
    }

    // Employee - filter by access
    if (user?.role === 'EMPLOYEE' && user.access) {
      // If user has access to all companies, return all
      if (user.access.hasAllCompaniesAccess) {
        return companies;
      }
      // Otherwise filter by specific company IDs
      return companies.filter(c => user.access?.companyIds?.includes(c.id));
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

  const handleAdd = async () => {
    console.log('🔥 handleAdd called');
    console.log('📝 Form data:', formData);

    if (!formData.name.trim()) {
      console.log('❌ Validation failed: name is empty');
      toast({
        title: t('common.error'),
        description: t('companies.nameRequired'),
        variant: 'destructive',
      });
      return;
    }

    console.log('✅ Validation passed, attempting to create company...');

    try {
      const newCompany = await addCompany({
        name: formData.name,
        country: formData.country,
        currency: formData.currency,
      });

      console.log('✅ Company created successfully:', newCompany);

      toast({
        title: t('common.success'),
        description: t('companies.createdSuccess'),
      });

      setFormData({ name: '', country: 'Luxembourg', currency: 'EUR' });
      setIsAddDialogOpen(false);
    } catch (error: any) {
      console.error('❌ Error creating company:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);

      toast({
        title: t('common.error'),
        description: error.message || 'Failed to create company',
        variant: 'destructive',
      });
    }
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

  const handleUpdate = async () => {
    if (!editingCompany) return;

    if (!formData.name.trim()) {
      toast({
        title: t('common.error'),
        description: t('companies.nameRequired'),
        variant: 'destructive',
      });
      return;
    }

    try {
      await updateCompany(editingCompany.id, {
        name: formData.name,
        country: formData.country,
        currency: formData.currency,
      });

      toast({
        title: t('common.success'),
        description: t('common.update'),
      });

      setFormData({ name: '', country: 'Luxembourg', currency: 'EUR' });
      setIsEditDialogOpen(false);
      setEditingCompany(null);
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message || 'Failed to update company',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (companyId: string) => {
    const companyEmployees = employees.filter((e) => e.companyId === companyId);

    if (companyEmployees.length > 0) {
      toast({
        title: t('common.error'),
        description: t('companies.deleteBlocked'),
        variant: 'destructive',
      });
      return;
    }

    if (confirm(t('companies.confirmDelete'))) {
      try {
        await deleteCompany(companyId);
        toast({
          title: t('common.success'),
          description: t('companies.deletedSuccess'),
        });
      } catch (error: any) {
        toast({
          title: t('common.error'),
          description: error.message || 'Failed to delete company',
          variant: 'destructive',
        });
      }
    }
  };

  const canManageCompanies = user?.role === 'SUPER_ADMIN' || user?.access?.canCreateCompanies;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">{t('companies.title')}</h2>
          <p className="text-sm text-muted-foreground">{`${accessibleCompanies.length} ${t('nav.companies').toLowerCase()}`}</p>
        </div>
        {canManageCompanies && (
          <Button
            className="bg-primary text-primary-foreground"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus size={16} className="mr-2" />
            {t('companies.add')}
          </Button>
        )}
      </div>

      {/* Table View */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.allCompanies')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('companies.name')}</TableHead>
                <TableHead>{t('companies.country')}</TableHead>
                <TableHead>{t('companies.currency')}</TableHead>
                <TableHead>{t('companies.employees')}</TableHead>
                <TableHead>{t('dashboard.active')}</TableHead>
                <TableHead>{`${t('common.total')} ${t('dashboard.payroll')}`}</TableHead>
                <TableHead>{t('companies.actions')}</TableHead>
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
                    <span className="text-sm text-muted-foreground">{t('nav.employees')}</span>
                  </div>
                  <span className="font-semibold text-foreground">
                    {stats.activeEmployees}/{stats.totalEmployees}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <DollarSign size={16} className="text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{`${t('common.total')} ${t('dashboard.payroll')}`}</span>
                  </div>
                  <span className="font-semibold text-foreground">
                    {company.currency} {stats.totalPayroll.toLocaleString()}
                  </span>
                </div>

                <div className="text-xs text-muted-foreground">
                  {stats.payslipsCount} {t('nav.payslips').toLowerCase()} • {company.country}
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
                      {t('companies.edit')}
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
            <DialogTitle>{t('dashboard.createCompany')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('companies.name')} *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter company name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">{t('companies.country')}</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="Luxembourg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">{t('companies.currency')}</Label>
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
              {t('common.cancel')}
            </Button>
            <Button onClick={handleAdd}>{t('companies.add')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Company Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('companies.edit')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">{t('companies.name')} *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter company name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-country">{t('companies.country')}</Label>
              <Input
                id="edit-country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="Luxembourg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-currency">{t('companies.currency')}</Label>
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
              {t('common.cancel')}
            </Button>
            <Button onClick={handleUpdate}>{t('common.update')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
