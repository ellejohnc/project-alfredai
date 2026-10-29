import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import { 
  Mic, 
  MicOff, 
  Phone, 
  Volume2, 
  Battery, 
  Wifi, 
  Signal,
  CheckCircle2,
  Clock,
  Calendar,
  MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
type ConversationStep = {
  type: "user" | "assistant";
  text: string;
  action?: string;
};

const conversation: ConversationStep[] = [
  { type: "user", text: "Hey Alfred, what's on my schedule today?" },
  { type: "assistant", text: "Good morning! You have 3 meetings today. Your first one is a budget review at 10 AM with the finance team.", action: "Checking calendar..." },
  { type: "user", text: "Move the budget review to 2 PM" },
  { type: "assistant", text: "Done! I've rescheduled the budget review to 2 PM and notified all 4 attendees. Your 10 AM slot is now free.", action: "Calendar updated" },
  { type: "user", text: "Send Sarah a message about the Q3 report" },
  { type: "assistant", text: "I'll draft that for you: 'Hi Sarah, following up on the Q3 report. When can we review the final numbers?' Should I send it?", action: "Composing message..." },
];

export default function ButlerDemo() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showAction, setShowAction] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    if (!isPlaying || currentStep >= conversation.length) {
      if (currentStep >= conversation.length) {
        setTimeout(() => {
          setCurrentStep(0);
          setIsPlaying(true);
        }, 3000);
      }
      return;
    }

    const step = conversation[currentStep];
    
    if (step.type === "user") {
      setIsListening(true);
      setIsSpeaking(false);
      setShowAction(false);
      
      const timeout = setTimeout(() => {
        setIsListening(false);
        setCurrentStep(prev => prev + 1);
      }, 2500);
      
      return () => clearTimeout(timeout);
    } else {
      setIsListening(false);
      setIsSpeaking(true);
      
      if (step.action) {
        setShowAction(true);
      }
      
      const timeout = setTimeout(() => {
        setIsSpeaking(false);
        setShowAction(false);
        setCurrentStep(prev => prev + 1);
      }, 3500);
      
      return () => clearTimeout(timeout);
    }
  }, [currentStep, isPlaying]);

  const currentConversation = conversation[currentStep];

  return (
    <div className="relative mx-auto" style={{ width: "280px" }}>
      {/* Phone Frame */}
      <div className="bg-foreground rounded-[3rem] p-3 shadow-2xl">
        <div className="bg-background rounded-[2.5rem] overflow-hidden relative aspect-[9/19.5]">
          {/* Status Bar */}
          <div className="flex items-center justify-between px-6 py-2 text-xs">
            <span className="font-medium text-foreground">9:41</span>
            <div className="absolute left-1/2 -translate-x-1/2 w-24 h-6 bg-foreground rounded-full" />
            <div className="flex items-center gap-1 text-foreground">
              <Signal className="w-3 h-3" />
              <Wifi className="w-3 h-3" />
              <Battery className="w-4 h-4" />
            </div>
          </div>

          {/* App Content */}
          <div className="px-4 pb-4 pt-2">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center mb-3 shadow-lg shadow-orange-500/30">
                <Phone className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-foreground">Butler On The Go</h3>
              <p className="text-xs text-muted-foreground">Voice-first assistant</p>
            </div>

            {/* Voice Visualization */}
            <div className="relative h-24 flex items-center justify-center mb-4">
              <AnimatePresence mode="wait">
                {isListening && (
                  <motion.div
                    key="listening"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="flex items-center gap-1"
                  >
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-1.5 bg-primary rounded-full"
                        animate={{
                          height: [12, 32, 12],
                        }}
                        transition={{
                          duration: 0.5,
                          repeat: Infinity,
                          delay: i * 0.1,
                        }}
                      />
                    ))}
                  </motion.div>
                )}
                {isSpeaking && (
                  <motion.div
                    key="speaking"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="flex items-center gap-1"
                  >
                    {[...Array(7)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-1 bg-orange-500 rounded-full"
                        animate={{
                          height: [8, 24, 8],
                        }}
                        transition={{
                          duration: 0.4,
                          repeat: Infinity,
                          delay: i * 0.08,
                        }}
                      />
                    ))}
                  </motion.div>
                )}
                {!isListening && !isSpeaking && (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center"
                  >
                    <Volume2 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <span className="text-xs text-muted-foreground">Tap to speak</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Transcript */}
            <AnimatePresence mode="wait">
              {currentConversation && (
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-muted rounded-2xl p-4 mb-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full font-medium",
                      currentConversation.type === "user" 
                        ? "bg-primary/20 text-primary" 
                        : "bg-orange-500/20 text-orange-600"
                    )}>
                      {currentConversation.type === "user" ? "You" : "Alfred"}
                    </span>
                    {isListening && (
                      <span className="text-[10px] text-primary animate-pulse">Listening...</span>
                    )}
                    {isSpeaking && (
                      <span className="text-[10px] text-orange-500 animate-pulse">Speaking...</span>
                    )}
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">
                    {currentConversation.text}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action Indicator */}
            <AnimatePresence>
              {showAction && currentConversation?.action && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center gap-2 text-xs text-muted-foreground mb-4"
                >
                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                  <span>{currentConversation.action}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mic Button */}
            <div className="flex justify-center">
              <button
                onClick={() => toast.info("Demo Mode", { description: "In production, this would activate voice recognition. Watch the automated demo to see the full conversation flow." })}
                className={cn(
                  "w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg",
                  isListening
                    ? "bg-primary shadow-primary/30 scale-110"
                    : "bg-muted hover:bg-muted/80"
                )}
              >
                {isListening ? (
                  <Mic className="w-6 h-6 text-primary-foreground" />
                ) : (
                  <Mic className="w-6 h-6 text-muted-foreground" />
                )}
              </button>
            </div>
          </div>

          {/* Home Indicator */}
          <div className="flex justify-center pb-2">
            <div className="w-32 h-1 bg-muted-foreground/30 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
