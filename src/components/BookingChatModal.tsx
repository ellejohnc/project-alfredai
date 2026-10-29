import { useState, useRef, useEffect, useCallback, forwardRef, memo } from "react";
import { motion } from "framer-motion";
import { Sparkles, RotateCcw, ChevronLeft, X, Volume2, VolumeX } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useChatStream, Message } from "@/hooks/useChatStream";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ChatMessage, ChatTypingIndicator } from "@/components/chat/shared";
import { stripQualification } from "@/lib/chat/chatCards";
import { useBookingSounds } from "@/hooks/useBookingSounds";
import { GHLBookingWidget } from "@/components/GHLBookingWidget";
import { useLeadIdentity } from "@/hooks/useLeadIdentity";
import {
  INITIAL_MESSAGE,
  STAGE_ORDER,
  MAX_OTHER_INPUT_LENGTH,
  QuickAction,
} from "@/components/booking/BookingConstants";
import { useBookingStage } from "@/components/booking/useBookingStage";
import { ProgressSteps } from "@/components/booking/ProgressSteps";
import { QuickActionsPanel } from "@/components/booking/QuickActionsPanel";
import { ContactCaptureForm } from "@/components/booking/ContactCaptureForm";

type BookingSource = "header_cta" | "page_cta" | "chatbot" | "default";

interface BookingChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  source?: BookingSource;
}

// Map booking source to GHL source medium and campaign
const getSourceMedium = (source: BookingSource): string => {
  switch (source) {
    case "header_cta":
      return "header_cta";
    case "page_cta":
      return "page_cta";
    case "chatbot":
      return "lead_chatbot";
    default:
      return "booking_modal";
  }
};

