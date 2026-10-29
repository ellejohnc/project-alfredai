import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import { Send, Bot, User, Loader2, ArrowRight, ArrowLeft, Calendar, X, AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { moderateContent, sanitizeInput } from "@/lib/contentModeration";
import { createVisitorSession, getStoredCredentials } from "@/lib/visitorSession";
import { toast } from "sonner";
import { GHLBookingWidget } from "@/components/GHLBookingWidget";
import { logGHLSubmission } from "@/hooks/useGHLLogging";
import { validateEmail, isDisposableEmail } from "@/lib/emailValidation";

// Validation for signup inputs
const validateSignupInput = (value: string, type: "name" | "email" | "company"): { isValid: boolean; error: string | null } => {
  const trimmed = value.trim();
  
  if (trimmed.length < 2) {
    return { isValid: false, error: type === "email" ? "Please enter a valid email" : "Please enter at least 2 characters" };
  }
  
  const gibberishPatterns = [
    /^[a-z]{1,2}$/i,
    /^(.)\1+$/i,
    /^(asdf|qwer|zxcv|not telling|none|no|nope|n\/a|na|xxx|test|fake)/i,
    /^[^a-zA-Z]*$/,
  ];
  
  if (type !== "email" && gibberishPatterns.some(p => p.test(trimmed))) {
    return { isValid: false, error: type === "name" ? "Please enter your real name" : "Please enter a valid response" };
  }
  
  if (type === "email") {
    // Use the shared strict email validation
    const result = validateEmail(trimmed, true);
    if (!result.success && 'error' in result) {
      return { isValid: false, error: result.error };
    }
  }
  
  if (trimmed.length > 100) {
    return { isValid: false, error: "Input is too long" };
  }
  
  return { isValid: true, error: null };
};

// Animated message content renderer for benefit lists
const AnimatedMessageContent = ({ content }: { content: string }) => {
  const lines = content.split('\n');
  const hasBenefitList = lines.some(line => /^[✨📊🎯🔗]/u.test(line.trim()));
  
  if (!hasBenefitList) {
    return <span className="whitespace-pre-line">{content}</span>;
  }

  return (
    <>
      {lines.map((line, index) => {
        const isBenefitLine = /^[✨📊🎯🔗]/u.test(line.trim());
        const isEmptyLine = line.trim() === '';
        
        if (isEmptyLine) {
          return <br key={index} />;
        }
        
        if (isBenefitLine) {
          return (
            <motion.span
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ 
                delay: 0.3 + (index * 0.15), 
                duration: 0.4,
                ease: "easeOut"
              }}
              className="block"
            >
              {line}
            </motion.span>
          );
        }
        
        return (
          <motion.span
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
            className="block"
          >
            {line}
          </motion.span>
        );
      })}
    </>
  );
};

type Message = {
  id: string;
  role: "assistant" | "user";
  content: string;
  options?: string[];
  multiSelect?: boolean;
  inputType?: "text" | "email" | "select";
  allowCustomInput?: boolean; // Allow typing custom value instead of selecting
};

type VisitorData = {
  name: string;
  email: string;
  company: string;
  industry: string;
  teamSize: string;
  primaryChallenge: string;
  workflowsToAutomate: string[];
  painLevel: string;
  timeline: string;
  painPoints: string[];
  currentTools: string[];
  goals: string[];
};

type SignupStep = 
  | "welcome" 
  | "name" 
  | "email" 
  | "company" 
  | "industry" 
  | "primary_challenge"
  | "workflows"
  | "team_size" 
  | "pain_level"
  | "goals" 
  | "timeline"
  | "generating" 
  | "complete"
  | "qualification"; // AI-powered qualification conversation

// Industry-specific workflow options
const INDUSTRY_WORKFLOWS: Record<string, string[]> = {
  "Construction": ["Site Inspections", "Subcontractor Management", "Contract Review", "Procurement", "Fee Proposals", "Project Scheduling"],
  "Real Estate": ["Property Management", "Contract Review", "Lease Administration", "Tenant Communications", "Fee Proposals"],
  "Professional Services": ["Contract Review", "Fee Proposals", "Client Communications", "Knowledge Management", "Time Tracking"],
  "Consulting": ["Knowledge Synthesis", "Lead Research", "Fee Proposals", "Client Reports", "Document Analysis"],
  "Recruitment": ["Candidate Screening", "Interview Scheduling", "Offer Letters", "Candidate Matching", "Background Checks"],
  "Technology": ["Workflow Automation", "Knowledge Base", "Customer Support", "Documentation", "Incident Management"],
  "Manufacturing": ["Procurement", "Supplier Management", "Quality Control", "Inventory", "Compliance Reporting"],
  "Finance/Accounting": ["Invoice Processing", "Expense Management", "Compliance", "Audit Preparation", "Report Generation"],
  "Legal": ["Contract Review", "Document Analysis", "Due Diligence", "Compliance", "Research"],
  "Other": ["Document Processing", "Invoicing", "Customer Support", "Lead Research", "Workflow Automation"]
};

