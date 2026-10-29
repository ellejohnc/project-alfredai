import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Cloud, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { UnifiedLead } from '@/lib/unifiedLead';
import { isB2bMatchmaking } from '@/lib/leadSegments';
import { cn } from '@/lib/utils';

/**
 * PushB2bLeadToGhlButton — manual "Push to GHL" for B2B Matchmaking replies
 * (source_campaign = 'alfred_b2b_matchmaking'). Same styling/placement as the
 * Alpha push button. Hidden once the lead has a ghl_contact_id (the "View in
 * GHL" affordance takes over).
 */
export function PushB2bLeadToGhlButton({
  lead,
  size = 'sm',
  variant = 'default',
  className,
}: {
  lead: UnifiedLead;
  size?: 'sm' | 'default';
  variant?: 'default' | 'outline' | 'secondary';
  className?: string;
}) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);

  const eligible =
    lead.source === 'leads' &&
    isB2bMatchmaking(lead) &&
    !lead.ghl_contact_id;
  if (!eligible) return null;

  const hasContact = !!(lead.email || lead.phone);
  const disabled = busy || !hasContact;

  const onClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke('push-b2b-lead-to-ghl', {
        body: { lead_id: lead.id },
      });
      if (error || !data?.success) {
        throw new Error(error?.message || data?.error || 'Push failed');
      }
      if (data.alreadyPushed) {
        toast.success('Already in GHL — refreshed');
      } else if (data.warning) {
        toast.success(
          data.linked ? 'Linked to existing GHL contact' : 'Contact created in GHL',
          { description: String(data.warning).slice(0, 300) },
        );
      } else if (data.opportunity_id) {
        toast.success('Pushed to GHL — contact + opportunity created');
      } else {
        toast.success(data.linked ? 'Linked to existing GHL contact' : 'Contact created in GHL');
      }
      qc.invalidateQueries({ queryKey: ['unified-leads'] });
      qc.invalidateQueries({ queryKey: ['lead-overlay'] });
      qc.invalidateQueries({ queryKey: ['ghl-lead'] });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error('Push to GHL failed', {
        description: msg.slice(0, 240),
        action: {
          label: 'Email support',
          onClick: () => {
            const subject = encodeURIComponent(`B2B Matchmaking push failed — ${lead.name}`);
            const body = encodeURIComponent(
              `Lead: ${lead.name}\nID: ${lead.id}\nURL: ${window.location.href}\nError: ${msg}`,
            );
            window.location.href = `mailto:support@alfredai.bot?subject=${subject}&body=${body}`;
          },
        },
      });
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
      title={
        !hasContact
          ? 'Needs an email or phone before it can be pushed'
          : 'Create the GHL contact + B2B Matchmaking opportunity from this reply'
      }
      className={cn(
        'gap-2 whitespace-nowrap justify-center min-h-[44px]',
        !className && (size === 'sm' ? 'h-10 px-3.5 text-sm' : 'h-10 px-4'),
        className,
      )}
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Cloud className="h-4 w-4" />}
      Push to GHL
    </Button>
  );
}
