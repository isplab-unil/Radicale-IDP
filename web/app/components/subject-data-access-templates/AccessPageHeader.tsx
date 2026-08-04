import { useTranslation } from 'react-i18next';
import { getCurrentUser } from '~/lib/auth';
import { TemplateSwitcher } from '~/components/template-switcher';

/**
 * Shared header for the subject-data-access page: title with the
 * template switcher on the right, description below. The switcher
 * renders nothing when templates are disabled.
 */
export function AccessPageHeader() {
  const { t } = useTranslation();
  const user = getCurrentUser();
  const contact = user?.contact || 'your account';

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <h1 className="text-5xl font-medium text-gray-900 dark:text-gray-100">{t('access.title')}</h1>
        <TemplateSwitcher />
      </div>
      <p className="text-gray-500 dark:text-gray-400 text-lg leading-relaxed mb-6 max-w-4xl">
        {t('access.metaDescription', { contact })}
      </p>
    </div>
  );
}
