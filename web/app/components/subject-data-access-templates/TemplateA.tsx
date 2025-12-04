import { useTranslation } from 'react-i18next';
import { useCardData } from '~/lib/use-card-data';
import { getCurrentUser } from '~/lib/auth';

export function TemplateA() {
  const { t } = useTranslation();
  const { cards, loading, syncing, syncCards } = useCardData();
  const user = getCurrentUser();
  const contact = user?.contact || 'your account';

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

  return (
    <div className="pt-6 pb-30">
      <div className="container mx-auto max-w-8xl px-6">
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-5xl font-medium text-gray-900 mb-6">{t('access.title')}</h1>
            <p className="text-gray-500 text-lg leading-relaxed mb-6 max-w-4xl">
              {t('access.metaDescription', { contact })}
            </p>
          </div>

          {/* Field Counts Summary */}
          {!loading && cards.length > 0 && (
            <div className="space-y-4">
              <div className="text-gray-900 text-lg">
                <div className="mb-4">
                  {t('access.fields.name')}:{' '}
                  {fieldCounts.name === 1
                    ? t('access.cardCount', { count: fieldCounts.name })
                    : t('access.cardCountPlural', { count: fieldCounts.name })}
                </div>
                <div className="mb-4">
                  {t('access.fields.phone')}:{' '}
                  {fieldCounts.phone === 1
                    ? t('access.cardCount', { count: fieldCounts.phone })
                    : t('access.cardCountPlural', { count: fieldCounts.phone })}
                </div>
                <div className="mb-4">
                  {t('access.fields.email')}:{' '}
                  {fieldCounts.email === 1
                    ? t('access.cardCount', { count: fieldCounts.email })
                    : t('access.cardCountPlural', { count: fieldCounts.email })}
                </div>
                <div className="mb-4">
                  {t('access.fields.company')}:{' '}
                  {fieldCounts.company === 1
                    ? t('access.cardCount', { count: fieldCounts.company })
                    : t('access.cardCountPlural', { count: fieldCounts.company })}
                </div>
                <div className="mb-4">
                  {t('access.fields.jobTitle')}:{' '}
                  {fieldCounts.jobTitle === 1
                    ? t('access.cardCount', { count: fieldCounts.jobTitle })
                    : t('access.cardCountPlural', { count: fieldCounts.jobTitle })}
                </div>
                <div className="mb-4">
                  {t('access.fields.photo')}:{' '}
                  {fieldCounts.photo === 1
                    ? t('access.cardCount', { count: fieldCounts.photo })
                    : t('access.cardCountPlural', { count: fieldCounts.photo })}
                </div>
                <div className="mb-4">
                  {t('access.fields.nickname')}:{' '}
                  {fieldCounts.nickname === 1
                    ? t('access.cardCount', { count: fieldCounts.nickname })
                    : t('access.cardCountPlural', { count: fieldCounts.nickname })}
                </div>
                <div className="mb-4">
                  {t('access.fields.birthday')}:{' '}
                  {fieldCounts.birthday === 1
                    ? t('access.cardCount', { count: fieldCounts.birthday })
                    : t('access.cardCountPlural', { count: fieldCounts.birthday })}
                </div>
                <div className="mb-4">
                  {t('access.fields.pronoun')}:{' '}
                  {fieldCounts.pronoun === 1
                    ? t('access.cardCount', { count: fieldCounts.pronoun })
                    : t('access.cardCountPlural', { count: fieldCounts.pronoun })}
                </div>
                <div className="mb-4">
                  {t('access.fields.related')}:{' '}
                  {fieldCounts.related === 1
                    ? t('access.cardCount', { count: fieldCounts.related })
                    : t('access.cardCountPlural', { count: fieldCounts.related })}
                </div>
                <div className="mb-4">
                  {t('access.fields.address')}:{' '}
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
