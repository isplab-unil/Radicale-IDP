import { useTemplateVersion } from './template-context';

/**
 * Build a URL preserving the current template version
 */
export function buildUrlWithTemplate(path: string, templateVersion?: string): string {
  if (!templateVersion) return path;

  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}v=${templateVersion}`;
}

/**
 * Hook to build links that preserve the current template version
 */
export function useBuildUrlWithTemplate() {
  const templateVersion = useTemplateVersion();

  return (path: string) => buildUrlWithTemplate(path, templateVersion);
}
