import { useTranslation } from 'react-i18next';
import DynamicIcon from 'lucide-react/dist/esm/DynamicIcon.js';
import { useCardData } from '~/lib/use-card-data';
import { AccessPageHeader } from './AccessPageHeader';

export function TemplateA() {
  const { t } = useTranslation();
  const { data, loading } = useCardData();
  const found = data && 'found' in data ? data.found : false;

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
                  name={found ? 'circle-alert' : 'check'}
                  size={20}
                  className="text-white"
                />
              </div>
              <span>
                {found ? t('access.templates.a.found') : t('access.templates.a.none')}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
