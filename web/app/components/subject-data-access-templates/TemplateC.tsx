import { useTranslation } from 'react-i18next';
import DynamicIcon from 'lucide-react/dist/esm/DynamicIcon.js';
import { useCardData } from '~/lib/use-card-data';
import { AccessPageHeader } from './AccessPageHeader';

export function TemplateC() {
  const { t } = useTranslation();
  const { data, loading } = useCardData();
  const counts = data && 'counts' in data ? data.counts : null;
  const hasData = counts !== null && Object.values(counts).some(count => count > 0);

  const rows = [
    { labelKey: 'access.fields.name', icon: 'user', field: 'fn' },
    { labelKey: 'access.fields.phone', icon: t('access.mobileIcon'), field: 'tel' },
    { labelKey: 'access.fields.email', icon: t('access.emailIcon'), field: 'email' },
    { labelKey: 'access.fields.company', icon: 'building-2', field: 'org' },
    { labelKey: 'access.fields.jobTitle', icon: 'briefcase', field: 'title' },
    { labelKey: 'access.fields.photo', icon: 'image', field: 'photo' },
    { labelKey: 'access.fields.nickname', icon: 'at-sign', field: 'nickname' },
    { labelKey: 'access.fields.birthday', icon: 'cake', field: 'bday' },
    { labelKey: 'access.fields.pronoun', icon: 'user-round', field: 'gender' },
    { labelKey: 'access.fields.related', icon: t('access.spouseIcon'), field: 'related' },
    { labelKey: 'access.fields.address', icon: 'map-pin', field: 'adr' },
  ];

  return (
    <div className="pt-12 pb-30">
      <div className="container mx-auto max-w-8xl px-6">
        <div className="space-y-8">
          {/* Header */}
          <AccessPageHeader />

          {/* Field Counts Summary */}
          {!loading && counts && hasData && (
            <div className="space-y-4">
              <div className="text-gray-900 text-lg">
                {rows.map(row => {
                  const count = counts[row.field] ?? 0;
                  return (
                    <div key={row.labelKey} className="mb-4 flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-brand-blue rounded-full flex-shrink-0">
                        <DynamicIcon name={row.icon} size={20} className="text-white" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-500 font-medium">{t(row.labelKey)}</div>
                        <div className="text-base text-gray-900 font-medium">
                          {count === 1
                            ? t('access.cardCount', { count })
                            : t('access.cardCountPlural', { count })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {loading && <div className="text-gray-600">{t('access.loading')}</div>}

          {!loading && !hasData && <div className="text-gray-600">{t('access.noRecords')}</div>}
        </div>
      </div>
    </div>
  );
}
