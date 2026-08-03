import { useTranslation } from 'react-i18next';
import DynamicIcon from 'lucide-react/dist/esm/DynamicIcon.js';
import { useCardData } from '~/lib/use-card-data';
import { AccessPageHeader } from './AccessPageHeader';

export function TemplateC() {
  const { t } = useTranslation();
  const { cards, loading } = useCardData();

  // Calculate field counts across all cards
  const fieldCounts = {
    name: 0,
    phone: 0,
    email: 0,
    company: 0,
    jobTitle: 0,
    photo: 0,
    nickname: 0,
    birthday: 0,
    pronoun: 0,
    related: 0,
    address: 0,
  };

  cards.forEach(contact => {
    if (contact.fields.fn) fieldCounts.name++;
    if (contact.fields.tel) fieldCounts.phone++;
    if (contact.fields.email) fieldCounts.email++;
    if (contact.fields.org) fieldCounts.company++;
    if (contact.fields.title) fieldCounts.jobTitle++;
    if (contact.fields.photo) fieldCounts.photo++;
    if (contact.fields.nickname) fieldCounts.nickname++;
    if (contact.fields.bday) fieldCounts.birthday++;
    if (contact.fields.gender) fieldCounts.pronoun++;
    if (contact.fields.related) fieldCounts.related++;
    if (contact.fields.adr) fieldCounts.address++;
  });

  const rows = [
    { labelKey: 'access.fields.name', icon: 'user', count: fieldCounts.name },
    { labelKey: 'access.fields.phone', icon: t('access.mobileIcon'), count: fieldCounts.phone },
    { labelKey: 'access.fields.email', icon: t('access.emailIcon'), count: fieldCounts.email },
    { labelKey: 'access.fields.company', icon: 'building-2', count: fieldCounts.company },
    { labelKey: 'access.fields.jobTitle', icon: 'briefcase', count: fieldCounts.jobTitle },
    { labelKey: 'access.fields.photo', icon: 'image', count: fieldCounts.photo },
    { labelKey: 'access.fields.nickname', icon: 'at-sign', count: fieldCounts.nickname },
    { labelKey: 'access.fields.birthday', icon: 'cake', count: fieldCounts.birthday },
    { labelKey: 'access.fields.pronoun', icon: 'user-round', count: fieldCounts.pronoun },
    { labelKey: 'access.fields.related', icon: t('access.spouseIcon'), count: fieldCounts.related },
    { labelKey: 'access.fields.address', icon: 'map-pin', count: fieldCounts.address },
  ];

  return (
    <div className="pt-6 pb-30">
      <div className="container mx-auto max-w-8xl px-6">
        <div className="space-y-8">
          {/* Header */}
          <AccessPageHeader />

          {/* Field Counts Summary */}
          {!loading && cards.length > 0 && (
            <div className="space-y-4">
              <div className="text-gray-900 text-lg">
                {rows.map(row => (
                  <div key={row.labelKey} className="mb-4 flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-brand-blue rounded-full flex-shrink-0">
                      <DynamicIcon name={row.icon} size={20} className="text-white" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 font-medium">{t(row.labelKey)}</div>
                      <div className="text-base text-gray-900 font-medium">
                        {row.count === 1
                          ? t('access.cardCount', { count: row.count })
                          : t('access.cardCountPlural', { count: row.count })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {loading && <div className="text-gray-600">{t('access.loading')}</div>}

          {!loading && cards.length === 0 && (
            <div className="text-gray-600">{t('access.noRecords')}</div>
          )}
        </div>
      </div>
    </div>
  );
}
