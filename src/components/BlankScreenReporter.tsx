import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Camera, Mail, X, RefreshCw, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SUPPORT_EMAIL, normalizeUrl } from "@/lib/siteConfig";

interface BlankScreenReporterProps {
  /** Whether to show the reporter banner */
  isVisible?: boolean;
  /** Error message if available */
  errorMessage?: string;
  /** Error stack if available */
  errorStack?: string;
  /** Callback when dismissed */
  onDismiss?: () => void;
}

/**
 * In-app banner for blank-screen errors with email pre-fill and screenshot capture.
 * Floats at top of screen when a critical error occurs.
 */
export const BlankScreenReporter = ({
  isVisible = false,
  errorMessage,
  errorStack,
  onDismiss
}: BlankScreenReporterProps) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [screenshotData, setScreenshotData] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Try to capture screenshot using html2canvas
  const captureScreenshot = useCallback(async () => {
    setIsCapturing(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(document.body, {
        logging: false,
        useCORS: true,
        scale: 0.5, // Lower scale for smaller file size
        ignoreElements: (el) => {
          // Ignore the reporter itself
          return el.id === "blank-screen-reporter";
        }
      });
      const dataUrl = canvas.toDataURL("image/png", 0.7);
      setScreenshotData(dataUrl);
      return dataUrl;
    } catch (error) {
      console.warn("Screenshot capture failed:", error);
      return null;
    } finally {
      setIsCapturing(false);
    }
  }, []);

  // Auto-capture screenshot when visible
  useEffect(() => {
    if (isVisible && !screenshotData) {
      captureScreenshot();
    }
  }, [isVisible, screenshotData, captureScreenshot]);

  const handleCopyDebugInfo = async () => {
    const pageUrl = normalizeUrl(window.location.href);
    const debugInfo = [
      `Page URL: ${pageUrl}`,
      `Error: ${errorMessage || "Blank screen / UI crash"}`,
      `Stack: ${errorStack?.slice(0, 500) || "N/A"}`,
      `Browser: ${navigator.userAgent}`,
      `Timestamp: ${new Date().toISOString()}`,
      `Screen: ${window.innerWidth}x${window.innerHeight}`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(debugInfo);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.warn("Copy failed:", error);
    }
  };

  const handleReportIssue = async () => {
    const pageUrl = normalizeUrl(window.location.href);
    
    // Build email body
    const emailBody = [
      "Hi alfred ai Team,",
      "",
      "I encountered a blank screen / loading error on your website.",
      "",
      "---",
      `**Page URL:** ${pageUrl}`,
      "",
      `**Error:** ${errorMessage || "Blank screen / UI crash"}`,
      "",
      `**Browser:** ${navigator.userAgent}`,
      "",
      `**Screen Size:** ${window.innerWidth}x${window.innerHeight}`,
      "",
      `**Timestamp:** ${new Date().toISOString()}`,
      "",
      errorStack ? `**Stack Trace (partial):**\n${errorStack.slice(0, 300)}...` : "",
      "",
      "---",
      "",
      screenshotData 
        ? "**Note:** I have captured a screenshot. Please let me know if you need me to attach it."
        : "**Note:** Screenshot capture was not available.",
      "",
      "Steps to reproduce:",
      "1. ",
      "2. ",
      "3. ",
      "",
      "Thank you!",
    ].filter(Boolean).join("\n");

    const subject = encodeURIComponent(`Bug Report: Blank Screen on ${window.location.pathname}`);
    const body = encodeURIComponent(emailBody);

    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        id="blank-screen-reporter"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="fixed top-0 left-0 right-0 z-[9999] p-4"
      >
        <div className="max-w-2xl mx-auto bg-destructive/10 backdrop-blur-xl border border-destructive/30 rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-destructive/5 border-b border-destructive/20">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <span className="font-medium text-foreground">Something went wrong</span>
            </div>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="p-1 rounded-md hover:bg-destructive/10 transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              We detected an error that may have caused the page to not display correctly. 
              You can help us fix this by sending a report.
            </p>

            {/* Screenshot Preview */}
            {screenshotData && (
              <div className="relative aspect-video w-full max-w-xs mx-auto rounded-lg overflow-hidden border border-border">
                <img 
                  src={screenshotData} 
                  alt="Error screenshot" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 right-2 bg-background/80 text-xs px-2 py-1 rounded-md flex items-center gap-1">
                  <Camera className="w-3 h-3" />
                  Screenshot captured
                </div>
              </div>
            )}

            {isCapturing && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-4">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Capturing screenshot...
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={handleReportIssue}
                className="flex-1 gap-2 min-h-[44px]"
              >
                <Mail className="w-4 h-4" />
                Report Issue
              </Button>
              
              <Button
                onClick={handleRefresh}
                variant="outline"
                className="flex-1 gap-2 min-h-[44px]"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh Page
              </Button>
            </div>

            {/* Secondary Actions */}
            <div className="flex items-center justify-center gap-4 pt-2 border-t border-border">
              <button
                onClick={handleCopyDebugInfo}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-green-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    Copy debug info
                  </>
                )}
              </button>

              {!screenshotData && !isCapturing && (
                <button
                  onClick={captureScreenshot}
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Camera className="w-3 h-3" />
                  Capture screenshot
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BlankScreenReporter;
