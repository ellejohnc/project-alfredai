import { useState, useEffect, useRef, useCallback } from "react";
import { InlineDemoSpeedControl } from "@/components/demos/shared/InlineDemoSpeedControl";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import { 
  Scale, 
  LayoutDashboard, 
  Briefcase, 
  CheckSquare, 
  BookOpen, 
  Users, 
  Building2, 
  Sparkles,
  Bell,
  Search,
  ChevronRight,
  AlertTriangle,
  Clock,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  FileText,
  Calendar,
  CalendarDays,
  DollarSign,
  Activity,
  Shield,
  Target,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  XCircle,
  MoreHorizontal,
  Eye,
  Edit3,
  ChevronDown,
  ChevronLeft,
  User,
  Gavel,
  X,
  Send,
  ArrowLeft,
  BarChart3,
  PieChart,
  Timer,
  Loader2,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart as RechartsPie, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from "recharts";

// Types
type Page = 'dashboard' | 'matters' | 'work' | 'knowledge' | 'clients' | 'firm' | 'credits' | 'calendar';
type MatterTab = 'timeline' | 'quests' | 'documents' | 'intelligence' | 'billing' | 'activity';
type FirmTab = 'accountability' | 'performance' | 'risk' | 'revenue';

// Court deadline rules by matter type (days from filing/event)
interface DeadlineRule {
  name: string;
  daysFromTrigger: number;
  triggerEvent: string;
  isCourt: boolean;
  priority: 'critical' | 'high' | 'medium';
}

interface CourtDeadline {
  id: string;
  matterId: string;
  matterName: string;
  matterType: string;
  deadlineName: string;
  dueDate: string;
  triggerEvent: string;
  priority: 'critical' | 'high' | 'medium';
  status: 'upcoming' | 'due-soon' | 'overdue';
  assignedTo: string;
  isCourt: boolean;
  daysRemaining: number;
}

// Deadline calculation rules by matter type
const deadlineRulesByType: Record<string, DeadlineRule[]> = {
  'Commercial Litigation': [
    { name: 'File Defence', daysFromTrigger: 28, triggerEvent: 'Statement of Claim served', isCourt: true, priority: 'critical' },
    { name: 'Respond to Interrogatories', daysFromTrigger: 21, triggerEvent: 'Interrogatories served', isCourt: true, priority: 'high' },
    { name: 'Discovery Documents Due', daysFromTrigger: 42, triggerEvent: 'Discovery ordered', isCourt: true, priority: 'critical' },
    { name: 'Expert Report Filing', daysFromTrigger: 56, triggerEvent: 'Expert order made', isCourt: true, priority: 'high' },
    { name: 'Pre-trial Conference', daysFromTrigger: 14, triggerEvent: 'Trial date set', isCourt: true, priority: 'critical' },
  ],
  'Conveyancing': [
    { name: 'Contract Exchange', daysFromTrigger: 14, triggerEvent: 'Contract prepared', isCourt: false, priority: 'high' },
    { name: 'Finance Approval', daysFromTrigger: 21, triggerEvent: 'Contract exchanged', isCourt: false, priority: 'critical' },
    { name: 'Building Inspection', daysFromTrigger: 7, triggerEvent: 'Contract exchanged', isCourt: false, priority: 'medium' },
    { name: 'Settlement Date', daysFromTrigger: 42, triggerEvent: 'Contract exchanged', isCourt: false, priority: 'critical' },
  ],
  'Intellectual Property': [
    { name: 'Provisional Patent Filing', daysFromTrigger: 30, triggerEvent: 'Invention disclosure', isCourt: false, priority: 'critical' },
    { name: 'Complete Patent Filing', daysFromTrigger: 365, triggerEvent: 'Provisional filed', isCourt: false, priority: 'critical' },
    { name: 'Trademark Response', daysFromTrigger: 21, triggerEvent: 'Examination report issued', isCourt: false, priority: 'high' },
  ],
  'Succession Planning': [
    { name: 'Probate Application', daysFromTrigger: 14, triggerEvent: 'Death certificate obtained', isCourt: true, priority: 'high' },
    { name: 'Creditor Notice Period', daysFromTrigger: 90, triggerEvent: 'Probate granted', isCourt: false, priority: 'medium' },
    { name: 'Final Distribution', daysFromTrigger: 180, triggerEvent: 'Probate granted', isCourt: false, priority: 'high' },
  ],
  'Employment Law': [
    { name: 'Response to Claim', daysFromTrigger: 21, triggerEvent: 'Claim filed', isCourt: true, priority: 'critical' },
    { name: 'Conciliation Conference', daysFromTrigger: 28, triggerEvent: 'Response filed', isCourt: true, priority: 'high' },
    { name: 'Witness Statements Due', daysFromTrigger: 42, triggerEvent: 'Conference completed', isCourt: true, priority: 'high' },
  ],
  'M&A': [
    { name: 'Due Diligence Complete', daysFromTrigger: 30, triggerEvent: 'LOI signed', isCourt: false, priority: 'critical' },
    { name: 'ACCC Notification', daysFromTrigger: 14, triggerEvent: 'Binding agreement', isCourt: false, priority: 'critical' },
    { name: 'Completion Date', daysFromTrigger: 60, triggerEvent: 'Binding agreement', isCourt: false, priority: 'critical' },
  ],
  'Body Corporate': [
    { name: 'AGM Notice', daysFromTrigger: 21, triggerEvent: 'AGM scheduled', isCourt: false, priority: 'medium' },
    { name: 'QCAT Response', daysFromTrigger: 28, triggerEvent: 'Application filed', isCourt: true, priority: 'high' },
  ],
};

interface Matter {
  id: string;
  name: string;
  client: string;
  lead: { name: string; initials: string; role: string };
  status: 'on-track' | 'at-risk' | 'overdue';
  nextDeadline: string;
  riskScore: number;
  type: string;
}

interface Quest {
  id: string;
  title: string;
  matter: string;
  matterId: string;
  owner: { name: string; initials: string };
  dueDate: string;
  status: 'pending' | 'in-progress' | 'overdue' | 'completed' | 'blocked';
  priority: 'high' | 'medium' | 'low';
}

interface Lawyer {
  id: string;
  name: string;
  initials: string;
  role: string;
  questsAccepted: number;
  questsDelayed: number;
  avgLatency: number;
  trustScore: number;
}

interface Client {
  id: string;
  name: string;
  activeMatters: number;
  responsiveness: 'high' | 'medium' | 'low';
  revenueToDate: number;
  outstanding: number;
}

interface KnowledgeItem {
  id: string;
  title: string;
  category: 'playbooks' | 'arguments' | 'clauses' | 'learnings';
  createdFrom: string;
  usedCount: number;
  lastUsed: string;
  contributor: string;
  trustPoints: number;
}

// Sample Data
const matters: Matter[] = [
  { id: 'm1', name: 'Smith v. Pacific Holdings', client: 'Chen Industries Pty Ltd', lead: { name: 'Marcus Thompson', initials: 'MT', role: 'Partner' }, status: 'at-risk', nextDeadline: '2026-01-10', riskScore: 72, type: 'Commercial Litigation' },
  { id: 'm2', name: 'Meridian Property Settlement', client: 'Meridian Corp', lead: { name: 'Jane Smith', initials: 'SC', role: 'Senior Associate' }, status: 'on-track', nextDeadline: '2026-01-20', riskScore: 35, type: 'Conveyancing' },
  { id: 'm3', name: 'TechStart IP Portfolio', client: 'TechStart Inc.', lead: { name: 'James Wilson', initials: 'JW', role: 'Associate' }, status: 'on-track', nextDeadline: '2026-01-25', riskScore: 28, type: 'Intellectual Property' },
  { id: 'm4', name: 'Estate of Williams', client: 'Williams Family Trust', lead: { name: 'Emma Roberts', initials: 'ER', role: 'Junior Lawyer' }, status: 'overdue', nextDeadline: '2026-01-02', riskScore: 89, type: 'Succession Planning' },
  { id: 'm5', name: 'Harbour View Strata', client: 'Harbour View OC', lead: { name: 'Marcus Thompson', initials: 'MT', role: 'Partner' }, status: 'on-track', nextDeadline: '2026-02-01', riskScore: 22, type: 'Body Corporate' },
  { id: 'm6', name: 'Reynolds Employment Matter', client: 'Reynolds Holdings', lead: { name: 'Jane Smith', initials: 'SC', role: 'Senior Associate' }, status: 'at-risk', nextDeadline: '2026-01-08', riskScore: 68, type: 'Employment Law' },
  { id: 'm7', name: 'GreenTech Acquisition', client: 'GreenTech Holdings', lead: { name: 'Marcus Thompson', initials: 'MT', role: 'Partner' }, status: 'on-track', nextDeadline: '2026-02-15', riskScore: 18, type: 'M&A' },
];

const quests: Quest[] = [
  { id: 'q1', title: 'Draft response to interrogatories', matter: 'Smith v. Pacific Holdings', matterId: 'm1', owner: { name: 'James Wilson', initials: 'JW' }, dueDate: '2026-01-01', status: 'overdue', priority: 'high' },
  { id: 'q2', title: 'Review amended statement of claim', matter: 'Smith v. Pacific Holdings', matterId: 'm1', owner: { name: 'Jane Smith', initials: 'SC' }, dueDate: '2026-01-08', status: 'in-progress', priority: 'high' },
  { id: 'q3', title: 'Prepare cost agreement for approval', matter: 'Estate of Williams', matterId: 'm4', owner: { name: 'Emma Roberts', initials: 'ER' }, dueDate: '2026-01-05', status: 'pending', priority: 'medium' },
  { id: 'q4', title: 'Lodge Form 17 with court registry', matter: 'Smith v. Pacific Holdings', matterId: 'm1', owner: { name: 'James Wilson', initials: 'JW' }, dueDate: '2025-12-28', status: 'completed', priority: 'high' },
  { id: 'q5', title: 'Schedule expert witness deposition', matter: 'Reynolds Employment Matter', matterId: 'm6', owner: { name: 'Jane Smith', initials: 'SC' }, dueDate: '2026-01-12', status: 'blocked', priority: 'high' },
  { id: 'q6', title: 'Finalise due diligence report', matter: 'GreenTech Acquisition', matterId: 'm7', owner: { name: 'Marcus Thompson', initials: 'MT' }, dueDate: '2026-01-20', status: 'in-progress', priority: 'medium' },
  { id: 'q7', title: 'Draft settlement deed', matter: 'Meridian Property Settlement', matterId: 'm2', owner: { name: 'Jane Smith', initials: 'SC' }, dueDate: '2026-01-15', status: 'pending', priority: 'medium' },
  { id: 'q8', title: 'Review IP assignment agreements', matter: 'TechStart IP Portfolio', matterId: 'm3', owner: { name: 'James Wilson', initials: 'JW' }, dueDate: '2026-01-22', status: 'pending', priority: 'low' },
];

const lawyers: Lawyer[] = [
  { id: 'l1', name: 'Marcus Thompson', initials: 'MT', role: 'Managing Partner', questsAccepted: 24, questsDelayed: 1, avgLatency: 0.8, trustScore: 94 },
  { id: 'l2', name: 'Jane Smith', initials: 'SC', role: 'Senior Associate', questsAccepted: 31, questsDelayed: 4, avgLatency: 2.1, trustScore: 78 },
  { id: 'l3', name: 'James Wilson', initials: 'JW', role: 'Associate', questsAccepted: 18, questsDelayed: 2, avgLatency: 1.4, trustScore: 85 },
  { id: 'l4', name: 'Emma Roberts', initials: 'ER', role: 'Junior Lawyer', questsAccepted: 22, questsDelayed: 0, avgLatency: 0.5, trustScore: 96 },
  { id: 'l5', name: 'Michael Torres', initials: 'MT', role: 'Legal Ops Manager', questsAccepted: 15, questsDelayed: 0, avgLatency: 0.3, trustScore: 98 },
];

const clients: Client[] = [
  { id: 'c1', name: 'Chen Industries Pty Ltd', activeMatters: 1, responsiveness: 'high', revenueToDate: 245000, outstanding: 15000 },
  { id: 'c2', name: 'Meridian Corp', activeMatters: 1, responsiveness: 'medium', revenueToDate: 128000, outstanding: 42000 },
  { id: 'c3', name: 'TechStart Inc.', activeMatters: 1, responsiveness: 'high', revenueToDate: 89000, outstanding: 0 },
  { id: 'c4', name: 'Williams Family Trust', activeMatters: 1, responsiveness: 'low', revenueToDate: 156000, outstanding: 78000 },
  { id: 'c5', name: 'GreenTech Holdings', activeMatters: 1, responsiveness: 'high', revenueToDate: 312000, outstanding: 25000 },
];

const knowledgeItems: KnowledgeItem[] = [
  { id: 'k1', title: 'Indemnity Clause (Standard v2.1)', category: 'clauses', createdFrom: 'Williams Estate Matter', usedCount: 12, lastUsed: '5 days ago', contributor: 'Emma Roberts', trustPoints: 8 },
  { id: 'k2', title: 'Discovery Response Playbook', category: 'playbooks', createdFrom: 'Smith v. Pacific Holdings', usedCount: 28, lastUsed: '2 days ago', contributor: 'Marcus Thompson', trustPoints: 15 },
  { id: 'k3', title: 'Force Majeure Defence Argument', category: 'arguments', createdFrom: 'COVID Lease Disputes', usedCount: 7, lastUsed: '2 weeks ago', contributor: 'Jane Smith', trustPoints: 5 },
  { id: 'k4', title: 'IP Assignment Checklist', category: 'playbooks', createdFrom: 'TechStart IP Portfolio', usedCount: 15, lastUsed: '1 day ago', contributor: 'James Wilson', trustPoints: 10 },
  { id: 'k5', title: 'Settlement Negotiation Learnings', category: 'learnings', createdFrom: 'Meridian Property Settlement', usedCount: 4, lastUsed: '1 week ago', contributor: 'Jane Smith', trustPoints: 3 },
];

// Chart data
const decisionLatencyData = [
  { day: 'Mon', latency: 1.2 },
  { day: 'Tue', latency: 0.9 },
  { day: 'Wed', latency: 1.8 },
  { day: 'Thu', latency: 2.1 },
  { day: 'Fri', latency: 1.4 },
  { day: 'Sat', latency: 0.5 },
  { day: 'Sun', latency: 0.3 },
];

const questCompletionData = [
  { name: 'MT', completed: 23, pending: 1 },
  { name: 'SC', completed: 27, pending: 4 },
  { name: 'JW', completed: 16, pending: 2 },
  { name: 'ER', completed: 22, pending: 0 },
];

const matterRiskData = [
  { name: 'On Track', value: 4, color: '#10b981' },
  { name: 'At Risk', value: 2, color: '#f59e0b' },
  { name: 'Overdue', value: 1, color: '#ef4444' },
];

const revenueData = [
  { month: 'Sep', revenue: 285000 },
  { month: 'Oct', revenue: 312000 },
  { month: 'Nov', revenue: 298000 },
  { month: 'Dec', revenue: 342000 },
];

const creditUsageData = [
  { name: 'Document Drafting', value: 1200, color: '#f472b6' },
  { name: 'Case Summarisation', value: 890, color: '#a78bfa' },
  { name: 'Contract Review', value: 420, color: '#60a5fa' },
  { name: 'Client Reports', value: 150, color: '#34d399' },
];

// Performance metrics data
const performanceMetricsData = {
  firmKPIs: [
    { label: 'Matters Closed (MTD)', value: 12, target: 15, trend: 'up', change: '+3 vs last month' },
    { label: 'Avg Matter Duration', value: '42 days', target: '45 days', trend: 'up', change: '-3 days' },
    { label: 'Client Satisfaction', value: '94%', target: '90%', trend: 'up', change: '+2%' },
    { label: 'Revenue Per Lawyer', value: '$78K', target: '$75K', trend: 'up', change: '+$5K' },
  ],
  utilizationByLawyer: [
    { name: 'Marcus T.', billable: 85, nonBillable: 10, admin: 5 },
    { name: 'Sarah C.', billable: 78, nonBillable: 15, admin: 7 },
    { name: 'James W.', billable: 82, nonBillable: 12, admin: 6 },
    { name: 'Emma R.', billable: 88, nonBillable: 8, admin: 4 },
  ],
  matterThroughput: [
    { month: 'Sep', opened: 8, closed: 6 },
    { month: 'Oct', opened: 10, closed: 9 },
    { month: 'Nov', opened: 7, closed: 11 },
    { month: 'Dec', opened: 9, closed: 12 },
  ],
  practiceAreaRevenue: [
    { area: 'Commercial', revenue: 185000, matters: 4, color: '#f472b6' },
    { area: 'Litigation', revenue: 142000, matters: 2, color: '#a78bfa' },
    { area: 'Property', revenue: 98000, matters: 3, color: '#60a5fa' },
    { area: 'IP', revenue: 76000, matters: 2, color: '#34d399' },
    { area: 'Employment', revenue: 54000, matters: 1, color: '#fbbf24' },
  ],
  deadlineCompliance: [
    { period: 'Week 1', onTime: 12, late: 1 },
    { period: 'Week 2', onTime: 15, late: 2 },
    { period: 'Week 3', onTime: 11, late: 0 },
    { period: 'Week 4', onTime: 14, late: 1 },
  ],
};

// Navigation items
const navItems = [
  { id: 'dashboard' as Page, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'matters' as Page, label: 'Matters', icon: Briefcase },
  { id: 'calendar' as Page, label: 'Deadlines', icon: CalendarDays, badge: 5 },
  { id: 'work' as Page, label: 'Work', icon: CheckSquare, badge: 4 },
  { id: 'knowledge' as Page, label: 'Knowledge', icon: BookOpen },
  { id: 'clients' as Page, label: 'Clients', icon: Users },
  { id: 'firm' as Page, label: 'Firm', icon: Building2 },
];

// Generate court deadlines from matters
const generateCourtDeadlines = (): CourtDeadline[] => {
  const today = new Date();
  const deadlines: CourtDeadline[] = [];
  
  matters.forEach((matter) => {
    const rules = deadlineRulesByType[matter.type] || [];
    rules.forEach((rule, index) => {
      // Simulate different trigger dates for variety
      const baseDays = Math.floor(Math.random() * 20) - 5;
      const dueDate = new Date(today);
      dueDate.setDate(dueDate.getDate() + baseDays + (index * 7));
      
      const daysRemaining = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      let status: CourtDeadline['status'] = 'upcoming';
      if (daysRemaining < 0) status = 'overdue';
      else if (daysRemaining <= 7) status = 'due-soon';
      
      deadlines.push({
        id: `dl-${matter.id}-${index}`,
        matterId: matter.id,
        matterName: matter.name,
        matterType: matter.type,
        deadlineName: rule.name,
        dueDate: dueDate.toISOString().split('T')[0],
        triggerEvent: rule.triggerEvent,
        priority: rule.priority,
        status,
        assignedTo: matter.lead.name,
        isCourt: rule.isCourt,
        daysRemaining,
      });
    });
  });
  
  // Sort by due date
  return deadlines.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
};

const courtDeadlines = generateCourtDeadlines();

// All nav items including credits for mobile
const allNavItems = [
  ...navItems,
  { id: 'credits' as Page, label: 'Credits', icon: Sparkles },
];

// Mobile Nav with swipe and arrows component
interface MobileNavWithSwipeProps {
  navItems: typeof navItems;
  activePage: Page;
  onNavigate: (page: Page) => void;
}

function MobileNavWithSwipe({ navItems, activePage, onNavigate }: MobileNavWithSwipeProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const checkScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  }, []);

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [checkScroll]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 120;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
      setTimeout(checkScroll, 300);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const diff = touchStartX.current - touchEndX.current;
    const currentIndex = allNavItems.findIndex(item => item.id === activePage);
    
    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentIndex < allNavItems.length - 1) {
        onNavigate(allNavItems[currentIndex + 1].id);
      } else if (diff < 0 && currentIndex > 0) {
        onNavigate(allNavItems[currentIndex - 1].id);
      }
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <div className="md:hidden bg-white border-b border-slate-200 relative">
      {/* Left Arrow */}
      <AnimatePresence>
        {canScrollLeft && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 flex items-center justify-center bg-white/90 backdrop-blur-sm shadow-md rounded-full border border-slate-200"
          >
            <ChevronLeft className="w-4 h-4 text-slate-600" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Scrollable Nav */}
      <div
        ref={scrollContainerRef}
        onScroll={checkScroll}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="flex gap-1 px-2 py-2 overflow-x-auto scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {allNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors",
                isActive 
                  ? "bg-rose-50 text-rose-700" 
                  : "text-slate-600 hover:bg-slate-50"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Right Arrow */}
      <AnimatePresence>
        {canScrollRight && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 flex items-center justify-center bg-white/90 backdrop-blur-sm shadow-md rounded-full border border-slate-200"
          >
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function LawFirmOSDemo() {
  const [activePage, setActivePage] = useState<Page>('dashboard');
  const [selectedMatter, setSelectedMatter] = useState<Matter | null>(null);
  const [matterTab, setMatterTab] = useState<MatterTab>('timeline');
  const [firmTab, setFirmTab] = useState<FirmTab>('accountability');
  const [questFilter, setQuestFilter] = useState<'my' | 'delegated' | 'overdue' | 'waiting' | 'all'>('all');
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [notifications] = useState(3);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [autoPlayStep, setAutoPlayStep] = useState(0);
  
  // Calendar state (moved from renderCalendar to follow Rules of Hooks)
  const [calendarView, setCalendarView] = useState<'list' | 'calendar'>('list');
  const [calendarFilter, setCalendarFilter] = useState<'all' | 'court' | 'internal' | 'overdue'>('all');
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  // Demo feedback helper
  const showDemoToast = (action: string, description?: string) => {
    toast.info(action, {
      description: description || "This feature is fully functional in the production version.",
      icon: <Info className="w-4 h-4" />,
    });
  };

  const showSuccessToast = (action: string, description?: string) => {
    toast.success(action, {
      description: description,
      icon: <CheckCircle2 className="w-4 h-4" />,
    });
  };

  // Auto-play demo
  useEffect(() => {
    if (!isAutoPlaying) return;

    const steps = [
      () => setActivePage('dashboard'),
      () => setActivePage('matters'),
      () => { setSelectedMatter(matters[0]); setMatterTab('timeline'); },
      () => setMatterTab('quests'),
      () => setMatterTab('intelligence'),
      () => { setSelectedMatter(null); setActivePage('calendar'); },
      () => { setSelectedMatter(null); setActivePage('work'); },
      () => setSelectedQuest(quests[0]),
      () => { setSelectedQuest(null); setActivePage('firm'); },
      () => setFirmTab('risk'),
      () => setActivePage('credits'),
    ];

    const timeout = setTimeout(() => {
      steps[autoPlayStep]();
      setAutoPlayStep((prev) => (prev + 1) % steps.length);
    }, 3500);

    return () => clearTimeout(timeout);
  }, [isAutoPlaying, autoPlayStep]);

  const handleNavigation = (page: Page) => {
    setIsAutoPlaying(false);
    setSelectedMatter(null);
    setSelectedQuest(null);
    setActivePage(page);
  };

  const getStatusBadge = (status: Matter['status']) => {
    const styles = {
      'on-track': 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'at-risk': 'bg-amber-50 text-amber-700 border-amber-200',
      'overdue': 'bg-rose-50 text-rose-700 border-rose-200',
    };
    const labels = { 'on-track': 'On Track', 'at-risk': 'At Risk', 'overdue': 'Overdue' };
    return <Badge variant="outline" className={cn("text-xs font-medium", styles[status])}>{labels[status]}</Badge>;
  };

  const getQuestStatusBadge = (status: Quest['status']) => {
    const styles = {
      'pending': 'bg-slate-50 text-slate-700 border-slate-200',
      'in-progress': 'bg-blue-50 text-blue-700 border-blue-200',
      'overdue': 'bg-rose-50 text-rose-700 border-rose-200',
      'completed': 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'blocked': 'bg-orange-50 text-orange-700 border-orange-200',
    };
    return <Badge variant="outline" className={cn("text-xs font-medium capitalize", styles[status])}>{status}</Badge>;
  };

  const getTrustScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600';
    if (score >= 75) return 'text-amber-600';
    return 'text-rose-600';
  };

  // Render Dashboard
  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div 
          whileHover={{ scale: 1.02 }}
          onClick={() => handleNavigation('matters')}
          className="bg-white rounded-xl p-4 border border-rose-200 cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Matters at Risk</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-600 tabular-nums">3</div>
          <p className="text-xs text-slate-500 mt-1">Requires attention</p>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }}
          onClick={() => handleNavigation('work')}
          className="bg-white rounded-xl p-4 border border-amber-200 cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Pending Decisions</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 tabular-nums">7</div>
          <p className="text-xs text-slate-500 mt-1">Awaiting approval</p>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }}
          onClick={() => { handleNavigation('work'); setQuestFilter('overdue'); }}
          className="bg-white rounded-xl p-4 border border-rose-200 cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Overdue Quests</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-600 tabular-nums">4</div>
          <p className="text-xs text-slate-500 mt-1">Past deadline</p>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }}
          onClick={() => handleNavigation('firm')}
          className="bg-white rounded-xl p-4 border border-emerald-200 cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Trust Score (Avg)</span>
            <Shield className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 tabular-nums">87</div>
          <p className="text-xs text-slate-500 mt-1">Firm-wide average</p>
        </motion.div>
      </div>

      {/* Revenue Leakage Alert */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600" />
          <div>
            <p className="text-sm font-medium text-amber-800">Revenue Leakage Alert</p>
            <p className="text-xs text-amber-600">$42,000 in unbilled WIP aging &gt;60 days across 3 matters</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="border-amber-300 text-amber-700 hover:bg-amber-100"
          onClick={() => {
            handleNavigation('matters');
            showSuccessToast("Navigating to Matters", "Viewing 3 matters with unbilled WIP");
          }}
        >
          View Matters <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </motion.div>

      {/* AI Insight Panel */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-rose-50 border-l-4 border-rose-400 rounded-r-xl p-4"
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-rose-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-rose-600 uppercase tracking-wide mb-1">AI Insight</p>
            <p className="text-sm text-slate-700">Senior Associate Jane Smith has 2 matters with decisions overdue by 5+ days. Consider reassigning Quest #127 or scheduling a check-in.</p>
          </div>
        </div>
      </motion.div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Decision Latency Trend */}
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <h4 className="text-sm font-semibold text-slate-800 mb-3">Decision Latency (7-day)</h4>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={decisionLatencyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="latency" stroke="#f472b6" strokeWidth={2} dot={{ fill: '#f472b6', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Quest Completion */}
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <h4 className="text-sm font-semibold text-slate-800 mb-3">Quest Completion by Lawyer</h4>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={questCompletionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Bar dataKey="completed" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pending" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Matter Risk Distribution */}
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <h4 className="text-sm font-semibold text-slate-800 mb-3">Matter Risk Distribution</h4>
          <ResponsiveContainer width="100%" height={120}>
            <RechartsPie>
              <Pie
                data={matterRiskData}
                cx="50%"
                cy="50%"
                innerRadius={30}
                outerRadius={50}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
                labelLine={false}
              >
                {matterRiskData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </RechartsPie>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  // Render Matters List
  const renderMattersList = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800">All Matters</h3>
        <Badge variant="outline" className="text-xs">{matters.length} total</Badge>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wide px-4 py-3">Matter</th>
              <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wide px-4 py-3 hidden sm:table-cell">Lead</th>
              <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wide px-4 py-3">Status</th>
              <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wide px-4 py-3 hidden lg:table-cell">Deadline</th>
              <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wide px-4 py-3 hidden md:table-cell">Risk</th>
              <th className="text-right text-xs font-semibold text-slate-600 uppercase tracking-wide px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {matters.map((matter) => (
              <motion.tr 
                key={matter.id}
                whileHover={{ backgroundColor: '#f8fafc' }}
                onClick={() => { setSelectedMatter(matter); setMatterTab('timeline'); setIsAutoPlaying(false); }}
                className="border-b border-slate-100 cursor-pointer"
              >
                <td className="px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{matter.name}</p>
                    <p className="text-xs text-slate-500">{matter.client}</p>
                  </div>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-600">
                      {matter.lead.initials}
                    </div>
                    <span className="text-sm text-slate-600">{matter.lead.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">{getStatusBadge(matter.status)}</td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <span className="text-sm text-slate-600">{new Date(matter.nextDeadline).toLocaleDateString()}</span>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <div className="flex items-center gap-2">
                    <Progress value={matter.riskScore} className="w-16 h-2" />
                    <span className={cn("text-xs font-medium", matter.riskScore > 70 ? 'text-rose-600' : matter.riskScore > 40 ? 'text-amber-600' : 'text-emerald-600')}>{matter.riskScore}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <ChevronRight className="w-4 h-4 text-slate-400 inline" />
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Render Matter Workspace
  const renderMatterWorkspace = () => {
    if (!selectedMatter) return null;
    
    const matterQuests = quests.filter(q => q.matterId === selectedMatter.id);
    
    const timelineSteps = [
      { name: 'Intake', status: 'completed' },
      { name: 'Discovery', status: 'current' },
      { name: 'Depositions', status: 'upcoming' },
      { name: 'Mediation', status: 'upcoming' },
      { name: 'Trial Prep', status: 'upcoming' },
      { name: 'Resolution', status: 'upcoming' },
    ];
    
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setSelectedMatter(null)}
            className="text-slate-500"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold text-slate-800">{selectedMatter.name}</h3>
                <Badge variant="outline" className="text-xs">{selectedMatter.type}</Badge>
              </div>
              <p className="text-sm text-slate-500">Client: {selectedMatter.client} • Lead: {selectedMatter.lead.name}</p>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(selectedMatter.status)}
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100">
                <span className="text-xs text-slate-500">Risk:</span>
                <span className={cn("text-sm font-semibold", selectedMatter.riskScore > 70 ? 'text-rose-600' : 'text-slate-700')}>{selectedMatter.riskScore}/100</span>
              </div>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-1 border-b border-slate-200 -mx-4 px-4 overflow-x-auto">
            {(['timeline', 'quests', 'documents', 'intelligence', 'billing', 'activity'] as MatterTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setMatterTab(tab)}
                className={cn(
                  "px-3 py-2 text-sm font-medium capitalize whitespace-nowrap transition-colors",
                  matterTab === tab 
                    ? "text-rose-600 border-b-2 border-rose-500" 
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {matterTab === 'timeline' && (
            <motion.div 
              key="timeline"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white rounded-xl border border-slate-200 p-4"
            >
              <h4 className="text-sm font-semibold text-slate-800 mb-4">Matter Timeline</h4>
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {timelineSteps.map((step, index) => (
                  <div key={step.name} className="flex items-center">
                    <div className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg border whitespace-nowrap",
                      step.status === 'completed' && "bg-emerald-50 border-emerald-200",
                      step.status === 'current' && "bg-blue-50 border-blue-200 ring-2 ring-blue-300",
                      step.status === 'upcoming' && "bg-slate-50 border-slate-200"
                    )}>
                      {step.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                      {step.status === 'current' && <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />}
                      {step.status === 'upcoming' && <div className="w-4 h-4 rounded-full border-2 border-slate-300" />}
                      <span className={cn(
                        "text-sm font-medium",
                        step.status === 'completed' && "text-emerald-700",
                        step.status === 'current' && "text-blue-700",
                        step.status === 'upcoming' && "text-slate-500"
                      )}>{step.name}</span>
                    </div>
                    {index < timelineSteps.length - 1 && (
                      <ChevronRight className="w-4 h-4 text-slate-300 mx-1" />
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {matterTab === 'quests' && (
            <motion.div 
              key="quests"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              {matterQuests.length > 0 ? matterQuests.map((quest) => (
                <div key={quest.id} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-slate-800">{quest.title}</span>
                        {getQuestStatusBadge(quest.status)}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" /> {quest.owner.name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {new Date(quest.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-xs h-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          showSuccessToast("Date picker opened", `Setting new date for "${quest.title}"`);
                        }}
                      >Set Date</Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-xs h-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          showDemoToast("Delegate Quest", "Opens team member selection to reassign this quest");
                        }}
                      >Delegate</Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-xs h-8 text-rose-600 border-rose-200 hover:bg-rose-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          showDemoToast("Reject Quest", "Quest will be returned to the matter owner with comments");
                        }}
                      >Reject</Button>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-sm text-slate-600">No pending quests for this matter</p>
                </div>
              )}
            </motion.div>
          )}

          {matterTab === 'intelligence' && (
            <motion.div 
              key="intelligence"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* AI Summary */}
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-rose-500" />
                  <h4 className="text-sm font-semibold text-slate-800">AI Case Summary</h4>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Commercial litigation matter involving contractual dispute over supply agreement. Key issues include breach of warranty claims and consequential damages. Discovery phase ongoing with 3 interrogatory responses pending.
                </p>
              </div>

              {/* Similar Cases */}
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h4 className="text-sm font-semibold text-slate-800 mb-3">Similar Cases (AI Matched)</h4>
                <div className="space-y-2">
                  {['Thompson v. Allied Industries (2024)', 'Pacific Trading v. Chen Corp (2023)'].map((case_, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                      <span className="text-sm text-slate-700">{case_}</span>
                      <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700">85% match</Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risk Gaps */}
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <h4 className="text-sm font-semibold text-rose-800">Potential Risk Gaps</h4>
                </div>
                <ul className="space-y-2 text-sm text-rose-700">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2" />
                    Limitation period expires in 45 days — ensure all claims lodged
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2" />
                    Expert witness not yet engaged — competitor deadline approaching
                  </li>
                </ul>
              </div>
            </motion.div>
          )}

          {(matterTab === 'documents' || matterTab === 'billing' || matterTab === 'activity') && (
            <motion.div 
              key={matterTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white rounded-xl border border-slate-200 p-8 text-center"
            >
              <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-600 capitalize">{matterTab} tab content would appear here</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  // Render Work (Quests)
  const renderWork = () => {
    const filteredQuests = quests.filter(q => {
      if (questFilter === 'overdue') return q.status === 'overdue';
      if (questFilter === 'my') return q.owner.initials === 'MT';
      return true;
    });

    return (
      <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { id: 'all' as const, label: 'All Quests', count: undefined },
          { id: 'my' as const, label: 'My Quests', count: undefined },
          { id: 'delegated' as const, label: 'Delegated by Me', count: undefined },
          { id: 'overdue' as const, label: 'Overdue', count: quests.filter(q => q.status === 'overdue').length },
          { id: 'waiting' as const, label: 'Waiting on Others', count: undefined },
        ].map((filter) => (
          <button
            key={filter.id}
            onClick={() => { setQuestFilter(filter.id); setIsAutoPlaying(false); }}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors border",
              questFilter === filter.id
                ? "bg-rose-50 text-rose-700 border-rose-200"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            )}
          >
            {filter.label}
            {filter.count !== undefined && <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-xs">{filter.count}</span>}
          </button>
        ))}
        </div>

        {/* Quest List */}
        <div className="space-y-3">
          {filteredQuests.map((quest) => (
            <motion.div 
              key={quest.id}
              whileHover={{ scale: 1.01 }}
              onClick={() => { setSelectedQuest(quest); setIsAutoPlaying(false); }}
              className="bg-white rounded-xl border border-slate-200 p-4 cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-slate-800">{quest.title}</span>
                    {getQuestStatusBadge(quest.status)}
                    {quest.priority === 'high' && <Badge variant="outline" className="text-xs bg-rose-50 text-rose-700 border-rose-200">High</Badge>}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="text-rose-600 font-medium">{quest.matter}</span>
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" /> {quest.owner.name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Due: {new Date(quest.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Quest Side Panel */}
        <AnimatePresence>
          {selectedQuest && (
            <motion.div
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              className="fixed inset-y-0 right-0 w-full max-w-md bg-white border-l border-slate-200 shadow-xl z-50 overflow-y-auto"
            >
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-800">Quest Details</h3>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedQuest(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="text-xs text-slate-500 uppercase tracking-wide">Task</span>
                    <p className="text-sm font-medium text-slate-800 mt-1">{selectedQuest.title}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 uppercase tracking-wide">Matter</span>
                    <p className="text-sm text-rose-600 mt-1">{selectedQuest.matter}</p>
                  </div>
                  <div className="flex gap-4">
                    <div>
                      <span className="text-xs text-slate-500 uppercase tracking-wide">Owner</span>
                      <p className="text-sm text-slate-800 mt-1">{selectedQuest.owner.name}</p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 uppercase tracking-wide">Due</span>
                      <p className={cn("text-sm mt-1", selectedQuest.status === 'overdue' ? 'text-rose-600 font-medium' : 'text-slate-800')}>
                        {new Date(selectedQuest.dueDate).toLocaleDateString()}
                        {selectedQuest.status === 'overdue' && ' (Overdue)'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* AI Suggestion */}
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-rose-600" />
                    <span className="text-xs font-semibold text-rose-700 uppercase tracking-wide">AI Suggestion</span>
                  </div>
                  <p className="text-sm text-slate-700 mb-3">
                    Similar responses found in Williams v. State matter (85% match). Consider reusing template to save 2-3 hours.
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-xs border-rose-200 text-rose-700 hover:bg-rose-100"
                      onClick={() => showSuccessToast("Opening Template", "Loading Williams v. State template (85% match)")}
                    >
                      View Template
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="text-xs text-slate-500"
                      onClick={() => showDemoToast("Suggestion Ignored", "AI will learn from this preference")}
                    >
                      Ignore
                    </Button>
                  </div>
                </div>

                {/* Decision Buttons */}
                <div className="space-y-3 pt-4 border-t border-slate-200">
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Decision Required</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => {
                        showSuccessToast("Quest Completed!", `"${selectedQuest.title}" marked as done`);
                        setSelectedQuest(null);
                      }}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" /> Complete
                    </Button>
                    <Button 
                      variant="outline" 
                      className="border-amber-300 text-amber-700 hover:bg-amber-50"
                      onClick={() => showDemoToast("Escalate Quest", "Notifies Managing Partner and increases priority")}
                    >
                      <TrendingUp className="w-4 h-4 mr-2" /> Escalate
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => showDemoToast("Reassign Quest", "Opens team member selector for reassignment")}
                    >
                      <ArrowRight className="w-4 h-4 mr-2" /> Reassign
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => showDemoToast("Extend Deadline", "Opens date picker to set new due date")}
                    >
                      <Clock className="w-4 h-4 mr-2" /> Extend
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  // Render Knowledge
  const renderKnowledge = () => {
    const categories = [
      { id: 'playbooks', label: 'Firm Playbooks', icon: BookOpen },
      { id: 'arguments', label: 'Reusable Arguments', icon: Gavel },
      { id: 'clauses', label: 'Preferred Clauses', icon: FileText },
      { id: 'learnings', label: 'Case Learnings', icon: Sparkles },
    ];

    return (
      <div className="space-y-4">
        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const count = knowledgeItems.filter(k => k.category === cat.id).length;
            return (
              <div key={cat.id} className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-slate-200 whitespace-nowrap">
                <Icon className="w-4 h-4 text-rose-500" />
                <span className="text-sm font-medium text-slate-700">{cat.label}</span>
                <Badge variant="outline" className="text-xs">{count}</Badge>
              </div>
            );
          })}
        </div>

        {/* Knowledge Items */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {knowledgeItems.map((item) => (
            <motion.div 
              key={item.id}
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-xl border border-slate-200 p-4 cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <span className="text-sm font-medium text-slate-800">{item.title}</span>
                  <p className="text-xs text-slate-500 mt-0.5">Created from: {item.createdFrom}</p>
                </div>
                <Badge variant="outline" className="text-xs capitalize">{item.category}</Badge>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span>Used: {item.usedCount} times</span>
                <span>Last: {item.lastUsed}</span>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                <span className="text-xs text-slate-500">
                  Contributor: {item.contributor} <span className="text-emerald-600">(+{item.trustPoints} Trust)</span>
                </span>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-xs h-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      showSuccessToast("Opening Knowledge Item", `Loading "${item.title}"`);
                    }}
                  >View</Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-xs h-7 bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      showSuccessToast("Copied to Matter", `"${item.title}" added to current matter`);
                    }}
                  >Copy to Matter</Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  // Render Clients
  const renderClients = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800">Client Portfolio</h3>
        <Badge variant="outline" className="text-xs">{clients.length} clients</Badge>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wide px-4 py-3">Client</th>
              <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wide px-4 py-3 hidden sm:table-cell">Matters</th>
              <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wide px-4 py-3">Responsiveness</th>
              <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wide px-4 py-3 hidden md:table-cell">Revenue</th>
              <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wide px-4 py-3 hidden lg:table-cell">Outstanding</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <motion.tr 
                key={client.id}
                whileHover={{ backgroundColor: '#f8fafc' }}
                className="border-b border-slate-100 cursor-pointer"
              >
                <td className="px-4 py-3">
                  <span className="text-sm font-medium text-slate-800">{client.name}</span>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <Badge variant="outline" className="text-xs">{client.activeMatters} active</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className={cn(
                    "text-xs capitalize",
                    client.responsiveness === 'high' && "bg-emerald-50 text-emerald-700 border-emerald-200",
                    client.responsiveness === 'medium' && "bg-amber-50 text-amber-700 border-amber-200",
                    client.responsiveness === 'low' && "bg-rose-50 text-rose-700 border-rose-200"
                  )}>
                    {client.responsiveness}
                  </Badge>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="text-sm text-slate-700">${client.revenueToDate.toLocaleString()}</span>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <span className={cn("text-sm", client.outstanding > 50000 ? 'text-rose-600 font-medium' : 'text-slate-700')}>
                    ${client.outstanding.toLocaleString()}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Render Firm
  const renderFirm = () => (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl border border-slate-200 p-1">
        {(['accountability', 'performance', 'risk', 'revenue'] as FirmTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => { setFirmTab(tab); setIsAutoPlaying(false); }}
            className={cn(
              "flex-1 px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors",
              firmTab === tab 
                ? "bg-rose-50 text-rose-700" 
                : "text-slate-600 hover:bg-slate-50"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {firmTab === 'accountability' && (
          <motion.div 
            key="accountability"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-xl border border-slate-200 overflow-hidden"
          >
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wide px-4 py-3">Lawyer</th>
                  <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wide px-4 py-3 hidden sm:table-cell">Accepted</th>
                  <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wide px-4 py-3 hidden md:table-cell">Delayed</th>
                  <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wide px-4 py-3 hidden lg:table-cell">Avg Latency</th>
                  <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wide px-4 py-3">Trust Score</th>
                </tr>
              </thead>
              <tbody>
                {lawyers.map((lawyer) => (
                  <tr key={lawyer.id} className="border-b border-slate-100">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-600">
                          {lawyer.initials}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800">{lawyer.name}</p>
                          <p className="text-xs text-slate-500">{lawyer.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-sm text-slate-700">{lawyer.questsAccepted}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={cn("text-sm", lawyer.questsDelayed > 2 ? 'text-rose-600 font-medium' : 'text-slate-700')}>
                        {lawyer.questsDelayed}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className={cn("text-sm", lawyer.avgLatency > 2 ? 'text-amber-600' : 'text-slate-700')}>
                        {lawyer.avgLatency} days
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Progress value={lawyer.trustScore} className="w-16 h-2" />
                        <span className={cn("text-sm font-semibold", getTrustScoreColor(lawyer.trustScore))}>
                          {lawyer.trustScore}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}

        {firmTab === 'risk' && (
          <motion.div 
            key="risk"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Risk Alerts */}
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <h4 className="text-sm font-semibold text-rose-800">High Risk Items</h4>
              </div>
              <ul className="space-y-2">
                <li className="flex items-center justify-between py-2 border-b border-rose-100">
                  <span className="text-sm text-slate-700">Estate of Williams - Court deadline in 2 days</span>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-xs border-rose-200 text-rose-700"
                    onClick={() => {
                      setSelectedMatter(matters.find(m => m.name.includes('Williams')) || null);
                      showSuccessToast("Opening Matter", "Estate of Williams loaded");
                    }}
                  >View</Button>
                </li>
                <li className="flex items-center justify-between py-2 border-b border-rose-100">
                  <span className="text-sm text-slate-700">Jane Smith - 3 consecutive delayed quests</span>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-xs border-rose-200 text-rose-700"
                    onClick={() => showDemoToast("Review Performance", "Opens Jane Smith's accountability dashboard")}
                  >Review</Button>
                </li>
                <li className="flex items-center justify-between py-2">
                  <span className="text-sm text-slate-700">2 filings under-reviewed (missing sign-off)</span>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-xs border-rose-200 text-rose-700"
                    onClick={() => showDemoToast("Assign Reviewer", "Opens lawyer selection for filing review")}
                  >Assign</Button>
                </li>
              </ul>
            </div>

            {/* Deadline Exposure */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h4 className="text-sm font-semibold text-slate-800 mb-3">Deadline Exposure (Next 7 Days)</h4>
              <div className="space-y-2">
                {matters.filter(m => new Date(m.nextDeadline) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).map((matter) => (
                  <div key={matter.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                    <div>
                      <span className="text-sm text-slate-800">{matter.name}</span>
                      <p className="text-xs text-slate-500">{matter.lead.name}</p>
                    </div>
                    <div className="text-right">
                      <span className={cn("text-sm font-medium", matter.status === 'overdue' ? 'text-rose-600' : 'text-amber-600')}>
                        {new Date(matter.nextDeadline).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {firmTab === 'revenue' && (
          <motion.div 
            key="revenue"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-xl border border-slate-200 p-4"
          >
            <h4 className="text-sm font-semibold text-slate-800 mb-4">Monthly Revenue Trend</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={(v) => `$${v/1000}k`} />
                <Tooltip contentStyle={{ fontSize: 12 }} formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']} />
                <Bar dataKey="revenue" fill="#f472b6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {firmTab === 'performance' && (
          <motion.div 
            key="performance"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {performanceMetricsData.firmKPIs.map((kpi, index) => (
                <div key={index} className="bg-white rounded-xl border border-slate-200 p-4">
                  <p className="text-xs text-slate-500 mb-1">{kpi.label}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold text-slate-800">{kpi.value}</span>
                    <span className="text-[10px] text-slate-400">/ {kpi.target}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="w-3 h-3 text-emerald-500" />
                    <span className="text-[10px] text-emerald-600">{kpi.change}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Utilization & Throughput Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Lawyer Utilization */}
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h4 className="text-sm font-semibold text-slate-800 mb-3">Lawyer Utilization (%)</h4>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={performanceMetricsData.utilizationByLawyer} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} stroke="#94a3b8" />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} stroke="#94a3b8" width={60} />
                    <Tooltip contentStyle={{ fontSize: 11 }} />
                    <Bar dataKey="billable" stackId="a" fill="#10b981" name="Billable" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="nonBillable" stackId="a" fill="#60a5fa" name="Non-Billable" />
                    <Bar dataKey="admin" stackId="a" fill="#e2e8f0" name="Admin" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-[10px] text-slate-500">Billable</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                    <span className="text-[10px] text-slate-500">Non-Billable</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                    <span className="text-[10px] text-slate-500">Admin</span>
                  </div>
                </div>
              </div>

              {/* Matter Throughput */}
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h4 className="text-sm font-semibold text-slate-800 mb-3">Matter Throughput</h4>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={performanceMetricsData.matterThroughput}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                    <Tooltip contentStyle={{ fontSize: 11 }} />
                    <Bar dataKey="opened" fill="#60a5fa" name="Opened" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="closed" fill="#10b981" name="Closed" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                    <span className="text-[10px] text-slate-500">Opened</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-[10px] text-slate-500">Closed</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Practice Area Revenue & Deadline Compliance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Practice Area Revenue */}
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h4 className="text-sm font-semibold text-slate-800 mb-3">Revenue by Practice Area</h4>
                <div className="space-y-2">
                  {performanceMetricsData.practiceAreaRevenue.map((area) => (
                    <div key={area.area} className="flex items-center gap-3">
                      <div className="w-16 text-xs text-slate-600 shrink-0">{area.area}</div>
                      <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500"
                          style={{ 
                            width: `${(area.revenue / 200000) * 100}%`,
                            backgroundColor: area.color 
                          }}
                        />
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-semibold text-slate-700">${(area.revenue / 1000).toFixed(0)}K</span>
                        <span className="text-[10px] text-slate-400 ml-1">({area.matters})</span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 mt-3 text-center">Revenue (Active Matters)</p>
              </div>

              {/* Deadline Compliance */}
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-slate-800">Deadline Compliance</h4>
                  <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                    93% On-Time
                  </Badge>
                </div>
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={performanceMetricsData.deadlineCompliance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="period" tick={{ fontSize: 9 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 9 }} stroke="#94a3b8" />
                    <Tooltip contentStyle={{ fontSize: 11 }} />
                    <Bar dataKey="onTime" stackId="a" fill="#10b981" name="On Time" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="late" stackId="a" fill="#ef4444" name="Late" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-[10px] text-slate-500">On Time</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span className="text-[10px] text-slate-500">Late</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // Render Court Deadlines Calendar
  const renderCalendar = () => {
    // State moved to component top level to follow Rules of Hooks
    
    const filteredDeadlines = courtDeadlines.filter(d => {
      if (calendarFilter === 'court') return d.isCourt;
      if (calendarFilter === 'internal') return !d.isCourt;
      if (calendarFilter === 'overdue') return d.status === 'overdue';
      return true;
    });

    const getPriorityBadge = (priority: CourtDeadline['priority']) => {
      const styles = {
        'critical': 'bg-rose-50 text-rose-700 border-rose-200',
        'high': 'bg-amber-50 text-amber-700 border-amber-200',
        'medium': 'bg-slate-50 text-slate-700 border-slate-200',
      };
      const shortLabel = priority === 'critical' ? 'Crit' : priority === 'high' ? 'High' : 'Med';
      return (
        <Badge variant="outline" className={cn("text-[10px] sm:text-xs font-medium capitalize px-1.5 sm:px-2", styles[priority])}>
          <span className="sm:hidden">{shortLabel}</span>
          <span className="hidden sm:inline">{priority}</span>
        </Badge>
      );
    };

    const getStatusIndicator = (deadline: CourtDeadline) => {
      if (deadline.status === 'overdue') {
        return <span className="text-[10px] sm:text-xs font-semibold text-rose-600 whitespace-nowrap">{Math.abs(deadline.daysRemaining)}d late</span>;
      }
      if (deadline.status === 'due-soon') {
        return <span className="text-[10px] sm:text-xs font-semibold text-amber-600 whitespace-nowrap">{deadline.daysRemaining} days</span>;
      }
      return <span className="text-[10px] sm:text-xs text-slate-500 whitespace-nowrap">{deadline.daysRemaining} days</span>;
    };

    // Generate calendar grid
    const getDaysInMonth = (date: Date) => {
      const year = date.getFullYear();
      const month = date.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      const startingDay = firstDay.getDay();
      
      const days: { date: Date; deadlines: CourtDeadline[] }[] = [];
      
      // Add empty slots for days before the first of the month
      for (let i = 0; i < startingDay; i++) {
        days.push({ date: new Date(year, month, -startingDay + i + 1), deadlines: [] });
      }
      
      // Add days of the month
      for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(year, month, day);
        const dateStr = currentDate.toISOString().split('T')[0];
        const dayDeadlines = filteredDeadlines.filter(d => d.dueDate === dateStr);
        days.push({ date: currentDate, deadlines: dayDeadlines });
      }
      
      return days;
    };

    const calendarDays = getDaysInMonth(selectedMonth);
    const monthName = selectedMonth.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' });

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Court Deadlines Calendar</h3>
            <p className="text-sm text-slate-500">Auto-calculated deadlines by matter type</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-slate-200 overflow-hidden">
              <button
                onClick={() => setCalendarView('list')}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium transition-colors",
                  calendarView === 'list' ? "bg-rose-50 text-rose-700" : "bg-white text-slate-600 hover:bg-slate-50"
                )}
              >
                List
              </button>
              <button
                onClick={() => setCalendarView('calendar')}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium transition-colors",
                  calendarView === 'calendar' ? "bg-rose-50 text-rose-700" : "bg-white text-slate-600 hover:bg-slate-50"
                )}
              >
                Calendar
              </button>
            </div>
          </div>
        </div>

        {/* AI Insight */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-rose-50 border-l-4 border-rose-400 rounded-r-xl p-4"
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-rose-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-rose-600 uppercase tracking-wide mb-1">Deadline Intelligence</p>
              <p className="text-sm text-slate-700">
                {filteredDeadlines.filter(d => d.status === 'overdue').length} overdue deadlines require immediate attention. 
                {filteredDeadlines.filter(d => d.status === 'due-soon' && d.isCourt).length} court deadlines due within 7 days.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { id: 'all' as const, label: 'All Deadlines', count: courtDeadlines.length },
            { id: 'court' as const, label: 'Court Deadlines', count: courtDeadlines.filter(d => d.isCourt).length },
            { id: 'internal' as const, label: 'Internal Deadlines', count: courtDeadlines.filter(d => !d.isCourt).length },
            { id: 'overdue' as const, label: 'Overdue', count: courtDeadlines.filter(d => d.status === 'overdue').length },
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setCalendarFilter(filter.id)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors border",
                calendarFilter === filter.id
                  ? "bg-rose-50 text-rose-700 border-rose-200"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              )}
            >
              {filter.label}
              <span className={cn(
                "ml-1.5 px-1.5 py-0.5 rounded-full text-xs",
                filter.id === 'overdue' && filter.count > 0 ? "bg-rose-500 text-white" : "bg-slate-100 text-slate-600"
              )}>{filter.count}</span>
            </button>
          ))}
        </div>

        {calendarView === 'list' ? (
          /* List View */
          <div className="space-y-3">
            {filteredDeadlines.slice(0, 10).map((deadline) => (
              <motion.div 
                key={deadline.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  "bg-white rounded-xl border p-3 sm:p-4 hover:shadow-md transition-shadow",
                  deadline.status === 'overdue' ? "border-rose-200" : 
                  deadline.status === 'due-soon' ? "border-amber-200" : "border-slate-200"
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                      <span className="text-xs sm:text-sm font-medium text-slate-800">{deadline.deadlineName}</span>
                      {getPriorityBadge(deadline.priority)}
                      {deadline.isCourt && (
                        <Badge variant="outline" className="text-[10px] sm:text-xs bg-blue-50 text-blue-700 border-blue-200 px-1.5">
                          <Gavel className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" /> Court
                        </Badge>
                      )}
                    </div>
                    <p className="text-[10px] sm:text-xs text-rose-600 font-medium mb-1 truncate">{deadline.matterName}</p>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[10px] sm:text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> 
                        <span className="sm:hidden">{new Date(deadline.dueDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}</span>
                        <span className="hidden sm:inline">{new Date(deadline.dueDate).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> 
                        <span className="sm:hidden">{deadline.assignedTo.split(' ')[0]}</span>
                        <span className="hidden sm:inline">{deadline.assignedTo}</span>
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 truncate hidden sm:block">Triggered by: {deadline.triggerEvent}</p>
                  </div>
                  <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 flex-shrink-0">
                    {getStatusIndicator(deadline)}
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-[10px] sm:text-xs h-6 sm:h-7 px-2 sm:px-3"
                      onClick={(e) => {
                        e.stopPropagation();
                        const matter = matters.find(m => m.id === deadline.matterId);
                        if (matter) {
                          setSelectedMatter(matter);
                          setActivePage('matters');
                          showSuccessToast("Opening Matter", `Loading ${deadline.matterName}`);
                        }
                      }}
                    >
                      <span className="sm:hidden">View</span>
                      <span className="hidden sm:inline">View Matter</span>
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
            
            {filteredDeadlines.length === 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm text-slate-600">No deadlines matching this filter</p>
              </div>
            )}
          </div>
        ) : (
          /* Calendar View */
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {/* Calendar Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <button
                onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1))}
                className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </button>
              <h4 className="text-sm font-semibold text-slate-800">{monthName}</h4>
              <button
                onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1))}
                className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-slate-600" />
              </button>
            </div>
            
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 border-b border-slate-200">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="p-2 text-center text-xs font-medium text-slate-500 uppercase">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar Grid */}
            <div className="grid grid-cols-7">
              {calendarDays.map((day, index) => {
                const isCurrentMonth = day.date.getMonth() === selectedMonth.getMonth();
                const isToday = day.date.toDateString() === new Date().toDateString();
                const hasOverdue = day.deadlines.some(d => d.status === 'overdue');
                const hasDueSoon = day.deadlines.some(d => d.status === 'due-soon');
                
                return (
                  <div 
                    key={index}
                    className={cn(
                      "min-h-[60px] sm:min-h-[80px] p-1 sm:p-2 border-b border-r border-slate-100",
                      !isCurrentMonth && "bg-slate-50 opacity-50",
                      isToday && "bg-blue-50"
                    )}
                  >
                    <div className={cn(
                      "text-xs font-medium mb-1",
                      isToday ? "text-blue-600" : "text-slate-600"
                    )}>
                      {day.date.getDate()}
                    </div>
                    <div className="space-y-0.5">
                      {day.deadlines.slice(0, 2).map((dl) => (
                        <div 
                          key={dl.id}
                          className={cn(
                            "text-[10px] px-1 py-0.5 rounded truncate",
                            dl.status === 'overdue' ? "bg-rose-100 text-rose-700" :
                            dl.status === 'due-soon' ? "bg-amber-100 text-amber-700" :
                            "bg-slate-100 text-slate-600"
                          )}
                          title={`${dl.deadlineName} - ${dl.matterName}`}
                        >
                          {dl.deadlineName.slice(0, 12)}...
                        </div>
                      ))}
                      {day.deadlines.length > 2 && (
                        <div className="text-[10px] text-slate-500 px-1">
                          +{day.deadlines.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Deadline Rules Reference */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h4 className="text-sm font-semibold text-slate-800 mb-3">Auto-Calculation Rules by Matter Type</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(deadlineRulesByType).slice(0, 6).map(([type, rules]) => (
              <div key={type} className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs font-semibold text-slate-700 mb-2">{type}</p>
                <ul className="space-y-1">
                  {rules.slice(0, 3).map((rule, i) => (
                    <li key={i} className="flex items-center gap-2 text-[10px] text-slate-500">
                      <span className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        rule.priority === 'critical' ? 'bg-rose-500' :
                        rule.priority === 'high' ? 'bg-amber-500' : 'bg-slate-400'
                      )} />
                      {rule.name} ({rule.daysFromTrigger}d)
                    </li>
                  ))}
                  {rules.length > 3 && (
                    <li className="text-[10px] text-slate-400">+{rules.length - 3} more rules</li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render AI Credits
  const renderCredits = () => (
    <div className="space-y-4">
      {/* Credits Overview */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">AI Credits</h3>
            <p className="text-sm text-slate-500">Monthly usage</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-rose-600" />
          </div>
        </div>
        <div className="mb-4">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold text-slate-800">2,340</span>
            <span className="text-sm text-slate-500">/ 5,000 credits remaining</span>
          </div>
          <Progress value={47} className="h-3" />
          <p className="text-xs text-slate-500 mt-2">47% of monthly allocation used</p>
        </div>
        <div className="flex gap-3">
          <Button 
            className="bg-rose-500 hover:bg-rose-600 text-white"
            onClick={() => showDemoToast("Purchase Credits", "Opens credit purchase page with volume pricing options")}
          >
            Purchase More
          </Button>
          <Button 
            variant="outline"
            onClick={() => showSuccessToast("Loading Usage Details", "Detailed breakdown by user and feature")}
          >
            View Usage Details
          </Button>
        </div>
      </div>

      {/* Usage Breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h4 className="text-sm font-semibold text-slate-800 mb-4">Usage by Category</h4>
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <ResponsiveContainer width="100%" height={180}>
              <RechartsPie>
                <Pie
                  data={creditUsageData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  dataKey="value"
                >
                  {creditUsageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`${value} credits`, '']} />
              </RechartsPie>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-3">
            {creditUsageData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-slate-700">{item.name}</span>
                </div>
                <span className="text-sm font-medium text-slate-800">{item.value.toLocaleString()} credits</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-slate-50 rounded-2xl border border-slate-200 shadow-xl overflow-hidden h-[520px] sm:h-[680px] lg:h-[780px] w-full max-w-5xl mx-auto flex">
      {/* Sidebar */}
      <div className="w-56 bg-white border-r border-slate-200 flex-shrink-0 hidden md:flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-rose-400 to-rose-500 flex items-center justify-center">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-slate-800 text-sm">Law Firm OS</span>
              <p className="text-[10px] text-slate-500">Operations Platform</p>
            </div>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-rose-50 text-rose-700 border-l-2 border-rose-500" 
                    : "text-slate-600 hover:bg-slate-50"
                )}
              >
                <Icon className={cn("w-4 h-4", isActive && "text-rose-600")} />
                {item.label}
                {item.badge && (
                  <Badge variant="outline" className="ml-auto text-[10px] h-5 bg-rose-50 text-rose-600 border-rose-200">
                    {item.badge}
                  </Badge>
                )}
              </button>
            );
          })}
        </nav>

        {/* Credits Widget */}
        <div className="p-3 border-t border-slate-100">
          <button 
            onClick={() => handleNavigation('credits')}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
              activePage === 'credits' ? "bg-rose-50" : "hover:bg-slate-50"
            )}
          >
            <Sparkles className="w-4 h-4 text-rose-500" />
            <div className="flex-1 text-left">
              <span className="text-xs font-medium text-slate-700 block">AI Credits</span>
              <span className="text-[10px] text-slate-500">2,340 / 5,000</span>
            </div>
          </button>
        </div>

        {/* User */}
        <div className="p-3 border-t border-slate-100">
          <div className="flex items-center gap-2 px-2">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-600">
              MT
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-slate-700">Marcus Thompson</p>
              <p className="text-[10px] text-slate-500">Managing Partner</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search matters, clauses, precedents..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const value = (e.target as HTMLInputElement).value;
                    if (value.trim()) {
                      showSuccessToast("Searching...", `Looking for "${value}" across all matters and knowledge base`);
                    }
                  }
                }}
                onFocus={() => showDemoToast("Search", "Type to search matters, clauses, and precedents")}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <InlineDemoSpeedControl compact className="hidden lg:flex" />
            <button 
              className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors"
              onClick={() => showSuccessToast("Notifications", `You have ${notifications} unread notifications`)}
            >
              <Bell className="w-5 h-5 text-slate-600" />
              {notifications > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-medium flex items-center justify-center">
                  {notifications}
                </span>
              )}
            </button>
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-600 md:hidden">
              MT
            </div>
          </div>
        </div>

        {/* Mobile Nav with swipe and arrows */}
        <MobileNavWithSwipe 
          navItems={navItems}
          activePage={activePage}
          onNavigate={handleNavigation}
        />

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedMatter ? 'workspace' : activePage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {selectedMatter ? renderMatterWorkspace() : (
                <>
                  {activePage === 'dashboard' && renderDashboard()}
                  {activePage === 'matters' && renderMattersList()}
                  {activePage === 'calendar' && renderCalendar()}
                  {activePage === 'work' && renderWork()}
                  {activePage === 'knowledge' && renderKnowledge()}
                  {activePage === 'clients' && renderClients()}
                  {activePage === 'firm' && renderFirm()}
                  {activePage === 'credits' && renderCredits()}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
