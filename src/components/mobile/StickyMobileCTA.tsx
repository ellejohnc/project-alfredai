import { useEffect, useState, useCallback } from "react";
import { Play, Calendar } from "lucide-react";
import { toast } from "sonner";

/**
 * Mobile-only sticky bottom CTA bar.
 * - Appears after the user scrolls past the hero (~600px) to avoid covering the hero CTAs.
 * - Primary action: Start with Take-off (the homepage's single unified action).
 * - Secondary: Book an Impact Conversation.
 * - Fallback: if navigation fails (popup blocker, route error), shows a toast with a mailto
 *   recovery link that includes the current page URL.
 */
const StickyMobileCTA = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 600);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const go = useCallback((path: string, label: string) => {
    try {
      window.location.href = path;
    } catch (err) {
      // Fallback: notify the user and offer an email recovery path
      const pageUrl = typeof window !== "undefined" ? window.location.href : "";
      toast.error(`Couldn't open ${label}`, {
        description: "Email us and we'll send the link.",
        action: {
          label: "Email us",
          onClick: () => {
            window.location.href = `mailto:hello@alfredai.bot?subject=${encodeURIComponent(
              `Trouble opening ${label}`
            )}&body=${encodeURIComponent(
              `I hit an error opening "${label}" from ${pageUrl}. Please send the link.`
            )}`;
          },
        },
      });
    }
  }, []);

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Quick actions"
      className="fixed bottom-0 inset-x-0 z-40 md:hidden border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 px-3 pt-2 pb-[max(0.375rem,calc(env(safe-area-inset-bottom)*0.4))]"
    >
      <div className="flex gap-2">
        <button
          data-cta-id="sticky_try_demo"
          onClick={() => go("/solutions/ai-takeoff", "the AI Take-Off page")}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground font-semibold min-h-[48px] px-4 active:scale-[0.98] transition-transform shadow-md hover:opacity-90"
        >
          <Play className="h-4 w-4" aria-hidden />
          Start with Take-off
        </button>
        <button
          data-cta-id="sticky_book"
          onClick={() => go("https://new.alfredai.bot/book", "the booking page")}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card text-foreground font-medium min-h-[48px] px-4 active:scale-[0.98] transition-transform"
          aria-label="Book an Impact Conversation"
        >
          <Calendar className="h-4 w-4" aria-hidden />
          Book
        </button>
      </div>
    </div>
  );
};

export default StickyMobileCTA;
