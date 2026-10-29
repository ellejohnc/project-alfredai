import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import { Mail, CheckCircle, Loader2, ArrowLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { basicEmailSchema } from "@/lib/emailValidation";
import { SUPPORT_EMAIL } from "@/lib/siteConfig";

const UnsubscribePage = () => {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "not-found">("idle");
  const [error, setError] = useState("");
  const { toast } = useToast();

  // Prefill email from URL parameter
  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }
  }, [searchParams]);

  const handleUnsubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate email
    const result = basicEmailSchema.safeParse(email);
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setIsLoading(true);

    try {
      // Call the secure edge function to handle unsubscribe
      const { data, error: fnError } = await supabase.functions.invoke("newsletter-manage", {
        body: { email: result.data.toLowerCase(), action: "unsubscribe" }
      });

      if (fnError) {
        throw fnError;
      }

      if (!data.success) {
        if (!data.found) {
          setStatus("not-found");
        } else {
          setError(data.message || "Something went wrong. Please try again.");
        }
        return;
      }

      setStatus("success");
      toast({
        title: "Unsubscribed",
        description: "You've been successfully unsubscribed from our newsletter.",
      });
    } catch (err) {
      console.error("Unsubscribe error:", err);
      setError("Something went wrong. Please try again or contact support.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResubscribe = async () => {
    setIsLoading(true);
    
    try {
      // Call the secure edge function to handle resubscribe
      const { data, error: fnError } = await supabase.functions.invoke("newsletter-manage", {
        body: { email: email.toLowerCase(), action: "resubscribe" }
      });

      if (fnError) {
        throw fnError;
      }

      if (data.success && data.found) {
        toast({
          title: "Resubscribed!",
          description: "Welcome back! You'll receive our newsletter again.",
        });
        setStatus("idle");
        setEmail("");
      } else {
        toast({
          title: "Error",
          description: "Could not find subscription to reactivate.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Resubscribe error:", err);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getSupportEmailLink = () => {
    const subject = encodeURIComponent("Newsletter Unsubscribe Issue");
    const body = encodeURIComponent(`Hi,\n\nI'm having trouble unsubscribing from the newsletter.\n\nEmail: ${email}\nPage URL: ${window.location.href}\n\nError: ${error}\n\nPlease help.\n\nThank you.`);
    return `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-32 pb-20">
        <div className="container-wide max-w-lg mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8 transition-colors group min-h-[44px]"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to Home
            </Link>

            <div className="bg-card rounded-2xl border border-border shadow-lg p-6 sm:p-8 relative overflow-hidden">
              {/* Gradient background decoration */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="relative">
                {status === "idle" && (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center mx-auto mb-6">
                      <Mail className="w-8 h-8 text-primary" />
                    </div>
                    
                    <h1 className="text-2xl font-semibold text-foreground text-center mb-2">
                      Manage your subscription
                    </h1>
                    <p className="text-muted-foreground text-center mb-8">
                      Enter your email address to unsubscribe from our newsletter.
                    </p>

                    <form onSubmit={handleUnsubscribe} className="space-y-4">
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
                          <div className="mt-3 p-3 bg-destructive/10 rounded-lg">
                            <p className="text-sm text-destructive">{error}</p>
                            <a 
                              href={getSupportEmailLink()}
                              className="text-sm text-primary underline mt-2 inline-flex items-center min-h-[44px]"
                            >
                              Contact support for help
                            </a>
                          </div>
                        )}
                      </div>
                      <Button
                        type="submit"
                        variant="outline"
                        className="w-full min-h-[44px] h-12"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          "Unsubscribe"
                        )}
                      </Button>
                    </form>

                    <p className="text-xs text-muted-foreground text-center mt-6">
                      Changed your mind? You can resubscribe immediately after unsubscribing.
                    </p>
                  </>
                )}

                {status === "success" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-4"
                  >
                    <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
                      <CheckCircle className="w-10 h-10 text-green-500" />
                    </div>
                    <h2 className="text-2xl font-semibold text-foreground mb-2">
                      You're unsubscribed
                    </h2>
                    <p className="text-muted-foreground mb-6">
                      You won't receive any more emails from our newsletter. We're sorry to see you go!
                    </p>
                    <div className="flex flex-col gap-3">
                      <Button
                        onClick={handleResubscribe}
                        className="w-full min-h-[44px]"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          "Resubscribe"
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        asChild
                        className="min-h-[44px]"
                      >
                        <Link to="/">Return to Home</Link>
                      </Button>
                    </div>
                  </motion.div>
                )}

                {status === "not-found" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-4"
                  >
                    <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-6">
                      <AlertCircle className="w-10 h-10 text-amber-500" />
                    </div>
                    <h2 className="text-2xl font-semibold text-foreground mb-2">
                      Email not found
                    </h2>
                    <p className="text-muted-foreground mb-6">
                      We couldn't find this email in our newsletter list. You may have already unsubscribed or used a different email address.
                    </p>
                    <div className="flex flex-col gap-3">
                      <Button
                        onClick={() => {
                          setStatus("idle");
                          setEmail("");
                        }}
                        className="min-h-[44px]"
                      >
                        Try another email
                      </Button>
                      <Button
                        variant="ghost"
                        asChild
                        className="min-h-[44px]"
                      >
                        <Link to="/resources/blog">Visit our blog</Link>
                      </Button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default UnsubscribePage;
