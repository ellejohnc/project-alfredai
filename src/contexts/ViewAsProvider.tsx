import { useState, type ReactNode } from 'react';
import { AppRole } from '@/lib/rolePermissions';
import { ViewAsContext, type ViewAsProfile } from './ViewAsContext';

export function ViewAsProvider({ children }: { children: ReactNode }) {
  const [viewAsRole, setViewAsRole] = useState<AppRole | null>(null);
  const [viewAsProfile, setViewAsProfile] = useState<ViewAsProfile | null>(null);

  const setRole = (role: AppRole | null, profile: ViewAsProfile | null = null) => {
    setViewAsRole(role);
    setViewAsProfile(role ? profile : null);
  };
  const clearViewAs = () => setRole(null);
  const isViewingAs = viewAsRole !== null;

  return (
    <ViewAsContext.Provider value={{ viewAsRole, viewAsProfile, setViewAsRole: setRole, isViewingAs, clearViewAs }}>
      {children}
    </ViewAsContext.Provider>
  );
}
