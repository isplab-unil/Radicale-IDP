import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import DynamicIcon from 'lucide-react/dist/esm/DynamicIcon.js';
import { toast } from 'sonner';
import { isAuthenticated, authFetch } from '~/lib/auth';
import { meta, handle } from './subject-data-download-meta';

export { meta, handle };

export default function DataDownloadPage() {
  const { t } = useTranslation();
  const [downloading, setDownloading] = useState(false);

  // Client-side authentication check
  useEffect(() => {
    if (typeof window !== 'undefined' && !isAuthenticated()) {
      window.location.href = '/login';
    }
  }, []);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      // Fetch with the JWT header (a plain link cannot send it), then
      // trigger the download via a temporary object URL
      const resp = await authFetch('/api/user/download');
      if (!resp.ok) throw new Error('Download failed');

      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'my-data.vcf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(t('download.error'), {
        description: t('download.errorDescription'),
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="pt-12 pb-30">
      <div className="container mx-auto max-w-8xl px-6">
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-5xl font-medium text-gray-900 dark:text-gray-100 mb-6">{t('download.title')}</h1>
            <p className="text-gray-500 dark:text-gray-400 text-lg leading-relaxed mb-6 max-w-4xl">
              {t('download.description')}
            </p>
          </div>

          {/* Download */}
          <div className="bg-gray-100 dark:bg-[#2c2c2e] p-6 rounded-2xl max-w-2xl">
            <div className="flex items-center justify-between gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  {t('download.sectionTitle')}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">{t('download.sectionDescription')}</p>
              </div>
              <button
                onClick={handleDownload}
                disabled={downloading}
                aria-label={t('download.button')}
                className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-sm transition-colors bg-brand-blue text-white hover:bg-brand-blue-hover disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              >
                <DynamicIcon
                  name="download"
                  size={18}
                  className={downloading ? 'animate-bounce' : undefined}
                />
                {downloading ? t('download.buttonDownloading') : t('download.button')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
