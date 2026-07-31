import { useLoaderData, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { LoginForm } from '~/components/login-form';
import { getEnv } from '~/lib/env';
import { meta, handle } from './login-meta';

export { meta, handle };

export const loader = async () => {
  return { showDisclaimer: getEnv().SHOW_DISCLAIMER || false };
};

export default function LoginPage() {
  const location = useLocation();
  const { t } = useTranslation();
  const { showDisclaimer: envDisclaimer } = useLoaderData<typeof loader>();
  const searchParams = new URLSearchParams(location.search);
  const showDisclaimer = envDisclaimer || searchParams.get('disclaimer') === 'true';

  return (
    <div className="py-30">
      <div className="container mx-auto max-w-8xl px-6">
        <div className="flex justify-center">
          <div className="w-full max-w-2xl">
            {showDisclaimer && (
              <div className="bg-red-50 p-6 rounded-2xl mb-20">
                <p className="text-red-900 text-center">
                  <span className="font-semibold">{t('login.disclaimerTitle')}</span>
                  <span className="mx-2">—</span>
                  {t('login.disclaimer')}
                </p>
              </div>
            )}
            <div className="shadow-2xl rounded-2xl p-32">
              <LoginForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
