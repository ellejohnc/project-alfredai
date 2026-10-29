import { ReactNode } from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { usePermissions } from '@/hooks/usePermissions';

export interface LeadAdminAction {
  key: string;
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  /**
   * Extra permission gate on top of admin — e.g. pass `canExportLeads` for an
   * Export button. Defaults to allowed.
   */
  allowed?: boolean;
}

/**
 * The admin-only tools row on a lead page (verify, re-check, export, refresh).
 *
 * Role-gated by construction: non-admins get nothing at all, not a disabled
 * button. A control you can see but never use is just noise — and hiding it
 * means a sales rep's page is genuinely simpler, not merely locked.
 *
 * While "viewing as" another role, a small marker keeps it obvious that this
 * row is admin-only, so testing a role doesn't mislead you.
 */
export function AdminActionsRow({
  actions,
  className,
}: {
  actions: LeadAdminAction[];
  className?: string;
}) {
  const { isAdmin, isViewingAs } = usePermissions();
  if (!isAdmin) return null;

  const visible = actions.filter((a) => a.allowed !== false);
  if (visible.length === 0) return null;

  return (
    <div className={cn('flex min-w-0 flex-wrap items-center gap-2', className)}>
      {isViewingAs && (
        <span className="inline-flex items-center gap-1 rounded-md border border-dashed border-border px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-wider text-muted-foreground">
          <ShieldCheck className="h-3 w-3" />
          Admin only
        </span>
      )}
      <div className="ml-auto flex flex-wrap items-center gap-2">
        {visible.map((a) => (
          <Button
            key={a.key}
            variant="outline"
            size="sm"
            onClick={a.onClick}
            disabled={a.disabled || a.loading}
            className="h-8 gap-1.5 text-xs"
          >
            {a.loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : a.icon}
            {a.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
