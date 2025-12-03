import { verifyAuth } from '~/lib/auth';
import { getUserCards, updatePrivacySettings, createPrivacySettings, reprocessUserCards } from '~/api/radicale';
import { getUserByContact, getUserCardsCache, saveUserCardsCache, getUserPreferences } from '~/db/operations';

export async function loader({ request }: { request: Request }) {
  try {
    const env = process.env;
    const isDevelopment = import.meta.env.DEV;
    const JWT_SECRET =
      env.JWT_SECRET || (isDevelopment ? 'dev-jwt-secret-key-for-testing-only' : undefined);

    if (!JWT_SECRET) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error: JWT_SECRET is not configured.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const user = await verifyAuth(request, JWT_SECRET);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const dbUser = await getUserByContact(user.contact);
    if (!dbUser) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Read cards from DB cache
    const cards = (await getUserCardsCache(dbUser.id)) || { matches: [] };
    return new Response(JSON.stringify(cards), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function action({ request }: { request: Request }) {
  try {
    const env = process.env;
    const isDevelopment = import.meta.env.DEV;
    const JWT_SECRET =
      env.JWT_SECRET || (isDevelopment ? 'dev-jwt-secret-key-for-testing-only' : undefined);

    if (!JWT_SECRET) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error: JWT_SECRET is not configured.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const user = await verifyAuth(request, JWT_SECRET);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const dbUser = await getUserByContact(user.contact);
    if (!dbUser) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const method = request.method.toUpperCase();

    // Sync action: update Radicale with privacy preferences, reprocess, fetch filtered cards, and update DB cache
    if (method === 'PUT') {
      // Get current preferences from web database
      const currentPreferences = await getUserPreferences(dbUser.id);

      if (currentPreferences) {
        // Convert database format to Radicale format
        const radicalePreferences = {
          disallow_photo: currentPreferences.disallowPhoto === 1,
          disallow_gender: currentPreferences.disallowGender === 1,
          disallow_birthday: currentPreferences.disallowBirthday === 1,
          disallow_address: currentPreferences.disallowAddress === 1,
          disallow_company: currentPreferences.disallowCompany === 1,
          disallow_title: currentPreferences.disallowTitle === 1,
        };

        // Update Radicale with current preferences
        try {
          await updatePrivacySettings(user.contact, radicalePreferences);
        } catch (err: any) {
          if (err?.status === 400) {
            await createPrivacySettings(user.contact, radicalePreferences);
          } else {
            throw err;
          }
        }

        // Trigger reprocessing in Radicale
        await reprocessUserCards(user.contact);
      }

      // Fetch filtered cards from Radicale
      const fresh = await getUserCards(user.contact);
      await saveUserCardsCache(dbUser.id, fresh);
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
