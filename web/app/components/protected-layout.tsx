import { useTranslation } from 'react-i18next';
import DynamicIcon from 'lucide-react/dist/esm/DynamicIcon.js';
import { Outlet, useMatches } from 'react-router';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { Button } from '~/components/ui/button';
import { ProtectedRoute } from './protected-route';
import { isAuthenticated, clearAuthToken } from '~/lib/auth';
import { useNavigateWithTemplate } from '~/lib/template-context';
import { PageTabs } from './ui/page-tabs';

interface RouteHandle {
  subtitle?: string;
  subtitleKey?: string;
}

export default function Layout() {
  const { t } = useTranslation();
  const matches = useMatches();
  const navigate = useNavigateWithTemplate();
  const currentMatch = matches[matches.length - 1];
  const currentPath = currentMatch?.pathname || '/';
  const handle = currentMatch?.handle as RouteHandle;
  const subtitle = handle?.subtitleKey ? t(handle.subtitleKey) : handle?.subtitle || '';
  const authenticated = isAuthenticated();

  const handleLogout = () => {
    clearAuthToken();
    navigate('/login');
  };

  // Tab configuration for page navigation
  const pageTabs = [
    { to: '/', translationKey: 'tabs.dashboard' },
    { to: '/subject-data-preferences', translationKey: 'tabs.dataPreferences' },
    { to: '/subject-data-access', translationKey: 'tabs.dataAccess' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-accent w-full">
        <div className="px-4 py-1">
          <nav className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-1 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <img
                src="/logo.svg"
                alt="Logo"
                style={{ width: '82px', height: '31px', marginTop: '-1px' }}
              />
              {subtitle && (
                <span className="text-blue-600 text-xl font-medium hidden sm:block">
                  {subtitle}
                </span>
              )}
            </button>

            {/* Dropdown Navigation */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="flex items-center space-x-1">
                  <DynamicIcon name={t('navigation.menuIcon')} className="size-6" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {authenticated && (
                  <DropdownMenuItem asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-left border-none focus:border-none focus-visible:border-none hover:border-none font-normal"
                      onClick={handleLogout}
                    >
                      <span className="text-red-600 mr-2">
                        <DynamicIcon name={t('navigation.logoutIcon')} size={20} />
                      </span>
                      {t('navigation.logout')}
                    </Button>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>
      </header>

      {/* Page Navigation Tabs */}
      <PageTabs tabs={pageTabs} />

      {/* Main content */}
      <main className="flex-1">
        <ProtectedRoute>
          <Outlet />
        </ProtectedRoute>
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 py-4 px-4 mt-auto">
        <div className="container mx-auto max-w-8xl px-6">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
            <div className="flex flex-wrap justify-center sm:justify-start space-x-6 text-sm">
              <span className="text-gray-400">{t('footer.privacyPolicy')}</span>
              <span className="text-gray-400">{t('footer.termsConditions')}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
