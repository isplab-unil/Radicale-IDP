import { useTranslation } from 'react-i18next';
import DynamicIcon from 'lucide-react/dist/esm/DynamicIcon.js';
import { useCardData } from '~/lib/use-card-data';
import { AccessPageHeader } from './AccessPageHeader';

export function TemplateA() {
  const { t } = useTranslation();
  const { data, loading } = useCardData();
  const count = data && 'count' in data ? data.count : 0;

  return (
    <div className="pt-12 pb-30">
      <div className="container mx-auto max-w-8xl px-6">
        <div className="space-y-8">
          {/* Header */}
          <AccessPageHeader />

          {/* Result */}
          {loading ? (
            <div className="text-gray-600">{t('access.loading')}</div>
          ) : (
            <div className="text-gray-900 text-lg flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-brand-blue rounded-full flex-shrink-0">
                <DynamicIcon
                  name={count === 0 ? 'check' : 'circle-alert'}
                  size={20}
                  className="text-white"
                />
              </div>
              <span>
                {count === 0 ? t('access.templates.a.none') : t('access.templates.a.found')}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
