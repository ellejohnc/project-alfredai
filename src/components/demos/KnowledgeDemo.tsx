import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import {
  Search, FileText, Database, Clock, Shield, Sparkles, 
  Filter, Download, Share2, BookOpen, Folder, Users,
  TrendingUp, AlertCircle, CheckCircle2, ChevronRight,
  MessageSquare, ThumbsUp, ThumbsDown, Copy, ExternalLink,
  FileSpreadsheet, FileIcon, Presentation, Building2, Loader2,
  X, Eye, Star, BarChart3, Table, Link2, History
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DragScrollArea } from "@/components/ui/drag-scroll-area";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type DocumentResult = {
  id: number;
  title: string;
  source: string;
  sourceIcon: typeof FileText;
  type: string;
  typeIcon: typeof FileText;
  relevance: number;
  snippet: string;
  date: string;
  author: string;
  department: string;
  accessLevel: "public" | "team" | "restricted";
  tags: string[];
};

const connectedSources = [
  { name: "SharePoint", count: 2847, icon: Folder, color: "text-blue-500" },
  { name: "Google Drive", count: 1523, icon: Database, color: "text-green-500" },
  { name: "Confluence", count: 892, icon: BookOpen, color: "text-blue-400" },
  { name: "Notion", count: 456, icon: FileText, color: "text-gray-500" },
  { name: "Slack", count: 12500, icon: MessageSquare, color: "text-purple-500" },
];

const sourceIconMap: Record<string, typeof FileText> = {
  SharePoint: Folder,
  "Google Drive": Database,
  Confluence: BookOpen,
  Notion: FileText,
};

const typeIconMap: Record<string, typeof FileText> = {
  Excel: FileSpreadsheet,
  PDF: FileIcon,
  Doc: FileText,
  PPT: Presentation,
};

const popularQueries = [
  { query: "What was our Q3 revenue in APAC?", category: "Finance" },
  { query: "How does employee onboarding work?", category: "HR" },
  { query: "What are our SOC 2 compliance requirements?", category: "Legal" },
  { query: "What's in the enterprise sales playbook?", category: "Sales" },
  { query: "What's on the product roadmap for 2025?", category: "Product" },
  { query: "What are our customer success metrics?", category: "CS" },
];

const departments = ["All", "Finance", "Sales", "HR", "Product", "Legal", "CS", "Engineering"];

