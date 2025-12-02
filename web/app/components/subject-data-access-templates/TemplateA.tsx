import { useTranslation } from 'react-i18next';
import { getCurrentUser } from '~/lib/auth';
import { useCardData } from '~/lib/use-card-data';
import type { CardMatch } from '~/lib/card-types';

export function TemplateA() {
  const { t } = useTranslation();
  const { cards, loading, syncing, syncCards } = useCardData();

  // Calculate field counts across all cards
  const fieldCounts = {
    pronoun: 0,
    company: 0,
    jobTitle: 0,
    photo: 0,
    birthday: 0,
    relatedPerson: 0,
    address: 0,
  };

  cards.forEach(contact => {
    if (contact.fields.gender) fieldCounts.pronoun++;
    if (contact.fields.org) fieldCounts.company++;
    if (contact.fields.title) fieldCounts.jobTitle++;
    if (contact.fields.photo) fieldCounts.photo++;
    if (contact.fields.bday) fieldCounts.birthday++;
    if (contact.fields.related) fieldCounts.relatedPerson++;
    if (contact.fields.adr) fieldCounts.address++;
  });

  const user = getCurrentUser();
  const isPhoneContact = user?.contact && !user.contact.includes('@');
  const contactLabel = isPhoneContact ? 'phone number' : 'email address';

  return (
    <div className="py-30">
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
                  {t('access.fields.pronoun')}: {fieldCounts.pronoun}{' '}
                  {fieldCounts.pronoun === 1
                    ? t('access.cardCount', { count: fieldCounts.pronoun })
                    : t('access.cardCountPlural', { count: fieldCounts.pronoun })}
                </div>
                <div className="mb-4">
                  {t('access.fields.company')}: {fieldCounts.company}{' '}
                  {fieldCounts.company === 1
                    ? t('access.cardCount', { count: fieldCounts.company })
                    : t('access.cardCountPlural', { count: fieldCounts.company })}
                </div>
                <div className="mb-4">
                  {t('access.fields.jobTitle')}: {fieldCounts.jobTitle}{' '}
                  {fieldCounts.jobTitle === 1
                    ? t('access.cardCount', { count: fieldCounts.jobTitle })
                    : t('access.cardCountPlural', { count: fieldCounts.jobTitle })}
                </div>
                <div className="mb-4">
                  {t('access.fields.photo')}: {fieldCounts.photo}{' '}
                  {fieldCounts.photo === 1
                    ? t('access.cardCount', { count: fieldCounts.photo })
                    : t('access.cardCountPlural', { count: fieldCounts.photo })}
                </div>
                <div className="mb-4">
                  {t('access.fields.birthday')}: {fieldCounts.birthday}{' '}
                  {fieldCounts.birthday === 1
                    ? t('access.cardCount', { count: fieldCounts.birthday })
                    : t('access.cardCountPlural', { count: fieldCounts.birthday })}
                </div>
                <div className="mb-4">
                  {t('access.fields.relatedPerson')}: {fieldCounts.relatedPerson}{' '}
                  {fieldCounts.relatedPerson === 1
                    ? t('access.cardCount', { count: fieldCounts.relatedPerson })
                    : t('access.cardCountPlural', { count: fieldCounts.relatedPerson })}
                </div>
                <div className="mb-4">
                  {t('access.fields.address')}: {fieldCounts.address}{' '}
                  {fieldCounts.address === 1
                    ? t('access.cardCount', { count: fieldCounts.address })
                    : t('access.cardCountPlural', { count: fieldCounts.address })}
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
