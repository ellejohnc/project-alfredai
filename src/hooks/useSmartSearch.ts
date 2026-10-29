import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { productDetails } from "@/data/products";
import {
  Home,
  Package,
  Lightbulb,
  BarChart3,
  BookOpen,
  FileText,
  Play,
  Users,
  Building2,
  Mic,
  Calculator,
  FileCheck,
  Search,
  Zap,
  Brain,
  Workflow,
  ClipboardCheck,
  Receipt,
  UserCheck,
  Phone,
  HardHat,
  Truck,
  MessageSquare,
  TrendingUp,
  DollarSign,
  Clock,
  Scale,
  Video,
  GraduationCap,
  HelpCircle,
  Mail,
  Calendar,
} from "lucide-react";

const SEARCH_HISTORY_KEY = "alfred_search_history";
const MAX_HISTORY_ITEMS = 5;
const AI_SEARCH_DEBOUNCE_MS = 400;

export interface SearchResult {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  keywords?: string[];
  group: string;
}

interface CommandItem {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  keywords?: string[];
}

interface CommandGroup {
  heading: string;
  items: CommandItem[];
}

const searchableContent: CommandGroup[] = [
  {
    heading: "Main Pages",
    items: [
      { title: "Home", icon: Home, path: "/", keywords: ["landing", "main"] },
      { title: "Products", icon: Package, path: "/products", keywords: ["features", "offerings"] },
      { title: "Solutions", icon: Lightbulb, path: "/solutions", keywords: ["use cases"] },
      { title: "Impact Studies", icon: BarChart3, path: "/impact-studies", keywords: ["case studies", "results"] },
      { title: "Resources", icon: BookOpen, path: "/resources", keywords: ["docs", "help"] },
      { title: "Sign Up", icon: Users, path: "/signup", keywords: ["register", "join"] },
    ],
  },
  {
    heading: "Products",
    items: productDetails.map((p) => ({
      title: p.name,
      icon: Package,
      path: `/products/${p.slug}`,
      keywords: [p.slug, p.tagline, "product"].filter(Boolean) as string[],
    })),
  },
  {
    heading: "alfred ai Explained",
    items: [
      { title: "What is alfred ai?", icon: Brain, path: "/explained/what-is-alfredai", keywords: ["overview", "intro"] },
      { title: "System Architecture", icon: Building2, path: "/explained/architecture", keywords: ["tech", "infrastructure"] },
      { title: "AI Engines", icon: Zap, path: "/explained/ai-engines", keywords: ["models", "ml"] },
      { title: "Workflow Builder", icon: Workflow, path: "/explained/workflow-builder", keywords: ["automation", "processes"] },
      { title: "Integration Layer", icon: Package, path: "/explained/integration-layer", keywords: ["connect", "apis"] },
      { title: "Security & Compliance", icon: FileCheck, path: "/explained/security", keywords: ["privacy", "gdpr"] },
      { title: "Pricing", icon: DollarSign, path: "/explained/pricing", keywords: ["cost", "price", "plans", "how much"] },
    ],
  },
  {
    heading: "Impact & Results",
    items: [
      { title: "Case Studies", icon: FileText, path: "/impact-studies/case-studies", keywords: ["success stories"] },
      { title: "ROI Breakdowns", icon: Calculator, path: "/impact-studies/roi-breakdowns", keywords: ["savings", "returns"] },
      { title: "Testimonials", icon: MessageSquare, path: "/impact-studies/testimonials", keywords: ["reviews", "feedback"] },
      { title: "Reduce Admin Time", icon: Clock, path: "/impact-studies/reduce-admin", keywords: ["efficiency"] },
      { title: "Revenue Per Head", icon: DollarSign, path: "/impact-studies/revenue-per-head", keywords: ["productivity"] },
      { title: "Scale Without Hiring", icon: TrendingUp, path: "/impact-studies/scale-without-hiring", keywords: ["growth"] },
      { title: "Execution Speed", icon: Zap, path: "/impact-studies/execution", keywords: ["speed", "faster"] },
    ],
  },
  {
    heading: "Resources",
    items: [
      { title: "Blog", icon: FileText, path: "/resources/blog", keywords: ["articles", "posts"] },
      { title: "Guides", icon: GraduationCap, path: "/resources/guides", keywords: ["tutorials", "how-to"] },
      { title: "Webinars", icon: Video, path: "/resources/webinars", keywords: ["videos", "live"] },
      { title: "Demos", icon: Play, path: "/resources/demos", keywords: ["try", "interactive"] },
    ],
  },
  {
    heading: "Live Demos",
    items: [
      { title: "Voice Agent Demo", icon: Mic, path: "/voice-demo", keywords: ["speech", "call"] },
      { title: "Purchase Bill Intake", icon: Receipt, path: "/demos/purchase-bill-intake", keywords: ["AP", "invoices", "xero", "accounts payable"] },
      { title: "Site Inspection", icon: HardHat, path: "/resources/demos#site-inspection", keywords: ["construction", "survey"] },
      { title: "Contract Review", icon: Scale, path: "/resources/demos#contract-review", keywords: ["legal", "documents"] },
      { title: "Fee Proposal", icon: Receipt, path: "/resources/demos#fee-proposal", keywords: ["pricing", "quotes"] },
      { title: "Auto Invoicing", icon: Receipt, path: "/resources/demos#auto-invoicing", keywords: ["billing", "payments"] },
      { title: "Interview Scoring", icon: UserCheck, path: "/resources/demos#interview-scoring", keywords: ["hiring", "recruitment"] },
      { title: "Candidate Matching", icon: Users, path: "/resources/demos#candidate-matching", keywords: ["hr", "talent"] },
      { title: "Lead Research", icon: Search, path: "/resources/demos#lead-research", keywords: ["sales", "prospects"] },
      { title: "CX Agent", icon: Phone, path: "/resources/demos#cx-agent", keywords: ["support", "customer"] },
      { title: "Subcontractor Assignment", icon: Truck, path: "/resources/demos#subcontractor", keywords: ["vendors", "assign"] },
      { title: "Procurement", icon: ClipboardCheck, path: "/resources/demos#procurement", keywords: ["purchasing", "supply"] },
    ],
  },
{
    heading: "Get Started",
    items: [
      { title: "Book a Demo", icon: Calendar, path: "https://new.alfredai.bot/book", keywords: ["schedule", "meeting", "call", "talk to sales"] },
      { title: "Contact Us", icon: Mail, path: "/contact", keywords: ["reach", "email", "support"] },
      { title: "FAQ", icon: HelpCircle, path: "/faq", keywords: ["questions", "answers", "help"] },
      { title: "DIY Quote", icon: Calculator, path: "/diy-quote", keywords: ["quote", "estimate", "pricing", "self-serve"] },
    ],
  },
  {
    heading: "Company",
    items: [
      { title: "About Us", icon: Building2, path: "/about", keywords: ["company", "team", "who we are"] },
      { title: "Careers", icon: Users, path: "/careers", keywords: ["jobs", "hiring", "work with us"] },
      { title: "Press", icon: FileText, path: "/press", keywords: ["news", "media", "announcements"] },
      { title: "Partners", icon: Users, path: "/partners", keywords: ["partner", "affiliate", "reseller"] },
      { title: "Investors", icon: TrendingUp, path: "/investors", keywords: ["invest", "funding", "vc"] },
    ],
  },
  {
    heading: "Compare",
    items: [
      { title: "How We're Different", icon: Scale, path: "/compare", keywords: ["comparison", "vs", "alternative"] },
      { title: "vs Procore", icon: HardHat, path: "/compare/vs-procore", keywords: ["construction", "procore"] },
      { title: "vs ProcurePro", icon: HardHat, path: "/compare/vs-procurepro", keywords: ["procurepro", "procurement", "subcontractor", "bidlevel"] },
      { title: "vs Trimble & Aconex", icon: HardHat, path: "/compare/vs-construction-enterprise", keywords: ["trimble", "aconex", "e-builder"] },
      { title: "vs BuildTools", icon: HardHat, path: "/compare/vs-construction-builders", keywords: ["buildtools", "projectsimpel", "builder"] },
      { title: "vs Buildpass", icon: HardHat, path: "/compare/vs-buildpass", keywords: ["buildpass", "site management", "compliance"] },
      { title: "vs Jobber", icon: HardHat, path: "/compare/vs-jobber", keywords: ["jobber", "field service"] },
      { title: "vs Monday", icon: Package, path: "/compare/vs-monday", keywords: ["monday.com", "project management"] },
      { title: "vs Notion", icon: FileText, path: "/compare/vs-notion", keywords: ["notion", "documentation", "wiki"] },
      { title: "vs Asana", icon: ClipboardCheck, path: "/compare/vs-asana", keywords: ["asana", "task management"] },
      { title: "vs ClickUp", icon: Package, path: "/compare/vs-clickup", keywords: ["clickup", "productivity"] },
      { title: "vs Zapier", icon: Zap, path: "/compare/vs-zapier", keywords: ["zapier", "automation", "triggers"] },
      { title: "vs Make", icon: Workflow, path: "/compare/vs-make", keywords: ["make", "integromat", "automation"] },
      { title: "vs n8n", icon: Workflow, path: "/compare/vs-n8n", keywords: ["n8n", "workflow", "self-hosted"] },
      { title: "vs Pipedrive", icon: Phone, path: "/compare/vs-pipedrive", keywords: ["pipedrive", "crm", "sales"] },
      { title: "vs GoHighLevel", icon: MessageSquare, path: "/compare/vs-gohighlevel", keywords: ["gohighlevel", "ghl", "marketing"] },
      { title: "vs Lovable", icon: Brain, path: "/compare/vs-lovable", keywords: ["lovable", "app building"] },
    ],
  },
  {
    heading: "Legal",
    items: [
      { title: "Privacy Policy", icon: FileCheck, path: "/privacy", keywords: ["privacy", "data", "gdpr"] },
      { title: "Terms of Service", icon: FileText, path: "/terms", keywords: ["terms", "tos", "legal"] },
      { title: "Support", icon: HelpCircle, path: "/support", keywords: ["help", "assistance"] },
      { title: "Unsubscribe", icon: Mail, path: "/unsubscribe", keywords: ["unsubscribe", "email", "opt out"] },
    ],
  },
];

