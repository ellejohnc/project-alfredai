import { AlertTriangle, Mail, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SUPPORT_EMAIL, normalizeUrl } from '@/lib/siteConfig';

interface AdminErrorBannerProps {
  /**
   * The error message to display.
   */
  error: string | Error | null;
  /**
   * Optional context about what operation failed (e.g., "loading leads", "syncing data").
   */
  context?: string;
  /**
   * Optional retry callback. If provided, a "Retry" button will be shown.
   */
  onRetry?: () => void;
  /**
   * Whether a retry is currently in progress.
   */
  isRetrying?: boolean;
  /**
   * Optional additional metadata to include in the support email.
   */
  metadata?: Record<string, string | number | boolean | undefined>;
}

/**
 * A robust fallback banner for admin pages that displays errors with
 * a one-tap "Email support" button including page URL and diagnostic info.
 */
export function AdminErrorBanner({
  error,
  context,
  onRetry,
  isRetrying = false,
  metadata,
}: AdminErrorBannerProps) {
  if (!error) return null;

  const errorMessage = typeof error === 'string' ? error : error.message || 'An unknown error occurred';
  const errorStack = typeof error === 'object' && error.stack ? error.stack : undefined;

  const handleEmailSupport = () => {
    const pageUrl = normalizeUrl(window.location.href);
    const subject = encodeURIComponent(`Issue: ${context || 'Admin page error'}`);

    const bodyParts = [
      'Hi team,',
      '',
      `An error occurred on this page:`,
      pageUrl,
      '',
      `Error: ${errorMessage}`,
    ];

    if (context) {
      bodyParts.push(`Context: ${context}`);
    }

    if (metadata && Object.keys(metadata).length > 0) {
      bodyParts.push('');
      bodyParts.push('Additional Info:');
      Object.entries(metadata).forEach(([key, value]) => {
        if (value !== undefined) {
          bodyParts.push(`  ${key}: ${value}`);
        }
      });
    }

    if (errorStack) {
      bodyParts.push('');
      bodyParts.push('Stack trace:');
      bodyParts.push(errorStack.slice(0, 500)); // Limit stack length for email
    }

    bodyParts.push('');
    bodyParts.push('Please include a screenshot of the page with the error visible.');
    bodyParts.push('');
    bodyParts.push(`Browser: ${navigator.userAgent}`);
    bodyParts.push(`Time: ${new Date().toISOString()}`);

    const body = encodeURIComponent(bodyParts.join('\n'));
    window.open(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`);
  };

  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-destructive">
              {context ? `Failed to ${context}` : 'Something went wrong'}
            </p>
            <p className="text-xs text-muted-foreground truncate">{errorMessage}</p>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              disabled={isRetrying}
              className="gap-1.5 h-8 px-3"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
              {isRetrying ? 'Retrying...' : 'Retry'}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleEmailSupport}
            className="gap-1.5 h-8 px-3 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Mail className="h-3.5 w-3.5" />
            Email support
          </Button>
        </div>
      </div>
    </div>
  );
}
