import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Cloud, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { UnifiedLead } from '@/lib/unifiedLead';
import { isIncomplete } from '@/lib/leadSegments';
import { cn } from '@/lib/utils';

/**
 * PushToGhlButton — force-creates a GHL contact from an Incomplete
 * ghl_submissions lead (booking flow started but never completed). Only renders
 * when the lead qualifies (source = ghl_submissions, no ghl_contact_id yet,
 * has an email or phone). After success the lead has a ghl_contact_id, so
 * isIncomplete() drops it and the inbox reclassifies it (Website / Booked).
 */
export function PushToGhlButton({
  lead,
  size = 'sm',
  variant = 'default',
  className,
  fullWidth,
}: {
  lead: UnifiedLead;
  size?: 'sm' | 'default';
  variant?: 'default' | 'outline' | 'secondary';
  className?: string;
  fullWidth?: boolean;
}) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);

  const eligible = lead.source === 'ghl_submissions'
    && !lead.ghl_contact_id
    && !(lead._merged ?? []).some((m) => m.ghl_contact_id)
    && isIncomplete(lead);
  const hasContact = !!(lead.email || lead.phone);
  if (!eligible) return null;

  const disabled = busy || !hasContact;

  const onClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke('push-lead-to-ghl', {
        body: { submission_id: lead.id },
      });
      if (error || !data?.success) {
        throw new Error(error?.message || data?.error || 'Push failed');
      }
      if (data.alreadyLinked) {
        toast.success('Already in GHL — refreshed');
      } else if (data.linked) {
        toast.success('Linked to existing GHL contact');
      } else {
        toast.success('Pushed to GHL — contact created');
      }
      // Refetch everything the inbox / detail page reads.
      qc.invalidateQueries({ queryKey: ['unified-leads'] });
      qc.invalidateQueries({ queryKey: ['lead-overlay'] });
      qc.invalidateQueries({ queryKey: ['ghl-lead'] });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Push to GHL failed`, { description: msg.slice(0, 200) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      size={size}
      variant={variant}
      onClick={onClick}
      disabled={disabled}
      title={!hasContact ? 'Needs an email or phone before it can be pushed' : 'Force-create the GHL contact from captured details'}
      className={cn(
        'gap-2 whitespace-nowrap justify-center',
        // Only apply defaults when no explicit className was passed so callers
        // (e.g. lead-record header LEAD_ACTION_BTN) can enforce uniform sizing.
        !className && (size === 'sm' ? 'h-10 px-3.5 text-sm' : 'h-10 px-4'),
        !className && fullWidth && 'flex-1 sm:flex-none min-w-[9rem]',
        className,
      )}
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Cloud className="h-4 w-4" />}
      Push to GHL
    </Button>
  );
}
