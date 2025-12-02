import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useSearchParams, useNavigate, Link as RouterLink } from 'react-router';

interface TemplateContextType {
  version: string;
  defaultTemplate: string;
  enableTemplates: boolean;
  setVersion: (version: string) => void;
  navigateWithTemplate: (path: string) => void;
}

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
  const [version, setVersionState] = useState(() => {
    const urlVersion = searchParams.get('v');
    // If templates are disabled, ignore URL version
    return enableTemplates && urlVersion ? urlVersion : '';
  });

  // Update URL when version changes (only if templates are enabled)
  const setVersion = (newVersion: string) => {
    if (!enableTemplates) return; // Don't change version if templates are disabled

    setVersionState(newVersion);
    if (newVersion) {
      setSearchParams(prev => {
        const params = new URLSearchParams(prev);
        params.set('v', newVersion);
        return params;
      });
    } else {
      setSearchParams(prev => {
        const params = new URLSearchParams(prev);
        params.delete('v');
        return params;
      });
    }
  };

  // Navigate while preserving template version (only if templates are enabled)
  const navigateWithTemplate = useCallback(
    (path: string) => {
      if (enableTemplates && version) {
        const separator = path.includes('?') ? '&' : '?';
        navigate(`${path}${separator}v=${version}`);
      } else {
        navigate(path);
      }
    },
    [version, navigate, enableTemplates]
  );

  // Initialize with default template if needed and sync with URL changes
  useEffect(() => {
    const urlVersion = searchParams.get('v');
    const validVersions = ['a', 'b', 'c', 'd'];
    const isValidVersion = urlVersion && validVersions.includes(urlVersion.toLowerCase());

    if (!enableTemplates) {
      // Templates disabled: remove ?v= from URL and ignore version
      if (urlVersion) {
        const params = new URLSearchParams(searchParams);
        params.delete('v');
        setSearchParams(params);
      }
      setVersionState('');
      return;
    }

    // Templates enabled: manage versions normally
    if (isValidVersion) {
      // URL has a valid version, make sure state matches
      if (urlVersion !== version) {
        setVersionState(urlVersion);
      }
    } else if (!version || !validVersions.includes(version)) {
      // No version, invalid version, or version not in state/URL - use default
      setVersionState(defaultTemplate);
      // Update URL to reflect the default
      const params = new URLSearchParams(searchParams);
      params.set('v', defaultTemplate);
      setSearchParams(params);
    }
  }, [searchParams, defaultTemplate, enableTemplates]); // Minimal dependencies to avoid loops

  const value = useMemo(
    () => ({ version, defaultTemplate, enableTemplates, setVersion, navigateWithTemplate }),
    [version, defaultTemplate, enableTemplates, setVersion, navigateWithTemplate]
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
 * Custom Link component that automatically preserves template version
 */
export function LinkWithTemplate({
  to,
  children,
  ...props
}: { to: string; children: ReactNode } & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const { version } = useTemplateContext();
  const href = version ? `${to}${to.includes('?') ? '&' : '?'}v=${version}` : to;
  return (
    <RouterLink to={href} {...props}>
      {children}
    </RouterLink>
  );
}
