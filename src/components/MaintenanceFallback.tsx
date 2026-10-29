import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Settings, Mail, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SUPPORT_EMAIL, PRODUCTION_URL, normalizeUrl } from "@/lib/siteConfig";

interface MaintenanceFallbackProps {
  errorType?: "chunk" | "cache" | "update" | "generic";
  errorDetails?: string;
}

/**
 * Dedicated maintenance/update fallback screen for cached asset mismatch errors.
 * Shows when chunk loading fails or React instances conflict due to stale caches.
 */
export const MaintenanceFallback = ({ 
  errorType = "generic",
  errorDetails 
}: MaintenanceFallbackProps) => {
  const [isClearing, setIsClearing] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);

  // Auto-refresh countdown
  useEffect(() => {
    if (!autoRefreshEnabled) return;
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          handleHardRefresh();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoRefreshEnabled]);

  const handleHardRefresh = async () => {
    setIsClearing(true);
    
    try {
      // Clear service worker caches
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
      
      // Unregister service workers
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r => r.unregister()));
      }
      
      // Clear session storage
      sessionStorage.clear();
      
      // Force hard reload (bypass cache)
      window.location.href = window.location.href.split("?")[0] + "?cache_bust=" + Date.now();
    } catch (error) {
      console.error("Failed to clear caches:", error);
      // Fallback to simple reload
      window.location.reload();
    }
  };

  const handleReportIssue = () => {
    const pageUrl = normalizeUrl(window.location.href);
    const subject = encodeURIComponent("Bug Report: Asset Loading Error");
    const body = encodeURIComponent(
      `Hi alfred ai Team,\n\n` +
      `I encountered a loading error that prevented the page from displaying.\n\n` +
      `---\n` +
      `**Page URL:** ${pageUrl}\n\n` +
      `**Error Type:** ${errorType}\n\n` +
      `**Error Details:** ${errorDetails || "N/A"}\n\n` +
      `**Browser:** ${navigator.userAgent}\n\n` +
      `**Timestamp:** ${new Date().toISOString()}\n\n` +
      `---\n\n` +
      `I have already tried clearing my cache and refreshing.\n\n` +
      `Thank you!`
    );

    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
  };

  const getErrorMessage = () => {
    switch (errorType) {
      case "chunk":
        return {
          title: "Loading New Version",
          description: "We've just updated! Refreshing to get the latest version..."
        };
      case "cache":
        return {
          title: "Cache Sync Required",
          description: "Your browser has outdated files cached. Clearing and refreshing..."
        };
      case "update":
        return {
          title: "Update in Progress",
          description: "We're rolling out improvements. This will only take a moment..."
        };
      default:
        return {
          title: "Something Went Wrong",
          description: "We're having trouble loading the page. Attempting to fix it..."
        };
    }
  };

  const { title, description } = getErrorMessage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center space-y-6"
      >
        {/* Animated Icon */}
        <div className="relative w-24 h-24 mx-auto">
          <motion.div
            className="absolute inset-0 rounded-full bg-primary/10"
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <div className="absolute inset-2 rounded-full bg-primary/20 flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Settings className="w-10 h-10 text-primary" />
            </motion.div>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>

        {/* Progress / Countdown */}
        {autoRefreshEnabled && (
          <div className="space-y-2">
            <div className="relative h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 bg-primary rounded-full"
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 5, ease: "linear" }}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Auto-refreshing in {countdown}s...
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <Button
            onClick={handleHardRefresh}
            disabled={isClearing}
            className="gap-2 min-h-[44px]"
          >
            {isClearing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Clearing Cache...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Refresh Now
              </>
            )}
          </Button>

          <Button
            variant="ghost"
            onClick={() => setAutoRefreshEnabled(false)}
            className="text-muted-foreground text-sm min-h-[44px]"
            disabled={!autoRefreshEnabled}
          >
            Cancel auto-refresh
          </Button>
        </div>

        {/* Help Section */}
        <div className="pt-4 border-t border-border space-y-3">
          <div className="flex items-start gap-2 text-left text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>
              If this keeps happening, try opening in an incognito window or clearing your browser cache manually.
            </span>
          </div>

          <button
            onClick={handleReportIssue}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group"
          >
            <Mail className="w-4 h-4 group-hover:scale-110 transition-transform" />
            Still stuck? Report this issue
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default MaintenanceFallback;
