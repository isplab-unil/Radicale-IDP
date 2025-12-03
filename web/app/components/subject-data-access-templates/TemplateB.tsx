import { useTranslation } from 'react-i18next';
import { useCardData } from '~/lib/use-card-data';

export function TemplateB() {
  const { t } = useTranslation();
  const { cards, loading, syncing, syncCards } = useCardData();

  // Calculate field counts and collect values across all cards
  const fieldData = {
    pronoun: [] as string[],
    company: [] as string[],
    jobTitle: [] as string[],
    photo: [] as string[],
    birthday: [] as string[],
    relatedPerson: [] as string[],
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

    const gender = getFieldValue(contact.fields.gender);
    if (gender) fieldData.pronoun.push(gender);

    const org = getFieldValue(contact.fields.org);
    if (org) fieldData.company.push(org);

    const title = getFieldValue(contact.fields.title);
    if (title) fieldData.jobTitle.push(title);

    if (contact.fields.photo) fieldData.photo.push('Photo');

    const bday = getFieldValue(contact.fields.bday);
    if (bday) fieldData.birthday.push(bday);

    const related = getFieldValue(contact.fields.related);
    if (related) fieldData.relatedPerson.push(related);

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

  return (
    <div className="pt-6 pb-30">
      <div className="container mx-auto max-w-8xl px-6">
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-5xl font-medium text-gray-900 mb-6">{t('access.title')}</h1>
            <p className="text-gray-500 text-lg leading-relaxed mb-6 max-w-4xl">
              {t('access.description')}
            </p>
          </div>

          {/* Field Counts Summary */}
          {!loading && cards.length > 0 && (
            <div className="space-y-4">
              <div className="text-gray-900 text-lg">
                <div className="mb-4">
                  {t('access.fields.pronoun')}: {fieldData.pronoun.length}{' '}
                  {fieldData.pronoun.length === 1
                    ? t('access.cardCount', { count: fieldData.pronoun.length })
                    : t('access.cardCountPlural', { count: fieldData.pronoun.length })}
                  {formatValues(fieldData.pronoun)}
                </div>
                <div className="mb-4">
                  {t('access.fields.company')}: {fieldData.company.length}{' '}
                  {fieldData.company.length === 1
                    ? t('access.cardCount', { count: fieldData.company.length })
                    : t('access.cardCountPlural', { count: fieldData.company.length })}
                  {formatValues(fieldData.company)}
                </div>
                <div className="mb-4">
                  {t('access.fields.jobTitle')}: {fieldData.jobTitle.length}{' '}
                  {fieldData.jobTitle.length === 1
                    ? t('access.cardCount', { count: fieldData.jobTitle.length })
                    : t('access.cardCountPlural', { count: fieldData.jobTitle.length })}
                  {formatValues(fieldData.jobTitle)}
                </div>
                <div className="mb-4">
                  {t('access.fields.photo')}: {fieldData.photo.length}{' '}
                  {fieldData.photo.length === 1
                    ? t('access.cardCount', { count: fieldData.photo.length })
                    : t('access.cardCountPlural', { count: fieldData.photo.length })}
                  {formatValues(fieldData.photo)}
                </div>
                <div className="mb-4">
                  {t('access.fields.birthday')}: {fieldData.birthday.length}{' '}
                  {fieldData.birthday.length === 1
                    ? t('access.cardCount', { count: fieldData.birthday.length })
                    : t('access.cardCountPlural', { count: fieldData.birthday.length })}
                  {formatValues(fieldData.birthday)}
                </div>
                <div className="mb-4">
                  {t('access.fields.relatedPerson')}: {fieldData.relatedPerson.length}{' '}
                  {fieldData.relatedPerson.length === 1
                    ? t('access.cardCount', { count: fieldData.relatedPerson.length })
                    : t('access.cardCountPlural', { count: fieldData.relatedPerson.length })}
                  {formatValues(fieldData.relatedPerson)}
                </div>
                <div className="mb-4">
                  {t('access.fields.address')}: {fieldData.address.length}{' '}
                  {fieldData.address.length === 1
                    ? t('access.cardCount', { count: fieldData.address.length })
                    : t('access.cardCountPlural', { count: fieldData.address.length })}
                  {formatValues(fieldData.address)}
                </div>
              </div>
            </div>
          )}

          {loading && <div className="text-gray-600">{t('access.loading')}</div>}

          {!loading && cards.length === 0 && (
            <div className="text-gray-600">{t('access.noRecords')}</div>
          )}

          {/* Contact Provider Synchronization */}
          <div className="bg-gray-100 p-6 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {t('access.providerStatus')}
                </h3>
                <p className="text-sm text-gray-600">{t('access.providerDescription')}</p>
              </div>
              <button
                onClick={syncCards}
                disabled={syncing}
                className="px-6 py-3 rounded-lg font-medium text-sm transition-colors bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {syncing ? t('access.buttonSyncing') : t('access.buttonSync')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
