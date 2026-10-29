import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Mail } from "lucide-react";

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type SubmittingOverlayProps = {
  open: boolean;
  title?: string;
  description?: string;
  pageUrl?: string;
  className?: string;
};

/**
 * Full-screen, tap-blocking transition overlay for slow submissions.
 * Uses semantic tokens only.
 */
export function SubmittingOverlay({
  open,
  title = "Submitting your request…",
  description = "This can take a few seconds the first time. Please don’t refresh — we’re saving your details.",
  pageUrl,
  className,
}: SubmittingOverlayProps) {
  const [progress, setProgress] = useState(12);

  // Create a gentle “indeterminate-ish” progress that never reaches 100%.
  useEffect(() => {
    if (!open) {
      setProgress(12);
      return;
    }

    const start = Date.now();
    const id = window.setInterval(() => {
      const elapsed = Date.now() - start;
      // Eases toward 92 over ~20s
      const next = 12 + (92 - 12) * (1 - Math.exp(-elapsed / 9000));
      setProgress((p) => Math.max(p, Math.min(92, Math.round(next))));
    }, 250);

    return () => window.clearInterval(id);
  }, [open]);

  const mailtoHref = useMemo(() => {
    const url = pageUrl || (typeof window !== "undefined" ? window.location.href : "");
    const subject = encodeURIComponent("Demo request issue");
    const body = encodeURIComponent(
      `Hi team,\n\nI ran into an issue while submitting a demo request.\n\nPage: ${url}\n\nPlease include a screenshot of this page if you can.\n`
    );
    return `mailto:hello@alfredai.com?subject=${subject}&body=${body}`;
  }, [pageUrl]);

  if (!open) return null;

  return (
    <motion.div
      aria-live="polite"
      aria-busy="true"
      className={cn(
        "fixed inset-0 z-50",
        "bg-background/80 backdrop-blur-md",
        "flex items-center justify-center p-4",
        className
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className={cn(
          "w-full max-w-sm rounded-2xl border border-border bg-card shadow-lg",
          "p-5 sm:p-6"
        )}
        initial={{ y: 10, scale: 0.98, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-xl bg-muted p-2">
            <Loader2 className="h-5 w-5 animate-spin text-foreground" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
        </div>

        <div className="mt-4">
          <Progress value={progress} className="h-2" />
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>Saving…</span>
            <span>{progress}%</span>
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-muted/40 p-3">
          <p className="text-xs text-muted-foreground">
            If this takes more than ~30 seconds, you can email us and we’ll help.
          </p>
          <a
            href={mailtoHref}
            className={cn(
              "mt-2 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg",
              "border border-border bg-background px-3 text-sm font-medium text-foreground",
              "transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            )}
          >
            <Mail className="h-4 w-4" />
            Email support (include screenshot)
          </a>
        </div>
      </motion.div>
    </motion.div>
  );
}
