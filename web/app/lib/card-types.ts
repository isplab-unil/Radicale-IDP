export type CardMatch = {
  vcard_uid: string;
  collection_path: string;
  matching_fields: Record<string, any>;
  fields: Record<string, any>;
};

export type CardsResponse = {
  matches: CardMatch[];
};

/** Disclosure templates understood by the backend (see radicale/privacy/templates.py). */
export type CardTemplate = 'a' | 'b' | 'c' | 'd' | 'e' | 'f';

/** Templates A/B: number of matching cards only. */
export type CardsCountResponse = { count: number };

/** Template C: per-field card counts (presence only). */
export type CardsCountsResponse = { counts: Record<string, number> };

/** Template D: per-field values aggregated across cards (photo as presence only). */
export type CardsValuesResponse = { values: Record<string, unknown[]> };

/** Response of GET /privacy/cards/<user>?template=X, shaped by the template. */
export type TemplateCardsResponse =
  | CardsResponse
  | CardsCountResponse
  | CardsCountsResponse
  | CardsValuesResponse;

/**
 * Return the photo value only if it is a renderable image source
 * (data URI or http(s) URL), otherwise null. Guards against malformed
 * values ending up in <img src>, where a relative URL containing an
 * invalid percent-encoding can crash the dev server (URI malformed).
 */
export function getPhotoSrc(photo: unknown): string | null {
  if (typeof photo !== 'string') return null;
  return /^(data:image\/|https?:\/\/)/.test(photo) ? photo : null;
}
