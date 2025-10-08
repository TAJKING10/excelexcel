import React, { useState } from 'react';
import { useLanguageStore } from '@/stores/language';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { UserCircle, Mail, User, Building2, Save, Settings as SettingsIcon, Bell, Globe, Shield, Key } from 'lucide-react';

export function Settings() {
  const { t, language, setLanguage } = useLanguageStore();
  const { user } = useAuth();
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    payslipAlerts: true,
    systemUpdates: false,
    weeklyReports: true,
  });

  const [appearanceSettings, setAppearanceSettings] = useState({
    language: language,
    theme: 'light' as 'light' | 'dark',
    dateFormat: 'DD/MM/YYYY',
    currency: 'EUR',
  });

  const handleSaveProfile = () => {
    if (!profileForm.firstName.trim() || !profileForm.lastName.trim() || !profileForm.email.trim()) {
      toast({ title: t('common.error'), description: t('profile.allFieldsRequired'), variant: 'destructive' });
      return;
    }

    toast({ title: t('common.success'), description: t('settings.profileUpdated') });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setProfileForm({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
    });
    setIsEditing(false);
  };

  const handleSaveNotifications = () => {
    toast({ title: t('common.success'), description: t('settings.notificationsUpdated') });
  };

  const handleSaveAppearance = () => {
    setLanguage(appearanceSettings.language as 'en' | 'fr');
    toast({ title: t('common.success'), description: t('settings.appearanceUpdated') });
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <SettingsIcon className="h-8 w-8" />
          {t('nav.settings', 'Paramètres')}
        </h1>
        <p className="text-muted-foreground">
          {t('settings.subtitle', 'Gérer vos préférences et paramètres du compte')}
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">{t('nav.profile', 'Profil')}</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">{t('settings.notifications', 'Notifications')}</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">{t('settings.appearance', 'Apparence')}</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">{t('settings.security', 'Sécurité')}</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
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
                <Badge variant="default">
                  {user?.role === 'SUPER_ADMIN' ? t('profile.superAdmin', 'Super Admin') : t('profile.employee', 'Employé')}
                </Badge>
              </div>
            </CardHeader>
          </Card>

          {/* Personal Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t('profile.personalInfo', 'Informations personnelles')}</CardTitle>
                  <CardDescription>{t('profile.updateDetails', 'Mettre à jour vos informations')}</CardDescription>
                </div>
                {!isEditing && (
                  <Button onClick={() => setIsEditing(true)}>{t('profile.editProfile', 'Modifier le profil')}</Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">{t('employees.firstname', 'Prénom')}</Label>
                  <Input
                    id="firstName"
                    value={profileForm.firstName}
                    onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">{t('employees.name', 'Nom')}</Label>
                  <Input
                    id="lastName"
                    value={profileForm.lastName}
                    onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="email">{t('employees.email', 'Email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              {isEditing && (
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSaveProfile}>
                    <Save className="mr-2 h-4 w-4" />
                    {t('profile.saveChanges', 'Enregistrer les modifications')}
                  </Button>
                  <Button variant="outline" onClick={handleCancelEdit}>
                    {t('common.cancel', 'Annuler')}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t('profile.accountInfo', 'Informations du compte')}</CardTitle>
              <CardDescription>{t('profile.viewAccountDetails', 'Voir les détails de votre compte')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">{t('profile.username', 'Nom d\'utilisateur')}</p>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <p className="text-foreground">{user?.username}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">{t('profile.role', 'Rôle')}</p>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <p className="text-foreground">
                      {user?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Employee'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.notifications', 'Notifications')}</CardTitle>
              <CardDescription>{t('settings.notificationsDesc', 'Gérer vos préférences de notifications')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t('settings.emailNotifications', 'Notifications par email')}</Label>
                  <p className="text-sm text-muted-foreground">{t('settings.emailNotificationsDesc', 'Recevoir des notifications par email')}</p>
                </div>
                <Switch
                  checked={notificationSettings.emailNotifications}
                  onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, emailNotifications: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t('settings.payslipAlerts', 'Alertes de fiches de paie')}</Label>
                  <p className="text-sm text-muted-foreground">{t('settings.payslipAlertsDesc', 'Recevoir des alertes pour les nouvelles fiches de paie')}</p>
                </div>
                <Switch
                  checked={notificationSettings.payslipAlerts}
                  onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, payslipAlerts: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t('settings.systemUpdates', 'Mises à jour système')}</Label>
                  <p className="text-sm text-muted-foreground">{t('settings.systemUpdatesDesc', 'Recevoir des notifications sur les mises à jour du système')}</p>
                </div>
                <Switch
                  checked={notificationSettings.systemUpdates}
                  onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, systemUpdates: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t('settings.weeklyReports', 'Rapports hebdomadaires')}</Label>
                  <p className="text-sm text-muted-foreground">{t('settings.weeklyReportsDesc', 'Recevoir un résumé hebdomadaire par email')}</p>
                </div>
                <Switch
                  checked={notificationSettings.weeklyReports}
                  onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, weeklyReports: checked })}
                />
              </div>

              <div className="pt-4">
                <Button onClick={handleSaveNotifications}>
                  <Save className="mr-2 h-4 w-4" />
                  {t('common.save', 'Enregistrer')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.appearance', 'Apparence')}</CardTitle>
              <CardDescription>{t('settings.appearanceDesc', 'Personnaliser l\'apparence de l\'application')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>{t('settings.language', 'Langue')}</Label>
                <Select
                  value={appearanceSettings.language}
                  onValueChange={(value) => setAppearanceSettings({ ...appearanceSettings, language: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t('settings.dateFormat', 'Format de date')}</Label>
                <Select
                  value={appearanceSettings.dateFormat}
                  onValueChange={(value) => setAppearanceSettings({ ...appearanceSettings, dateFormat: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t('settings.currency', 'Devise par défaut')}</Label>
                <Select
                  value={appearanceSettings.currency}
                  onValueChange={(value) => setAppearanceSettings({ ...appearanceSettings, currency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4">
                <Button onClick={handleSaveAppearance}>
                  <Save className="mr-2 h-4 w-4" />
                  {t('common.save', 'Enregistrer')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.security', 'Sécurité')}</CardTitle>
              <CardDescription>{t('settings.securityDesc', 'Gérer vos paramètres de sécurité')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">{t('settings.changePassword', 'Changer le mot de passe')}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{t('settings.changePasswordDesc', 'Mettre à jour votre mot de passe pour sécuriser votre compte')}</p>
                  <Button variant="outline">
                    <Key className="mr-2 h-4 w-4" />
                    {t('settings.changePassword', 'Changer le mot de passe')}
                  </Button>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-2">{t('settings.twoFactor', 'Authentification à deux facteurs')}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{t('settings.twoFactorDesc', 'Ajouter une couche de sécurité supplémentaire à votre compte')}</p>
                  <Button variant="outline">
                    <Shield className="mr-2 h-4 w-4" />
                    {t('settings.enable2FA', 'Activer 2FA')}
                  </Button>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-2">{t('settings.activeSessions', 'Sessions actives')}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{t('settings.activeSessionsDesc', 'Gérer les appareils où vous êtes connecté')}</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Windows - Chrome</p>
                        <p className="text-sm text-muted-foreground">Current session • Last active: Now</p>
                      </div>
                      <Badge variant="outline">Active</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
