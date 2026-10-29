import { AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const SUPPORT_EMAIL = 'hello@alfredai.bot';

interface LeadPanelErrorStateProps {
  /** Human-friendly message explaining what failed. */
  message?: string;
  /** Short label used in the support email subject, e.g. "Demo leads". */
  panelName: string;
}

/**
 * Shared load-error fallback for every admin lead panel.
 *
 * Follows the project rule: always inform the user of the error, keep them
 * unblocked, and offer a one-click way to email us with the page URL +
 * screenshot guidance. Mobile-first: the mail link is a ≥44px touch target.
 */
export function LeadPanelErrorState({
  message = 'We could not load these leads right now. Please refresh, or email us if it keeps happening.',
  panelName,
}: LeadPanelErrorStateProps) {
  const pageUrl = typeof window !== 'undefined' ? window.location.href : '';
  const mailHref = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
    `${panelName} error`,
  )}&body=${encodeURIComponent(
    `Page: ${pageUrl}\n\nPlease describe what happened and attach a screenshot.`,
  )}`;

  return (
    <Card className="border-destructive/40 bg-destructive/5">
      <CardContent className="py-5 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
        <div className="text-sm">
          <p className="font-medium">{message}</p>
          <a
            href={mailHref}
            className="text-primary underline mt-2 inline-flex items-center min-h-[44px]"
          >
            Email us about this error
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

export default LeadPanelErrorState;
