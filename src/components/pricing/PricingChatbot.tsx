import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { 
  Send, 
  MessageCircle, 
  RefreshCcw,
  ArrowRight,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// Question steps for progress tracking
const QUESTION_STEPS: ChatStep[] = ["industry", "team_size", "salary", "hours", "workflows"];
import { useHaptics } from "@/hooks/useHaptics";
import { SafeAnimatePresence } from "@/components/ui/safe-animate-presence";
import { ChatbotBeforeAfter } from "./ChatbotBeforeAfter";
import { PricingLeadCapture } from "./PricingLeadCapture";
import { industryMultipliers } from "@/lib/pricingEngine";

type ChatStep = 
  | "intro"
  | "industry"
  | "team_size"
  | "salary"
  | "hours"
  | "workflows"
  | "transformation"
  | "lead_capture"
  | "complete";

interface ChatMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
}

interface UserAnswers {
  industry: string;
  teamSize: number;
  averageSalary: number;
  hoursOnAdmin: number;
  workflowCount: number;
}

const industryOptions = industryMultipliers.map(i => ({
  id: i.id,
  label: i.name,
  description: i.description,
}));

const quickOptions: Record<string, { label: string; value: string | number }[]> = {
  team_size: [
    { label: "1-10", value: 5 },
    { label: "11-50", value: 30 },
    { label: "51-250", value: 100 },
    { label: "251+", value: 300 },
  ],
  salary: [
    { label: "$50k", value: 50000 },
    { label: "$75k", value: 75000 },
    { label: "$100k", value: 100000 },
    { label: "$125k+", value: 125000 },
  ],
  hours: [
    { label: "5-10 hrs", value: 8 },
    { label: "10-20 hrs", value: 15 },
    { label: "20-30 hrs", value: 25 },
    { label: "30+ hrs", value: 35 },
  ],
  workflows: [
    { label: "1-2", value: 2 },
    { label: "3-5", value: 4 },
    { label: "6-10", value: 8 },
    { label: "11+", value: 12 },
  ],
};

interface PricingChatbotProps {
  onComplete?: () => void;
  onShowResults?: (data: UserAnswers) => void;
}

