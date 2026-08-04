import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
  type ReactNode,
} from 'react';
import { useSearchParams, useNavigate, Link as RouterLink } from 'react-router';

interface TemplateContextType {
  version: string;
  defaultTemplate: string;
  enableTemplates: boolean;
  /** True when the template is forced by a valid ?v= URL parameter (shared study links). */
  pinned: boolean;
  setVersion: (_: string) => void;
  navigateWithTemplate: (_: string) => void;
}

const VALID_VERSIONS = ['a', 'b', 'c', 'd', 'e', 'f'];
const STORAGE_KEY = 'template-version';

const TemplateContext = createContext<TemplateContextType | undefined>(undefined);

export function TemplateProvider({
  children,
  defaultTemplate = 'a',
  enableTemplates = true,
}: {
  children: ReactNode;
  defaultTemplate?: string;
  enableTemplates?: boolean;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // A valid ?v= parameter pins the template (shared study links): it always
  // wins and the template switcher stays hidden.
  const urlVersion = searchParams.get('v')?.toLowerCase() ?? '';
  const pinned = enableTemplates && VALID_VERSIONS.includes(urlVersion);

  // Local preference, used only when no template is pinned. Persisted in
  // localStorage so it survives reloads without touching the URL.
  const [preference, setPreference] = useState('');

  // Load the stored preference on the client (effects don't run during SSR,
  // so server and client first render agree on the default template).
  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && VALID_VERSIONS.includes(stored.toLowerCase())) {
      setPreference(stored.toLowerCase());
    }
  }, []);

  // Templates disabled: remove ?v= from the URL and ignore versions.
  useEffect(() => {
    if (!enableTemplates && searchParams.get('v')) {
      const params = new URLSearchParams(searchParams);
      params.delete('v');
      setSearchParams(params, { replace: true });
    }
  }, [enableTemplates, searchParams, setSearchParams]);

  const version = enableTemplates ? (pinned ? urlVersion : preference) : '';

  // Update the local template preference. No-op when a template is pinned:
  // shared links must always show the pinned template.
  const setVersion = useCallback(
    (newVersion: string) => {
      if (!enableTemplates || pinned) return;

      const normalized = newVersion.toLowerCase();
      setPreference(normalized);
      if (normalized) {
        window.localStorage.setItem(STORAGE_KEY, normalized);
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    },
    [enableTemplates, pinned]
  );

  // Navigate while preserving a pinned template version
  const navigateWithTemplate = useCallback(
    (path: string) => {
      if (pinned) {
        const separator = path.includes('?') ? '&' : '?';
        navigate(`${path}${separator}v=${urlVersion}`);
      } else {
        navigate(path);
      }
    },
    [pinned, urlVersion, navigate]
  );

  const value = useMemo(
    () => ({ version, defaultTemplate, enableTemplates, pinned, setVersion, navigateWithTemplate }),
    [version, defaultTemplate, enableTemplates, pinned, setVersion, navigateWithTemplate]
  );

  return <TemplateContext.Provider value={value}>{children}</TemplateContext.Provider>;
}

export function useTemplateVersion() {
  const context = useContext(TemplateContext);
  if (!context) {
    throw new Error('useTemplateVersion must be used within a TemplateProvider');
  }
  return context.version;
}

export function useTemplateConfig() {
  const context = useContext(TemplateContext);
  if (!context) {
    throw new Error('useTemplateConfig must be used within a TemplateProvider');
  }
  return {
    version: context.version,
    defaultTemplate: context.defaultTemplate,
    enableTemplates: context.enableTemplates,
    pinned: context.pinned,
  };
}

export function useSetTemplateVersion() {
  const context = useContext(TemplateContext);
  if (!context) {
    throw new Error('useSetTemplateVersion must be used within a TemplateProvider');
  }
  return context.setVersion;
}

export function useNavigateWithTemplate() {
  const context = useContext(TemplateContext);
  if (!context) {
    throw new Error('useNavigateWithTemplate must be used within a TemplateProvider');
  }
  return context.navigateWithTemplate;
}

export function useTemplateContext() {
  const context = useContext(TemplateContext);
  if (!context) {
    throw new Error('useTemplateContext must be used within a TemplateProvider');
  }
  return context;
}

/**
 * Custom Link component that preserves a pinned template version
 */
export function LinkWithTemplate({
  to,
  children,
  ...props
}: { to: string; children: ReactNode } & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const { pinned, version } = useTemplateContext();
  const href = pinned ? `${to}${to.includes('?') ? '&' : '?'}v=${version}` : to;
  return (
    <RouterLink to={href} {...props}>
      {children}
    </RouterLink>
  );
}
