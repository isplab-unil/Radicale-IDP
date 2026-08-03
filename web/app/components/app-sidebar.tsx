import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import DynamicIcon from 'lucide-react/dist/esm/DynamicIcon.js';
import { useLocation } from 'react-router';
import { LinkWithTemplate } from '~/lib/template-context';
import { syncContactProvider } from '~/lib/use-card-data';
import { cn } from '~/lib/utils';

const NAV_ITEMS = [
  {
    to: '/subject-data-preferences',
    translationKey: 'tabs.dataPreferences',
    icon: 'sliders-horizontal',
  },
  { to: '/subject-data-access', translationKey: 'tabs.dataAccess', icon: 'eye' },
];

/**
 * iCloud-style left sidebar: action icons at the top (provider sync),
 * navigation items below. Collapses to an icon-only strip on narrow
 * screens.
 */
export function AppSidebar() {
  const { t } = useTranslation();
  const location = useLocation();
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    await syncContactProvider();
    setSyncing(false);
  };

  return (
    <aside className="w-16 md:w-64 bg-[#fbfbfd] flex flex-col flex-shrink-0 py-4">
      {/* Action icons */}
      <div className="flex items-center justify-end gap-2 px-3 pb-4">
        <button
          onClick={handleSync}
          disabled={syncing}
          aria-label={t('access.buttonSync')}
          title={t('access.buttonSync')}
          className="flex items-center justify-center w-9 h-9 rounded-full text-brand-blue hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <DynamicIcon
            name="refresh-cw"
            size={18}
            className={syncing ? 'animate-spin' : undefined}
          />
        </button>
      </div>

      {/* Navigation items */}
      <nav aria-label={t('tabs.navigationLabel')} className="flex flex-col gap-1 px-2">
        {NAV_ITEMS.map(item => {
          const isActive = location.pathname === item.to;

          return (
            <LinkWithTemplate
              key={item.to}
              to={item.to}
              aria-current={isActive ? 'page' : undefined}
              title={t(item.translationKey)}
              className={cn(
                'flex items-center justify-center md:justify-start gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isActive ? 'bg-brand-blue text-white' : 'text-gray-600 hover:bg-gray-200'
              )}
            >
              <DynamicIcon
                name={item.icon}
                size={18}
                className={cn('flex-shrink-0', !isActive && 'text-brand-blue')}
              />
              <span className="hidden md:block truncate">{t(item.translationKey)}</span>
            </LinkWithTemplate>
          );
        })}
      </nav>
    </aside>
  );
}