// Document content generator based on document type
const getDocumentContent = (doc: DocumentResult) => {
  const contents: Record<string, any> = {
    "Q3 2024 Revenue Report - APAC Region": {
      summary: "Comprehensive analysis of Q3 2024 financial performance across the Asia-Pacific region, including revenue breakdown by country, product line, and customer segment.",
      sections: [
        { title: "Executive Summary", content: "Q3 2024 marked a significant milestone for ACME Corporation in the APAC region. Total revenue reached $5.8M, representing a 31% year-over-year growth rate. This performance exceeded our quarterly target by 15%, driven primarily by enterprise contracts in Singapore and Australia." },
        { title: "Revenue by Country", content: "Singapore: $2.1M (36% of total)\nAustralia: $1.8M (31% of total)\nJapan: $1.2M (21% of total)\nOther APAC: $0.7M (12% of total)" },
        { title: "Key Growth Drivers", content: "1. Enterprise tier adoption increased by 45%\n2. Strategic partnership with Salesforce driving 23 new accounts\n3. Expansion of existing customers contributing 35% of new revenue\n4. Launch of Japanese language support in August" },
        { title: "Customer Metrics", content: "New logos: 47 accounts\nExpansion deals: 28 accounts\nChurn: 2.1% (down from 3.4% in Q2)\nNet Revenue Retention: 124%" }
      ],
      metrics: [
        { label: "Total Revenue", value: "$5.8M", change: "+31%" },
        { label: "New Customers", value: "47", change: "+18%" },
        { label: "Avg Deal Size", value: "$124K", change: "+12%" },
        { label: "NRR", value: "124%", change: "+6pts" }
      ],
      relatedDocs: ["APAC Sales Strategy & Expansion Plan", "Q2 2024 Revenue Report", "Board Presentation - Q3 Review"],
      lastViewed: ["Jane Smith", "Michael Lee", "David Lee"]
    },
    "Q4 2024 Financial Targets & Forecast": {
      summary: "Strategic financial targets and projections for Q4 2024, including revenue goals, expense budgets, and key performance indicators.",
      sections: [
        { title: "Q4 Targets Overview", content: "Revenue Target: $16.5M globally\n- APAC: $6.8M\n- EMEA: $4.9M\n- Americas: $4.8M\n\nGross Margin Target: 80%\nOperating Expenses: $12.2M" },
        { title: "Investment Priorities", content: "1. Product Development: $3.2M (AI Copilot v2)\n2. Sales & Marketing: $4.8M (Enterprise expansion)\n3. Customer Success: $1.8M (Retention programs)\n4. Infrastructure: $1.2M (SOC 2 compliance)" },
        { title: "Risk Factors", content: "- Currency fluctuation in APAC markets\n- Competitive pressure from Competitor A\n- Longer enterprise sales cycles in EMEA\n- Potential economic headwinds in tech sector" }
      ],
      metrics: [
        { label: "Revenue Target", value: "$16.5M", change: "+16%" },
        { label: "Pipeline", value: "$82M", change: "5x coverage" },
        { label: "Headcount", value: "485", change: "+65" },
        { label: "Burn Rate", value: "$2.1M/mo", change: "-8%" }
      ],
      relatedDocs: ["Q3 2024 Revenue Report", "Annual Planning 2025", "Investor Presentation"],
      lastViewed: ["James Liu", "CFO Team", "Board Members"]
    },
    "APAC Sales Strategy & Expansion Plan": {
      summary: "Detailed strategic plan for APAC market expansion, including target segments, go-to-market approach, and partnership strategy.",
      sections: [
        { title: "Market Opportunity", content: "Total Addressable Market: $2.8B\nServiceable Market: $840M\nTarget Market Share by 2025: 8%\n\nKey verticals: Financial Services, Technology, Healthcare, Manufacturing" },
        { title: "Go-to-Market Strategy", content: "1. Enterprise-first approach in Singapore and Australia\n2. Partner-led expansion in Japan and Korea\n3. Digital-led motion for mid-market segment\n4. Strategic alliances with regional system integrators" },
        { title: "Team Structure", content: "Current: 45 employees\nQ4 Target: 62 employees\n\n- Enterprise AEs: 12 → 18\n- SDRs: 8 → 12\n- Solutions Engineers: 6 → 10\n- Customer Success: 10 → 14" },
        { title: "Q4 Priorities", content: "1. Close 25 enterprise deals ($100K+ ACV)\n2. Launch partner program with 3 regional SIs\n3. Achieve 150% pipeline coverage\n4. Reduce sales cycle to <90 days" }
      ],
      metrics: [
        { label: "Pipeline", value: "$24M", change: "+42%" },
        { label: "Win Rate", value: "34%", change: "+5pts" },
        { label: "ACV", value: "$118K", change: "+15%" },
        { label: "Sales Cycle", value: "98 days", change: "-12 days" }
      ],
      relatedDocs: ["Enterprise Sales Playbook", "Partner Program Guide", "Competitive Analysis"],
      lastViewed: ["Michael Lee", "VP Sales APAC", "Regional Directors"]
    },
    "Enterprise Sales Playbook v4.1": {
      summary: "Comprehensive sales methodology and best practices for closing enterprise deals, including discovery frameworks, demo guidelines, and objection handling.",
      sections: [
        { title: "MEDDIC Framework", content: "M - Metrics: Quantify business impact\nE - Economic Buyer: Identify decision maker\nD - Decision Criteria: Understand evaluation process\nD - Decision Process: Map procurement timeline\nI - Identify Pain: Uncover critical business challenges\nC - Champion: Develop internal advocate" },
        { title: "Discovery Call Template", content: "1. Build rapport (5 min)\n2. Set agenda and outcomes (2 min)\n3. Current state assessment (15 min)\n4. Future state vision (10 min)\n5. Quantify impact (10 min)\n6. Next steps (3 min)" },
        { title: "Demo Best Practices", content: "- Limit to 3 key pain points\n- Keep demo under 45 minutes\n- Start with 'wow moment' in first 5 minutes\n- Involve champion in demo preparation\n- Always end with clear next steps" },
        { title: "Common Objections", content: "1. 'Too expensive' → ROI calculator, payment terms\n2. 'Not the right time' → Cost of delay analysis\n3. 'Need to see competitors' → Competitive battle card\n4. 'Security concerns' → SOC 2, security whitepaper" }
      ],
      metrics: [
        { label: "Win Rate", value: "38%", change: "+8pts" },
        { label: "Avg Deal Size", value: "$95K", change: "+22%" },
        { label: "Sales Cycle", value: "78 days", change: "-15 days" },
        { label: "Quota Attainment", value: "112%", change: "+18pts" }
      ],
      relatedDocs: ["Competitive Battle Cards", "ROI Calculator Guide", "Customer Case Studies"],
      lastViewed: ["Sales Team", "New Hire Cohort", "Sales Enablement"]
    },
    "Employee Onboarding Guide 2024": {
      summary: "Complete guide for new employee onboarding including first-day checklist, training schedules, and 90-day success milestones.",
      sections: [
        { title: "Week 1: Foundation", content: "Day 1:\n- IT setup and security training\n- HR orientation and benefits enrollment\n- Meet your manager and team\n- Office tour and workspace setup\n\nDays 2-5:\n- Company overview and mission\n- Product training modules\n- Shadow sessions with team members" },
        { title: "Week 2-4: Integration", content: "- Buddy program pairing\n- Role-specific training completion\n- First project assignment\n- Cross-functional introductions\n- 30-day check-in with HR" },
        { title: "Day 90 Checkpoint", content: "Performance checkpoint covering:\n- Role proficiency assessment\n- Cultural alignment review\n- Goal setting for next quarter\n- Feedback collection (360)\n- Probation completion" },
        { title: "Resources", content: "- IT Help Desk: it-support@acme.com\n- HR Questions: hr@acme.com\n- Buddy Program Coordinator: Lisa Park\n- Learning Portal: learn.acme.internal" }
      ],
      metrics: [
        { label: "Completion Rate", value: "94%", change: "+3pts" },
        { label: "Satisfaction", value: "4.8/5", change: "+0.2" },
        { label: "Time to Productivity", value: "21 days", change: "-4 days" },
        { label: "Retention (90d)", value: "96%", change: "+2pts" }
      ],
      relatedDocs: ["Benefits Overview", "Company Handbook", "IT Security Policy"],
      lastViewed: ["New Hires", "HR Team", "Managers"]
    },
    "Benefits & Compensation Overview": {
      summary: "Complete overview of ACME Corporation's employee benefits, compensation philosophy, and total rewards program.",
      sections: [
        { title: "Health Benefits", content: "Medical Insurance: 100% premium covered for employees, 75% for dependents\nDental & Vision: Full coverage included\nLife Insurance: 2x annual salary\nDisability: Short-term and long-term coverage\nMental Health: EAP + 12 therapy sessions/year" },
        { title: "Financial Benefits", content: "401(k): 4% company match\nEquity: Stock options (vesting over 4 years)\nBonus: Performance-based, up to 20% of base\nReferral Bonus: $5,000 per successful hire" },
        { title: "Time Off & Flexibility", content: "PTO: Unlimited (min 15 days required)\nParental Leave: 16 weeks (birth), 8 weeks (non-birth)\nRemote Work: Hybrid or fully remote options\nSabbatical: 4 weeks after 5 years" },
        { title: "Perks & Development", content: "Learning Budget: $2,000/year\nHome Office Stipend: $500 one-time\nWellness Allowance: $100/month\nCommuter Benefits: Pre-tax transit/parking" }
      ],
      metrics: [
        { label: "Total Comp", value: "90th%ile", change: "Market" },
        { label: "Benefits Cost", value: "$18K", change: "/employee" },
        { label: "Satisfaction", value: "4.6/5", change: "+0.3" },
        { label: "Retention", value: "91%", change: "+4pts" }
      ],
      relatedDocs: ["Employee Handbook", "401k Plan Details", "Equity Grant Guide"],
      lastViewed: ["All Employees", "HR Team", "Finance"]
    },
    "Product Roadmap Q4 2024 - Q2 2025": {
      summary: "Strategic product roadmap covering upcoming features, platform enhancements, and technology investments.",
      sections: [
        { title: "Q4 2024 Releases", content: "October:\n- AI Copilot v2 with natural language workflows\n- Advanced analytics dashboard\n\nNovember:\n- Microsoft Teams native integration\n- Mobile app 2.0 with offline support\n\nDecember:\n- Performance optimizations\n- Security enhancements" },
        { title: "Q1 2025 Roadmap", content: "- Multi-language support (ES, FR, DE, JA)\n- Custom AI model training for enterprise\n- Enhanced audit logging\n- API v3 with GraphQL support" },
        { title: "Q2 2025 Vision", content: "- Industry templates (Healthcare, Finance)\n- Real-time collaboration features\n- Advanced data visualization\n- On-premise deployment option" },
        { title: "Technical Debt", content: "- Database migration to PostgreSQL 15\n- Frontend migration to React 18\n- Infrastructure move to multi-region\n- Security framework upgrade" }
      ],
      metrics: [
        { label: "Features", value: "24", change: "Planned" },
        { label: "Tech Debt", value: "18%", change: "-5pts" },
        { label: "Velocity", value: "42 pts", change: "+8 pts" },
        { label: "Quality", value: "99.9%", change: "Uptime" }
      ],
      relatedDocs: ["Technical Spec - AI Copilot", "API Documentation", "Architecture Overview"],
      lastViewed: ["Product Team", "Engineering", "Leadership"]
    },
    "AI Copilot Technical Specification": {
      summary: "Technical specification for AI Copilot v2, including architecture, model selection, and integration requirements.",
      sections: [
        { title: "Architecture Overview", content: "- LLM Layer: GPT-4 + custom fine-tuning\n- Vector DB: Pinecone for embeddings\n- Orchestration: LangChain framework\n- API: REST + WebSocket for streaming" },
        { title: "Core Capabilities", content: "1. Natural language workflow creation\n2. Intelligent task suggestions\n3. Document summarization\n4. Automated report generation\n5. Conversational interface" },
        { title: "Security Requirements", content: "- Data encryption at rest (AES-256)\n- TLS 1.3 for all communications\n- No customer data used for training\n- SOC 2 Type II compliance\n- GDPR data handling" },
        { title: "Performance Targets", content: "- Response time: <2 seconds (P95)\n- Accuracy: >95% task completion\n- Availability: 99.9% uptime\n- Concurrent users: 10,000+" }
      ],
      metrics: [
        { label: "Accuracy", value: "96.2%", change: "+2.1%" },
        { label: "Latency", value: "1.4s", change: "-0.3s" },
        { label: "Adoption", value: "78%", change: "+15%" },
        { label: "NPS", value: "72", change: "+8pts" }
      ],
      relatedDocs: ["Product Roadmap", "Security Whitepaper", "API Documentation"],
      lastViewed: ["Engineering", "Product", "Security Team"]
    },
    "Customer Success Playbook v3.2": {
      summary: "Customer success methodology for enterprise accounts including health scoring, QBR frameworks, and escalation procedures.",
      sections: [
        { title: "Health Score Methodology", content: "Product Usage (30%):\n- Daily active users\n- Feature adoption rate\n- API call volume\n\nEngagement (25%):\n- Support ticket trends\n- Community participation\n- Training completion" },
        { title: "QBR Framework", content: "1. Business review (15 min)\n2. Product adoption metrics (10 min)\n3. Success story sharing (10 min)\n4. Roadmap preview (10 min)\n5. Action items and next steps (10 min)" },
        { title: "Escalation Matrix", content: "P1 (Critical): 1-hour response, immediate page\nP2 (High): 4-hour response, team lead escalation\nP3 (Medium): 24-hour response, 5-day resolution\nP4 (Low): 48-hour response, best effort" },
        { title: "Expansion Playbook", content: "- Identify expansion signals in health data\n- Engage champions with new use cases\n- Conduct value realization workshops\n- Propose tailored expansion packages" }
      ],
      metrics: [
        { label: "NPS", value: "72", change: "+8pts" },
        { label: "CSAT", value: "4.6/5", change: "+0.2" },
        { label: "Retention", value: "97%", change: "+2pts" },
        { label: "Expansion", value: "118%", change: "NRR" }
      ],
      relatedDocs: ["Support Runbook", "Customer Onboarding", "Escalation Contacts"],
      lastViewed: ["CS Team", "Support", "Account Managers"]
    },
    "SOC 2 Compliance Documentation": {
      summary: "Comprehensive SOC 2 Type II compliance documentation including controls, audit results, and security policies.",
      sections: [
        { title: "Trust Service Criteria", content: "Security: Access controls, encryption, monitoring\nAvailability: Uptime SLAs, disaster recovery\nProcessing Integrity: Data validation, error handling\nConfidentiality: Data classification, access restrictions\nPrivacy: GDPR compliance, data retention" },
        { title: "Key Controls", content: "- Multi-factor authentication required\n- Role-based access control (RBAC)\n- Encryption at rest and in transit\n- Regular penetration testing\n- Security awareness training" },
        { title: "Audit Results (2024)", content: "Audit Period: Jan - Aug 2024\nAudit Firm: Ernst & Young\nResult: Unqualified opinion\nFindings: 0 critical, 2 minor observations\nRemediation: Completed October 2024" },
        { title: "Continuous Monitoring", content: "- Real-time security monitoring (24/7)\n- Quarterly vulnerability assessments\n- Annual penetration testing\n- Monthly access reviews\n- Incident response drills" }
      ],
      metrics: [
        { label: "Controls", value: "142", change: "Active" },
        { label: "Findings", value: "0", change: "Critical" },
        { label: "Uptime", value: "99.97%", change: "YTD" },
        { label: "Training", value: "100%", change: "Complete" }
      ],
      relatedDocs: ["Security Whitepaper", "Incident Response Plan", "Business Continuity Plan"],
      lastViewed: ["Security Team", "Compliance", "Legal"]
    },
    "ISO 27001 Audit Report 2024": {
      summary: "ISO 27001:2022 certification audit report including scope, findings, and certification status.",
      sections: [
        { title: "Certification Scope", content: "Covers all information security management systems for:\n- Cloud infrastructure and operations\n- Software development lifecycle\n- Customer data processing\n- Corporate IT systems" },
        { title: "Audit Summary", content: "Certification Body: BSI Group\nAudit Type: Surveillance audit\nAudit Date: September 2024\nResult: Certification maintained\nNext Audit: September 2025" },
        { title: "Key Findings", content: "Strengths:\n- Robust access management\n- Comprehensive security training\n- Effective incident response\n\nOpportunities:\n- Enhanced supplier risk assessment\n- Improved change management documentation" },
        { title: "Improvement Actions", content: "1. Update supplier assessment questionnaire\n2. Implement automated change tracking\n3. Enhance security metrics dashboard\n4. Expand penetration testing scope" }
      ],
      metrics: [
        { label: "Conformities", value: "98%", change: "+2%" },
        { label: "Non-conformities", value: "0", change: "Major" },
        { label: "Observations", value: "3", change: "Minor" },
        { label: "Certified", value: "Yes", change: "Active" }
      ],
      relatedDocs: ["SOC 2 Documentation", "Security Policy", "Risk Register"],
      lastViewed: ["Security Team", "Audit Committee", "Legal"]
    },
    "Board Presentation - Q3 Review": {
      summary: "Executive board presentation summarizing Q3 2024 performance, strategic initiatives, and outlook.",
      sections: [
        { title: "Q3 Highlights", content: "• Revenue: $14.2M (+23% YoY)\n• ARR: $48M (exceeding $45M target)\n• New logos: 127 customers\n• NRR: 118%\n• Cash position: $82M" },
        { title: "Regional Performance", content: "APAC: Exceeded target by 15%, fastest growing\nEMEA: On track, strong pipeline\nAmericas: Slight miss, recovering in Q4" },
        { title: "Strategic Initiatives", content: "1. Series C closed: $75M from Sequoia\n2. AI Copilot beta: 92% positive feedback\n3. Salesforce partnership launched\n4. Tokyo office opened" },
        { title: "Q4 Outlook", content: "Revenue target: $16.5M\nKey risks: EMEA macro, competition\nInvestment priorities: Product, APAC expansion\nBoard asks: None at this time" }
      ],
      metrics: [
        { label: "Revenue", value: "$14.2M", change: "+23% YoY" },
        { label: "ARR", value: "$48M", change: "+31%" },
        { label: "Cash", value: "$82M", change: "+$75M" },
        { label: "Burn", value: "$2.1M", change: "/month" }
      ],
      relatedDocs: ["Q3 Revenue Report", "Investor Deck", "Annual Strategy"],
      lastViewed: ["Board Members", "Executive Team", "Investors"]
    }
  };

  // Default content for documents not explicitly defined
  return contents[doc.title] || {
    summary: `This ${doc.type} document from ${doc.source} contains information related to ${doc.department} operations and was authored by ${doc.author}.`,
    sections: [
      { title: "Document Overview", content: doc.snippet },
      { title: "Key Information", content: `This document was last updated ${doc.date} and is classified as ${doc.accessLevel} access. It's stored in ${doc.source} under the ${doc.department} department.` },
      { title: "Related Topics", content: doc.tags.join(", ") }
    ],
    metrics: [
      { label: "Views", value: "247", change: "Last 30d" },
      { label: "Downloads", value: "18", change: "Last 30d" },
      { label: "Shares", value: "12", change: "Last 30d" },
      { label: "Relevance", value: `${doc.relevance}%`, change: "Match" }
    ],
    relatedDocs: ["Company Knowledge Base"],
    lastViewed: [doc.author, "Knowledge Team"]
  };
};

