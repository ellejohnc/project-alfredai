import { memo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { SUPPORT_EMAIL } from '@/lib/siteConfig';

interface SectionErrorFallbackProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  compact?: boolean;
}

/**
 * Error fallback component for sections that fail to load
 * Provides user-friendly error display with retry functionality
 */
export const SectionErrorFallback = memo(function SectionErrorFallback({
  title = "Unable to load this section",
  message = "Something went wrong while loading. Please try again.",
  onRetry,
  compact = false,
}: SectionErrorFallbackProps) {
  // Assembled with encodeURIComponent rather than by interpolation. The
  // subject was not encoded at all, and an `&` or `#` in a section title, an
  // error message or the page URL truncated the mailto at that character — so
  // the report a user sent arrived missing exactly the part that said what
  // broke.
  const supportMailto =
    `mailto:${SUPPORT_EMAIL}` +
    `?subject=${encodeURIComponent('Section Load Error')}` +
    `&body=${encodeURIComponent(
      `Page: ${typeof window !== 'undefined' ? window.location.href : ''}\n\n` +
        `Section: ${title}\n\n` +
        `Error: ${message}`,
    )}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        flex flex-col items-center justify-center text-center
        rounded-lg border border-destructive/20 bg-destructive/5
        ${compact ? 'p-4 gap-2' : 'p-6 gap-3'}
      `}
    >
      <div className={`
        rounded-full bg-destructive/10 
        ${compact ? 'p-2' : 'p-3'}
      `}>
        <AlertTriangle className={`
          text-destructive 
          ${compact ? 'h-4 w-4' : 'h-5 w-5'}
        `} />
      </div>
      
      <div className="space-y-1">
        <h4 className={`
          font-medium text-foreground
          ${compact ? 'text-sm' : 'text-base'}
        `}>
          {title}
        </h4>
        <p className={`
          text-muted-foreground
          ${compact ? 'text-xs' : 'text-sm'}
        `}>
          {message}
        </p>
      </div>

      {onRetry && (
        <Button
          variant="outline"
          size={compact ? "sm" : "default"}
          onClick={onRetry}
          className="mt-2 gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      )}
      
      <p className="text-xs text-muted-foreground/70 mt-2">
        If the problem persists, please{' '}
        <a 
          href={supportMailto}
          className="text-primary hover:underline"
        >
          contact support
        </a>
      </p>
    </motion.div>
  );
});

export default SectionErrorFallback;
