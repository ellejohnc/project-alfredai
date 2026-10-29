import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Check, 
  ChevronRight, 
  Building2, 
  User, 
  Mail, 
  Briefcase, 
  Target, 
  DollarSign,
  Linkedin,
  Shield,
  ArrowLeft,
  Loader2,
  Phone,
  Globe,
  CheckCircle2,
  KeyRound,
  Clock,
  Send,
  Home
} from "lucide-react";
import confetti from "canvas-confetti";

interface InvestorQualificationGateProps {
  onQualified: () => void;
}

type Step = 
  | "welcome"
  | "basic_info"
  | "investor_profile"
  | "interest"
  | "verification"
  | "pending_review"
  | "complete";

interface FormData {
  fullName: string;
  email: string;
  firmName: string;
  role: string;
  investmentFocus: string;
  typicalCheckSize: string;
  interestReason: string;
  linkedinUrl: string;
  socialProfileUrl: string;
  phoneNumber: string;
}

const STEPS: Step[] = ["welcome", "basic_info", "investor_profile", "interest", "verification", "pending_review", "complete"];

const STEP_LABELS: Record<Step, string> = {
  welcome: "Welcome",
  basic_info: "Your Details",
  investor_profile: "Investor Profile",
  interest: "Your Interest",
  verification: "Contact Details",
  pending_review: "Under Review",
  complete: "Access Granted"
};

const ROLE_OPTIONS = [
  "General Partner",
  "Managing Director",
  "Principal",
  "Associate",
  "Angel Investor",
  "Family Office",
  "Corporate Development",
  "Other"
];

const FOCUS_OPTIONS = [
  "Enterprise SaaS",
  "AI/ML",
  "Vertical Software",
  "FinTech",
  "PropTech",
  "Marketplace",
  "Industry Agnostic"
];

const CHECK_SIZE_OPTIONS = [
  "< $500K",
  "$500K - $1M",
  "$1M - $5M",
  "$5M - $10M",
  "$10M+"
];

