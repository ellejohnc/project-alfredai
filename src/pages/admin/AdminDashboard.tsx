import { useEffect, useState, useCallback, useMemo, useRef, Suspense } from 'react';
import { AdminSpotlight } from '@/components/admin/AdminSpotlight';
import { SpotlightTrigger } from '@/components/admin/SpotlightTrigger';
import { ContentHealth } from '@/components/admin/ContentHealth';
import ForcePasswordChangeDialog from '@/components/admin/ForcePasswordChangeDialog';
import { useNavigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { useAdminTheme, THEME_PRESETS } from '@/contexts/AdminThemeContext';
import { AdminThemeProvider } from '@/contexts/AdminThemeProvider';
import { ViewAsProvider } from '@/contexts/ViewAsProvider';
import ViewAsBanner from '@/components/admin/ViewAsBanner';
import { usePermissions } from '@/hooks/usePermissions';
import { canViewCompanySalesFigures } from '@/lib/salesFiguresAccess';
import { useFeatureFlag } from '@/hooks/useFeatureFlags';
import { useActivityTracker } from '@/hooks/useActivityTracker';
import { useLeadCounts } from '@/hooks/useLeadCounts';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  LayoutDashboard,
  Calendar,
  BookOpen,
  FileText,
  MessageSquareQuote,
  HelpCircle,
  FileCode,
  LogOut,
  Menu,
  X,
  Loader2,
  Settings,
  Users,
  Mail,
  UserCheck,
  Clock,
  Inbox,
  PenLine,
  User,
  History,
  Sun,
  Moon,
  Briefcase,
  Cloud,
  Palette,
  Video,
  Send,
  BarChart3,
  Radio,
  RefreshCw,
  MapPin,
  Play,
  Activity,
  Flag,
  Plug,
  Monitor,
  Sparkles,
  DollarSign,
  PanelLeftClose,
  PanelLeftOpen,
  Eye,
  Download,
  TrendingUp,
  Megaphone,
  Handshake,
  Archive,
  ScrollText,

} from 'lucide-react';
import AdminNotificationBell from '@/components/admin/AdminNotificationBell';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import alfredLogo from '@/assets/alfred-ai-mid.png';
import alfredLogoWhite from '@/assets/alfred-ai-white-mid.png';
import { AdminMobileBottomNav } from '@/components/admin/AdminMobileBottomNav';
import { DistributorDashboard } from '@/components/admin/DistributorDashboard';

interface ContentStats {
  webinars: number;
  guides: number;
  blogs: number;
  testimonials: number;
  faqs: number;
  docs: number;
  leads: number;
  leadsBooked: number;
  registrations: number;
  investorLeads: number;
  ghlSubmissions: number;
  meetings: number;
}

// Sidebar organized by categories
const dashboardItem = { name: 'Dashboard', icon: LayoutDashboard, path: '/admin' };

const contentItems = [
  { name: 'Webinars & Events', icon: Calendar, path: '/admin/webinars' },
  { name: 'Guides & Playbooks', icon: BookOpen, path: '/admin/guides' },
  { name: 'Blog Posts', icon: PenLine, path: '/admin/blog' },
  { name: 'Job Openings', icon: Briefcase, path: '/admin/jobs' },
  { name: 'Testimonials', icon: MessageSquareQuote, path: '/admin/testimonials' },
  { name: 'FAQs', icon: HelpCircle, path: '/admin/faqs' },
  { name: 'Documentation', icon: FileCode, path: '/admin/docs' },
  { name: 'Job Applications', icon: User, path: '/admin/job-applications' },
];

const accountItems = [
  { name: 'My Settings', icon: Settings, path: '/admin/settings/account' },
  { name: 'Theme', icon: Palette, path: '/admin/settings/theme' },
];

