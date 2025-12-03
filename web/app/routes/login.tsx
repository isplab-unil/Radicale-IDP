import { useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { LoginForm } from '~/components/login-form';
import { meta, handle } from './login-meta';

export { meta, handle };

export default function LoginPage() {
  const location = useLocation();
  const { t } = useTranslation();
  const searchParams = new URLSearchParams(location.search);
  const showDisclaimer = searchParams.get('disclaimer') === 'true';

  return (
    <div className="py-30">
      <div className="container mx-auto max-w-8xl px-6">
        <div className="flex justify-center">
          <div className="w-full max-w-2xl">
            <div className="shadow-2xl rounded-2xl p-32">
              <LoginForm />
            </div>
            {showDisclaimer && (
              <div className="bg-red-50 p-6 rounded-2xl mt-20">
                <p className="text-red-900 text-center">
                  <span className="font-semibold">{t('login.disclaimerTitle')}</span>
                  <span className="mx-2">—</span>
                  {t('login.disclaimer')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
