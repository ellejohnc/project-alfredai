import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import {
  Mail, MailOpen, Inbox, Send, Clock, AlertTriangle, ArrowRight,
  Building2, DollarSign, Calendar, User, Users, Bot, Sparkles,
  CheckCircle2, Loader2, Star, Tag, Filter, ChevronRight,
  MessageSquare, Phone, FileText, UserPlus, Reply, Forward,
  ArrowUpRight, Shield, Zap, TrendingUp, ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useDemoSpeed } from "@/contexts/DemoSpeedContext";
import { InlineDemoSpeedControl } from "./shared/InlineDemoSpeedControl";
import ScrollFadeContainer from "./ScrollFadeContainer";

// ─── Types ───────────────────────────────────────────────────
type Priority = "urgent" | "high" | "normal" | "low";
type Intent = "new-enquiry" | "pricing" | "follow-up" | "escalation" | "internal-request" | "technical-review";
type EmailSource = "external" | "internal";
type Sentiment = "positive" | "neutral" | "negative" | "frustrated";

interface EmailEntity {
  company?: string;
  budget?: string;
  timeline?: string;
  contactName?: string;
  phone?: string;
}

interface RoutingTarget {
  name: string;
  role: string;
  initials: string;
  color: string;
}

interface SuggestedAction {
  label: string;
  icon: React.ElementType;
  variant: "default" | "outline";
}

interface TriagedEmail {
  id: string;
  from: string;
  fromEmail: string;
  subject: string;
  preview: string;
  body: string;
  source: EmailSource;
  time: string;
  priority: Priority;
  intent: Intent;
  sentiment: Sentiment;
  urgencyScore: number;
  entities: EmailEntity;
  routeTo: RoutingTarget;
  suggestedActions: SuggestedAction[];
  draftReply: string;
  isRead: boolean;
  isProcessed: boolean;
}

