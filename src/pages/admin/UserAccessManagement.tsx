import React, { useState } from 'react';
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
import { Users, Plus, Edit, Trash2, Shield } from 'lucide-react';
import { UserAccess, User } from '@/types';

export function UserAccessManagement() {
  const { users, companies, individuals, addUser, updateUser, updateUserAccess, deleteUser } = useDataStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    password: '',
  });
  const [accessData, setAccessData] = useState<UserAccess>({
    companyIds: [],
    individualIds: [],
    canViewPayslips: true,
    canEditPayslips: false,
    canDeletePayslips: false,
    canViewAnalytics: false,
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
      });
      setAccessData(user.access || {
        companyIds: [],
        individualIds: [],
        canViewPayslips: true,
        canEditPayslips: false,
        canDeletePayslips: false,
        canViewAnalytics: false,
      });
    } else {
      setSelectedUser(null);
      setFormData({
        username: '',
        email: '',
        firstName: '',
        lastName: '',
        password: '',
      });
      setAccessData({
        companyIds: [],
        individualIds: [],
        canViewPayslips: true,
        canEditPayslips: false,
        canDeletePayslips: false,
        canViewAnalytics: false,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (selectedUser) {
      updateUser(selectedUser.id, {
        ...formData,
        access: accessData,
      });
    } else {
      addUser({
        ...formData,
        role: 'EMPLOYEE',
        access: accessData,
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
    if (!user.access) return 'No access configured';
    const companyCount = user.access.companyIds.length;
    const individualCount = user.access.individualIds.length;
    return `${companyCount} companies, ${individualCount} individuals`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">User Access Management</h1>
          <p className="text-muted-foreground">
            Manage user access to companies, individuals, and payslips
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5" />
            Users
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
                    No users found. Add a user to get started.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.firstName} {user.lastName}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{getAccessSummary(user)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {user.access?.canViewPayslips && (
                          <Badge variant="secondary" className="text-xs">View</Badge>
                        )}
                        {user.access?.canEditPayslips && (
                          <Badge variant="default" className="text-xs">Edit</Badge>
                        )}
                        {user.access?.canDeletePayslips && (
                          <Badge variant="destructive" className="text-xs">Delete</Badge>
                        )}
                        {user.access?.canViewAnalytics && (
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
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
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

            {/* Permissions */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Permissions</Label>
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
              <div className="border rounded-lg p-4 space-y-2 max-h-40 overflow-y-auto">
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
            </div>

            {/* Individual Access */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Individual Access</Label>
              <div className="border rounded-lg p-4 space-y-2 max-h-40 overflow-y-auto">
                {individuals.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No individuals available</p>
                ) : (
                  individuals.map((individual) => (
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
                  ))
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {selectedUser ? 'Update' : 'Create'} User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
