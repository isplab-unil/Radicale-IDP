import { getCurrentUser } from '~/lib/auth';
import { useCardData } from '~/lib/use-card-data';
import type { CardMatch } from '~/lib/card-types';

export function TemplateA() {
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
            <h1 className="text-5xl font-medium text-gray-900 mb-6">Data about you</h1>
            <p className="text-gray-500 text-lg leading-relaxed mb-6 max-w-4xl">
              See how your personal information is used in the contact provider system and how other
              users are storing your data. This transparency helps you make informed decisions about
              your Subject Data Preferences.
            </p>
          </div>

          {/* Field Counts Summary */}
          {!loading && cards.length > 0 && (
            <div className="space-y-4">
              <div className="text-gray-900 text-lg">
                <div className="mb-4">Pronoun: {fieldCounts.pronoun} contact cards</div>
                <div className="mb-4">Company: {fieldCounts.company} contact cards</div>
                <div className="mb-4">Job title: {fieldCounts.jobTitle} contact cards</div>
                <div className="mb-4">Photo: {fieldCounts.photo} contact cards</div>
                <div className="mb-4">
                  Birthday: {fieldCounts.birthday} contact card
                  {fieldCounts.birthday !== 1 ? 's' : ''}
                </div>
                <div className="mb-4">
                  Related person: {fieldCounts.relatedPerson} contact card
                  {fieldCounts.relatedPerson !== 1 ? 's' : ''}
                </div>
                <div className="mb-4">
                  Address: {fieldCounts.address} contact card{fieldCounts.address !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          )}

          {loading && <div className="text-gray-600">Loading cards...</div>}

          {!loading && cards.length === 0 && (
            <div className="text-gray-600">No contact records found.</div>
          )}

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
