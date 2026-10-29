import { useState, useRef, useEffect, useCallback } from "react";
import { useDemoSpeed } from "@/contexts/DemoSpeedContext";
import { InlineDemoSpeedControl } from "@/components/demos/shared/InlineDemoSpeedControl";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import { 
  Building2, 
  Phone, 
  MessageSquare, 
  Calendar, 
  Wrench,
  DollarSign,
  FileText,
  AlertTriangle,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  Mic,
  Play,
  ChevronRight,
  Shield,
  Zap,
  TrendingUp,
  Home,
  Key,
  ClipboardList,
  PhoneOff,
  Volume2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DragScrollArea } from "@/components/ui/drag-scroll-area";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useConversation } from "@elevenlabs/react";

type Workflow = {
  id: string;
  title: string;
  shortTitle: string;
  icon: typeof Building2;
  description: string;
  steps: string[];
  kpis: string[];
  color: string;
};

const workflows: Workflow[] = [
  {
    id: "leasing",
    title: "Leasing Enquiry → Inspection Booking",
    shortTitle: "Leasing",
    icon: Key,
    description: "Turn every enquiry into a booked inspection and qualified lead",
    steps: [
      "Detect intent: \"I'm calling about 12 Smith Street\"",
      "Identify listing from database",
      "Capture details: name, mobile, budget, pets",
      "Explain inspection options",
      "Book slot → Calendar + CRM",
      "Send SMS/email confirmation",
      "Auto follow-ups: T-24h, T-2h, T+2h"
    ],
    kpis: ["Call-to-inspection rate", "No-show rate", "Applications per inspection"],
    color: "from-blue-500/20 to-cyan-500/10"
  },
  {
    id: "maintenance",
    title: "Tenant Maintenance Triage → Work Order",
    shortTitle: "Maintenance",
    icon: Wrench,
    description: "Classify, triage, and dispatch with photos and approvals",
    steps: [
      "Verify tenancy via OTP",
      "Capture issue description",
      "Classify: plumbing, electrical, appliance, pests",
      "Safety check: urgent → emergency steps",
      "Collect photos via SMS link",
      "Check warranty & cost caps",
      "Dispatch to preferred vendor"
    ],
    kpis: ["First contact resolution", "Time to dispatch", "Repeat call rate"],
    color: "from-orange-500/20 to-amber-500/10"
  },
  {
    id: "arrears",
    title: "Arrears Management Outbound",
    shortTitle: "Arrears",
    icon: DollarSign,
    description: "Reduce days in arrears with respectful, consistent contact",
    steps: [
      "Pull daily arrears list by segment",
      "Call with segment-specific script",
      "Confirm amount due and reason",
      "Offer payment options",
      "Send payment link via SMS",
      "Log result and follow-up date",
      "Escalate if broken promise"
    ],
    kpis: ["Collections rate", "Broken promise rate", "Calls per recovery"],
    color: "from-red-500/20 to-rose-500/10"
  },
  {
    id: "renewals",
    title: "Lease Renewal & Rent Review",
    shortTitle: "Renewals",
    icon: FileText,
    description: "Keep good tenants, adjust rent fairly, reduce vacancy",
    steps: [
      "90 days before: pull eligible tenancies",
      "Auto market rent comparison",
      "Call owner for approval",
      "Call tenant: discuss term, rent, pets",
      "Generate renewal docs",
      "Send e-sign request",
      "Update lease and rent records"
    ],
    kpis: ["Renewal acceptance rate", "Average rent uplift", "Days vacant avoided"],
    color: "from-green-500/20 to-emerald-500/10"
  },
  {
    id: "emergency",
    title: "After-Hours Emergency Triage",
    shortTitle: "Emergency",
    icon: AlertTriangle,
    description: "Protect safety and property while controlling cost",
    steps: [
      "Confirm immediate danger",
      "Verify tenancy and address",
      "Classify: burst pipe, power, security, gas",
      "Guide mitigation steps",
      "Dispatch on-call vendor",
      "Notify owner via SMS",
      "Handover to PM next day"
    ],
    kpis: ["Response time", "Damage avoided", "After-hours volume"],
    color: "from-yellow-500/20 to-orange-500/10"
  },
  {
    id: "vacate",
    title: "Vacate Notice & Bond Process",
    shortTitle: "Vacate",
    icon: Home,
    description: "Make move-outs predictable and fast",
    steps: [
      "Receive vacate intent",
      "Confirm notice period",
      "Send vacate checklist",
      "Offer preferred cleaners",
      "Schedule final inspection",
      "Collect forwarding details",
      "Process bond claim"
    ],
    kpis: ["Days to relet", "Bond dispute rate", "Make-ready time"],
    color: "from-purple-500/20 to-violet-500/10"
  },
  {
    id: "owner",
    title: "Owner Update & Approvals",
    shortTitle: "Owner Updates",
    icon: Users,
    description: "Keep landlords informed and approvals quick",
    steps: [
      "Weekly/monthly call batch",
      "Read dynamic brief",
      "Present approval items",
      "Record decisions",
      "Send summary via SMS/email",
      "Log to owner portal",
      "Track satisfaction score"
    ],
    kpis: ["Owner CSAT", "Approval turnaround", "Churn rate"],
    color: "from-indigo-500/20 to-blue-500/10"
  }
];

