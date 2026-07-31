import { redirect, type LoaderFunctionArgs } from 'react-router';

// The index route has no page of its own: land on the first tab,
// preserving query parameters (e.g. the template version ?v=).
export const loader = ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  return redirect(`/subject-data-preferences${url.search}`);
};
