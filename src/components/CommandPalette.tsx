import { useEffect, useState, useCallback, forwardRef, memo, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
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
} from "lucide-react";
import { productDetails } from "@/data/products";



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

const commandGroups: CommandGroup[] = [
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
      icon: p.icon as React.ComponentType<{ className?: string }>,
      path: `/products/${p.slug}`,
      keywords: [p.tagline, ...p.outcomes].filter(Boolean) as string[],
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
];

const CommandPaletteInner = memo(() => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = useCallback(
    (path: string) => {
      setOpen(false);
      
      // Handle hash navigation for demo sections
      if (path.includes("#")) {
        const [basePath, hash] = path.split("#");
        navigate(basePath);
        setTimeout(() => {
          const element = document.getElementById(hash);
          if (element) {
            element.scrollIntoView({ behavior: "smooth" });
          }
        }, 100);
      } else {
        navigate(path);
      }
    },
    [navigate]
  );

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search pages, demos, resources..." />
      <CommandList className="max-h-[400px]">
        <CommandEmpty>No results found.</CommandEmpty>
        {commandGroups.map((group, groupIndex) => (
          <Fragment key={group.heading}>
            <CommandGroup heading={group.heading}>
              {group.items.map((item) => (
                <CommandItem
                  key={item.path}
                  value={`${item.title} ${item.keywords?.join(" ") || ""} ${item.path}`}
                  onSelect={() => handleSelect(item.path)}
                  className="cursor-pointer"
                >
                  <item.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{item.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            {groupIndex < commandGroups.length - 1 && <CommandSeparator />}
          </Fragment>
        ))}
      </CommandList>
      <div className="border-t border-border px-3 py-2 text-xs text-muted-foreground flex items-center gap-4">
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">↑↓</kbd>
          navigate
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">↵</kbd>
          select
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">esc</kbd>
          close
        </span>
      </div>
    </CommandDialog>
  );
});

CommandPaletteInner.displayName = 'CommandPaletteInner';

// Wrap with forwardRef for lazy loading compatibility
const CommandPalette = forwardRef<HTMLDivElement>((_, _ref) => (
  <CommandPaletteInner />
));

CommandPalette.displayName = 'CommandPalette';

export default CommandPalette;
