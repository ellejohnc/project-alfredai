import { useState } from "react";
import { motion } from "framer-motion";
import { SafeAnimatePresence } from "@/components/ui/safe-animate-presence";
import { X, Mail, CheckCircle, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useRecaptcha } from "@/hooks/useRecaptcha";
import { strictEmailSchema } from "@/lib/emailValidation";

interface NewsletterSubscribeModalProps {
  isOpen: boolean;
  onClose: () => void;
  source?: string;
}

const NewsletterSubscribeModal = ({ isOpen, onClose, source = "blog" }: NewsletterSubscribeModalProps) => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();
  const { verifyRecaptcha, isReady: recaptchaReady } = useRecaptcha();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate email
    const result = strictEmailSchema.safeParse(email);
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setIsLoading(true);

    try {
      // Verify reCAPTCHA first
      const recaptchaResult = await verifyRecaptcha('newsletter_subscribe');
      if (!recaptchaResult.success) {
        setError(recaptchaResult.error || "Verification failed. Please try again.");
        setIsLoading(false);
        return;
      }

      const { error: dbError } = await supabase
        .from("newsletter_subscribers")
        .insert({
          email: result.data,
          source,
        });

      if (dbError) {
        if (dbError.code === "23505") {
          // Unique constraint violation - already subscribed
          toast({
            title: "Already subscribed",
            description: "This email is already on our mailing list.",
          });
          setIsSuccess(true);
        } else {
          throw dbError;
        }
      } else {
        setIsSuccess(true);
        toast({
          title: "Subscribed!",
          description: "You'll receive the latest AI insights in your inbox.",
        });
      }
    } catch (err) {
      console.error("Newsletter subscription error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setError("");
    setIsSuccess(false);
    onClose();
  };

  return (
    <SafeAnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md bg-card rounded-2xl border border-border shadow-2xl overflow-hidden"
          >
            {/* Gradient background decoration */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors z-10"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>

            <div className="relative p-8">
              {!isSuccess ? (
                <>
                  {/* Icon */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: "spring" }}
                    className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center mx-auto mb-6"
                  >
                    <Mail className="w-8 h-8 text-primary" />
                  </motion.div>

                  {/* Title */}
                  <h2 className="text-2xl font-semibold text-foreground text-center mb-2">
                    Stay in the loop
                  </h2>
                  <p className="text-muted-foreground text-center mb-6">
                    Get the latest insights on AI, automation, and operational excellence delivered to your inbox.
                  </p>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setError("");
                        }}
                        className={`h-12 ${error ? "border-destructive" : ""}`}
                        disabled={isLoading}
                      />
                      {error && (
                        <p className="text-sm text-destructive mt-1">{error}</p>
                      )}
                    </div>
                    <Button
                      type="submit"
                      className="w-full h-12 bg-primary hover:bg-primary-hover text-primary-foreground font-medium"
                      disabled={isLoading || !recaptchaReady}
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        "Subscribe"
                      )}
                    </Button>
                  </form>

                  <p className="text-xs text-muted-foreground text-center mt-4 flex items-center justify-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Protected by reCAPTCHA • Unsubscribe anytime
                  </p>
                </>
              ) : (
                /* Success State */
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-4"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: "spring" }}
                    className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6"
                  >
                    <CheckCircle className="w-10 h-10 text-green-500" />
                  </motion.div>
                  <h2 className="text-2xl font-semibold text-foreground mb-2">
                    You're subscribed!
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    Thanks for subscribing. We'll send you the best AI insights directly to your inbox.
                  </p>
                  <Button
                    onClick={handleClose}
                    variant="outline"
                    className="min-w-[120px]"
                  >
                    Close
                  </Button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </SafeAnimatePresence>
  );
};

export default NewsletterSubscribeModal;
