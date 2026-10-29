import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Bell, Loader2, Mail, LucideIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { strictEmailSchema } from "@/lib/emailValidation";

interface ComingSoonPageProps {
  /** Page title displayed above the badge */
  title: string;
  /** Main badge message (default: "Coming Soon...") */
  message?: string;
  /** Description text below the badge */
  description: string;
  /** Icon component to display */
  icon: LucideIcon;
  /** Whether to show email signup form */
  showEmailSignup?: boolean;
  /** Source identifier for newsletter signup */
  signupSource?: string;
  /** Custom signup prompt text */
  signupPrompt?: string;
  /** Whether to notify sales on signup */
  notifySales?: boolean;
  /** Feature name for sales notification */
  featureName?: string;
  /** Back link URL */
  backLink?: string;
  /** Back link label */
  backLinkLabel?: string;
}

export const ComingSoonPage = ({
  title,
  message = "Coming Soon...",
  description,
  icon: Icon,
  showEmailSignup = true,
  signupSource = "coming-soon",
  signupPrompt = "Get notified when we launch",
  notifySales = false,
  featureName = "Feature",
  backLink = "/",
  backLinkLabel = "Back to Home",
}: ComingSoonPageProps) => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
      const { error } = await supabase
        .from("newsletter_subscribers")
        .insert({ email: trimmedEmail, source: signupSource });

      if (error) {
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
    <div className="flex-1 flex items-center justify-center min-h-[60vh] relative overflow-hidden">
      {/* Decorative gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-transparent pointer-events-none" />
      
      {/* Animated background orbs */}
      <motion.div
        className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] pointer-events-none"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-1/4 left-1/4 w-[350px] h-[350px] bg-secondary/10 rounded-full blur-[80px] pointer-events-none"
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.1, 0.15, 0.1],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />

      {/* Content cluster */}
      <div className="relative z-10 text-center px-6 py-12 max-w-2xl mx-auto">
        {/* Icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20 flex items-center justify-center"
        >
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <Icon className="w-10 h-10 text-primary" />
          </motion.div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-3xl md:text-4xl font-bold text-foreground mb-6"
        >
          {title}
        </motion.h1>

        {/* Coming Soon Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="inline-flex mb-6"
        >
          <div className="bg-gradient-to-r from-primary to-secondary px-8 py-4 rounded-full shadow-lg shadow-primary/20">
            <span className="text-xl font-bold text-primary-foreground tracking-wide">
              {message}
            </span>
          </div>
        </motion.div>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto leading-relaxed"
        >
          {description}
        </motion.p>

        {/* Email Signup Form */}
        {showEmailSignup && !isSubscribed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="w-full max-w-md mx-auto mb-8"
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
            className="flex items-center justify-center gap-2 text-primary font-medium mb-8"
          >
            <Bell size={18} className="animate-pulse" />
            <span>You'll be notified when we launch!</span>
          </motion.div>
        )}

        {/* Back Navigation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Link
            to={backLink}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group min-h-[44px] px-4"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            {backLinkLabel}
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default ComingSoonPage;
