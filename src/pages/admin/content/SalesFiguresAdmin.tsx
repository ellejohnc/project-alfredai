import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import AccessDenied from '@/components/admin/AccessDenied';
import { SUPPORT_EMAIL } from '@/lib/siteConfig';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import {
  DollarSign,
  TrendingUp,
  FileText,
  RefreshCw,
  CheckCircle2,
  Send,
  XCircle,
  CreditCard,
  BarChart3,
  PieChart as PieChartIcon,
  ArrowUpRight,
  ArrowDownRight,
  CalendarIcon,
  Info,
  AlertTriangle,
  Mail,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, subYears, startOfQuarter, endOfQuarter, isWithinInterval, subQuarters } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { cn } from '@/lib/utils';
import { roleLabels } from '@/lib/rolePermissions';
import { ADMIN_LIVE_QUERY_OPTIONS } from '@/lib/adminQuery';
import { canViewCompanySalesFigures } from '@/lib/salesFiguresAccess';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminToolbar } from '@/components/admin/AdminToolbar';

const DISTRIBUTOR_LABEL = roleLabels.distributor;

const COLORS = {
  setup: '#8B5CF6',
  monthly: '#0EA5E9',
  signed: '#10B981',
  sent: '#F59E0B',
  draft: '#94A3B8',
  lost: '#EF4444',
};

const PAYMENT_COLORS = ['#8B5CF6', '#6366F1', '#0EA5E9', '#10B981', '#94A3B8'];

function formatCurrency(amount: number | null | undefined): string {
  if (!amount) return '$0';
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 100000) return `$${(amount / 1000).toFixed(0)}K`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
  return `$${amount.toLocaleString()}`;
}

function formatFullCurrency(amount: number | null | undefined): string {
  if (!amount) return '$0';
  return `$${amount.toLocaleString('en-AU', { maximumFractionDigits: 0 })}`;
}

interface MonthlyRevenueSlidesProps {
  monthlyData: Array<{ month: string; setup: number; monthly: number; count: number }>;
  signedMonthlySeries: Array<{ month: string; signedRevenue: number; ltv: number; retainer: number; setup: number }>;
  formatCurrency: (n: number | null | undefined) => string;
  formatFullCurrency: (n: number | null | undefined) => string;
}

