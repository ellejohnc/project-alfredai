import { memo, useState, useMemo } from 'react';
import { MessageSquare, Share2, Copy, Check, ExternalLink, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ProposalSignature } from './ProposalSignature';
import { SequentialPaymentList, type PaymentLinkItem } from './SequentialPaymentList';
import { PRODUCTION_URL, SALES_EMAIL } from '@/lib/siteConfig';
import { withSlotReservationFallback } from '@/lib/proposalSlotReservation';
import { toast } from 'sonner';

interface ProposalActionsProps {
  quoteId: string;
  accessCode: string;
  companyName?: string;
  contactName?: string;
  contactEmail?: string;
  setupFee?: string | null;
  monthlyRetainer?: string | null;
  paymentLinks?: PaymentLinkItem[] | null;
  /** Quote requires a PoC / production slot reservation (quotes.poc_requested) */
  pocRequested?: boolean;
  /** Slot reservation amount in dollars (base, excl. GST) */
  slotReservationAmount?: number;

  isSigned?: boolean;
  /** Signed-in admin (or password-verified) — enables tick-off controls */
  isAdmin?: boolean;
  /** Called after an admin marks a payment paid/unpaid so links can refresh */
  onPaymentsChanged?: () => void | Promise<void>;
  onSignSuccess: () => void;
}

export const ProposalActions = memo(function ProposalActions({
  quoteId,
  accessCode,
  companyName,
  contactName,
  contactEmail,
  setupFee,
  monthlyRetainer,
  paymentLinks,
  pocRequested,
  slotReservationAmount = 5000,
  isSigned,
  isAdmin,
  onPaymentsChanged,
  onSignSuccess
}: ProposalActionsProps) {
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  const [contactMessage, setContactMessage] = useState('');

  const slotCurrency = paymentLinks?.find(l => l.payment_type === 'slot_reservation')?.currency || 'aud';

  /**
   * Fallback: if the quote requires a PoC slot reservation but no
   * slot_reservation payment row exists (links never generated, regenerated
   * without it, or filtered out), synthesise a virtual card so the client can
   * still pay — a fresh Stripe session is created on demand anyway.
   */
  const effectivePaymentLinks = useMemo(
    () =>
      withSlotReservationFallback(paymentLinks, {
        pocRequested,
        amountDollars: slotReservationAmount,
        currency: slotCurrency,
      }) as PaymentLinkItem[],
    [paymentLinks, pocRequested, slotReservationAmount, slotCurrency],
  );



  const proposalUrl = `${PRODUCTION_URL}/proposal/${quoteId}`;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(proposalUrl);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleSendRequest = () => {
    const subject = encodeURIComponent(`Proposal ${quoteId} - Change Request`);
    const body = encodeURIComponent(
      `Hi alfred ai Team,\n\nRegarding proposal ${quoteId} for ${companyName || 'our company'}:\n\n${contactMessage}\n\nBest regards,\n${contactName || ''}`
    );
    window.location.href = `mailto:${SALES_EMAIL}?subject=${subject}&body=${body}`;
    setShowContactDialog(false);
    setContactMessage('');
  };

  return (
    <div className="space-y-4">
      {/* Primary CTA - Sign or Signed Status */}
      {!isSigned ? (
        <>
          {/* Signature section */}
          <ProposalSignature
            quoteId={quoteId}
            accessCode={accessCode}
            companyName={companyName}
            contactName={contactName}
            contactEmail={contactEmail}
            setupFee={setupFee}
            monthlyRetainer={monthlyRetainer}
            onSuccess={onSignSuccess}
          />
        </>
      ) : (
        <div className="space-y-6">
          {/* Success Message */}
          <div className="flex items-center justify-center gap-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-xl py-4 px-6">
            <Check className="w-5 h-5" />
            <span className="font-medium">Proposal Accepted — We'll be in touch shortly</span>
          </div>

          {/* Sequential Payment Links */}
          {effectivePaymentLinks.length > 0 ? (
            <SequentialPaymentList
              paymentLinks={effectivePaymentLinks}

              quoteId={quoteId}
              companyName={companyName}
              contactName={contactName}
              contactEmail={contactEmail}
              currency={slotCurrency}
              isAdmin={isAdmin}
              onPaymentsChanged={onPaymentsChanged}
            />
          ) : (
            <div className="text-center text-sm text-muted-foreground p-4 border border-dashed rounded-lg">
              <p>Payment links will be sent to your email shortly.</p>
              <p className="mt-1">
                Questions? Contact us at{' '}
                <a href={`mailto:${SALES_EMAIL}`} className="text-primary underline">
                  {SALES_EMAIL}
                </a>
              </p>
            </div>
          )}
        </div>
      )}

      {/* Secondary Actions - Only show when NOT signed */}
      {!isSigned && (
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            variant="outline" 
            className="flex-1 gap-2 min-h-[44px]"
            onClick={() => setShowShareDialog(true)}
          >
            <Share2 className="w-4 h-4" />
            Share with Team
          </Button>
        </div>
      )}

      {/* Request Changes */}
      <button 
        type="button"
        className="w-full flex items-center justify-center gap-2 min-h-[44px] text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 hover:no-underline transition-colors"
        onClick={() => setShowContactDialog(true)}
      >
        <MessageSquare className="w-4 h-4" />
        Have questions or need changes?
      </button>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share This Proposal</DialogTitle>
            <DialogDescription>
              Share this proposal with colleagues or stakeholders. They'll need the access code to view it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Proposal Link</Label>
              <div className="flex gap-2">
                <Input 
                  value={proposalUrl} 
                  readOnly 
                  className="font-mono text-sm"
                />
                <Button variant="outline" size="icon" onClick={handleCopyUrl} className="min-w-[44px]">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Access Code</Label>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-muted rounded-lg p-3">
                  <span className="font-mono text-lg font-bold tracking-wider">{accessCode}</span>
                </div>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(accessCode);
                      toast.success('Access code copied');
                    } catch {
                      toast.error('Failed to copy code');
                    }
                  }} 
                  className="min-w-[44px]"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                For security, share this code separately from the link.
              </p>
            </div>
            <Button 
              className="w-full min-h-[44px]"
              onClick={() => { window.location.href = proposalUrl; }}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Proposal
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contact Dialog */}
      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Questions or Change Requests</DialogTitle>
            <DialogDescription>
              We're here to help. Let us know what you'd like to discuss and we'll get back to you promptly.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Your Message</Label>
              <Textarea
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                placeholder="What would you like to discuss? Any questions about scope, timeline, or pricing?"
                rows={4}
                className="resize-none"
              />
            </div>
            <Button 
              className="w-full min-h-[44px]" 
              onClick={handleSendRequest}
              disabled={!contactMessage.trim()}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Send Message
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
});