// Pending Review Screen Component with countdown and confetti
function PendingReviewScreen({ 
  email, 
  redirectCountdown, 
  setRedirectCountdown 
}: { 
  email: string; 
  redirectCountdown: number; 
  setRedirectCountdown: React.Dispatch<React.SetStateAction<number>>; 
}) {
  // Fire confetti on mount
  useEffect(() => {
    const duration = 2500;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors: ['#22c55e', '#10b981', '#34d399', '#6ee7b7']
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
        colors: ['#22c55e', '#10b981', '#34d399', '#6ee7b7']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();

    // Center burst
    confetti({
      particleCount: 80,
      spread: 100,
      origin: { y: 0.5 },
      colors: ['#22c55e', '#10b981', '#34d399', '#6ee7b7', '#fbbf24'],
    });
  }, []);

  // Countdown timer for auto-redirect
  useEffect(() => {
    if (redirectCountdown <= 0) {
      window.location.href = "/";
      return;
    }

    const timer = setInterval(() => {
      setRedirectCountdown(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [redirectCountdown, setRedirectCountdown]);

  return (
    <motion.div
      key="pending_review"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-8 text-center"
    >
      {/* Success checkmark with animation */}
      <motion.div 
        className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
      >
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
        >
          <CheckCircle2 className="w-10 h-10 text-green-500" />
        </motion.div>
      </motion.div>

      <motion.h1 
        className="text-2xl font-bold text-foreground mb-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        Request Successfully Submitted!
      </motion.h1>
      
      <motion.p 
        className="text-muted-foreground mb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        Thank you for your interest in alfred ai.
      </motion.p>
      
      <motion.div 
        className="bg-muted/50 rounded-xl p-5 text-left mb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
          <Mail className="w-4 h-4" />
          What happens next?
        </h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">1.</span>
            Our team will review your information within 1-2 business days
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">2.</span>
            Once approved, you'll receive an email with your unique access code
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">3.</span>
            Use the access code to view our investor materials anytime for 12 months
          </li>
        </ul>
      </motion.div>

      <motion.p 
        className="text-sm text-muted-foreground mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        We've sent a confirmation to <strong className="text-foreground">{email}</strong>
      </motion.p>

      {/* Auto-redirect countdown */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Redirecting to homepage in <strong className="text-foreground">{redirectCountdown}</strong> seconds...</span>
        </div>

        <Button 
          onClick={() => window.location.href = "/"}
          className="gap-2"
        >
          <Home className="w-4 h-4" />
          Go to Homepage Now
        </Button>

        <p className="text-xs text-muted-foreground">
          Or{" "}
          <button 
            onClick={() => window.location.href = "/"}
            className="text-primary hover:underline font-medium"
          >
            go to the alfred ai homepage
          </button>
          {" "}if not redirected automatically
        </p>

      </motion.div>
    </motion.div>
  );
}

export default function InvestorQualificationGate({ onQualified }: InvestorQualificationGateProps) {
  const [currentStep, setCurrentStep] = useState<Step>("welcome");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accessCode, setAccessCode] = useState("");
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [showAccessCodeEntry, setShowAccessCodeEntry] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(8);
  
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
    firmName: "",
    role: "",
    investmentFocus: "",
    typicalCheckSize: "",
    interestReason: "",
    linkedinUrl: "",
    socialProfileUrl: "",
    phoneNumber: ""
  });

  const currentStepIndex = STEPS.indexOf(currentStep);
  const progress = ((currentStepIndex) / (STEPS.length - 1)) * 100;

  const updateField = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const goToNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex]);
    }
  };

  const goBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex]);
    }
  };

  const handleNotInvestor = () => {
    window.location.href = "/";
  };

  // Check if a valid social URL is provided
  const isValidSocialUrl = (url: string): boolean => {
    if (!url.trim()) return false;
    const lowerUrl = url.toLowerCase();
    return (
      lowerUrl.includes("linkedin.com") ||
      lowerUrl.includes("twitter.com") ||
      lowerUrl.includes("x.com") ||
      lowerUrl.includes("github.com") ||
      lowerUrl.includes("crunchbase.com") ||
      lowerUrl.includes("angel.co") ||
      lowerUrl.includes("facebook.com")
    );
  };

  // Check if a valid phone number is provided
  const isValidPhone = (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, "");
    return cleaned.length >= 10;
  };

  // Validate access code
  const validateAccessCode = async () => {
    if (accessCode.length < 8) {
      toast.error("Please enter your 8-character access code");
      return;
    }

    setIsValidatingCode(true);
    try {
      const { data, error } = await supabase.functions.invoke("validate-investor-code", {
        body: { access_code: accessCode }
      });

      if (error) throw error;

      if (data?.valid) {
        // Store session data
        localStorage.setItem("investor_qualified", "true");
        localStorage.setItem("investor_qualified_at", Date.now().toString());
        localStorage.setItem("investor_session_duration", "365"); // 12 months
        localStorage.setItem("investor_access_code", accessCode.toUpperCase());
        localStorage.setItem("investor_data", JSON.stringify(data.investor));

        toast.success("Access granted! Welcome back.");
        setCurrentStep("complete");
        setTimeout(() => {
          onQualified();
        }, 1500);
      } else {
        toast.error(data?.error || "Invalid access code");
      }
    } catch (error) {
      console.error("Error validating code:", error);
      toast.error("Failed to validate code. Please try again.");
    } finally {
      setIsValidatingCode(false);
    }
  };

  const submitQualification = async () => {
    setIsSubmitting(true);
    try {
      const sessionToken = crypto.randomUUID();

      // Insert with pending_review status
      const { error } = await supabase.from("investor_leads").insert({
        full_name: formData.fullName,
        email: formData.email,
        firm_name: formData.firmName,
        role: formData.role,
        investment_focus: formData.investmentFocus,
        typical_check_size: formData.typicalCheckSize,
        interest_reason: formData.interestReason,
        linkedin_url: formData.linkedinUrl || null,
        social_profile_url: formData.socialProfileUrl,
        phone_number: formData.phoneNumber,
        phone_verified: false,
        verification_method: "pending_approval",
        session_token: sessionToken,
        verified_at: null // Not verified until approved
      });

      if (error) throw error;

      // Notify admins
      try {
        await supabase.functions.invoke("notify-investor-request", {
          body: {
            fullName: formData.fullName,
            email: formData.email,
            firmName: formData.firmName,
            role: formData.role,
            investmentFocus: formData.investmentFocus,
            typicalCheckSize: formData.typicalCheckSize,
            interestReason: formData.interestReason,
            socialProfileUrl: formData.socialProfileUrl,
            phoneNumber: formData.phoneNumber
          }
        });
      } catch (notifyError) {
        console.error("Error notifying admins:", notifyError);
        // Don't fail the submission if notification fails
      }

      goToNext(); // Go to pending_review step

    } catch (error) {
      console.error("Error submitting qualification:", error);
      toast.error("Failed to submit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case "basic_info":
        return formData.fullName.trim() !== "" && 
               formData.email.trim() !== "" && 
               formData.firmName.trim() !== "";
      case "investor_profile":
        return formData.role !== "" && formData.investmentFocus !== "";
      case "interest":
        return formData.interestReason.trim() !== "";
      case "verification":
        // Both social profile and phone are mandatory
        return isValidSocialUrl(formData.socialProfileUrl) && isValidPhone(formData.phoneNumber);
      default:
        return true;
    }
  };

  const handleProceed = () => {
    if (currentStep === "verification") {
      submitQualification();
    } else {
      goToNext();
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <motion.div 
        className="relative w-full max-w-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Progress bar */}
        {currentStep !== "welcome" && currentStep !== "complete" && currentStep !== "pending_review" && (
          <div className="mb-8">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Step {currentStepIndex} of {STEPS.length - 3}</span>
              <span>{STEP_LABELS[currentStep]}</span>
            </div>
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
          <AnimatePresence mode="wait">
            {/* Welcome Step */}
            {currentStep === "welcome" && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-8 text-center"
              >
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Shield className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  Investor Access
                </h1>
                <p className="text-muted-foreground mb-8">
                  This section contains confidential materials for qualified investors only.
                </p>

                {!showAccessCodeEntry ? (
                  <div className="space-y-3">
                    <Button 
                      className="w-full" 
                      size="lg"
                      variant="outline"
                      onClick={() => setShowAccessCodeEntry(true)}
                    >
                      <KeyRound className="w-4 h-4 mr-2" />
                      I have an access code
                    </Button>
                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={goToNext}
                    >
                      Request investor access
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full text-muted-foreground"
                      onClick={handleNotInvestor}
                    >
                      I'm not an investor
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="accessCode" className="text-left block mb-2">Enter your 8-character access code</Label>
                      <Input
                        id="accessCode"
                        placeholder="XXXXXXXX"
                        value={accessCode}
                        onChange={(e) => setAccessCode(e.target.value.toUpperCase().slice(0, 8))}
                        className="text-center text-xl tracking-widest font-mono"
                        maxLength={8}
                      />
                    </div>
                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={validateAccessCode}
                      disabled={isValidatingCode || accessCode.length < 8}
                    >
                      {isValidatingCode ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Validating...
                        </>
                      ) : (
                        <>
                          Verify Code
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full text-muted-foreground"
                      onClick={() => {
                        setShowAccessCodeEntry(false);
                        setAccessCode("");
                      }}
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to options
                    </Button>
                  </div>
                )}
              </motion.div>
            )}

            {/* Basic Info Step */}
            {currentStep === "basic_info" && (
              <motion.div
                key="basic_info"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-8"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">Your Details</h2>
                    <p className="text-sm text-muted-foreground">Tell us about yourself</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      placeholder="John Smith"
                      value={formData.fullName}
                      onChange={(e) => updateField("fullName", e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Work Email *</Label>
                    <div className="relative mt-1.5">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@venture.com"
                        value={formData.email}
                        onChange={(e) => updateField("email", e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="firmName">Firm / Organization *</Label>
                    <div className="relative mt-1.5">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="firmName"
                        placeholder="Venture Capital LLC"
                        value={formData.firmName}
                        onChange={(e) => updateField("firmName", e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-8">
                  <Button variant="outline" onClick={goBack}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button 
                    className="flex-1" 
                    onClick={handleProceed}
                    disabled={!canProceed()}
                  >
                    Continue
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Investor Profile Step */}
            {currentStep === "investor_profile" && (
              <motion.div
                key="investor_profile"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-8"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">Investor Profile</h2>
                    <p className="text-sm text-muted-foreground">Your investment background</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <Label className="mb-3 block">Your Role *</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {ROLE_OPTIONS.map((role) => (
                        <button
                          key={role}
                          onClick={() => updateField("role", role)}
                          className={`px-3 py-2 text-sm rounded-lg border transition-all text-left ${
                            formData.role === role
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border hover:border-primary/50 text-foreground"
                          }`}
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="mb-3 block">Investment Focus *</Label>
                    <div className="flex flex-wrap gap-2">
                      {FOCUS_OPTIONS.map((focus) => (
                        <button
                          key={focus}
                          onClick={() => updateField("investmentFocus", focus)}
                          className={`px-3 py-1.5 text-sm rounded-full border transition-all ${
                            formData.investmentFocus === focus
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border hover:border-primary/50 text-foreground"
                          }`}
                        >
                          {focus}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="mb-3 block flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Typical Check Size
                      <span className="text-muted-foreground font-normal">(optional)</span>
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {CHECK_SIZE_OPTIONS.map((size) => (
                        <button
                          key={size}
                          onClick={() => updateField("typicalCheckSize", size)}
                          className={`px-3 py-1.5 text-sm rounded-full border transition-all ${
                            formData.typicalCheckSize === size
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border hover:border-primary/50 text-foreground"
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-8">
                  <Button variant="outline" onClick={goBack}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button 
                    className="flex-1" 
                    onClick={handleProceed}
                    disabled={!canProceed()}
                  >
                    Continue
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Interest Step */}
            {currentStep === "interest" && (
              <motion.div
                key="interest"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-8"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Target className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">Your Interest</h2>
                    <p className="text-sm text-muted-foreground">What brings you here?</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="interestReason">Why are you interested in alfred ai? *</Label>
                    <textarea
                      id="interestReason"
                      placeholder="e.g., Looking to invest in AI automation for professional services..."
                      value={formData.interestReason}
                      onChange={(e) => updateField("interestReason", e.target.value)}
                      className="mt-1.5 w-full min-h-[120px] px-3 py-2 bg-background border border-input rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  <div>
                    <Label htmlFor="linkedin">LinkedIn URL <span className="text-muted-foreground font-normal">(optional)</span></Label>
                    <div className="relative mt-1.5">
                      <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="linkedin"
                        placeholder="https://linkedin.com/in/yourprofile"
                        value={formData.linkedinUrl}
                        onChange={(e) => updateField("linkedinUrl", e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-8">
                  <Button variant="outline" onClick={goBack}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button 
                    className="flex-1" 
                    onClick={handleProceed}
                    disabled={!canProceed()}
                  >
                    Continue
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Verification Step - Now requires BOTH social and phone */}
            {currentStep === "verification" && (
              <motion.div
                key="verification"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-8"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">Contact Details</h2>
                    <p className="text-sm text-muted-foreground">For verification purposes</p>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-6">
                  Please provide <strong>both</strong> a professional social profile and mobile number for identity verification.
                </p>

                <div className="space-y-5">
                  {/* Social Profile - Required */}
                  <div className="border rounded-xl p-4 border-border">
                    <div className="flex items-center gap-3 mb-3">
                      <Globe className="w-5 h-5 text-primary" />
                      <span className="font-medium text-foreground">Professional Social Profile *</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">LinkedIn, Twitter/X, Crunchbase, AngelList, or GitHub</p>
                    <Input
                      placeholder="https://linkedin.com/in/yourprofile"
                      value={formData.socialProfileUrl}
                      onChange={(e) => updateField("socialProfileUrl", e.target.value)}
                    />
                    {formData.socialProfileUrl && !isValidSocialUrl(formData.socialProfileUrl) && (
                      <p className="text-xs text-destructive mt-2">
                        Please enter a valid social profile URL (LinkedIn, Twitter, GitHub, etc.)
                      </p>
                    )}
                    {isValidSocialUrl(formData.socialProfileUrl) && (
                      <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Valid profile URL
                      </p>
                    )}
                  </div>

                  {/* Phone - Required */}
                  <div className="border rounded-xl p-4 border-border">
                    <div className="flex items-center gap-3 mb-3">
                      <Phone className="w-5 h-5 text-primary" />
                      <span className="font-medium text-foreground">Mobile / WhatsApp Number *</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">We may contact you to verify your identity</p>
                    <Input
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={formData.phoneNumber}
                      onChange={(e) => updateField("phoneNumber", e.target.value)}
                    />
                    {formData.phoneNumber && !isValidPhone(formData.phoneNumber) && (
                      <p className="text-xs text-destructive mt-2">
                        Please enter a valid phone number (at least 10 digits)
                      </p>
                    )}
                    {isValidPhone(formData.phoneNumber) && (
                      <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Valid phone number
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 mt-8">
                  <Button variant="outline" onClick={goBack}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button 
                    className="flex-1" 
                    onClick={handleProceed}
                    disabled={!canProceed() || isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        Submit Request
                        <Send className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Pending Review Step */}
            {currentStep === "pending_review" && (
              <PendingReviewScreen 
                email={formData.email}
                redirectCountdown={redirectCountdown}
                setRedirectCountdown={setRedirectCountdown}
              />
            )}

            {/* Complete Step */}
            {currentStep === "complete" && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-8 text-center"
              >
                <motion.div 
                  className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                >
                  <Check className="w-8 h-8 text-green-500" />
                </motion.div>
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  Access Granted
                </h1>
                <p className="text-muted-foreground mb-6">
                  Welcome to the alfred ai Investor Portal
                </p>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
                >
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading investor materials...
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Trust indicators */}
        {currentStep !== "complete" && currentStep !== "pending_review" && (
          <div className="mt-6 flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Shield className="w-3 h-3" />
              Secure & Confidential
            </div>
            <div className="w-1 h-1 rounded-full bg-muted-foreground/50" />
            <div>SOC 2 Compliant</div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
