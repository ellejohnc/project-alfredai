import { motion } from "framer-motion";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { strictEmailSchema } from "@/lib/emailValidation";
import { Loader2, Mail, Bell } from "lucide-react";

interface ComingSoonOverlayProps {
  /** Message to display (default: "Coming Soon...") */
  message?: string;
  /** Blur intensity: 'light' (3px), 'medium' (6px), 'heavy' (10px) or custom number */
  blur?: "light" | "medium" | "heavy" | number;
  /** Background opacity 0-100 (default: 30) */
  backgroundOpacity?: number;
  /** Whether to show email signup form */
  showEmailSignup?: boolean;
  /** Source identifier for newsletter signup (e.g., "webinars", "feature-x") */
  signupSource?: string;
  /** Custom signup prompt text */
  signupPrompt?: string;
  /** Whether to send notification email to sales on signup */
  notifySales?: boolean;
  /** Feature name for sales notification */
  featureName?: string;
  /** Children content to render below the badge */
  children?: React.ReactNode;
  /** 
   * Whether to use fixed positioning (full page overlay) or absolute (section overlay).
   * Default: true for full page overlay. Set to false for section-contained overlays.
   */
  fullPage?: boolean;
}

const blurValues = {
  light: "3px",
  medium: "6px",
  heavy: "10px",
};

export const ComingSoonOverlay = ({
  message = "Coming Soon...",
  blur = "light",
  backgroundOpacity = 30,
  showEmailSignup = false,
  signupSource = "coming-soon",
  signupPrompt = "Get notified when we launch",
  notifySales = false,
  featureName = "Feature",
  children,
  fullPage = true,
}: ComingSoonOverlayProps) => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { toast } = useToast();

  const blurValue = typeof blur === "number" ? `${blur}px` : blurValues[blur];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate email
    const result = strictEmailSchema.safeParse(email);
    if (!result.success) {
      toast({
        title: "Invalid email",
        description: result.error.errors[0]?.message || "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const trimmedEmail = email.trim().toLowerCase();

    try {
      // Insert into newsletter_subscribers
      const { error } = await supabase
        .from("newsletter_subscribers")
        .insert({ email: trimmedEmail, source: signupSource });

      if (error) {
        // Handle duplicate email
        if (error.code === "23505") {
          toast({
            title: "Already subscribed",
            description: "You're already on the list! We'll notify you when we launch.",
          });
          setIsSubscribed(true);
          return;
        }
        throw error;
      }

      // Send notification to sales if enabled
      if (notifySales) {
        try {
          await supabase.functions.invoke("notify-feature-interest", {
            body: {
              email: trimmedEmail,
              feature: featureName,
              source: signupSource,
            },
          });
        } catch (notifyError) {
          // Don't fail the signup if notification fails
          console.error("Failed to notify sales:", notifyError);
        }
      }

      toast({
        title: "You're on the list! 🎉",
        description: "We'll notify you as soon as we launch.",
      });
      setIsSubscribed(true);
      setEmail("");
    } catch (error) {
      console.error("Signup error:", error);
      toast({
        title: "Something went wrong",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`${fullPage ? 'fixed inset-x-0' : 'absolute inset-0'} z-40 flex items-center justify-center`}
      style={{
        backdropFilter: `blur(${blurValue})`,
        backgroundColor: `hsl(var(--background) / ${backgroundOpacity / 100})`,
        // When fullPage, position between header and footer to keep both interactive
        ...(fullPage && { 
          top: 'var(--header-height, 72px)',
          bottom: 'var(--footer-height, 320px)' 
        }),
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="flex flex-col items-center gap-6 px-6 text-center"
      >
        {/* Coming Soon Badge */}
        <div className="bg-gradient-to-r from-primary/90 to-secondary/90 px-8 py-4 rounded-full shadow-lg">
          <span className="text-xl font-bold text-primary-foreground tracking-wide">
            {message}
          </span>
        </div>

        {/* Email Signup Form */}
        {showEmailSignup && !isSubscribed && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="w-full max-w-md"
          >
            <p className="text-muted-foreground mb-4 flex items-center justify-center gap-2">
              <Bell size={18} className="text-primary" />
              {signupPrompt}
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 text-base"
                  disabled={isLoading}
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={isLoading || !email.trim()}
                className="h-12 px-6 min-w-[120px] bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Notify Me"
                )}
              </Button>
            </form>
          </motion.div>
        )}

        {/* Success State */}
        {showEmailSignup && isSubscribed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 text-primary font-medium"
          >
            <Bell size={18} className="animate-pulse" />
            <span>You'll be notified when we launch!</span>
          </motion.div>
        )}

        {/* Optional children content */}
        {children}
      </motion.div>
    </div>
  );
};

export default ComingSoonOverlay;
