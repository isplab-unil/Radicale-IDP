import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { authFetch, isAuthenticated } from '~/lib/auth';
import { useTemplateConfig } from '~/lib/template-context';
import type { TemplateCardsResponse } from '~/lib/card-types';

// Custom event dispatched after a successful provider sync so mounted
// pages reload their cards from the refreshed cache.
export const CARDS_SYNCED_EVENT = 'cards-synced';

// Normalize field values from Radicale (handles Python list strings, objects, etc.)
function normalizeFieldValue(value: any): any {
  if (!value) return value;

  // Handle string that looks like a Python list: "['item1', 'item2']"
  if (typeof value === 'string') {
    if (value.startsWith('[') && value.endsWith(']')) {
      try {
        // Replace single quotes with double quotes for JSON parsing
        const jsonStr = value.replace(/'/g, '"');
        const parsed = JSON.parse(jsonStr);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch {
        // If parsing fails, return as-is
      }
    }
    return value;
  }

  // Already an array or other type - return as-is
  return value;
}

// Normalize all fields in a card
function normalizeCard<T extends { fields: Record<string, any> }>(card: T): T {
  const normalizedFields: Record<string, any> = {};

  for (const [key, value] of Object.entries(card.fields)) {
    normalizedFields[key] = normalizeFieldValue(value);
  }

  return {
    ...card,
    fields: normalizedFields,
  };
}

async function fetchCards(template: string): Promise<TemplateCardsResponse> {
  const resp = await authFetch(`/api/user/cards?template=${encodeURIComponent(template)}`);
  if (!resp.ok) throw new Error('Failed to load cards');
  const payload: TemplateCardsResponse = await resp.json();
  if ('matches' in payload) {
    return { matches: (payload.matches || []).map(normalizeCard) };
  }
  return payload;
}

/**
 * Synchronize the contact provider: push current preferences to
 * Radicale, reprocess the cards and refresh the cache. Dispatches
 * CARDS_SYNCED_EVENT on success so listeners can reload their data.
 */
export async function syncContactProvider(): Promise<boolean> {
  try {
    const response = await authFetch('/api/user/cards', {
      method: 'PUT',
    });

    if (response.ok) {
      toast.success('Contact provider synchronized!', {
        description: 'Your privacy preferences have been synchronized with the contact provider.',
      });
      window.dispatchEvent(new Event(CARDS_SYNCED_EVENT));
      return true;
    }
    toast.error('Failed to synchronize', {
      description: 'Please try again. If the problem persists, contact support.',
    });
  } catch (e) {
    console.error('Failed to sync cards:', e);
    toast.error('Failed to synchronize', {
      description: 'Network error. Please check your connection and try again.',
    });
  }
  return false;
}

export function useCardData() {
  // Resolve the active template the same way the access page does, so the
  // backend only returns the data this template actually renders
  const { version, defaultTemplate, enableTemplates } = useTemplateConfig();
  const template = (enableTemplates ? version || defaultTemplate : defaultTemplate).toLowerCase();

  const [data, setData] = useState<TemplateCardsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCards = async () => {
      setLoading(true);
      try {
        setData(await fetchCards(template));
      } catch (e) {
        console.error('Failed to load cards:', e);
        toast.error('Failed to load data', { description: 'Unable to load contact records.' });
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated()) {
      loadCards();
    }

    // Reload when the contact provider is synchronized elsewhere
    // (e.g. the sidebar sync button)
    const onSynced = () => loadCards();
    window.addEventListener(CARDS_SYNCED_EVENT, onSynced);
    return () => window.removeEventListener(CARDS_SYNCED_EVENT, onSynced);
  }, [template]);

  return { data, loading, template };
}