const getSourceCampaign = (source: BookingSource, pathname: string): string => {
  // Create descriptive campaign based on source and page
  const pageSlug = pathname === "/" ? "homepage" : pathname.replace(/^\//, "").replace(/\//g, "_");
  switch (source) {
    case "header_cta":
      return `header_cta_${pageSlug}`;
    case "page_cta":
      return `page_cta_${pageSlug}`;
    case "chatbot":
      return `chatbot_${pageSlug}`;
    default:
      return `booking_modal_${pageSlug}`;
  }
};

const BookingChatModalInner = memo(({ isOpen, onClose, source = "default" }: BookingChatModalProps) => {
  const [input, setInput] = useState("");
  const [showCalendly, setShowCalendly] = useState(false);
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherInput, setOtherInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [hasPlayedCelebration, setHasPlayedCelebration] = useState(false);
  const [completedStages, setCompletedStages] = useState<Set<string>>(new Set());
  const [qualificationData, setQualificationData] = useState<Record<string, string>>({});
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadCompany, setLeadCompany] = useState("");
  const [contactFormShown, setContactFormShown] = useState(false);

  // Every booking control sends people to the one booking page. If the
  // redirect is blocked, the modal below still opens as the fallback.
  useEffect(() => {
    if (!isOpen) return;
    try {
      const target = new URL("https://new.alfredai.bot/book");
      if (window.location.host !== target.host || window.location.pathname !== target.pathname) {
        window.location.href = target.href;
      }
    } catch { /* fall back to the in-page booking modal */ }
  }, [isOpen]);

  // Persist lead identity
  const { leadIdentity, updateLeadIdentity } = useLeadIdentity();

  // Initialize from persisted identity
  useEffect(() => {
    if (leadIdentity.name && !leadName) setLeadName(leadIdentity.name);
    if (leadIdentity.email && !leadEmail) setLeadEmail(leadIdentity.email);
    if (leadIdentity.phone && !leadPhone) setLeadPhone(leadIdentity.phone);
    if (leadIdentity.company && !leadCompany) setLeadCompany(leadIdentity.company);
  }, [leadIdentity]);

  const recognitionRef = useRef<any>(null);
  const prevStageRef = useRef<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { messages, isLoading, error, sendMessage, clearMessages, removeLastExchange, cancelRequest } = useChatStream();
  const { playClick, playSuccess, playStepComplete, playCelebration, toggleSounds } = useBookingSounds();
  const navigate = useNavigate();

  const [soundEnabled, setSoundEnabled] = useState(() => {
    const stored = localStorage.getItem('alfred-booking-sound-enabled');
    return stored === null ? true : stored === 'true';
  });

  const allMessages = [INITIAL_MESSAGE, ...messages];

  // Use optimized stage hook
  const {
    currentStage,
    quickActionsData,
    shouldCollectContact,
    getCurrentStageId,
  } = useBookingStage(messages, completedStages, leadEmail);

  const { actions: currentQuickActions, showCTA } = quickActionsData;
  const hasSubmittedEmail = completedStages.has('contact');
  const effectiveShowCTA = showCTA && hasSubmittedEmail;

  // Toggle sounds
  useEffect(() => {
    toggleSounds(soundEnabled);
  }, [soundEnabled, toggleSounds]);

  // Play sounds on stage completion
  useEffect(() => {
    if (currentStage > prevStageRef.current) {
      playStepComplete();
      if (currentStage === 5 && !hasPlayedCelebration) {
        setHasPlayedCelebration(true);
        playCelebration();
      }
    }
    prevStageRef.current = currentStage;
  }, [currentStage, playStepComplete, playCelebration, hasPlayedCelebration]);

  // Safety timeout: force-cancel if loading hangs for 35s
  useEffect(() => {
    if (!isLoading) return;
    const timeout = setTimeout(() => {
      cancelRequest();
      toast.error("Response timed out. Please try again.");
    }, 35000);
    return () => clearTimeout(timeout);
  }, [isLoading, cancelRequest]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages, isLoading]);

  // Focus input on open
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      clearMessages();
      setShowCalendly(false);
      setShowOtherInput(false);
      setOtherInput("");
      setCompletedStages(new Set());
      setQualificationData({});
      setLeadName("");
      setLeadEmail("");
      setLeadPhone("");
      setLeadCompany("");
      setContactFormShown(false);
      stopRecording();
    }
  }, [isOpen, clearMessages]);

  // Lock contact form visibility once it should be shown
  useEffect(() => {
    if (shouldCollectContact && !contactFormShown) {
      setContactFormShown(true);
    }
  }, [shouldCollectContact, contactFormShown]);

  // Check for calendar trigger
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === "assistant" && 
        (lastMessage.content.includes("[SHOW_CALENDAR]") || 
         lastMessage.content.toLowerCase().includes("here's our calendar") ||
         lastMessage.content.toLowerCase().includes("book a time"))) {
      setShowCalendly(true);
    }
  }, [messages]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setIsRecording(false);
    }
  }, []);

  const handleSend = useCallback(() => {
    if (!input.trim() || isLoading) return;
    playClick();
    
    const currentStageId = getCurrentStageId();
    
    if (currentStageId) {
      setQualificationData(prev => ({ ...prev, [currentStageId]: input.trim() }));
      const newCompletedStages = [...completedStages, currentStageId];
      setCompletedStages(prev => new Set([...prev, currentStageId]));
      
      // Timeline no longer has an early return -- let it flow through to sendMessage
      
      const nextStage = STAGE_ORDER.find(s => !newCompletedStages.includes(s));
      sendMessage(input.trim(), false, {
        completedStages: newCompletedStages,
        currentStage: currentStageId,
        nextStage,
        isCustomInput: true
      });
    } else {
      sendMessage(input.trim());
    }
    
    setInput("");
    setShowOtherInput(false);
    setOtherInput("");
  }, [input, isLoading, playClick, getCurrentStageId, completedStages, sendMessage]);

  const handleQuickAction = useCallback((action: QuickAction) => {
    playSuccess();

    if (action.type === "calendar") {
      if (!leadEmail) {
        toast.error("Please add your email first");
        return;
      }
      setShowCalendly(true);
    } else if (action.type === "demos") {
      onClose();
      navigate("/resources/demos");
    } else if (action.type === "other") {
      setShowOtherInput(true);
    } else if (action.type === "skip") {
      const currentStageId = getCurrentStageId();
      if (currentStageId) {
        setCompletedStages(prev => new Set([...prev, currentStageId]));
      }
      setShowOtherInput(false);
    } else {
      const currentStageId = getCurrentStageId();
      const newCompletedStages = currentStageId
        ? [...completedStages, currentStageId]
        : [...completedStages];

      if (currentStageId) {
        setQualificationData(prev => ({ ...prev, [currentStageId]: action.label }));
        setCompletedStages(prev => new Set([...prev, currentStageId]));
      }

      // Timeline no longer has an early return -- let it flow through to sendMessage

      const nextStage = STAGE_ORDER.find(s => !newCompletedStages.includes(s));
      sendMessage(action.label, false, {
        completedStages: newCompletedStages,
        currentStage: currentStageId,
        nextStage,
        isCustomInput: false
      });
      setShowOtherInput(false);
    }
  }, [playSuccess, leadEmail, onClose, navigate, getCurrentStageId, completedStages, sendMessage]);

  const handleOtherSubmit = useCallback(() => {
    if (!otherInput.trim()) return;
    
    const currentStageId = getCurrentStageId();
    const newCompletedStages = currentStageId 
      ? [...completedStages, currentStageId] 
      : [...completedStages];
    
    if (currentStageId) {
      setQualificationData(prev => ({ ...prev, [currentStageId]: otherInput.trim().slice(0, MAX_OTHER_INPUT_LENGTH) }));
      setCompletedStages(prev => new Set([...prev, currentStageId]));
    }
    
    // Timeline no longer has an early return -- let it flow through to sendMessage
    
    const nextStage = STAGE_ORDER.find(s => !newCompletedStages.includes(s));
    sendMessage(otherInput.trim().slice(0, MAX_OTHER_INPUT_LENGTH), false, {
      completedStages: newCompletedStages,
      currentStage: currentStageId,
      nextStage,
      isCustomInput: true
    });
    setOtherInput("");
    setShowOtherInput(false);
  }, [otherInput, getCurrentStageId, completedStages, sendMessage]);

  const handleReset = useCallback(() => {
    playClick();
    clearMessages();
    setShowCalendly(false);
    setShowOtherInput(false);
    setOtherInput("");
    setHasPlayedCelebration(false);
    setCompletedStages(new Set());
    setQualificationData({});
    prevStageRef.current = 0;
    toast.success("Conversation restarted");
  }, [playClick, clearMessages]);

  const handleGoBack = useCallback(() => {
    if (messages.length < 2) return;
    playClick();
    removeLastExchange();
    prevStageRef.current = Math.max(0, prevStageRef.current - 1);
    if (hasPlayedCelebration) {
      setHasPlayedCelebration(false);
    }
    toast.info("Went back one step");
  }, [messages.length, playClick, removeLastExchange, hasPlayedCelebration]);

  const handleContactSubmit = useCallback((email: string) => {
    setLeadEmail(email);
    setCompletedStages(prev => new Set([...prev, 'contact']));
    // Persist lead identity including name
    updateLeadIdentity({ name: leadName, email, phone: leadPhone, company: leadCompany });
  }, [leadName, leadPhone, leadCompany, updateLeadIdentity]);

  const handleViewCalendar = useCallback(() => {
    if (!leadEmail) {
      toast.error("Please add your email first");
      return;
    }
    setShowCalendly(true);
  }, [leadEmail]);

  const handleViewDemos = useCallback(() => {
    onClose();
    navigate("/resources/demos");
  }, [onClose, navigate]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent hideCloseButton className="w-[95vw] md:max-w-2xl h-[85vh] md:h-[90vh] max-h-[800px] p-0 overflow-hidden flex flex-col gap-0 bg-background border-border/50 shadow-2xl">
        {/* Header with Progress */}
        <div className="relative border-b border-border shrink-0">
          <div className="relative px-3 sm:px-5 py-3 sm:py-4">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-primary flex items-center justify-center">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm sm:text-base text-foreground tracking-tight">Book an Impact Conversation</h3>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    {showCalendly ? "Pick a time" : "Find your solution"}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-1 sm:gap-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={cn(
                    "w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center transition-all",
                    soundEnabled 
                      ? "bg-primary/10 text-primary" 
                      : "bg-muted/50 text-muted-foreground"
                  )}
                  title={soundEnabled ? "Mute sounds" : "Enable sounds"}
                >
                  {soundEnabled ? <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                </motion.button>
                
                {!showCalendly && messages.length > 0 && (
                  <div className="flex items-center gap-0.5 bg-muted/50 rounded-lg sm:rounded-xl p-0.5 sm:p-1">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleGoBack}
                      disabled={messages.length < 2}
                      className="flex items-center gap-0.5 sm:gap-1 h-6 sm:h-7 px-1.5 sm:px-2.5 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-background/80 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      title="Go back"
                    >
                      <ChevronLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      <span className="hidden sm:inline">Back</span>
                    </motion.button>
                    <div className="w-px h-3 sm:h-4 bg-border/50" />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleReset}
                      className="flex items-center gap-0.5 sm:gap-1 h-6 sm:h-7 px-1.5 sm:px-2.5 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-background/80 transition-all"
                      title="Start over"
                    >
                      <RotateCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      <span className="hidden sm:inline">Reset</span>
                    </motion.button>
                  </div>
                )}

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                  title="Close"
                >
                  <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </motion.button>
              </div>
            </div>

            {!showCalendly && <ProgressSteps currentStage={currentStage} />}
          </div>
        </div>

        {!showCalendly ? (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {allMessages.map((msg, idx) => (
                <ChatMessage
                  key={idx}
                  role={msg.role}
                  content={stripQualification(msg.content.replace("[SHOW_CALENDAR]", "")).text}
                  showAvatar={msg.role === "assistant"}
                  animationDelay={idx === 0 ? 0.2 : 0}
                />
              ))}

              {isLoading && <ChatTypingIndicator showAvatar variant="dots" />}

              {error && (
                <div className="text-center text-sm text-destructive py-2">
                  {error}. Please try again.
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Contextual Quick Actions */}
            {currentQuickActions && (
              <QuickActionsPanel
                actions={currentQuickActions}
                onAction={handleQuickAction}
                disabled={isLoading}
                showOtherInput={showOtherInput}
                otherInput={otherInput}
                onOtherInputChange={setOtherInput}
                onOtherSubmit={handleOtherSubmit}
                onOtherCancel={() => {
                  setShowOtherInput(false);
                  setOtherInput("");
                }}
              />
            )}

            {/* Contact capture or CTA buttons - use contactFormShown to lock visibility */}
            {(contactFormShown || effectiveShowCTA) && !isLoading && !showCalendly && (
              <ContactCaptureForm
                leadName={leadName}
                leadEmail={leadEmail}
                leadPhone={leadPhone}
                leadCompany={leadCompany}
                onNameChange={setLeadName}
                onEmailChange={setLeadEmail}
                onPhoneChange={setLeadPhone}
                onCompanyChange={setLeadCompany}
                onSubmit={handleContactSubmit}
                onViewCalendar={handleViewCalendar}
                onViewDemos={handleViewDemos}
                showCTA={effectiveShowCTA}
              />
            )}
          </>
        ) : (
          /* Calendar View */
          <div className="flex-1 flex flex-col">
            <div className="p-3 sm:p-4 border-b border-border bg-gradient-to-r from-primary/5 to-secondary/5">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <span className="text-muted-foreground">
                  Perfect! Pick a time that works for you:
                </span>
              </div>
            </div>
            <div 
              className="flex-1 p-3 sm:p-4 overflow-auto overscroll-contain"
              style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}
            >
              <GHLBookingWidget
                leadData={{
                  name: leadName || leadIdentity.name,
                  email: leadEmail,
                  phone: leadPhone,
                  company: leadCompany,
                }}
                sourceData={{
                  source: "website",
                  content: window.location.pathname,
                  medium: getSourceMedium(source),
                  campaign: getSourceCampaign(source, window.location.pathname),
                }}
                qualificationData={qualificationData}
                height={450}
                variant="inline"
              />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
});

BookingChatModalInner.displayName = 'BookingChatModalInner';

// Export directly - forwardRef not needed since we don't forward the ref
export default BookingChatModalInner;
