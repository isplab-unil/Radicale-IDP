import { useTranslation } from 'react-i18next';
import DynamicIcon from 'lucide-react/dist/esm/DynamicIcon.js';
import { useCardData } from '~/lib/use-card-data';
import { AccessPageHeader } from './AccessPageHeader';

export function TemplateD() {
  const { t } = useTranslation();
  const { cards, loading } = useCardData();

  // Calculate field counts and collect values across all cards
  const fieldData = {
    name: [] as string[],
    phone: [] as string[],
    email: [] as string[],
    company: [] as string[],
    jobTitle: [] as string[],
    photo: [] as string[],
    nickname: [] as string[],
    birthday: [] as string[],
    pronoun: [] as string[],
    related: [] as string[],
    address: [] as string[],
  };

  cards.forEach(contact => {
    // Helper to extract string value from field (handles arrays and objects)
    const getFieldValue = (field: any): string | null => {
      if (!field) return null;

      if (typeof field === 'string') return field;

      if (Array.isArray(field)) return field.join(', ');

      if (typeof field === 'object') {
        // For address objects, format nicely
        if (field.street || field.city || field.region || field.code || field.country) {
          return [field.street, field.city, field.region, field.code, field.country]
            .filter(Boolean)
            .join(', ');
        }
        return JSON.stringify(field);
      }

      return String(field);
    };

    const fn = getFieldValue(contact.fields.fn);
    if (fn) fieldData.name.push(fn);

    const tel = getFieldValue(contact.fields.tel);
    if (tel) fieldData.phone.push(tel);

    const email = getFieldValue(contact.fields.email);
    if (email) fieldData.email.push(email);

    const org = getFieldValue(contact.fields.org);
    if (org) fieldData.company.push(org);

    const title = getFieldValue(contact.fields.title);
    if (title) fieldData.jobTitle.push(title);

    if (contact.fields.photo) fieldData.photo.push('Photo');

    const nickname = getFieldValue(contact.fields.nickname);
    if (nickname) fieldData.nickname.push(nickname);

    const bday = getFieldValue(contact.fields.bday);
    if (bday) fieldData.birthday.push(bday);

    const gender = getFieldValue(contact.fields.gender);
    if (gender) fieldData.pronoun.push(gender);

    const related = getFieldValue(contact.fields.related);
    if (related) fieldData.related.push(related);

    const adr = getFieldValue(contact.fields.adr);
    if (adr) fieldData.address.push(adr);
  });

  const formatValues = (values: string[]) => {
    if (values.length === 0) return '';
    if (values.length === 1) return ` ("${values[0]}")`;
    if (values.length === 2) return ` ("${values[0]}" and "${values[1]}")`;

    const allButLast = values
      .slice(0, -1)
      .map(v => `"${v}"`)
      .join(', ');
    const last = values[values.length - 1];
    return ` (${allButLast}, and "${last}")`;
  };

  const rows = [
    { labelKey: 'access.fields.name', icon: 'user', values: fieldData.name },
    { labelKey: 'access.fields.phone', icon: t('access.mobileIcon'), values: fieldData.phone },
    { labelKey: 'access.fields.email', icon: t('access.emailIcon'), values: fieldData.email },
    { labelKey: 'access.fields.company', icon: 'building-2', values: fieldData.company },
    { labelKey: 'access.fields.jobTitle', icon: 'briefcase', values: fieldData.jobTitle },
    { labelKey: 'access.fields.photo', icon: 'image', values: fieldData.photo },
    { labelKey: 'access.fields.nickname', icon: 'at-sign', values: fieldData.nickname },
    { labelKey: 'access.fields.birthday', icon: 'cake', values: fieldData.birthday },
    { labelKey: 'access.fields.pronoun', icon: 'user-round', values: fieldData.pronoun },
    { labelKey: 'access.fields.related', icon: t('access.spouseIcon'), values: fieldData.related },
    { labelKey: 'access.fields.address', icon: 'map-pin', values: fieldData.address },
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
                        {row.values.length === 1
                          ? t('access.cardCount', { count: row.values.length })
                          : t('access.cardCountPlural', { count: row.values.length })}
                        {formatValues(row.values)}
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
