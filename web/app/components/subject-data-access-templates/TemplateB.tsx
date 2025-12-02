import { getCurrentUser } from '~/lib/auth';
import { useCardData } from '~/lib/use-card-data';
import type { CardMatch } from '~/lib/card-types';

export function TemplateB() {
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
                <div className="mb-4">
                  Pronoun: {fieldData.pronoun.length} contact cards{formatValues(fieldData.pronoun)}
                </div>
                <div className="mb-4">
                  Company: {fieldData.company.length} contact cards{formatValues(fieldData.company)}
                </div>
                <div className="mb-4">
                  Job title: {fieldData.jobTitle.length} contact cards
                  {formatValues(fieldData.jobTitle)}
                </div>
                <div className="mb-4">
                  Photo: {fieldData.photo.length} contact cards{formatValues(fieldData.photo)}
                </div>
                <div className="mb-4">
                  Birthday: {fieldData.birthday.length} contact card
                  {fieldData.birthday.length !== 1 ? 's' : ''}
                  {formatValues(fieldData.birthday)}
                </div>
                <div className="mb-4">
                  Related person: {fieldData.relatedPerson.length} contact card
                  {fieldData.relatedPerson.length !== 1 ? 's' : ''}
                  {formatValues(fieldData.relatedPerson)}
                </div>
                <div className="mb-4">
                  Address: {fieldData.address.length} contact card
                  {fieldData.address.length !== 1 ? 's' : ''}
                  {formatValues(fieldData.address)}
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
