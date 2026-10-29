import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import { Send, Loader2, X, ArrowRight, CheckCircle2, Sparkles, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

interface InvestorData {
  id?: string;
  fullName: string;
  email: string;
  firmName: string;
  role: string;
  investmentFocus: string;
  checkSize: string;
  interestReason: string;
}

interface InvestorBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: InvestorData | null;
}

interface FormData {
  fullName: string;
  email: string;
  firmName: string;
  role: string;
  investmentFocus: string;
  checkSize: string;
  interestReason: string;
}

const STEPS = [
  { id: "name", label: "Your Name", placeholder: "Full name" },
  { id: "email", label: "Email", placeholder: "your@email.com" },
  { id: "firm", label: "Firm Name", placeholder: "Your firm or fund name" },
  { id: "role", label: "Your Role", options: ["Partner", "Principal", "Associate", "Analyst", "Angel Investor", "Family Office", "Other"] },
  { id: "focus", label: "Investment Focus", options: ["Early Stage (Seed/Pre-Seed)", "Series A", "Series B+", "Growth Equity", "Multi-Stage"] },
  { id: "check", label: "Typical Check Size", options: ["<$500K", "$500K - $1M", "$1M - $5M", "$5M - $10M", "$10M+"] },
  { id: "interest", label: "What interests you about Alfred?", placeholder: "Brief note on your interest..." },
];

const CEO_ZOOM_LINK = "https://scheduler.zoom.us/william-zhang-ew71bl/catchup-wz-alfred";

