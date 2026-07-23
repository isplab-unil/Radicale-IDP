import { meta, handle } from './subject-data-access-meta';
import { useTemplateConfig } from '~/lib/template-context';
import { TemplateA } from '~/components/subject-data-access-templates/TemplateA';
import { TemplateB } from '~/components/subject-data-access-templates/TemplateB';
import { TemplateC } from '~/components/subject-data-access-templates/TemplateC';
import { TemplateD } from '~/components/subject-data-access-templates/TemplateD';
import { TemplateE } from '~/components/subject-data-access-templates/TemplateE';
import { TemplateF } from '~/components/subject-data-access-templates/TemplateF';

export { meta, handle };

export default function DataAccessPage() {
  const { version: templateVersion, defaultTemplate, enableTemplates } = useTemplateConfig();

  const template = enableTemplates ? templateVersion || defaultTemplate : defaultTemplate;

  switch (template.toLowerCase()) {
    case 'a':
      return <TemplateA />;
    case 'b':
      return <TemplateB />;
    case 'c':
      return <TemplateC />;
    case 'd':
      return <TemplateD />;
    case 'e':
      return <TemplateE />;
    case 'f':
      return <TemplateF />;
    default: {
      // If somehow an invalid template gets here, render the default
      const defaultLower = defaultTemplate.toLowerCase();
      if (defaultLower === 'b') return <TemplateB />;
      if (defaultLower === 'c') return <TemplateC />;
      if (defaultLower === 'd') return <TemplateD />;
      if (defaultLower === 'e') return <TemplateE />;
      if (defaultLower === 'f') return <TemplateF />;
      return <TemplateA />;
    }
  }
}
