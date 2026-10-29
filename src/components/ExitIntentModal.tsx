import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { SafeAnimatePresence } from "@/components/ui/safe-animate-presence";
import { X, Mail, Sparkles, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { strictEmailSchema } from "@/lib/emailValidation";
import { toast } from "sonner";

const STORAGE_KEY = "alfred_exit_intent_shown_v1";
const SESSION_KEY = "alfred_exit_intent_session_v1";

/**
 * Exit-intent capture modal.
 * - Desktop only (mouseleave to top of viewport)
 * - Shows once per 7 days per browser (localStorage)
 * - Also suppressed for the rest of the session after dismiss/submit
 * - Captures email into newsletter_subscribers with source="exit_intent_roi"
 * - Fallback: if Supabase insert fails, offers a mailto recovery link
 */
const ExitIntentModal = () => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const markSeen = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* ignore storage errors */
    }
  }, []);

  useEffect(() => {
    // Suppress on small screens — mouseleave isn't a meaningful signal on touch
    if (typeof window === "undefined") return;
    if (window.matchMedia("(max-width: 1024px)").matches) return;

    // Respect prior dismissals
    try {
      if (sessionStorage.getItem(SESSION_KEY)) return;
      const last = localStorage.getItem(STORAGE_KEY);
      if (last) {
        const ageMs = Date.now() - parseInt(last, 10);
        if (ageMs < 7 * 24 * 60 * 60 * 1000) return; // 7-day cooldown
      }
    } catch {
      /* ignore */
    }

    let armed = false;
    const arm = () => {
      armed = true;
    };
    // Only arm after the user has spent a few seconds on the page
    const armTimer = window.setTimeout(arm, 8000);

    const onMouseLeave = (e: MouseEvent) => {
      if (!armed) return;
      // Trigger when the cursor leaves through the top of the viewport
      if (e.clientY <= 0 && (e.relatedTarget === null || (e as any).toElement === null)) {
        setOpen(true);
        markSeen();
        document.removeEventListener("mouseleave", onMouseLeave);
      }
    };

    document.addEventListener("mouseleave", onMouseLeave);
    return () => {
      window.clearTimeout(armTimer);
      document.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [markSeen]);

  const close = useCallback(() => {
    setOpen(false);
    markSeen();
  }, [markSeen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const parsed = strictEmailSchema.safeParse(email.trim());
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? "Please enter a valid work email.");
      return;
    }

    setLoading(true);
    try {
      const { error: dbError } = await supabase
        .from("newsletter_subscribers")
        .insert({ email: parsed.data, source: "exit_intent_roi" });

      // 23505 = unique violation -> already subscribed, treat as success
      if (dbError && dbError.code !== "23505") {
        throw dbError;
      }

      setDone(true);
      markSeen();
      toast.success("On the way", {
        description: "Check your inbox for the ROI snapshot in the next minute.",
      });
    } catch (err) {
      const pageUrl = typeof window !== "undefined" ? window.location.href : "";
      setError("We couldn't save your email. Try again or email us directly.");
      toast.error("Couldn't capture your email", {
        description: "Email us and we'll send the ROI snapshot manually.",
        action: {
          label: "Email us",
          onClick: () => {
            window.location.href = `mailto:hello@alfredai.bot?subject=${encodeURIComponent(
              "ROI snapshot request"
            )}&body=${encodeURIComponent(
              `Please send the 2-minute ROI snapshot to: ${email}\n\nFrom page: ${pageUrl}`
            )}`;
          },
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-labelledby="exit-intent-title"
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ type: "spring", damping: 24, stiffness: 280 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
          >
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="absolute top-3 right-3 w-9 h-9 inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="p-6 sm:p-8">
              {!done ? (
                <>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
                    <Sparkles className="w-3.5 h-3.5" aria-hidden />
                    Before you go
                  </div>
                  <h2
                    id="exit-intent-title"
                    className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight"
                  >
                    Not ready to book?
                  </h2>
                  <p className="mt-2 text-sm sm:text-base text-muted-foreground">
                    Get a <strong className="text-foreground">2-minute ROI snapshot</strong> for your firm — based on your team size and industry. No call required.
                  </p>

                  <form onSubmit={handleSubmit} className="mt-5 space-y-3">
                    <label htmlFor="exit-email" className="sr-only">
                      Work email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden />
                      <Input
                        id="exit-email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@yourcompany.com"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (error) setError("");
                        }}
                        className="pl-10 h-12"
                        disabled={loading}
                        autoFocus
                      />
                    </div>
                    {error && (
                      <p className="text-xs text-destructive" role="alert">
                        {error}
                      </p>
                    )}
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full h-12 text-base font-semibold"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sending…
                        </>
                      ) : (
                        "Send me the ROI snapshot"
                      )}
                    </Button>
                    <p className="text-[11px] text-muted-foreground text-center">
                      No spam. Unsubscribe anytime. We respect your privacy.
                    </p>
                  </form>

                  <div className="mt-5 pt-5 border-t border-border text-center">
                    <button
                      type="button"
                      onClick={() => {
                        close();
                        window.location.href = "https://new.alfredai.bot/book";
                      }}
                      className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
                    >
                      Actually, I'd rather book a 30-min call →
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-7 h-7 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">Check your inbox</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Your ROI snapshot is on the way. It usually arrives within a minute.
                  </p>
                  <Button onClick={close} className="mt-6 w-full h-11">
                    Keep browsing
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </SafeAnimatePresence>
  );
};

export default ExitIntentModal;
