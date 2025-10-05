import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
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
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Users, Plus, Edit, Trash2, Shield, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { User, Company, Individual } from '@/types';

interface UserWithAccess extends User {
  user_access?: {
    company_ids: string[];
    individual_ids: string[];
    can_view_payslips: boolean;
    can_edit_payslips: boolean;
    can_delete_payslips: boolean;
    can_view_analytics: boolean;
    has_all_companies_access: boolean;
    has_all_individuals_access: boolean;
    can_create_companies: boolean;
    can_create_individuals: boolean;
    can_create_employees: boolean;
  };
}

export function UserAccessManagement() {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  const [users, setUsers] = useState<UserWithAccess[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [individuals, setIndividuals] = useState<Individual[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithAccess | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    isActive: true,
  });

  const [accessData, setAccessData] = useState({
    companyIds: [] as string[],
    individualIds: [] as string[],
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

  // Fetch users, companies, and individuals
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      console.log('📥 Fetching users...');

      // Fetch users (only EMPLOYEE role)
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select(`
          *,
          user_access(*)
        `)
        .eq('role', 'EMPLOYEE')
        .order('created_at', { ascending: false });

      console.log('📥 Users data:', { usersData, usersError });

      if (usersError) {
        console.error('❌ Users fetch error:', usersError);
        throw usersError;
      }

      // Transform the data
      const transformedUsers: UserWithAccess[] = (usersData || []).map((u: any) => ({
        id: u.id,
        username: u.username,
        email: u.email,
        firstName: u.first_name,
        lastName: u.last_name,
        role: u.role,
        isActive: true,
        user_access: u.user_access?.[0]
      }));

      console.log('✅ Transformed users:', transformedUsers);
      setUsers(transformedUsers);

      // Fetch companies
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('*')
        .order('name');

      if (companiesError) throw companiesError;
      setCompanies(companiesData || []);

      // Fetch individuals
      const { data: individualsData, error: individualsError } = await supabase
        .from('individuals')
        .select('*')
        .order('first_name');

      if (individualsError) throw individualsError;
      setIndividuals(individualsData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (user?: UserWithAccess) => {
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

      if (user.user_access) {
        setAccessData({
          companyIds: user.user_access.company_ids || [],
          individualIds: user.user_access.individual_ids || [],
          canViewPayslips: user.user_access.can_view_payslips ?? true,
          canEditPayslips: user.user_access.can_edit_payslips ?? false,
          canDeletePayslips: user.user_access.can_delete_payslips ?? false,
          canViewAnalytics: user.user_access.can_view_analytics ?? false,
          hasAllCompaniesAccess: user.user_access.has_all_companies_access ?? false,
          hasAllIndividualsAccess: user.user_access.has_all_individuals_access ?? false,
          canCreateCompanies: user.user_access.can_create_companies ?? false,
          canCreateIndividuals: user.user_access.can_create_individuals ?? false,
          canCreateEmployees: user.user_access.can_create_employees ?? false,
        });
      }
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

  const handleSave = async () => {
    if (!formData.username || !formData.firstName || !formData.lastName || !formData.email) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedUser && !formData.password) {
      toast({
        title: 'Error',
        description: 'Password is required for new users',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    try {
      if (selectedUser) {
        // Update existing user
        await updateExistingUser();
      } else {
        // Create new user
        await createNewUser();
      }

      toast({
        title: 'Success',
        description: selectedUser ? 'User updated successfully' : 'User created successfully',
      });

      setIsDialogOpen(false);
      fetchData(); // Refresh the list
    } catch (error: any) {
      console.error('Error saving user:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save user',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const createNewUser = async () => {
    console.log('🚀 Starting user creation...', {
      email: formData.email,
      username: formData.username,
    });

    // Step 1: Create user in Supabase Auth
    console.log('📝 Step 1: Creating auth user...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          username: formData.username,
          first_name: formData.firstName,
          last_name: formData.lastName,
        },
        emailRedirectTo: undefined,
      },
    });

    console.log('✅ Auth response:', { authData, authError });

    if (authError) {
      console.error('❌ Auth error:', authError);
      throw new Error(`Auth error: ${authError.message}`);
    }
    if (!authData.user) {
      console.error('❌ No user in auth data');
      throw new Error('User creation failed');
    }

    const userId = authData.user.id;
    console.log('✅ User created with ID:', userId);

    // Wait a bit for the trigger to create the profile
    console.log('⏳ Waiting for trigger to create profile...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 2: Update profile with username and names (in case trigger didn't work)
    console.log('📝 Step 2: Updating profile...');
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        username: formData.username,
        first_name: formData.firstName,
        last_name: formData.lastName,
        role: 'EMPLOYEE',
      })
      .eq('id', userId);

    if (profileError) {
      console.error('❌ Profile error:', profileError);
      throw new Error(`Profile error: ${profileError.message}`);
    }
    console.log('✅ Profile updated');

    // Step 3: Create user access record
    console.log('📝 Step 3: Creating user access...');
    const { error: accessError } = await supabase
      .from('user_access')
      .insert({
        user_id: userId,
        company_ids: accessData.companyIds,
        individual_ids: accessData.individualIds,
        can_view_payslips: accessData.canViewPayslips,
        can_edit_payslips: accessData.canEditPayslips,
        can_delete_payslips: accessData.canDeletePayslips,
        can_view_analytics: accessData.canViewAnalytics,
        has_all_companies_access: accessData.hasAllCompaniesAccess,
        has_all_individuals_access: accessData.hasAllIndividualsAccess,
        can_create_companies: accessData.canCreateCompanies,
        can_create_individuals: accessData.canCreateIndividuals,
        can_create_employees: accessData.canCreateEmployees,
      });

    if (accessError) {
      console.error('❌ Access error:', accessError);
      throw new Error(`Access error: ${accessError.message}`);
    }
    console.log('✅ User access created successfully!');
  };

  const updateExistingUser = async () => {
    if (!selectedUser) return;

    // Step 1: Update profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        username: formData.username,
        first_name: formData.firstName,
        last_name: formData.lastName,
      })
      .eq('id', selectedUser.id);

    if (profileError) throw new Error(`Profile error: ${profileError.message}`);

    // Step 2: Update or create user access
    const { error: accessError } = await supabase
      .from('user_access')
      .upsert({
        user_id: selectedUser.id,
        company_ids: accessData.companyIds,
        individual_ids: accessData.individualIds,
        can_view_payslips: accessData.canViewPayslips,
        can_edit_payslips: accessData.canEditPayslips,
        can_delete_payslips: accessData.canDeletePayslips,
        can_view_analytics: accessData.canViewAnalytics,
        has_all_companies_access: accessData.hasAllCompaniesAccess,
        has_all_individuals_access: accessData.hasAllIndividualsAccess,
        can_create_companies: accessData.canCreateCompanies,
        can_create_individuals: accessData.canCreateIndividuals,
        can_create_employees: accessData.canCreateEmployees,
      });

    if (accessError) throw new Error(`Access error: ${accessError.message}`);

    // Step 3: Update password if provided
    if (formData.password) {
      // Note: This requires admin privileges - you may need to call a Supabase Edge Function
      // For now, we'll skip password updates for existing users
      toast({
        title: 'Note',
        description: 'Password updates for existing users require additional setup',
        variant: 'default',
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      // Delete user access first
      const { error: accessError } = await supabase
        .from('user_access')
        .delete()
        .eq('user_id', userId);

      if (accessError) throw accessError;

      // Delete profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError) throw profileError;

      toast({
        title: 'Success',
        description: 'User deleted successfully',
      });

      fetchData();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete user',
        variant: 'destructive',
      });
    }
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

  const getAccessSummary = (user: UserWithAccess) => {
    if (!user.user_access) return 'No access configured';

    const companyText = user.user_access.has_all_companies_access
      ? 'All Companies'
      : `${user.user_access.company_ids?.length || 0} companies`;

    const individualText = user.user_access.has_all_individuals_access
      ? 'All Individuals'
      : `${user.user_access.individual_ids?.length || 0} individuals`;

    return `${companyText}, ${individualText}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground">Create and manage employee accounts</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Add New User
        </Button>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5" />
            Employee Accounts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Access Summary</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No users found. Click "Add New User" to create one.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.firstName} {user.lastName}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>@{user.username}</TableCell>
                    <TableCell>{getAccessSummary(user)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {user.user_access?.can_view_payslips && (
                          <Badge variant="secondary" className="text-xs">View</Badge>
                        )}
                        {user.user_access?.can_edit_payslips && (
                          <Badge variant="default" className="text-xs">Edit</Badge>
                        )}
                        {user.user_access?.can_delete_payslips && (
                          <Badge variant="destructive" className="text-xs">Delete</Badge>
                        )}
                        {user.user_access?.can_view_analytics && (
                          <Badge variant="outline" className="text-xs">Analytics</Badge>
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
                          onClick={() => handleDeleteUser(user.id)}
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
              {selectedUser ? 'Edit User Access' : 'Add New User'}
            </DialogTitle>
            <DialogDescription>
              Configure user details and access permissions
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* User Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  disabled={saving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  disabled={saving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  disabled={saving || !!selectedUser}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  disabled={saving || !!selectedUser}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">
                Password {selectedUser ? '(leave blank to keep current)' : '*'}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={selectedUser ? 'Enter new password' : 'Enter password'}
                  disabled={saving}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={saving}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Permissions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Permissions</Label>
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
                  disabled={saving}
                >
                  <Shield className="mr-1 h-3 w-3" />
                  Grant Full Access
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
                    disabled={saving}
                  />
                  <Label htmlFor="canViewPayslips" className="font-normal">
                    Can View Payslips
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="canEditPayslips"
                    checked={accessData.canEditPayslips}
                    onCheckedChange={(checked) =>
                      setAccessData({ ...accessData, canEditPayslips: !!checked })
                    }
                    disabled={saving}
                  />
                  <Label htmlFor="canEditPayslips" className="font-normal">
                    Can Edit Payslips
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="canDeletePayslips"
                    checked={accessData.canDeletePayslips}
                    onCheckedChange={(checked) =>
                      setAccessData({ ...accessData, canDeletePayslips: !!checked })
                    }
                    disabled={saving}
                  />
                  <Label htmlFor="canDeletePayslips" className="font-normal">
                    Can Delete Payslips
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="canViewAnalytics"
                    checked={accessData.canViewAnalytics}
                    onCheckedChange={(checked) =>
                      setAccessData({ ...accessData, canViewAnalytics: !!checked })
                    }
                    disabled={saving}
                  />
                  <Label htmlFor="canViewAnalytics" className="font-normal">
                    Can View Analytics
                  </Label>
                </div>
              </div>
            </div>

            {/* Company Access */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Company Access</Label>

              {/* All Companies Toggle */}
              <div className="flex items-center space-x-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                <Checkbox
                  id="allCompanies"
                  checked={accessData.hasAllCompaniesAccess || false}
                  onCheckedChange={(checked) => {
                    setAccessData({
                      ...accessData,
                      hasAllCompaniesAccess: !!checked,
                      companyIds: checked ? [] : accessData.companyIds
                    });
                  }}
                  disabled={saving}
                />
                <Label htmlFor="allCompanies" className="font-semibold text-blue-700 dark:text-blue-300">
                  All Companies (Current & Future)
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
                    disabled={saving}
                  />
                  <Label htmlFor="canCreateCompanies" className="font-medium text-green-700 dark:text-green-300">
                    Can Create New Companies
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-2 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                  <Checkbox
                    id="canCreateEmployees"
                    checked={accessData.canCreateEmployees || false}
                    onCheckedChange={(checked) => {
                      setAccessData({ ...accessData, canCreateEmployees: !!checked });
                    }}
                    disabled={saving}
                  />
                  <Label htmlFor="canCreateEmployees" className="font-medium text-green-700 dark:text-green-300">
                    Can Create Employees Inside Companies
                  </Label>
                </div>
              </div>

              {/* Individual Company Selection */}
              {!accessData.hasAllCompaniesAccess && (
                <div className="border rounded-lg p-4 space-y-2 max-h-40 overflow-y-auto">
                  <p className="text-sm text-muted-foreground mb-2">Select specific companies:</p>
                  {companies.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No companies available</p>
                  ) : (
                    companies.map((company) => (
                      <div key={company.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`company-${company.id}`}
                          checked={accessData.companyIds.includes(company.id)}
                          onCheckedChange={() => toggleCompanyAccess(company.id)}
                          disabled={saving}
                        />
                        <Label htmlFor={`company-${company.id}`} className="font-normal">
                          {company.name}
                        </Label>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Individual Access */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Individual Access</Label>

              {/* All Individuals Toggle */}
              <div className="flex items-center space-x-2 p-3 bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-200 dark:border-purple-800">
                <Checkbox
                  id="allIndividuals"
                  checked={accessData.hasAllIndividualsAccess || false}
                  onCheckedChange={(checked) => {
                    setAccessData({
                      ...accessData,
                      hasAllIndividualsAccess: !!checked,
                      individualIds: checked ? [] : accessData.individualIds
                    });
                  }}
                  disabled={saving}
                />
                <Label htmlFor="allIndividuals" className="font-semibold text-purple-700 dark:text-purple-300">
                  All Individuals (Current & Future)
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
                  disabled={saving}
                />
                <Label htmlFor="canCreateIndividuals" className="font-medium text-green-700 dark:text-green-300">
                  Can Create New Individuals
                </Label>
              </div>

              {/* Individual Selection */}
              {!accessData.hasAllIndividualsAccess && (
                <div className="border rounded-lg p-4 space-y-2 max-h-40 overflow-y-auto">
                  {individuals.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No individuals available</p>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground mb-2">Select specific individuals:</p>
                      {individuals.map((individual) => (
                        <div key={individual.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`individual-${individual.id}`}
                            checked={accessData.individualIds.includes(individual.id)}
                            onCheckedChange={() => toggleIndividualAccess(individual.id)}
                            disabled={saving}
                          />
                          <Label
                            htmlFor={`individual-${individual.id}`}
                            className="font-normal"
                          >
                            {individual.first_name} {individual.last_name}
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
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {selectedUser ? 'Update' : 'Create'} User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
