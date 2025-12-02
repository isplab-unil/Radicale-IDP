export type CardMatch = {
  vcard_uid: string;
  collection_path: string;
  matching_fields: Record<string, any>;
  fields: Record<string, any>;
};

export type CardsResponse = {
  matches: CardMatch[];
};
