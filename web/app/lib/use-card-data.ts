import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { authFetch, isAuthenticated } from '~/lib/auth';
import type { CardMatch, CardsResponse } from '~/lib/card-types';

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

export function useCardData() {
  const [syncing, setSyncing] = useState(false);
  const [cards, setCards] = useState<CardMatch[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCards = async () => {
    try {
      const resp = await authFetch('/api/user/cards');
      if (!resp.ok) throw new Error('Failed to load cards');
      const data: CardsResponse = await resp.json();
      // Normalize the cards before setting state
      const normalizedCards = (data.matches || []).map(normalizeCard);
      setCards(normalizedCards);
    } catch (e) {
      console.error('Failed to load cards:', e);
      toast.error('Failed to load data', { description: 'Unable to load contact records.' });
    } finally {
      setLoading(false);
    }
  };

  const syncCards = async () => {
    setSyncing(true);

    try {
      const response = await authFetch('/api/user/cards', {
        method: 'PUT',
      });

      if (response.ok) {
        toast.success('Contact provider synchronized!', {
          description: 'Your privacy preferences have been synchronized with the contact provider.',
        });
        // Reload cards from DB cache
        try {
          const resp = await authFetch('/api/user/cards');
          if (resp.ok) {
            const data: CardsResponse = await resp.json();
            // Normalize the cards before setting state
            const normalizedCards = (data.matches || []).map(normalizeCard);
            setCards(normalizedCards);
          }
        } catch (e) {
          console.error('Failed to reload cards after sync:', e);
        }
      } else {
        toast.error('Failed to synchronize', {
          description: 'Please try again. If the problem persists, contact support.',
        });
      }
    } catch (e) {
      console.error('Failed to sync cards:', e);
      toast.error('Failed to synchronize', {
        description: 'Network error. Please check your connection and try again.',
      });
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated()) {
      loadCards();
    }
  }, []);

  return { cards, loading, syncing, syncCards };
}
