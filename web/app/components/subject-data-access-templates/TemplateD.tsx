import { useTranslation } from 'react-i18next';
import DynamicIcon from 'lucide-react/dist/esm/DynamicIcon.js';
import { useCardData } from '~/lib/use-card-data';
import { AccessPageHeader } from './AccessPageHeader';

export function TemplateD() {
  const { t } = useTranslation();
  const { data, loading } = useCardData();
  const values = data && 'values' in data ? data.values : null;
  const hasData = values !== null && Object.values(values).some(entries => entries.length > 0);

  // Format a single aggregated value for display (handles arrays and objects)
  const formatValue = (value: any): string => {
    if (typeof value === 'string') return value;

    if (Array.isArray(value)) return value.join(', ');

    if (typeof value === 'object' && value !== null) {
      // For address objects, format nicely
      if (value.street || value.city || value.region || value.code || value.country) {
        return [value.street, value.city, value.region, value.code, value.country]
          .filter(Boolean)
          .join(', ');
      }
      return JSON.stringify(value);
    }

    return String(value);
  };

  const formatValues = (entries: string[]) => {
    if (entries.length === 0) return '';
    if (entries.length === 1) return ` ("${entries[0]}")`;
    if (entries.length === 2) return ` ("${entries[0]}" and "${entries[1]}")`;

    const allButLast = entries
      .slice(0, -1)
      .map(v => `"${v}"`)
      .join(', ');
    const last = entries[entries.length - 1];
    return ` (${allButLast}, and "${last}")`;
  };

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

          {/* Field Values Summary */}
          {!loading && values && hasData && (
            <div className="space-y-4">
              <div className="text-gray-900 text-lg">
                {rows.map(row => {
                  const entries = (values[row.field] ?? []).map(formatValue);
                  return (
                    <div key={row.labelKey} className="mb-4 flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-brand-blue rounded-full flex-shrink-0">
                        <DynamicIcon name={row.icon} size={20} className="text-white" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-500 font-medium">{t(row.labelKey)}</div>
                        <div className="text-base text-gray-900 font-medium">
                          {entries.length === 1
                            ? t('access.cardCount', { count: entries.length })
                            : t('access.cardCountPlural', { count: entries.length })}
                          {formatValues(entries)}
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
