import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import { 
  Mail, 
  FileText, 
  Send,
  Calendar,
  Users,
  FolderOpen,
  FileDown,
  Globe,
  Edit,
  CheckCircle2,
  Clock,
  ArrowRight,
  Play,
  Bell,
  Eye,
  MessageSquare,
  CreditCard,
  Lock,
  Link2,
  Zap,
  Building2,
  BarChart3,
  Upload,
  Download,
  Sparkles,
  Bot,
  ChevronDown,
  ChevronUp,
  FileType,
  ExternalLink,
  Check,
  DollarSign,
  Briefcase,
  PenTool,
  ShieldCheck,
  Fingerprint,
  RotateCcw,
  Palette
} from "lucide-react";
import { DemoMarkdown } from "./DemoMarkdown";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useChatContext } from "@/contexts/ChatContext";

// Color palette definitions
type ColorPalette = {
  id: string;
  name: string;
  primary: string;
  primaryLight: string;
  primaryGradientFrom: string;
  primaryGradientTo: string;
  accent: string;
  accentLight: string;
  headerBg: string;
  headerBorder: string;
  textPrimary: string;
  textSecondary: string;
};

const colorPalettes: ColorPalette[] = [
  {
    id: "corporate",
    name: "Corporate Blue",
    primary: "#1e40af",
    primaryLight: "#3b82f6",
    primaryGradientFrom: "#1e3a8a",
    primaryGradientTo: "#3b82f6",
    accent: "#0ea5e9",
    accentLight: "#e0f2fe",
    headerBg: "#f8fafc",
    headerBorder: "#1e40af",
    textPrimary: "#0f172a",
    textSecondary: "#475569",
  },
  {
    id: "elegant",
    name: "Elegant Emerald",
    primary: "#047857",
    primaryLight: "#10b981",
    primaryGradientFrom: "#064e3b",
    primaryGradientTo: "#10b981",
    accent: "#14b8a6",
    accentLight: "#d1fae5",
    headerBg: "#f0fdf4",
    headerBorder: "#047857",
    textPrimary: "#022c22",
    textSecondary: "#4b5563",
  },
  {
    id: "modern",
    name: "Modern Violet",
    primary: "#7c3aed",
    primaryLight: "#a78bfa",
    primaryGradientFrom: "#5b21b6",
    primaryGradientTo: "#a78bfa",
    accent: "#8b5cf6",
    accentLight: "#ede9fe",
    headerBg: "#faf5ff",
    headerBorder: "#7c3aed",
    textPrimary: "#1e1b4b",
    textSecondary: "#6b7280",
  },
];

type WorkflowStep = {
  id: string;
  step: string;
  title: string;
  icon: typeof Mail;
  description: string;
  details: string[];
  color: string;
};

const workflowSteps: WorkflowStep[] = [
  {
    id: "receive",
    step: "1",
    title: "Receive Incoming Email",
    icon: Mail,
    description: "Email arrives and contact is verified/added to CRM",
    details: [
      "Check sender in company address book",
      "Auto-add new contacts to EDM & CRM",
      "Scan for matching title and phone number"
    ],
    color: "from-blue-500/20 to-cyan-500/10"
  },
  {
    id: "acknowledge",
    step: "2",
    title: "Draft Acknowledgement Reply",
    icon: Send,
    description: "Bot generates reply and creates calendar reminder",
    details: [
      "Generate acknowledgement email",
      "User reviews and sends",
      "Create due date reminder (24h notification)"
    ],
    color: "from-green-500/20 to-emerald-500/10"
  },
  {
    id: "suggest",
    step: "3",
    title: "Suggest Next Actions",
    icon: Sparkles,
    description: "AI recommends team, templates, and past proposals",
    details: [
      "Recommend team member for similar projects",
      "Suggest past fee proposals as templates",
      "Pre-drafted prompt ready for alfred ai",
      "API connect to Zoom, Read.ai, Fathom"
    ],
    color: "from-purple-500/20 to-violet-500/10"
  },
  {
    id: "crm",
    step: "4",
    title: "CRM / PPM Integration",
    icon: Building2,
    description: "Push data to CRM and create project folders",
    details: [
      "Create new project record in Accountable.link",
      "Populate key project details",
      "Create folder on ShareDrive/Dropbox/GDrive"
    ],
    color: "from-orange-500/20 to-amber-500/10"
  },
  {
    id: "generate",
    step: "5",
    title: "Proposal Draft Generation",
    icon: FileText,
    description: "Generate PDF and interactive webpage proposal",
    details: [
      "Generate branded PDF version",
      "Create interactive webpage URL",
      "Switchable edit/preview mode"
    ],
    color: "from-pink-500/20 to-rose-500/10"
  },
  {
    id: "edit",
    step: "6",
    title: "Editing & Approval",
    icon: Edit,
    description: "Review, edit and publish the proposal",
    details: [
      "User reviews webpage content",
      "Edit sections as needed",
      "Confirm for final publish"
    ],
    color: "from-indigo-500/20 to-blue-500/10"
  },
  {
    id: "send",
    step: "7",
    title: "Client Proposal Email",
    icon: Mail,
    description: "Draft client email with proposal links",
    details: [
      "Include webpage link",
      "Attach PDF download",
      "User reviews and sends"
    ],
    color: "from-teal-500/20 to-cyan-500/10"
  },
  {
    id: "track",
    step: "8",
    title: "Logging & Status Update",
    icon: BarChart3,
    description: "Track opens, clicks, and update CRM status",
    details: [
      "Bot BCC'd for tracking",
      "CRM updated to 'Proposal Sent'",
      "Track opens, time spent, hovers"
    ],
    color: "from-yellow-500/20 to-orange-500/10"
  },
  {
    id: "access",
    step: "9",
    title: "Access Controls",
    icon: Lock,
    description: "Smart access control after 3 views",
    details: [
      "First 3 clicks: no check",
      "After: email popup for verification",
      "Domain verified, session link sent"
    ],
    color: "from-red-500/20 to-rose-500/10"
  },
  {
    id: "comment",
    step: "10",
    title: "Stakeholder Commenting",
    icon: MessageSquare,
    description: "Figma-style commenting with approval workflow",
    details: [
      "In-page commenting (like Figma)",
      "Agree/Negotiate options per comment",
      "History trail with timestamps",
      "Notifications on new comments"
    ],
    color: "from-violet-500/20 to-purple-500/10"
  }
];

const integrations = [
  { name: "Gmail", category: "Email" },
  { name: "Outlook", category: "Email" },
  { name: "Dropbox", category: "Storage" },
  { name: "Google Drive", category: "Storage" },
  { name: "OneDrive", category: "Storage" },
  { name: "HubSpot", category: "CRM" },
  { name: "Accountable.link", category: "PPM" },
  { name: "Xero", category: "Accounting" },
  { name: "QuickBooks", category: "Accounting" },
  { name: "Qwilr", category: "Proposals" },
  { name: "DocuSign", category: "Signatures" },
  { name: "n8n", category: "Automation" },
];

const proposalSections = [
  "Header with PDF download",
  "Expandable cover page",
  "Interactive single-page proposal",
  "Project info & scope",
  "Team introduction",
  "Past success projects",
  "Fee + schedule",
  "Payment details",
  "Terms & conditions",
  "Acceptance form",
  "Signatures"
];

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  action?: string;
  attachments?: string[];
  workflowStep?: string;
};

