import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import { AlertTriangle, X, Mail, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PRODUCTION_URL } from "@/lib/siteConfig";

interface ApiErrorBannerProps {
  error: string | Error | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  context?: string;
}

/**
 * Global fallback banner for non-crash API failures.
 * Displays error message with retry option and one-tap email report.
 */
export const ApiErrorBanner = ({
  error,
  onRetry,
  onDismiss,
  context = "loading data",
}: ApiErrorBannerProps) => {
  const [isDismissed, setIsDismissed] = useState(false);

  const errorMessage = error instanceof Error ? error.message : error;

  const handleDismiss = useCallback(() => {
    setIsDismissed(true);
    onDismiss?.();
  }, [onDismiss]);

  const handleEmailReport = useCallback(() => {
    const currentUrl = window.location.href.replace(
      /\.lovableproject\.com|\.lovable\.app/g,
      ".alfredai.bot"
    ).replace(/https:\/\/[^/]+/, PRODUCTION_URL);
    
    const subject = encodeURIComponent(`Bug Report: Error ${context}`);
    const body = encodeURIComponent(
      `Hi alfred ai Team,\n\n` +
      `I encountered an error while ${context}.\n\n` +
      `**Error Details:**\n${errorMessage}\n\n` +
      `**Page URL:**\n${currentUrl}\n\n` +
      `**Browser:**\n${navigator.userAgent}\n\n` +
      `**Timestamp:**\n${new Date().toISOString()}\n\n` +
      `Please investigate this issue.\n\nThank you!`
    );
    
    window.open(`mailto:support@alfredai.bot?subject=${subject}&body=${body}`, "_blank");
  }, [errorMessage, context]);

  if (!error || isDismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="w-full bg-destructive/10 border border-destructive/20 rounded-xl p-4 mb-6"
        role="alert"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-foreground mb-1">
              Something went wrong
            </h4>
            <p className="text-sm text-muted-foreground mb-3 break-words">
              {errorMessage || `We encountered an issue while ${context}. Please try again.`}
            </p>
            
            <div className="flex flex-wrap gap-2">
              {onRetry && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRetry}
                  className="h-8 gap-1.5"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Try Again
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEmailReport}
                className="h-8 gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <Mail className="h-3.5 w-3.5" />
                Report Issue
              </Button>
            </div>
          </div>
          
          <button
            onClick={handleDismiss}
            className="p-1 rounded-md hover:bg-muted transition-colors shrink-0"
            aria-label="Dismiss error"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ApiErrorBanner;
