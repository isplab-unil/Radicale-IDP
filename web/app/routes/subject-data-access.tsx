import type { ReactNode } from 'react';
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

  let content: ReactNode;
  switch (template.toLowerCase()) {
    case 'a':
      content = <TemplateA />;
      break;
    case 'b':
      content = <TemplateB />;
      break;
    case 'c':
      content = <TemplateC />;
      break;
    case 'd':
      content = <TemplateD />;
      break;
    case 'e':
      content = <TemplateE />;
      break;
    case 'f':
      content = <TemplateF />;
      break;
    default: {
      // If somehow an invalid template gets here, render the default
      const defaultLower = defaultTemplate.toLowerCase();
      if (defaultLower === 'b') content = <TemplateB />;
      else if (defaultLower === 'c') content = <TemplateC />;
      else if (defaultLower === 'd') content = <TemplateD />;
      else if (defaultLower === 'e') content = <TemplateE />;
      else if (defaultLower === 'f') content = <TemplateF />;
      else content = <TemplateA />;
    }
  }

  return <>{content}</>;
}
