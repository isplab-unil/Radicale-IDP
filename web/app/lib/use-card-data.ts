import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { authFetch, isAuthenticated } from '~/lib/auth';
import type { CardMatch, CardsResponse } from '~/lib/card-types';

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
function normalizeCard(card: CardMatch): CardMatch {
  const normalizedFields: Record<string, any> = {};

  for (const [key, value] of Object.entries(card.fields)) {
    normalizedFields[key] = normalizeFieldValue(value);
  }

  return {
    ...card,
    fields: normalizedFields,
  };
}

async function fetchCards(): Promise<CardMatch[]> {
  const resp = await authFetch('/api/user/cards');
  if (!resp.ok) throw new Error('Failed to load cards');
  const data: CardsResponse = await resp.json();
  return (data.matches || []).map(normalizeCard);
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
  const [cards, setCards] = useState<CardMatch[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCards = async () => {
    try {
      setCards(await fetchCards());
    } catch (e) {
      console.error('Failed to load cards:', e);
      toast.error('Failed to load data', { description: 'Unable to load contact records.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated()) {
      loadCards();
    }

    // Reload when the contact provider is synchronized elsewhere
    // (e.g. the sidebar sync button)
    const onSynced = () => loadCards();
    window.addEventListener(CARDS_SYNCED_EVENT, onSynced);
    return () => window.removeEventListener(CARDS_SYNCED_EVENT, onSynced);
  }, []);

  return { cards, loading };
}
