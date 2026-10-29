import { memo, useState, useMemo, useCallback } from 'react';
import { CreditCard, ExternalLink, AlertTriangle, Mail, Lock, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { SALES_EMAIL } from '@/lib/siteConfig';
import { formatQuotePaymentAmountLabel, normalizeQuotePaymentAmount } from '@/lib/quotePaymentAmounts';
import { toast } from 'sonner';
import { isVirtualPaymentLink } from '@/lib/proposalSlotReservation';

export interface PaymentLinkItem {
  id: string;
  payment_type: string;
  amount: number;
  currency: string;
  payment_link_url: string | null;
  installment_type?: string | null;
  status: string;
  client_confirmed_at?: string | null;
  completed_at?: string | null;
}

// Derive a display key from payment_type + installment_type
// DB stores installments as payment_type='setup_fee' with installment_type='initiation'|'month1'|'month2'|'month3'|'full'
const getDisplayKey = (link: PaymentLinkItem): string => {
  if (link.payment_type === 'setup_fee' && link.installment_type) {
    switch (link.installment_type) {
      case 'initiation': return 'setup_initiation';
      case 'month1': return 'setup_month1';
      case 'month2': return 'setup_month2';
      case 'month3': return 'setup_month3';
      case 'second': return 'setup_second';
      case 'balance': return 'setup_balance';
      case 'full': return 'setup_fee';
      default: return 'setup_fee';
    }
  }
  return link.payment_type;
};

interface SequentialPaymentListProps {
  paymentLinks: PaymentLinkItem[];
  quoteId: string;
  companyName?: string;
  contactName?: string;
  contactEmail?: string;
  currency?: string;
  /** Admin mode: allows marking payments as paid/unpaid directly on the proposal */
  isAdmin?: boolean;
  onPaymentsChanged?: () => void | Promise<void>;
}

// Fixed payment order
const PAYMENT_ORDER: string[] = [
  'slot_reservation',
  'setup_initiation',
  'setup_second',
  'setup_month1',
  'setup_month2',
  'setup_month3',
  'setup_balance',
  'setup_fee',
  'monthly_retainer',
];

const paymentTypeLabels: Record<string, string> = {
  'slot_reservation': 'Production Slot Reservation',
  'setup_fee': 'Setup Fee (less deposit)',
  'setup_initiation': 'Project Initiation (50% less deposit)',
  'setup_second': 'Second Payment',
  'setup_month1': 'Month 1 Payment (20%)',
  'setup_month2': 'Month 2 Payment (20%)',
  'setup_month3': 'Final Payment (10%)',
  'setup_balance': 'Final Balance Payment',
  'monthly_retainer': 'Monthly Retainer',
};


const getCurrencySymbol = (currency: string): string => {
  const symbols: Record<string, string> = {
    'aud': 'A$', 'usd': '$', 'gbp': '£', 'eur': '€',
  };
  return symbols[currency.toLowerCase()] || '$';
};

export const SequentialPaymentList = memo(function SequentialPaymentList({
  paymentLinks,
  quoteId,
  companyName,
  contactName,
  contactEmail,
  currency: defaultCurrency,
  isAdmin = false,
  onPaymentsChanged,
}: SequentialPaymentListProps) {
  // Track optimistic confirmations (payment id -> true)
  const [optimisticConfirmed, setOptimisticConfirmed] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [generatingPayment, setGeneratingPayment] = useState<string | null>(null);
  // Admin-side settled overrides (payment id -> paid?) for instant feedback
  const [adminSettled, setAdminSettled] = useState<Record<string, boolean>>({});
  const [adminSaving, setAdminSaving] = useState<string | null>(null);

  // Deduplicate and sort payment links by fixed order using display key
  const sortedLinks = useMemo(() => {
    const orderMap = new Map(PAYMENT_ORDER.map((type, i) => [type, i]));
    // Deduplicate by composite key (last entry wins)
    const deduped = new Map<string, PaymentLinkItem>();
    for (const link of paymentLinks) {
      deduped.set(getDisplayKey(link), link);
    }
    return Array.from(deduped.values()).sort((a, b) => {
      const aOrder = orderMap.get(getDisplayKey(a)) ?? 99;
      const bOrder = orderMap.get(getDisplayKey(b)) ?? 99;
      return aOrder - bOrder;
    });
  }, [paymentLinks]);

  // Determine which are confirmed (DB or optimistic)
  const isConfirmed = useCallback((link: PaymentLinkItem) => {
    if (adminSettled[link.id] === true) return true;
    if (adminSettled[link.id] === false) return false;
    return !!(link.client_confirmed_at || link.completed_at || optimisticConfirmed[link.id]);
  }, [optimisticConfirmed, adminSettled]);

  // Admin: tick a payment off (or undo) — writes straight to quote_payments
  // (admin-only RLS policy). Falls back to a clear error + email path.
  const handleAdminTogglePaid = useCallback(async (link: PaymentLinkItem, paid: boolean) => {
    if (isVirtualPaymentLink(link.id)) {
      toast.error('Generate this payment link first', {
        description: 'This stage has no payment record yet.',
      });
      return;
    }
    setAdminSaving(link.id);
    setAdminSettled(prev => ({ ...prev, [link.id]: paid }));
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('quote_payments')
        .update(
          paid
            ? { status: 'completed', completed_at: now, client_confirmed_at: now }
            : { status: 'pending', completed_at: null, client_confirmed_at: null },
        )
        .eq('id', link.id);

      if (error) throw error;
      toast.success(paid ? 'Marked as paid' : 'Marked as unpaid');
      await onPaymentsChanged?.();
    } catch (err) {
      console.error('[SequentialPaymentList] Admin toggle failed:', err);
      setAdminSettled(prev => {
        const next = { ...prev };
        delete next[link.id];
        return next;
      });
      toast.error("Couldn't update payment status", {
        description: 'Sign in to the admin dashboard and try again, or email us.',
        action: {
          label: 'Email Support',
          onClick: () => {
            window.location.href = `mailto:${SALES_EMAIL}?subject=${encodeURIComponent(`Payment status update failed - ${quoteId}`)}&body=${encodeURIComponent(`Payment: ${link.payment_type} (${link.id})\nProposal: ${quoteId}\nPage: ${window.location.href}`)}`;
          },
        },
      });
    } finally {
      setAdminSaving(null);
    }
  }, [onPaymentsChanged, quoteId]);


  // Count confirmed
  const confirmedCount = useMemo(() => {
    return sortedLinks.filter(isConfirmed).length;
  }, [sortedLinks, isConfirmed]);

  const progressPercent = sortedLinks.length > 0
    ? Math.round((confirmedCount / sortedLinks.length) * 100)
    : 0;

  // Check if slot reservation is missing
  const hasSlotReservation = useMemo(() => {
    return sortedLinks.some(l => l.payment_type === 'slot_reservation');
  }, [sortedLinks]);

  const handleConfirm = useCallback(async (paymentId: string) => {
    setSaving(paymentId);
    // Optimistic update
    setOptimisticConfirmed(prev => ({ ...prev, [paymentId]: true }));

    try {
      // Use SECURITY DEFINER RPC: only flips client_confirmed_at.
      // Avoids exposing UPDATE on quote_payments to the public.
      const { error } = await supabase
        .rpc('confirm_quote_payment' as any, { p_payment_id: paymentId });

      if (error) throw error;
      toast.success('Payment confirmed — thank you!');
    } catch (err) {
      console.error('[SequentialPaymentList] Confirmation save failed:', err);
      // Rollback optimistic update
      setOptimisticConfirmed(prev => {
        const next = { ...prev };
        delete next[paymentId];
        return next;
      });
      toast.error('Failed to save confirmation', {
        description: 'Please try again or contact support.',
        action: {
          label: 'Email Support',
          onClick: () => {
            window.location.href = `mailto:${SALES_EMAIL}?subject=${encodeURIComponent(`Payment Confirmation Error - ${quoteId}`)}&body=${encodeURIComponent(`Hi,\n\nI tried to confirm a payment on my proposal but it failed.\n\nProposal: ${quoteId}\nPage: ${window.location.href}\n\nPlease help.\n\nBest regards,\n${contactName || ''}`)}`;
          },
        },
      });
    } finally {
      setSaving(null);
    }
  }, [quoteId, contactName]);

  // Generate a fresh Stripe Checkout Session on-demand (avoids 24h expiry issue)
  const handlePayNow = useCallback(async (link: PaymentLinkItem) => {
    const displayKey = getDisplayKey(link);
    setGeneratingPayment(link.id);
    try {
      let paymentType: string = link.payment_type;
      if (link.payment_type === 'setup_fee' && link.installment_type && link.installment_type !== 'full') {
        paymentType = `setup_${link.installment_type}`;
      }

      const normalizedAmounts = normalizeQuotePaymentAmount({
        amountCents: link.amount,
        currency: link.currency,
        paymentType: link.payment_type,
      });

      const { data, error } = await supabase.functions.invoke('create-quote-payment-link', {
        body: {
          quoteId,
          companyName: companyName || 'Client',
          contactEmail: contactEmail || undefined,
          contactName: contactName || undefined,
          paymentType,
          amount: normalizedAmounts.baseCents,
          currency: (link.currency || defaultCurrency || 'aud').toLowerCase(),
        },
      });

      if (error || !data?.url) {
        throw new Error(data?.error || error?.message || 'Failed to create payment session');
      }

      window.location.href = data.url;
    } catch (err) {
      console.error('[SequentialPaymentList] On-demand payment error:', err);
      toast.error('Unable to open payment', {
        description: 'Please try again or contact support.',
        action: {
          label: 'Email Support',
          onClick: () => {
            window.location.href = `mailto:${SALES_EMAIL}?subject=${encodeURIComponent(`Payment Error - ${quoteId}`)}&body=${encodeURIComponent(`Hi,\n\nI tried to pay "${paymentTypeLabels[displayKey] || link.payment_type}" on proposal ${quoteId} but got an error.\n\nPage: ${window.location.href}\n\nPlease help.\n\nBest regards,\n${contactName || ''}`)}`;
          },
        },
      });
    } finally {
      setGeneratingPayment(null);
    }
  }, [quoteId, companyName, contactEmail, contactName, defaultCurrency]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 justify-center text-foreground">
        <CreditCard className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-lg">Next Steps: Complete Payment</h3>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">
            {confirmedCount} of {sortedLinks.length} payment{sortedLinks.length !== 1 ? 's' : ''} confirmed
          </span>
          <span className="font-medium text-primary">{progressPercent}%</span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      {/* Slot Reservation Missing Fallback */}
      {!hasSlotReservation && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-2">
            <p className="font-medium text-sm text-amber-800 dark:text-amber-300">
              Slot Reservation payment link unavailable
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Please contact our team to complete this payment.
            </p>
            <a
              href={`mailto:${SALES_EMAIL}?subject=${encodeURIComponent(`Slot Reservation - Quote ${quoteId}`)}&body=${encodeURIComponent(`Hi alfred ai Team,\n\nI've signed proposal ${quoteId} for ${companyName || 'our company'}, but the Slot Reservation deposit payment link is unavailable.\n\nPage: ${window.location.href}\n\nPlease send me the payment link.\n\nBest regards,\n${contactName || ''}`)}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline min-h-[44px] py-2"
            >
              <Mail className="w-4 h-4" />
              Contact Sales
            </a>
          </div>
        </div>
      )}

      {/* Payment Cards */}
      <div className="space-y-3">
        {sortedLinks.map((link, index) => {
          const confirmed = isConfirmed(link);
          // A card is active if all previous are confirmed
          const allPriorConfirmed = sortedLinks.slice(0, index).every(isConfirmed);
          const isActive = !confirmed && (allPriorConfirmed || isAdmin);
          const isLocked = !confirmed && !isActive;
          const isSaving = saving === link.id;
          // Settled = actually paid through Stripe. A client self-confirmation
          // must never remove access to the payment link.
          const isSettled = adminSettled[link.id] === true || !!link.completed_at;


          const displayKey = getDisplayKey(link);
          const label = paymentTypeLabels[displayKey] || link.payment_type;
          const isRecurring = link.payment_type === 'monthly_retainer';
          const isSlotReservation = link.payment_type === 'slot_reservation';
          const normalizedAmounts = normalizeQuotePaymentAmount({
            amountCents: link.amount,
            currency: link.currency,
            paymentType: link.payment_type,
          });
          const formattedAmount = formatQuotePaymentAmountLabel(normalizedAmounts, { recurring: isRecurring });

          return (
            <Card
              key={link.id}
              className={`overflow-hidden transition-opacity ${isLocked ? 'opacity-50' : ''} ${
                isSlotReservation && isActive ? 'ring-2 ring-primary border-primary' : ''
              }`}
            >
              <div className="p-4 space-y-3">
                {/* Top row: checkbox/lock + label + amount */}
                <div className="flex items-start gap-3">
                  {/* Status indicator */}
                  <div className="pt-0.5 shrink-0">
                    {confirmed ? (
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    ) : isLocked ? (
                      <Lock className="w-5 h-5 text-muted-foreground" />
                    ) : isVirtualPaymentLink(link.id) ? (
                      // Synthesised card (no DB row yet) — cannot be self-confirmed
                      <CreditCard className="w-5 h-5 text-primary" />
                    ) : (
                      <Checkbox
                        checked={false}
                        disabled={isSaving}
                        onCheckedChange={() => handleConfirm(link.id)}
                        className="h-6 w-6 rounded-md min-h-[44px] min-w-[44px] flex items-center justify-center"
                        aria-label={`Confirm ${label} payment`}
                      />
                    )}

                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground">{label}</p>
                    {isSlotReservation && isActive && (
                      <p className="text-xs font-semibold text-primary mt-0.5">⚡ Pay this first to reserve your build slot</p>
                    )}
                    <p className="text-lg font-semibold text-primary">{formattedAmount}</p>
                    {confirmed && (
                      <p className="text-xs text-green-600 mt-1">
                        {isSettled ? 'Paid — Thank you!' : 'Marked as paid — link stays available'}
                      </p>
                    )}
                    {isLocked && (
                      <p className="text-xs text-muted-foreground mt-1">Complete previous payment first</p>
                    )}
                  </div>
                </div>

                {/* Pay Now button - generates fresh checkout session on-demand.
                    Stays available for confirmed-but-unsettled payments so the
                    client can always pay (e.g. the PoC slot reservation). */}
                {(isActive || (confirmed && !isSettled)) && (
                  <Button
                    onClick={() => handlePayNow(link)}
                    disabled={generatingPayment === link.id}
                    variant={isActive ? 'default' : 'outline'}
                    className="w-full min-h-[44px] gap-2"
                  >
                    {generatingPayment === link.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Opening Checkout...
                      </>
                    ) : (
                      <>
                        {isActive ? 'Pay Now' : 'Pay Online'}
                        <ExternalLink className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                )}

                {/* Admin tick-off: mark this stage paid / unpaid */}
                {isAdmin && !isVirtualPaymentLink(link.id) && (
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-dashed">
                    <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Admin</span>
                    <Button
                      onClick={() => handleAdminTogglePaid(link, !isSettled)}
                      disabled={adminSaving === link.id}
                      variant={isSettled ? 'ghost' : 'secondary'}
                      size="sm"
                      className="min-h-[44px] gap-1.5 text-xs"
                    >
                      {adminSaving === link.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      {isSettled ? 'Mark as unpaid' : 'Mark as paid'}
                    </Button>
                  </div>
                )}
              </div>
            </Card>

          );
        })}
      </div>
    </div>
  );
});
