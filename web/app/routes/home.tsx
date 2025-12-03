import { MoveUpRightIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { meta, handle } from './home-meta';
import { LinkWithTemplate } from '~/lib/template-context';

export { meta, handle };

export default function Home() {
  const { t } = useTranslation();

  return (
    <div className="pt-6 pb-30">
      <div className="container mx-auto max-w-8xl px-6">
        <div className="space-y-8">
          <div>
            <h1 className="text-5xl font-medium text-gray-900 mb-6">{t('home.title')}</h1>
            <p className="text-gray-500 text-lg leading-relaxed mb-6 max-w-4xl">
              {t('home.description')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-100 p-6 rounded-2xl">
              <h2 className="text-xl font-medium text-gray-900 mb-3">
                {t('home.preferences.title')}
              </h2>
              <p className="text-gray-600 mb-4">{t('home.preferences.description')}</p>
              <LinkWithTemplate
                to="/subject-data-preferences"
                className="inline-flex items-center text-blue-600 hover:text-blue-700 font-normal"
              >
                {t('home.preferences.button')} <MoveUpRightIcon className="w-4 h-4 ml-2" />
              </LinkWithTemplate>
            </div>

            <div className="bg-gray-100 p-6 rounded-2xl">
              <h2 className="text-xl font-medium text-gray-900 mb-3">{t('home.access.title')}</h2>
              <p className="text-gray-600 mb-4">{t('home.access.description')}</p>
              <LinkWithTemplate
                to="/subject-data-access"
                className="inline-flex items-center text-blue-600 hover:text-blue-700 font-normal"
              >
                {t('home.access.button')} <MoveUpRightIcon className="w-4 h-4 ml-2" />
              </LinkWithTemplate>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