const getWorkflowOptions = (industry: string): string[] => {
  return INDUSTRY_WORKFLOWS[industry] || INDUSTRY_WORKFLOWS["Other"];
};

const stepMessages: Record<SignupStep, Message> = {
  welcome: {
    id: "welcome",
    role: "assistant",
    content: "Hi there! 👋 I'm Alfred, your AI assistant. I'll ask a few targeted questions to build a personalized demo showing exactly how alfred ai can solve your specific challenges. Takes about 30 seconds. Ready?",
    options: ["Let's do it!", "Tell me more first"],
  },
  name: {
    id: "name",
    role: "assistant",
    content: "Great! First things first — your full name, please?",
    inputType: "text",
  },
  email: {
    id: "email",
    role: "assistant",
    content: "Nice to meet you, {name}! What's the best email to reach you at?",
    inputType: "email",
  },
  company: {
    id: "company",
    role: "assistant",
    content: "Got it! And what company are you with?",
    inputType: "text",
  },
  industry: {
    id: "industry",
    role: "assistant",
    content: "What industry is {company} in?",
    options: ["Construction", "Real Estate", "Professional Services", "Consulting", "Recruitment", "Technology", "Manufacturing", "Finance/Accounting", "Legal"],
    allowCustomInput: true,
  },
  primary_challenge: {
    id: "primary_challenge",
    role: "assistant",
    content: "What's the #1 challenge slowing down {company} right now?",
    options: [
      "Too much time on documents & contracts",
      "Hiring/recruitment is too slow",
      "Client communications are overwhelming",
      "Project coordination is chaotic",
      "Cash flow and invoicing is unpredictable",
      "Compliance and reporting is manual"
    ],
    allowCustomInput: true,
  },
  workflows: {
    id: "workflows",
    role: "assistant",
    content: "Which workflows would you most want to automate? (Select up to 3, or type your own)",
    options: [], // Dynamically populated based on industry
    multiSelect: true,
    allowCustomInput: true,
  },
  team_size: {
    id: "team_size",
    role: "assistant",
    content: "How big is the team that would use alfred ai?",
    options: ["1-10", "11-50", "51-200", "201-500", "500+"],
  },
  pain_level: {
    id: "pain_level",
    role: "assistant",
    content: "How much time does your team currently spend on these manual tasks?",
    options: [
      "10+ hours/week per person",
      "5-10 hours/week per person", 
      "2-5 hours/week per person",
      "Just exploring options"
    ],
  },
  goals: {
    id: "goals",
    role: "assistant",
    content: "What's most important to achieve? (Select all that apply)",
    options: ["Save time and reduce manual work", "Scale operations without hiring", "Improve accuracy and reduce errors", "Better visibility into operations"],
    multiSelect: true,
  },
  timeline: {
    id: "timeline",
    role: "assistant",
    content: "Last one! When are you looking to implement a solution?",
    options: ["Ready to implement now", "Within 3 months", "Within 6 months", "Just researching"],
  },
  generating: {
    id: "generating",
    role: "assistant",
    content: "Perfect! 🎉 I'm now creating your personalized demo experience with custom workflow simulations, ROI projections, and a tailored report...",
  },
  complete: {
    id: "complete",
    role: "assistant",
    content: "Your personalized experience is ready! 🚀 Click below to see interactive demos of the exact workflows you selected, plus custom ROI projections for {company}.",
  },
  qualification: {
    id: "qualification",
    role: "assistant",
    content: "", // Dynamic AI-generated content
    inputType: "text",
  },
};

const STEP_ORDER: SignupStep[] = [
  "welcome", "name", "email", "company", "industry", "primary_challenge",
  "workflows", "team_size", "pain_level", "goals", "timeline", "generating", "complete"
];

interface ConversationalSignupProps {
  initialMessage?: string;
}