const packages = [
  {
    name: "SP-Entry",
    title: "Leasing & Maintenance Frontline",
    price: "$250-500/mo",
    setup: "$5k setup",
    workflows: ["leasing", "maintenance", "emergency"],
    roi: "1 extra leased property = $2k+ annual fees",
    color: "border-blue-500/30 bg-blue-500/5"
  },
  {
    name: "SP-Mid",
    title: "Rent Roll Growth & Arrears Control",
    price: "$990-1,500/mo",
    setup: "$15k setup",
    workflows: ["arrears", "renewals", "vacate"],
    roi: "Reduces arrears days, 3-7% rent uplift",
    color: "border-green-500/30 bg-green-500/5"
  },
  {
    name: "SP-Full Suite",
    title: "AI Property Manager Co-Pilot",
    price: "$2,000+/mo",
    setup: "$30-50k setup",
    workflows: ["leasing", "maintenance", "arrears", "renewals", "emergency", "vacate", "owner"],
    roi: "Handle 30-50% more properties per PM",
    color: "border-purple-500/30 bg-purple-500/5"
  }
];

const integrations = [
  "PropertyMe", "Property Tree", "Console Cloud", "Stripe", "Ezidebit", "Calendar"
];

type SimulationStep = {
  speaker: "agent" | "caller";
  text: string;
  action?: string;
};

const leasingSimulation: SimulationStep[] = [
  { speaker: "agent", text: "Good morning, Acme Properties. How can I help you today?" },
  { speaker: "caller", text: "Hi, I'm calling about 12 Smith Street." },
  { speaker: "agent", text: "I found that listing. It's a 3-bedroom at $650/week. Can I get your name?", action: "Matched listing in database" },
  { speaker: "caller", text: "Sarah Johnson." },
  { speaker: "agent", text: "Thanks Sarah. What's your ideal move-in date and budget?" },
  { speaker: "caller", text: "Looking to move mid-January, budget around $650." },
  { speaker: "agent", text: "Perfect match! We have an open inspection Saturday 10am. Shall I book you in?", action: "Checking calendar availability" },
  { speaker: "caller", text: "Yes please!" },
  { speaker: "agent", text: "Done! I'll send confirmation to your mobile. What's the best number?", action: "Created inspection booking" },
];