// Set of all known, routable paths (used to validate AI results)
const knownPaths = new Set<string>(
  searchableContent.flatMap(group => group.items.map(item => item.path))
);

// Icon mapping for AI search results
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  "/": Home,
  "/products": Package,
  "/solutions": Lightbulb,
  "/impact-studies": BarChart3,
  "/resources": BookOpen,
  "/signup": Users,
  "/explained/what-is-alfredai": Brain,
  "/explained/architecture": Building2,
  "/explained/ai-engines": Zap,
  "/explained/workflow-builder": Workflow,
  "/explained/integration-layer": Package,
  "/explained/security": FileCheck,
  "/explained/pricing": DollarSign,
  "/impact-studies/case-studies": FileText,
  "/impact-studies/roi-breakdowns": Calculator,
  "/impact-studies/testimonials": MessageSquare,
  "/impact-studies/reduce-admin": Clock,
  "/impact-studies/revenue-per-head": DollarSign,
  "/impact-studies/scale-without-hiring": TrendingUp,
  "/impact-studies/execution": Zap,
  "/resources/blog": FileText,
  "/resources/guides": GraduationCap,
  "/resources/webinars": Video,
  "/resources/demos": Play,
  "/voice-demo": Mic,
  "/demos/purchase-bill-intake": Receipt,
  "/book-demo": Calendar,
  "/contact": Mail,
  "/faq": HelpCircle,
  "/diy-quote": Calculator,
  // Company
  "/about": Building2,
  "/careers": Users,
  "/press": FileText,
  "/partners": Users,
  "/investors": TrendingUp,
  // Compare
  "/compare": Scale,
  "/compare/vs-procore": HardHat,
  "/compare/vs-procurepro": HardHat,
  "/compare/vs-construction-enterprise": HardHat,
  "/compare/vs-construction-builders": HardHat,
  "/compare/vs-jobber": HardHat,
  "/compare/vs-monday": Package,
  "/compare/vs-notion": FileText,
  "/compare/vs-asana": ClipboardCheck,
  "/compare/vs-clickup": Package,
  "/compare/vs-zapier": Zap,
  "/compare/vs-make": Workflow,
  "/compare/vs-n8n": Workflow,
  "/compare/vs-pipedrive": Phone,
  "/compare/vs-gohighlevel": MessageSquare,
  "/compare/vs-lovable": Brain,
  // Legal
  "/privacy": FileCheck,
  "/terms": FileText,
  "/support": HelpCircle,
  "/unsubscribe": Mail,
};