export default function ConversationalSignup({ initialMessage }: ConversationalSignupProps) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<SignupStep>("welcome");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [customInputValue, setCustomInputValue] = useState(""); // For typing custom option
  const [isTyping, setIsTyping] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [visitorData, setVisitorData] = useState<VisitorData>({
    name: "",
    email: "",
    company: "",
    industry: "",
    teamSize: "",
    primaryChallenge: "",
    workflowsToAutomate: [],
    painLevel: "",
    timeline: "",
    painPoints: [],
    currentTools: [],
    goals: [],
  });
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [qualificationHistory, setQualificationHistory] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [isQualifying, setIsQualifying] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const customInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Generate contextual welcome based on user's input
  const generateContextualWelcome = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    const challengeResponses: Record<string, { ack: string; hint: string }> = {
      "contract": { 
        ack: "Contract management can really slow operations down",
        hint: "I can show you how we cut contract review time by 80%"
      },
      "invoice": { 
        ack: "Manual invoicing is a common pain point",
        hint: "Let me show you our auto-invoicing workflow"
      },
      "billing": { 
        ack: "Billing bottlenecks can hurt cash flow",
        hint: "I'll demo how we automate the entire billing cycle"
      },
      "productivity": { 
        ack: "Low productivity often stems from repetitive manual tasks",
        hint: "We help teams reclaim 10+ hours per week"
      },
      "slow": { 
        ack: "Process bottlenecks are frustrating",
        hint: "Let me show you how we speed things up"
      },
      "hiring": { 
        ack: "Recruitment bottlenecks can really hold back growth",
        hint: "I can demo our candidate matching and interview automation"
      },
      "recruit": { 
        ack: "Finding the right talent is tough",
        hint: "I'll show you our AI-powered candidate screening"
      },
      "document": { 
        ack: "Document processing can eat up hours every week",
        hint: "Let me show you how we automate document workflows"
      },
      "report": { 
        ack: "Manual reporting is tedious and error-prone",
        hint: "I can demo our automated reporting system"
      },
      "inspection": { 
        ack: "Site inspections need streamlining",
        hint: "I'll show you our AI-powered inspection workflow"
      },
      "procurement": { 
        ack: "Procurement complexity can slow projects down",
        hint: "Let me demo our procurement automation"
      },
      "compliance": { 
        ack: "Staying compliant shouldn't be a full-time job",
        hint: "I'll show you how we simplify compliance workflows"
      },
      "communication": { 
        ack: "Managing client communications is overwhelming",
        hint: "I can show you our intelligent communication workflows"
      },
      "project": { 
        ack: "Project coordination challenges affect the whole team",
        hint: "Let me show you how we bring order to project chaos"
      },
      "time": { 
        ack: "Time is your most valuable resource",
        hint: "I'll show you workflows that give hours back each week"
      },
      "manual": { 
        ack: "Manual processes don't scale",
        hint: "Let me show you how to automate the repetitive stuff"
      },
      "error": { 
        ack: "Human errors cost time and money",
        hint: "I'll demo how automation improves accuracy"
      },
      "scale": { 
        ack: "Scaling without adding headcount is the dream",
        hint: "I can show you how we help teams do more with less"
      },
    };
    
    // Find matching challenge
    for (const [keyword, response] of Object.entries(challengeResponses)) {
      if (input.includes(keyword)) {
        return `Hi there! 👋 ${response.ack}. ${response.hint}. Let me ask a few quick questions to personalize your demo.`;
      }
    }
    
    // Fallback - still acknowledge what they said meaningfully
    return `Hi there! 👋 Thanks for sharing that with me. I'm Alfred, and I'll build you a personalized demo showing exactly how we can help. Let me ask a few quick questions.`;
  };

  useEffect(() => {
    // If there's an initial message, show a contextual welcome that acknowledges it
    if (initialMessage && initialMessage.trim()) {
      setIsTyping(true);
      setTimeout(() => {
        const welcomeWithContext: Message = {
          id: `welcome-${Date.now()}`,
          role: "assistant",
          content: generateContextualWelcome(initialMessage.trim()),
          options: ["Let's do it!", "Tell me more first"],
        };
        setMessages([welcomeWithContext]);
        setIsTyping(false);
        setCurrentStep("welcome");
      }, 500);
    } else {
      setTimeout(() => {
        addAssistantMessage("welcome");
      }, 500);
    }
  }, []);

  const replaceVariables = (text: string) => {
    return text
      .replace("{name}", visitorData.name || "")
      .replace("{email}", visitorData.email || "")
      .replace("{company}", visitorData.company || "");
  };

  const addAssistantMessage = (step: SignupStep) => {
    setIsTyping(true);
    setTimeout(() => {
      let message = { ...stepMessages[step] };
      message.content = replaceVariables(message.content);
      message.id = `${step}-${Date.now()}`;
      
      // Dynamically set workflow options based on industry
      if (step === "workflows") {
        message = {
          ...message,
          options: getWorkflowOptions(visitorData.industry),
          allowCustomInput: true,
        };
      }
      
      setMessages((prev) => [...prev, message]);
      setIsTyping(false);
      setCurrentStep(step);
      setSelectedOptions([]);
      setCustomInputValue(""); // Reset custom input
      
      if (message.inputType) {
        setTimeout(() => inputRef.current?.focus(), 100);
      }
      
      // Auto-trigger generation when we hit the generating step
      if (step === "generating") {
        generatePersonalization();
      }
    }, 800);
  };

  const addUserMessage = (content: string) => {
    const message: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content,
    };
    setMessages((prev) => [...prev, message]);
  };

  // AI-powered qualification conversation
  const streamQualificationResponse = async (userMessage: string) => {
    const newHistory = [...qualificationHistory, { role: "user" as const, content: userMessage }];
    setQualificationHistory(newHistory);
    setIsQualifying(true);
    setIsTyping(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/signup-qualify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: newHistory,
            visitorContext: {
              name: visitorData.name,
              company: visitorData.company,
              industry: visitorData.industry,
              teamSize: visitorData.teamSize,
              primaryChallenge: visitorData.primaryChallenge,
            },
          }),
        }
      );

      if (!response.ok || !response.body) {
        throw new Error("Failed to get AI response");
      }

      setIsTyping(false);

      // Create streaming message
      const messageId = `qualify-${Date.now()}`;
      setMessages((prev) => [...prev, { id: messageId, role: "assistant", content: "", inputType: "text" }]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let fullResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              fullResponse += content;
              setMessages((prev) => 
                prev.map((m) => m.id === messageId ? { ...m, content: fullResponse } : m)
              );
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Update history with full response
      setQualificationHistory([...newHistory, { role: "assistant", content: fullResponse }]);

      // Check for conversation signals in the response
      const lowerResponse = fullResponse.toLowerCase();
      
      // Check if ready to continue with signup
      if (lowerResponse.includes("ready to continue") || 
          lowerResponse.includes("shall we proceed") || 
          lowerResponse.includes("let's get started")) {
        // Add options to continue
        setMessages((prev) => 
          prev.map((m) => m.id === messageId ? { ...m, options: ["Yes, let's continue!", "Not right now"] } : m)
        );
      }
      
      // Check if conversation should end gracefully
      if (lowerResponse.includes("best of luck") || 
          lowerResponse.includes("feel free to come back") ||
          lowerResponse.includes("no pressure at all") ||
          lowerResponse.includes("when you're ready")) {
        setIsQualifying(false);
        setCurrentStep("welcome"); // Allow restart
      }

    } catch (error) {
      console.error("Qualification error:", error);
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: "I'd love to chat more, but I'm having a moment. Would you like to explore our demos or book an Impact Conversation with our team?",
          options: ["View Demos", "Book an Impact Conversation", "Try Again"],
        },
      ]);
    } finally {
      setIsQualifying(false);
    }
  };

  const getNextStep = (current: SignupStep): SignupStep => {
    const currentIndex = STEP_ORDER.indexOf(current);
    return STEP_ORDER[currentIndex + 1] || "complete";
  };

  const generatePersonalization = async () => {
    setIsGenerating(true);
    
    try {
      // Map pain level to legacy pain points format
      const derivedPainPoints: string[] = [];
      if (visitorData.primaryChallenge.includes("documents")) derivedPainPoints.push("Document Management");
      if (visitorData.primaryChallenge.includes("hiring")) derivedPainPoints.push("Team Scaling");
      if (visitorData.primaryChallenge.includes("communications")) derivedPainPoints.push("Client Experience");
      if (visitorData.primaryChallenge.includes("chaotic")) derivedPainPoints.push("Visibility");
      if (visitorData.primaryChallenge.includes("invoicing")) derivedPainPoints.push("Admin Overhead");
      if (visitorData.primaryChallenge.includes("Compliance")) derivedPainPoints.push("Admin Overhead");

      // Create session via secure Edge Function
      const sessionResult = await createVisitorSession({
        name: visitorData.name,
        email: visitorData.email,
        company: visitorData.company,
        industry: visitorData.industry,
        team_size: visitorData.teamSize,
        pain_points: derivedPainPoints,
        current_tools: visitorData.currentTools,
        goals: visitorData.goals,
        primary_challenge: visitorData.primaryChallenge,
        workflows_to_automate: visitorData.workflowsToAutomate,
        pain_level: visitorData.painLevel,
        timeline: visitorData.timeline,
      });

      if (!sessionResult) {
        throw new Error("Failed to save your information");
      }

      setSessionId(sessionResult.sessionId);

      // NOTE: Lead submission is deferred to PersonalizedResults page
      // Leads are only synced to GHL when user provides phone number or skips to booking
      console.log('Session created, lead will be submitted in PersonalizedResults:', sessionResult.sessionId);

      const credentials = getStoredCredentials();

      // Call edge function to generate personalization
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-personalization`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            sessionId: sessionResult.sessionId,
            visitorData: {
              ...visitorData,
              painPoints: derivedPainPoints,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 429) {
          toast.error("We're experiencing high demand. Please try again in a moment.");
        } else if (response.status === 402) {
          toast.error("Service temporarily unavailable. Please try again later.");
        }
        throw new Error(errorData.error || "Failed to generate personalization");
      }

      // Move to complete step
      addAssistantMessage("complete");
      
    } catch (error) {
      console.error("Personalization error:", error);
      toast.error("Something went wrong. Please try again.");
      
      // Fall back to showing a basic complete message
      setMessages((prev) => [
        ...prev,
        {
          id: `error-recovery-${Date.now()}`,
          role: "assistant",
          content: "I had a small hiccup, but no worries! You can still explore our demos or book an Impact Conversation to see alfred ai in action.",
        },
      ]);
      setCurrentStep("complete");
    } finally {
      setIsGenerating(false);
    }
  };

  // Detect disinterest signals in user input
  const isDisinterestSignal = (text: string): boolean => {
    const lowerText = text.toLowerCase().trim();
    const disinterestPatterns = [
      /^(i('m| am))?\s*(not\s+interested)/i,
      /^no\s*(thanks|thank you)?$/i,
      /^(i('ll| will))?\s*(think\s+about\s+it)/i,
      /^not\s+(right\s+)?now$/i,
      /^(maybe\s+)?later$/i,
      /^(i\s+)?(don('t| not)|do\s+not)\s+(want|need)/i,
      /^(stop|quit|exit|cancel|nevermind|never\s*mind)/i,
      /^(leave\s+me\s+alone|go\s+away)/i,
      /^(i('m| am))?\s*(just\s+)?(looking|browsing)/i,
      /^not\s+for\s+(me|us)/i,
      /^(pass|skip)/i,
    ];
    return disinterestPatterns.some(pattern => pattern.test(lowerText));
  };

  const handleSubmit = (value: string) => {
    if (!value.trim()) return;
    
    setValidationError(null);
    const sanitized = sanitizeInput(value);
    
    // Handle qualification mode - send to AI
    if (currentStep === "qualification") {
      addUserMessage(sanitized);
      setInputValue("");
      streamQualificationResponse(sanitized);
      return;
    }
    
    // Detect disinterest at any step and trigger AI qualification
    if (isDisinterestSignal(sanitized)) {
      addUserMessage(sanitized);
      setInputValue("");
      setCurrentStep("qualification");
      setQualificationHistory([{ role: "user", content: sanitized }]);
      streamQualificationResponse(sanitized);
      return;
    }
    
    const moderation = moderateContent(sanitized);
    if (moderation.shouldBlock) {
      setValidationError(moderation.message || "Let's keep things professional. Please try again.");
      setRetryCount(prev => prev + 1);
      return;
    }
    
    if (currentStep === "name" || currentStep === "email" || currentStep === "company") {
      const validation = validateSignupInput(sanitized, currentStep as "name" | "email" | "company");
      if (!validation.isValid) {
        setValidationError(validation.error);
        setRetryCount(prev => prev + 1);
        
        if (retryCount >= 2) {
          setIsTyping(true);
          setTimeout(() => {
            setMessages((prev) => [
              ...prev,
              {
                id: `help-${Date.now()}`,
                role: "assistant",
                content: "Having trouble? No worries! You can also book an Impact Conversation directly and we'll get your details there. 📞",
                options: ["Book an Impact Conversation Instead", "I'll try again"],
              },
            ]);
            setIsTyping(false);
            setRetryCount(0);
          }, 500);
        }
        return;
      }
    }

    addUserMessage(sanitized);

    // Store user data based on current step
    switch (currentStep) {
      case "name":
        setVisitorData((prev) => ({ ...prev, name: sanitized }));
        break;
      case "email":
        setVisitorData((prev) => ({ ...prev, email: sanitized }));
        break;
      case "company":
        setVisitorData((prev) => ({ ...prev, company: sanitized }));
        break;
    }

    setInputValue("");
    setRetryCount(0);
    
    setTimeout(() => {
      const nextStep = getNextStep(currentStep);
      addAssistantMessage(nextStep);
    }, 300);
  };

  const handleMultiSelectConfirm = () => {
    // Combine selected options with custom input if provided
    const allSelections = [...selectedOptions];
    if (customInputValue.trim()) {
      allSelections.push(customInputValue.trim());
    }
    
    if (allSelections.length === 0) {
      setValidationError("Please select at least one option or type your own");
      return;
    }

    // Limit workflows to 3
    if (currentStep === "workflows" && allSelections.length > 3) {
      setValidationError("Please select up to 3 workflows");
      return;
    }
    
    addUserMessage(allSelections.join(", "));
    
    switch (currentStep) {
      case "workflows":
        setVisitorData((prev) => ({ ...prev, workflowsToAutomate: allSelections }));
        break;
      case "goals":
        setVisitorData((prev) => ({ ...prev, goals: allSelections }));
        break;
    }
    
    setCustomInputValue("");
    setTimeout(() => {
      const nextStep = getNextStep(currentStep);
      addAssistantMessage(nextStep);
    }, 300);
  };

  // Handle custom text input for single-select questions with allowCustomInput
  const handleCustomInputSubmit = () => {
    if (!customInputValue.trim()) return;
    
    setValidationError(null);
    const sanitized = sanitizeInput(customInputValue.trim());
    
    const moderation = moderateContent(sanitized);
    if (moderation.shouldBlock) {
      setValidationError(moderation.message || "Let's keep things professional. Please try again.");
      return;
    }
    
    addUserMessage(sanitized);
    
    switch (currentStep) {
      case "industry":
        setVisitorData((prev) => ({ ...prev, industry: sanitized }));
        break;
      case "primary_challenge":
        setVisitorData((prev) => ({ ...prev, primaryChallenge: sanitized }));
        break;
    }
    
    setCustomInputValue("");
    setTimeout(() => {
      const nextStep = getNextStep(currentStep);
      addAssistantMessage(nextStep);
    }, 300);
  };

  const handleOptionClick = (option: string) => {
    setValidationError(null);
    
    const currentMessage = messages[messages.length - 1];
    
    // Handle multi-select
    if (currentMessage?.multiSelect) {
      // For workflows, limit to 3
      if (currentStep === "workflows" && !selectedOptions.includes(option) && selectedOptions.length >= 3) {
        setValidationError("You can select up to 3 workflows");
        return;
      }
      setSelectedOptions(prev => 
        prev.includes(option) 
          ? prev.filter(o => o !== option) 
          : [...prev, option]
      );
      return;
    }
    
    if (option === "Book an Impact Conversation Instead" || option === "Book a Call Instead") {
      addUserMessage(option);
      setCurrentStep("complete");
      setShowCalendar(true);
      setIsTyping(true);
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: `booking-${Date.now()}`,
            role: "assistant",
            content: "Great choice! Pick a time that works for you below. 📅",
          },
        ]);
        setIsTyping(false);
      }, 500);
      return;
    }
    
    if (option === "I'll try again") {
      addUserMessage(option);
      setIsTyping(true);
      setTimeout(() => {
        const currentMsg = { ...stepMessages[currentStep] };
        currentMsg.content = replaceVariables(currentMsg.content);
        currentMsg.id = `retry-${Date.now()}`;
        setMessages((prev) => [...prev, currentMsg]);
        setIsTyping(false);
        setTimeout(() => inputRef.current?.focus(), 100);
      }, 500);
      return;
    }
    
    if (currentStep === "welcome") {
      if (option === "Tell me more first") {
        addUserMessage(option);
        setIsTyping(true);
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              id: `info-${Date.now()}`,
              role: "assistant",
              content: "Here, I create a personalized demo showing exactly how we can help your business!\n\nYou'll get:\n✨ Interactive demos of your selected workflows\n📊 Custom ROI projections for your team size\n🎯 A guided simulation using your company context\n🔗 A shareable link for your team\n\nReady to get started?",
              options: ["Yes, let's go!", "I'll think about it"],
            },
          ]);
          setIsTyping(false);
        }, 800);
      } else {
        addUserMessage(option);
        setTimeout(() => addAssistantMessage("name"), 300);
      }
    } else if (option === "Yes, let's go!" || option === "Yes, let's continue!") {
      addUserMessage(option);
      setIsQualifying(false);
      setQualificationHistory([]);
      setTimeout(() => addAssistantMessage("name"), 300);
    } else if (option === "I'll think about it") {
      addUserMessage(option);
      // Start AI-powered qualification conversation
      setCurrentStep("qualification");
      setQualificationHistory([{ role: "user", content: "I'll think about it" }]);
      streamQualificationResponse("I'll think about it");
    } else if (option === "Not right now") {
      addUserMessage(option);
      // Continue qualification to understand why
      streamQualificationResponse("Not right now");
    } else if (option === "View Demos") {
      navigate("/resources/demos");
    } else if (option === "Book an Impact Conversation" || option === "Book a Call") {
      window.location.href = "https://new.alfredai.bot/book";
    } else if (option === "Try Again") {
      // Retry qualification
      streamQualificationResponse("Let me try again");
    } else {
      // Single select option
      addUserMessage(option);
      
      switch (currentStep) {
        case "industry":
          setVisitorData((prev) => ({ ...prev, industry: option }));
          break;
        case "team_size":
          setVisitorData((prev) => ({ ...prev, teamSize: option }));
          break;
        case "primary_challenge":
          setVisitorData((prev) => ({ ...prev, primaryChallenge: option }));
          break;
        case "pain_level":
          setVisitorData((prev) => ({ ...prev, painLevel: option }));
          break;
        case "timeline":
          setVisitorData((prev) => ({ ...prev, timeline: option }));
          break;
      }
      
      setTimeout(() => {
        const nextStep = getNextStep(currentStep);
        addAssistantMessage(nextStep);
      }, 300);
    }
  };

  const currentMessage = stepMessages[currentStep];
  const showInput = (currentMessage?.inputType && messages.length > 0 && currentStep !== "complete" && currentStep !== "generating") || currentStep === "qualification";
  const lastMessage = messages[messages.length - 1];
  const showOptions = lastMessage?.options && !isTyping && !lastMessage?.multiSelect && !isQualifying;
  const showMultiSelect = lastMessage?.multiSelect && !isTyping;

  // Calculate progress
  const progressSteps = STEP_ORDER.slice(1, -2); // Exclude welcome, generating, complete
  const currentProgressIndex = progressSteps.indexOf(currentStep);
  const progress = currentStep === "complete" || currentStep === "generating" 
    ? 100 
    : Math.max(0, ((currentProgressIndex + 1) / progressSteps.length) * 100);

  return (
    <div className="flex flex-col h-[600px] max-h-[80vh] bg-card rounded-2xl border border-border overflow-hidden shadow-xl">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-background">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="h-8 px-2 text-muted-foreground hover:text-foreground -ml-2"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          <span className="text-xs">Back</span>
        </Button>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
          <Bot className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Alfred</h3>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-muted-foreground">Online</span>
          </div>
        </div>
        <div className="ml-auto flex-1 max-w-32">
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1 text-right">{Math.round(progress)}%</p>
        </div>
      </div>

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4">
        <AnimatePresence mode="popLayout">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "flex gap-3",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {message.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-3",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted text-foreground rounded-bl-md"
                )}
              >
                <p className="text-sm leading-relaxed">
                  <AnimatedMessageContent content={message.content} />
                </p>
              </div>
              {message.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </motion.div>
        )}

        {/* Generating indicator */}
        {currentStep === "generating" && isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 pl-11"
          >
            <div className="flex items-center gap-2 text-primary">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Creating your personalized experience...</span>
            </div>
          </motion.div>
        )}

        {/* Single-select Options */}
        {showOptions && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3 pl-11"
          >
            <div className="flex flex-wrap gap-2">
              {lastMessage?.options?.map((option) => (
                <Button
                  key={option}
                  variant="outline"
                  size="sm"
                  onClick={() => handleOptionClick(option)}
                  className="rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  {option}
                </Button>
              ))}
            </div>
            
            {/* Custom input for single-select with allowCustomInput */}
            {lastMessage?.allowCustomInput && (
              <div className="flex gap-2 items-center">
                <span className="text-sm text-muted-foreground">or type:</span>
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleCustomInputSubmit();
                  }}
                  className="flex gap-2 flex-1"
                >
                  <Input
                    ref={customInputRef}
                    type="text"
                    value={customInputValue}
                    onChange={(e) => {
                      setCustomInputValue(e.target.value);
                      if (validationError) setValidationError(null);
                    }}
                    placeholder="Type your own..."
                    className="flex-1 rounded-full px-4 h-9 text-sm"
                    maxLength={100}
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!customInputValue.trim()}
                    className="rounded-full"
                  >
                    <Send className="w-3 h-3" />
                  </Button>
                </form>
              </div>
            )}
            
            {validationError && (
              <p className="text-destructive text-sm flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {validationError}
              </p>
            )}
          </motion.div>
        )}

        {/* Multi-select Options */}
        {showMultiSelect && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3 pl-11"
          >
            <div className="flex flex-wrap gap-2">
              {lastMessage?.options?.map((option) => (
                <Button
                  key={option}
                  variant={selectedOptions.includes(option) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleOptionClick(option)}
                  className="rounded-full transition-colors"
                >
                  {option}
                </Button>
              ))}
            </div>
            
            {/* Custom input for multi-select with allowCustomInput */}
            {lastMessage?.allowCustomInput && (
              <div className="flex gap-2 items-center">
                <span className="text-sm text-muted-foreground">or add your own:</span>
                <Input
                  type="text"
                  value={customInputValue}
                  onChange={(e) => {
                    setCustomInputValue(e.target.value);
                    if (validationError) setValidationError(null);
                  }}
                  placeholder="Type a workflow..."
                  className="flex-1 rounded-full px-4 h-9 text-sm max-w-48"
                  maxLength={100}
                />
              </div>
            )}
            
            {validationError && (
              <p className="text-destructive text-sm flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {validationError}
              </p>
            )}
            <Button
              size="sm"
              onClick={handleMultiSelectConfirm}
              disabled={selectedOptions.length === 0 && !customInputValue.trim()}
              className="gap-2"
            >
              Continue
              <ArrowRight className="w-3 h-3" />
            </Button>
          </motion.div>
        )}

        {/* Complete state */}
        {currentStep === "complete" && !isTyping && !isGenerating && !showCalendar && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-3 pt-4"
          >
            {sessionId && (
              <Button 
                size="lg" 
                onClick={() => navigate(`/results/${sessionId}`)}
                className="gap-2 bg-gradient-to-r from-primary to-pink-500 hover:from-primary/90 hover:to-pink-500/90 shadow-lg shadow-primary/25"
              >
                <Sparkles className="w-4 h-4" />
                View Your Personalized Demo
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => setShowCalendar(true)}
              className="gap-2"
            >
              <Calendar className="w-4 h-4" />
              Book an Impact Conversation Instead
            </Button>
          </motion.div>
        )}

        {/* Calendar Embed */}
        {currentStep === "complete" && showCalendar && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col pt-2"
          >
            <div className="flex justify-between items-center mb-2 pl-11">
              <span className="text-sm font-medium text-foreground">Select a time slot:</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCalendar(false)}
                className="text-muted-foreground hover:text-foreground h-8"
              >
                <X className="w-4 h-4 mr-1" />
                Back
              </Button>
            </div>
            <GHLBookingWidget
              leadData={{
                name: visitorData.name,
                email: visitorData.email,
                company: visitorData.company,
              }}
              sourceData={{
                source: "website",
                medium: "chatbot",
                campaign: "signup_flow",
                content: visitorData.industry || "signup",
              }}
              height={400}
              variant="inline"
            />
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {showInput && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 border-t border-border bg-background"
        >
          {validationError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-destructive text-sm mb-2 px-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </motion.div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(inputValue);
            }}
            className="flex gap-2"
          >
            <Input
              ref={inputRef}
              type={currentMessage?.inputType === "email" ? "email" : "text"}
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                if (validationError) setValidationError(null);
              }}
              placeholder={
                currentMessage?.inputType === "email"
                  ? "Enter your email..."
                  : "Type your answer..."
              }
              className={cn(
                "flex-1 rounded-full px-4",
                validationError && "border-destructive focus-visible:ring-destructive"
              )}
              maxLength={100}
            />
            <Button
              type="submit"
              size="icon"
              className="rounded-full shrink-0"
              disabled={!inputValue.trim()}
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </motion.div>
      )}
    </div>
  );
}
