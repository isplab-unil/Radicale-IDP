import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from 'react-router';

import type { Route } from './+types/root';
import { Toaster } from '~/components/ui/sonner';
import { TemplateProvider } from '~/lib/template-context';
import { getEnv } from '~/lib/env';
import './app.css';
import { links } from './root-links';
import i18next from '~/i18n/config';
import { I18nextProvider, useTranslation } from 'react-i18next';

export { links };

type RootLoaderData = {
  enableTemplates: boolean;
  defaultTemplate: string;
};

export const loader = async (): Promise<RootLoaderData> => {
  const env = getEnv();
  return {
    enableTemplates: env.ENABLE_TEMPLATES || false,
    defaultTemplate: env.DEFAULT_TEMPLATE || 'a',
  };
};

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <Toaster />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const { enableTemplates, defaultTemplate } = useLoaderData<RootLoaderData>();

  return (
    <I18nextProvider i18n={i18next}>
      <TemplateProvider enableTemplates={enableTemplates} defaultTemplate={defaultTemplate}>
        <Outlet />
      </TemplateProvider>
    </I18nextProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const { t } = useTranslation();
  let message = t('errors.oops');
  let details = t('errors.unexpected');
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? t('errors.notFound') : t('errors.error');
    details = error.status === 404 ? t('errors.notFoundMessage') : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
