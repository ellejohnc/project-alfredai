import { useViewAs } from '@/contexts/ViewAsContext';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Button } from '@/components/ui/button';
import { Eye, X, ArrowLeft, AlertTriangle } from 'lucide-react';
import { AppRole, roleLabels } from '@/lib/rolePermissions';

export default function ViewAsBanner() {
  const { userRole, isLoading } = useAdminAuth();
  const { viewAsRole, setViewAsRole, isViewingAs, clearViewAs } = useViewAs();

  if (isLoading) return null;

  const canUseViewAs = userRole === 'super_admin' || userRole === 'admin';
  if (!canUseViewAs) return null;

  const availableRoles: AppRole[] = userRole === 'super_admin'
    ? ['super_admin', 'admin', 'editor', 'sales_rep']
    : ['admin', 'editor', 'sales_rep'];

  if (isViewingAs) {
    return (
      <>
        {/* Top banner with role switcher and return button */}
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <Eye className="h-4 w-4 shrink-0" />
            <span className="text-sm font-medium">
              Viewing as: <strong>{roleLabels[viewAsRole!]}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {availableRoles.map((role) => (
              <Button
                key={role}
                variant={viewAsRole === role ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewAsRole(role)}
                className={`h-8 text-xs min-w-[72px] touch-manipulation ${
                  viewAsRole === role
                    ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-500'
                    : 'border-amber-500/40 text-amber-700 hover:bg-amber-500/10 dark:text-amber-400'
                }`}
              >
                {roleLabels[role]}
              </Button>
            ))}
            <Button
              variant="default"
              size="sm"
              onClick={clearViewAs}
              className="h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground touch-manipulation min-w-[140px]"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              Return to My View
            </Button>
          </div>
        </div>

        {/* Sticky bottom ribbon indicating imposter mode */}
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <div className="bg-amber-500 text-white px-4 py-1.5 flex items-center justify-center gap-2 shadow-lg">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span className="text-xs font-medium tracking-wide">
              IMPOSTER MODE — Viewing as {roleLabels[viewAsRole!]} (Your actual role: {roleLabels[userRole!]})
            </span>
            <button
              onClick={clearViewAs}
              className="ml-2 text-white/80 hover:text-white transition-colors touch-manipulation p-1"
              aria-label="Exit imposter mode"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </>
    );
  }

  return null;
}
