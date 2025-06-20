import { type RouteConfig, index, route, layout } from '@react-router/dev/routes';

export default [
  layout('components/layout.tsx', [
    index('routes/home.tsx'),
    route('/privacy-preferences', 'routes/privacy-preferences.tsx'),
    route('/data-access', 'routes/data-access.tsx'),
    route('/login', 'routes/login.tsx'),
  ]),
] satisfies RouteConfig;
