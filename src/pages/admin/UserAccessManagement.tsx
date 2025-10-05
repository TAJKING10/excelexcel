import React, { useState } from 'react';
import { useLanguageStore } from '@/stores/language';
import { useDataStore } from '@/stores/data';
import { useAuthStore } from '@/stores/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Users, Plus, Edit, Trash2, Shield, Eye, EyeOff, Activity } from 'lucide-react';
import { UserAccess, User } from '@/types';
import { useToast } from '@/hooks/use-toast';

export function UserAccessManagement() {
  const { t } = useLanguageStore();
  const { user: currentUser } = useAuthStore();
  const { users, companies, individuals, addUser, updateUser, updateUserAccess, deleteUser, logActivity } = useDataStore();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    isActive: true,
  });
  const [accessData, setAccessData] = useState<UserAccess>({
    companyIds: [],
    individualIds: [],
    canViewPayslips: true,
    canEditPayslips: false,
    canDeletePayslips: false,
    canViewAnalytics: false,
    hasAllCompaniesAccess: false,
    hasAllIndividualsAccess: false,
    canCreateCompanies: false,
    canCreateIndividuals: false,
    canCreateEmployees: false,
  });

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setSelectedUser(user);
      setFormData({
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        password: '',
        isActive: user.isActive ?? true,
      });
      setAccessData(user.access || {
        companyIds: [],
        individualIds: [],
        canViewPayslips: true,
        canEditPayslips: false,
        canDeletePayslips: false,
        canViewAnalytics: false,
        hasAllCompaniesAccess: false,
        hasAllIndividualsAccess: false,
        canCreateCompanies: false,
        canCreateIndividuals: false,
        canCreateEmployees: false,
      });
    } else {
      setSelectedUser(null);
      setFormData({
        username: '',
        email: '',
        firstName: '',
        lastName: '',
        password: '',
        isActive: true,
      });
      setAccessData({
        companyIds: [],
        individualIds: [],
        canViewPayslips: true,
        canEditPayslips: false,
        canDeletePayslips: false,
        canViewAnalytics: false,
        hasAllCompaniesAccess: false,
        hasAllIndividualsAccess: false,
        canCreateCompanies: false,
        canCreateIndividuals: false,
        canCreateEmployees: false,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.username || !formData.firstName || !formData.lastName || !formData.email) {
      toast({
        title: t('common.error', 'Error'),
        description: t('employees.fillRequired', 'Please fill in all required fields'),
        variant: 'destructive',
      });
      return;
    }

    if (!selectedUser && !formData.password) {
      toast({
        title: t('common.error', 'Error'),
        description: t('users.passwordRequired', 'Password is required for new users'),
        variant: 'destructive',
      });
      return;
    }

    if (selectedUser) {
      const updateData: any = {
        username: formData.username,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        isActive: formData.isActive,
        access: accessData,
      };

      // Only update password if provided
      if (formData.password) {
        updateData.password = formData.password;
      }

      updateUser(selectedUser.id, updateData);

      logActivity({
        userId: currentUser?.id || 'system',
        username: currentUser?.username || 'System',
        action: 'updated_user',
        entityType: 'user',
        entityId: selectedUser.id,
        entityName: `${formData.firstName} ${formData.lastName}`,
        details: `Updated user @${formData.username}`,
      });

      toast({
        title: t('common.success', 'Success'),
        description: t('users.updatedSuccess', 'User updated successfully'),
      });
    } else {
      const newUser = {
        username: formData.username,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        password: formData.password,
        role: 'EMPLOYEE' as const,
        access: accessData,
        isActive: formData.isActive,
        createdAt: new Date().toISOString(),
        createdBy: currentUser?.id,
      };

      addUser(newUser);

      logActivity({
        userId: currentUser?.id || 'system',
        username: currentUser?.username || 'System',
        action: 'created_user',
        entityType: 'user',
        entityId: newUser.username,
        entityName: `${formData.firstName} ${formData.lastName}`,
        details: `Created new user @${formData.username}`,
      });

      toast({
        title: t('common.success', 'Success'),
        description: t('users.createdSuccess', 'User created successfully'),
      });
    }
    setIsDialogOpen(false);
  };

  const toggleCompanyAccess = (companyId: string) => {
    setAccessData((prev) => ({
      ...prev,
      companyIds: prev.companyIds.includes(companyId)
        ? prev.companyIds.filter((id) => id !== companyId)
        : [...prev.companyIds, companyId],
    }));
  };

  const toggleIndividualAccess = (individualId: string) => {
    setAccessData((prev) => ({
      ...prev,
      individualIds: prev.individualIds.includes(individualId)
        ? prev.individualIds.filter((id) => id !== individualId)
        : [...prev.individualIds, individualId],
    }));
  };

  const getAccessSummary = (user: User) => {
    if (!user.access) return t('common.noData');

    const companyText = user.access.hasAllCompaniesAccess
      ? t('users.allCompanies', 'All Companies')
      : `${user.access.companyIds.length} ${t('nav.companies').toLowerCase()}`;

    const individualText = user.access.hasAllIndividualsAccess
      ? t('users.allIndividuals', 'All Individuals')
      : `${user.access.individualIds.length} ${t('nav.individuals').toLowerCase()}`;

    return `${companyText}, ${individualText}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('users.accessSummary')}</h1>
          <p className="text-muted-foreground">{t('users.configureDetails')}</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          {t('users.addNewUser')}
        </Button>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5" />
            {t('users.accessSummary')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('employees.name')}</TableHead>
                <TableHead>{t('employees.email')}</TableHead>
                <TableHead>{t('users.username')}</TableHead>
                <TableHead>{t('users.status', 'Status')}</TableHead>
                <TableHead>{t('users.accessSummary')}</TableHead>
                <TableHead>{t('users.permissions')}</TableHead>
                <TableHead>{t('employees.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    {t('users.noUsers')}
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id} className={user.isActive === false ? 'opacity-50' : ''}>
                    <TableCell className="font-medium">
                      {user.firstName} {user.lastName}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>@{user.username}</TableCell>
                    <TableCell>
                      <Badge variant={user.isActive !== false ? 'default' : 'secondary'}>
                        {user.isActive !== false ? t('users.active', 'Active') : t('users.disabled', 'Disabled')}
                      </Badge>
                    </TableCell>
                    <TableCell>{getAccessSummary(user)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {user.access?.canViewPayslips && (
                          <Badge variant="secondary" className="text-xs">{t('payslips.view')}</Badge>
                        )}
                        {user.access?.canEditPayslips && (
                          <Badge variant="default" className="text-xs">{t('payslips.edit')}</Badge>
                        )}
                        {user.access?.canDeletePayslips && (
                          <Badge variant="destructive" className="text-xs">{t('payslips.delete')}</Badge>
                        )}
                        {user.access?.canViewAnalytics && (
                          <Badge variant="outline" className="text-xs">{t('nav.analytics')}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteUser(user.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* User Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedUser ? t('users.editUserAccess') : t('users.addNewUser')}
            </DialogTitle>
            <DialogDescription>
              {t('users.configureDetails')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* User Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">{t('employees.firstname')}</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">{t('employees.name')}</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">{t('auth.username')}</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t('employees.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">
                {t('auth.password', 'Password')} {selectedUser && `(${t('users.leaveBlank', 'leave blank to keep current')})`}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={selectedUser ? t('users.enterNewPassword', 'Enter new password') : t('users.enterPassword', 'Enter password')}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Active Status */}
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="isActive">
                {t('users.userIs', 'User is')} {formData.isActive ? t('users.active', 'Active') : t('users.disabled', 'Disabled')}
              </Label>
            </div>

            {/* Permissions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">{t('users.permissions')}</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setAccessData({
                      ...accessData,
                      canViewPayslips: true,
                      canEditPayslips: true,
                      canDeletePayslips: true,
                      canViewAnalytics: true,
                      hasAllCompaniesAccess: true,
                      hasAllIndividualsAccess: true,
                      canCreateCompanies: true,
                      canCreateIndividuals: true,
                      canCreateEmployees: true,
                      companyIds: [],
                      individualIds: [],
                    });
                  }}
                  className="text-xs"
                >
                  <Shield className="mr-1 h-3 w-3" />
                  {t('users.grantFullAccess', 'Grant Full Access')}
                </Button>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="canViewPayslips"
                    checked={accessData.canViewPayslips}
                    onCheckedChange={(checked) =>
                      setAccessData({ ...accessData, canViewPayslips: !!checked })
                    }
                  />
                  <Label htmlFor="canViewPayslips" className="font-normal">
                    {t('users.canViewPayslips')}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="canEditPayslips"
                    checked={accessData.canEditPayslips}
                    onCheckedChange={(checked) =>
                      setAccessData({ ...accessData, canEditPayslips: !!checked })
                    }
                  />
                  <Label htmlFor="canEditPayslips" className="font-normal">
                    {t('users.canEditPayslips')}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="canDeletePayslips"
                    checked={accessData.canDeletePayslips}
                    onCheckedChange={(checked) =>
                      setAccessData({ ...accessData, canDeletePayslips: !!checked })
                    }
                  />
                  <Label htmlFor="canDeletePayslips" className="font-normal">
                    {t('users.canDeletePayslips')}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="canViewAnalytics"
                    checked={accessData.canViewAnalytics}
                    onCheckedChange={(checked) =>
                      setAccessData({ ...accessData, canViewAnalytics: !!checked })
                    }
                  />
                  <Label htmlFor="canViewAnalytics" className="font-normal">
                    {t('users.canViewAnalytics')}
                  </Label>
                </div>
              </div>
            </div>

            {/* Company Access */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">{t('users.companyAccess')}</Label>

              {/* All Companies Toggle */}
              <div className="flex items-center space-x-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                <Checkbox
                  id="allCompanies"
                  checked={accessData.hasAllCompaniesAccess || false}
                  onCheckedChange={(checked) => {
                    setAccessData({
                      ...accessData,
                      hasAllCompaniesAccess: !!checked,
                      // Clear individual company selections if "All" is checked
                      companyIds: checked ? [] : accessData.companyIds
                    });
                  }}
                />
                <Label htmlFor="allCompanies" className="font-semibold text-blue-700 dark:text-blue-300">
                  {t('users.allCompaniesCurrentFuture', 'All Companies (Current & Future)')}
                </Label>
              </div>

              {/* Can Create Companies & Employees */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2 p-2 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                  <Checkbox
                    id="canCreateCompanies"
                    checked={accessData.canCreateCompanies || false}
                    onCheckedChange={(checked) => {
                      setAccessData({ ...accessData, canCreateCompanies: !!checked });
                    }}
                  />
                  <Label htmlFor="canCreateCompanies" className="font-medium text-green-700 dark:text-green-300">
                    {t('users.canCreateCompanies', 'Can Create New Companies')}
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-2 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                  <Checkbox
                    id="canCreateEmployees"
                    checked={accessData.canCreateEmployees || false}
                    onCheckedChange={(checked) => {
                      setAccessData({ ...accessData, canCreateEmployees: !!checked });
                    }}
                  />
                  <Label htmlFor="canCreateEmployees" className="font-medium text-green-700 dark:text-green-300">
                    {t('users.canCreateEmployees', 'Can Create Employees Inside Companies')}
                  </Label>
                </div>
              </div>

              {/* Individual Company Selection */}
              {!accessData.hasAllCompaniesAccess && (
                <div className="border rounded-lg p-4 space-y-2 max-h-40 overflow-y-auto">
                  <p className="text-sm text-muted-foreground mb-2">{t('users.selectSpecificCompanies', 'Select specific companies:')}</p>
                  {companies.map((company) => (
                    <div key={company.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`company-${company.id}`}
                        checked={accessData.companyIds.includes(company.id)}
                        onCheckedChange={() => toggleCompanyAccess(company.id)}
                      />
                      <Label htmlFor={`company-${company.id}`} className="font-normal">
                        {company.name}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Individual Access */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">{t('users.individualAccess')}</Label>

              {/* All Individuals Toggle */}
              <div className="flex items-center space-x-2 p-3 bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-200 dark:border-purple-800">
                <Checkbox
                  id="allIndividuals"
                  checked={accessData.hasAllIndividualsAccess || false}
                  onCheckedChange={(checked) => {
                    setAccessData({
                      ...accessData,
                      hasAllIndividualsAccess: !!checked,
                      // Clear individual selections if "All" is checked
                      individualIds: checked ? [] : accessData.individualIds
                    });
                  }}
                />
                <Label htmlFor="allIndividuals" className="font-semibold text-purple-700 dark:text-purple-300">
                  {t('users.allIndividualsCurrentFuture', 'All Individuals (Current & Future)')}
                </Label>
              </div>

              {/* Can Create Individuals */}
              <div className="flex items-center space-x-2 p-2 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                <Checkbox
                  id="canCreateIndividuals"
                  checked={accessData.canCreateIndividuals || false}
                  onCheckedChange={(checked) => {
                    setAccessData({ ...accessData, canCreateIndividuals: !!checked });
                  }}
                />
                <Label htmlFor="canCreateIndividuals" className="font-medium text-green-700 dark:text-green-300">
                  {t('users.canCreateIndividuals', 'Can Create New Individuals')}
                </Label>
              </div>

              {/* Individual Selection */}
              {!accessData.hasAllIndividualsAccess && (
                <div className="border rounded-lg p-4 space-y-2 max-h-40 overflow-y-auto">
                  {individuals.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t('users.noIndividualsAvailable')}</p>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground mb-2">{t('users.selectSpecificIndividuals', 'Select specific individuals:')}</p>
                      {individuals.map((individual) => (
                        <div key={individual.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`individual-${individual.id}`}
                            checked={accessData.individualIds.includes(individual.id)}
                            onCheckedChange={() => toggleIndividualAccess(individual.id)}
                          />
                          <Label
                            htmlFor={`individual-${individual.id}`}
                            className="font-normal"
                          >
                            {individual.firstName} {individual.lastName}
                          </Label>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSave}>
              {selectedUser ? t('common.update') : t('common.create')} {t('users.user')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