function ThemeQuickToggle() {
  const { config, updateConfig, isDark } = useAdminTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Theme">
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {THEME_PRESETS.map((preset) => (
          <DropdownMenuItem
            key={preset.key}
            onClick={() => updateConfig({ preset: preset.key })}
            className={cn(config.preset === preset.key && 'bg-accent')}
          >
            {preset.key === 'system' ? (
              <Monitor className="h-4 w-4 mr-2" />
            ) : preset.isDark ? (
              <Moon className="h-4 w-4 mr-2" />
            ) : (
              <Sun className="h-4 w-4 mr-2" />
            )}
            {preset.label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/admin/settings/theme" className="flex items-center">
            <Palette className="h-4 w-4 mr-2" />
            Customize...
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const location = useLocation();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const effectiveTheme = resolvedTheme ?? theme;
  const { user, isAdmin, isLoading, signOut } = useAdminAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try { return localStorage.getItem('admin-sidebar-collapsed') === 'true'; } catch { return false; }
  });
  const [stats, setStats] = useState<ContentStats>({
    webinars: 0,
    guides: 0,
    blogs: 0,
    testimonials: 0,
    faqs: 0,
    docs: 0,
    leads: 0,
    leadsBooked: 0,
    registrations: 0,
    investorLeads: 0,
    ghlSubmissions: 0,
    meetings: 0
  });
  const [pendingPartnerApps, setPendingPartnerApps] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Debounce ref to prevent 11 subscriptions firing 9 DB queries each simultaneously
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Theme cleanup on unmount is now handled by AdminThemeProvider

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/admin/login');
    } else if (!isLoading && user && !isAdmin) {
      // User exists but lacks admin role — stay on page, fetchStats will fail gracefully
      console.warn('[AdminDashboard] User authenticated but not admin');
    }
  }, [user, isAdmin, isLoading, navigate]);

  const fetchStats = useCallback(async () => {
    try {
      const [
        webinars,
        guides,
        blogs,
        testimonials,
        faqs,
        docs,
        registrations,
        investorLeads,
        leadCounts,
      ] = await Promise.all([
        supabase.from('webinars_events').select('id', { count: 'exact', head: true }),
        supabase.from('guides_playbooks').select('id', { count: 'exact', head: true }),
        supabase.from('blog_posts').select('id', { count: 'exact', head: true }),
        supabase.from('testimonials').select('id', { count: 'exact', head: true }),
        supabase.from('faqs').select('id', { count: 'exact', head: true }),
        supabase.from('documentation').select('id', { count: 'exact', head: true }),
        supabase.from('event_registrations').select('id', { count: 'exact', head: true }),
        supabase.from('investor_leads').select('id', { count: 'exact', head: true }),
        supabase.rpc('get_admin_dashboard_lead_counts'),
      ]);

      const leadCountsRow = (leadCounts.data?.[0] || {}) as {
        leads_count?: number;
        ghl_submissions_count?: number;
        leads_booked_count?: number;
        meetings_count?: number;
      };

      setStats({
        webinars: webinars.count || 0,
        guides: guides.count || 0,
        blogs: blogs.count || 0,
        testimonials: testimonials.count || 0,
        faqs: faqs.count || 0,
        docs: docs.count || 0,
        leads: leadCountsRow.leads_count || 0,
        leadsBooked: leadCountsRow.leads_booked_count || 0,
        registrations: registrations.count || 0,
        investorLeads: investorLeads.count || 0,
        ghlSubmissions: leadCountsRow.ghl_submissions_count || 0,
        meetings: leadCountsRow.meetings_count || 0,
      });

      // Pending partner applications — only admins/super_admins can read this table.
      if (isAdmin) {
        const { count } = await supabase
          .from('partner_applications')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending');
        setPendingPartnerApps(count || 0);
      }

      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
      toast.error('Failed to refresh dashboard stats');
    }
  }, [isAdmin]);

  // Debounced version to prevent burst firing from realtime subscriptions
  const debouncedFetchStats = useCallback(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      fetchStats();
      // Keep the shared lead-count source of truth fresh on realtime changes.
      queryClient.invalidateQueries({ queryKey: ['unified-leads'] });
    }, 1500);
  }, [fetchStats, queryClient]);


  useEffect(() => {
    if (user && isAdmin) {
      fetchStats();

      const channel = supabase
        .channel('admin-dashboard-stats')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'webinars_events' }, debouncedFetchStats)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'guides_playbooks' }, debouncedFetchStats)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'blog_posts' }, debouncedFetchStats)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'testimonials' }, debouncedFetchStats)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'faqs' }, debouncedFetchStats)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'documentation' }, debouncedFetchStats)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, debouncedFetchStats)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'event_registrations' }, debouncedFetchStats)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'investor_leads' }, debouncedFetchStats)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'ghl_submissions' }, debouncedFetchStats)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'investor_bookings' }, debouncedFetchStats)
        .subscribe((status) => {
          setIsRealtimeConnected(status === 'SUBSCRIBED');
        });

      return () => {
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        supabase.removeChannel(channel);
      };
    }
  }, [user, isAdmin, debouncedFetchStats, fetchStats]);

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully');
    navigate('/admin/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const needsPasswordChange = user?.user_metadata?.force_password_change === true;

  const isExactDashboard = location.pathname === '/admin';

  return (
    <>
    <ForcePasswordChangeDialog
      open={needsPasswordChange}
      onPasswordChanged={() => {
        // Refresh the session to get updated metadata
        supabase.auth.refreshSession();
      }}
    />
    <AdminThemeProvider>
      <ViewAsProvider>
        <AdminDashboardContent
          user={user}
          navigate={navigate}
          location={location}
          theme={effectiveTheme}
          setTheme={setTheme}
          signOut={signOut}
          stats={stats}
          pendingPartnerApps={pendingPartnerApps}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={(v: boolean) => {
            setSidebarCollapsed(v);
            try {
              localStorage.setItem('admin-sidebar-collapsed', String(v));
            } catch {
              // The sidebar still collapses; only the preference fails to persist.
            }
          }}
          lastUpdated={lastUpdated}
          isRealtimeConnected={isRealtimeConnected}
          isRefreshing={isRefreshing}
          isExactDashboard={isExactDashboard}
          onRefresh={async () => {
            setIsRefreshing(true);
            await fetchStats();
            setIsRefreshing(false);
          }}
          onSignOut={handleSignOut}
        />
      </ViewAsProvider>
    </AdminThemeProvider>
    </>
  );
}

