import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeStore } from '@/stores/theme';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Languages, Moon, Sun } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function LoginPage() {
  const { t, i18n } = useTranslation();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { isDarkMode, toggleDarkMode } = useThemeStore();
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      navigate(user.role === 'SUPER_ADMIN' ? '/admin/dashboard' : '/dashboard', { replace: true });
    }
  }, [loading, user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      let email = usernameOrEmail;

      // If input doesn't contain @, treat it as username and lookup email
      if (!usernameOrEmail.includes('@')) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('username', usernameOrEmail)
          .maybeSingle();

        if (profileError || !profile) {
          setError(t('auth.invalidCredentials'));
          setIsLoading(false);
          return;
        }

        email = profile.email;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(t('auth.invalidCredentials'));
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(t('auth.invalidCredentials'));
    } finally {
      setIsLoading(false);
    }
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Language Switcher and Dark Mode Toggle */}
        <div className="flex justify-end gap-2 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleDarkMode}
            className="dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
          >
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700">
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

        <Card className="shadow-xl dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto w-16 h-16 bg-primary dark:bg-blue-600 rounded-xl flex items-center justify-center mb-4">
              <span className="text-3xl font-bold text-primary-foreground dark:text-white">A</span>
            </div>
            <CardTitle className="text-2xl font-bold dark:text-gray-100">{t('auth.title')}</CardTitle>
            <CardDescription className="dark:text-gray-400">{t('app.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="dark:text-gray-200">Username or Email</Label>
                <Input
                  id="username"
                  type="text"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder="Admin"
                  required
                  autoComplete="username"
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="dark:text-gray-200">{t('auth.password')}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth.password')}
                  required
                  autoComplete="current-password"
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
                />
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full dark:bg-blue-600 dark:hover:bg-blue-700" disabled={isLoading}>
                {isLoading ? t('auth.loggingIn') : t('auth.loginButton')}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-muted dark:bg-gray-700 rounded-lg">
              <p className="text-sm text-muted-foreground dark:text-gray-300 text-center mb-2 font-medium">
                Super Admin Account:
              </p>
              <div className="space-y-2 text-xs text-muted-foreground dark:text-gray-400">
                <div className="flex flex-col gap-1 p-2 bg-background dark:bg-gray-600 rounded">
                  <div className="flex justify-between items-center">
                    <span className="font-medium dark:text-gray-200">Username:</span>
                    <span className="text-xs">Admin</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium dark:text-gray-200">Password:</span>
                    <span className="text-xs">Advensys2025</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="font-medium dark:text-gray-200">Role:</span>
                    <span className="text-xs opacity-70">SUPER_ADMIN</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}