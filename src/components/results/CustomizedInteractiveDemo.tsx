import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import { 
  Bot, Send, Sparkles, Building2, Users, Target, 
  TrendingUp, Clock, CheckCircle2, ArrowRight, Loader2,
  FileText, DollarSign, Zap, Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CustomizedInteractiveDemoProps {
  company: string;
  industry: string;
  painPoints: string[];
  goals: string[];
  teamSize: string;
}

type DemoScenario = {
  title: string;
  description: string;
  icon: typeof Bot;
  steps: {
    action: string;
    result: string;
    metric?: string;
  }[];
};

type Message = {
  role: "user" | "assistant";
  content: string;
  scenario?: DemoScenario;
};

export function CustomizedInteractiveDemo({
  company,
  industry,
  painPoints,
  goals,
  teamSize,
}: CustomizedInteractiveDemoProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentScenario, setCurrentScenario] = useState<DemoScenario | null>(null);
  const [scenarioStep, setScenarioStep] = useState(0);
  const [isAnimatingScenario, setIsAnimatingScenario] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Generate initial personalized scenarios based on visitor data
  const generateContextualScenarios = (): DemoScenario[] => {
    const scenarios: DemoScenario[] = [];
    
    // Map pain points to scenarios
    if (painPoints.includes("admin_overload") || painPoints.includes("Manual processes")) {
      scenarios.push({
        title: "Eliminate Admin Overhead",
        description: `See how ${company} could automate repetitive tasks`,
        icon: FileText,
        steps: [
          { action: "Document arrives via email", result: "AI extracts key data instantly", metric: "5 min → 10 sec" },
          { action: "Validation & cross-reference", result: "Automatically checked against records", metric: "99.2% accuracy" },
          { action: "Task assignment", result: "Right person notified with context", metric: "Zero manual routing" },
        ]
      });
    }

    if (painPoints.includes("Growth challenges") || goals.includes("Scale operations")) {
      scenarios.push({
        title: "Scale Without Hiring",
        description: `How ${company} can 3x capacity with the same team`,
        icon: Users,
        steps: [
          { action: "AI handles routine work", result: "Team focuses on high-value tasks", metric: "68% time freed" },
          { action: "24/7 automated processing", result: "Work progresses overnight", metric: "3x throughput" },
          { action: "Smart prioritization", result: "Critical items surface automatically", metric: "Zero missed deadlines" },
        ]
      });
    }

    if (painPoints.includes("Slow payments") || goals.includes("Improve cash flow")) {
      scenarios.push({
        title: "Accelerate Cash Flow",
        description: `Reduce ${company}'s payment cycles by 40%`,
        icon: DollarSign,
        steps: [
          { action: "Auto-generate invoices", result: "Created from project milestones", metric: "Same-day invoicing" },
          { action: "Smart reminders", result: "Personalized follow-ups based on history", metric: "45% faster payment" },
          { action: "Payment prediction", result: "AI forecasts collection timing", metric: "94% accuracy" },
        ]
      });
    }

    if (painPoints.includes("compliance_risk") || industry === "construction") {
      scenarios.push({
        title: "Ensure Compliance",
        description: `Keep ${company} audit-ready with zero effort`,
        icon: Shield,
        steps: [
          { action: "Continuous monitoring", result: "All actions logged automatically", metric: "100% audit trail" },
          { action: "Risk detection", result: "Issues flagged before they escalate", metric: "Real-time alerts" },
          { action: "Report generation", result: "Compliance reports in one click", metric: "5 hours → 5 min" },
        ]
      });
    }

    // Default scenario if none match
    if (scenarios.length === 0) {
      scenarios.push({
        title: "Transform Your Workflow",
        description: `A personalized automation journey for ${company}`,
        icon: Zap,
        steps: [
          { action: "Connect your tools", result: "Seamless integration with your stack", metric: "One-time setup" },
          { action: "AI learns your processes", result: "Custom automation suggestions", metric: "Week 1" },
          { action: "Measurable results", result: "Track ROI in real-time", metric: "30-day impact" },
        ]
      });
    }

    return scenarios;
  };

  const scenarios = generateContextualScenarios();

  useEffect(() => {
    // Initial welcome message
    const welcomeMessage: Message = {
      role: "assistant",
      content: `👋 Welcome! I've created a personalized demo for **${company}** based on your ${industry} industry needs.\n\nI noticed you're facing challenges with ${painPoints.slice(0, 2).join(" and ")}. Let me show you how alfred ai can help.\n\n**Choose a scenario to explore:**`,
    };
    setMessages([welcomeMessage]);
  }, [company, industry, painPoints]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, scenarioStep]);

  const runScenario = async (scenario: DemoScenario) => {
    setCurrentScenario(scenario);
    setScenarioStep(0);
    setIsAnimatingScenario(true);

    // Add user selection message
    setMessages(prev => [...prev, {
      role: "user" as const,
      content: `Show me: ${scenario.title}`
    }]);

    // Add AI intro
    setMessages(prev => [...prev, {
      role: "assistant" as const,
      content: `Great choice! Let me walk you through **${scenario.title}**...\n\n${scenario.description}`,
      scenario
    }]);

    // Animate through steps
    for (let i = 0; i < scenario.steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setScenarioStep(i + 1);
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Completion message
    setMessages(prev => [...prev, {
      role: "assistant" as const,
      content: `✅ That's how ${company} could transform this process!\n\nWant to see another scenario, or ready to discuss implementation?`
    }]);

    setIsAnimatingScenario(false);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      // Build conversation history for the AI
      const conversationMessages = messages
        .filter(m => m.content)
        .map(m => ({
          role: m.role,
          content: m.content
        }));
      
      // Add current user message
      conversationMessages.push({ role: "user" as const, content: userMessage });
      
      // Add context as a system-like prefix to the first message
      const contextPrefix = `Context: Company "${company}" in ${industry} industry. Team size: ${teamSize}. Pain points: ${painPoints.join(", ")}. Goals: ${goals.join(", ")}. This is a personalized demo conversation.\n\n`;
      if (conversationMessages.length > 0 && conversationMessages[0].role === "assistant") {
        conversationMessages[0] = {
          ...conversationMessages[0],
          content: contextPrefix + conversationMessages[0].content
        };
      }
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/alfred-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            messages: conversationMessages
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get response");
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");
          
          for (const line of lines) {
            if (line.startsWith("data: ") && line !== "data: [DONE]") {
              try {
                const json = JSON.parse(line.slice(6));
                const content = json.choices?.[0]?.delta?.content;
                if (content) {
                  fullContent += content;
                }
              } catch {
                // Skip malformed JSON
              }
            }
          }
        }
      }

      setMessages(prev => [...prev, {
        role: "assistant",
        content: fullContent || "I'd be happy to help you explore more. Would you like to see a specific demo or discuss implementation?"
      }]);
    } catch (error) {
      console.error("Error:", error);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "I'd be happy to discuss that further. Would you like to book an Impact Conversation with our team for a deeper dive?"
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
      <CardHeader className="border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              Your Personalized Demo
              <Badge variant="secondary" className="font-normal">
                <Sparkles className="w-3 h-3 mr-1" />
                AI-Powered
              </Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground">Tailored for {company}</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Messages Area */}
        <div className="h-[400px] overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div className={cn(
                "max-w-[85%] rounded-2xl px-4 py-3",
                message.role === "user" 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted"
              )}>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                
                {/* Scenario Visualization */}
                {message.scenario && (
                  <div className="mt-4 space-y-3">
                    {message.scenario.steps.map((step, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ 
                          opacity: i < scenarioStep ? 1 : 0.3,
                          x: 0 
                        }}
                        transition={{ delay: i * 0.3 }}
                        className={cn(
                          "flex items-start gap-3 p-3 rounded-lg transition-all",
                          i < scenarioStep ? "bg-background/80" : "bg-background/30"
                        )}
                      >
                        <div className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center shrink-0",
                          i < scenarioStep ? "bg-green-500" : "bg-muted"
                        )}>
                          {i < scenarioStep ? (
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          ) : (
                            <span className="text-xs font-medium">{i + 1}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{step.action}</p>
                          <p className="text-xs text-muted-foreground">{step.result}</p>
                        </div>
                        {step.metric && i < scenarioStep && (
                          <Badge variant="outline" className="shrink-0 text-xs bg-green-500/10 text-green-600 border-green-500/20">
                            {step.metric}
                          </Badge>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {/* Scenario Selection Buttons */}
          {messages.length === 1 && (
            <div className="grid gap-2 mt-4">
              {scenarios.map((scenario, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => runScenario(scenario)}
                  disabled={isAnimatingScenario}
                  className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:bg-muted/50 hover:border-primary/30 transition-all text-left group"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <scenario.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{scenario.title}</p>
                    <p className="text-xs text-muted-foreground">{scenario.description}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </motion.button>
              ))}
            </div>
          )}

          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Thinking...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-border p-4">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about specific workflows, integrations, or ROI..."
              className="flex-1 px-4 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
              disabled={isLoading || isAnimatingScenario}
            />
            <Button 
              type="submit" 
              size="icon"
              disabled={isLoading || isAnimatingScenario || !inputValue.trim()}
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}

export default CustomizedInteractiveDemo;