const demoConversation: ChatMessage[] = [
  // Step 1: Receive Incoming Email
  {
    role: "assistant",
    content: "📧 New email received from sarah.chen@acmecorp.com\n\nSubject: Request for Proposal - Office Fitout Project\n\nI've checked the address book - this is a new contact. Adding to CRM and EDM platform now.",
    action: "Step 1: Contact added to CRM",
    workflowStep: "receive"
  },
  // Step 2: Draft Acknowledgement Reply
  {
    role: "user",
    content: "Draft an acknowledgement reply"
  },
  {
    role: "assistant",
    content: "Draft ready:\n\n\"Dear Sarah,\n\nThank you for reaching out regarding the Office Fitout Project. We've received your request and will prepare a detailed proposal.\n\nExpected delivery: Within 5 business days.\n\nBest regards,\n[Your Name]\"\n\n📅 Calendar reminder set for due date with 24h notification.",
    action: "Step 2: Draft created • Reminder set",
    attachments: ["email_draft.eml", "calendar_event.ics"],
    workflowStep: "acknowledge"
  },
  // Step 3: Suggest Next Actions
  {
    role: "user",
    content: "What similar projects do we have?"
  },
  {
    role: "assistant",
    content: "Found 3 similar past projects:\n\n1️⃣ **TechHub Office Fitout** (2024)\n   • Lead: James Wilson\n   • Fee: $45,000\n   • 92% match\n\n2️⃣ **Creative Space Renovation** (2023)\n   • Lead: Emma Thompson\n   • Fee: $38,500\n   • 78% match\n\n3️⃣ **StartUp Campus Design** (2024)\n   • Lead: James Wilson\n   • Fee: $52,000\n   • 71% match\n\n💡 Recommend: James Wilson as project lead\n📎 TechHub proposal template attached\n🎙️ API connected to Zoom/Read.ai for meeting notes",
    action: "Step 3: AI recommendations ready",
    workflowStep: "suggest"
  },
  // Step 4: CRM / PPM Integration
  {
    role: "user",
    content: "Use the TechHub template and set up the project"
  },
  {
    role: "assistant",
    content: "Setting up project infrastructure...\n\n✅ CRM Record: Created in Accountable.link\n   • Project: ACME Office Fitout\n   • Client: ACME Corp\n   • Contact: Jane Smith\n   • Stage: Proposal\n\n✅ Project Folder: Created in Google Drive\n   📁 /Clients/ACME Corp/Office Fitout 2024\n   └── 📁 Proposal Documents\n   └── 📁 Client Communications\n   └── 📁 Reference Materials\n\nReady to generate proposal!",
    action: "Step 4: CRM & folders created",
    workflowStep: "crm"
  },
  // Step 5: Proposal Draft Generation
  {
    role: "user",
    content: "Generate the proposal"
  },
  {
    role: "assistant",
    content: "Generating proposal from TechHub template...\n\n✅ PDF Generated: ACME_Office_Fitout_Proposal_v1.pdf\n✅ Webpage Created: proposals.yourcompany.com/acme-fitout\n\n📄 Proposal includes:\n• Cover page with branding\n• Project scope & timeline\n• Team introductions\n• 3 past success projects\n• Fee breakdown: $47,500\n• Payment schedule\n• T&Cs + acceptance form",
    action: "Step 5: Proposal generated",
    attachments: ["ACME_Proposal.pdf", "proposal_link.url"],
    workflowStep: "generate"
  },
  // Step 6: Editing & Approval
  {
    role: "user",
    content: "Let me review and edit the proposal"
  },
  {
    role: "assistant",
    content: "🔄 Proposal now in EDIT MODE\n\nYou can:\n• Click any text to edit inline\n• Drag sections to reorder\n• Toggle between Edit/Preview modes\n• Adjust fee amounts directly\n\n📝 Current editable sections:\n1. Executive Summary ✏️\n2. Scope of Work ✏️\n3. Timeline & Milestones ✏️\n4. Fee Schedule ✏️\n5. Terms & Conditions ✏️\n\nClick 'Publish' when ready to finalize.",
    action: "Step 6: Edit mode active",
    workflowStep: "edit"
  },
  // Step 7: Client Proposal Email
  {
    role: "user",
    content: "Looks good! Send to client"
  },
  {
    role: "assistant",
    content: "Client email draft ready:\n\n\"Dear Sarah,\n\nPlease find our proposal for the Office Fitout Project:\n\n📄 View Online: proposals.yourcompany.com/acme-fitout\n📎 Download PDF: [Attached]\n\nWe look forward to discussing this with you.\n\nBest regards\"\n\n📨 Ready to send with tracking enabled",
    action: "Step 7: Email drafted",
    attachments: ["client_email.eml"],
    workflowStep: "send"
  },
  // Step 8: Logging & Status Update
  {
    role: "user",
    content: "Send it now"
  },
  {
    role: "assistant",
    content: "✅ Email sent successfully!\n\n📊 Tracking activated:\n• BCC'd to bot for logging\n• CRM status → 'Proposal Sent'\n• Follow-up reminder: 3 days\n\n📈 Analytics dashboard ready:\n• Open notifications: ON\n• Time spent tracking: ON\n• Section hover tracking: ON\n• PDF download alerts: ON",
    action: "Step 8: Tracking active",
    workflowStep: "track"
  },
  // Step 9: Access Controls (simulated client activity)
  {
    role: "assistant",
    content: "🔔 Activity Alert!\n\nJane Smith just opened the proposal:\n• Views: 1 of 3 (no verification needed)\n• Time spent: 4m 32s\n• Sections viewed: All\n• PDF downloaded: Yes\n\n🔒 Access Control Status:\n• Next 2 views: No email required\n• After 3 views: Email verification popup\n• Domain verification: acmecorp.com whitelisted",
    action: "Step 9: Access control active",
    workflowStep: "access"
  },
  // Step 10: Stakeholder Commenting
  {
    role: "assistant",
    content: "💬 New Comment from Jane Smith!\n\nOn Section: Fee Schedule\n\"Can we discuss the payment terms? We typically do 30/30/40 instead of 50/50.\"\n\n🎯 Quick Actions:\n• ✅ Agree - Accept change request\n• 🤝 Negotiate - Propose alternative\n• 💬 Reply - Add comment\n\n📜 Comment History:\n• Jane Smith (2m ago): Payment terms query\n• Thread status: Awaiting response",
    action: "Step 10: Comment received",
    workflowStep: "comment"
  },
  {
    role: "user",
    content: "Propose a counter offer of 40/30/30"
  },
  {
    role: "assistant",
    content: "✅ Counter-proposal sent!\n\nReply to Sarah:\n\"Hi Sarah, we can offer 40/30/30 payment terms:\n• 40% upon acceptance\n• 30% at midpoint\n• 30% on completion\n\nWould this work for you?\"\n\n📊 Proposal Status:\n• Comments: 1 thread (pending)\n• CRM: Updated to 'In Negotiation'\n• Next: Awaiting client response\n\n🎉 Full workflow demonstration complete!\nAll 10 steps covered: Email → CRM → Proposal → Tracking → Commenting",
    action: "Workflow Complete!",
    workflowStep: "comment"
  }
];

