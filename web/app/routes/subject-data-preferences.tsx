import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { isAuthenticated, authFetch } from '~/lib/auth';
import { meta, handle } from './subject-data-preferences-meta';

export { meta, handle };

type FieldState = 'private' | 'stored_no_api' | 'stored_api';

type ApiPreferences = Record<string, boolean>;

type TristatePreferences = Record<string, FieldState>;

const FIELD_IDS = [
  'photo',
  'nickname',
  'gender',
  'birthday',
  'address',
  'related',
  'company',
  'title',
] as const;

function apiToTristate(apiPrefs: ApiPreferences): TristatePreferences {
  const result: TristatePreferences = {};
  for (const field of FIELD_IDS) {
    const disallow = apiPrefs[`disallow_${field}`] ?? false;
    const apiDisallow = apiPrefs[`api_disallow_${field}`] ?? false;
    if (disallow) {
      result[field] = 'private';
    } else if (apiDisallow) {
      result[field] = 'stored_no_api';
    } else {
      result[field] = 'stored_api';
    }
  }
  return result;
}

function tristateToApi(tristatePrefs: TristatePreferences): ApiPreferences {
  const result: ApiPreferences = {};
  for (const field of FIELD_IDS) {
    const state = tristatePrefs[field] ?? 'stored_api';
    result[`disallow_${field}`] = state === 'private';
    result[`api_disallow_${field}`] = state === 'stored_no_api';
  }
  return result;
}

export default function PreferencesPage() {
  const { t } = useTranslation();
  const [preferences, setPreferences] = useState<TristatePreferences>({});
  const [originalPreferences, setOriginalPreferences] = useState<TristatePreferences>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const hasChanges =
    Object.keys(preferences).length !== Object.keys(originalPreferences).length ||
    FIELD_IDS.some(field => preferences[field] !== originalPreferences[field]);

  const fieldMapping = {
    photo: {
      label: t('preferences.fields.photo.label'),
      description: t('preferences.fields.photo.description'),
    },
    nickname: {
      label: t('preferences.fields.nickname.label'),
      description: t('preferences.fields.nickname.description'),
    },
    gender: {
      label: t('preferences.fields.gender.label'),
      description: t('preferences.fields.gender.description'),
    },
    birthday: {
      label: t('preferences.fields.birthday.label'),
      description: t('preferences.fields.birthday.description'),
    },
    address: {
      label: t('preferences.fields.address.label'),
      description: t('preferences.fields.address.description'),
    },
    related: {
      label: t('preferences.fields.related.label'),
      description: t('preferences.fields.related.description'),
    },
    company: {
      label: t('preferences.fields.company.label'),
      description: t('preferences.fields.company.description'),
    },
    title: {
      label: t('preferences.fields.title.label'),
      description: t('preferences.fields.title.description'),
    },
  };

  const stateOptions: { value: FieldState; labelKey: string }[] = [
    { value: 'private', labelKey: 'preferences.states.private' },
    { value: 'stored_no_api', labelKey: 'preferences.states.storedNoApi' },
    { value: 'stored_api', labelKey: 'preferences.states.storedApi' },
  ];

  useEffect(() => {
    if (typeof window !== 'undefined' && !isAuthenticated()) {
      window.location.href = '/login';
    }
  }, []);

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const response = await authFetch('/api/user/preferences');
        if (response.ok) {
          const data = await response.json();
          const tristate = apiToTristate(data.preferences);
          setPreferences(tristate);
          setOriginalPreferences(tristate);
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

  const handlePreferenceChange = (fieldId: string, state: FieldState) => {
    setPreferences(prev => ({
      ...prev,
      [fieldId]: state,
    }));
  };

  const handleSavePreferences = async () => {
    setSaving(true);

    try {
      const response = await authFetch('/api/user/preferences', {
        method: 'PUT',
        body: JSON.stringify({ preferences: tristateToApi(preferences) }),
      });

      if (response.ok) {
        setOriginalPreferences(preferences);
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
  };

  if (loading) {
    return (
      <div className="py-30">
        <div className="container mx-auto max-w-8xl px-6">
          <div className="flex items-center justify-center">
            <div className="text-gray-600 dark:text-gray-300">{t('preferences.loading')}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-12 pb-30">
      <div className="container mx-auto max-w-8xl px-6">
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-5xl font-medium text-gray-900 dark:text-gray-100 mb-6">
              {t('preferences.title')}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed mb-2 max-w-4xl">
              {t('preferences.description')}
            </p>
          </div>

          {/* Contact Provider Status */}
          <div className="bg-gray-100 dark:bg-[#2c2c2e] p-6 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  {t('preferences.providerStatus')}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {hasChanges ? t('preferences.statusUnsaved') : t('preferences.statusSynced')}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleCancel}
                  disabled={!hasChanges || saving}
                  className="px-6 py-3 rounded-lg font-medium text-sm transition-colors bg-gray-300 dark:bg-[#3a3a3c] text-gray-900 dark:text-gray-100 hover:bg-gray-400 dark:hover:bg-[#48484c] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('preferences.buttonCancel')}
                </button>
                <button
                  onClick={handleSavePreferences}
                  disabled={!hasChanges || saving}
                  className="px-6 py-3 rounded-lg font-medium text-sm transition-colors bg-brand-blue text-white hover:bg-brand-blue-hover disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? t('preferences.buttonSaving') : t('preferences.buttonSave')}
                </button>
              </div>
            </div>
          </div>

          <div className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
            <p>{t('preferences.explanation')}</p>
          </div>

          {/* Preferences Form */}
          <div className="space-y-8">
            {Object.entries(fieldMapping).map(([fieldId, fieldInfo]) => (
              <fieldset key={fieldId} className="space-y-3">
                <legend className="text-lg text-gray-900 dark:text-gray-100 font-medium">
                  {fieldInfo.label}
                </legend>
                <p className="text-sm text-gray-600 dark:text-gray-300">{fieldInfo.description}</p>
                <div className="flex flex-wrap gap-4 pt-1">
                  {stateOptions.map(option => (
                    <label
                      key={option.value}
                      className="inline-flex items-center space-x-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name={`preference-${fieldId}`}
                        value={option.value}
                        checked={preferences[fieldId] === option.value}
                        onChange={() => handlePreferenceChange(fieldId, option.value)}
                        className="h-4 w-4 border-gray-300 dark:border-[#3a3a3c] text-brand-blue focus:ring-brand-blue disabled:opacity-50"
                        disabled={saving}
                      />
                      <span className="text-gray-900 dark:text-gray-100">{t(option.labelKey)}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
