import { verifyAuth } from '~/lib/auth';
import { updatePrivacySettings, createPrivacySettings, reprocessUserCards } from '~/api/radicale';
import {
  getUserByContact,
  getUserPreferences,
  saveUserPreferences,
  clearUserCardsCache,
  markContactProviderSynced,
} from '~/db/operations';

// Loader function for GET requests
export async function loader({ request }: { request: Request }) {
  try {
    // Get environment variables
    const env = process.env;
    const isDevelopment = import.meta.env.DEV;
    const JWT_SECRET =
      env.JWT_SECRET || (isDevelopment ? 'dev-jwt-secret-key-for-testing-only' : undefined);

    if (!JWT_SECRET) {
      return new Response(
        JSON.stringify({
          error: 'Server configuration error: JWT_SECRET is not configured.',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Verify authentication
    const user = await verifyAuth(request, JWT_SECRET);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get user from database
    const dbUser = await getUserByContact(user.contact);
    if (!dbUser) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get user preferences from web database
    const preferences = await getUserPreferences(dbUser.id);

    // Convert database format to frontend format
    const formattedPreferences = preferences
      ? {
          disallow_photo: preferences.disallowPhoto === 1,
          disallow_gender: preferences.disallowGender === 1,
          disallow_birthday: preferences.disallowBirthday === 1,
          disallow_address: preferences.disallowAddress === 1,
          disallow_company: preferences.disallowCompany === 1,
          disallow_title: preferences.disallowTitle === 1,
          disallow_related: preferences.disallowRelated === 1,
          disallow_nickname: preferences.disallowNickname === 1,
          api_disallow_photo: preferences.apiDisallowPhoto === 1,
          api_disallow_gender: preferences.apiDisallowGender === 1,
          api_disallow_birthday: preferences.apiDisallowBirthday === 1,
          api_disallow_address: preferences.apiDisallowAddress === 1,
          api_disallow_company: preferences.apiDisallowCompany === 1,
          api_disallow_title: preferences.apiDisallowTitle === 1,
          api_disallow_related: preferences.apiDisallowRelated === 1,
          api_disallow_nickname: preferences.apiDisallowNickname === 1,
        }
      : {
          disallow_photo: false,
          disallow_gender: false,
          disallow_birthday: false,
          disallow_address: false,
          disallow_company: false,
          disallow_title: false,
          disallow_related: false,
          disallow_nickname: false,
          api_disallow_photo: false,
          api_disallow_gender: false,
          api_disallow_birthday: false,
          api_disallow_address: false,
          api_disallow_company: false,
          api_disallow_title: false,
          api_disallow_related: false,
          api_disallow_nickname: false,
        };

    const contactProviderSynced = preferences ? preferences.contactProviderSynced === 1 : true;

    return new Response(
      JSON.stringify({
        preferences: formattedPreferences,
        contactProviderSynced,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch {
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Action function for PUT requests
export async function action({ request }: { request: Request }) {
  try {
    // Get environment variables
    const env = process.env;
    const isDevelopment = import.meta.env.DEV;
    const JWT_SECRET =
      env.JWT_SECRET || (isDevelopment ? 'dev-jwt-secret-key-for-testing-only' : undefined);

    if (!JWT_SECRET) {
      return new Response(
        JSON.stringify({
          error: 'Server configuration error: JWT_SECRET is not configured.',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Verify authentication
    const user = await verifyAuth(request, JWT_SECRET);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get user from database
    const dbUser = await getUserByContact(user.contact);
    if (!dbUser) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = (await request.json()) as {
      preferences?: Record<string, boolean>;
    };

    const { preferences } = body;

    // Handle preferences update
    if (!preferences || typeof preferences !== 'object') {
      return new Response(JSON.stringify({ error: 'Invalid preferences data' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Convert frontend format to database format
    const dbPreferences = {
      disallowPhoto: preferences.disallow_photo ? 1 : 0,
      disallowGender: preferences.disallow_gender ? 1 : 0,
      disallowBirthday: preferences.disallow_birthday ? 1 : 0,
      disallowAddress: preferences.disallow_address ? 1 : 0,
      disallowCompany: preferences.disallow_company ? 1 : 0,
      disallowTitle: preferences.disallow_title ? 1 : 0,
      disallowRelated: preferences.disallow_related ? 1 : 0,
      disallowNickname: preferences.disallow_nickname ? 1 : 0,
      apiDisallowPhoto: preferences.api_disallow_photo ? 1 : 0,
      apiDisallowGender: preferences.api_disallow_gender ? 1 : 0,
      apiDisallowBirthday: preferences.api_disallow_birthday ? 1 : 0,
      apiDisallowAddress: preferences.api_disallow_address ? 1 : 0,
      apiDisallowCompany: preferences.api_disallow_company ? 1 : 0,
      apiDisallowTitle: preferences.api_disallow_title ? 1 : 0,
      apiDisallowRelated: preferences.api_disallow_related ? 1 : 0,
      apiDisallowNickname: preferences.api_disallow_nickname ? 1 : 0,
    };

    // Save preferences to web database
    await saveUserPreferences(dbUser.id, dbPreferences);

    // Sync with Radicale immediately after saving
    try {
      await updatePrivacySettings(user.contact, preferences);
    } catch (err: any) {
      if (err?.status === 400) {
        await createPrivacySettings(user.contact, preferences);
      } else {
        throw err;
      }
    }

    // Trigger reprocessing in Radicale
    await reprocessUserCards(user.contact);

    // Invalidate the per-template card cache so the access page refetches
    // current shaped data from radicale on its next read
    await clearUserCardsCache(dbUser.id);

    // Mark as synced in web database
    await markContactProviderSynced(dbUser.id);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
