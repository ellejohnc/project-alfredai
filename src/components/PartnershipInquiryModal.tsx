import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import confetti from "canvas-confetti";
import {
  MessageSquare,
  FileText,
  Loader2,
  Send,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Mail,
  Building2,
  Briefcase,
  User,
  ArrowLeft,
  Check,
  Users,
  TrendingUp,
  Award,
  Handshake,
  X,
  Globe,
  Target,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useRecaptcha } from "@/hooks/useRecaptcha";
import { ChatAvatar, ChatMessage } from "@/components/chat/shared";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { logGHLSubmission } from "@/hooks/useGHLLogging";

interface PartnershipInquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PartnerData {
  name: string;
  email: string;
  company: string;
  partnershipType: string;
  targetIndustry: string;
  clientReach: string;
  message: string;
}

type CaptureMode = "choice" | "form" | "chat" | "success";

interface Question {
  id: string;
  question: string;
  placeholder?: string;
  type?: string;
  options?: string[];
  optional?: boolean;
  icon: typeof User;
}

const PARTNERSHIP_TYPES = [
  "Referral Partner",
  "Implementation Partner",
  "Technology Partner",
  "Sales Partner",
  "Consulting Partner",
  "Training Partner",
  "Whitelabel Partner",
];

const TARGET_INDUSTRIES = [
  "Marketing & Agencies",
  "Construction & Engineering",
  "Legal & Professional Services",
  "Healthcare & Allied Health",
  "Property & Real Estate",
  "Financial Services",
  "Retail & E-commerce",
  "Manufacturing & Logistics",
  "Hospitality & Events",
  "Recruitment & HR",
  "Multiple Industries",
  "Other",
];

const CLIENT_REACH_OPTIONS = [
  "1-10 clients",
  "11-50 clients",
  "51-100 clients",
  "100+ clients",
  "Just getting started",
];

// Guided chat questions with icons
const PARTNERSHIP_QUESTIONS: Question[] = [
  { id: "name", question: "What's your name?", placeholder: "Enter your full name", type: "text", icon: User },
  { id: "email", question: "What's your email?", placeholder: "you@company.com", type: "email", icon: Mail },
  { id: "company", question: "What company are you representing?", placeholder: "Company name", type: "text", icon: Building2 },
  { id: "partnershipType", question: "What type of partnership are you interested in?", options: PARTNERSHIP_TYPES, icon: Handshake },
  { id: "targetIndustry", question: "What industry do you primarily serve?", options: TARGET_INDUSTRIES, icon: Target },
  { id: "clientReach", question: "What's your current client base size?", options: CLIENT_REACH_OPTIONS, icon: Users },
  { id: "message", question: "Tell us more about your partnership goals (optional)", placeholder: "How do you envision working with alfred ai?", type: "textarea", optional: true, icon: MessageSquare },
];

