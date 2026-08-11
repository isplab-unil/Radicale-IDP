import type { TemplateCardsResponse } from '~/lib/card-types';

export type PrivacySettings = {
  disallow_photo: boolean;
  disallow_gender: boolean;
  disallow_birthday: boolean;
  disallow_address: boolean;
  disallow_company: boolean;
  disallow_title: boolean;
  disallow_related: boolean;
  disallow_nickname: boolean;
  api_disallow_photo: boolean;
  api_disallow_gender: boolean;
  api_disallow_birthday: boolean;
  api_disallow_address: boolean;
  api_disallow_company: boolean;
  api_disallow_title: boolean;
  api_disallow_related: boolean;
  api_disallow_nickname: boolean;
};

function buildUrl(path: string): string {
  const baseUrl = process.env.RADICALE_URL;
  if (!baseUrl) throw new Error('RADICALE_URL is not configured');
  return `${baseUrl.replace(/\/$/, '')}${path.startsWith('/') ? '' : '/'}${path}`;
}

async function request<T = any>(path: string, init?: RequestInit): Promise<T> {
  const token = process.env.RADICALE_TOKEN;
  if (!token) throw new Error('RADICALE_TOKEN is not configured');

  const resp = await fetch(buildUrl(path), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init?.headers || {}),
    },
  });

  const text = await resp.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // Continue with null json
  }

  if (!resp.ok) {
    const message = json?.error || resp.statusText || 'Radicale request failed';
    const error = new Error(message);
    (error as any).status = resp.status;
    (error as any).body = json ?? text;
    throw error;
  }
  return json as T;
}

export async function getPrivacySettings(user: string): Promise<PrivacySettings> {
  return request<PrivacySettings>(`/privacy/settings/${encodeURIComponent(user)}`);
}

export async function createPrivacySettings(user: string, settings: PrivacySettings) {
  return request(`/privacy/settings/${encodeURIComponent(user)}`, {
    method: 'POST',
    body: JSON.stringify(settings),
  });
}

export async function updatePrivacySettings(user: string, settings: Partial<PrivacySettings>) {
  return request(`/privacy/settings/${encodeURIComponent(user)}`, {
    method: 'PUT',
    body: JSON.stringify(settings),
  });
}

export async function reprocessUserCards(user: string) {
  return request(`/privacy/cards/${encodeURIComponent(user)}/reprocess`, {
    method: 'POST',
  });
}

/**
 * Download the user's matching cards shaped by the active template.
 * Unlike request(), this returns the raw Response (not parsed JSON).
 */
export async function downloadUserCards(user: string, template?: string): Promise<Response> {
  const token = process.env.RADICALE_TOKEN;
  if (!token) throw new Error('RADICALE_TOKEN is not configured');

  const query = template ? `?template=${encodeURIComponent(template)}` : '';
  return fetch(buildUrl(`/privacy/cards/${encodeURIComponent(user)}/download${query}`), {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export type CardMatch = {
  vcard_uid: string;
  collection_path: string;
  matching_fields: Record<string, any>;
  fields: Record<string, any>;
};

export async function getUserCards(
  user: string,
  template?: string
): Promise<TemplateCardsResponse> {
  const query = template ? `?template=${encodeURIComponent(template)}` : '';
  return request(`/privacy/cards/${encodeURIComponent(user)}${query}`);
}