interface AdminDashboardContentProps {
  user: any;
  navigate: any;
  location: any;
  theme: string | undefined;
  setTheme: (theme: string) => void;
  signOut: () => Promise<void>;
  stats: ContentStats;
  pendingPartnerApps: number;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  lastUpdated: Date | null;
  isRealtimeConnected: boolean;
  isRefreshing: boolean;
  isExactDashboard: boolean;
  onRefresh: () => Promise<void>;
  onSignOut: () => void;
}

function AdminDashboardContent({
  user,
  navigate,
  location,
  theme,
  setTheme,
  signOut,
  stats,
  pendingPartnerApps,
  sidebarOpen,
  setSidebarOpen,
  sidebarCollapsed,
  setSidebarCollapsed,
  lastUpdated,
  isRealtimeConnected,
  isRefreshing,
  isExactDashboard,
  onRefresh,
  onSignOut,
}: AdminDashboardContentProps) {
  const {
    isSuperAdmin,
    isAdmin: hasAdminRole,
    isSalesRep,
    isDistributor,
    canManageOwnCrm,
    canViewUsers,
    canViewLeads,
    
    canViewActivityLogs,
    canManageEmailTemplates,
    canManageScheduledJobs,
    canManageContent
  } = usePermissions();
  const { isDark } = useAdminTheme();
  
  // Track page views automatically
  useActivityTracker();

  // Phase 2 — single source of truth for lead counts (shared with the Inbox
  // tabs and every legacy panel header). Dashboard lead cards derive from this
  // instead of the get_admin_dashboard_lead_counts RPC so the numbers agree.
  const { counts: leadCounts } = useLeadCounts();

  // Route guard: distributors may only access their own personal-scope CRM pages.
  // This is enforced for real distributor logins AND while an admin previews via
  // "View As" (imposter mode), so settings, exports and other admin utilities stay
  // off-limits and a distributor only ever sees their own records. The allow-list
  // below already includes every personal-scope page (incl. Sales Figures), so the
  // preview no longer bounces off legitimate distributor pages.
  const distributorRestricted = isDistributor && !canViewLeads;
  
  useEffect(() => {
    if (!distributorRestricted) return;
    const allowedPrefixes = [
      '/admin',
      '/admin/leads',
      '/admin/meetings',
      '/admin/quotes',
      '/admin/sales-figures',
      '/admin/settings/account',
    ];
    const path = location.pathname;
    const allowed = path === '/admin' || allowedPrefixes.some(
      (p) => p !== '/admin' && (path === p || path.startsWith(p + '/'))
    );
    if (!allowed) {
      toast.error('That area is restricted', {
        description: 'You only have access to your own leads, meetings, quotes and sales figures.',
      });
      navigate('/admin', { replace: true });
    }
  }, [distributorRestricted, location.pathname, navigate]);

  // Front door: land admins & sales reps straight on the Leads Inbox.
  // Distributors on a restricted personal scope keep their own dashboard home.
  useEffect(() => {
    if (location.pathname !== '/admin') return;
    if (distributorRestricted) return;
    if (!canViewLeads) return;
    navigate('/admin/leads', { replace: true });
  }, [location.pathname, distributorRestricted, canViewLeads, navigate]);


  // Memoize nav link helper to avoid recalculation on every render
  const navLinkClass = useCallback((isActive: boolean) =>
    cn(
      "flex items-center gap-2.5 rounded-md text-[13px] font-medium transition-colors min-h-[40px] lg:min-h-[32px]",
      sidebarCollapsed ? "justify-center px-2 py-1.5" : "px-2.5 py-1.5",
      isActive
        ? "bg-muted text-foreground font-semibold"
        : "text-muted-foreground hover:bg-muted hover:text-foreground"
    ), [sidebarCollapsed]);

  // Sidebar nav link wrapper with tooltip when collapsed
  const SidebarLink = useCallback(({ to, icon: Icon, label, isActive }: { to: string; icon: any; label: string; isActive: boolean }) => {
    const link = (
      <Link to={to} onClick={() => setSidebarOpen(false)} className={navLinkClass(isActive)}>
        <Icon className="h-4 w-4 shrink-0" />
        {!sidebarCollapsed && <span className="truncate">{label}</span>}
      </Link>
    );
    if (sidebarCollapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{link}</TooltipTrigger>
          <TooltipContent side="right" className="text-xs">{label}</TooltipContent>
        </Tooltip>
      );
    }
    return link;
  }, [navLinkClass, sidebarCollapsed, setSidebarOpen]);


  // Lead cards derive from the shared useLeadCounts source of truth so each
  // number equals the matching Inbox tab/source AND that source's legacy panel
  // header. Meetings is a SEPARATE domain (investor + demo meetings) and stays
  // on the RPC-provided stats.meetings — intentionally NOT part of unified leads.
  const leadCards = useMemo(() => [
    { name: 'Leads', count: leadCounts.total, icon: Mail, path: '/admin/leads', color: 'text-rose-500', bgColor: 'bg-rose-500/10' },
    { name: 'Booked', count: leadCounts.booked, icon: Calendar, path: '/admin/leads-booked', color: 'text-indigo-500', bgColor: 'bg-indigo-500/10' },
    { name: 'Meetings', count: stats.meetings, icon: Video, path: '/admin/meetings', color: 'text-violet-500', bgColor: 'bg-violet-500/10' },
    { name: 'GHL Sync', count: leadCounts.ghlSubmissionsNonBooked, icon: Send, path: '/admin/ghl-submissions', color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
    { name: 'Investors', count: leadCounts.investors, icon: Briefcase, path: '/admin/investor-leads', color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
    { name: 'Events', count: leadCounts.events, icon: UserCheck, path: '/admin/webinar-leads', color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
  ], [leadCounts.total, leadCounts.booked, stats.meetings, leadCounts.ghlSubmissionsNonBooked, leadCounts.investors, leadCounts.events]);

  const contentCards = useMemo(() => [
    { name: 'Webinars', count: stats.webinars, icon: Calendar, path: '/admin/webinars', color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
    { name: 'Guides', count: stats.guides, icon: BookOpen, path: '/admin/guides', color: 'text-green-500', bgColor: 'bg-green-500/10' },
    { name: 'Blog', count: stats.blogs, icon: PenLine, path: '/admin/blog', color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
    { name: 'Testimonials', count: stats.testimonials, icon: MessageSquareQuote, path: '/admin/testimonials', color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
    { name: 'FAQs', count: stats.faqs, icon: HelpCircle, path: '/admin/faqs', color: 'text-pink-500', bgColor: 'bg-pink-500/10' },
    { name: 'Docs', count: stats.docs, icon: FileCode, path: '/admin/docs', color: 'text-cyan-500', bgColor: 'bg-cyan-500/10' },
  ], [stats.webinars, stats.guides, stats.blogs, stats.testimonials, stats.faqs, stats.docs]);

  const leadCRMTotal = useMemo(() =>
    leadCounts.total + leadCounts.booked + stats.meetings + leadCounts.ghlSubmissionsNonBooked + leadCounts.investors + leadCounts.events,
    [leadCounts.total, leadCounts.booked, stats.meetings, leadCounts.ghlSubmissionsNonBooked, leadCounts.investors, leadCounts.events]
  );

  const contentTotal = useMemo(() =>
    stats.webinars + stats.guides + stats.blogs + stats.testimonials + stats.faqs + stats.docs,
    [stats.webinars, stats.guides, stats.blogs, stats.testimonials, stats.faqs, stats.docs]
  );

  return (
    <div data-admin-portal className="min-h-screen bg-background flex flex-col">
      {/* Sample S7 — ⌘K searches leads and the pages this role can open. */}
      <AdminSpotlight />

      {/* Mobile top header */}
      <header className="fixed top-0 inset-x-0 z-50 flex items-center justify-between h-14 px-4 bg-card/95 backdrop-blur-lg border-b border-border lg:hidden">
        <Button
          variant="ghost"
          size="icon"
          className="min-h-[44px] min-w-[44px]"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        <Link to="/admin" className="flex items-center">
          <img src={alfredLogo} alt="alfred ai" className="h-7 w-auto object-contain dark:hidden" loading="eager" />
          <img src={alfredLogoWhite} alt="alfred ai" className="h-7 w-auto object-contain hidden dark:block" loading="eager" />
        </Link>
        <div className="flex items-center gap-1">
          <SpotlightTrigger variant="icon" />
          <AdminNotificationBell />
          <ThemeQuickToggle />
          <div className={cn(
            "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium",
            isRealtimeConnected
              ? "bg-emerald-500/10 text-emerald-600"
              : "bg-amber-500/10 text-amber-600"
          )}>
            <Radio className={cn("w-2.5 h-2.5", isRealtimeConnected && "animate-pulse")} />
            {isRealtimeConnected ? 'Live' : '...'}
          </div>
        </div>
      </header>

      <div className="flex flex-1 pt-14 lg:pt-0">

        {/* Sidebar */}
        <TooltipProvider delayDuration={200}>
        <aside className={cn(
          "fixed inset-y-0 left-0 z-40 bg-card border-r border-border transform transition-all duration-200 ease-in-out lg:translate-x-0",
          "top-14 lg:top-0",
          sidebarCollapsed ? "w-[48px]" : "w-56",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="flex flex-col h-full">
            <div className={cn("flex items-center justify-between px-2.5 py-2", sidebarCollapsed && "justify-center p-1.5")}>
              {!sidebarCollapsed && (
                <Link to="/admin">
                  <img src={alfredLogo} alt="alfred ai" className="h-7 w-auto object-contain dark:hidden" loading="eager" />
                  <img src={alfredLogoWhite} alt="alfred ai" className="h-7 w-auto object-contain hidden dark:block" loading="eager" />
                </Link>
              )}
              <div className="flex items-center gap-1">
                {!sidebarCollapsed && <AdminNotificationBell />}
                {!sidebarCollapsed && <ThemeQuickToggle />}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 hidden lg:flex"
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                  {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Separator />

            {/* The way into Spotlight. It was ⌘K only, so a shipped, working
                feature had nothing on screen to reveal it. Collapses to an icon
                when the sidebar is narrow. */}
            <div className={cn('pt-2', sidebarCollapsed ? 'px-1' : 'px-2')}>
              {sidebarCollapsed ? (
                <SpotlightTrigger variant="icon" className="mx-auto h-9 w-9 min-h-0 min-w-0" />
              ) : (
                <SpotlightTrigger />
              )}
            </div>

            <ScrollArea className={cn("flex-1 py-2", sidebarCollapsed ? "px-1" : "px-2")}>
              {/* Dashboard */}
              <nav className="space-y-1">
                <SidebarLink to={dashboardItem.path} icon={dashboardItem.icon} label={dashboardItem.name} isActive={location.pathname === dashboardItem.path} />
                {canViewLeads && (
                  <SidebarLink to="/admin/analytics" icon={BarChart3} label="Analytics" isActive={location.pathname === '/admin/analytics'} />
                )}
                {(canViewCompanySalesFigures(user?.email, isSuperAdmin) || isSalesRep) && (
                  <SidebarLink to="/admin/sales-figures" icon={DollarSign} label="Sales Figures" isActive={location.pathname === '/admin/sales-figures'} />
                )}
              </nav>

              {/* Distributor Section - personal-scope CRM only */}
              {isDistributor && !canViewLeads && (
                <div className="mt-3 pt-2 border-t border-border">
                  {!sidebarCollapsed && (
                    <div className="flex items-center gap-2 px-2.5 py-1 text-[10px] font-semibold text-muted-foreground/80 uppercase tracking-wide">
                      <Send className="h-3 w-3" />
                      My CRM
                    </div>
                  )}
                  <nav className="space-y-0.5 mt-0.5">
                    {[
                      { to: '/admin/leads', icon: Mail, label: 'My Leads' },
                      { to: '/admin/meetings', icon: Video, label: 'My Meetings' },
                      { to: '/admin/quotes', icon: FileText, label: 'My Quotes' },
                      { to: '/admin/sales-figures', icon: DollarSign, label: 'My Sales Figures' },
                    ].map(item => (
                      <SidebarLink key={item.to} {...item} isActive={location.pathname === item.to || location.pathname.startsWith(item.to + '/')} />
                    ))}
                  </nav>
                </div>
              )}



              {/* Leads Section */}
              {canViewLeads && (
                <div className="mt-3 pt-2 border-t border-border">
                  {!sidebarCollapsed && (
                    <div className="flex items-center gap-2 px-2.5 py-1 text-[10px] font-semibold text-muted-foreground/80 uppercase tracking-wide">
                      <Inbox className="h-3 w-3" />
                      Leads
                    </div>
                  )}
                  <nav className="space-y-0.5 mt-0.5">
                    {[
                      { to: '/admin/leads', icon: Mail, label: 'Leads Inbox' },
                      { to: '/admin/leads-booked', icon: Calendar, label: 'Booked Leads' },
                      { to: '/admin/demo-leads', icon: Play, label: 'Demo Leads' },
                      { to: '/admin/webinar-leads', icon: Calendar, label: 'Webinar Leads' },
                      { to: '/admin/investor-leads', icon: Briefcase, label: 'Investor Leads' },
                      { to: '/admin/alpha-digital-leads', icon: Cloud, label: 'Alpha Digital Leads' },
                      { to: '/admin/meta-leads', icon: Megaphone, label: 'Meta Lead Ads' },
                      { to: '/admin/b2b-matchmaking-leads', icon: Handshake, label: 'B2B Matchmaking' },
                      { to: '/admin/contacts', icon: Users, label: 'Contacts' },
                      { to: '/admin/archived-leads', icon: Archive, label: 'Archived Leads' },

                    ].map(item => (
                      <SidebarLink key={item.to} {...item} isActive={location.pathname === item.to} />
                    ))}
                  </nav>
                </div>
              )}

              {/* Meetings Section */}
              {canViewLeads && (
                <div className="mt-3 pt-2 border-t border-border">
                  {!sidebarCollapsed && (
                    <div className="flex items-center gap-2 px-2.5 py-1 text-[10px] font-semibold text-muted-foreground/80 uppercase tracking-wide">
                      <Video className="h-3 w-3" />
                      Meetings
                    </div>
                  )}
                  <nav className="space-y-0.5 mt-0.5">
                    {[
                      { to: '/admin/meetings', icon: Video, label: 'All Meetings' },
                      { to: '/admin/discovery-meetings', icon: MessageSquareQuote, label: 'Discovery' },
                      { to: '/admin/solution-meetings', icon: Briefcase, label: 'Solution' },
                      { to: '/admin/personal-meetings', icon: Calendar, label: 'Personal' },
                    ].map(item => (
                      <SidebarLink key={item.to} {...item} isActive={location.pathname === item.to} />
                    ))}
                  </nav>
                </div>
              )}

              {/* CRM Section */}
              {canViewLeads && (
                <div className="mt-3 pt-2 border-t border-border">
                  {!sidebarCollapsed && (
                    <div className="flex items-center gap-2 px-2.5 py-1 text-[10px] font-semibold text-muted-foreground/80 uppercase tracking-wide">
                      <Send className="h-3 w-3" />
                      CRM
                    </div>
                  )}
                  <nav className="space-y-0.5 mt-0.5">
                    {[
                      { to: '/admin/quotes', icon: FileText, label: 'Quotes' },
                      { to: '/admin/handover-queue', icon: UserCheck, label: 'Handover Queue' },
                      { to: '/admin/documents', icon: FileText, label: 'Documents' },
                      { to: '/admin/tidy-up', icon: Sparkles, label: 'Data Tidy-Up' },
                    ].map(item => (
                      <SidebarLink key={item.to} {...item} isActive={location.pathname === item.to || location.pathname.startsWith(item.to + '/')} />
                    ))}
                  </nav>
                </div>
              )}



              {/* Content Management Section - hidden for sales reps */}
              {canManageContent && (
                <div className="mt-3 pt-2 border-t border-border">
                  {!sidebarCollapsed && (
                    <div className="flex items-center gap-2 px-2.5 py-1 text-[10px] font-semibold text-muted-foreground/80 uppercase tracking-wide">
                      <FileText className="h-3 w-3" />
                      Content
                    </div>
                  )}
                  <nav className="space-y-0.5 mt-0.5">
                    {contentItems.map((item) => (
                      <SidebarLink
                        key={item.path}
                        to={item.path}
                        icon={item.icon}
                        label={item.name}
                        isActive={location.pathname === item.path || location.pathname.startsWith(item.path + '/')}
                      />
                    ))}
                  </nav>
                </div>
              )}

              {/* Settings Section */}
              {(canViewUsers || canViewActivityLogs || canManageEmailTemplates || canManageScheduledJobs) && (
                <div className="mt-3 pt-2 border-t border-border">
                  {!sidebarCollapsed && (
                    <div className="flex items-center gap-2 px-2.5 py-1 text-[10px] font-semibold text-muted-foreground/80 uppercase tracking-wide">
                      <Settings className="h-3 w-3" />
                      Settings
                    </div>
                  )}
                  <nav className="space-y-0.5 mt-0.5">
                    {canViewUsers && <SidebarLink to="/admin/settings/users" icon={Users} label="Users" isActive={location.pathname === '/admin/settings/users'} />}
                    {canViewActivityLogs && <SidebarLink to="/admin/settings/activity" icon={History} label="Activity" isActive={location.pathname === '/admin/settings/activity'} />}
                    {isSuperAdmin && <SidebarLink to="/admin/settings/export-requests" icon={Download} label="Exports" isActive={location.pathname === '/admin/settings/export-requests'} />}
                    {canManageEmailTemplates && (
                      <>
                        <SidebarLink to="/admin/settings/emails" icon={Mail} label="Emails" isActive={location.pathname === '/admin/settings/emails'} />
                        <SidebarLink to="/admin/settings/newsletter" icon={Users} label="Subscribers" isActive={location.pathname === '/admin/settings/newsletter'} />
                      </>
                    )}
                    {canManageScheduledJobs && <SidebarLink to="/admin/settings/jobs" icon={Clock} label="Scheduled Jobs" isActive={location.pathname === '/admin/settings/jobs'} />}
                    {canManageScheduledJobs && <SidebarLink to="/admin/settings/system" icon={Activity} label="System" isActive={location.pathname === '/admin/settings/system'} />}
                    {(hasAdminRole || isSuperAdmin) && <SidebarLink to="/admin/settings/blog-api" icon={FileCode} label="Blog API" isActive={location.pathname === '/admin/settings/blog-api'} />}
                  </nav>
                </div>
              )}

              {/* Integrations Section */}
              {canViewLeads && (
                <div className="mt-3 pt-2 border-t border-border">
                  {!sidebarCollapsed && (
                    <div className="flex items-center gap-2 px-2.5 py-1 text-[10px] font-semibold text-muted-foreground/80 uppercase tracking-wide">
                      <Plug className="h-3 w-3" />
                      Integrations
                    </div>
                  )}
                  <nav className="space-y-0.5 mt-0.5">
                    <SidebarLink to="/admin/connectors" icon={Plug} label="Connectors" isActive={location.pathname === '/admin/connectors'} />
                    <SidebarLink to="/admin/seo/keyword-tracking" icon={TrendingUp} label="Keyword Tracking" isActive={location.pathname === '/admin/seo/keyword-tracking'} />
                    <SidebarLink to="/admin/ghl-sync" icon={RefreshCw} label="GHL Sync Status" isActive={location.pathname === '/admin/ghl-sync'} />
                    <SidebarLink to="/admin/ghl-submissions" icon={Send} label="GHL Submissions" isActive={location.pathname === '/admin/ghl-submissions'} />
                    <SidebarLink to="/admin/webhook-logs" icon={ScrollText} label="Webhook Logs" isActive={location.pathname === '/admin/webhook-logs'} />


                  </nav>
                </div>
              )}

              {/* My Account Section */}
              <div className="mt-3 pt-2 border-t border-border">
                {!sidebarCollapsed && (
                  <div className="flex items-center gap-2 px-2.5 py-1 text-[10px] font-semibold text-muted-foreground/80 uppercase tracking-wide">
                    <User className="h-3 w-3" />
                    My Account
                  </div>
                )}
                <nav className="space-y-0.5 mt-0.5">
                  {accountItems.map((item) => (
                    <SidebarLink key={item.path} to={item.path} icon={item.icon} label={item.name} isActive={location.pathname === item.path} />
                  ))}
                </nav>
              </div>
            </ScrollArea>

            <Separator />

            <div className={cn("p-2", sidebarCollapsed && "flex justify-center")}>
              {sidebarCollapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground min-h-[44px]" onClick={onSignOut}>
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="text-xs">Sign Out</TooltipContent>
                </Tooltip>
              ) : (
                <Button variant="ghost" className="w-full justify-start text-muted-foreground min-h-[44px]" onClick={onSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              )}
            </div>
          </div>
        </aside>
        </TooltipProvider>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Main content */}
        <main className={cn("flex-1 min-w-0 pb-24 lg:pb-0 transition-all duration-200", sidebarCollapsed ? "lg:ml-[48px]" : "lg:ml-56")}>
          {/* View As Banner */}
          <ViewAsBanner />
          <div className="p-3 sm:p-4 lg:p-5 min-w-0">
            {isExactDashboard ? (
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-foreground">Dashboard</h2>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Overview of your leads and content</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                      isRealtimeConnected
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                        : "bg-amber-500/10 text-amber-600 border-amber-500/30"
                    )}>
                      <Radio className={cn("w-3 h-3", isRealtimeConnected && "animate-pulse")} />
                      {isRealtimeConnected ? 'Live' : 'Connecting...'}
                    </div>
                    {lastUpdated && (
                      <span className="text-xs text-muted-foreground hidden sm:inline">
                        {format(lastUpdated, 'h:mm a')}
                      </span>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onRefresh}
                      disabled={isRefreshing}
                      className="h-9 min-w-[36px] min-h-[44px]"
                      aria-label="Refresh stats"
                    >
                      <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")} />
                    </Button>
                  </div>
                </div>

                {/* Distributor personal dashboard */}
                {isDistributor && !canViewLeads && <DistributorDashboard />}

                {/* Leads & CRM Section - only for roles with lead access */}
                {canViewLeads && (
                <section className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-border">
                    <div className="p-1.5 rounded-md bg-primary/10">
                      <Mail className="h-4 w-4 text-primary" />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Leads & CRM</h3>
                    <span className="text-xs text-muted-foreground ml-auto">{leadCRMTotal} total</span>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
                    {leadCards.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        className="bg-card border border-border rounded-lg p-3 sm:p-4 hover:border-primary/30 hover:shadow-md transition-all group active:scale-95"
                      >
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <div className={cn("p-1 sm:p-1.5 rounded-md", item.bgColor)}>
                            <item.icon className={cn("h-3 w-3 sm:h-3.5 sm:w-3.5", item.color)} />
                          </div>
                        </div>
                        <div className="text-xl sm:text-2xl font-bold text-foreground">{item.count}</div>
                        <div className="text-[10px] sm:text-xs text-muted-foreground group-hover:text-primary transition-colors mt-0.5">
                          {item.name}
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
                )}

                {/* Content Management Section - only for roles with content access */}
                {canManageContent && (
                <section className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-border">
                    <div className="p-1.5 rounded-md bg-primary/10">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Content</h3>
                    <span className="text-xs text-muted-foreground ml-auto">{contentTotal} items</span>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
                    {contentCards.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        className="bg-card border border-border rounded-lg p-3 sm:p-4 hover:border-primary/30 hover:shadow-md transition-all group active:scale-95"
                      >
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <div className={cn("p-1 sm:p-1.5 rounded-md", item.bgColor)}>
                            <item.icon className={cn("h-3 w-3 sm:h-3.5 sm:w-3.5", item.color)} />
                          </div>
                        </div>
                        <div className="text-xl sm:text-2xl font-bold text-foreground">{item.count}</div>
                        <div className="text-[10px] sm:text-xs text-muted-foreground group-hover:text-primary transition-colors mt-0.5">
                          {item.name}
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
                )}

                {canManageContent && <ContentHealth />}

                {/* Partner Applications - admins/super_admins only */}
                {hasAdminRole && (
                <section className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-border">
                    <div className="p-1.5 rounded-md bg-primary/10">
                      <UserCheck className="h-4 w-4 text-primary" />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Partners</h3>
                  </div>
                  <Link
                    to="/partners/portal/admin"
                    className="flex items-center justify-between gap-3 bg-card border border-border rounded-lg p-4 hover:border-primary/30 hover:shadow-md transition-all active:scale-[0.99] min-h-[44px]"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-md",
                        pendingPartnerApps > 0 ? "bg-rose-500/10" : "bg-emerald-500/10"
                      )}>
                        <UserCheck className={cn(
                          "h-4 w-4",
                          pendingPartnerApps > 0 ? "text-rose-500" : "text-emerald-500"
                        )} />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-foreground">
                          {pendingPartnerApps} pending partner application{pendingPartnerApps === 1 ? '' : 's'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {pendingPartnerApps > 0 ? 'Review and approve applicants' : 'No applications waiting'}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-primary whitespace-nowrap">Open portal admin →</span>
                  </Link>
                </section>
                )}

                {isSalesRep && !canViewLeads && !canManageContent && (
                  <section className="bg-card border border-border rounded-lg p-6 text-center">
                    <DollarSign className="h-10 w-10 text-primary mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-foreground">Sales Dashboard</h3>
                    <p className="text-sm text-muted-foreground mt-1 mb-4">Access your leads, meetings, and sales figures from the sidebar.</p>
                    <div className="flex flex-wrap justify-center gap-3">
                      <Link to="/admin/leads" className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors min-h-[44px]">
                        <Mail className="h-4 w-4" /> View Leads
                      </Link>
                      <Link to="/admin/sales-figures" className="inline-flex items-center gap-2 px-4 py-2 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors min-h-[44px]">
                        <DollarSign className="h-4 w-4" /> Sales Figures
                      </Link>
                    </div>
                  </section>
                )}
              </div>
            ) : (
              <Suspense
                fallback={
                  <div className="flex items-center justify-center py-24" aria-busy="true">
                    <RefreshCw className="w-6 h-6 text-muted-foreground animate-spin" />
                  </div>
                }
              >
                <Outlet />
              </Suspense>
            )}
          </div>
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <AdminMobileBottomNav />
    </div>
  );
}
