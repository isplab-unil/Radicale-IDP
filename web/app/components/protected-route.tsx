import { useEffect, useState } from 'react';
import { useNavigateWithTemplate } from '~/lib/template-context';
import { isAuthenticated } from '~/lib/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const navigate = useNavigateWithTemplate();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
    if (!isAuthenticated()) {
      navigate('/login');
    }
  }, [navigate]);

  // Don't render children if not authenticated (but only after hydration)
  if (isHydrated && !isAuthenticated()) {
    return null;
  }

  return <>{children}</>;
}
