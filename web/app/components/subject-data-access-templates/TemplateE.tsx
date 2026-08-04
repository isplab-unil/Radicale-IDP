import { useTranslation } from 'react-i18next';
import DynamicIcon from 'lucide-react/dist/esm/DynamicIcon.js';
import { useCardData } from '~/lib/use-card-data';
import { getPhotoSrc, type ShapedCardMatch } from '~/lib/card-types';
import { AccessPageHeader } from './AccessPageHeader';

function ContactCard({ contact, t }: { contact: ShapedCardMatch; t: any }) {
  const photoSrc = getPhotoSrc(contact.fields.photo);
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-300">
      {/* Header Info */}
      <div className="p-6">
        <div className="flex items-start gap-6">
          {/* Large Contact Photo or Icon */}
          {photoSrc ? (
            <img
              src={photoSrc}
              alt="Contact"
              className="w-16 h-16 rounded-full flex-shrink-0 mt-4 object-cover"
            />
          ) : (
            <div className="flex items-center justify-center w-16 h-16 rounded-full flex-shrink-0 mt-4">
              <DynamicIcon name="circle-user-round" size={64} className="text-gray-300" />
            </div>
          )}

          {/* Contact Details */}
          <div className="flex-1">
            <div className="text-sm text-gray-500 mb-2 font-medium tracking-wide">
              {contact.fields.org || ''}
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-1">
              {contact.fields.fn || contact.fields.n || t('access.unknownContact')}
            </h3>
            {contact.fields.nickname && (
              <div className="text-base text-gray-600 font-bold mt-1">
                «{contact.fields.nickname}»
              </div>
            )}
            {contact.fields.title && (
              <div className="text-base text-gray-600 font-medium">{contact.fields.title}</div>
            )}
          </div>
        </div>
      </div>

      {/* Contact Details */}
      <div className="px-6 pb-6">
        {contact.fields.tel && (
          <div className="group flex items-center gap-4 pt-4">
            <div className="flex items-center justify-center w-10 h-10 bg-brand-blue rounded-full ml-4 mr-4">
              <DynamicIcon name={t('access.mobileIcon')} size={20} className="text-white" />
            </div>
            <div className="w-1/3 border-b border-gray-200 pb-4 group-last:border-b-0 group-last:pb-0">
              <div className="text-sm text-gray-500 font-medium">{t('access.mobile')}</div>
              <div className="text-base text-gray-900 font-medium">
                {Array.isArray(contact.fields.tel)
                  ? contact.fields.tel.join(', ')
                  : contact.fields.tel}
              </div>
            </div>
          </div>
        )}

        {contact.fields.email && (
          <div className="group flex items-center gap-4 pt-4">
            <div className="flex items-center justify-center w-10 h-10 bg-brand-blue rounded-full ml-4 mr-4">
              <DynamicIcon name={t('access.emailIcon')} size={20} className="text-white" />
            </div>
            <div className="w-1/3 border-b border-gray-200 pb-4 group-last:border-b-0 group-last:pb-0">
              <div className="text-sm text-gray-500 font-medium">{t('access.email')}</div>
              <div className="text-base text-gray-900 font-medium">
                {Array.isArray(contact.fields.email)
                  ? contact.fields.email.join(', ')
                  : contact.fields.email}
              </div>
            </div>
          </div>
        )}

        {contact.fields.bday && (
          <div className="group flex items-center gap-4 pt-4">
            <div className="flex items-center justify-center w-10 h-10 bg-brand-blue rounded-full ml-4 mr-4">
              <DynamicIcon name="cake" size={20} className="text-white" />
            </div>
            <div className="w-1/3 border-b border-gray-200 pb-4 group-last:border-b-0 group-last:pb-0">
              <div className="text-sm text-gray-500 font-medium">{t('access.fields.birthday')}</div>
              <div className="text-base text-gray-900 font-medium">{contact.fields.bday}</div>
            </div>
          </div>
        )}

        {contact.fields.gender && (
          <div className="group flex items-center gap-4 pt-4">
            <div className="flex items-center justify-center w-10 h-10 bg-brand-blue rounded-full ml-4 mr-4">
              <DynamicIcon name="user-round" size={20} className="text-white" />
            </div>
            <div className="w-1/3 border-b border-gray-200 pb-4 group-last:border-b-0 group-last:pb-0">
              <div className="text-sm text-gray-500 font-medium">{t('access.fields.pronoun')}</div>
              <div className="text-base text-gray-900 font-medium">{contact.fields.gender}</div>
            </div>
          </div>
        )}

        {contact.fields.related && (
          <div className="group flex items-center gap-4 pt-4">
            <div className="flex items-center justify-center w-10 h-10 bg-brand-blue rounded-full ml-4 mr-4">
              <DynamicIcon name={t('access.spouseIcon')} size={20} className="text-white" />
            </div>
            <div className="w-1/3 border-b border-gray-200 pb-4 group-last:border-b-0 group-last:pb-0">
              <div className="text-sm text-gray-500 font-medium">{t('access.spouse')}</div>
              <div className="text-base text-gray-900 font-medium">
                {Array.isArray(contact.fields.related)
                  ? contact.fields.related.join(', ')
                  : contact.fields.related}
              </div>
            </div>
          </div>
        )}

        {contact.fields.adr && (
          <div className="group flex items-center gap-4 pt-4">
            <div className="flex items-center justify-center w-10 h-10 bg-brand-blue rounded-full ml-4 mr-4">
              <DynamicIcon name="map-pin" size={20} className="text-white" />
            </div>
            <div className="w-1/3 border-b border-gray-200 pb-4 group-last:border-b-0 group-last:pb-0">
              <div className="text-sm text-gray-500 font-medium">{t('access.fields.address')}</div>
              <div className="text-base text-gray-900 font-medium">
                {typeof contact.fields.adr === 'object' && contact.fields.adr !== null
                  ? [
                      contact.fields.adr.street,
                      contact.fields.adr.city,
                      contact.fields.adr.region,
                      contact.fields.adr.code,
                      contact.fields.adr.country,
                    ]
                      .filter(Boolean)
                      .join(', ')
                  : Array.isArray(contact.fields.adr)
                    ? contact.fields.adr.join(', ')
                    : contact.fields.adr}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function TemplateE() {
  const { t } = useTranslation();
  const { data, loading } = useCardData();
  const cards = data && 'matches' in data ? data.matches : [];

  return (
    <div className="pt-12 pb-30">
      <div className="container mx-auto max-w-8xl px-6">
        <div className="space-y-8">
          {/* Header */}
          <AccessPageHeader />

          {/* Contact Cards */}
          <div className="space-y-6">
            <h2 className="text-2xl font-medium text-gray-900">{t('access.contactRecords')}</h2>
            {loading ? (
              <div className="text-gray-600">{t('access.loading')}</div>
            ) : cards.length === 0 ? (
              <div className="text-gray-600">{t('access.noRecords')}</div>
            ) : (
              cards.map((contact, index) => <ContactCard key={index} contact={contact} t={t} />)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
