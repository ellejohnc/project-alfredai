import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePermissions } from '@/hooks/usePermissions';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserPlus, X, Users, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { roleLabels } from '@/lib/rolePermissions';

interface DistributorUser {
  id: string;
  display_name: string;
  email: string;
}

interface DistributorAssignmentProps {
  /** Logical entity type stored in record_collaborators (e.g. 'lead', 'quote', 'ghl_submission', 'handover') */
  entityType: string;
  /** The record's id */
  entityId: string;
  /** The DB table that holds assigned_distributor_id for this record */
  tableName: 'leads' | 'quotes' | 'ghl_submissions' | 'handover_requests';
  /** Currently assigned distributor id, if known */
  currentAssignedId?: string | null;
  /** Called after the assignment changes */
  onAssignedChange?: (newId: string | null) => void;
  className?: string;
}

const UNASSIGNED = '__unassigned__';
const DISTRIBUTOR_LABEL = roleLabels.distributor;

/**
 * Admin-only control to assign a record to a distributor and manage
 * collaborators. Hidden for non-admins. All errors surface a friendly
 * fallback with a support email containing the page URL.
 */
export function DistributorAssignment({
  entityType,
  entityId,
  tableName,
  currentAssignedId,
  onAssignedChange,
  className,
}: DistributorAssignmentProps) {
  const { isAdmin } = usePermissions();

  const [distributors, setDistributors] = useState<DistributorUser[]>([]);
  const [assignedId, setAssignedId] = useState<string | null>(currentAssignedId ?? null);
  const [collaboratorIds, setCollaboratorIds] = useState<string[]>([]);
  const [pendingCollaborator, setPendingCollaborator] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supportHref = useCallback(
    (context: string) => {
      const subject = encodeURIComponent('CRM assignment error');
      const body = encodeURIComponent(
        `I hit an error while managing ${DISTRIBUTOR_LABEL} assignment.\n\nWhat happened: ${context}\nPage: ${window.location.href}\n\n(Please attach a screenshot)`,
      );
      return `mailto:support@alfredai.bot?subject=${subject}&body=${body}`;
    },
    [],
  );

  useEffect(() => {
    setAssignedId(currentAssignedId ?? null);
  }, [currentAssignedId]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [distRes, assignRes, collabRes] = await Promise.all([
        supabase
          .from('admin_users')
          .select('id, display_name, email')
          .eq('role', 'distributor')
          .order('display_name'),
        supabase.from(tableName).select('assigned_distributor_id').eq('id', entityId).maybeSingle(),
        supabase
          .from('record_collaborators')
          .select('user_id')
          .eq('entity_type', entityType)
          .eq('entity_id', entityId),
      ]);

      if (distRes.error) throw distRes.error;
      if (assignRes.error) throw assignRes.error;
      if (collabRes.error) throw collabRes.error;

      setDistributors(distRes.data || []);
      setAssignedId(
        (assignRes.data as { assigned_distributor_id?: string | null } | null)?.assigned_distributor_id ?? null,
      );
      setCollaboratorIds((collabRes.data || []).map((r) => r.user_id));
    } catch (e) {
      console.error('DistributorAssignment load error:', e);
      setError(`We could not load ${DISTRIBUTOR_LABEL} assignment for this record.`);
    } finally {
      setLoading(false);
    }
  }, [entityId, entityType, tableName]);

  useEffect(() => {
    if (isAdmin && entityId) loadData();
  }, [isAdmin, entityId, loadData]);

  if (!isAdmin) return null;

  const nameFor = (id: string) => {
    const d = distributors.find((x) => x.id === id);
    return d ? d.display_name || d.email : `Unknown ${DISTRIBUTOR_LABEL}`;
  };

  const handleAssign = async (value: string) => {
    const newId = value === UNASSIGNED ? null : value;
    setSaving(true);
    try {
      const { error: updErr } = await supabase
        .from(tableName)
        .update({ assigned_distributor_id: newId })
        .eq('id', entityId);
      if (updErr) throw updErr;
      setAssignedId(newId);
      onAssignedChange?.(newId);
      toast.success(newId ? `Assigned to ${nameFor(newId)}` : 'Assignment cleared');
    } catch (e) {
      console.error('DistributorAssignment assign error:', e);
      toast.error('Could not update the assignment. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddCollaborator = async () => {
    if (!pendingCollaborator) return;
    setSaving(true);
    try {
      const { error: insErr } = await supabase.from('record_collaborators').insert({
        entity_type: entityType,
        entity_id: entityId,
        user_id: pendingCollaborator,
      });
      if (insErr) throw insErr;
      setCollaboratorIds((prev) => [...new Set([...prev, pendingCollaborator])]);
      setPendingCollaborator('');
      toast.success('Collaborator added');
    } catch (e) {
      console.error('DistributorAssignment add collaborator error:', e);
      toast.error('Could not add collaborator. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveCollaborator = async (userId: string) => {
    setSaving(true);
    try {
      const { error: delErr } = await supabase
        .from('record_collaborators')
        .delete()
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .eq('user_id', userId);
      if (delErr) throw delErr;
      setCollaboratorIds((prev) => prev.filter((id) => id !== userId));
      toast.success('Collaborator removed');
    } catch (e) {
      console.error('DistributorAssignment remove collaborator error:', e);
      toast.error('Could not remove collaborator. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={className}>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading {DISTRIBUTOR_LABEL} assignment…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
          <div className="flex items-start gap-2 text-destructive">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={loadData} className="h-8">
              Try again
            </Button>
            <Button size="sm" variant="ghost" asChild className="h-8">
              <a href={supportHref(error)}>Email support</a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (distributors.length === 0) {
    return (
      <div className={className}>
        <p className="text-sm text-muted-foreground">
          No {DISTRIBUTOR_LABEL} accounts exist yet. Create one in User Management to assign records.
        </p>
      </div>
    );
  }

  const availableCollaborators = distributors.filter(
    (d) => d.id !== assignedId && !collaboratorIds.includes(d.id),
  );

  return (
    <div className={className}>
      <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Users className="h-4 w-4 text-primary" />
          {DISTRIBUTOR_LABEL} access
        </div>

        {/* Assigned distributor */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Assigned {DISTRIBUTOR_LABEL}</Label>
          <Select value={assignedId ?? UNASSIGNED} onValueChange={handleAssign} disabled={saving}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Unassigned" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
              {distributors.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.display_name || d.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Collaborators */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Collaborators</Label>
          <div className="flex flex-wrap gap-1.5">
            {collaboratorIds.length === 0 && (
              <span className="text-xs text-muted-foreground">No collaborators</span>
            )}
            {collaboratorIds.map((id) => (
              <Badge key={id} variant="secondary" className="gap-1 pr-1">
                {nameFor(id)}
                <button
                  type="button"
                  onClick={() => handleRemoveCollaborator(id)}
                  disabled={saving}
                  className="rounded-full p-0.5 hover:bg-background/60"
                  aria-label={`Remove ${nameFor(id)}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          {availableCollaborators.length > 0 && (
            <div className="flex items-center gap-2 pt-1">
              <Select value={pendingCollaborator} onValueChange={setPendingCollaborator} disabled={saving}>
                <SelectTrigger className="h-9 flex-1">
                  <SelectValue placeholder="Add collaborator…" />
                </SelectTrigger>
                <SelectContent>
                  {availableCollaborators.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.display_name || d.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                variant="outline"
                className="h-9"
                onClick={handleAddCollaborator}
                disabled={saving || !pendingCollaborator}
              >
                <UserPlus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
