export type CardMatch = {
  vcard_uid: string;
  collection_path: string;
  matching_fields: Record<string, any>;
  fields: Record<string, any>;
};

export type CardsResponse = {
  matches: CardMatch[];
};

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
