import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import confetti from "canvas-confetti";
import { useSubmissionTimeout } from "@/hooks/useSubmissionTimeout";
import { 
  MessageSquare, 
  FileText, 
  Loader2, 
  Calendar, 
  Send,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Mail,
  ShieldCheck,
  Building2,
  Briefcase,
  User,
  HelpCircle,
  ArrowLeft,
  Check,
  ChevronDown,
  Phone,
  Globe,
  Users,
  Clock,
  Target,
  Factory
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useRecaptcha } from "@/hooks/useRecaptcha";
import { ChatAvatar, ChatMessage } from "@/components/chat/shared";
import { cn } from "@/lib/utils";
import { GHLBookingWidget } from "@/components/GHLBookingWidget";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { logGHLSubmissionInBackground, flushPendingGHLSubmissions } from "@/hooks/useGHLLogging";
import { getLeadIdentitySync } from "@/hooks/useLeadIdentity";
import { getUTMData } from "@/lib/utmTracking";
import {
  COUNTRY_CODES,
  detectCountryFromLocale,
  formatPhoneDisplay as formatPhoneForCountry,
  validatePhoneForCountry,
  formatInternationalPhone,
  getCountryByCode,
  saveCountryCode,
} from "@/lib/phoneUtils";

interface LeadCaptureChoiceProps {
  type: "demo" | "contact";
  onComplete?: (data: LeadData) => void;
  initialMode?: "choice" | "form" | "chat";
}

interface LeadData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  topic?: string;
  message?: string;
  industry?: string;
  teamSize?: string;
  timeline?: string;
  challenge?: string;
}

type CaptureMode = "choice" | "form" | "chat" | "success" | "booking";

interface Question {
  id: string;
  question: string;
  placeholder?: string;
  type?: string;
  options?: string[];
  optional?: boolean;
  icon: typeof User;
}

// Mirrored from Book an Impact Conversation chatbot (BookingConstants.ts)
// Flow: Role → Industry → Challenge → Team Size → Timeline → Name → Email → Company
const DEMO_QUESTIONS: Question[] = [
  { 
    id: "role", 
    question: "What's your role?", 
    options: ["CEO / Founder", "CFO", "CTO", "Operations Leader", "Project Manager", "Admin / EA", "Customer Service", "HR / People Ops", "Other"], 
    icon: Briefcase 
  },
  { 
    id: "industry", 
    question: "What industry are you in?", 
    options: ["Construction & Contracting", "Property Services", "Professional Services", "Insurance & Risk", "Marketing Agency", "Associations & Charities", "Other"], 
    icon: Factory 
  },
  { 
    id: "challenge", 
    question: "What's your biggest operational challenge?", 
    options: ["Reduce admin & paperwork", "Improve client communication", "Streamline project management", "Scale without hiring", "Other"], 
    icon: Target 
  },
  { 
    id: "size", 
    question: "How big is your team?", 
    options: ["1-10 employees", "11-50 employees", "51-200 employees", "200+ employees"], 
    icon: Users 
  },
  { 
    id: "timeline", 
    question: "When are you looking to get started?", 
    options: ["Immediately / ASAP", "Next quarter", "Exploring options"], 
    icon: Clock 
  },
  { 
    id: "name", 
    question: "Great! What's your name?", 
    placeholder: "Enter your full name", 
    type: "text", 
    icon: User 
  },
  { 
    id: "email", 
    question: "And your work email?", 
    placeholder: "you@company.com", 
    type: "email", 
    icon: Mail 
  },
  { 
    id: "company", 
    question: "Last one — what company are you with?", 
    placeholder: "Company name", 
    type: "text", 
    icon: Building2 
  },
];

const CONTACT_QUESTIONS: Question[] = [
  { id: "name", question: "What's your name?", placeholder: "Enter your full name", type: "text", icon: User },
  { id: "email", question: "What's your email?", placeholder: "you@company.com", type: "email", icon: Mail },
  { id: "company", question: "What company are you with? (optional)", placeholder: "Company name", type: "text", optional: true, icon: Building2 },
  { id: "help", question: "How can we help you?", placeholder: "Tell us about your needs...", type: "textarea", icon: MessageSquare },
];

