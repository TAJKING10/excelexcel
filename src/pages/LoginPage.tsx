import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Languages } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function LoginPage() {
  const { t, i18n } = useTranslation();
  const { login } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const success = await login(username, password);
    if (!success) {
      setError(t('auth.invalidCredentials'));
    }
    setIsLoading(false);
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Language Switcher */}
        <div className="flex justify-end mb-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Languages className="h-4 w-4 mr-2" />
                {i18n.language.toUpperCase()}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => changeLanguage('fr')}>
                Français (FR)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => changeLanguage('en')}>
                English (EN)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Card className="shadow-xl">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto w-16 h-16 bg-primary rounded-xl flex items-center justify-center mb-4">
              <span className="text-3xl font-bold text-primary-foreground">A</span>
            </div>
            <CardTitle className="text-2xl font-bold">{t('auth.title')}</CardTitle>
            <CardDescription>{t('app.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">{t('auth.username')}</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t('auth.username')}
                  required
                  autoComplete="username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t('auth.password')}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth.password')}
                  required
                  autoComplete="current-password"
                />
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? t('auth.loggingIn') : t('auth.loginButton')}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground text-center mb-2 font-medium">
                {t('auth.demoAccounts')}:
              </p>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex justify-between items-center p-2 bg-background rounded">
                  <span className="font-medium">SuperAdmin</span>
                  <span className="text-xs opacity-70">SUPER_ADMIN</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-background rounded">
                  <span className="font-medium">companyadmin</span>
                  <span className="text-xs opacity-70">COMPANY_ADMIN</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-background rounded">
                  <span className="font-medium">employee</span>
                  <span className="text-xs opacity-70">EMPLOYEE</span>
                </div>
                <p className="text-center text-xs opacity-70 mt-2">
                  {t('auth.password')}: {i18n.language === 'fr' ? 'identique au nom d\'utilisateur' : 'same as username'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}