declare module 'lucide-react/dist/esm/DynamicIcon.js' {
  import { ComponentType, ForwardRefExoticComponent, RefAttributes } from 'react';

  interface DynamicIconProps extends React.SVGAttributes<SVGSVGElement> {
    name: string;
    size?: string | number;
    absoluteStrokeWidth?: boolean;
    fallback?: ComponentType<any>;
  }

  const DynamicIcon: ForwardRefExoticComponent<DynamicIconProps & RefAttributes<SVGSVGElement>>;

  export default DynamicIcon;
  export const iconNames: string[];
}
