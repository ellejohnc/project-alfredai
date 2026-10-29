import { createContext, useContext } from 'react';
import { AppRole } from '@/lib/rolePermissions';
export interface ViewAsProfile {
  userId: string;
  email?: string | null;
  displayName?: string | null;
}

interface ViewAsContextType {
  viewAsRole: AppRole | null;
  viewAsProfile: ViewAsProfile | null;
  setViewAsRole: (role: AppRole | null, profile?: ViewAsProfile | null) => void;
  isViewingAs: boolean;
  clearViewAs: () => void;
}

export const ViewAsContext = createContext<ViewAsContextType | undefined>(undefined);

export function useViewAs() {
  const context = useContext(ViewAsContext);
  if (!context) {
    throw new Error('useViewAs must be used within a ViewAsProvider');
  }
  return context;
}