// Get visitor ID for analytics
function getVisitorId(): string {
  const key = "alfred_visitor_id";
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(key, id);
  }
  return id;
}

// Get device type
function getDeviceType(): string {
  const width = window.innerWidth;
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

export function useSmartSearch(query: string, useAI: boolean = true) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAIEnhanced, setIsAIEnhanced] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Local keyword search (instant fallback)
  const localSearch = useCallback((q: string): SearchResult[] => {
    const lowerQuery = q.toLowerCase();
    return searchableContent.flatMap(group =>
      group.items
        .filter(item =>
          item.title.toLowerCase().includes(lowerQuery) ||
          item.keywords?.some(k => k.toLowerCase().includes(lowerQuery))
        )
        .map(item => ({ ...item, group: group.heading }))
    ).slice(0, 8);
  }, []);

  useEffect(() => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (!query.trim()) {
      setResults([]);
      setIsSearching(false);
      setIsAIEnhanced(false);
      return;
    }

    // Immediately show local results
    const localResults = localSearch(query);
    setResults(localResults);
    setIsAIEnhanced(false);

    // Skip AI for very short queries
    if (!useAI || query.trim().length < 3) {
      setIsSearching(false);
      return;
    }

    // Debounce AI search
    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      abortControllerRef.current = new AbortController();

      try {
        const { data, error } = await supabase.functions.invoke("ai-search", {
          body: {
            query: query.trim(),
            sessionId: sessionStorage.getItem("alfred_session_id") || crypto.randomUUID(),
            visitorId: getVisitorId(),
            deviceType: getDeviceType(),
          },
        });

        if (error) {
          console.error("AI search error:", error);
          // Keep local results
          return;
        }

        if (data?.results && Array.isArray(data.results) && data.results.length > 0) {
          // Only keep AI results that map to real, routable paths
          const aiResults: SearchResult[] = data.results
            .filter((r: { path?: string }) => r?.path && knownPaths.has(r.path))
            .map((r: { title: string; path: string; group: string }) => ({
              title: r.title,
              path: r.path,
              group: r.group,
              icon: iconMap[r.path] || Search,
            }));

          // Merge valid AI results ahead of fresh local results, deduped by path,
          // so the list never collapses or jumps to a broken page.
          const freshLocal = localSearch(query);
          const seen = new Set<string>();
          const merged: SearchResult[] = [];
          for (const r of [...aiResults, ...freshLocal]) {
            if (seen.has(r.path)) continue;
            seen.add(r.path);
            merged.push(r);
          }

          if (merged.length > 0) {
            setResults(merged.slice(0, 8));
            setIsAIEnhanced(aiResults.length > 0 && (data.aiEnhanced || false));
          }
        }

      } catch (err) {
        console.error("AI search failed:", err);
        // Keep local results on error
      } finally {
        setIsSearching(false);
      }
    }, AI_SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timeoutId);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [query, useAI, localSearch]);

  return { results, isSearching, isAIEnhanced };
}

export function useSearchHistory() {
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    try {
      return JSON.parse(sessionStorage.getItem(SEARCH_HISTORY_KEY) || "[]");
    } catch {
      return [];
    }
  });

  const addToHistory = useCallback((query: string) => {
    if (!query.trim()) return;
    
    setSearchHistory(prev => {
      const updated = [query, ...prev.filter(h => h !== query)].slice(0, MAX_HISTORY_ITEMS);
      try {
        sessionStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
      } catch {
        // Silently fail if sessionStorage is full
      }
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setSearchHistory([]);
    try {
      sessionStorage.removeItem(SEARCH_HISTORY_KEY);
    } catch {
      // Silently fail
    }
  }, []);

  return { searchHistory, addToHistory, clearHistory };
}
