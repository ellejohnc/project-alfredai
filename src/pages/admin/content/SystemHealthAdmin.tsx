import { Activity } from 'lucide-react';
import { GhlHealthCheck } from '@/components/admin/GhlHealthCheck';
import { ConnectorHealth } from '@/components/admin/ConnectorHealth';
import { ContentHealth } from '@/components/admin/ContentHealth';
import { BuildFindings } from '@/components/admin/BuildFindings';
import { usePermissions } from '@/hooks/usePermissions';

/**
 * System Health — is the machinery working?
 *
 * These panels used to sit on the GHL Sync page, which was wrong: that page
 * answers "did this lead reach GoHighLevel", a question about CONTACTS. Whether
 * a cron ran, whether the API still accepts our version header, whether content
 * has gone stale and what faults are outstanding are questions about the
 * SYSTEM, and they were buried under a table of submissions.
 *
 * Split so each page answers one question:
 *   GHL Sync      — every source, and how much of it reached GoHighLevel
 *   System Health — is anything broken, and what do we already know about
 */
export default function SystemHealthAdmin() {
  const { isAdmin } = usePermissions();

  if (!isAdmin) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        System Health is admin-only.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Activity className="h-6 w-6 text-primary" /> System Health
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Scheduled jobs, the GoHighLevel API version, content freshness, and every
          fault found while building — read live, not from a document.
        </p>
      </div>

      {/* Scheduled jobs first: it is the panel most likely to be telling you
          something is on fire right now. */}
      <ConnectorHealth />
      <GhlHealthCheck />
      <ContentHealth />
      <BuildFindings />
    </div>
  );
}
