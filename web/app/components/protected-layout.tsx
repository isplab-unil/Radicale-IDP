import { useTranslation } from 'react-i18next';
import DynamicIcon from 'lucide-react/dist/esm/DynamicIcon.js';
import { Outlet, useMatches } from 'react-router';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { Button } from '~/components/ui/button';
import { ProtectedRoute } from './protected-route';
import { isAuthenticated, clearAuthToken, getCurrentUser } from '~/lib/auth';
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
  const handle = currentMatch?.handle as RouteHandle;
  const subtitle = handle?.subtitleKey ? t(handle.subtitleKey) : handle?.subtitle || '';
  const authenticated = isAuthenticated();
  const user = getCurrentUser();

  const handleLogout = () => {
    clearAuthToken();
    navigate('/login');
  };

  // Tab configuration for page navigation
  const pageTabs = [
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
                <span className="text-brand-blue text-xl font-medium hidden sm:block">
                  {subtitle}
                </span>
              )}
            </button>

            {/* Dropdown Navigation */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  aria-label={t('navigation.menuLabel')}
                  className="flex items-center justify-center w-10 h-10 bg-gray-300 rounded-full hover:bg-gray-400 transition-colors cursor-pointer"
                >
                  <DynamicIcon name="user" size={20} className="text-white" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {authenticated && (
                  <>
                    {user?.contact && (
                      <>
                        <DropdownMenuLabel className="font-normal text-gray-500 truncate bg-gray-100 -mx-1 -mt-1 px-3 py-2 rounded-t-2xl border-b border-gray-300 mb-1">
                          {user.contact}
                        </DropdownMenuLabel>
                      </>
                    )}
                    <DropdownMenuItem asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-left border-none focus:border-none focus-visible:border-none hover:border-none font-normal"
                        onClick={handleLogout}
                      >
                        <span className="text-red-600 mr-2">
                          <DynamicIcon name={t('navigation.logoutIcon')} size={20} />
                        </span>
                        <span className="text-red-600">{t('navigation.logout')}</span>
                      </Button>
                    </DropdownMenuItem>
                  </>
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
            {t('footer.copyright') && (
              <div className="text-sm text-gray-400">{t('footer.copyright')}</div>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