export function PricingChatbot({ onComplete, onShowResults }: PricingChatbotProps) {
  const [step, setStep] = useState<ChatStep>("intro");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [answers, setAnswers] = useState<Partial<UserAnswers>>({});
  const [showLeadCapture, setShowLeadCapture] = useState(false);
  const [chatKey, setChatKey] = useState(0); // For restart re-initialization
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { vibrate } = useHaptics();

  // Progress calculation
  const currentQuestionNumber = QUESTION_STEPS.indexOf(step) + 1;
  const totalQuestions = QUESTION_STEPS.length;
  const isInQuestionFlow = currentQuestionNumber > 0 && step !== "transformation" && step !== "lead_capture" && step !== "complete";

  // Scroll within chatbox only (not main page)
  const scrollToBottom = useCallback(() => {
    if (chatContainerRef.current && messagesEndRef.current) {
      // Use scrollTop to scroll within the container only
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    // Small delay to ensure DOM has updated
    const timer = setTimeout(scrollToBottom, 50);
    return () => clearTimeout(timer);
  }, [messages, scrollToBottom]);

  // Initial message - re-runs when chatKey changes (restart)
  useEffect(() => {
    if (messages.length === 0) {
      addBotMessage(
        "👋 Let's figure out what AI could do for your business.\n\nI'll ask you a few quick questions about your team and operations, then show you exactly what you'd save.\n\n**What industry are you in?**"
      );
      setStep("industry");
    }
  }, [chatKey]);

  const addBotMessage = (content: string) => {
    setIsTyping(true);
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        { id: `bot-${Date.now()}`, role: "assistant", content },
      ]);
      setIsTyping(false);
    }, 500);
  };

  const addUserMessage = (content: string) => {
    vibrate("light");
    setMessages(prev => [
      ...prev,
      { id: `user-${Date.now()}`, role: "user", content },
    ]);
  };

  const handleIndustrySelect = (industryId: string, label: string) => {
    addUserMessage(label);
    setAnswers(prev => ({ ...prev, industry: industryId }));
    setTimeout(() => {
      addBotMessage(
        `Great choice! **${label}** is one of our strongest sectors.\n\nHow many people are on your team?`
      );
      setStep("team_size");
    }, 300);
  };

  const handleQuickOption = (value: number, label: string) => {
    addUserMessage(label);
    
    if (step === "team_size") {
      setAnswers(prev => ({ ...prev, teamSize: value }));
      setTimeout(() => {
        addBotMessage(
          "What's the average annual salary for roles that handle operational or administrative tasks?\n\n*This helps us calculate the true cost of manual work in your business.*"
        );
        setStep("salary");
      }, 300);
    } else if (step === "salary") {
      setAnswers(prev => ({ ...prev, averageSalary: value }));
      setTimeout(() => {
        addBotMessage(
          "How many hours per week does your team spend on repetitive tasks?\n\n*Think data entry, report generation, scheduling, follow-ups, manual updates...*"
        );
        setStep("hours");
      }, 300);
    } else if (step === "hours") {
      setAnswers(prev => ({ ...prev, hoursOnAdmin: value }));
      setTimeout(() => {
        addBotMessage(
          "Last question! How many workflows would you like to automate with AI?\n\n*Each workflow is an end-to-end process that AI agents will own — like invoice processing, client onboarding, or project updates.*"
        );
        setStep("workflows");
      }, 300);
    } else if (step === "workflows") {
      setAnswers(prev => ({ ...prev, workflowCount: value }));
      setTimeout(() => {
        addBotMessage(
          "✨ **Almost there!**\n\nComplete the form below to unlock your personalized results and pricing."
        );
        setStep("transformation");
      }, 300);
    }
  };

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const value = inputValue.trim();
    addUserMessage(value);
    setInputValue("");

    // Parse numeric input for current step
    const numValue = parseInt(value.replace(/[^0-9]/g, ""), 10);

    if (step === "team_size" && !isNaN(numValue)) {
      handleQuickOption(numValue, value);
    } else if (step === "salary" && !isNaN(numValue)) {
      handleQuickOption(numValue, value);
    } else if (step === "hours" && !isNaN(numValue)) {
      handleQuickOption(numValue, value);
    } else if (step === "workflows" && !isNaN(numValue)) {
      handleQuickOption(numValue, value);
    }
  };

  const handleRestart = () => {
    vibrate("medium");
    setMessages([]);
    setStep("intro");
    setAnswers({});
    setShowLeadCapture(false);
    setChatKey(prev => prev + 1); // Trigger re-initialization
  };

  const handleTransformationComplete = () => {
    setShowLeadCapture(true);
    setStep("lead_capture");
  };

  const handleLeadCaptureSuccess = () => {
    setShowLeadCapture(false);
    setStep("complete");
    addBotMessage(
      "🎉 **Your personalized quote is ready!**\n\nScroll down to see your detailed pricing breakdown. We've also sent a copy to your email."
    );
    // Trigger results display after lead capture is complete
    if (answers.industry && answers.teamSize && answers.averageSalary && answers.hoursOnAdmin && answers.workflowCount) {
      onShowResults?.({
        industry: answers.industry,
        teamSize: answers.teamSize,
        averageSalary: answers.averageSalary,
        hoursOnAdmin: answers.hoursOnAdmin,
        workflowCount: answers.workflowCount,
      });
    }
    onComplete?.();
  };

  const isComplete = step === "complete";
  const hasAllAnswers = 
    answers.industry && 
    answers.teamSize && 
    answers.averageSalary && 
    answers.hoursOnAdmin && 
    answers.workflowCount;

  return (
    <section id="pricing-chatbot" className="py-12 md:py-16">
      <div className="container max-w-3xl mx-auto px-4">
        {/* Chatbot Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-background border border-border rounded-2xl shadow-xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">AI Investment Calculator</h3>
                {/* Progress Indicator */}
                {isInQuestionFlow ? (
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex gap-1">
                      {Array.from({ length: totalQuestions }).map((_, i) => (
                        <div
                          key={i}
                          className={cn(
                            "w-1.5 h-1.5 rounded-full transition-colors",
                            i < currentQuestionNumber ? "bg-primary" : "bg-muted-foreground/30"
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {currentQuestionNumber} of {totalQuestions}
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Powered by alfred ai</p>
                )}
              </div>
            </div>
            {(step !== "intro" && step !== "industry") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRestart}
                className="text-xs"
              >
                <RefreshCcw className="w-3 h-3 mr-1" />
                Start Over
              </Button>
            )}
          </div>

          {/* Messages */}
          <div ref={chatContainerRef} className="h-[500px] md:h-[600px] overflow-y-auto p-4 space-y-4">
            <SafeAnimatePresence mode="popLayout">
              {messages.map((msg, idx) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={cn(
                    "flex",
                    msg.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] px-4 py-3 rounded-2xl",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted rounded-bl-md"
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                      {msg.content.split("**").map((part, i) =>
                        i % 2 === 1 ? (
                          <strong key={i}>{part}</strong>
                        ) : (
                          part
                        )
                      )}
                    </p>
                  </div>
                </motion.div>
              ))}
            </SafeAnimatePresence>

            {/* Typing Indicator */}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-muted px-4 py-3 rounded-2xl rounded-bl-md">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Industry Selection */}
            {step === "industry" && !isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-2 gap-2"
              >
                {industryOptions.map((industry) => (
                  <button
                    key={industry.id}
                    onClick={() => handleIndustrySelect(industry.id, industry.label)}
                    className="p-3 text-left rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors min-h-[48px]"
                  >
                    <span className="text-sm font-medium">{industry.label}</span>
                  </button>
                ))}
              </motion.div>
            )}

            {/* Quick Options */}
            {["team_size", "salary", "hours", "workflows"].includes(step) && !isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-wrap gap-2"
              >
                {quickOptions[step]?.map((option) => (
                  <button
                    key={option.label}
                    onClick={() => handleQuickOption(option.value as number, option.label)}
                    className="px-4 py-2.5 rounded-full border border-primary/30 bg-primary/5 hover:bg-primary/10 text-sm font-medium text-primary transition-colors min-h-[44px]"
                  >
                    {option.label}
                  </button>
                ))}
              </motion.div>
            )}

            {/* Transformation - Show lead capture inline */}
            {step === "transformation" && hasAllAnswers && !isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-muted/50 rounded-xl p-4 border"
              >
                <div className="text-center mb-4">
                  <p className="text-sm font-medium text-primary">
                    💡 To unlock your full personalized quote, share a few details:
                  </p>
                </div>
                <PricingLeadCapture
                  calculatorData={{
                    industry: answers.industry!,
                    teamSize: answers.teamSize!,
                    averageSalary: answers.averageSalary!,
                    hoursOnAdmin: answers.hoursOnAdmin!,
                    workflowCount: answers.workflowCount!,
                  }}
                  onSuccess={handleLeadCaptureSuccess}
                />
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area - hide during transformation/complete */}
          {!isComplete && step !== "transformation" && (
            <form onSubmit={handleInputSubmit} className="p-4 border-t bg-muted/30">
              <div className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Type your answer..."
                  className="flex-1"
                  disabled={isTyping || step === "industry"}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!inputValue.trim() || isTyping}
                  className="min-h-[44px] min-w-[44px]"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </form>
          )}

          {/* Complete State CTAs */}
          {isComplete && (
            <div className="p-4 border-t bg-gradient-to-r from-primary/5 to-secondary/5 space-y-3">
              <Button className="w-full min-h-[48px]" asChild>
                <a href="https://new.alfredai.bot/book">
                  Book a Call
                  <ArrowRight className="w-4 h-4 ml-2" />
                </a>
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Questions? <a href="/contact" className="text-primary hover:underline">Chat with our team</a>
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
