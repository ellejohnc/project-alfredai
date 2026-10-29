import { useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Mail, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SALES_EMAIL } from '@/lib/siteConfig';

const paymentTypeLabels: Record<string, string> = {
  slot: 'Production Slot Reservation',
  slot_reservation: 'Production Slot Reservation',
  setup_fee: 'Setup Fee',
  setup_initiation: 'Project Initiation',
  setup_month1: 'Month 1 Payment',
  setup_month2: 'Month 2 Payment',
  setup_month3: 'Final Payment',
  monthly_retainer: 'Monthly Retainer',
};

export default function PaymentThankYou() {
  const [searchParams] = useSearchParams();
  const paymentType = searchParams.get('type') || '';
  const quoteId = searchParams.get('quote') || '';

  const label = useMemo(() => {
    return paymentTypeLabels[paymentType] || 'Payment';
  }, [paymentType]);

  useEffect(() => {
    document.title = 'Payment Confirmed — alfred ai';
  }, []);

  const proposalUrl = quoteId ? `/proposal/${quoteId}` : null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-lg w-full p-8 text-center space-y-6">
        {/* Success icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            Thank You for Your Payment!
          </h1>
          <p className="text-muted-foreground">
            Your <span className="font-semibold text-foreground">{label}</span> payment has been received successfully.
          </p>
        </div>

        {/* What's next */}
        <div className="bg-muted/50 rounded-xl p-5 text-left space-y-3">
          <h2 className="font-semibold text-foreground text-sm">What happens next?</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
              <span>You'll receive a payment confirmation email shortly</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
              <span>Our team will be in touch within 24 hours</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
              <span>Your receipt and invoice are on their way to your inbox</span>
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-2">
          {proposalUrl && (
            <Button asChild className="w-full min-h-[44px] gap-2">
              <Link to={proposalUrl}>
                Return to Proposal
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          )}

          <Button asChild variant="outline" className="w-full min-h-[44px] gap-2">
            <Link to="/">
              <Home className="w-4 h-4" />
              Back to Home
            </Link>
          </Button>

          <a
            href={`mailto:${SALES_EMAIL}?subject=${encodeURIComponent(`Payment Query - Quote ${quoteId}`)}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors min-h-[44px]"
          >
            <Mail className="w-4 h-4" />
            Questions? Contact us
          </a>
        </div>
      </Card>
    </div>
  );
}
