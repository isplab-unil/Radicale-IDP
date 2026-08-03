import { Button } from '~/components/ui/button';
import { useTemplateContext } from '~/lib/template-context';

const TEMPLATES = ['a', 'b', 'c', 'd', 'e', 'f'];

/**
 * Row of A–F buttons to switch between template variants.
 * Only rendered when templates are enabled (ENABLE_TEMPLATES=true).
 */
export function TemplateSwitcher() {
  const { version, defaultTemplate, enableTemplates, setVersion } = useTemplateContext();

  if (!enableTemplates) return null;

  // No explicit selection: the default template applies
  const selected = (version || defaultTemplate).toLowerCase();

  return (
    <div role="group" aria-label="Template selection" className="flex items-center gap-2">
      {TEMPLATES.map(template => {
        const isSelected = selected === template;
        return (
          <Button
            key={template}
            variant={isSelected ? 'default' : 'outline'}
            size="sm"
            aria-pressed={isSelected}
            aria-label={`Template ${template.toUpperCase()}`}
            onClick={() => setVersion(template)}
          >
            {template.toUpperCase()}
          </Button>
        );
      })}
    </div>
  );
}
