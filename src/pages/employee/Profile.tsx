import React, { useState } from 'react';
import { useLanguageStore } from '@/stores/language';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { UserCircle, Mail, User, Building2, Save } from 'lucide-react';

export function Profile() {
  const { t } = useLanguageStore();
  const { user } = useAuth();
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
  });

  const handleSave = () => {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      toast({ title: t('common.error'), description: t('profile.allFieldsRequired'), variant: 'destructive' });
      return;
    }

    if (user) {
      // TODO: Implement profile update in AuthContext
      toast({ title: t('common.info'), description: 'Profile update coming soon!', variant: 'default' });
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setForm({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          {t('nav.profile')}
        </h1>
        <p className="text-muted-foreground">
          {t('profile.subtitle')}
        </p>
      </div>

      {/* Profile Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <UserCircle className="h-10 w-10 text-primary" />
              </div>
              <div>
                <CardTitle>{user?.firstName} {user?.lastName}</CardTitle>
                <CardDescription>{user?.email}</CardDescription>
              </div>
            </div>
            <Badge variant={user?.role === 'SUPER_ADMIN' ? 'default' : 'secondary'}>
              {user?.role === 'SUPER_ADMIN' ? t('profile.superAdmin') : t('profile.employee')}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('profile.personalInfo')}</CardTitle>
              <CardDescription>{t('profile.updateDetails')}</CardDescription>
            </div>
            {!isEditing && (
              <Button onClick={() => setIsEditing(true)}>{t('profile.editProfile')}</Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">{t('employees.firstname')}</Label>
              <Input
                id="firstName"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="lastName">{t('employees.name')}</Label>
              <Input
                id="lastName"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                disabled={!isEditing}
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="email">{t('employees.email')}</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                disabled={!isEditing}
              />
            </div>
          </div>

          {isEditing && (
            <div className="flex gap-2 pt-4">
              <Button onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                {t('profile.saveChanges')}
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                {t('common.cancel')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle>{t('profile.accountInfo')}</CardTitle>
          <CardDescription>{t('profile.viewAccountDetails')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">{t('profile.username')}</p>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <p className="text-foreground">{user?.username}</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">{t('employees.email')}</p>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <p className="text-foreground">{user?.email}</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">{t('profile.role')}</p>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <p className="text-foreground">
                  {user?.role === 'SUPER_ADMIN' ? t('profile.superAdmin') : t('profile.employee')}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Access Information - Only for Employees */}
      {user?.role === 'EMPLOYEE' && user?.access && (
        <Card>
          <CardHeader>
            <CardTitle>{t('profile.accessPermissions')}</CardTitle>
            <CardDescription>{t('profile.accessDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">{t('profile.accessibleCompanies')}</p>
              <div className="flex flex-wrap gap-2">
                {user.access.companyIds.map((id) => (
                  <Badge key={id} variant="outline">{id}</Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">{t('profile.accessibleIndividuals')}</p>
              <div className="flex flex-wrap gap-2">
                {user.access.individualIds?.map((id) => (
                  <Badge key={id} variant="outline">{id}</Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
