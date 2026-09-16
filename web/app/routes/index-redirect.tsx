import { redirect, type LoaderFunctionArgs } from 'react-router';

// CSP for redirect responses. A 302 body is never rendered or executed, so no
// nonce is needed; this exists so every response carries the header even
// though React Router bypasses entry.server.tsx for redirects. Mirrors the
// app CSP (web/app/entry.server.tsx) minus the script nonce.
const REDIRECT_CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
].join('; ');

// The index route has no page of its own: land on the first tab,
// preserving query parameters (e.g. the template version ?v=).
export const loader = ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  return redirect(`/subject-data-preferences${url.search}`, {
    headers: { 'Content-Security-Policy': REDIRECT_CSP },
  });
};