function MonthlyRevenueSlides({ monthlyData, signedMonthlySeries, formatCurrency, formatFullCurrency }: MonthlyRevenueSlidesProps) {
  const [slide, setSlide] = useState(0);
  const slides = [
    {
      title: 'Signed Revenue (Month over Month)',
      description: 'Setup + first-month retainer of signed deals per month',
      data: signedMonthlySeries,
      bars: [{ key: 'signedRevenue', name: 'Signed Revenue', color: COLORS.signed }],
    },
    {
      title: 'Monthly Quote Revenue',
      description: 'Setup fees vs monthly retainers by quote creation month',
      data: monthlyData,
      bars: [
        { key: 'setup', name: 'Setup Fees', color: COLORS.setup },
        { key: 'monthly', name: 'Monthly Retainer', color: COLORS.monthly },
      ],
    },
    {
      title: 'LTV (Month over Month)',
      description: 'Setup + 24 months of retainer for signed deals per month',
      data: signedMonthlySeries,
      bars: [{ key: 'ltv', name: 'LTV', color: COLORS.setup }],
    },
    (() => {
      let cum = 0;
      const data = signedMonthlySeries.map(d => {
        cum += d.retainer;
        return { ...d, retainerCumulative: cum };
      });
      return {
        title: 'Retainer Value (Accumulated)',
        description: 'Cumulative monthly retainer value of signed deals over time',
        data,
        bars: [{ key: 'retainerCumulative', name: 'Accumulated Retainer', color: COLORS.monthly }],
      };
    })(),
  ];
  const total = slides.length;
  const current = slides[slide];
  const go = (dir: number) => setSlide(s => (s + dir + total) % total);

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              {current.title}
            </CardTitle>
            <CardDescription className="mt-1">{current.description}</CardDescription>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 min-h-[36px] min-w-[36px]"
              onClick={() => go(-1)}
              aria-label="Previous slide"
            >
              <ArrowDownRight className="w-4 h-4 rotate-90" />
            </Button>
            <span className="text-xs text-muted-foreground tabular-nums px-1">
              {slide + 1}/{total}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 min-h-[36px] min-w-[36px]"
              onClick={() => go(1)}
              aria-label="Next slide"
            >
              <ArrowUpRight className="w-4 h-4 rotate-90" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          {current.data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={current.data} barCategoryGap="20%">
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  tickFormatter={(v) => formatCurrency(v)}
                />
                <Tooltip
                  formatter={(value: number, name: string) => [formatFullCurrency(value), name]}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                {current.bars.map(b => (
                  <Bar key={b.key} dataKey={b.key} name={b.name} fill={b.color} radius={[4, 4, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              No quote data available
            </div>
          )}
        </div>
        {/* Slide dots */}
        <div className="flex items-center justify-center gap-2 mt-3">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setSlide(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={cn(
                "h-2 rounded-full transition-all min-h-[8px]",
                i === slide ? "w-6 bg-primary" : "w-2 bg-muted hover:bg-muted-foreground/40"
              )}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function SalesFiguresAdmin() {
  const navigate = useNavigate();
  const { user } = useAdminAuth();
  const { canViewLeads, isDistributor, isSuperAdmin, viewAsProfile } = usePermissions();
  const scopedUserId = viewAsProfile?.userId ?? user?.id ?? null;
  const scopedUserEmail = (viewAsProfile?.email ?? user?.email ?? '').trim().toLowerCase();

  const openQuote = (q: { quote_id: string | null; id: string }) => {
    const target = q.quote_id || q.id;
    navigate(`/admin/quotes?quote=${encodeURIComponent(target)}`);
  };

  const [periodPreset, setPeriodPreset] = useState<string>('all');
  const [customDateFrom, setCustomDateFrom] = useState<Date | undefined>();
  const [customDateTo, setCustomDateTo] = useState<Date | undefined>();
  const [salesPersonSearch, setSalesPersonSearch] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('all');

  // Fetch all quotes. Distributor mode is narrowed below to the current user's contribution.
  const { data: rawQuotes = [], isLoading: quotesLoading, isError: quotesError, refetch: refetchQuotes } = useQuery({
    queryKey: ['sales-quotes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quotes')
        .select('id, quote_id, company_name, contact_name, status, setup_fee_final, monthly_retainer_final, setup_fee_min, setup_fee_max, monthly_retainer_min, monthly_retainer_max, pricing_option, created_at, signed_at, created_by, assigned_distributor_id, created_by_user_id')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    ...ADMIN_LIVE_QUERY_OPTIONS,
  });



  // Fetch all payments
  const { data: rawPayments = [], isLoading: paymentsLoading, isError: paymentsError, refetch: refetchPayments } = useQuery({
    queryKey: ['sales-payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quote_payments')
        .select('id, quote_id, amount, payment_type, pricing_option, status, created_at, completed_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    staleTime: 15_000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });


  const { data: collaboratorQuoteIds = [], isLoading: collaboratorsLoading, isError: collaboratorsError, refetch: refetchCollaborators } = useQuery({
    queryKey: ['sales-distributor-collaborator-quotes', scopedUserId, isDistributor],
    queryFn: async () => {
      if (!isDistributor || !scopedUserId) return [];
      const { data, error } = await supabase
        .from('record_collaborators')
        .select('entity_id')
        .eq('entity_type', 'quote')
        .eq('user_id', scopedUserId);
      if (error) throw error;
      return (data || []).map(row => row.entity_id);
    },
    enabled: !!user && isDistributor,
  });

  // ─── Period filter logic ───
  const dateRange = useMemo(() => {
    const now = new Date();
    switch (periodPreset) {
      case 'this_month': return { from: startOfMonth(now), to: endOfMonth(now) };
      case 'last_month': return { from: startOfMonth(subMonths(now, 1)), to: endOfMonth(subMonths(now, 1)) };
      case 'this_quarter': return { from: startOfQuarter(now), to: endOfQuarter(now) };
      case 'last_quarter': return { from: startOfQuarter(subQuarters(now, 1)), to: endOfQuarter(subQuarters(now, 1)) };
      case 'this_year': return { from: startOfYear(now), to: endOfYear(now) };
      case 'last_year': return { from: startOfYear(subYears(now, 1)), to: endOfYear(subYears(now, 1)) };
      case 'last_3_months': return { from: subMonths(now, 3), to: now };
      case 'last_6_months': return { from: subMonths(now, 6), to: now };
      case 'custom': return customDateFrom ? { from: customDateFrom, to: customDateTo || now } : null;
      default: return null; // 'all'
    }
  }, [periodPreset, customDateFrom, customDateTo]);

  // ─── Fuzzy sales person matching ───
  const fuzzyMatch = (name: string | null | undefined, search: string): boolean => {
    if (!name || !search) return true;
    const n = name.toLowerCase().replace(/[^a-z]/g, '');
    const s = search.toLowerCase().replace(/[^a-z]/g, '');
    if (!s) return true;
    // Check if all search chars appear in order
    let si = 0;
    for (let i = 0; i < n.length && si < s.length; i++) {
      if (n[i] === s[si]) si++;
    }
    return si === s.length;
  };

  const collaboratorQuoteIdSet = useMemo(() => new Set(collaboratorQuoteIds), [collaboratorQuoteIds]);

  const contributionQuotes = useMemo(() => {
    if (!isDistributor || !scopedUserId) return rawQuotes;

    return rawQuotes.filter(q => {
      const createdBy = q.created_by?.trim().toLowerCase();
      return q.assigned_distributor_id === scopedUserId
        || q.created_by_user_id === scopedUserId
        || collaboratorQuoteIdSet.has(q.id)
        || createdBy === scopedUserId.toLowerCase()
        || (!!scopedUserEmail && createdBy === scopedUserEmail);
    });
  }, [rawQuotes, isDistributor, scopedUserId, scopedUserEmail, collaboratorQuoteIdSet]);

  // ─── Unique sales people for suggestions ───
  const salesPeople = useMemo(() => {
    const names = new Set<string>();
    contributionQuotes.forEach(q => {
      if (q.created_by) names.add(q.created_by);
    });
    return Array.from(names).sort();
  }, [contributionQuotes]);

  // A won/signed deal belongs to the month it was SIGNED (revenue recognition),
  // not the month the quote was first drafted. Everything else falls back to created_at.
  const effectiveDate = (q: { status?: string | null; signed_at?: string | null; created_at?: string | null }) =>
    (q.status === 'signed' || q.status === 'won' || q.status === 'refunded') && q.signed_at ? q.signed_at : q.created_at;

  // ─── Filtered data ───
  const quotes = useMemo(() => {
    return contributionQuotes.filter(q => {
      // Period filter
      const dateStr = effectiveDate(q);
      if (dateRange && dateStr) {
        const d = new Date(dateStr);
        if (!isWithinInterval(d, { start: dateRange.from, end: dateRange.to })) return false;
      }
      // Sales person filters. The search used to be skipped for distributors
      // while the box stayed on screen, so typing in it did nothing; it can
      // only narrow their own scoped quotes, so it applies to everyone now.
      if (ownerFilter !== 'all' && q.created_by !== ownerFilter) return false;
      if (salesPersonSearch && !fuzzyMatch(q.created_by, salesPersonSearch)) return false;
      return true;
    });
  }, [contributionQuotes, dateRange, salesPersonSearch, ownerFilter]);


  // Payments join on the quote's BUSINESS key (quotes.quote_id, e.g. "BUX-8WNP-TULRR"),
  // never the uuid — quote_payments.quote_id is text and every writer and reader in the
  // app uses that key. Joining on q.id silently matched only 21 legacy rows written
  // before the convention settled, hiding every real payment and reporting $0 collected.
  const quoteIds = useMemo(
    () => new Set(quotes.map(q => q.quote_id).filter((k): k is string => !!k)),
    [quotes],
  );
  const payments = useMemo(() => {
    return rawPayments.filter(p => quoteIds.has(p.quote_id));
  }, [rawPayments, quoteIds]);

  const isLoading = quotesLoading || paymentsLoading || collaboratorsLoading;
  const hasLoadError = quotesError || paymentsError || collaboratorsError;


  // Distributors get access too, but their data is explicitly scoped to their
  // own sales work (assigned / created / collaborator), not company-wide figures.
  if (!canViewLeads && !isDistributor) {
    return <AccessDenied message={`Only admins and ${DISTRIBUTOR_LABEL}s can view sales figures.`} requiredRole={`Admin, Super Admin or ${DISTRIBUTOR_LABEL}`} />;
  }

  // Company-wide figures are restricted to super admins.
  // Distributors are exempt because this view only ever shows their own scoped
  // data, never the company totals.
  if (!isDistributor && !canViewCompanySalesFigures(user?.email, isSuperAdmin)) {
    return <AccessDenied message="Company-wide sales figures are restricted." requiredRole="Super Admin" />;
  }

  if (hasLoadError) {
    const subject = encodeURIComponent('Sales Figures loading issue');
    const body = encodeURIComponent(`Sales Figures failed to load.\n\nPage: ${window.location.href}\n\nPlease attach a screenshot of this page.`);
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="py-8 text-center space-y-4">
          <AlertTriangle className="w-9 h-9 mx-auto text-destructive" />
          <div className="space-y-1">
            <h3 className="font-semibold text-destructive">We couldn't load your sales figures</h3>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">
              Your data is safe. Retry the dashboard, go back to Quotes, or email support with this page URL and a screenshot.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 min-h-[44px]"
              onClick={() => {
                refetchQuotes();
                refetchPayments();
                refetchCollaborators();
              }}
            >
              <RefreshCw className="w-4 h-4" /> Retry
            </Button>
            <Button variant="secondary" size="sm" className="gap-2 min-h-[44px]" onClick={() => navigate('/admin/quotes')}>
              <FileText className="w-4 h-4" /> Go to Quotes
            </Button>
            <a href={`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`} className="sm:inline-flex">
              <Button variant="ghost" size="sm" className="gap-2 min-h-[44px] w-full">
                <Mail className="w-4 h-4" /> Email Support
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  // ─── Compute Stats ───
  const totalQuotes = quotes.length;
  // Refunded deals were won but did not proceed past PoC — they are excluded from
  // all revenue, LTV and monthly figures, and tracked separately.
  const refundedQuotes = quotes.filter(q => q.status === 'refunded');
  const signedQuotes = quotes.filter(q => q.status === 'signed' || q.status === 'won');
  const sentQuotes = quotes.filter(q => q.status === 'sent');
  const draftQuotes = quotes.filter(q => q.status === 'draft');
  const lostQuotes = quotes.filter(q => q.status === 'lost' || q.status === 'declined' || q.status === 'cancelled');

  // Revenue from signed deals
  const signedSetupFees = signedQuotes.reduce((sum, q) => sum + (q.setup_fee_final || 0), 0);
  const signedMonthlyRetainers = signedQuotes.reduce((sum, q) => sum + (q.monthly_retainer_final || 0), 0);
  const signedRevenue = signedSetupFees + signedMonthlyRetainers;
  const totalSetupFees = signedSetupFees;
  const totalMonthlyRetainers = signedMonthlyRetainers;
  const totalProposedValue = quotes
    .filter(q => q.status !== 'refunded')
    .reduce((sum, q) => sum + (q.setup_fee_final || 0) + (q.monthly_retainer_final || 0), 0);
  const refundedValue = refundedQuotes.reduce((sum, q) => sum + (q.setup_fee_final || 0) + (q.monthly_retainer_final || 0), 0);


  // Pipeline value (sent quotes)
  const pipelineValue = sentQuotes.reduce((sum, q) => {
    const setup = q.setup_fee_final || q.setup_fee_max || q.setup_fee_min || 0;
    const monthly = q.monthly_retainer_final || q.monthly_retainer_max || q.monthly_retainer_min || 0;
    return sum + setup + monthly;
  }, 0);

  // Payment link totals
  const totalPaymentValue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const completedPayments = payments.filter(p => p.status === 'completed');
  const pendingPayments = payments.filter(p => p.status === 'pending');
  const completedPaymentValue = completedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const pendingPaymentValue = pendingPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  // Average deal size (signed)
  const avgDealSize = signedQuotes.length > 0
    ? Math.round((signedSetupFees + signedMonthlyRetainers) / signedQuotes.length)
    : 0;

  // Win rate
  const closedDeals = signedQuotes.length + lostQuotes.length;
  const winRate = closedDeals > 0 ? Math.round((signedQuotes.length / closedDeals) * 100) : 0;

  // ─── Monthly Revenue Chart ───
  const monthlyMap = new Map<string, { month: string; setup: number; monthly: number; count: number }>();
  quotes.forEach(q => {
    if (q.status === 'refunded') return; // refunded deals carry no revenue
    // Won/signed deals are recognised in the month they were signed.
    const dateStr = effectiveDate(q);
    if (!dateStr) return;
    const key = format(new Date(dateStr), 'yyyy-MM');
    const label = format(new Date(dateStr), 'MMM yy');
    const existing = monthlyMap.get(key) || { month: label, setup: 0, monthly: 0, count: 0 };
    existing.setup += q.setup_fee_final || 0;
    existing.monthly += q.monthly_retainer_final || 0;
    existing.count += 1;
    monthlyMap.set(key, existing);
  });
  const monthlyData = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v);

  // ─── Signed Monthly Series (for slides) ───
  const signedMonthlyMap = new Map<string, { month: string; setup: number; monthly: number }>();
  signedQuotes.forEach(q => {
    const dateStr = effectiveDate(q);
    if (!dateStr) return;
    const key = format(new Date(dateStr), 'yyyy-MM');
    const label = format(new Date(dateStr), 'MMM yy');
    const existing = signedMonthlyMap.get(key) || { month: label, setup: 0, monthly: 0 };
    existing.setup += q.setup_fee_final || 0;
    existing.monthly += q.monthly_retainer_final || 0;
    signedMonthlyMap.set(key, existing);
  });
  const signedMonthlySeries = Array.from(signedMonthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => ({
      month: v.month,
      signedRevenue: v.setup + v.monthly,
      ltv: v.setup + v.monthly * 24,
      retainer: v.monthly,
      setup: v.setup,
    }));

  // ─── Status Breakdown (Pie) ───
  const statusData = [
    { name: 'Signed/Won', value: signedQuotes.length, color: COLORS.signed },
    { name: 'Sent', value: sentQuotes.length, color: COLORS.sent },
    { name: 'Draft', value: draftQuotes.length, color: COLORS.draft },
    { name: 'Lost', value: lostQuotes.length, color: COLORS.lost },
    { name: 'Refunded', value: refundedQuotes.length, color: '#F59E0B' },
  ].filter(s => s.value > 0);

  // ─── Payment Type Breakdown ───
  const paymentTypeMap = new Map<string, { name: string; value: number; count: number }>();
  payments.forEach(p => {
    const type = p.payment_type || 'other';
    const label = type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const existing = paymentTypeMap.get(type) || { name: label, value: 0, count: 0 };
    existing.value += p.amount || 0;
    existing.count += 1;
    paymentTypeMap.set(type, existing);
  });
  const paymentTypeData = Array.from(paymentTypeMap.values()).sort((a, b) => b.value - a.value);

  // ─── Pricing Option Breakdown ───
  const pricingMap = new Map<string, { name: string; value: number; count: number }>();
  payments.forEach(p => {
    const opt = p.pricing_option || 'Unknown';
    const existing = pricingMap.get(opt) || { name: `Option ${opt}`, value: 0, count: 0 };
    existing.value += p.amount || 0;
    existing.count += 1;
    pricingMap.set(opt, existing);
  });
  const pricingData = Array.from(pricingMap.values()).sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-6">
      {/* Band 1 — title. */}
      <AdminPageHeader
        title="Sales Figures"
        description="Real-time revenue and pipeline metrics from quotes and payments"
        icon={<BarChart3 className="h-4 w-4" />}
        onRefresh={() => {
          refetchQuotes();
          refetchPayments();
          toast.success('Data refreshed');
        }}
        isLoading={isLoading}
      />

      {/* The shared toolbar: Search · Owner (the sales person) · Period. This is
          a dashboard, so the figures below are the page's content rather than
          filter tiles; the toolbar narrows every one of them at once. A custom
          range keeps its two date pickers, in the actions slot. */}
      <AdminToolbar
        searchQuery={salesPersonSearch}
        onSearchChange={setSalesPersonSearch}
        searchPlaceholder="Search by sales person..."
        resultCount={quotes.length}
        resultNoun={`quotes · ${payments.length} payments`}
        filters={[
          {
            key: 'owner',
            label: 'Owner',
            value: ownerFilter,
            onChange: setOwnerFilter,
            options: [
              { value: 'all', label: 'All sales people' },
              ...salesPeople.map(sp => ({ value: sp, label: sp })),
            ],
          },
          {
            key: 'period',
            label: 'Period',
            value: periodPreset,
            onChange: (v) => { setPeriodPreset(v); if (v !== 'custom') { setCustomDateFrom(undefined); setCustomDateTo(undefined); } },
            options: [
              { value: 'all', label: 'All Time' },
              { value: 'this_month', label: 'This Month' },
              { value: 'last_month', label: 'Last Month' },
              { value: 'this_quarter', label: 'This Quarter' },
              { value: 'last_quarter', label: 'Last Quarter' },
              { value: 'last_3_months', label: 'Last 3 Months' },
              { value: 'last_6_months', label: 'Last 6 Months' },
              { value: 'this_year', label: 'This Year' },
              { value: 'last_year', label: 'Last Year' },
              { value: 'custom', label: 'Custom Range' },
            ],
          },
        ]}
        onClearAll={() => { setPeriodPreset('all'); setSalesPersonSearch(''); setOwnerFilter('all'); setCustomDateFrom(undefined); setCustomDateTo(undefined); }}
        actions={periodPreset === 'custom' ? (
          <div className="flex gap-2 items-center">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("h-9 w-[130px] justify-start text-left font-normal text-xs", !customDateFrom && "text-muted-foreground")}>
                  <CalendarIcon className="w-3 h-3 mr-1" />
                  {customDateFrom ? format(customDateFrom, 'MMM d, yy') : 'Start'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar mode="single" selected={customDateFrom} onSelect={setCustomDateFrom} initialFocus className={cn("p-3 pointer-events-auto")} />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("h-9 w-[130px] justify-start text-left font-normal text-xs", !customDateTo && "text-muted-foreground")}>
                  <CalendarIcon className="w-3 h-3 mr-1" />
                  {customDateTo ? format(customDateTo, 'MMM d, yy') : 'End'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar mode="single" selected={customDateTo} onSelect={setCustomDateTo} initialFocus className={cn("p-3 pointer-events-auto")} />
              </PopoverContent>
            </Popover>
          </div>
        ) : undefined}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Signed Revenue</p>
                <div className="flex items-baseline justify-between gap-2 mt-1">
                  <p className="text-xs text-muted-foreground shrink-0">Setup:</p>
                  <p className="text-base sm:text-lg font-bold text-emerald-600 tabular-nums whitespace-nowrap">{formatFullCurrency(signedSetupFees)}</p>
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-xs text-muted-foreground shrink-0">Monthly:</p>
                  <p className="text-base sm:text-lg font-bold text-emerald-600 tabular-nums whitespace-nowrap">{formatFullCurrency(signedMonthlyRetainers)}</p>
                </div>

                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">

                    LTV:
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          aria-label="What is LTV?"
                          className="inline-flex items-center justify-center w-5 h-5 min-h-[20px] min-w-[20px] rounded-full text-emerald-700/70 hover:text-emerald-700 hover:bg-emerald-500/10 transition"
                        >
                          <Info className="w-3.5 h-3.5" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent side="top" align="start" className="w-72 text-xs">
                        <p className="font-semibold text-sm mb-1">Lifetime Value (LTV)</p>
                        <p className="text-muted-foreground mb-2">
                          Estimated total revenue per signed deal over a 2-year horizon.
                        </p>
                        <div className="rounded-md bg-muted/60 p-2 font-mono text-[11px] leading-relaxed">
                          LTV = Setup fee + (Monthly retainer × 24)
                        </div>
                        <p className="text-muted-foreground mt-2">
                          Current: {formatFullCurrency(signedSetupFees)} + ({formatFullCurrency(signedMonthlyRetainers)} × 24) = <span className="font-semibold text-foreground">{formatFullCurrency(signedSetupFees + signedMonthlyRetainers * 24)}</span>
                        </p>
                      </PopoverContent>
                    </Popover>
                  </p>
                  <p className="text-base sm:text-lg font-bold text-emerald-600 tabular-nums whitespace-nowrap">{formatFullCurrency(signedSetupFees + signedMonthlyRetainers * 24)}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{signedQuotes.length} deal{signedQuotes.length !== 1 ? 's' : ''} closed · LTV = Setup + 24mo retainer</p>
                {refundedQuotes.length > 0 && (
                  <p className="text-[11px] text-amber-600 mt-0.5">
                    Excludes {refundedQuotes.length} refunded deal{refundedQuotes.length !== 1 ? 's' : ''} ({formatFullCurrency(refundedValue)})
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                <Send className="w-5 h-5 text-amber-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Pipeline Value</p>
                <p className="text-lg sm:text-2xl font-bold text-amber-600 tabular-nums break-words">{formatFullCurrency(pipelineValue)}</p>
                <p className="text-xs text-muted-foreground">{sentQuotes.length} proposal{sentQuotes.length !== 1 ? 's' : ''} sent</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-violet-500/10 to-violet-500/5 border-violet-500/20">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5 text-violet-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Total Proposed Value</p>
                <p className="text-lg sm:text-2xl font-bold text-violet-600 tabular-nums break-words">{formatCurrency(totalProposedValue)}</p>
                <p className="text-xs text-muted-foreground">{totalQuotes} total quotes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center shrink-0">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Lost Deals</p>
                <p className="text-lg sm:text-2xl font-bold text-red-600 tabular-nums">{lostQuotes.length}</p>
                <p className="text-xs text-muted-foreground">lost / declined / cancelled</p>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* KPI Cards Row 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Avg Deal Size</p>
                <p className="text-lg sm:text-xl font-bold tabular-nums break-words">{formatFullCurrency(avgDealSize)}</p>
              </div>
              <BarChart3 className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Win Rate</p>
                <p className="text-lg sm:text-xl font-bold flex items-center gap-1 tabular-nums">
                  {winRate}%
                  {winRate > 20 ? (
                    <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-red-500" />
                  )}
                </p>
              </div>
              <CheckCircle2 className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{signedQuotes.length}W / {lostQuotes.length}L</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Setup Fees</p>
                <p className="text-lg sm:text-xl font-bold tabular-nums break-words">{formatCurrency(totalSetupFees)}</p>
              </div>
              <DollarSign className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Monthly Retainers</p>
                <p className="text-lg sm:text-xl font-bold tabular-nums break-words">{formatCurrency(totalMonthlyRetainers)}</p>
              </div>
              <DollarSign className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">recurring/mo</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className={cn("grid grid-cols-1 gap-6", isDistributor ? "lg:grid-cols-2" : "lg:grid-cols-3")}>
        {/* Monthly Revenue Bar Chart - Multi-slide */}
        <MonthlyRevenueSlides
          monthlyData={monthlyData}
          signedMonthlySeries={signedMonthlySeries}
          formatCurrency={formatCurrency}
          formatFullCurrency={formatFullCurrency}
        />
        

        {/* Quote Status Pie - company status is admin-only */}
        {!isDistributor && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <PieChartIcon className="w-4 h-4" />
                Quote Status
              </CardTitle>
              <CardDescription>{totalQuotes} total quotes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[220px]">
                {statusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {statusData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number, name: string) => [`${value} quotes`, name]}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    No data
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Payment Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment by Type */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Payment Links by Type
            </CardTitle>
            <CardDescription>Breakdown of payment link amounts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {paymentTypeData.map((item, i) => {
                const maxVal = paymentTypeData[0]?.value || 1;
                const pct = (item.value / maxVal) * 100;
                return (
                  <div key={item.name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-muted-foreground">
                        {formatCurrency(item.value / 100)} · {item.count} links
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: PAYMENT_COLORS[i % PAYMENT_COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Payment by Pricing Option */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Payment Links by Pricing Option
            </CardTitle>
            <CardDescription>Revenue split across pricing tiers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pricingData.map((item, i) => {
                const maxVal = pricingData[0]?.value || 1;
                const pct = (item.value / maxVal) * 100;
                return (
                  <div key={item.name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-muted-foreground">
                        {formatCurrency(item.value / 100)} · {item.count} links
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: PAYMENT_COLORS[i % PAYMENT_COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Signed Deals */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Signed Deals
          </CardTitle>
          <CardDescription>Closed-won quotes</CardDescription>
        </CardHeader>
        <CardContent>
          {signedQuotes.length > 0 ? (
            <div className="space-y-3">
              {signedQuotes.map(q => (
                <button
                  type="button"
                  key={q.id}
                  onClick={() => openQuote(q)}
                  className="w-full text-left flex items-center justify-between p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 hover:bg-emerald-500/10 hover:border-emerald-500/40 transition-colors min-h-[44px] cursor-pointer"
                  aria-label={`Open ${q.company_name || 'quote'} in Quotes`}
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{q.company_name || 'Unnamed'}</p>
                    <p className="text-xs text-muted-foreground">
                      {q.contact_name || '—'} · {q.quote_id || q.id.slice(0, 8)}
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <div className="flex items-baseline gap-2 justify-end">
                      <p className="text-xs text-muted-foreground">Setup:</p>
                      <p className="font-bold text-emerald-600">{formatFullCurrency(q.setup_fee_final || 0)}</p>
                    </div>
                    <div className="flex items-baseline gap-2 justify-end">
                      <p className="text-xs text-muted-foreground">Monthly:</p>
                      <p className="font-bold text-emerald-600">{formatFullCurrency(q.monthly_retainer_final || 0)}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {q.signed_at ? format(new Date(q.signed_at), 'MMM d, yyyy') : '—'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No signed deals yet. Sent proposals will appear here once signed.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