export default function PropertyManagementDemo() {
  const { applySpeed } = useDemoSpeed();
  const [activeTab, setActiveTab] = useState("workflows");
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow>(workflows[0]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationStep, setSimulationStep] = useState(0);
  const [showSimulation, setShowSimulation] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const tabOrder = ["workflows", "simulation", "packages"];
  const { handleTouchStart, handleTouchMove, handleTouchEnd } = useSwipeNavigation({
    items: tabOrder,
    activeItem: activeTab,
    onNavigate: setActiveTab,
  });
  
  // Voice agent state
  const [isConnecting, setIsConnecting] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState<{ role: string; text: string }[]>([]);

  const conversation = useConversation({
    onConnect: () => {
      console.log("Connected to property management voice agent");
      toast.success("Voice agent connected. Start speaking!");
    },
    onDisconnect: () => {
      console.log("Disconnected from property management agent");
      toast.info("Voice conversation ended.");
      setIsConnecting(false);
    },
    onMessage: (message: any) => {
      console.log("Message received:", message);
      if (message.type === "user_transcript") {
        const userText = message.user_transcription_event?.user_transcript;
        if (userText) {
          setVoiceTranscript(prev => [...prev, { role: "user", text: userText }]);
        }
      } else if (message.type === "agent_response") {
        const agentText = message.agent_response_event?.agent_response;
        if (agentText) {
          setVoiceTranscript(prev => [...prev, { role: "agent", text: agentText }]);
        }
      }
    },
    onError: (error) => {
      console.error("Property Management Voice Agent error:", error);
      toast.error("Failed to connect to voice agent. Please try again.");
      setIsConnecting(false);
    },
  });

  const startVoiceDemo = useCallback(async () => {
    setIsConnecting(true);
    setVoiceTranscript([]);

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Get signed URL from edge function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-conversation-token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ agentId: "agent_8901kddr226wfb0bve51yw13z34s" }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.signed_url) {
        throw new Error(data.error || "Failed to get conversation token");
      }

      // Start the conversation with WebSocket
      await conversation.startSession({
        signedUrl: data.signed_url,
      });

    } catch (error) {
      console.error("Failed to start property voice conversation:", error);
      toast.error(error instanceof Error ? error.message : "Could not start voice conversation.");
      setIsConnecting(false);
    }
  }, [conversation]);

  const stopVoiceDemo = useCallback(async () => {
    await conversation.endSession();
    setIsConnecting(false);
  }, [conversation]);

  const isVoiceConnected = conversation.status === "connected";

  // Store conversation ref for cleanup
  const conversationRef = useRef(conversation);
  conversationRef.current = conversation;

  // Cleanup interval on unmount only
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      // Cleanup voice connection on unmount
      if (conversationRef.current.status === "connected") {
        conversationRef.current.endSession();
      }
    };
  }, []); // Empty deps - only run on unmount

  const startSimulation = useCallback(() => {
    // Clear any existing interval first
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    setShowSimulation(true);
    setIsSimulating(true);
    setSimulationStep(0);
    
    intervalRef.current = setInterval(() => {
      setSimulationStep(prev => {
        if (prev >= leasingSimulation.length - 1) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setIsSimulating(false);
          return prev;
        }
        return prev + 1;
      });
    }, applySpeed(2000));
  }, []);

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden max-h-[80vh] overflow-y-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 px-6 py-4 border-b border-border sticky top-0 z-10 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-indigo-500" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Property Management Voice Agent</h3>
            <p className="text-xs text-muted-foreground">End-to-end AI automation for property managers</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => {
          // Stop voice demo when leaving the Live Demo tab
          if (activeTab === "simulation" && value !== "simulation" && conversation.status === "connected") {
            stopVoiceDemo();
          }
          setActiveTab(value);
        }} className="w-full">
        <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent p-0">
          <TabsTrigger value="workflows" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 text-xs">
            Workflows
          </TabsTrigger>
          <TabsTrigger value="simulation" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 text-xs">
            Live Demo
          </TabsTrigger>
          <TabsTrigger value="packages" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 text-xs">
            Packages
          </TabsTrigger>
        </TabsList>

        {/* Workflows Tab */}
        <TabsContent 
          value="workflows" 
          className="p-4 space-y-4 mt-0 min-h-[400px]"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Workflow Selector */}
          <DragScrollArea contentClassName="pb-2">
            <div className="flex gap-1.5">
              {workflows.map((wf) => (
                <button
                  key={wf.id}
                  onClick={() => setSelectedWorkflow(wf)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5",
                    selectedWorkflow.id === wf.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  <wf.icon className="w-3 h-3" />
                  {wf.shortTitle}
                </button>
              ))}
            </div>
          </DragScrollArea>

          {/* Selected Workflow Details */}
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedWorkflow.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className={cn("p-4 rounded-xl bg-gradient-to-br", selectedWorkflow.color)}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-background/50 flex items-center justify-center">
                    <selectedWorkflow.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-foreground">{selectedWorkflow.title}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{selectedWorkflow.description}</p>
                  </div>
                </div>
              </div>

              {/* Steps */}
              <div className="space-y-2">
                <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Workflow Steps</h5>
                <div className="space-y-1.5">
                  {selectedWorkflow.steps.map((step, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-start gap-2 p-2 rounded-lg bg-muted/50"
                    >
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[10px] font-medium text-primary">{idx + 1}</span>
                      </div>
                      <span className="text-xs text-foreground">{step}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* KPIs */}
              <div className="flex gap-2 flex-wrap">
                {selectedWorkflow.kpis.map((kpi, idx) => (
                  <Badge key={idx} variant="secondary" className="text-[10px]">
                    <TrendingUp className="w-2.5 h-2.5 mr-1" />
                    {kpi}
                  </Badge>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Integrations */}
          <div className="pt-3 border-t border-border">
            <h5 className="text-xs font-medium text-muted-foreground mb-2">Integrated Systems</h5>
            <div className="flex gap-2 flex-wrap">
              {integrations.map((int, idx) => (
                <Badge key={idx} variant="outline" className="text-[10px]">
                  {int}
                </Badge>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Live Demo Tab - Voice Agent */}
        <TabsContent 
          value="simulation" 
          className="p-4 space-y-4 mt-0 min-h-[400px]"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="text-center space-y-3">
            <motion.div 
              className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center mx-auto",
                isVoiceConnected 
                  ? "bg-green-500/20" 
                  : "bg-gradient-to-br from-indigo-500/20 to-purple-500/20"
              )}
              animate={isVoiceConnected || isConnecting ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {isVoiceConnected ? (
                conversation.isSpeaking ? (
                  <Volume2 className="w-7 h-7 text-green-500" />
                ) : (
                  <Mic className="w-7 h-7 text-green-500" />
                )
              ) : (
                <Phone className="w-7 h-7 text-indigo-500" />
              )}
            </motion.div>
            <div>
              <h4 className="font-semibold text-foreground">Property Management Voice Agent</h4>
              <p className="text-xs text-muted-foreground">
                {isVoiceConnected 
                  ? (conversation.isSpeaking ? "Agent speaking..." : "Listening — speak now")
                  : isConnecting 
                    ? "Connecting to voice agent..."
                    : "Talk to our AI property management agent"}
              </p>
            </div>
            
            {!isVoiceConnected ? (
              <Button 
                onClick={startVoiceDemo} 
                disabled={isConnecting}
                className="gap-2"
              >
                {isConnecting ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Mic className="w-4 h-4" />
                    </motion.div>
                    Connecting...
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4" />
                    Start Live Demo
                  </>
                )}
              </Button>
            ) : (
              <Button 
                onClick={stopVoiceDemo} 
                variant="destructive"
                className="gap-2"
              >
                <PhoneOff className="w-4 h-4" />
                End Demo
              </Button>
            )}
          </div>

          {/* Voice Transcript */}
          {voiceTranscript.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3 max-h-[250px] overflow-y-auto bg-muted/30 rounded-xl p-3"
            >
              <h5 className="text-xs font-medium text-muted-foreground">Live Transcript</h5>
              {voiceTranscript.map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: item.role === "user" ? 10 : -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn(
                    "flex gap-2",
                    item.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div className={cn(
                    "max-w-[80%] p-2.5 rounded-xl text-xs",
                    item.role === "user" 
                      ? "bg-primary text-primary-foreground rounded-tr-sm" 
                      : "bg-background border border-border rounded-tl-sm"
                  )}>
                    <div className="flex items-center gap-1.5 mb-1">
                      {item.role === "user" ? (
                        <Phone className="w-3 h-3" />
                      ) : (
                        <Mic className="w-3 h-3" />
                      )}
                      <span className="text-[10px] font-medium opacity-70 uppercase">
                        {item.role === "user" ? "You" : "AI Agent"}
                      </span>
                    </div>
                    {item.text}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Microphone activity indicator */}
          {isVoiceConnected && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-center pt-2"
            >
              <div className="flex gap-1 items-center">
                {[0, 1, 2, 3, 4].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1 bg-primary rounded-full"
                    animate={{
                      height: conversation.isSpeaking 
                        ? [8, 20, 8] 
                        : [4, 8, 4]
                    }}
                    transition={{
                      duration: 0.4,
                      repeat: Infinity,
                      delay: i * 0.1,
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </TabsContent>

        {/* Packages Tab */}
        <TabsContent 
          value="packages" 
          className="p-4 space-y-3 mt-0 min-h-[400px]"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {packages.map((pkg, idx) => (
            <motion.div
              key={pkg.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={cn("p-4 rounded-xl border", pkg.color)}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <Badge variant="secondary" className="text-[10px] mb-1">{pkg.name}</Badge>
                  <h4 className="font-semibold text-sm text-foreground">{pkg.title}</h4>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-primary tabular-nums">{pkg.price}</div>
                  <div className="text-[10px] text-muted-foreground">{pkg.setup}</div>
                </div>
              </div>

              <div className="flex gap-1 flex-wrap mb-2">
                {pkg.workflows.map((wfId) => {
                  const wf = workflows.find(w => w.id === wfId);
                  if (!wf) return null;
                  return (
                    <Badge key={wfId} variant="outline" className="text-[10px]">
                      <wf.icon className="w-2.5 h-2.5 mr-1" />
                      {wf.shortTitle}
                    </Badge>
                  );
                })}
              </div>

              <div className="flex items-center gap-1 text-[10px] text-green-600 dark:text-green-400">
                <TrendingUp className="w-3 h-3" />
                {pkg.roi}
              </div>
            </motion.div>
          ))}

          {/* ROI Summary */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20">
            <h5 className="font-semibold text-sm text-foreground mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              ROI Summary
            </h5>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5" />
                Extra leasing conversions = $2k+/year per property
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5" />
                Reduced arrears = better owner cash flow
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5" />
                Faster turnovers = save 1-2 weeks' rent
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5" />
                Payback: 1-2 months (100-200 doors)
              </li>
            </ul>
          </div>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="px-4 py-3 bg-muted/30 border-t border-border flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">Compliant • Secure • 24/7</span>
        </div>
        <Button 
          variant="link" 
          size="sm" 
          className="text-xs h-auto p-0"
          onClick={() => toast.info("Demo Mode", { description: "In production, this would open a booking calendar to schedule a personalized demo." })}
        >
          Book an Impact Conversation →
        </Button>
      </div>
    </div>
  );
}