const LeadCaptureChoice = ({ type, onComplete, initialMode = "choice" }: LeadCaptureChoiceProps) => {
  const { toast } = useToast();
  const { verifyRecaptcha, isReady: recaptchaReady } = useRecaptcha();
  const [mode, setMode] = useState<CaptureMode>(initialMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Prevents double-submits from rapid taps/clicks before React state updates propagate.
  const submitLockRef = useRef(false);
  // Pending lead data for retry functionality
  const pendingLeadDataRef = useRef<LeadData | null>(null);
  // Re-send any lead left queued from an earlier visit (failed or tab closed).
  useEffect(() => { void flushPendingGHLSubmissions(); }, []);

  // Submission timeout management with retry support
  const submissionTimeout = useSubmissionTimeout({
    timeoutMs: 15000, // 15 seconds
    maxRetries: 3,
    onTimeout: () => {
      toast({
        title: "Taking longer than expected",
        description: "The request is still processing. You can retry or wait.",
        variant: "default",
      });
    },
    onMaxRetriesExceeded: () => {
      toast({
        title: "Please try again later",
        description: "We're having trouble connecting. Your information was not lost.",
        variant: "destructive",
      });
    },
  });
  
  // Topic options for contact form
  const TOPIC_OPTIONS = [
    "General Inquiry",
    "Product Information",
    "Pricing & Plans",
    "Technical Support",
    "Partnership Opportunities",
    "Press & Media",
    "Career Inquiries",
    "Feedback & Suggestions",
    "Other"
  ];

  // Country code state for phone field
  const [countryCode, setCountryCode] = useState(() => detectCountryFromLocale());

  // Form state — prefill from unified lead identity
  const [formData, setFormData] = useState(() => {
    const identity = getLeadIdentitySync();
    const firstName = identity.firstName || identity.name?.split(' ')[0] || '';
    const lastName = identity.lastName || identity.name?.split(' ').slice(1).join(' ') || '';
    return {
      firstName,
      lastName,
      email: identity.email || '',
      phone: identity.phone || '',
      company: identity.company || '',
      jobTitle: '',
      topic: '',
      message: '',
    };
  });

  // Last submitted (or attempted) lead payload.
  // This is the single source of truth for what should be prefilled into the calendar,
  // even when duplicate-prevention short-circuits the network request.
  const [lastSubmittedLead, setLastSubmittedLead] = useState<LeadData | null>(null);
  
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // Focus states for floating labels
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Chat state — prefill answers from stored identity
  const [chatAnswers, setChatAnswers] = useState<Record<string, string>>(() => {
    const identity = getLeadIdentitySync();
    const prefilled: Record<string, string> = {};
    const fullName = identity.name || `${identity.firstName || ''} ${identity.lastName || ''}`.trim();
    if (fullName) prefilled.name = fullName;
    if (identity.email) prefilled.email = identity.email;
    if (identity.company) prefilled.company = identity.company;
    return prefilled;
  });

  // Calculate starting question index: skip consecutive questions that already have prefilled answers
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(() => {
    const identity = getLeadIdentitySync();
    const prefilled: Record<string, string> = {};
    const fullName = identity.name || `${identity.firstName || ''} ${identity.lastName || ''}`.trim();
    if (fullName) prefilled.name = fullName;
    if (identity.email) prefilled.email = identity.email;
    if (identity.company) prefilled.company = identity.company;

    const qs = type === "demo" ? DEMO_QUESTIONS : CONTACT_QUESTIONS;
    let startIndex = 0;
    for (let i = 0; i < qs.length; i++) {
      const q = qs[i];
      if (prefilled[q.id] && prefilled[q.id].trim()) {
        startIndex = i + 1;
      } else {
        break;
      }
    }
    return Math.min(startIndex, qs.length - 1);
  });
  // How many questions were auto-skipped (for toast)
  const skippedCountRef = useRef(() => {
    const identity = getLeadIdentitySync();
    const prefilled: Record<string, string> = {};
    const fullName = identity.name || `${identity.firstName || ''} ${identity.lastName || ''}`.trim();
    if (fullName) prefilled.name = fullName;
    if (identity.email) prefilled.email = identity.email;
    if (identity.company) prefilled.company = identity.company;
    const qs = type === "demo" ? DEMO_QUESTIONS : CONTACT_QUESTIONS;
    let count = 0;
    for (let i = 0; i < qs.length; i++) {
      if (prefilled[qs[i].id]?.trim()) count++;
      else break;
    }
    return count;
  });

  const [chatInput, setChatInput] = useState("");

  // Track if we've shown the prefill toast (moved to top level for hooks rules)
  const [hasShownPrefillToast, setHasShownPrefillToast] = useState(false);

  // Show welcome-back toast when questions were auto-skipped in chat mode
  useEffect(() => {
    const skipped = typeof skippedCountRef.current === 'function' ? skippedCountRef.current() : 0;
    // Store the computed value so we don't re-call
    if (typeof skippedCountRef.current === 'function') {
      const val = skippedCountRef.current();
      skippedCountRef.current = (() => val) as any;
    }
    if (skipped > 0 && mode === "chat" && !hasShownPrefillToast) {
      toast({
        title: "👋 Welcome back!",
        description: `We remembered your details — skipped ${skipped} ${skipped === 1 ? 'question' : 'questions'} for you.`,
        duration: 4000,
      });
      setHasShownPrefillToast(true);
    }
  }, [mode]);

  // Handle edge case: all questions already prefilled — auto-submit
  const allPrefillSubmittedRef = useRef(false);
  useEffect(() => {
    if (mode !== "chat" || allPrefillSubmittedRef.current) return;
    const qs = type === "demo" ? DEMO_QUESTIONS : CONTACT_QUESTIONS;
    const allAnswered = qs.every(q => chatAnswers[q.id]?.trim());
    if (allAnswered) {
      allPrefillSubmittedRef.current = true;
      // Auto-submit after a brief delay so user sees the summary
      const timer = setTimeout(() => {
        submitLead({
          firstName: chatAnswers.name || "",
          lastName: "",
          email: chatAnswers.email || "",
          company: chatAnswers.company || "",
          jobTitle: chatAnswers.role || "",
          industry: chatAnswers.industry || "",
          teamSize: chatAnswers.size || "",
          timeline: chatAnswers.timeline || "",
          challenge: chatAnswers.challenge || chatAnswers.help || "",
          message: chatAnswers.help || "",
        });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [mode, chatAnswers]);

  // Phone validation using shared utility
  const validatePhone = (phone: string): { isValid: boolean; error?: string } => {
    return validatePhoneForCountry(phone, countryCode);
  };

  // Format phone input using shared utility
  const formatPhoneDisplay = (value: string): string => {
    const cleaned = value.replace(/[^\d\s\-()]/g, "");
    return formatPhoneForCountry(cleaned, countryCode);
  };

  const questions = type === "demo" ? DEMO_QUESTIONS : CONTACT_QUESTIONS;
  const currentQuestion = questions[currentQuestionIndex];

  // Trigger confetti on success
  useEffect(() => {
    if (mode === "success") {
      const duration = 2000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#8B5CF6', '#D946EF', '#0EA5E9']
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#8B5CF6', '#D946EF', '#0EA5E9']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [mode]);

  // Show prefill confirmation toast when entering booking mode
  // Also persist the latest identity so the booking iframe always uses what the user just entered.
  useEffect(() => {
    if (mode === "booking" && !hasShownPrefillToast) {
      const effective = lastSubmittedLead || {
        firstName: formData.firstName || chatAnswers.name || "",
        lastName: formData.lastName || "",
        email: formData.email || chatAnswers.email || "",
        phone: formData.phone || "",
        company: formData.company || chatAnswers.company || "",
      };

      const fullName = effective.firstName
        ? `${effective.firstName} ${effective.lastName || ""}`.trim()
        : "";

      const email = effective.email || "";
      const company = effective.company || "";
      const phone = effective.phone || "";

      // Force-sync identity right before showing the calendar.
      // This prevents stale localStorage data from previous submissions.
      if (email) {
        persistLeadIdentity(effective);
      }

      const prefilledFields: string[] = [];
      if (fullName) prefilledFields.push("Name");
      if (email) prefilledFields.push("Email");
      if (phone) prefilledFields.push("Phone");
      if (company) prefilledFields.push("Company");

      if (prefilledFields.length > 0) {
        toast({
          title: "✓ Form pre-filled",
          description: `Your ${prefilledFields.join(", ")} ${prefilledFields.length === 1 ? "has" : "have"} been auto-filled in the calendar.`,
          duration: 4000,
        });
      }

      setHasShownPrefillToast(true);
    }
  }, [mode, hasShownPrefillToast, lastSubmittedLead, formData, chatAnswers, toast]);

  // Helper to persist lead identity for GHL pre-filling
  function persistLeadIdentity(data: LeadData) {
    // Handle both cases:
    // 1. Form mode: firstName and lastName are separate fields
    // 2. Chat mode: firstName may contain full name, lastName is empty
    let firstName = data.firstName?.trim() || "";
    let lastName = data.lastName?.trim() || "";

    // If firstName looks like a full name (contains space) and lastName is empty,
    // split it into first and last name
    if (firstName.includes(" ") && !lastName) {
      const nameParts = firstName.split(/\s+/);
      firstName = nameParts[0] || "";
      lastName = nameParts.slice(1).join(" ") || "";
    }

    const fullName = `${firstName} ${lastName}`.trim();

    // Format phone with country code if available
    let formattedPhone = data.phone || undefined;
    if (data.phone && countryCode) {
      const country = getCountryByCode(countryCode);
      if (country && !data.phone.startsWith("+") && !data.phone.startsWith(country.dialCode)) {
        formattedPhone = formatInternationalPhone(data.phone, countryCode);
      }
    }

    console.log("💾 Persisting lead identity:", {
      firstName,
      lastName,
      fullName,
      email: data.email,
      phone: formattedPhone,
      company: data.company,
    });

    localStorage.setItem(
      "alfred_lead_identity",
      JSON.stringify({
        name: fullName,
        firstName,
        lastName,
        email: data.email,
        phone: formattedPhone,
        company: data.company || undefined,
      })
    );
  }

  // Submit to Supabase with reCAPTCHA verification and duplicate prevention
  const submitLead = async (data: LeadData) => {
    if (submitLockRef.current) return;
    submitLockRef.current = true;
    setIsSubmitting(true);
    pendingLeadDataRef.current = data; // Store for retry
    submissionTimeout.startSubmission();
    
    try {
      // Always capture the latest attempted payload so the calendar prefill
      // uses what the user just typed (even if duplicate-prevention short-circuits).
      setLastSubmittedLead(data);

      // ROBUST DUPLICATE PREVENTION:
      // 1. Check by email only (regardless of page path) for cross-page duplicates
      // 2. Use localStorage for persistence across browser tabs/sessions
      // 3. Check sessionStorage for same-tab protection
      
      const normalizedEmail = data.email.toLowerCase().trim();
      const localStorageKey = `alfred_lead_submitted_${normalizedEmail}`;
      const sessionStorageKey = `lead_submitted_${normalizedEmail}`;
      
      // Check localStorage first (persists across sessions - 30 min window)
      const localSubmission = localStorage.getItem(localStorageKey);
      if (localSubmission) {
        const timeSinceSubmission = Date.now() - parseInt(localSubmission, 10);
        if (timeSinceSubmission < 30 * 60 * 1000) {
          console.log("Skipping duplicate lead - already submitted within 30 minutes (localStorage)");
          persistLeadIdentity(data);
          submissionTimeout.completeSubmission();
          setMode("success");
          onComplete?.(data);
          setIsSubmitting(false);
          submitLockRef.current = false;
          return;
        }
      }
      
      // Check sessionStorage (same tab protection - 5 min window)
      const sessionSubmission = sessionStorage.getItem(sessionStorageKey);
      if (sessionSubmission) {
        const timeSinceSubmission = Date.now() - parseInt(sessionSubmission, 10);
        if (timeSinceSubmission < 5 * 60 * 1000) {
          console.log("Skipping duplicate lead - already submitted within 5 minutes (sessionStorage)");
          persistLeadIdentity(data);
          submissionTimeout.completeSubmission();
          setMode("success");
          onComplete?.(data);
          setIsSubmitting(false);
          submitLockRef.current = false;
          return;
        }
      }

      // Verify reCAPTCHA first
      const recaptchaResult = await verifyRecaptcha(type === 'demo' ? 'demo_request' : 'contact_form');
      if (!recaptchaResult.success) {
        toast({
          title: "Verification failed",
          description: recaptchaResult.error || "Please try again.",
          variant: "destructive",
        });
        submissionTimeout.failSubmission();
        setIsSubmitting(false);
        submitLockRef.current = false;
        return;
      }

      // Mark as submitted immediately to prevent race conditions (both storage types)
      const now = Date.now().toString();
      localStorage.setItem(localStorageKey, now);
      sessionStorage.setItem(sessionStorageKey, now);

      // Persist lead identity for GHL pre-filling
      persistLeadIdentity(data);
      
      // Parse name for logging
      const nameParts = data.firstName.trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || data.lastName || "";
      const fullName = `${firstName} ${lastName}`.trim();

      // Note: We only log to GHL via logGHLSubmission which handles syncing to both
      // ghl_submissions AND leads tables. This prevents duplicate leads table entries.
      // The log-ghl-submission edge function has built-in deduplication logic.

      console.log("Lead captured for GHL integration:", {
        email: data.email,
        firstName,
        lastName,
        fullName,
        phone: data.phone,
        company: data.company,
        jobTitle: data.jobTitle,
        message: data.message,
        topic: data.topic,
        industry: data.industry,
        teamSize: data.teamSize,
        timeline: data.timeline,
        challenge: data.challenge,
        source: window.location.href,
        captured_at: new Date().toISOString(),
        capture_method: mode === "chat" ? "chatbot" : "form",
      });

      // Log GHL submission for tracking with enhanced source tags
      const captureMethod = mode === "chat" ? "guided_chat" : "quick_form";
      
      // Generate descriptive campaign tag - never use "unknown"
      const getSubmissionCampaign = (): string => {
        const path = window.location.pathname;
        if (path === "/book-demo") {
          return mode === "chat" ? "book_demo_chat_lead" : "book_demo_form_lead";
        }
        if (path === "/contact") {
          return mode === "chat" ? "contact_chat_lead" : "contact_form_lead";
        }
        // Fallback with page context - ensure no unknown values
        const pageSlug = path.replace(/^\//, "").replace(/\//g, "_") || "homepage";
        return `${type}_${captureMethod}_${pageSlug}`;
      };

      console.log("📋 Lead submission:", {
        email: data.email,
        name: fullName,
        phone: data.phone,
        company: data.company,
        captureMethod,
        campaign: getSubmissionCampaign(),
        page: window.location.pathname,
      });
      
      const utmData = getUTMData();
      // Sent in the background: the visitor moves on immediately, and the
      // queued payload is retried on a later visit if this send fails.
      logGHLSubmissionInBackground({
        lead_email: data.email,
        lead_name: fullName,
        lead_phone: data.phone,
        lead_company: data.company,
        source_page: window.location.pathname,
        source_medium: captureMethod,
        source_campaign: getSubmissionCampaign(),
        ghl_status: "submitted",
        qualification_data: {
          role: data.jobTitle,
          industry: data.industry,
          challenge: data.challenge,
          teamSize: data.teamSize,
          timeline: data.timeline,
          topic: data.topic,
        } as any,
        utm_data: utmData as Record<string, unknown>,
      });

      submissionTimeout.completeSubmission();
      setMode("success");
      onComplete?.(data);
    } catch (error) {
      console.error("Error submitting lead:", error);
      submissionTimeout.failSubmission();
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      submitLockRef.current = false;
    }
  };

  // Retry handler for timed-out submissions
  const handleRetrySubmission = useCallback(() => {
    if (!pendingLeadDataRef.current || !submissionTimeout.canRetry) return;
    submitLockRef.current = false; // Allow retry
    submissionTimeout.retry();
    submitLead(pendingLeadDataRef.current);
  }, [submissionTimeout.canRetry]);

  // Form submission handler
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate phone before submission
    const phoneValidation = validatePhone(formData.phone);
    if (!phoneValidation.isValid) {
      setPhoneError(phoneValidation.error || "Invalid phone number");
      return;
    }
    
    setPhoneError(null);
    
    // Format phone with country code for international format
    const formattedPhone = formData.phone 
      ? formatInternationalPhone(formData.phone, countryCode)
      : undefined;
    
    await submitLead({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formattedPhone,
      company: formData.company,
      jobTitle: formData.jobTitle,
      topic: formData.topic,
      message: formData.message,
    });
  };

  // Chat answer handler
  const handleChatAnswer = async (answer: string) => {
    if (isSubmitting || submitLockRef.current) return;
    const newAnswers = { ...chatAnswers, [currentQuestion.id]: answer };
    setChatAnswers(newAnswers);
    setChatInput("");

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // All questions answered - submit with all collected data
      await submitLead({
        firstName: newAnswers.name || "",
        lastName: "",
        email: newAnswers.email || "",
        company: newAnswers.company || "",
        jobTitle: newAnswers.role || "",
        industry: newAnswers.industry || "",
        teamSize: newAnswers.size || "",
        timeline: newAnswers.timeline || "",
        challenge: newAnswers.challenge || newAnswers.help || "",
        message: newAnswers.help || "",
      });
    }
  };

  const handleChatInputSubmit = () => {
    if (!chatInput.trim() && !currentQuestion.optional) return;
    handleChatAnswer(chatInput.trim());
  };

  const handleGoBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      // Remove the last answer
      const questionId = questions[currentQuestionIndex].id;
      const newAnswers = { ...chatAnswers };
      delete newAnswers[questionId];
      setChatAnswers(newAnswers);
    }
  };

  // Choice screen - mobile-first with header prioritized
  if (mode === "choice") {
    return (
      <div className="space-y-6">
        {/* Header first on mobile */}
        <div className="text-center">
          <p className="text-muted-foreground">Choose your preferred way to connect</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Chat Option */}
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setMode("chat")}
            className="group relative p-6 rounded-2xl border-2 border-primary/30 hover:border-primary bg-gradient-to-br from-primary/10 via-primary/5 to-transparent transition-all duration-300 text-left overflow-hidden"
          >
            {/* Animated gradient border */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20" />
            </div>
            
            <div className="relative">
              <motion.div 
                className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4 shadow-lg shadow-primary/30"
                whileHover={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.5 }}
              >
                <MessageSquare className="w-7 h-7 text-primary-foreground" />
              </motion.div>
              
              <h3 className="font-semibold text-lg text-foreground mb-2">Guided Chat</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Answer a few quick questions with our AI assistant
              </p>
              
              <div className="flex items-center gap-2 text-primary text-sm font-medium">
                Start Chat 
                <motion.span
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowRight className="w-4 h-4" />
                </motion.span>
              </div>
              
              {/* Sparkle decoration */}
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <Sparkles className="w-5 h-5 text-primary animate-pulse" />
              </div>
            </div>
          </motion.button>

          {/* Form Option */}
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setMode("form")}
            className="group p-6 rounded-2xl border-2 border-border hover:border-primary/50 bg-card transition-all duration-300 text-left"
          >
            <motion.div 
              className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors"
              whileHover={{ rotate: [0, -5, 5, 0] }}
              transition={{ duration: 0.4 }}
            >
              <FileText className="w-7 h-7 text-muted-foreground group-hover:text-primary transition-colors" />
            </motion.div>
            
            <h3 className="font-semibold text-lg text-foreground mb-2">Quick Form</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Fill out a simple form at your own pace
            </p>
            
            <div className="flex items-center gap-2 text-muted-foreground group-hover:text-primary text-sm font-medium transition-colors">
              Open Form 
              <ArrowRight className="w-4 h-4" />
            </div>
          </motion.button>
        </div>
      </div>
    );
  }

  if (mode === "booking") {
    const effective = lastSubmittedLead || {
      firstName: formData.firstName || chatAnswers.name || "",
      lastName: formData.lastName || "",
      email: formData.email || chatAnswers.email || "",
      phone: formData.phone || "",
      company: formData.company || chatAnswers.company || "",
    };

    const fullName = effective.firstName
      ? `${effective.firstName} ${effective.lastName || ""}`.trim()
      : "";

    const phone = effective.phone ? formatInternationalPhone(effective.phone, countryCode) : "";

    // Build lead data from the latest submitted/attempted payload
    const leadData = {
      name: fullName,
      email: effective.email || "",
      company: effective.company || "",
      phone,
    };
    
    // Determine capture method and campaign based on which data source has values
    const captureMethod = Object.keys(chatAnswers).length > 0 ? "guided_chat" : "quick_form";
    
    // Generate descriptive campaign tag based on page and type
    const getBookingCampaign = (): string => {
      const path = window.location.pathname;
      if (path === "/book-demo") {
        return captureMethod === "guided_chat" ? "book_demo_chat" : "book_demo_form";
      }
      if (path === "/contact") {
        return captureMethod === "guided_chat" ? "contact_chat" : "contact_form";
      }
      // Fallback with page context
      const pageSlug = path.replace(/^\//, "").replace(/\//g, "_") || "homepage";
      return `${type}_${captureMethod}_${pageSlug}`;
    };

    console.log("📅 Booking widget initialized:", {
      leadData,
      captureMethod,
      campaign: getBookingCampaign(),
      page: window.location.pathname,
    });
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <button
            onClick={() => setMode("success")}
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back
          </button>
        </div>
        
        <div className="text-center mb-4">
          <h3 className="text-xl font-semibold text-foreground mb-1">
            Book Your Call
          </h3>
          <p className="text-sm text-muted-foreground">
            Select a time that works for you
          </p>
        </div>

        <GHLBookingWidget
          key={`booking-${leadData.email}-${leadData.name}-${leadData.phone}-${leadData.company}`}
          leadData={leadData}
          sourceData={{
            source: "website",
            medium: captureMethod,
            campaign: getBookingCampaign(),
            content: window.location.pathname,
          }}
          height={500}
          variant="inline"
        />
      </motion.div>
    );
  }

  // Success screen with confetti
  if (mode === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-8 space-y-6"
      >
        {/* Animated checkmark */}
        <div className="relative w-24 h-24 mx-auto">
          <motion.div 
            className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-500/5"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
          />
          <motion.div 
            className="absolute inset-2 rounded-full bg-gradient-to-br from-emerald-500/30 to-emerald-500/10"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          />
          <motion.div 
            className="absolute inset-0 flex items-center justify-center"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.5, delay: 0.2, type: "spring" }}
          >
            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
          </motion.div>
        </div>
        
        <div>
          <motion.h3 
            className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent mb-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {type === "demo" ? "Demo Request Received!" : "Message Sent!"}
          </motion.h3>
          <motion.p 
            className="text-muted-foreground max-w-md mx-auto"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {type === "demo" 
              ? "Thank you for your interest! Pick your time to fast-track your demo."
              : "Thank you for reaching out! Want to chat sooner? Pick your time."
            }
          </motion.p>
        </div>

        {/* Book Now CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Button
            size="lg"
            onClick={() => setMode("booking")}
            className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-primary-foreground shadow-lg shadow-primary/30"
          >
            <Calendar className="w-5 h-5 mr-2" />
            Pick Your Time
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </motion.div>

        {/* What happens next */}
        <motion.div 
          className="bg-muted/30 rounded-xl p-4 max-w-sm mx-auto border border-border/50"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Or we'll reach out</p>
          <div className="space-y-2.5">
            {[
              { icon: Mail, text: "Confirmation email sent to your inbox" },
              { icon: Calendar, text: type === "demo" ? "We'll reach out within 24 hours" : "Response within 1-2 business days" },
            ].map((item, idx) => (
              <motion.div 
                key={idx}
                className="flex items-center gap-2.5 text-sm text-foreground"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + idx * 0.1 }}
              >
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <item.icon className="w-3 h-3 text-primary" />
                </div>
                {item.text}
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setMode("choice");
              setCurrentQuestionIndex(0);
              setChatAnswers({});
              setFormData({ firstName: "", lastName: "", email: "", phone: "", company: "", jobTitle: "", topic: "", message: "" });
            }}
            className="min-h-[44px] text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:bg-primary focus-visible:text-primary-foreground active:bg-primary/90"
          >
            Submit Another Request
          </Button>
        </motion.div>
      </motion.div>
    );
  }

  // Form mode with floating labels
  if (mode === "form") {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="relative"
      >
        {/* Submitting overlay - blurs form and shows centered loader */}
        <AnimatePresence>
          {isSubmitting && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 flex items-center justify-center bg-background/60 backdrop-blur-sm rounded-xl"
            >
              <div className="flex flex-col items-center gap-3 p-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-foreground font-medium">Submitting…</p>
                <p className="text-xs text-muted-foreground text-center max-w-[200px]">
                  This may take a few seconds the first time.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {initialMode === "choice" && (
          <button
            onClick={() => setMode("choice")}
            disabled={isSubmitting}
            className="text-sm text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1 group disabled:opacity-50"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to options
          </button>
        )}
        
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
            {type === "demo" ? (
              <Calendar className="w-6 h-6 text-primary-foreground" />
            ) : (
              <Send className="w-6 h-6 text-primary-foreground" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-semibold">
              {type === "demo" ? "Schedule Your Demo" : "Send Us a Message"}
            </h2>
            <p className="text-sm text-muted-foreground">Fill out the form below</p>
          </div>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* First Name */}
            <div className="relative">
              <Input
                placeholder=" "
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                onFocus={() => setFocusedField("firstName")}
                onBlur={() => setFocusedField(null)}
                required
                disabled={isSubmitting}
                className={cn(
                  "pt-6 pb-2 h-14 transition-all",
                  (focusedField === "firstName" || formData.firstName) && "border-primary"
                )}
              />
              <label className={cn(
                "absolute left-3 transition-all pointer-events-none text-muted-foreground",
                (focusedField === "firstName" || formData.firstName) 
                  ? "top-2 text-xs text-primary" 
                  : "top-1/2 -translate-y-1/2 text-sm"
              )}>
                First name
              </label>
              {formData.firstName && (
                <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
              )}
            </div>
            
            {/* Last Name */}
            <div className="relative">
              <Input
                placeholder=" "
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                onFocus={() => setFocusedField("lastName")}
                onBlur={() => setFocusedField(null)}
                required
                disabled={isSubmitting}
                className={cn(
                  "pt-6 pb-2 h-14 transition-all",
                  (focusedField === "lastName" || formData.lastName) && "border-primary"
                )}
              />
              <label className={cn(
                "absolute left-3 transition-all pointer-events-none text-muted-foreground",
                (focusedField === "lastName" || formData.lastName) 
                  ? "top-2 text-xs text-primary" 
                  : "top-1/2 -translate-y-1/2 text-sm"
              )}>
                Last name
              </label>
              {formData.lastName && (
                <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
              )}
            </div>
          </div>
          
          {/* Email */}
          <div className="relative">
            <Input
              type="email"
              placeholder=" "
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              onFocus={() => setFocusedField("email")}
              onBlur={() => setFocusedField(null)}
              required
              disabled={isSubmitting}
              className={cn(
                "pt-6 pb-2 h-14 transition-all",
                (focusedField === "email" || formData.email) && "border-primary"
              )}
            />
            <label className={cn(
              "absolute left-3 transition-all pointer-events-none text-muted-foreground",
              (focusedField === "email" || formData.email) 
                ? "top-2 text-xs text-primary" 
                : "top-1/2 -translate-y-1/2 text-sm"
            )}>
              {type === "demo" ? "Work email" : "Email address"}
            </label>
            {formData.email && formData.email.includes("@") && (
              <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
            )}
          </div>
          
          {/* Phone with Country Code */}
          <div className="relative">
            <div className="flex gap-2">
              <Select 
                value={countryCode} 
                onValueChange={(value) => {
                  setCountryCode(value);
                  saveCountryCode(value);
                }}
                disabled={isSubmitting}
              >
                <SelectTrigger className="w-[100px] h-14 flex-shrink-0">
                  <SelectValue>
                    <span className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>{getCountryByCode(countryCode)?.dialCode}</span>
                    </span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {COUNTRY_CODES.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      <span className="flex items-center gap-2">
                        <span className="font-medium">{country.dialCode}</span>
                        <span className="text-muted-foreground text-xs">{country.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative flex-1">
                <Input
                  type="tel"
                  placeholder={getCountryByCode(countryCode)?.placeholder || "Phone number"}
                  value={formData.phone}
                  onChange={(e) => {
                    const formatted = formatPhoneDisplay(e.target.value);
                    setFormData({ ...formData, phone: formatted });
                    if (phoneError) {
                      const validation = validatePhone(formatted);
                      if (validation.isValid) {
                        setPhoneError(null);
                      }
                    }
                  }}
                  onFocus={() => setFocusedField("phone")}
                  onBlur={() => {
                    setFocusedField(null);
                    if (formData.phone) {
                      const validation = validatePhone(formData.phone);
                      setPhoneError(validation.isValid ? null : validation.error || null);
                    }
                  }}
                  required
                  disabled={isSubmitting}
                  className={cn(
                    "h-14 transition-all",
                    (focusedField === "phone" || formData.phone) && !phoneError && "border-primary",
                    phoneError && "border-destructive"
                  )}
                />
                {formData.phone && validatePhone(formData.phone).isValid && (
                  <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                )}
              </div>
            </div>
            {phoneError && (
              <p className="text-xs text-destructive mt-1 ml-1">{phoneError}</p>
            )}
          </div>
          
          {/* Company */}
          <div className="relative">
            <Input
              placeholder=" "
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              onFocus={() => setFocusedField("company")}
              onBlur={() => setFocusedField(null)}
              disabled={isSubmitting}
              className={cn(
                "pt-6 pb-2 h-14 transition-all",
                (focusedField === "company" || formData.company) && "border-primary"
              )}
            />
            <label className={cn(
              "absolute left-3 transition-all pointer-events-none text-muted-foreground",
              (focusedField === "company" || formData.company) 
                ? "top-2 text-xs text-primary" 
                : "top-1/2 -translate-y-1/2 text-sm"
            )}>
              Company
            </label>
          </div>
          
          {type === "demo" ? (
            <div className="relative">
              <Input
                placeholder=" "
                value={formData.jobTitle}
                onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                onFocus={() => setFocusedField("jobTitle")}
                onBlur={() => setFocusedField(null)}
                disabled={isSubmitting}
                className={cn(
                  "pt-6 pb-2 h-14 transition-all",
                  (focusedField === "jobTitle" || formData.jobTitle) && "border-primary"
                )}
              />
              <label className={cn(
                "absolute left-3 transition-all pointer-events-none text-muted-foreground",
                (focusedField === "jobTitle" || formData.jobTitle) 
                  ? "top-2 text-xs text-primary" 
                  : "top-1/2 -translate-y-1/2 text-sm"
              )}>
                Job title
              </label>
            </div>
          ) : (
            <>
              {/* Topic Dropdown */}
              <div className="relative">
                <Select
                  value={formData.topic}
                  onValueChange={(value) => setFormData({ ...formData, topic: value })}
                  disabled={isSubmitting}
                >
                  <SelectTrigger 
                    className={cn(
                      "h-14 pt-4 pb-2 transition-all bg-background",
                      formData.topic && "border-primary"
                    )}
                  >
                    <SelectValue placeholder=" " />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border z-50">
                    {TOPIC_OPTIONS.map((topic) => (
                      <SelectItem key={topic} value={topic} className="cursor-pointer">
                        {topic}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <label className={cn(
                  "absolute left-3 transition-all pointer-events-none text-muted-foreground",
                  formData.topic 
                    ? "top-2 text-xs text-primary" 
                    : "top-1/2 -translate-y-1/2 text-sm"
                )}>
                  Topic
                </label>
                {formData.topic && (
                  <Check className="absolute right-10 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                )}
              </div>

              {/* Message Textarea */}
              <div className="relative">
                <Textarea
                  placeholder=" "
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  onFocus={() => setFocusedField("message")}
                  onBlur={() => setFocusedField(null)}
                  required
                  disabled={isSubmitting}
                  className={cn(
                    "pt-6 pb-2 min-h-[120px] transition-all resize-none",
                    (focusedField === "message" || formData.message) && "border-primary"
                  )}
                />
                <label className={cn(
                  "absolute left-3 transition-all pointer-events-none text-muted-foreground bg-background px-1",
                  (focusedField === "message" || formData.message) 
                    ? "top-2 text-xs text-primary" 
                    : "top-4 text-sm"
                )}>
                  How can we help?
                </label>
              </div>
            </>
          )}
          
          <Button type="submit" className="w-full h-12 text-base" disabled={isSubmitting || !recaptchaReady}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              type === "demo" ? "Request Demo" : "Send Message"
            )}
          </Button>
          
          <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1.5 mt-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            Protected by reCAPTCHA
          </p>
        </form>
      </motion.div>
    );
  }

  // Chat mode with enhanced UX - blur + centered submitting overlay
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-4 relative"
    >
      {/* Submitting overlay - blurs chatbox and shows centered loader with timeout/retry */}
      <AnimatePresence>
        {(isSubmitting || submissionTimeout.status === "timeout") && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex items-center justify-center bg-background/60 backdrop-blur-sm rounded-xl"
          >
            <div className="flex flex-col items-center gap-3 p-4 max-w-[280px]">
              {submissionTimeout.status === "timeout" ? (
                <>
                  <AlertTriangle className="w-8 h-8 text-amber-500" />
                  <p className="text-sm text-foreground font-medium text-center">
                    Taking longer than expected
                  </p>
                  <p className="text-xs text-muted-foreground text-center">
                    The request is still processing. You can retry or wait a bit longer.
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleRetrySubmission}
                      disabled={!submissionTimeout.canRetry}
                      className="gap-1.5 min-h-[40px]"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Retry {submissionTimeout.retryCount > 0 && `(${submissionTimeout.retryCount}/3)`}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        submissionTimeout.reset();
                        setIsSubmitting(false);
                        submitLockRef.current = false;
                      }}
                      className="min-h-[40px]"
                    >
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-sm text-foreground font-medium">Submitting…</p>
                  <p className="text-xs text-muted-foreground text-center">
                    {submissionTimeout.elapsedMs > 5000
                      ? "Almost there, please wait..."
                      : "This may take a few seconds the first time."}
                  </p>
                  {submissionTimeout.elapsedMs > 0 && (
                    <div className="w-full max-w-[150px] h-1 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-primary rounded-full"
                        initial={{ width: "0%" }}
                        animate={{ 
                          width: `${Math.min((submissionTimeout.elapsedMs / 15000) * 100, 100)}%` 
                        }}
                        transition={{ duration: 0.1 }}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {initialMode === "choice" && (
        <button
          onClick={() => setMode("choice")}
          disabled={isSubmitting}
          className="text-sm text-muted-foreground hover:text-foreground mb-2 flex items-center gap-1 group disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to options
        </button>
      )}

      {/* Enhanced stepped progress indicator */}
      <div className="flex items-center justify-between mb-6 px-2">
        {questions.map((q, idx) => {
          const QuestionIcon = q.icon;
          const isComplete = idx < currentQuestionIndex;
          const isCurrent = idx === currentQuestionIndex;
          
          return (
            <div key={idx} className="flex items-center">
              <motion.div
                className={cn(
                  "relative flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300",
                  isComplete && "bg-primary text-primary-foreground",
                  isCurrent && "bg-primary/20 text-primary ring-2 ring-primary ring-offset-2 ring-offset-background",
                  !isComplete && !isCurrent && "bg-muted text-muted-foreground"
                )}
                animate={isCurrent ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                {isComplete ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <QuestionIcon className="w-3.5 h-3.5" />
                )}
              </motion.div>
              
              {idx < questions.length - 1 && (
                <div className={cn(
                  "w-4 sm:w-6 h-0.5 mx-0.5 sm:mx-1 transition-colors duration-300",
                  idx < currentQuestionIndex ? "bg-primary" : "bg-muted"
                )} />
              )}
            </div>
          );
        })}
      </div>

      {/* Chat messages */}
      <div className="space-y-4 min-h-[200px]">
        {/* Prefilled summary chips for auto-skipped questions */}
        {(() => {
          const skippedEntries = Object.entries(chatAnswers).filter(([qId]) => {
            const qIdx = questions.findIndex(q => q.id === qId);
            return qIdx >= 0 && qIdx < currentQuestionIndex;
          });
          if (skippedEntries.length === 0) return null;
          const labelMap: Record<string, string> = { name: "Name", email: "Email", company: "Company", role: "Role", industry: "Industry", challenge: "Challenge", size: "Team", timeline: "Timeline" };
          return (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-wrap gap-1.5 pl-11 mb-2"
            >
              {skippedEntries.map(([qId, val]) => (
                <button
                  key={qId}
                  onClick={() => {
                    const idx = questions.findIndex(q => q.id === qId);
                    if (idx >= 0) setCurrentQuestionIndex(idx);
                  }}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors min-h-[28px]"
                  title={`Tap to edit ${labelMap[qId] || qId}`}
                >
                  <Check className="w-3 h-3" />
                  <span className="font-medium">{labelMap[qId] || qId}:</span>
                  <span className="truncate max-w-[120px]">{val}</span>
                </button>
              ))}
            </motion.div>
          );
        })()}

        {/* Previous Q&A using shared ChatMessage component */}
        {Object.entries(chatAnswers).map(([questionId, answer], idx) => {
          const q = questions.find(q => q.id === questionId);
          // Don't show Q&A bubbles for auto-skipped prefilled questions (they're shown as chips above)
          const qIdx = questions.findIndex(qq => qq.id === questionId);
          if (qIdx >= 0 && qIdx < currentQuestionIndex && idx < currentQuestionIndex) return null;
          return (
            <motion.div 
              key={questionId} 
              className="space-y-2"
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 1 }}
            >
              <ChatMessage 
                role="assistant" 
                content={q?.question || ""} 
                showAvatar={true}
                avatarSize="sm"
                animationDelay={0}
              />
              <ChatMessage 
                role="user" 
                content={answer} 
                showAvatar={false}
                animationDelay={0}
              />
            </motion.div>
          );
        })}

        {/* Current question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Question with avatar */}
            <div className="flex justify-start">
              <div className="flex items-start gap-3">
                <ChatAvatar role="assistant" size="sm" />
                <div className="bg-muted/80 backdrop-blur-sm rounded-2xl rounded-bl-md px-4 py-2.5 border border-border/50 shadow-sm">
                  <p className="text-sm text-foreground">{currentQuestion.question}</p>
                </div>
              </div>
            </div>

            {/* Options or input */}
            {currentQuestion.options ? (
              <div className="flex flex-wrap gap-2 pl-11">
                {currentQuestion.options.map((option, idx) => (
                  <motion.button
                    key={option}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => handleChatAnswer(option)}
                    disabled={isSubmitting}
                    className={cn(
                      "text-sm px-4 py-2.5 rounded-full border transition-all duration-200",
                      "border-border hover:border-primary hover:bg-primary hover:text-primary-foreground",
                      "disabled:opacity-50 disabled:pointer-events-none shadow-sm hover:shadow-md hover:shadow-primary/10"
                    )}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {option}
                  </motion.button>
                ))}
              </div>
            ) : (
              <div className="flex items-end gap-2 pl-11">
                {currentQuestion.type === "textarea" ? (
                  <Textarea
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={currentQuestion.placeholder}
                    rows={3}
                    className="flex-1 resize-none"
                    disabled={isSubmitting}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleChatInputSubmit();
                      }
                    }}
                  />
                ) : (
                  <Input
                    type={currentQuestion.type || "text"}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={currentQuestion.placeholder}
                    className="flex-1"
                    disabled={isSubmitting}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleChatInputSubmit();
                      }
                    }}
                    autoFocus
                  />
                )}
                <Button
                  onClick={handleChatInputSubmit}
                  disabled={(!chatInput.trim() && !currentQuestion.optional) || isSubmitting}
                  size="icon"
                  className="shrink-0 h-10 w-10"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                </Button>
              </div>
            )}
            
            {/* Navigation hints */}
            <div className="flex items-center justify-between pl-11 text-xs text-muted-foreground">
              {currentQuestionIndex > 0 && (
                <button 
                  onClick={handleGoBack}
                  disabled={isSubmitting}
                  className="flex items-center gap-1 hover:text-foreground transition-colors disabled:opacity-50"
                >
                  <ArrowLeft className="w-3 h-3" />
                  Previous
                </button>
              )}
              {currentQuestion.optional && (
                <button
                  onClick={() => handleChatAnswer("")}
                  disabled={isSubmitting}
                  className="ml-auto hover:text-foreground transition-colors disabled:opacity-50"
                >
                  Skip this question
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default LeadCaptureChoice;