export function InvestorBookingModal({ isOpen, onClose, initialData }: InvestorBookingModalProps) {
  // Check if we have complete data from qualification - skip to submission if so
  const hasCompleteData = initialData && 
    initialData.fullName && 
    initialData.email && 
    initialData.firmName && 
    initialData.role && 
    initialData.investmentFocus;

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    fullName: initialData?.fullName || "",
    email: initialData?.email || "",
    firmName: initialData?.firmName || "",
    role: initialData?.role || "",
    investmentFocus: initialData?.investmentFocus || "",
    checkSize: initialData?.checkSize || "",
    interestReason: initialData?.interestReason || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [skipToComplete, setSkipToComplete] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-submit if we have complete data from qualification
  useEffect(() => {
    if (isOpen && hasCompleteData && !isComplete && !skipToComplete) {
      setSkipToComplete(true);
      handleAutoSubmit();
    }
  }, [isOpen, hasCompleteData]);

  const handleAutoSubmit = async () => {
    if (!initialData) return;
    
    setIsSubmitting(true);
    try {
      // Data already exists from qualification - just show success
      setIsComplete(true);
      
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#ec4899', '#8b5cf6', '#06b6d4', '#fbbf24'],
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Focus input when step changes
  useEffect(() => {
    if (isOpen && !hasCompleteData) {
      setTimeout(() => {
        if (currentStep === 6) {
          textareaRef.current?.focus();
        } else if (currentStep < 4) {
          inputRef.current?.focus();
        }
      }, 100);
    }
  }, [isOpen, currentStep, hasCompleteData]);

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      setFormData({
        fullName: initialData?.fullName || "",
        email: initialData?.email || "",
        firmName: initialData?.firmName || "",
        role: initialData?.role || "",
        investmentFocus: initialData?.investmentFocus || "",
        checkSize: initialData?.checkSize || "",
        interestReason: initialData?.interestReason || "",
      });
      setIsComplete(false);
      setSkipToComplete(false);
    }
  }, [isOpen, initialData]);

  const handleNext = async () => {
    // Validate current step
    if (currentStep === 0 && !formData.fullName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (currentStep === 1 && (!formData.email.trim() || !formData.email.includes("@"))) {
      toast.error("Please enter a valid email");
      return;
    }
    if (currentStep === 2 && !formData.firmName.trim()) {
      toast.error("Please enter your firm name");
      return;
    }
    if (currentStep === 3 && !formData.role) {
      toast.error("Please select your role");
      return;
    }
    if (currentStep === 4 && !formData.investmentFocus) {
      toast.error("Please select your investment focus");
      return;
    }
    if (currentStep === 5 && !formData.checkSize) {
      toast.error("Please select your typical check size");
      return;
    }

    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Submit the form
      await handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("investor_leads").insert({
        full_name: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        firm_name: formData.firmName.trim(),
        role: formData.role,
        investment_focus: formData.investmentFocus,
        typical_check_size: formData.checkSize,
        interest_reason: formData.interestReason.trim() || null,
        verification_method: "booking_modal",
      });

      if (error) {
        // Check if it's a duplicate email
        if (error.code === "23505") {
          toast.info("We already have your information. Proceeding to booking...");
        } else {
          throw error;
        }
      }

      // Show success with confetti
      setIsComplete(true);
      
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#ec4899', '#8b5cf6', '#06b6d4', '#fbbf24'],
      });

      toast.success("Thank you! Redirecting to booking...");
    } catch (error) {
      console.error("Error submitting investor lead:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleNext();
    }
  };

  const handleOptionSelect = (value: string) => {
    if (currentStep === 3) {
      setFormData({ ...formData, role: value });
    } else if (currentStep === 4) {
      setFormData({ ...formData, investmentFocus: value });
    } else if (currentStep === 5) {
      setFormData({ ...formData, checkSize: value });
    }
    // Auto-advance after selection
    setTimeout(() => handleNext(), 150);
  };

  const openZoomScheduler = async () => {
    // Track the booking click
    try {
      const accessCode = localStorage.getItem("investor_access_code");
      await supabase.functions.invoke('track-investor-booking', {
        body: {
          investorId: initialData?.id,
          email: formData.email,
          accessCode,
          bookingAction: 'clicked',
          bookingUrl: CEO_ZOOM_LINK,
        },
      });
    } catch (error) {
      console.error("Error tracking booking:", error);
    }
    
    // Use direct navigation (not window.open) to bypass popup blockers for this critical redirect.
    onClose();
    window.location.href = CEO_ZOOM_LINK;
  };

  const currentStepData = STEPS[currentStep];
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent hideCloseButton className="w-[95vw] max-w-lg p-0 overflow-hidden bg-background border-border/50 shadow-2xl">
        {/* Header */}
        <div className="relative border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Book a Conversation</h3>
                <p className="text-xs text-muted-foreground">
                  {isComplete ? "You're all set!" : `Step ${currentStep + 1} of ${STEPS.length}`}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-lg"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Progress bar */}
          {!isComplete && (
            <div className="mt-4 h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {isComplete ? (
              <motion.div
                key="complete"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center py-8"
              >
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
                <h4 className="text-xl font-semibold text-foreground mb-2">
                  Thank you, {formData.fullName.split(" ")[0]}!
                </h4>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  Ready to schedule your conversation with William Zhang, CEO of alfred ai.
                </p>
                <Button size="lg" onClick={openZoomScheduler} className="gap-2">
                  Open Booking Calendar
                  <ExternalLink className="w-4 h-4" />
                </Button>
                <p className="text-xs text-muted-foreground mt-4">
                  Opens in a new tab
                </p>
              </motion.div>
            ) : (
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <label className="block text-sm font-medium text-foreground mb-3">
                  {currentStepData.label}
                </label>

                {/* Text input steps */}
                {currentStep < 3 && (
                  <Input
                    ref={inputRef}
                    type={currentStep === 1 ? "email" : "text"}
                    placeholder={currentStepData.placeholder}
                    value={
                      currentStep === 0 ? formData.fullName :
                      currentStep === 1 ? formData.email :
                      formData.firmName
                    }
                    onChange={(e) => {
                      if (currentStep === 0) setFormData({ ...formData, fullName: e.target.value });
                      else if (currentStep === 1) setFormData({ ...formData, email: e.target.value });
                      else setFormData({ ...formData, firmName: e.target.value });
                    }}
                    onKeyDown={handleKeyDown}
                    className="h-12 text-base"
                  />
                )}

                {/* Option selection steps */}
                {currentStep >= 3 && currentStep <= 5 && currentStepData.options && (
                  <div className="grid grid-cols-2 gap-2">
                    {currentStepData.options.map((option) => {
                      const isSelected = 
                        (currentStep === 3 && formData.role === option) ||
                        (currentStep === 4 && formData.investmentFocus === option) ||
                        (currentStep === 5 && formData.checkSize === option);
                      
                      return (
                        <motion.button
                          key={option}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleOptionSelect(option)}
                          className={cn(
                            "px-4 py-3 rounded-xl text-sm font-medium text-left transition-all border",
                            isSelected
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-card hover:bg-muted border-border hover:border-primary/50"
                          )}
                        >
                          {option}
                        </motion.button>
                      );
                    })}
                  </div>
                )}

                {/* Interest reason (final step) */}
                {currentStep === 6 && (
                  <textarea
                    ref={textareaRef}
                    placeholder={currentStepData.placeholder}
                    value={formData.interestReason}
                    onChange={(e) => setFormData({ ...formData, interestReason: e.target.value })}
                    onKeyDown={handleKeyDown}
                    className="w-full h-24 px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  />
                )}

                {/* Navigation buttons */}
                <div className="flex items-center justify-between mt-6">
                  <Button
                    variant="ghost"
                    onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                    disabled={currentStep === 0}
                    className="text-muted-foreground"
                  >
                    Back
                  </Button>
                  
                  {(currentStep < 3 || currentStep === 6) && (
                    <Button onClick={handleNext} disabled={isSubmitting} className="gap-2">
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Submitting...
                        </>
                      ) : currentStep === 6 ? (
                        <>
                          Complete
                          <CheckCircle2 className="w-4 h-4" />
                        </>
                      ) : (
                        <>
                          Continue
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer hint */}
        {!isComplete && (
          <div className="px-6 pb-4">
            <p className="text-xs text-muted-foreground text-center">
              Your information is kept confidential and used only to prepare for our conversation.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
