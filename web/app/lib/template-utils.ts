import { useTemplateContext } from './template-context';

/**
 * Build a URL preserving the given template version
 */
export function buildUrlWithTemplate(path: string, templateVersion?: string): string {
  if (!templateVersion) return path;

  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}v=${templateVersion}`;
}

/**
 * Hook to build links that preserve a pinned template version
 */
export function useBuildUrlWithTemplate() {
  const { pinned, version } = useTemplateContext();

  return (path: string) => buildUrlWithTemplate(path, pinned ? version : undefined);
}