const PartnershipInquiryModal = ({ isOpen, onClose }: PartnershipInquiryModalProps) => {
  const { toast } = useToast();
  const { verifyRecaptcha, isReady: recaptchaReady } = useRecaptcha();
  const [mode, setMode] = useState<CaptureMode>("choice");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<PartnerData>({
    name: "",
    email: "",
    company: "",
    partnershipType: "",
    targetIndustry: "",
    clientReach: "",
    message: "",
  });

  // Focus states for floating labels
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Chat state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [chatAnswers, setChatAnswers] = useState<Record<string, string>>({});
  const [chatInput, setChatInput] = useState("");

  const questions = PARTNERSHIP_QUESTIONS;
  const currentQuestion = questions[currentQuestionIndex];

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setMode("choice");
      setCurrentQuestionIndex(0);
      setChatAnswers({});
      setChatInput("");
      setFormData({
        name: "",
        email: "",
        company: "",
        partnershipType: "",
        targetIndustry: "",
        clientReach: "",
        message: "",
      });
      setSubmitError(null);
    }
  }, [isOpen]);

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

  // Submit to Supabase with reCAPTCHA verification
  const submitPartnerInquiry = async (data: PartnerData) => {
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      // Verify reCAPTCHA first
      const recaptchaResult = await verifyRecaptcha('partnership_inquiry');
      if (!recaptchaResult.success) {
        throw new Error(recaptchaResult.error || "Verification failed. Please try again.");
      }

      // Parse name into first/last
      const nameParts = data.name.trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      const leadPayload = {
        first_name: firstName,
        last_name: lastName,
        email: data.email,
        company: data.company || null,
        message: `Partnership Type: ${data.partnershipType}\nTarget Industry: ${data.targetIndustry}\nClient Reach: ${data.clientReach}\n\n${data.message || ""}`.trim(),
        lead_type: "partnership_inquiry",
        lead_source: "partners_page",
      };

      const { error } = await supabase.from("leads").insert(leadPayload);

      if (error) throw error;

      // Log GHL submission for tracking
      await logGHLSubmission({
        lead_email: data.email,
        lead_name: data.name,
        lead_company: data.company,
        source_page: "/partners",
        source_medium: mode === "chat" ? "partnership_chatbot" : "partnership_form",
        source_campaign: "partnership_inquiry",
        ghl_status: "submitted",
        qualification_data: {
          partnership_type: data.partnershipType,
          target_industry: data.targetIndustry,
          client_reach: data.clientReach,
        } as any,
      });

      setMode("success");
    } catch (error) {
      console.error("Error submitting partnership inquiry:", error);
      const errorMessage = error instanceof Error ? error.message : "Something went wrong. Please try again.";
      setSubmitError(errorMessage);
      toast({
        title: "Submission Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Form submission handler
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitPartnerInquiry(formData);
  };

  // Chat answer handler
  const handleChatAnswer = async (answer: string) => {
    const newAnswers = { ...chatAnswers, [currentQuestion.id]: answer };
    setChatAnswers(newAnswers);
    setChatInput("");

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // All questions answered - submit
      await submitPartnerInquiry({
        name: newAnswers.name || "",
        email: newAnswers.email || "",
        company: newAnswers.company || "",
        partnershipType: newAnswers.partnershipType || "",
        targetIndustry: newAnswers.targetIndustry || "",
        clientReach: newAnswers.clientReach || "",
        message: newAnswers.message || "",
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
      const questionId = questions[currentQuestionIndex].id;
      const newAnswers = { ...chatAnswers };
      delete newAnswers[questionId];
      setChatAnswers(newAnswers);
    }
  };

  const handleEmailError = () => {
    const subject = encodeURIComponent("Partnership Inquiry Form Error");
    const body = encodeURIComponent(
      `Hi alfred ai Team,\n\nI encountered an error while submitting the partnership inquiry form.\n\nPage URL: ${window.location.href}\nError: ${submitError}\n\nMy details:\nName: ${formData.name || chatAnswers.name || ""}\nEmail: ${formData.email || chatAnswers.email || ""}\nCompany: ${formData.company || chatAnswers.company || ""}\n\nPlease assist.\n\nThank you.`
    );
    window.location.href = `mailto:hello@alfredd.ai?subject=${subject}&body=${body}`;
  };

  // Error fallback UI
  const renderErrorFallback = () => (
    <div className="text-center py-6 space-y-4">
      <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
        <AlertCircle className="w-8 h-8 text-destructive" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Submission Failed</h3>
        <p className="text-sm text-muted-foreground mb-4">{submitError}</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button
          variant="outline"
          onClick={() => setSubmitError(null)}
        >
          Try Again
        </Button>
        <Button
          onClick={handleEmailError}
        >
          <Mail className="w-4 h-4 mr-2" />
          Email Us Instead
        </Button>
      </div>
    </div>
  );

  // Choice screen
  const renderChoice = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
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
              Answer a few quick questions about your partnership goals
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
            Fill out a partnership application form
          </p>
          
          <div className="flex items-center gap-2 text-muted-foreground group-hover:text-primary text-sm font-medium transition-colors">
            Open Form <ArrowRight className="w-4 h-4" />
          </div>
        </motion.button>
      </div>
    </div>
  );

  // Success screen
  const renderSuccess = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-8 space-y-6"
    >
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
          Application Received!
        </motion.h3>
        <motion.p 
          className="text-muted-foreground max-w-md mx-auto"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          Thank you for your interest in partnering with alfred ai. Our partnerships team will review your application and reach out within 2-3 business days.
        </motion.p>
      </div>

      <motion.div 
        className="bg-muted/30 rounded-xl p-4 max-w-sm mx-auto border border-border/50"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">What happens next</p>
        <div className="space-y-2.5">
          {[
            { icon: Mail, text: "Confirmation email sent to your inbox" },
            { icon: Users, text: "Partnership team reviews your application" },
            { icon: Handshake, text: "We'll schedule a call to discuss next steps" },
          ].map((item, idx) => (
            <motion.div 
              key={idx}
              className="flex items-center gap-2.5 text-sm text-foreground"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + idx * 0.1 }}
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
          variant="outline"
          onClick={onClose}
        >
          Close
        </Button>
      </motion.div>
    </motion.div>
  );

  // Form mode
  const renderForm = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
    >
      {submitError ? (
        renderErrorFallback()
      ) : (
        <>
          <button
            onClick={() => setMode("choice")}
            className="text-sm text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to options
          </button>
          
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
              <Handshake className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Partnership Application</h2>
              <p className="text-sm text-muted-foreground">Tell us about your partnership goals</p>
            </div>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            {/* Name */}
            <div className="relative">
              <Input
                placeholder=" "
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                onFocus={() => setFocusedField("name")}
                onBlur={() => setFocusedField(null)}
                required
                className={cn(
                  "pt-6 pb-2 h-14 transition-all",
                  (focusedField === "name" || formData.name) && "border-primary"
                )}
              />
              <label className={cn(
                "absolute left-3 transition-all pointer-events-none text-muted-foreground",
                (focusedField === "name" || formData.name) 
                  ? "top-2 text-xs text-primary" 
                  : "top-1/2 -translate-y-1/2 text-sm"
              )}>
                Full Name
              </label>
              {formData.name && (
                <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
              )}
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
                Email Address
              </label>
              {formData.email && (
                <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
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
                required
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
                Company Name
              </label>
              {formData.company && (
                <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
              )}
            </div>

            {/* Partnership Type */}
            <Select
              value={formData.partnershipType}
              onValueChange={(value) => setFormData({ ...formData, partnershipType: value })}
              required
            >
              <SelectTrigger className="h-14">
                <SelectValue placeholder="Partnership Type" />
              </SelectTrigger>
              <SelectContent>
                {PARTNERSHIP_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Target Industry */}
            <Select
              value={formData.targetIndustry}
              onValueChange={(value) => setFormData({ ...formData, targetIndustry: value })}
              required
            >
              <SelectTrigger className="h-14">
                <SelectValue placeholder="Target Industry" />
              </SelectTrigger>
              <SelectContent>
                {TARGET_INDUSTRIES.map((industry) => (
                  <SelectItem key={industry} value={industry}>
                    {industry}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Client Reach */}
            <Select
              value={formData.clientReach}
              onValueChange={(value) => setFormData({ ...formData, clientReach: value })}
              required
            >
              <SelectTrigger className="h-14">
                <SelectValue placeholder="Current Client Base" />
              </SelectTrigger>
              <SelectContent>
                {CLIENT_REACH_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Message */}
            <div className="relative">
              <Textarea
                placeholder="Tell us about your partnership goals (optional)"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="min-h-[100px] resize-none"
              />
            </div>
            
            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-primary to-secondary hover:opacity-90"
              disabled={isSubmitting || !formData.name || !formData.email || !formData.company || !formData.partnershipType || !formData.targetIndustry || !formData.clientReach}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  Submit Application
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>
        </>
      )}
    </motion.div>
  );

  // Chat mode
  const renderChat = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      {submitError ? (
        renderErrorFallback()
      ) : (
        <>
          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-4 px-2">
            <button
              onClick={() => currentQuestionIndex > 0 ? handleGoBack() : setMode("choice")}
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back
            </button>
            <div className="flex gap-1.5">
              {questions.map((_, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    idx < currentQuestionIndex ? "w-6 bg-primary" :
                    idx === currentQuestionIndex ? "w-6 bg-primary/60" :
                    "w-3 bg-muted"
                  )}
                />
              ))}
            </div>
          </div>

          {/* Chat Messages */}
          <div className="space-y-4 min-h-[200px]">
            {/* Previous answers */}
            {Object.entries(chatAnswers).slice(0, currentQuestionIndex).map(([id, answer], idx) => {
              const q = questions.find(q => q.id === id);
              return (
                <div key={id} className="space-y-2">
                  <div className="flex items-start gap-2">
                    <ChatAvatar role="assistant" />
                    <div className="bg-muted rounded-2xl rounded-tl-md px-4 py-2 max-w-[80%]">
                      <p className="text-sm">{q?.question}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 justify-end">
                    <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-md px-4 py-2 max-w-[80%]">
                      <p className="text-sm">{answer}</p>
                    </div>
                    <ChatAvatar role="user" />
                  </div>
                </div>
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
                <div className="flex items-start gap-2">
                  <ChatAvatar role="assistant" />
                  <div className="bg-muted rounded-2xl rounded-tl-md px-4 py-3 max-w-[80%]">
                    <div className="flex items-center gap-2 mb-1">
                      <currentQuestion.icon className="w-4 h-4 text-primary" />
                      <span className="text-xs text-muted-foreground font-medium">
                        Step {currentQuestionIndex + 1} of {questions.length}
                      </span>
                    </div>
                    <p className="text-foreground">{currentQuestion.question}</p>
                  </div>
                </div>

                {/* Input or Options */}
                {currentQuestion.options ? (
                  <div className="grid grid-cols-1 gap-2 pl-10">
                    {currentQuestion.options.map((option) => (
                      <motion.button
                        key={option}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => handleChatAnswer(option)}
                        className="text-left px-4 py-3 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-all text-sm"
                        disabled={isSubmitting}
                      >
                        {option}
                      </motion.button>
                    ))}
                  </div>
                ) : (
                  <div className="pl-10">
                    {currentQuestion.type === "textarea" ? (
                      <div className="space-y-2">
                        <Textarea
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          placeholder={currentQuestion.placeholder}
                          className="min-h-[80px] resize-none"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleChatInputSubmit();
                            }
                          }}
                          disabled={isSubmitting}
                        />
                        <div className="flex gap-2">
                          {currentQuestion.optional && (
                            <Button
                              variant="ghost"
                              onClick={() => handleChatAnswer("")}
                              disabled={isSubmitting}
                            >
                              Skip
                            </Button>
                          )}
                          <Button
                            onClick={handleChatInputSubmit}
                            disabled={isSubmitting}
                            className="flex-1"
                          >
                            {isSubmitting ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                {currentQuestionIndex === questions.length - 1 ? "Submit" : "Next"}
                                <ArrowRight className="w-4 h-4 ml-2" />
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Input
                          type={currentQuestion.type || "text"}
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          placeholder={currentQuestion.placeholder}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleChatInputSubmit();
                            }
                          }}
                          disabled={isSubmitting}
                          className="flex-1"
                        />
                        <Button
                          onClick={handleChatInputSubmit}
                          disabled={(!chatInput.trim() && !currentQuestion.optional) || isSubmitting}
                          size="icon"
                        >
                          {isSubmitting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <ArrowRight className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </>
      )}
    </motion.div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl">Partnership Inquiry</DialogTitle>
              <p className="text-sm text-muted-foreground">Join the alfred ai partner program</p>
            </div>
          </div>
        </DialogHeader>

        <div className="pt-4">
          {mode === "choice" && renderChoice()}
          {mode === "form" && renderForm()}
          {mode === "chat" && renderChat()}
          {mode === "success" && renderSuccess()}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PartnershipInquiryModal;
