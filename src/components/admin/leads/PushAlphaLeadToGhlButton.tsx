import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Cloud, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { UnifiedLead } from '@/lib/unifiedLead';
import { cn } from '@/lib/utils';

/**
 * PushAlphaLeadToGhlButton — manual "Push to GHL" for Alpha Digital (LinkedIn
 * outbound) leads. Renders only for source `alpha_digital_leads` with no
 * existing GHL contact id. Calls the `push-alpha-lead-to-ghl` edge function,
 * which creates/links the contact and (if the "Alpha Digital" pipeline exists
 * in GHL) attaches an opportunity.
 *
 * Sends `require_email: false` DELIBERATELY. The edge function defaults that
 * flag to TRUE so no new caller can quietly create another emailless contact
 * the way the batch runner did — 25 of the 26 Alpha contacts in GoHighLevel
 * have no email because of it. But this button is one person choosing one
 * named lead they are looking at, and roughly 2,948 of 3,766 Alpha rows have
 * no email at all: these are LinkedIn outbound prospects and the profile URL
 * IS the channel. Defaulting the guard on here took that away and returned a
 * red toast with nothing to click instead.
 *
 * The guard belongs on the thing that pushes hundreds unattended, not on the
 * one-at-a-time action. The toast says when a contact went over without an
 * email so it is visible rather than silent.
 */
export function PushAlphaLeadToGhlButton({
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

  const eligible = lead.source === 'alpha_digital_leads' && !lead.ghl_contact_id;
  if (!eligible) return null;

  const onClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke('push-alpha-lead-to-ghl', {
        body: { alpha_lead_id: lead.id, require_email: false },
      });
      if (error || !data?.success) {
        throw new Error(error?.message || data?.error || 'Push failed');
      }
      if (data.alreadyPushed) {
        toast.success('Already in GHL — refreshed');
      } else if (data.warning) {
        toast.success('Contact created in GHL', { description: data.warning });
      } else if (data.opportunity_id) {
        toast.success('Pushed to GHL — contact + opportunity created');
      } else {
        toast.success(data.linked ? 'Linked to existing GHL contact' : 'Contact created in GHL', {
          description: lead.email ? undefined : 'This lead has no email address — LinkedIn is the only channel.',
        });
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
            const subject = encodeURIComponent(`Alpha Digital push failed — ${lead.name}`);
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
      disabled={busy}
      title="Create the GHL contact and Alpha Digital opportunity for this LinkedIn lead"
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
