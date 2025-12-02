import { Phone, Mail, Users, UserIcon } from 'lucide-react';
import { useCardData } from '~/lib/use-card-data';
import type { CardMatch } from '~/lib/card-types';

function ContactCard({ contact }: { contact: CardMatch }) {
  // Extract email from collection_path (format: email/uuid)
  const email = contact.collection_path.split('/')[0];

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-300">
      {/* From Section */}
      <div className="px-6 py-2 bg-blue-600">
        <div className="text-sm text-white font-medium">From: {email}</div>
      </div>

      {/* Header Info */}
      <div className="p-6">
        <div className="flex items-start gap-6">
          {/* Large Contact Icon */}
          <div className="flex items-center justify-center w-16 h-16 bg-gray-300 rounded-full flex-shrink-0 mt-4">
            <UserIcon className="size-8 text-white" />
          </div>

          {/* Contact Details */}
          <div className="flex-1">
            <div className="text-sm text-gray-500 mb-2 font-medium tracking-wide">
              {contact.fields.org || ''}
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-1">
              {contact.fields.fn || contact.fields.n || 'Unknown'}
            </h3>
            {contact.fields.title && (
              <div className="text-base text-gray-600 font-medium">{contact.fields.title}</div>
            )}
            {contact.fields.nickname && (
              <div className="text-base text-gray-600 font-medium mt-1">
                &quot;{contact.fields.nickname}&quot;
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contact Details */}
      <div className="px-6 pb-6 space-y-4">
        {contact.fields.tel && (
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-full ml-4 mr-4">
              <Phone className="size-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="text-sm text-gray-500 font-medium">Mobile</div>
              <div className="text-base text-gray-900 font-medium">
                {Array.isArray(contact.fields.tel)
                  ? contact.fields.tel.join(', ')
                  : contact.fields.tel}
              </div>
            </div>
          </div>
        )}

        {contact.fields.email && (
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-full ml-4 mr-4">
              <Mail className="size-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="text-sm text-gray-500 font-medium">Email</div>
              <div className="text-base text-gray-900 font-medium">
                {Array.isArray(contact.fields.email)
                  ? contact.fields.email.join(', ')
                  : contact.fields.email}
              </div>
            </div>
          </div>
        )}

        {contact.fields.related && (
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-full ml-4 mr-4">
              <Users className="size-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="text-sm text-gray-500 font-medium">Spouse</div>
              <div className="text-base text-gray-900 font-medium">
                {Array.isArray(contact.fields.related)
                  ? contact.fields.related.join(', ')
                  : contact.fields.related}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function TemplateD() {
  const { cards, loading, syncing, syncCards } = useCardData();

  return (
    <div className="py-30">
      <div className="container mx-auto max-w-8xl px-6">
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-5xl font-medium text-gray-900 mb-6">Data about you</h1>
            <p className="text-gray-500 text-lg leading-relaxed mb-6 max-w-4xl">
              See how your personal information is used in the contact provider system and how other
              users are storing your data. This transparency helps you make informed decisions about
              your Subject Data Preferences.
            </p>
          </div>

          {/* Contact Cards */}
          <div className="space-y-6">
            <h2 className="text-2xl font-medium text-gray-900">Contact Records</h2>
            {loading ? (
              <div className="text-gray-600">Loading cards...</div>
            ) : cards.length === 0 ? (
              <div className="text-gray-600">No contact records found.</div>
            ) : (
              cards.map(contact => (
                <ContactCard
                  key={`${contact.collection_path}-${contact.vcard_uid}`}
                  contact={contact}
                />
              ))
            )}
          </div>

          {/* Contact Provider Synchronization */}
          <div className="bg-gray-100 p-6 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Contact Provider Status</h3>
                <p className="text-sm text-gray-600">
                  Synchronize with the contact provider to refresh the data shown on this page and
                  ensure you see the most current information about how your data is being used.
                </p>
              </div>
              <button
                onClick={syncCards}
                disabled={syncing}
                className="px-6 py-3 rounded-lg font-medium text-sm transition-colors bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {syncing ? 'Synchronizing...' : 'Synchronize Contact Provider'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
