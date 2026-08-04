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
import { AppSidebar } from './app-sidebar';

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
                className="dark:invert"
                style={{ width: '82px', height: '31px', marginTop: '-1px' }}
              />
              {subtitle && (
                <span className="text-brand-blue dark:text-[#2c71e2] text-xl font-bold hidden sm:block">
                  {subtitle}
                </span>
              )}
            </button>

            {/* Dropdown Navigation */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  aria-label={t('navigation.menuLabel')}
                  className="group flex items-center justify-center w-10 h-10 rounded-[8px] hover:bg-[#dedede] data-[state=open]:bg-[#dedede] dark:hover:bg-[#3a3a3c] dark:data-[state=open]:bg-[#3a3a3c] transition-colors cursor-pointer"
                >
                  <DynamicIcon
                    name="circle-user-round"
                    size={28}
                    className="text-gray-500 dark:text-gray-400 group-hover:text-white group-data-[state=open]:text-white"
                  />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 dark:bg-[#1c1c1e]">
                {authenticated && (
                  <>
                    {user?.contact && (
                      <>
                        <DropdownMenuLabel className="font-normal text-gray-500 dark:text-gray-400 truncate bg-gray-100 dark:bg-[#38383c] -mx-1 -mt-1 px-3 py-2 rounded-t-2xl border-b border-gray-300 dark:border-[#3a3a3c] mb-1">
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

      {/* Sidebar + main content */}
      <div className="flex flex-1">
        <ProtectedRoute>
          <AppSidebar />
          <main className="flex-1 min-w-0">
            <Outlet />
          </main>
        </ProtectedRoute>
      </div>
    </div>
  );
}