export default function FeeProposalDemo() {
  const [activeTab, setActiveTab] = useState("demo");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [demoIndex, setDemoIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [proposalProgress, setProposalProgress] = useState(0);
  const [signatureStep, setSignatureStep] = useState<"idle" | "signing" | "signed">("idle");
  const [isDrawing, setIsDrawing] = useState(false);
  const [signaturePath, setSignaturePath] = useState("");
  const [selectedPalette, setSelectedPalette] = useState<ColorPalette>(colorPalettes[0]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { setDemoActive } = useChatContext();

  // Initialize canvas resolution to match display size for proper coordinate mapping
  useEffect(() => {
    if (signatureStep !== "signing") return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const initializeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      // Set internal resolution to match display size * device pixel ratio
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Scale context to account for device pixel ratio
        ctx.scale(dpr, dpr);
      }
    };

    // Small delay to ensure layout is complete
    const timeoutId = setTimeout(initializeCanvas, 50);
    window.addEventListener('resize', initializeCanvas);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', initializeCanvas);
    };
  }, [signatureStep]);

  // Helper function to get proper canvas coordinates accounting for scale
  const getCanvasCoordinates = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    // Calculate position relative to canvas display area (no need to scale since ctx is already scaled)
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  // Track demo active state
  const isDemoRunning = messages.length > 0;
  
  useEffect(() => {
    setDemoActive(isDemoRunning);
    return () => setDemoActive(false);
  }, [isDemoRunning, setDemoActive]);

  const handleDemoDownload = () => {
    toast({
      title: "Demo Mode",
      description: "This is a preview demonstration. In production, the PDF would download automatically.",
    });
  };

  const handleDemoOpenLink = () => {
    toast({
      title: "Demo Mode", 
      description: "This is a preview demonstration. In production, this would open the proposal in a new browser tab.",
    });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const updateCompletedSteps = (msgs: ChatMessage[]) => {
    const completedIds = new Set<string>();
    msgs.forEach(msg => {
      if (msg.workflowStep) {
        completedIds.add(msg.workflowStep);
      }
    });
    setCompletedSteps(Array.from(completedIds));
    // Progress based on unique steps completed out of 10
    setProposalProgress(Math.min(Math.round((completedIds.size / workflowSteps.length) * 100), 100));
  };

  const simulateNextMessage = () => {
    if (demoIndex >= demoConversation.length) return;

    const currentIndex = demoIndex;
    const message = demoConversation[currentIndex];

    const newMessages = [...messages, message];
    setMessages(newMessages);
    updateCompletedSteps(newMessages);

    if (message.role === "assistant" && currentIndex + 1 < demoConversation.length) {
      const nextMsg = demoConversation[currentIndex + 1];
      // If next message is also assistant (consecutive), auto-continue after delay
      if (nextMsg.role === "assistant") {
        setTimeout(() => {
          setIsTyping(true);
          setTimeout(() => {
            setIsTyping(false);
            const updatedMessages = [...newMessages, nextMsg];
            setMessages(updatedMessages);
            setDemoIndex(currentIndex + 2);
            updateCompletedSteps(updatedMessages);
          }, 1200);
        }, 800);
      } else {
        // If there's a user message next, wait for button click
        setDemoIndex(currentIndex + 1);
      }
    } else if (message.role === "user" && currentIndex + 1 < demoConversation.length) {
      // Auto-trigger assistant response
      setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          const assistantMsg = demoConversation[currentIndex + 1];
          const updatedMessages = [...newMessages, assistantMsg];
          setMessages(updatedMessages);
          setDemoIndex(currentIndex + 2);
          updateCompletedSteps(updatedMessages);
        }, 1500);
      }, 500);
    } else {
      setDemoIndex(currentIndex + 1);
    }
  };

  const startDemo = () => {
    setMessages([]);
    setDemoIndex(0);
    setCompletedSteps([]);
    setProposalProgress(0);
    
    setTimeout(() => {
      const firstMsg = demoConversation[0];
      setMessages([firstMsg]);
      setDemoIndex(1);
      if (firstMsg.workflowStep) {
        setCompletedSteps([firstMsg.workflowStep]);
        setProposalProgress(10);
      }
    }, 0);
  };

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden max-h-[80vh] overflow-y-auto">
      {/* Header - Compact for mobile since dialog already shows title */}
      <div className="bg-gradient-to-r from-rose-500/10 to-pink-500/10 px-4 py-2.5 border-b border-border sticky top-0 z-10 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center flex-shrink-0">
            <FileText className="w-4 h-4 text-rose-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm text-foreground">Fee Proposal</h3>
              <Badge variant="secondary" className="text-[9px] px-1.5 py-0 hidden sm:inline-flex">AI Automation</Badge>
            </div>
          </div>
          {proposalProgress > 0 && (
            <div className="flex items-center gap-1.5">
              <Progress value={proposalProgress} className="w-16 h-1.5" />
              <span className="text-[10px] font-medium text-muted-foreground">{proposalProgress}%</span>
            </div>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent p-0 overflow-x-auto">
          <TabsTrigger value="workflow" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 py-2 text-xs whitespace-nowrap">
            <Zap className="w-3 h-3 mr-1.5" />
            Workflow
          </TabsTrigger>
          <TabsTrigger value="demo" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 py-2 text-xs whitespace-nowrap">
            <Bot className="w-3 h-3 mr-1.5" />
            Live Demo
          </TabsTrigger>
          <TabsTrigger value="output" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 py-2 text-xs whitespace-nowrap">
            <FileDown className="w-3 h-3 mr-1.5" />
            Outputs
          </TabsTrigger>
          <TabsTrigger value="preview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 py-2 text-xs whitespace-nowrap">
            <FileType className="w-3 h-3 mr-1.5" />
            PDF Preview
          </TabsTrigger>
          <TabsTrigger value="integrations" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 py-2 text-xs whitespace-nowrap">
            <Link2 className="w-3 h-3 mr-1.5" />
            Integrations
          </TabsTrigger>
        </TabsList>

        {/* Workflow Tab */}
        <TabsContent value="workflow" className="p-4 space-y-2 mt-0 max-h-[400px] overflow-y-auto">
          {workflowSteps.map((step, idx) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={cn(
                "rounded-xl border transition-all cursor-pointer",
                completedSteps.includes(step.id)
                  ? "bg-green-500/5 border-green-500/20"
                  : "bg-muted/30 border-border hover:border-primary/30"
              )}
              onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
            >
              <div className="p-3 flex items-center gap-3">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                  completedSteps.includes(step.id)
                    ? "bg-green-500/20"
                    : `bg-gradient-to-br ${step.color}`
                )}>
                  {completedSteps.includes(step.id) ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <step.icon className="w-4 h-4 text-foreground/70" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                      Step {step.step}
                    </Badge>
                    <h4 className="font-medium text-xs text-foreground truncate">{step.title}</h4>
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate">{step.description}</p>
                </div>
                {expandedStep === step.id ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
              
              <AnimatePresence>
                {expandedStep === step.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 pb-3 pt-0">
                      <div className="pl-11 space-y-1">
                        {step.details.map((detail, i) => (
                          <div key={i} className="flex items-start gap-2 text-[10px] text-muted-foreground">
                            <div className="w-1 h-1 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                            {detail}
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </TabsContent>

        {/* Live Demo Tab */}
        <TabsContent value="demo" className="p-0 mt-0">
          <div className="flex flex-col h-[400px]">
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-500/20 to-pink-500/20 flex items-center justify-center">
                    <FileText className="w-7 h-7 text-rose-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Fee Proposal Automation Demo</h4>
                    <p className="text-xs text-muted-foreground mt-1">Watch the AI handle a proposal request end-to-end</p>
                  </div>
                  <Button onClick={startDemo} className="gap-2 glow-pulse animate-pulse">
                    <Play className="w-4 h-4" />
                    Start Demo
                  </Button>
                </div>
              ) : (
                <>
                  <AnimatePresence>
                    {messages.map((msg, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          "flex gap-2",
                          msg.role === "user" ? "justify-end" : "justify-start"
                        )}
                      >
                        <div className={cn(
                          "max-w-[85%] p-3 rounded-xl",
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground rounded-tr-sm"
                            : "bg-muted rounded-tl-sm"
                        )}>
                          <div className="flex items-center gap-1.5 mb-1">
                            {msg.role === "assistant" ? (
                              <Bot className="w-3 h-3 text-rose-600" />
                            ) : (
                              <Users className="w-3 h-3" />
                            )}
                            <span className="text-[10px] font-medium opacity-70 uppercase">
                              {msg.role === "assistant" ? "alfred ai" : "You"}
                            </span>
                          </div>
                          {msg.role === "assistant" ? (
                            <DemoMarkdown content={msg.content} className="text-xs" />
                          ) : (
                            <p className="text-xs whitespace-pre-line">{msg.content}</p>
                          )}
                          
                          {msg.action && (
                            <div className="mt-2 flex items-center gap-1 text-[10px] opacity-70">
                              <Zap className="w-3 h-3" />
                              {msg.action}
                            </div>
                          )}
                          
                          {msg.attachments && (
                            <div className="mt-2 flex gap-1.5 flex-wrap">
                              {msg.attachments.map((file, i) => (
                                <Badge key={i} variant="secondary" className="text-[9px]">
                                  <Download className="w-2.5 h-2.5 mr-1" />
                                  {file}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex gap-2"
                    >
                      <div className="bg-muted p-3 rounded-xl rounded-tl-sm">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 rounded-full bg-rose-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                          <div className="w-2 h-2 rounded-full bg-rose-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                          <div className="w-2 h-2 rounded-full bg-rose-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {!isTyping && demoIndex < demoConversation.length && messages.length > 0 && (
                    <div className="flex justify-center pt-2">
                      <motion.div
                        animate={{ scale: [1, 1.02, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={simulateNextMessage} 
                          className="text-xs border-primary/50 text-primary bg-primary/10 hover:bg-primary/20 relative overflow-hidden"
                        >
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent"
                            animate={{ x: ["-100%", "100%"] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          />
                          <span className="relative z-10">Continue Demo</span>
                          <motion.div
                            className="ml-1 relative z-10"
                            animate={{ x: [0, 3, 0] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          >
                            <ArrowRight className="w-3 h-3" />
                          </motion.div>
                        </Button>
                      </motion.div>
                    </div>
                  )}

                  {demoIndex >= demoConversation.length && messages.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center space-y-3 pt-4"
                    >
                      <div className="flex items-center justify-center gap-2 text-green-500">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="text-sm font-medium">Proposal Workflow Complete!</span>
                      </div>
                      <div className="flex gap-2 justify-center flex-wrap">
                        <Badge variant="secondary" className="text-[10px]">
                          <Eye className="w-3 h-3 mr-1" />
                          Tracking Active
                        </Badge>
                        <Badge variant="secondary" className="text-[10px]">
                          <Bell className="w-3 h-3 mr-1" />
                          Notifications On
                        </Badge>
                      </div>
                      <div className="flex gap-2 justify-center">
                        <Button variant="default" size="sm" onClick={() => setActiveTab("preview")} className="gap-1.5">
                          <FileType className="w-3.5 h-3.5" />
                          View Proposal
                        </Button>
                        <Button variant="outline" size="sm" onClick={startDemo}>
                          Restart Demo
                        </Button>
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Output Components Tab */}
        <TabsContent value="output" className="p-4 space-y-4 mt-0">
          <div className="space-y-3">
            <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Proposal Components</h5>
            <div className="grid grid-cols-2 gap-2">
              {proposalSections.map((section, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.03 }}
                  className="p-2 rounded-lg bg-muted/50 border border-border text-[10px] text-foreground flex items-center gap-2"
                >
                  <div className="w-4 h-4 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-[8px] font-bold text-primary">{idx + 1}</span>
                  </div>
                  {section}
                </motion.div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-br from-rose-500/10 to-pink-500/5 border border-rose-500/20">
            <h5 className="font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-rose-600" />
              Smart Features
            </h5>
            <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-foreground">
              <div className="flex items-start gap-2">
                <Globe className="w-3 h-3 text-rose-600 mt-0.5 flex-shrink-0" />
                Custom domain for proposals
              </div>
              <div className="flex items-start gap-2">
                <Eye className="w-3 h-3 text-rose-600 mt-0.5 flex-shrink-0" />
                Open rate & time tracking
              </div>
              <div className="flex items-start gap-2">
                <MessageSquare className="w-3 h-3 text-rose-600 mt-0.5 flex-shrink-0" />
                Figma-style commenting
              </div>
              <div className="flex items-start gap-2">
                <Lock className="w-3 h-3 text-rose-600 mt-0.5 flex-shrink-0" />
                Smart access controls
              </div>
              <div className="flex items-start gap-2">
                <Edit className="w-3 h-3 text-rose-600 mt-0.5 flex-shrink-0" />
                On-screen text editing
              </div>
              <div className="flex items-start gap-2">
                <CreditCard className="w-3 h-3 text-rose-600 mt-0.5 flex-shrink-0" />
                Auto-generate invoices
              </div>
            </div>
          </div>
        </TabsContent>

        {/* PDF Preview Tab - Enterprise Grade Proposal */}
        <TabsContent value="preview" className="p-4 mt-0 max-h-[500px] overflow-y-auto">
          <div className="space-y-4">
            {/* Header with download/view options + Palette Switcher */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <FileType className="w-4 h-4" style={{ color: selectedPalette.primary }} />
                <span className="text-sm font-medium text-foreground">ACME_Global_Headquarters_Proposal.pdf</span>
                <Badge variant="outline" className="text-[9px] bg-amber-500/10 text-amber-600 border-amber-500/30">Enterprise</Badge>
              </div>
              <div className="flex items-center gap-2">
                {/* Palette Switcher */}
                <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50 border border-border">
                  <Palette className="w-3 h-3 text-muted-foreground mr-1" />
                  {colorPalettes.map((palette) => (
                    <TooltipProvider key={palette.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => setSelectedPalette(palette)}
                            className={cn(
                              "w-5 h-5 rounded-full border-2 transition-all",
                              selectedPalette.id === palette.id 
                                ? "border-foreground scale-110 shadow-md" 
                                : "border-transparent hover:scale-105"
                            )}
                            style={{ background: `linear-gradient(135deg, ${palette.primaryGradientFrom}, ${palette.primaryGradientTo})` }}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">{palette.name}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
                <TooltipProvider>
                  <div className="flex gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs gap-1.5"
                          onClick={handleDemoDownload}
                        >
                          <Download className="w-3 h-3" />
                          Download
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Demo only - Click to see response</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs gap-1.5"
                          onClick={handleDemoOpenLink}
                        >
                          <ExternalLink className="w-3 h-3" />
                          Open Link
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Demo only - Click to see response</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TooltipProvider>
              </div>
            </div>

            {/* PDF Document Preview - Light Theme with Dynamic Colors */}
            <div className="border border-border rounded-xl overflow-hidden bg-white shadow-xl">
              {/* Page 1: Cover - Light Premium Design */}
              <div 
                className="p-8 min-h-[280px] relative overflow-hidden"
                style={{ backgroundColor: selectedPalette.headerBg }}
              >
                {/* Decorative header stripe */}
                <div 
                  className="absolute top-0 left-0 right-0 h-2"
                  style={{ background: `linear-gradient(90deg, ${selectedPalette.primaryGradientFrom}, ${selectedPalette.primaryGradientTo})` }}
                />
                <div className="absolute top-6 right-4 flex gap-2">
                  <Badge 
                    className="text-white text-[9px]"
                    style={{ backgroundColor: selectedPalette.primary }}
                  >
                    Page 1 of 8
                  </Badge>
                  <Badge className="bg-emerald-500/90 text-white text-[9px]">Confidential</Badge>
                </div>
                <div className="relative space-y-6 pt-4">
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-16 h-16 rounded-xl flex items-center justify-center shadow-lg"
                      style={{ 
                        background: `linear-gradient(135deg, ${selectedPalette.primaryGradientFrom}, ${selectedPalette.primaryGradientTo})`,
                        boxShadow: `0 10px 25px -5px ${selectedPalette.primary}40`
                      }}
                    >
                      <Building2 className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold tracking-tight" style={{ color: selectedPalette.textPrimary }}>
                        NEXUS ARCHITECTS
                      </h3>
                      <p className="text-sm" style={{ color: selectedPalette.textSecondary }}>
                        Global Design Excellence • Est. 1987
                      </p>
                    </div>
                  </div>
                  <div className="pt-6 border-t" style={{ borderColor: `${selectedPalette.primary}20` }}>
                    <p 
                      className="text-xs uppercase tracking-[0.2em] font-medium"
                      style={{ color: selectedPalette.primary }}
                    >
                      Strategic Proposal
                    </p>
                    <h2 
                      className="text-3xl font-bold mt-2 leading-tight"
                      style={{ color: selectedPalette.textPrimary }}
                    >
                      ACME Global Headquarters<br/>Workplace Transformation
                    </h2>
                    <p className="text-base mt-3" style={{ color: selectedPalette.textSecondary }}>
                      A comprehensive design solution for 450,000 sq ft of premium workspace
                    </p>
                  </div>
                  <div className="flex items-center gap-6 pt-4 text-xs" style={{ color: selectedPalette.textSecondary }}>
                    <span>Prepared for: ACME Corporation</span>
                    <span>•</span>
                    <span>December 2024</span>
                    <span>•</span>
                    <span>Ref: NX-2024-0847</span>
                  </div>
                </div>
              </div>

              {/* Page divider */}
              <div 
                className="h-1"
                style={{ background: `linear-gradient(90deg, ${selectedPalette.accentLight}, ${selectedPalette.primaryLight}20, ${selectedPalette.accentLight})` }}
              />

              {/* Page 2: Executive Summary */}
              <div className="p-8 bg-white min-h-[320px] relative">
                <div className="absolute top-4 right-4">
                  <Badge variant="outline" className="text-[9px]">Page 2 of 8</Badge>
                </div>
                <div className="space-y-5">
                  <div 
                    className="flex items-center gap-3 pb-3 border-b-2"
                    style={{ borderColor: selectedPalette.primary }}
                  >
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: selectedPalette.primary }}
                    >
                      <FileText className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-lg font-bold" style={{ color: selectedPalette.textPrimary }}>Executive Summary</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { value: "$127.5M", label: "Project Value" },
                      { value: "36", label: "Months Duration" },
                      { value: "5,000+", label: "Employee Capacity" }
                    ].map((stat, i) => (
                      <div 
                        key={i} 
                        className="p-4 rounded-xl border"
                        style={{ backgroundColor: selectedPalette.accentLight, borderColor: `${selectedPalette.primary}20` }}
                      >
                        <p className="text-2xl font-bold" style={{ color: selectedPalette.primary }}>{stat.value}</p>
                        <p className="text-xs mt-1" style={{ color: selectedPalette.textSecondary }}>{stat.label}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: selectedPalette.textSecondary }}>
                    Nexus Architects is honored to present this comprehensive proposal for ACME Corporation's new Global Headquarters. 
                    This transformative project represents a paradigm shift in workplace design, integrating cutting-edge sustainability 
                    practices, biophilic design principles, and future-ready technology infrastructure to create a world-class 
                    headquarters that will serve ACME's global operations for decades to come.
                  </p>
                  <div className="flex gap-3">
                    <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/30 text-[10px]">LEED Platinum Target</Badge>
                    <Badge className="bg-blue-500/10 text-blue-700 border-blue-500/30 text-[10px]">WELL Certified</Badge>
                    <Badge className="bg-purple-500/10 text-purple-700 border-purple-500/30 text-[10px]">Net Zero Ready</Badge>
                  </div>
                </div>
              </div>

              {/* Page divider */}
              <div 
                className="h-1"
                style={{ background: `linear-gradient(90deg, ${selectedPalette.accentLight}, ${selectedPalette.primaryLight}20, ${selectedPalette.accentLight})` }}
              />

              {/* Page 3: Our Credentials */}
              <div className="p-8 bg-white min-h-[300px] relative">
                <div className="absolute top-4 right-4">
                  <Badge variant="outline" className="text-[9px]">Page 3 of 8</Badge>
                </div>
                <div className="space-y-5">
                  <div 
                    className="flex items-center gap-3 pb-3 border-b-2"
                    style={{ borderColor: selectedPalette.primary }}
                  >
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: selectedPalette.primary }}
                    >
                      <Briefcase className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-lg font-bold" style={{ color: selectedPalette.textPrimary }}>Why Nexus Architects</h3>
                  </div>
                  <div className="grid grid-cols-4 gap-3 text-center">
                    {[
                      { value: "37+", label: "Years Experience" },
                      { value: "$4.2B", label: "Projects Delivered" },
                      { value: "28", label: "Global Offices" },
                      { value: "96%", label: "Client Retention" }
                    ].map((stat, i) => (
                      <div 
                        key={i} 
                        className="p-3 rounded-lg border"
                        style={{ backgroundColor: selectedPalette.accentLight, borderColor: `${selectedPalette.primary}20` }}
                      >
                        <p className="text-xl font-bold" style={{ color: selectedPalette.primary }}>{stat.value}</p>
                        <p className="text-[9px] mt-1" style={{ color: selectedPalette.textSecondary }}>{stat.label}</p>
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="text-xs font-semibold mb-3" style={{ color: selectedPalette.textPrimary }}>Notable Enterprise Projects</p>
                    <div className="space-y-2">
                      {[
                        { client: "Microsoft APAC HQ", value: "$180M", location: "Singapore" },
                        { client: "Goldman Sachs Tower", value: "$220M", location: "London" },
                        { client: "Tesla Innovation Campus", value: "$145M", location: "Austin, TX" }
                      ].map((project, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-6 h-6 rounded flex items-center justify-center"
                              style={{ backgroundColor: `${selectedPalette.primary}15` }}
                            >
                              <Building2 className="w-3 h-3" style={{ color: selectedPalette.primary }} />
                            </div>
                            <span className="text-xs font-medium" style={{ color: selectedPalette.textPrimary }}>{project.client}</span>
                          </div>
                          <div className="flex items-center gap-4 text-xs" style={{ color: selectedPalette.textSecondary }}>
                            <span>{project.location}</span>
                            <span className="font-semibold" style={{ color: selectedPalette.textPrimary }}>{project.value}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Page divider */}
              <div 
                className="h-1"
                style={{ background: `linear-gradient(90deg, ${selectedPalette.accentLight}, ${selectedPalette.primaryLight}20, ${selectedPalette.accentLight})` }}
              />

              {/* Page 4: Scope of Services */}
              <div className="p-8 bg-white min-h-[320px] relative">
                <div className="absolute top-4 right-4">
                  <Badge variant="outline" className="text-[9px]">Page 4 of 8</Badge>
                </div>
                <div className="space-y-5">
                  <div 
                    className="flex items-center gap-3 pb-3 border-b-2"
                    style={{ borderColor: selectedPalette.primary }}
                  >
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: selectedPalette.primary }}
                    >
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-lg font-bold" style={{ color: selectedPalette.textPrimary }}>Comprehensive Scope of Services</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { title: "Master Planning & Architecture", items: ["Site analysis & optimization", "Building envelope design", "Core & shell architecture", "Parking & infrastructure"] },
                      { title: "Interior Design & Fit-out", items: ["Workplace strategy", "Space planning", "FF&E specification", "Wayfinding & branding"] },
                      { title: "Sustainability & Wellness", items: ["LEED certification mgmt", "WELL building standard", "Energy modeling", "Biophilic design integration"] },
                      { title: "Technology & Smart Building", items: ["IoT infrastructure", "Building automation", "AV/IT coordination", "Future-proofing strategy"] }
                    ].map((scope, i) => (
                      <div 
                        key={i} 
                        className="p-4 rounded-xl border"
                        style={{ backgroundColor: selectedPalette.accentLight, borderColor: `${selectedPalette.primary}20` }}
                      >
                        <h4 className="text-xs font-bold mb-2" style={{ color: selectedPalette.textPrimary }}>{scope.title}</h4>
                        <ul className="space-y-1">
                          {scope.items.map((item, j) => (
                            <li key={j} className="flex items-center gap-2 text-[10px]" style={{ color: selectedPalette.textSecondary }}>
                              <Check className="w-3 h-3 flex-shrink-0" style={{ color: selectedPalette.primaryLight }} />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Page divider */}
              <div 
                className="h-1"
                style={{ background: `linear-gradient(90deg, ${selectedPalette.accentLight}, ${selectedPalette.primaryLight}20, ${selectedPalette.accentLight})` }}
              />

              {/* Page 5: Project Team */}
              <div className="p-8 bg-white min-h-[280px] relative">
                <div className="absolute top-4 right-4">
                  <Badge variant="outline" className="text-[9px]">Page 5 of 8</Badge>
                </div>
                <div className="space-y-5">
                  <div 
                    className="flex items-center gap-3 pb-3 border-b-2"
                    style={{ borderColor: selectedPalette.primary }}
                  >
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: selectedPalette.primary }}
                    >
                      <Users className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-lg font-bold" style={{ color: selectedPalette.textPrimary }}>Dedicated Leadership Team</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { name: "Dr. Victoria Chen", role: "Principal-in-Charge", exp: "25 years", specialty: "Corporate HQ Design" },
                      { name: "Mark Stevens, AIA", role: "Design Director", exp: "18 years", specialty: "Sustainable Architecture" },
                      { name: "Sarah Okonkwo", role: "Project Director", exp: "15 years", specialty: "Large-Scale Delivery" }
                    ].map((member, i) => (
                      <div 
                        key={i} 
                        className="p-4 rounded-xl border text-center"
                        style={{ backgroundColor: selectedPalette.accentLight, borderColor: `${selectedPalette.primary}20` }}
                      >
                        <div 
                          className="w-12 h-12 mx-auto rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg"
                          style={{ 
                            background: `linear-gradient(135deg, ${selectedPalette.primaryGradientFrom}, ${selectedPalette.primaryGradientTo})`,
                            boxShadow: `0 4px 14px -3px ${selectedPalette.primary}40`
                          }}
                        >
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <p className="text-xs font-bold mt-3" style={{ color: selectedPalette.textPrimary }}>{member.name}</p>
                        <p className="text-[10px] font-medium" style={{ color: selectedPalette.primary }}>{member.role}</p>
                        <div className="mt-2 pt-2 border-t" style={{ borderColor: `${selectedPalette.primary}15` }}>
                          <p className="text-[9px]" style={{ color: selectedPalette.textSecondary }}>{member.exp} • {member.specialty}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-center italic" style={{ color: selectedPalette.textSecondary }}>
                    Supported by a dedicated team of 45+ architects, designers, and project managers
                  </p>
                </div>
              </div>

              {/* Page divider */}
              <div 
                className="h-1"
                style={{ background: `linear-gradient(90deg, ${selectedPalette.accentLight}, ${selectedPalette.primaryLight}20, ${selectedPalette.accentLight})` }}
              />

              {/* Page 6: Fee Schedule */}
              <div className="p-8 bg-white min-h-[320px] relative">
                <div className="absolute top-4 right-4">
                  <Badge variant="outline" className="text-[9px]">Page 6 of 8</Badge>
                </div>
                <div className="space-y-5">
                  <div 
                    className="flex items-center gap-3 pb-3 border-b-2"
                    style={{ borderColor: selectedPalette.primary }}
                  >
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: selectedPalette.primary }}
                    >
                      <DollarSign className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-lg font-bold" style={{ color: selectedPalette.textPrimary }}>Investment Summary</h3>
                  </div>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b-2" style={{ borderColor: `${selectedPalette.primary}30` }}>
                        <th className="text-left py-2 font-semibold" style={{ color: selectedPalette.textSecondary }}>Phase</th>
                        <th className="text-left py-2 font-semibold" style={{ color: selectedPalette.textSecondary }}>Deliverables</th>
                        <th className="text-center py-2 font-semibold" style={{ color: selectedPalette.textSecondary }}>Duration</th>
                        <th className="text-right py-2 font-semibold" style={{ color: selectedPalette.textSecondary }}>Fee (USD)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { phase: "Phase 1", desc: "Strategic Planning & Concept Design", duration: "4 months", fee: "$3,200,000" },
                        { phase: "Phase 2", desc: "Schematic Design Development", duration: "6 months", fee: "$4,800,000" },
                        { phase: "Phase 3", desc: "Design Development & Documentation", duration: "10 months", fee: "$7,500,000" },
                        { phase: "Phase 4", desc: "Construction Documentation", duration: "8 months", fee: "$5,200,000" },
                        { phase: "Phase 5", desc: "Bidding & Procurement Support", duration: "3 months", fee: "$1,800,000" },
                        { phase: "Phase 6", desc: "Construction Administration", duration: "24 months", fee: "$4,500,000" }
                      ].map((row, i) => (
                        <tr 
                          key={i} 
                          className="border-b hover:bg-slate-50"
                          style={{ borderColor: `${selectedPalette.primary}10` }}
                        >
                          <td className="py-3 font-medium" style={{ color: selectedPalette.textPrimary }}>{row.phase}</td>
                          <td className="py-3" style={{ color: selectedPalette.textSecondary }}>{row.desc}</td>
                          <td className="py-3 text-center" style={{ color: selectedPalette.textSecondary }}>{row.duration}</td>
                          <td className="py-3 text-right font-semibold" style={{ color: selectedPalette.textPrimary }}>{row.fee}</td>
                        </tr>
                      ))}
                      <tr 
                        className="border-t-2"
                        style={{ backgroundColor: selectedPalette.accentLight, borderColor: selectedPalette.primary }}
                      >
                        <td colSpan={3} className="py-3 font-bold text-sm" style={{ color: selectedPalette.textPrimary }}>Total Professional Fees</td>
                        <td className="py-3 text-right font-bold text-lg" style={{ color: selectedPalette.primary }}>$27,000,000</td>
                      </tr>
                    </tbody>
                  </table>
                  <div 
                    className="p-4 rounded-xl border"
                    style={{ backgroundColor: selectedPalette.accentLight, borderColor: `${selectedPalette.primary}20` }}
                  >
                    <p className="text-[10px] font-semibold mb-2 uppercase tracking-wide" style={{ color: selectedPalette.textSecondary }}>Payment Terms</p>
                    <div className="flex gap-4 text-xs" style={{ color: selectedPalette.textSecondary }}>
                      <span className="flex items-center gap-1"><Check className="w-3 h-3" style={{ color: selectedPalette.primaryLight }} /> Monthly invoicing</span>
                      <span className="flex items-center gap-1"><Check className="w-3 h-3" style={{ color: selectedPalette.primaryLight }} /> Net 30 days</span>
                      <span className="flex items-center gap-1"><Check className="w-3 h-3" style={{ color: selectedPalette.primaryLight }} /> Milestone-based payments</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Page divider */}
              <div 
                className="h-1"
                style={{ background: `linear-gradient(90deg, ${selectedPalette.accentLight}, ${selectedPalette.primaryLight}20, ${selectedPalette.accentLight})` }}
              />

              {/* Page 7: Timeline */}
              <div className="p-8 bg-white min-h-[240px] relative">
                <div className="absolute top-4 right-4">
                  <Badge variant="outline" className="text-[9px]">Page 7 of 8</Badge>
                </div>
                <div className="space-y-5">
                  <div 
                    className="flex items-center gap-3 pb-3 border-b-2"
                    style={{ borderColor: selectedPalette.primary }}
                  >
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: selectedPalette.primary }}
                    >
                      <Calendar className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-lg font-bold" style={{ color: selectedPalette.textPrimary }}>Project Timeline</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {[
                      { label: "Q1 2025", phase: "Planning" },
                      { label: "Q2-Q3 2025", phase: "Schematic" },
                      { label: "Q4 2025 - Q2 2026", phase: "Design Dev" },
                      { label: "Q3-Q4 2026", phase: "Documentation" },
                      { label: "2027-2028", phase: "Construction" }
                    ].map((milestone, i) => (
                      <div key={i} className="flex-1 relative">
                        <div 
                          className="h-2 rounded-full"
                          style={{ background: `linear-gradient(90deg, ${selectedPalette.primaryGradientFrom}, ${selectedPalette.primaryGradientTo})` }}
                        />
                        <div className="mt-2">
                          <p className="text-[9px] font-semibold" style={{ color: selectedPalette.textPrimary }}>{milestone.label}</p>
                          <p className="text-[8px]" style={{ color: selectedPalette.textSecondary }}>{milestone.phase}</p>
                        </div>
                        {i < 4 && <ArrowRight className="absolute -right-2 top-0 w-3 h-3" style={{ color: selectedPalette.primaryLight }} />}
                      </div>
                    ))}
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                    <div className="flex items-center gap-2 text-emerald-700">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-xs font-semibold">Target Completion: Q4 2028</span>
                    </div>
                    <p className="text-[10px] text-emerald-600 mt-1">Ready for ACME's 50th Anniversary Celebration</p>
                  </div>
                </div>
              </div>

              {/* Page divider */}
              <div 
                className="h-1"
                style={{ background: `linear-gradient(90deg, ${selectedPalette.accentLight}, ${selectedPalette.primaryLight}20, ${selectedPalette.accentLight})` }}
              />

              {/* Page 8: AlfredSign E-Signature */}
              <div className="p-8 bg-gradient-to-br from-slate-50 to-white min-h-[380px] relative">
                <div className="absolute top-4 right-4 flex gap-2">
                  <Badge variant="outline" className="text-[9px]">Page 8 of 8</Badge>
                </div>
                <div className="space-y-5">
                  {/* AlfredSign Header */}
                  <div className="flex items-center justify-between pb-3 border-b-2 border-rose-500">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
                        <PenTool className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">AlfredSign</h3>
                        <p className="text-[10px] text-slate-500">Secure Electronic Signature</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/30 text-[9px] gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        256-bit Encrypted
                      </Badge>
                      <Badge className="bg-blue-500/10 text-blue-700 border-blue-500/30 text-[9px] gap-1">
                        <Fingerprint className="w-3 h-3" />
                        Legally Binding
                      </Badge>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    By signing below, you authorize Nexus Architects to proceed with the ACME Global Headquarters project 
                    as detailed in this proposal. This e-signature is legally binding under the E-SIGN Act.
                  </p>

                  {/* Signature Area */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    {/* Client Signature */}
                    <div className="space-y-3 p-3 sm:p-4 rounded-xl border-2 border-rose-200 bg-rose-50/50 relative overflow-hidden">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-900">Client Signature</p>
                        {signatureStep === "signed" && (
                          <Badge className="bg-emerald-500 text-white text-[9px]">
                            <Check className="w-3 h-3 mr-1" />
                            Signed
                          </Badge>
                        )}
                      </div>
                      
                      {signatureStep === "idle" && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="space-y-3"
                        >
                          <div className="h-24 sm:h-20 border-2 border-dashed border-rose-300 rounded-lg flex items-center justify-center bg-white cursor-pointer hover:bg-rose-50 active:bg-rose-100 transition-colors touch-manipulation"
                               onClick={() => setSignatureStep("signing")}>
                            <div className="text-center px-2">
                              <div className="flex items-center justify-center gap-2 mb-1">
                                <Fingerprint className="w-5 h-5 sm:w-6 sm:h-6 text-rose-400" />
                                <PenTool className="w-5 h-5 sm:w-6 sm:h-6 text-rose-400" />
                              </div>
                              <p className="text-xs text-rose-500 font-medium">Tap to sign</p>
                              <p className="text-[10px] text-rose-400 mt-0.5 sm:hidden">Use your finger to draw</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500">
                            <Lock className="w-3 h-3" />
                            Your signature will be securely captured
                          </div>
                        </motion.div>
                      )}

                      {signatureStep === "signing" && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="space-y-3"
                        >
                          {/* Mobile instruction banner */}
                          <div className="sm:hidden flex items-center gap-2 p-2 bg-rose-50 rounded-lg border border-rose-200">
                            <Fingerprint className="w-4 h-4 text-rose-500 flex-shrink-0" />
                            <p className="text-[10px] text-rose-600">Use your finger to draw your signature below</p>
                          </div>
                          <div className="relative">
                            <canvas 
                              ref={canvasRef}
                              className="w-full h-28 sm:h-20 border-2 border-rose-300 rounded-lg bg-white cursor-crosshair touch-none"
                              style={{ touchAction: 'none' }}
                              onMouseDown={(e) => {
                                setIsDrawing(true);
                                const canvas = canvasRef.current;
                                if (canvas) {
                                  const ctx = canvas.getContext('2d');
                                  const { x, y } = getCanvasCoordinates(e.clientX, e.clientY);
                                  if (ctx) {
                                    ctx.beginPath();
                                    ctx.moveTo(x, y);
                                  }
                                }
                              }}
                              onMouseMove={(e) => {
                                if (!isDrawing) return;
                                const canvas = canvasRef.current;
                                if (canvas) {
                                  const ctx = canvas.getContext('2d');
                                  const { x, y } = getCanvasCoordinates(e.clientX, e.clientY);
                                  if (ctx) {
                                    ctx.lineTo(x, y);
                                    ctx.strokeStyle = '#1e293b';
                                    ctx.lineWidth = 2;
                                    ctx.lineCap = 'round';
                                    ctx.stroke();
                                  }
                                }
                              }}
                              onMouseUp={() => {
                                setIsDrawing(false);
                                const canvas = canvasRef.current;
                                if (canvas) {
                                  setSignaturePath(canvas.toDataURL());
                                }
                              }}
                              onMouseLeave={() => setIsDrawing(false)}
                              onTouchStart={(e) => {
                                e.preventDefault();
                                setIsDrawing(true);
                                const canvas = canvasRef.current;
                                if (canvas && e.touches.length > 0) {
                                  const ctx = canvas.getContext('2d');
                                  const touch = e.touches[0];
                                  const { x, y } = getCanvasCoordinates(touch.clientX, touch.clientY);
                                  if (ctx) {
                                    ctx.beginPath();
                                    ctx.moveTo(x, y);
                                  }
                                }
                              }}
                              onTouchMove={(e) => {
                                e.preventDefault();
                                if (!isDrawing) return;
                                const canvas = canvasRef.current;
                                if (canvas && e.touches.length > 0) {
                                  const ctx = canvas.getContext('2d');
                                  const touch = e.touches[0];
                                  const { x, y } = getCanvasCoordinates(touch.clientX, touch.clientY);
                                  if (ctx) {
                                    ctx.lineTo(x, y);
                                    ctx.strokeStyle = '#1e293b';
                                    ctx.lineWidth = 3;
                                    ctx.lineCap = 'round';
                                    ctx.lineJoin = 'round';
                                    ctx.stroke();
                                  }
                                }
                              }}
                              onTouchEnd={(e) => {
                                e.preventDefault();
                                setIsDrawing(false);
                                const canvas = canvasRef.current;
                                if (canvas) {
                                  setSignaturePath(canvas.toDataURL());
                                }
                              }}
                            />
                            <p className="absolute bottom-1 left-2 text-[9px] text-slate-400 hidden sm:block">Draw your signature above</p>
                            <p className="absolute bottom-1 left-2 text-[9px] text-slate-400 sm:hidden">Sign with your finger above</p>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs flex-1 gap-1 h-10 sm:h-8"
                            onClick={() => {
                                const canvas = canvasRef.current;
                                if (canvas) {
                                  const ctx = canvas.getContext('2d');
                                  if (ctx) {
                                    // Reset transform before clearing to handle DPR scaling
                                    ctx.setTransform(1, 0, 0, 1, 0, 0);
                                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                                    // Restore DPR scaling
                                    const dpr = window.devicePixelRatio || 1;
                                    ctx.scale(dpr, dpr);
                                  }
                                }
                                setSignaturePath("");
                              }}
                            >
                              <RotateCcw className="w-3 h-3" />
                              Clear
                            </Button>
                            <Button 
                              size="sm" 
                              className="text-xs flex-1 gap-1 bg-rose-500 hover:bg-rose-600 h-10 sm:h-8"
                              onClick={() => setSignatureStep("signed")}
                            >
                              <Check className="w-3 h-3" />
                              Confirm Signature
                            </Button>
                          </div>
                        </motion.div>
                      )}

                      {signatureStep === "signed" && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="space-y-2"
                        >
                          <div className="h-20 border-2 border-emerald-300 rounded-lg bg-emerald-50 flex items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-0 flex items-center justify-center">
                              <p className="text-2xl font-signature text-slate-800 italic" style={{ fontFamily: 'cursive' }}>Jane Smith</p>
                            </div>
                            <div className="absolute bottom-1 right-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-slate-600">Jane Smith, CEO</span>
                            <span className="text-slate-500">Dec 26, 2024 • 14:32 UTC</span>
                          </div>
                          <div className="flex items-center gap-1 text-[9px] text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                            <ShieldCheck className="w-3 h-3" />
                            IP: 192.168.1.*** • Audit ID: AS-2024-847291
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {/* Nexus Signature (Pre-signed) */}
                    <div className="space-y-3 p-3 sm:p-4 rounded-xl border border-slate-200 bg-white">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-900">Nexus Architects</p>
                        <Badge className="bg-emerald-500 text-white text-[9px]">
                          <Check className="w-3 h-3 mr-1" />
                          Signed
                        </Badge>
                      </div>
                      <div className="h-20 border border-slate-200 rounded-lg bg-slate-50 flex items-center justify-center relative">
                        <p className="text-2xl font-signature text-slate-700 italic" style={{ fontFamily: 'cursive' }}>Victoria Chen</p>
                        <div className="absolute bottom-1 right-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-600">Dr. Victoria Chen, Principal</span>
                        <span className="text-slate-500">Dec 24, 2024 • 09:15 UTC</span>
                      </div>
                      <div className="flex items-center gap-1 text-[9px] text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                        <ShieldCheck className="w-3 h-3" />
                        IP: 203.45.67.*** • Audit ID: AS-2024-847102
                      </div>
                    </div>
                  </div>

                  {/* Completion Status */}
                  {signatureStep === "signed" && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-200"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-emerald-800">Agreement Executed</p>
                            <p className="text-[10px] text-emerald-600">All parties have signed. This document is now legally binding.</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-slate-500">Document ID</p>
                          <p className="text-xs font-mono text-slate-700">NX-ACME-2024-0847</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer info */}
            <div className="flex items-center justify-between text-[10px] text-muted-foreground flex-wrap gap-2">
              <span>Generated by alfred ai • proposals.nexusarchitects.com/acme-global-hq</span>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-[9px] gap-1 bg-rose-500/10 text-rose-600 border-rose-500/30">
                  <PenTool className="w-2.5 h-2.5" />
                  AlfredSign Enabled
                </Badge>
                <span>8 pages • 2.4 MB</span>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="p-4 space-y-4 mt-0">
          <div className="grid grid-cols-3 gap-2">
            {integrations.map((int, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="p-2 rounded-lg bg-muted/50 border border-border text-center"
              >
                <div className="text-xs font-medium text-foreground">{int.name}</div>
                <div className="text-[9px] text-muted-foreground">{int.category}</div>
              </motion.div>
            ))}
          </div>

          <div className="space-y-2">
            <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Input Sources</h5>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="outline" className="text-[9px]">User Prompts</Badge>
              <Badge variant="outline" className="text-[9px]">Emails</Badge>
              <Badge variant="outline" className="text-[9px]">Past Proposals</Badge>
              <Badge variant="outline" className="text-[9px]">Templates</Badge>
              <Badge variant="outline" className="text-[9px]">Meeting Notes</Badge>
              <Badge variant="outline" className="text-[9px]">Company Logo</Badge>
              <Badge variant="outline" className="text-[9px]">Project Images</Badge>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-muted/30 border border-border">
            <h5 className="text-xs font-medium text-foreground mb-2 flex items-center gap-2">
              <Bell className="w-3 h-3 text-rose-600" />
              Notifications & Follow-up
            </h5>
            <ul className="space-y-1 text-[10px] text-muted-foreground">
              <li>• Notify when proposal links are opened</li>
              <li>• Auto-create client follow-up reminders</li>
              <li>• Auto-update CRM on acceptance</li>
              <li>• Auto-generate invoice & request deposit</li>
            </ul>
          </div>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="px-4 py-3 bg-muted/30 border-t border-border flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Mail className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">Proposals • CRM • Invoicing</span>
        </div>
        <Button 
          variant="link" 
          size="sm" 
          className="text-xs h-auto p-0"
          onClick={() => toast({
            title: "Demo Mode",
            description: "In production, this would navigate to detailed documentation about the fee proposal automation system."
          })}
        >
          Learn more →
        </Button>
      </div>
    </div>
  );
}