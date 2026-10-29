import { memo, useState, useCallback } from 'react';
import { Zap, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SALES_EMAIL } from '@/lib/siteConfig';
import { formatQuotePaymentAmountLabel } from '@/lib/quotePaymentAmounts';

interface SlotReservationButtonProps {
  quoteId: string;
  companyName: string | null;
  contactEmail: string | null;
  contactName: string | null;
  amount?: number;
  currency?: string;
}

export const SlotReservationButton = memo(function SlotReservationButton({
  quoteId,
  companyName,
  contactEmail,
  contactName,
  amount = 500000,
  currency = 'aud',
}: SlotReservationButtonProps) {
  const [generating, setGenerating] = useState(false);

  const amountDisplay = formatQuotePaymentAmountLabel({
    baseCents: amount,
    gstCents: currency === 'aud' ? Math.round(amount * 0.1) : 0,
    totalCents: currency === 'aud' ? Math.round(amount * 1.1) : amount,
    currency,
    taxIncluded: currency === 'aud',
  });

  const handleReserveSlot = useCallback(async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-quote-payment-link', {
        body: {
          quoteId,
          companyName: companyName || 'Client',
          contactEmail: contactEmail || undefined,
          contactName: contactName || undefined,
          paymentType: 'slot_reservation',
          amount,
          currency,
        },
      });

      if (error || !data?.url) {
        throw new Error(data?.error || error?.message || 'Failed to create checkout');
      }

      window.location.href = data.url;
    } catch (err) {
      console.error('[SlotReservationButton] Error:', err);
      toast.error('Unable to open payment', {
        description: 'Please try again or contact support.',
        action: {
          label: 'Email Support',
          onClick: () => {
            window.location.href = `mailto:${SALES_EMAIL}?subject=${encodeURIComponent(`Slot Reservation Error - ${quoteId}`)}&body=${encodeURIComponent(`Hi,\n\nI tried to reserve a build slot for proposal ${quoteId} but got an error.\n\nPage: ${window.location.href}\n\nPlease help.\n\nBest regards,\n${contactName || ''}`)}`;
          },
        },
      });
    } finally {
      setGenerating(false);
    }
  }, [quoteId, companyName, contactEmail, contactName, amount, currency]);

  return (
    <div className="mt-4">
      <Button
        onClick={handleReserveSlot}
        disabled={generating}
        className="w-full sm:w-auto min-h-[44px] gap-2"
      >
        {generating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Opening Checkout...
          </>
        ) : (
          <>
            <Zap className="w-4 h-4" />
            Reserve Your Build Slot — {amountDisplay}
            <ExternalLink className="w-4 h-4" />
          </>
        )}
      </Button>
    </div>
  );
});
