import type { Route } from './+types/api.auth.verify-otp';
import { createAuthToken } from '~/lib/auth';
import { verifyOtp } from '~/db/operations';
import { normalizeIdentifier } from '~/lib/otp';
import { env } from '~/lib/env';

export async function action({ request }: Route.ActionArgs) {
  try {
    const JWT_SECRET = env.JWT_SECRET;

    if (!JWT_SECRET) {
      return new Response(
        JSON.stringify({
          error: 'Server configuration error: JWT_SECRET is not configured',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body (supports legacy { email } and new { identifier })
    const body = (await request.json()) as { email?: string; identifier?: string; code?: string };
    const identifier = (body.identifier || body.email || '').trim();
    const { code } = body;

    // Validate input
    if (!identifier || !code) {
      return new Response(
        JSON.stringify({ error: 'Email or phone number and verification code are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (typeof code !== 'string' || !/^\d{6}$/.test(code)) {
      return new Response(JSON.stringify({ error: 'Invalid verification code format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Normalize identifier the same way we did in request-otp
    // This ensures we look up with the same key that was used to store the OTP
    let normalizedIdentifier: string;
    try {
      normalizedIdentifier = normalizeIdentifier(identifier);
    } catch {
      // If normalization fails, return generic error (don't reveal whether identifier is invalid)
      return new Response(JSON.stringify({ error: 'Invalid or expired verification code' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify OTP using normalized identifier
    const result = await verifyOtp(normalizedIdentifier, code);

    if (!result.isValid || !result.user) {
      return new Response(JSON.stringify({ error: 'Invalid or expired verification code' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create authentication token
    const authToken = await createAuthToken(result.user.contact, result.user.id, JWT_SECRET);
    return new Response(
      JSON.stringify({
        authToken,
        expiresIn: 86400, // 24 hours
        message: 'Authentication successful',
        user: {
          contact: result.user.contact,
          userId: result.user.id,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
