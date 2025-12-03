import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router';
import { LinkWithTemplate } from '~/lib/template-context';
import { cn } from '~/lib/utils';

interface Tab {
  to: string;
  translationKey: string;
}

interface PageTabsProps {
  tabs: Tab[];
  className?: string;
}

export function PageTabs({ tabs, className }: PageTabsProps) {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <div className={cn('py-8', className)}>
      <div className="container mx-auto max-w-8xl px-6">
        <div className="border-b border-gray-200">
          <div className="overflow-x-auto -mx-6 px-6 md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <nav
              className="flex gap-8 min-w-max"
              role="navigation"
              aria-label={t('tabs.navigationLabel')}
            >
            {tabs.map((tab) => {
              const isActive = location.pathname === tab.to;

              return (
                <LinkWithTemplate
                  key={tab.to}
                  to={tab.to}
                  className={cn(
                    'inline-flex items-center px-6 py-4 text-lg font-medium leading-relaxed',
                    'border-b-2 -mb-px transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    isActive
                      ? 'border-blue-600 text-foreground'
                      : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-300'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {t(tab.translationKey)}
                </LinkWithTemplate>
              );
            })}
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}
