import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, Home, Mail, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SUPPORT_EMAIL, normalizeUrl } from "@/lib/siteConfig";
import MaintenanceFallback from "@/components/MaintenanceFallback";
import BlankScreenReporter from "@/components/BlankScreenReporter";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorType: "chunk" | "cache" | "react-hooks" | "generic";
  showReporter: boolean;
}

// Detect specific error types for appropriate handling
function detectErrorType(error: Error | null): State["errorType"] {
  if (!error) return "generic";
  
  const message = error.message?.toLowerCase() || "";
  const stack = error.stack?.toLowerCase() || "";
  
  // React hooks null error (multiple React instances)
  if (
    message.includes("cannot read properties of null") &&
    (message.includes("useeffect") || 
     message.includes("usestate") || 
     message.includes("usecallback") ||
     message.includes("useref") ||
     message.includes("usememo"))
  ) {
    return "react-hooks";
  }
  
  // Chunk loading errors - check multiple variations
  if (
    message.includes("loading chunk") ||
    message.includes("failed to fetch dynamically imported module") ||
    message.includes("dynamically imported module") ||
    message.includes("loading css chunk") ||
    message.includes("failed to load module") ||
    // Safari / iOS wording when an old page asks for a file a new deploy removed
    message.includes("importing a module script failed") ||
    message.includes("error loading dynamically imported module") ||
    stack.includes("chunk") ||
    stack.includes("dynamically imported")
  ) {
    return "chunk";
  }
  
  // Cache/version mismatch
  if (
    message.includes("cache") ||
    message.includes("version") ||
    stack.includes("vite-cache")
  ) {
    return "cache";
  }
  
  return "generic";
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    errorType: "generic",
    showReporter: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    const errorType = detectErrorType(error);
    return { 
      hasError: true, 
      error,
      errorType,
      // Show reporter banner for generic errors
      showReporter: errorType === "generic",
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
    // A stale page after a deploy: reload once to fetch the new files.
    if (detectErrorType(error) === "chunk") {
      try {
        const key = "chunk-reload-at";
        const last = Number(sessionStorage.getItem(key) || 0);
        if (Date.now() - last > 30_000) {
          sessionStorage.setItem(key, String(Date.now()));
          window.location.reload();
        }
      } catch {
        /* storage blocked — the fallback screen still offers Refresh */
      }
    }
  }

  private handleGoHome = () => {
    window.location.href = "/";
  };

  private handleRefresh = () => {
    window.location.reload();
  };

  private handleDismissReporter = () => {
    this.setState({ showReporter: false });
  };

  private handleReportIssue = () => {
    const { error, errorInfo } = this.state;
    // Normalize URL to use production domain instead of preview/dev URLs
    const pageUrl = normalizeUrl(window.location.href);
    const errorMessage = error?.message || "Unknown error";
    const errorStack = error?.stack || "No stack trace available";
    const componentStack = errorInfo?.componentStack || "No component stack available";

    const subject = encodeURIComponent(`Bug Report: UI Crash on ${window.location.pathname}`);
    const body = encodeURIComponent(
      `Hi alfred ai Team,\n\n` +
      `I encountered an error on your website and wanted to report it.\n\n` +
      `---\n` +
      `**Page URL:** ${pageUrl}\n\n` +
      `**Error Message:** ${errorMessage}\n\n` +
      `**Error Stack:**\n${errorStack.slice(0, 500)}...\n\n` +
      `**Component Stack:**\n${componentStack.slice(0, 500)}...\n\n` +
      `**Browser:** ${navigator.userAgent}\n\n` +
      `**Timestamp:** ${new Date().toISOString()}\n\n` +
      `---\n\n` +
      `Please attach a screenshot if possible.\n\n` +
      `Thank you!`
    );

    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
  };

  public render() {
    if (this.state.hasError) {
      // For chunk/cache/react-hooks errors, show the maintenance fallback
      if (
        this.state.errorType === "chunk" || 
        this.state.errorType === "cache" ||
        this.state.errorType === "react-hooks"
      ) {
        return (
          <MaintenanceFallback
            errorType={this.state.errorType === "react-hooks" ? "cache" : this.state.errorType}
            errorDetails={this.state.error?.message}
          />
        );
      }

      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center p-4">
          {/* Blank screen reporter banner */}
          <BlankScreenReporter
            isVisible={this.state.showReporter}
            errorMessage={this.state.error?.message}
            errorStack={this.state.error?.stack}
            onDismiss={this.handleDismissReporter}
          />

          <div className="max-w-lg w-full text-center space-y-6">
            {/* Error Icon */}
            <div className="relative w-24 h-24 mx-auto">
              <div className="absolute inset-0 rounded-full bg-destructive/10 animate-pulse" />
              <div className="absolute inset-2 rounded-full bg-destructive/20" />
              <div className="absolute inset-0 flex items-center justify-center">
                <AlertTriangle className="w-12 h-12 text-destructive" />
              </div>
            </div>

            {/* Error Message */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">
                Oops! Something went wrong
              </h1>
              <p className="text-muted-foreground">
                We encountered an unexpected error. Don't worry – your data is safe.
                Try refreshing the page or going back to the homepage.
              </p>
            </div>

            {/* Error Details (collapsible) */}
            <details className="text-left bg-muted/50 rounded-lg p-4 text-sm">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors font-medium">
                View error details
              </summary>
              <div className="mt-3 space-y-2">
                <div>
                  <span className="font-medium text-foreground">Error: </span>
                  <code className="text-xs text-destructive break-all">
                    {this.state.error?.message || "Unknown error"}
                  </code>
                </div>
                <div>
                  <span className="font-medium text-foreground">Page: </span>
                  <code className="text-xs text-muted-foreground break-all">
                    {window.location.pathname}
                  </code>
                </div>
              </div>
            </details>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={this.handleRefresh}
                variant="outline"
                className="gap-2 min-h-[44px]"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh Page
              </Button>
              
              <Button
                onClick={this.handleGoHome}
                className="gap-2 bg-primary hover:bg-primary/90 min-h-[44px]"
              >
                <Home className="w-4 h-4" />
                Back to Home
              </Button>
            </div>

            {/* Report Issue Link */}
            <div className="pt-4 border-t border-border">
              <button
                onClick={this.handleReportIssue}
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group min-h-[44px] px-4"
              >
                <Mail className="w-4 h-4 group-hover:scale-110 transition-transform" />
                Report this issue
                <span className="text-xs opacity-60">(includes error details)</span>
              </button>
            </div>

            {/* Help Text */}
            <p className="text-xs text-muted-foreground/70">
              If this keeps happening, please take a screenshot and include it in your report.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;