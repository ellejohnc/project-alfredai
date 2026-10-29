import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Shield, Clock, Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SUPPORT_EMAIL } from "@/lib/siteConfig";
import SEO from "@/components/SEO";
import { GHLBookingWidget } from "@/components/GHLBookingWidget";
import { getLeadIdentitySync } from "@/hooks/useLeadIdentity";
import { cn } from "@/lib/utils";


const benefits = [
  { icon: Clock, text: "30-minute focused session" },
  { icon: Sparkles, text: "Personalized demo for your industry" },
  { icon: Shield, text: "No commitment required" },
];

const BookPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [widgetKey, setWidgetKey] = useState(0);
  const [widgetLoaded, setWidgetLoaded] = useState(false);
  
  // Merge URL params with persisted lead identity
  const leadData = useMemo(() => {
    const storedIdentity = getLeadIdentitySync();
    return {
      name: searchParams.get('name') || storedIdentity.name || undefined,
      email: searchParams.get('email') || storedIdentity.email || undefined,
      phone: searchParams.get('phone') || storedIdentity.phone || undefined,
      company: searchParams.get('company') || storedIdentity.company || undefined,
    };
  }, [searchParams]);

  const [slowLoad, setSlowLoad] = useState(false);
  useEffect(() => {
    setSlowLoad(false);
    const t = window.setTimeout(() => setSlowLoad(true), 6000);
    return () => window.clearTimeout(t);
  }, [widgetKey]);

  const handleRefreshWidget = () => {
    setWidgetLoaded(false);
    setWidgetKey((k) => k + 1);
  };

  // NOTE: the GHL form-embed script is loaded (and cleaned up) by
  // GHLBookingWidget itself — injecting a second copy here raced with it and
  // could leave the calendar blank.


  return (
    <>
    <SEO 
      title="Book a Construction AI Demo"
      description="Schedule a personalized demo to see how agentic AI orchestrates your construction and contracting workflows for 10x faster project execution."
    />
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex flex-col">
      {/* Minimal header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="container-wide flex items-center justify-between h-16 px-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-primary" />
            </div>
            <span className="font-semibold text-foreground hidden sm:block">
              Book an Impact Conversation
            </span>
            {/* Top refresh button — shown only once the widget has loaded. */}
            <button
              type="button"
              onClick={handleRefreshWidget}
              aria-label="Refresh for availability"
              title="Refresh for availability"
              className={cn(
                "p-2 rounded-lg transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-95",
                widgetLoaded
                  ? "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  : "hidden"
              )}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          
          <div className="w-20" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 pt-16 flex flex-col lg:flex-row">
        {/* Left sidebar - Benefits (hidden on mobile, shown as banner) */}
        <motion.aside
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="hidden lg:flex lg:w-80 xl:w-96 bg-muted/30 border-r border-border/50 flex-col justify-center p-8 xl:p-12"
        >
          <div className="max-w-xs">
            <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium mb-4">
              Free Consultation
            </span>
            <h1 className="text-2xl xl:text-3xl font-bold text-foreground mb-4">
              See alfred ai<br />in Action
            </h1>
            <p className="text-muted-foreground mb-8">
              Schedule a personalized demo and discover how we can transform your operations.
            </p>
            
            <ul className="space-y-4">
              {benefits.map((benefit, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * (index + 1) }}
                  className="flex items-center gap-3 text-sm text-muted-foreground"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <benefit.icon className="w-4 h-4 text-primary" />
                  </div>
                  {benefit.text}
                </motion.li>
              ))}
            </ul>

            {/* Trust badge */}
            <div className="mt-10 pt-6 border-t border-border/50">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span>Your information is secure and private</span>
              </div>
            </div>
          </div>
        </motion.aside>

        {/* Mobile benefits banner */}
        <div className="lg:hidden bg-gradient-to-r from-primary/5 to-secondary/5 border-b border-border/50 px-4 py-4">
          <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-1.5">
                <benefit.icon className="w-3.5 h-3.5 text-primary" />
                <span className="hidden sm:inline">{benefit.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Calendar container - takes remaining space. Extra bottom padding on
            mobile keeps the calendar above the thumb-position refresh button. */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex-1 flex flex-col items-center p-4 lg:p-8 pb-8"
        >
          <div className="relative w-full max-w-2xl min-h-[640px]">
            {/* Centred refresh hint — appears if the calendar has not loaded
                after a few seconds, so visitors know what to do. */}
            {!widgetLoaded && slowLoad && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-2xl bg-background/85 backdrop-blur-sm p-6 text-center">
                <p className="text-sm text-muted-foreground max-w-xs">The calendar is taking longer than usual to load.</p>
                <button
                  type="button"
                  onClick={handleRefreshWidget}
                  aria-label="Refresh for availability"
                  className="flex items-center justify-center gap-2 min-h-[48px] px-6 rounded-xl bg-primary text-primary-foreground font-medium shadow-lg active:scale-[0.98] transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh</span>
                </button>
                <a href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Booking calendar not loading")}&body=${encodeURIComponent(`Page: ${window.location.href}\n\n(Please attach a screenshot of the page.)`)}`} className="text-xs text-muted-foreground underline underline-offset-4 min-h-[44px] flex items-center">Still not loading? Email us</a>
              </div>
            )}
            <GHLBookingWidget
              key={widgetKey}
              leadData={leadData}
              sourceData={{
                source: "website",
                medium: "fullscreen_booking",
                campaign: "book_page",
                content: "/book",
              }}
              variant="fullscreen"
              height="100%"
              className="h-full"
              onLoadStateChange={({ loaded }) => setWidgetLoaded(loaded)}
            />
          </div>

          {/* Post-booking fallback: GHL iframe can't notify us when a booking
              completes, so give users a clear path to confirmation + next steps. */}
          <div className="w-full max-w-2xl mt-3 flex justify-center">
            <button
              type="button"
              onClick={() => navigate("/booked")}
              className="text-xs sm:text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 min-h-[44px] px-3"
            >
              Already booked? See next steps →
            </button>
          </div>
        </motion.div>

      </main>

    </div>
    </>
  );
};

export default BookPage;