// ─── Mock Data ───────────────────────────────────────────────
const MOCK_EMAILS: TriagedEmail[] = [
  {
    id: "e1",
    from: "Sarah Mitchell",
    fromEmail: "s.mitchell@meridiangroup.com.au",
    subject: "New Project Enquiry – Office Fitout Automation",
    preview: "Hi, we're looking at automating our project management workflows for a 12-storey office fitout in Parramatta...",
    body: "Hi Alfred team,\n\nWe're looking at automating our project management workflows for a 12-storey office fitout in Parramatta. Currently managing everything in spreadsheets and it's becoming unworkable with 40+ subcontractors.\n\nWe'd need document processing, automated progress tracking, and client reporting. Budget is around $85K for the setup.\n\nCan we schedule a discovery call this week?\n\nBest regards,\nSarah Mitchell\nProject Director, Meridian Corp",
    source: "external",
    time: "2 min ago",
    priority: "high",
    intent: "new-enquiry",
    sentiment: "positive",
    urgencyScore: 82,
    entities: { company: "Meridian Corp", budget: "$85,000", timeline: "This week", contactName: "Sarah Mitchell" },
    routeTo: { name: "John Smith", role: "Solutions Architect", initials: "JC", color: "bg-blue-600" },
    suggestedActions: [
      { label: "Draft Reply", icon: Reply, variant: "default" },
      { label: "Create CRM Entry", icon: UserPlus, variant: "outline" },
      { label: "Schedule Call", icon: Calendar, variant: "outline" },
    ],
    draftReply: "Hi Sarah,\n\nThank you for reaching out! Your project sounds like a great fit for our automation platform.\n\nI've looped in John Smith, our Solutions Architect, who specialises in construction workflow automation. He'll be in touch within the hour to schedule a discovery call.\n\nIn the meantime, I've attached a brief case study from a similar 15-storey fitout we automated last quarter — they saw a 60% reduction in reporting overhead.\n\nLooking forward to exploring this with you.\n\nBest,\nAlfredAI",
    isRead: false,
    isProcessed: false,
  },
  {
    id: "e2",
    from: "David Park",
    fromEmail: "dpark@constructflow.io",
    subject: "RE: Pricing for Enterprise Voice AI Package",
    preview: "Thanks for the initial proposal. The board wants to understand the per-seat pricing for 200+ users...",
    body: "Hi team,\n\nThanks for the initial proposal. The board wants to understand the per-seat pricing for 200+ users and whether we can get volume discounts on the voice AI module.\n\nAlso, can you clarify the SLA terms for the enterprise tier? We need 99.9% uptime guaranteed.\n\nWe're comparing with two other vendors and need to make a decision by end of month.\n\nRegards,\nDavid Park\nCTO, ConstructFlow",
    source: "external",
    time: "18 min ago",
    priority: "high",
    intent: "pricing",
    sentiment: "neutral",
    urgencyScore: 75,
    entities: { company: "ConstructFlow", budget: "Enterprise tier", timeline: "End of month", contactName: "David Park" },
    routeTo: { name: "Lisa Wong", role: "Account Executive", initials: "LW", color: "bg-emerald-600" },
    suggestedActions: [
      { label: "Draft Pricing Response", icon: Reply, variant: "default" },
      { label: "Flag for Sales Lead", icon: Star, variant: "outline" },
      { label: "Attach Enterprise SLA", icon: FileText, variant: "outline" },
    ],
    draftReply: "Hi David,\n\nGreat questions. Here's a quick breakdown for 200+ seats:\n\n• Per-seat pricing drops to $45/user/month (vs $65 standard)\n• Voice AI module: 15% volume discount applied automatically\n• Enterprise SLA: 99.95% uptime guaranteed, with credits for any breach\n\nI've attached our full Enterprise comparison sheet. Lisa Wong from our accounts team will follow up with a custom proposal by tomorrow.\n\nHappy to jump on a call if you'd like to discuss further.\n\nBest,\nAlfredAI",
    isRead: false,
    isProcessed: false,
  },
  {
    id: "e3",
    from: "Mark Thompson",
    fromEmail: "m.thompson@urbandev.com.au",
    subject: "Haven't heard back – still interested?",
    preview: "Hi, I submitted an enquiry three weeks ago about your procurement module but haven't received a response...",
    body: "Hi,\n\nI submitted an enquiry three weeks ago about your procurement module but haven't received a response. We were quite keen to trial it for our Q3 projects.\n\nIs this still something you can help with? If not, no worries — we'll look elsewhere.\n\nCheers,\nMark Thompson\nOps Manager, Urban Developments",
    source: "external",
    time: "45 min ago",
    priority: "urgent",
    intent: "follow-up",
    sentiment: "frustrated",
    urgencyScore: 95,
    entities: { company: "Urban Developments", timeline: "Q3", contactName: "Mark Thompson" },
    routeTo: { name: "Alex Rivera", role: "Customer Success", initials: "AR", color: "bg-amber-600" },
    suggestedActions: [
      { label: "Apologise & Respond", icon: Reply, variant: "default" },
      { label: "Escalate to Manager", icon: AlertTriangle, variant: "outline" },
      { label: "Schedule Demo", icon: Calendar, variant: "outline" },
    ],
    draftReply: "Hi Mark,\n\nI sincerely apologise for the delayed response — this should not have happened, and I've flagged it internally to ensure it doesn't recur.\n\nOur procurement module would be an excellent fit for your Q3 projects. I've fast-tracked your enquiry and Alex Rivera from Customer Success will reach out within the next 2 hours with a personalised demo link.\n\nAs a gesture of goodwill, we'd like to offer an extended 30-day trial instead of our standard 14-day period.\n\nThank you for your patience.\n\nBest,\nAlfredAI",
    isRead: false,
    isProcessed: false,
  },
  {
    id: "e4",
    from: "Priya Sharma",
    fromEmail: "priya@alfredai.internal",
    subject: "🔥 Hot lead from webinar – needs technical deep-dive",
    preview: "Just got off the webinar. Buildcraft Solutions (450 staff) want to see the API integration capabilities...",
    body: "Team,\n\nJust wrapped the construction automation webinar. Buildcraft Solutions (450 staff, $120M revenue) stayed for the full Q&A and their Head of Digital asked specifically about:\n\n1. API integration with Procore\n2. Custom workflow builder capabilities\n3. On-prem deployment options\n\nThey want a technical deep-dive this week. This is a Tier 1 opportunity — please prioritise.\n\nPriya Sharma\nSales Development Rep",
    source: "internal",
    time: "1 hr ago",
    priority: "high",
    intent: "technical-review",
    sentiment: "positive",
    urgencyScore: 88,
    entities: { company: "Buildcraft Solutions", budget: "$120M revenue company", timeline: "This week", contactName: "Head of Digital" },
    routeTo: { name: "John Smith", role: "Solutions Architect", initials: "JC", color: "bg-blue-600" },
    suggestedActions: [
      { label: "Create Opportunity", icon: UserPlus, variant: "default" },
      { label: "Prep Tech Brief", icon: FileText, variant: "outline" },
      { label: "Book Demo Room", icon: Calendar, variant: "outline" },
    ],
    draftReply: "Thanks Priya — great catch! 🎯\n\nI've automatically:\n✅ Created a Tier 1 opportunity in CRM\n✅ Pulled Buildcraft's tech stack profile (they use Procore + Aconex)\n✅ Flagged John Smith for the technical deep-dive\n✅ Pre-loaded the API integration demo environment\n\nJames — can you confirm availability for Wed or Thu this week?\n\n— alfred ai",
    isRead: false,
    isProcessed: false,
  },
  {
    id: "e5",
    from: "Tom Bradley",
    fromEmail: "tom.b@alfredai.internal",
    subject: "Need updated case studies for client meeting tomorrow",
    preview: "Hey team, meeting with Horizon Property Group tomorrow at 10am. Need the latest construction case studies...",
    body: "Hey team,\n\nI have a meeting with Horizon Property Group tomorrow at 10am and need:\n\n• Latest construction automation case studies (preferably property management)\n• Updated ROI calculator with Q2 figures\n• One-pager on our voice AI integration\n\nCan someone pull these together by end of day?\n\nThanks,\nTom Bradley\nSenior Account Manager",
    source: "internal",
    time: "2 hrs ago",
    priority: "normal",
    intent: "internal-request",
    sentiment: "neutral",
    urgencyScore: 60,
    entities: { company: "Horizon Property Group", timeline: "Tomorrow 10am", contactName: "Tom Bradley" },
    routeTo: { name: "Nina Patel", role: "Marketing Ops", initials: "NP", color: "bg-violet-600" },
    suggestedActions: [
      { label: "Auto-Compile Pack", icon: FileText, variant: "default" },
      { label: "Notify Marketing", icon: Send, variant: "outline" },
      { label: "Set Reminder", icon: Clock, variant: "outline" },
    ],
    draftReply: "Hi Tom,\n\nI've auto-compiled your meeting pack:\n\n📄 3 property management case studies (incl. Landmark Group — 40% cost reduction)\n📊 ROI calculator updated with Q2 actuals\n📋 Voice AI one-pager (v3.2, updated last week)\n\nAll files are in your shared drive under /Horizon Property Group/. Nina from Marketing has been CC'd in case you need any customisation.\n\nGood luck with the meeting!\n\n— alfred ai",
    isRead: false,
    isProcessed: false,
  },
  {
    id: "e6",
    from: "Rachel Kim",
    fromEmail: "r.kim@ascentbuilders.com",
    subject: "URGENT: System downtime during critical project phase",
    preview: "We're experiencing intermittent outages on the workflow module. This is impacting our $2M deadline...",
    body: "To whom it may concern,\n\nWe're experiencing intermittent outages on the workflow automation module since this morning. This is impacting our $2M hospital fitout project which has a hard deadline next Friday.\n\nOur team of 25 cannot process approvals or generate reports. This is CRITICAL — we need immediate resolution or we face contractual penalties.\n\nPlease escalate this immediately.\n\nRachel Kim\nOperations Director, Ascent Builders",
    source: "external",
    time: "3 hrs ago",
    priority: "urgent",
    intent: "escalation",
    sentiment: "frustrated",
    urgencyScore: 98,
    entities: { company: "Ascent Builders", budget: "$2M project", timeline: "Next Friday deadline", contactName: "Rachel Kim", phone: "+61 4XX XXX XXX" },
    routeTo: { name: "Chris Nguyen", role: "Support Lead", initials: "CN", color: "bg-red-600" },
    suggestedActions: [
      { label: "Escalate to Engineering", icon: AlertTriangle, variant: "default" },
      { label: "Send Status Update", icon: Reply, variant: "outline" },
      { label: "Create P1 Ticket", icon: Shield, variant: "outline" },
    ],
    draftReply: "Dear Rachel,\n\nThank you for flagging this — I understand the urgency and the impact on your hospital fitout project.\n\nI've immediately:\n🚨 Created a P1 support ticket (#TK-4892)\n🔧 Escalated to our engineering on-call team\n📞 Chris Nguyen (Support Lead) will call you within 15 minutes\n\nIn the meantime, your team can use our backup approval workflow at backup.alfred.ai — I've sent login details to your registered email.\n\nWe take this very seriously and will provide status updates every 30 minutes until resolved.\n\nAlfredAI — Critical Response Team",
    isRead: false,
    isProcessed: false,
  },
];