export default function KnowledgeDemo() {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<DocumentResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedResult, setSelectedResult] = useState<DocumentResult | null>(null);
  const [showAIAnswer, setShowAIAnswer] = useState(false);
  const [aiGeneratedAnswer, setAiGeneratedAnswer] = useState("");
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [aiError, setAiError] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<DocumentResult | null>(null);

  const handleSearch = useCallback(async (searchQuery: string) => {
    setQuery(searchQuery);
    setIsSearching(true);
    setShowResults(false);
    setShowAIAnswer(false);
    setSelectedResult(null);
    setAiGeneratedAnswer("");
    setAiInsights([]);
    setAiError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('knowledge-search', {
        body: { 
          query: searchQuery,
          department: selectedDepartment
        }
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      // Set the AI answer
      setAiGeneratedAnswer(data.answer || "I couldn't find a specific answer to that question.");
      setAiInsights(data.insights || []);
      setShowAIAnswer(true);

      // Transform related docs to results format
      const transformedResults: DocumentResult[] = (data.relatedDocs || []).map((doc: any, index: number) => ({
        id: index + 1,
        title: doc.title,
        source: doc.source,
        sourceIcon: sourceIconMap[doc.source] || FileText,
        type: doc.type,
        typeIcon: typeIconMap[doc.type] || FileText,
        relevance: doc.relevance,
        snippet: `Relevant ${doc.type} document from ${doc.source} containing information related to your query about "${searchQuery}".`,
        date: doc.date,
        author: doc.author,
        department: doc.department,
        accessLevel: doc.accessLevel,
        tags: doc.tags || [],
      }));

      setResults(transformedResults);
      setShowResults(true);

    } catch (error) {
      console.error('Knowledge search error:', error);
      setAiError(error instanceof Error ? error.message : 'Failed to search knowledge base');
      toast.error("Search failed", {
        description: error instanceof Error ? error.message : 'Please try again'
      });
    } finally {
      setIsSearching(false);
    }
  }, [selectedDepartment]);

  const handleCopyAnswer = () => {
    navigator.clipboard.writeText(aiGeneratedAnswer.replace(/\*\*/g, '').replace(/\*/g, ''));
    toast.success("Answer copied to clipboard");
  };

  const handleFeedback = (positive: boolean) => {
    toast.success(positive ? "Thanks for the feedback!" : "We'll improve this answer");
  };

  const getAccessBadge = (level: "public" | "team" | "restricted") => {
    const styles = {
      public: "bg-green-500/10 text-green-600 border-green-200",
      team: "bg-blue-500/10 text-blue-600 border-blue-200",
      restricted: "bg-amber-500/10 text-amber-600 border-amber-200",
    };
    const labels = { public: "Public", team: "Team", restricted: "Restricted" };
    return <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", styles[level])}>{labels[level]}</Badge>;
  };

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-lg">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Knowledge Intelligence</h3>
              <p className="text-xs text-muted-foreground">AI-powered search across your organization</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground bg-background/50 px-3 py-1.5 rounded-full border border-border">
              <CheckCircle2 className="w-3 h-3 text-green-500" />
              <span><span className="tabular-nums">{connectedSources.reduce((a, b) => a + b.count, 0).toLocaleString()}</span> docs indexed</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-background/50 px-3 py-1.5 rounded-full border border-border">
              <Shield className="w-3 h-3 text-primary" />
              <span>SOC 2</span>
            </div>
          </div>
        </div>

        {/* Connected Sources */}
        <DragScrollArea className="mt-4" contentClassName="pb-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground shrink-0">Sources:</span>
            {connectedSources.map((source) => (
              <div key={source.name} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/60 border border-border/50 text-xs shrink-0">
                <source.icon className={cn("w-3 h-3", source.color)} />
                <span className="text-foreground/80">{source.name}</span>
                <span className="text-muted-foreground tabular-nums">({source.count.toLocaleString()})</span>
              </div>
            ))}
          </div>
        </DragScrollArea>
      </div>

      {/* Search Area */}
      <div className="p-4 sm:p-6">
        {/* Search Input */}
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && query && handleSearch(query)}
              placeholder="Ask anything..."
              className="pl-10 sm:pl-12 pr-4 h-12 sm:h-14 rounded-xl text-sm sm:text-base border-2 focus:border-primary/50"
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={cn("h-10 sm:h-8 px-3 text-xs flex-1 sm:flex-none", showFilters && "bg-primary/10 text-primary")}
            >
              <Filter className="w-3.5 h-3.5 mr-1" />
              Filters
            </Button>
            <Button 
              size="sm" 
              onClick={() => query && handleSearch(query)}
              disabled={!query || isSearching}
              className="h-10 sm:h-8 px-4 sm:px-4 flex-1 sm:flex-none"
            >
              {isSearching ? (
                <Sparkles className="w-4 h-4 animate-pulse" />
              ) : (
                "Search"
              )}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 overflow-hidden"
            >
              <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted-foreground mr-2">Department:</span>
                  {departments.map((dept) => (
                    <button
                      key={dept}
                      onClick={() => setSelectedDepartment(dept)}
                      className={cn(
                        "px-3 py-1 text-xs rounded-full transition-colors",
                        selectedDepartment === dept
                          ? "bg-primary text-primary-foreground"
                          : "bg-background border border-border text-muted-foreground hover:border-primary/50"
                      )}
                    >
                      {dept}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Queries - Only show when no results */}
        {!showResults && !isSearching && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div>
              <p className="text-xs text-muted-foreground mb-3 flex items-center gap-2">
                <TrendingUp className="w-3 h-3" />
                Popular searches in your organization
              </p>
              <div className="space-y-2">
                {popularQueries.map((item) => (
                  <button
                    key={item.query}
                    onClick={() => handleSearch(item.query)}
                    className="group w-full flex items-center justify-between gap-2 px-3 sm:px-4 py-2.5 sm:py-2 bg-muted/50 rounded-xl text-sm text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all border border-transparent hover:border-primary/20"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Search className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate text-left">{item.query}</span>
                    </div>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-background shrink-0">
                      {item.category}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border/50">
              <div className="text-center p-3 rounded-xl bg-muted/30">
                <div className="text-2xl font-bold text-foreground tabular-nums">18K+</div>
                <div className="text-xs text-muted-foreground">Documents</div>
              </div>
              <div className="text-center p-3 rounded-xl bg-muted/30">
                <div className="text-2xl font-bold text-foreground tabular-nums">5</div>
                <div className="text-xs text-muted-foreground">Sources</div>
              </div>
              <div className="text-center p-3 rounded-xl bg-muted/30">
                <div className="text-2xl font-bold text-foreground tabular-nums">0.8s</div>
                <div className="text-xs text-muted-foreground">Avg. Response</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Loading State */}
        {isSearching && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-12"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                </div>
                <motion.div
                  className="absolute inset-0 rounded-2xl border-2 border-primary/30"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground mb-1">Analyzing your query...</p>
                <p className="text-xs text-muted-foreground">Searching across 5 connected sources</p>
              </div>
              <div className="flex gap-1">
                {connectedSources.slice(0, 5).map((source, i) => (
                  <motion.div
                    key={source.name}
                    className={cn("w-6 h-6 rounded-lg flex items-center justify-center bg-muted")}
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.5, delay: i * 0.1, repeat: Infinity }}
                  >
                    <source.icon className={cn("w-3 h-3", source.color)} />
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* AI Answer */}
        <AnimatePresence>
          {showAIAnswer && aiGeneratedAnswer && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-5 rounded-2xl bg-gradient-to-br from-primary/5 via-primary/10 to-indigo-500/5 border border-primary/20"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-sm text-foreground">AI-Generated Answer</span>
                    <Badge variant="secondary" className="text-[10px]">Powered by AI</Badge>
                  </div>
                  <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line prose prose-sm max-w-none">
                    {aiGeneratedAnswer.split('**').map((part, i) => 
                      i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                    )}
                  </div>
                </div>
              </div>
              
              {/* AI Insights */}
              {aiInsights.length > 0 && (
                <div className="mt-4 pt-4 border-t border-primary/10">
                  <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Related insights
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {aiInsights.map((insight, i) => (
                      <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-background border border-border text-muted-foreground">
                        {insight}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-primary/10">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={handleCopyAnswer} className="h-7 text-xs gap-1.5">
                    <Copy className="w-3 h-3" />
                    Copy
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5">
                    <Share2 className="w-3 h-3" />
                    Share
                  </Button>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground mr-2">Was this helpful?</span>
                  <Button variant="ghost" size="sm" onClick={() => handleFeedback(true)} className="h-7 w-7 p-0">
                    <ThumbsUp className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleFeedback(false)} className="h-7 w-7 p-0">
                    <ThumbsDown className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error State */}
        <AnimatePresence>
          {aiError && !isSearching && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20"
            >
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">{aiError}</span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3 text-xs"
                onClick={() => query && handleSearch(query)}
              >
                Try again
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {showResults && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {/* Results Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    Found <span className="font-medium text-foreground">{results.length} documents</span> in 0.8s
                  </span>
                  <div className="flex items-center gap-1 text-xs text-green-600">
                    <Shield className="w-3 h-3" />
                    Access verified
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5">
                    <Download className="w-3 h-3" />
                    Export
                  </Button>
                </div>
              </div>

              {/* Results List */}
              <div className="space-y-3">
                {results.map((result, index) => {
                  const SourceIcon = result.sourceIcon;
                  const TypeIcon = result.typeIcon;
                  
                  return (
                    <motion.div
                      key={result.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.08 }}
                      onClick={() => setSelectedResult(selectedResult?.id === result.id ? null : result)}
                      className={cn(
                        "p-4 rounded-xl border transition-all cursor-pointer group",
                        selectedResult?.id === result.id
                          ? "bg-primary/5 border-primary/30 shadow-md"
                          : "bg-muted/30 border-border/50 hover:bg-muted/50 hover:border-border"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-background border border-border flex items-center justify-center shrink-0">
                            <TypeIcon className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm text-foreground group-hover:text-primary transition-colors truncate">
                                {result.title}
                              </span>
                              {getAccessBadge(result.accessLevel)}
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                              {result.snippet}
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <SourceIcon className="w-3 h-3" />
                                <span>{result.source}</span>
                              </div>
                              <span className="text-muted-foreground/30">•</span>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Users className="w-3 h-3" />
                                <span>{result.author}</span>
                              </div>
                              <span className="text-muted-foreground/30">•</span>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Building2 className="w-3 h-3" />
                                <span>{result.department}</span>
                              </div>
                              <span className="text-muted-foreground/30">•</span>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                <span>{result.date}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-semibold">
                            {result.relevance}%
                          </span>
                          <ChevronRight className={cn(
                            "w-4 h-4 text-muted-foreground transition-transform",
                            selectedResult?.id === result.id && "rotate-90"
                          )} />
                        </div>
                      </div>

                      {/* Expanded View */}
                      <AnimatePresence>
                        {selectedResult?.id === result.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3 pt-3 border-t border-border/50"
                          >
                            <div className="flex flex-wrap gap-1.5 mb-3">
                              {result.tags.map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button 
                                size="sm" 
                                className="h-8 text-xs gap-1.5"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewDoc(result);
                                }}
                              >
                                <Eye className="w-3 h-3" />
                                Preview
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 text-xs gap-1.5" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toast.success("Link copied", { description: `Shareable link for "${result.title}" copied to clipboard` });
                                }}
                              >
                                <Share2 className="w-3 h-3" />
                                Share
                              </Button>
                              <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={(e) => {
                                e.stopPropagation();
                                toast.success("Download started", { description: `Downloading "${result.title}"` });
                              }}>
                                <Download className="w-3 h-3" />
                                Download
                              </Button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>

              {/* Load More */}
              <div className="mt-4 text-center">
                <Button variant="outline" size="sm" className="text-xs">
                  Load more results
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Document Preview Modal */}
      <Dialog open={!!previewDoc} onOpenChange={(open) => !open && setPreviewDoc(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
          {previewDoc && (() => {
            const content = getDocumentContent(previewDoc);
            const TypeIcon = previewDoc.typeIcon;
            const SourceIcon = previewDoc.sourceIcon;
            
            return (
              <>
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <TypeIcon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <DialogTitle className="text-lg font-semibold text-foreground mb-1">
                        {previewDoc.title}
                      </DialogTitle>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <SourceIcon className="w-3.5 h-3.5" />
                          <span>{previewDoc.source}</span>
                        </div>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          <span>{previewDoc.author}</span>
                        </div>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{previewDoc.date}</span>
                        </div>
                        <span>•</span>
                        <Badge variant="outline" className="text-xs">
                          {previewDoc.department}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                        <Download className="w-3.5 h-3.5" />
                        Download
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                        <ExternalLink className="w-3.5 h-3.5" />
                        Open in {previewDoc.source}
                      </Button>
                    </div>
                  </div>
                </DialogHeader>

                <Tabs defaultValue="content" className="flex-1">
                  <div className="px-6 pt-4 border-b border-border">
                    <TabsList className="h-9">
                      <TabsTrigger value="content" className="text-xs gap-1.5">
                        <FileText className="w-3.5 h-3.5" />
                        Content
                      </TabsTrigger>
                      <TabsTrigger value="metrics" className="text-xs gap-1.5">
                        <BarChart3 className="w-3.5 h-3.5" />
                        Key Metrics
                      </TabsTrigger>
                      <TabsTrigger value="related" className="text-xs gap-1.5">
                        <Link2 className="w-3.5 h-3.5" />
                        Related
                      </TabsTrigger>
                      <TabsTrigger value="activity" className="text-xs gap-1.5">
                        <History className="w-3.5 h-3.5" />
                        Activity
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <ScrollArea className="h-[50vh]">
                    <TabsContent value="content" className="p-6 pt-4 m-0">
                      {/* Summary */}
                      <div className="mb-6 p-4 rounded-xl bg-primary/5 border border-primary/10">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium text-foreground">AI Summary</span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {content.summary}
                        </p>
                      </div>

                      {/* Document Sections */}
                      <div className="space-y-6">
                        {content.sections.map((section: any, idx: number) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                          >
                            <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                              {section.title}
                            </h3>
                            <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line pl-4 border-l-2 border-border">
                              {section.content}
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      {/* Tags */}
                      <div className="mt-6 pt-4 border-t border-border">
                        <p className="text-xs text-muted-foreground mb-2">Tags</p>
                        <div className="flex flex-wrap gap-1.5">
                          {previewDoc.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="metrics" className="p-6 pt-4 m-0">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        {content.metrics.map((metric: any, idx: number) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.1 }}
                            className="p-4 rounded-xl bg-muted/50 border border-border text-center"
                          >
                            <div className="text-2xl font-bold text-foreground mb-1 tabular-nums">
                              {metric.value}
                            </div>
                            <div className="text-xs text-muted-foreground mb-1">
                              {metric.label}
                            </div>
                            <Badge 
                              variant="secondary" 
                              className={cn(
                                "text-[10px]",
                                metric.change.includes('+') && "bg-green-500/10 text-green-600",
                                metric.change.includes('-') && "bg-red-500/10 text-red-600"
                              )}
                            >
                              {metric.change}
                            </Badge>
                          </motion.div>
                        ))}
                      </div>

                      <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-transparent border border-primary/10">
                        <div className="flex items-center gap-2 mb-3">
                          <TrendingUp className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium text-foreground">Data Insights</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          This document contains {content.sections.length} sections with key data points. 
                          The metrics shown above are extracted from the document content and represent 
                          the most important KPIs relevant to {previewDoc.department} operations.
                        </p>
                      </div>
                    </TabsContent>

                    <TabsContent value="related" className="p-6 pt-4 m-0">
                      <p className="text-xs text-muted-foreground mb-4">
                        Documents frequently accessed together
                      </p>
                      <div className="space-y-3">
                        {content.relatedDocs.map((docTitle: string, idx: number) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border hover:bg-muted/50 transition-colors cursor-pointer group"
                          >
                            <div className="w-10 h-10 rounded-lg bg-background border border-border flex items-center justify-center">
                              <FileText className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                                {docTitle}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Click to search for this document
                              </p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          </motion.div>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="activity" className="p-6 pt-4 m-0">
                      <p className="text-xs text-muted-foreground mb-4">
                        Recent activity on this document
                      </p>
                      <div className="space-y-4">
                        {content.lastViewed.map((viewer: string, idx: number) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="flex items-center gap-3"
                          >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                              {viewer.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-foreground">{viewer}</p>
                              <p className="text-xs text-muted-foreground">
                                Viewed {idx === 0 ? '2 hours ago' : idx === 1 ? 'yesterday' : '3 days ago'}
                              </p>
                            </div>
                            <Eye className="w-4 h-4 text-muted-foreground" />
                          </motion.div>
                        ))}
                      </div>

                      <div className="mt-6 p-4 rounded-xl bg-muted/30 border border-border">
                        <div className="flex items-center gap-2 mb-2">
                          <Star className="w-4 h-4 text-amber-500" />
                          <span className="text-sm font-medium text-foreground">Document Stats</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <div className="text-lg font-semibold text-foreground">247</div>
                            <div className="text-xs text-muted-foreground">Total Views</div>
                          </div>
                          <div>
                            <div className="text-lg font-semibold text-foreground">18</div>
                            <div className="text-xs text-muted-foreground">Downloads</div>
                          </div>
                          <div>
                            <div className="text-lg font-semibold text-foreground">12</div>
                            <div className="text-xs text-muted-foreground">Shares</div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </ScrollArea>
                </Tabs>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
