import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { isAuthenticated, authFetch } from '~/lib/auth';
import { meta, handle } from './subject-data-preferences-meta';

export { meta, handle };

export default function PreferencesPage() {
  const { t } = useTranslation();
  const [preferences, setPreferences] = useState<Record<string, boolean>>({});
  const [originalPreferences, setOriginalPreferences] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Mapping between API field names and user-friendly labels
  const fieldMapping = {
    disallow_photo: {
      label: t('preferences.fields.photo.label'),
      description: t('preferences.fields.photo.description'),
    },
    disallow_gender: {
      label: t('preferences.fields.gender.label'),
      description: t('preferences.fields.gender.description'),
    },
    disallow_birthday: {
      label: t('preferences.fields.birthday.label'),
      description: t('preferences.fields.birthday.description'),
    },
    disallow_address: {
      label: t('preferences.fields.address.label'),
      description: t('preferences.fields.address.description'),
    },
    disallow_company: {
      label: t('preferences.fields.company.label'),
      description: t('preferences.fields.company.description'),
    },
    disallow_title: {
      label: t('preferences.fields.title.label'),
      description: t('preferences.fields.title.description'),
    },
  };

  // Client-side authentication check
  useEffect(() => {
    if (typeof window !== 'undefined' && !isAuthenticated()) {
      window.location.href = '/login';
    }
  }, []);

  // Load preferences from database
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const response = await authFetch('/api/user/preferences');
        if (response.ok) {
          const data = await response.json();
          setPreferences(data.preferences);
          setOriginalPreferences(data.preferences);
          setHasChanges(false);
        } else {
          toast.error(t('preferences.loadError'), {
            description: t('preferences.loadErrorDescription'),
          });
        }
      } catch {
        toast.error(t('preferences.loadError'), {
          description: t('preferences.networkError'),
        });
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated()) {
      loadPreferences();
    }
  }, []);

  const handlePreferenceChange = (fieldId: string, checked: boolean) => {
    const newPreferences = {
      ...preferences,
      [fieldId]: checked,
    };
    setPreferences(newPreferences);
    setHasChanges(true);
  };

  const handleSavePreferences = async () => {
    setSaving(true);

    try {
      const response = await authFetch('/api/user/preferences', {
        method: 'PUT',
        body: JSON.stringify({ preferences }),
      });

      if (response.ok) {
        setOriginalPreferences(preferences);
        setHasChanges(false);
        toast.success(t('preferences.saveSuccess'), {
          description: t('preferences.saveSuccessDescription'),
        });
      } else {
        toast.error(t('preferences.saveError'), {
          description: t('preferences.saveErrorDescription'),
        });
      }
    } catch {
      toast.error(t('preferences.saveError'), {
        description: t('preferences.saveNetworkError'),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setPreferences(originalPreferences);
    setHasChanges(false);
  };

  if (loading) {
    return (
      <div className="py-30">
        <div className="container mx-auto max-w-8xl px-6">
          <div className="flex items-center justify-center">
            <div className="text-gray-600">{t('preferences.loading')}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-6 pb-30">
      <div className="container mx-auto max-w-8xl px-6">
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-5xl font-medium text-gray-900 mb-6">{t('preferences.title')}</h1>
            <p className="text-gray-600 text-lg leading-relaxed mb-2 max-w-4xl">
              {t('preferences.description')}
            </p>
          </div>

          <div className="text-gray-600 text-lg leading-relaxed">
            <p>{t('preferences.explanation')}</p>
          </div>

          {/* Preferences Form */}
          <div className="space-y-6">
            {Object.entries(fieldMapping).map(([fieldId, fieldInfo]) => (
              <div key={fieldId} className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={preferences[fieldId] || false}
                  onChange={e => handlePreferenceChange(fieldId, e.target.checked)}
                  className="h-5 w-5 mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                  disabled={saving}
                />
                <div className="flex-1">
                  <label className="text-lg text-gray-900 cursor-pointer select-none font-medium">
                    {t('preferences.keepPrivate', { field: fieldInfo.label })}
                  </label>
                  <p className="text-sm text-gray-600 mt-1">{fieldInfo.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Contact Provider Status */}
          <div className="bg-gray-100 p-6 rounded-2xl mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {t('preferences.providerStatus')}
                </h3>
                <p className="text-sm text-gray-600">
                  {hasChanges ? t('preferences.statusUnsaved') : t('preferences.statusSynced')}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleCancel}
                  disabled={!hasChanges || saving}
                  className="px-6 py-3 rounded-lg font-medium text-sm transition-colors bg-gray-300 text-gray-900 hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('preferences.buttonCancel')}
                </button>
                <button
                  onClick={handleSavePreferences}
                  disabled={!hasChanges || saving}
                  className="px-6 py-3 rounded-lg font-medium text-sm transition-colors bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? t('preferences.buttonSaving') : t('preferences.buttonSave')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