const PRIORITY_CONFIG: Record<Priority, { label: string; className: string; icon: React.ElementType }> = {
  urgent: { label: "Urgent", className: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30", icon: AlertTriangle },
  high: { label: "High", className: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30", icon: TrendingUp },
  normal: { label: "Normal", className: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30", icon: Mail },
  low: { label: "Low", className: "bg-muted text-muted-foreground border-border", icon: Clock },
};

const INTENT_LABELS: Record<Intent, string> = {
  "new-enquiry": "New Enquiry",
  "pricing": "Pricing Request",
  "follow-up": "Follow-up",
  "escalation": "Escalation",
  "internal-request": "Internal Request",
  "technical-review": "Technical Review",
};

const SENTIMENT_CONFIG: Record<Sentiment, { label: string; color: string }> = {
  positive: { label: "Positive", color: "text-emerald-500" },
  neutral: { label: "Neutral", color: "text-blue-500" },
  negative: { label: "Negative", color: "text-amber-500" },
  frustrated: { label: "Frustrated", color: "text-red-500" },
};

type FilterKey = "all" | "external" | "internal" | "urgent";

// ─── Component ───────────────────────────────────────────────
export default function EmailTriageDemo() {
  const { applySpeed } = useDemoSpeed();
  const [processedEmails, setProcessedEmails] = useState<TriagedEmail[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [showDraft, setShowDraft] = useState(false);
  const [autoPhase, setAutoPhase] = useState(0); // index into MOCK_EMAILS during auto-play
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const listRef = useRef<HTMLDivElement>(null);

  // Auto-play: add emails one-by-one with processing animation
  useEffect(() => {
    if (autoPhase >= MOCK_EMAILS.length) return;

    const email = { ...MOCK_EMAILS[autoPhase] };

    // Phase A: show as "processing"
    timerRef.current = setTimeout(() => {
      setProcessingId(email.id);
      setProcessedEmails(prev => [...prev, { ...email, isProcessed: false }]);

      // Phase B: mark processed, select it
      timerRef.current = setTimeout(() => {
        setProcessedEmails(prev =>
          prev.map(e => e.id === email.id ? { ...e, isProcessed: true } : e)
        );
        setProcessingId(null);
        setSelectedId(email.id);
        setShowDraft(false);

        // Phase C: move to next
        timerRef.current = setTimeout(() => {
          setAutoPhase(p => p + 1);
        }, applySpeed(2200));
      }, applySpeed(1200));
    }, applySpeed(autoPhase === 0 ? 800 : 1800));

    return () => clearTimeout(timerRef.current);
  }, [autoPhase, applySpeed]);

  const selectedEmail = processedEmails.find(e => e.id === selectedId);

  const filtered = processedEmails.filter(e => {
    if (filter === "external") return e.source === "external";
    if (filter === "internal") return e.source === "internal";
    if (filter === "urgent") return e.priority === "urgent";
    return true;
  });

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
    setShowDraft(false);
    setProcessedEmails(prev => prev.map(e => e.id === id ? { ...e, isRead: true } : e));
  }, []);

  const filters: { key: FilterKey; label: string; count: number }[] = [
    { key: "all", label: "All", count: processedEmails.length },
    { key: "external", label: "External", count: processedEmails.filter(e => e.source === "external").length },
    { key: "internal", label: "Internal", count: processedEmails.filter(e => e.source === "internal").length },
    { key: "urgent", label: "Urgent", count: processedEmails.filter(e => e.priority === "urgent").length },
  ];

  return (
    <div className="flex flex-col h-full min-h-[500px] max-h-[calc(100vh-120px)] max-w-[1920px] mx-auto">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30 gap-2 flex-wrap flex-shrink-0">
        <div className="flex items-center gap-2">
          <Inbox className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Alfred Smart Inbox</span>
          <Badge variant="secondary" className="text-[10px]">AI Triage</Badge>
        </div>
        <div className="flex items-center gap-2">
          <InlineDemoSpeedControl compact />
          {processedEmails.length < MOCK_EMAILS.length && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="w-3 h-3 animate-spin" />
              Processing emails…
            </div>
          )}
        </div>
      </div>

      {/* Main split */}
      <div className="flex flex-1 min-h-0 overflow-hidden flex-col md:flex-row">
        {/* LEFT: Inbox */}
        <div className="w-full md:w-[40%] border-r border-border flex flex-col min-h-[250px]">
          {/* Filter chips */}
          <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border overflow-x-auto">
            <Filter className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            {filters.map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "text-xs px-2.5 py-1 rounded-full whitespace-nowrap min-h-[32px] transition-colors font-medium",
                  filter === f.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {f.label} {f.count > 0 && <span className="ml-0.5 opacity-70">({f.count})</span>}
              </button>
            ))}
          </div>

          {/* Email list */}
          <div ref={listRef} className="flex-1 overflow-y-auto touch-pan-y overscroll-contain">
            <AnimatePresence>
              {filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-sm">
                  <Mail className="w-8 h-8 mb-2 opacity-40" />
                  <span>Waiting for emails…</span>
                </div>
              )}
              {filtered.map(email => {
                const pCfg = PRIORITY_CONFIG[email.priority];
                const isSelected = selectedId === email.id;
                const isProcessing = processingId === email.id && !email.isProcessed;

                return (
                  <motion.button
                    key={email.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    onClick={() => handleSelect(email.id)}
                    className={cn(
                      "w-full text-left px-3 py-3 border-b border-border transition-colors min-h-[64px]",
                      isSelected ? "bg-primary/10" : "hover:bg-muted/50",
                      !email.isRead && "bg-primary/5"
                    )}
                  >
                    <div className="flex items-start gap-2">
                      {/* Priority dot */}
                      <div className={cn(
                        "w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0",
                        email.priority === "urgent" && "bg-red-500",
                        email.priority === "high" && "bg-amber-500",
                        email.priority === "normal" && "bg-blue-500",
                        email.priority === "low" && "bg-muted-foreground/40",
                      )} />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className={cn("text-sm truncate", !email.isRead && "font-semibold")}>
                            {email.from}
                          </span>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap">{email.time}</span>
                        </div>
                        <p className={cn("text-xs truncate mt-0.5", !email.isRead ? "text-foreground" : "text-muted-foreground")}>
                          {email.subject}
                        </p>

                        {/* Badges row */}
                        {email.isProcessed ? (
                          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                            <span className={cn("inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full border font-medium", pCfg.className)}>
                              <pCfg.icon className="w-2.5 h-2.5" />
                              {pCfg.label}
                            </span>
                            <Badge variant="secondary" className="text-[10px] py-0">
                              {INTENT_LABELS[email.intent]}
                            </Badge>
                            <Badge variant={email.source === "internal" ? "outline" : "secondary"} className="text-[10px] py-0">
                              {email.source === "internal" ? "Internal" : "External"}
                            </Badge>
                          </div>
                        ) : isProcessing ? (
                          <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-primary">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Classifying…
                          </div>
                        ) : null}
                      </div>

                      {isSelected && <ChevronRight className="w-4 h-4 text-primary mt-1 flex-shrink-0" />}
                    </div>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* RIGHT: Triage Dashboard */}
        <div className="flex-1 overflow-y-auto touch-pan-y overscroll-contain bg-background">
          {selectedEmail ? (
            <motion.div
              key={selectedEmail.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
              className="p-4 space-y-4"
            >
              {/* Email header */}
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-base leading-snug">{selectedEmail.subject}</h3>
                  {selectedEmail.isProcessed && (
                    <span className={cn("inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-medium flex-shrink-0", PRIORITY_CONFIG[selectedEmail.priority].className)}>
                      {PRIORITY_CONFIG[selectedEmail.priority].label}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <span>{selectedEmail.from}</span>
                  <span>•</span>
                  <span>{selectedEmail.fromEmail}</span>
                  <span>•</span>
                  <span>{selectedEmail.time}</span>
                </div>
              </div>

              {/* Email body */}
              <ScrollFadeContainer maxHeight="250px" className="bg-muted/30 rounded-lg border border-border">
                <div className="p-4 text-sm whitespace-pre-line leading-relaxed">
                  {selectedEmail.body}
                </div>
              </ScrollFadeContainer>

              {selectedEmail.isProcessed && (
                <>
                  {/* AI Analysis */}
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Bot className="w-4 h-4 text-primary" />
                      <span className="text-sm font-semibold">AI Analysis</span>
                      <Sparkles className="w-3 h-3 text-primary" />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Intent</span>
                        <p className="text-xs font-medium">{INTENT_LABELS[selectedEmail.intent]}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Sentiment</span>
                        <p className={cn("text-xs font-medium", SENTIMENT_CONFIG[selectedEmail.sentiment].color)}>
                          {SENTIMENT_CONFIG[selectedEmail.sentiment].label}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Urgency</span>
                        <div className="flex items-center gap-2">
                          <Progress value={selectedEmail.urgencyScore} className="h-1.5 flex-1" />
                          <span className="text-xs font-mono font-medium">{selectedEmail.urgencyScore}%</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Source</span>
                        <p className="text-xs font-medium capitalize">{selectedEmail.source}</p>
                      </div>
                    </div>

                    {/* Extracted entities */}
                    <div className="space-y-1.5 pt-2 border-t border-primary/10">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Key Entities</span>
                      <div className="flex flex-wrap gap-2">
                        {selectedEmail.entities.company && (
                          <span className="inline-flex items-center gap-1 text-xs bg-background px-2 py-1 rounded border border-border">
                            <Building2 className="w-3 h-3 text-muted-foreground" />
                            {selectedEmail.entities.company}
                          </span>
                        )}
                        {selectedEmail.entities.budget && (
                          <span className="inline-flex items-center gap-1 text-xs bg-background px-2 py-1 rounded border border-border">
                            <DollarSign className="w-3 h-3 text-muted-foreground" />
                            {selectedEmail.entities.budget}
                          </span>
                        )}
                        {selectedEmail.entities.timeline && (
                          <span className="inline-flex items-center gap-1 text-xs bg-background px-2 py-1 rounded border border-border">
                            <Calendar className="w-3 h-3 text-muted-foreground" />
                            {selectedEmail.entities.timeline}
                          </span>
                        )}
                        {selectedEmail.entities.contactName && (
                          <span className="inline-flex items-center gap-1 text-xs bg-background px-2 py-1 rounded border border-border">
                            <User className="w-3 h-3 text-muted-foreground" />
                            {selectedEmail.entities.contactName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Routing */}
                  <div className="rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white", selectedEmail.routeTo.color)}>
                          {selectedEmail.routeTo.initials}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{selectedEmail.routeTo.name}</p>
                          <p className="text-xs text-muted-foreground">{selectedEmail.routeTo.role}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        <ArrowRight className="w-3 h-3 mr-1" />
                        Routed
                      </Badge>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    {selectedEmail.suggestedActions.map((action, i) => (
                      <Button
                        key={i}
                        variant={i === 0 ? "default" : "outline"}
                        size="sm"
                        className="text-xs min-h-[36px]"
                        onClick={() => i === 0 && setShowDraft(!showDraft)}
                      >
                        <action.icon className="w-3.5 h-3.5 mr-1.5" />
                        {action.label}
                      </Button>
                    ))}
                  </div>

                  {/* Draft reply */}
                  <AnimatePresence>
                    {showDraft && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden min-h-0"
                      >
                        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-2">
                          <div className="flex items-center gap-2">
                            <Reply className="w-4 h-4 text-emerald-500" />
                            <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">AI-Drafted Response</span>
                          </div>
                          <ScrollFadeContainer maxHeight="200px">
                            <div className="text-sm whitespace-pre-line leading-relaxed text-foreground/80">
                              {selectedEmail.draftReply}
                            </div>
                          </ScrollFadeContainer>
                          <div className="flex gap-2 pt-2">
                            <Button size="sm" className="text-xs min-h-[36px]">
                              <Send className="w-3.5 h-3.5 mr-1.5" />
                              Send Response
                            </Button>
                            <Button variant="outline" size="sm" className="text-xs min-h-[36px]">
                              Edit Draft
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-16 text-muted-foreground">
              <MailOpen className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm font-medium">Select an email to view triage analysis</p>
              <p className="text-xs mt-1 opacity-60">Emails are being classified by alfred ai…</p>
            </div>
          )}
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-muted/30 text-[11px] text-muted-foreground flex-wrap gap-2 flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> <span className="tabular-nums">{processedEmails.filter(e => e.isProcessed).length}</span> classified</span>
          <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-red-500" /> <span className="tabular-nums">{processedEmails.filter(e => e.priority === "urgent").length}</span> urgent</span>
          <span className="flex items-center gap-1"><ArrowUpRight className="w-3 h-3 text-blue-500" /> <span className="tabular-nums">{processedEmails.filter(e => e.isProcessed).length}</span> routed</span>
        </div>
        <span className="flex items-center gap-1">
          <Zap className="w-3 h-3 text-primary" />
          Avg. triage time: 1.2s
        </span>
      </div>
    </div>
  );
}
