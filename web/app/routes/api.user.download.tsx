import { verifyAuth } from '~/lib/auth';
import { downloadUserCards } from '~/api/radicale';
import { getUserByContact } from '~/db/operations';

const VALID_TEMPLATES = ['a', 'b', 'c', 'd', 'e', 'f'];

function parseTemplate(request: Request): string {
  const template = new URL(request.url).searchParams.get('template')?.toLowerCase();
  return template && VALID_TEMPLATES.includes(template) ? template : 'a';
}

// Loader function for GET requests: download the user's matching cards
// shaped by the active disclosure template as a JSON attachment.
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

    // Fetch the template-shaped JSON payload from Radicale
    const template = parseTemplate(request);
    const resp = await downloadUserCards(user.contact, template);
    if (!resp.ok) {
      return new Response(JSON.stringify({ error: 'Failed to download data from provider' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await resp.text();
    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': 'attachment; filename="my-data.json"',
      },
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
