import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar as CalendarWidget } from '@/components/ui/calendar';
import { DistributorAssignment } from '@/components/admin/DistributorAssignment';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  FileText,
  Building2,
  User,
  Calendar,
  TrendingUp,
  DollarSign,
  Eye,
  Copy,
  CheckCircle2,
  Download,
  Phone,
  ChevronDown,
  ChevronUp,
  Brain,
  ExternalLink,
  Link2,
  MessageSquare,
  Laptop,
  Smartphone,
  ArrowRightCircle,
  PenLine,
  Pencil,
  Check,
  Sparkles,
  Plus,
  Minus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { QuoteVersionHistory } from '@/components/admin/QuoteVersionHistory';
import { QuoteEditModal } from '@/components/admin/quotes/QuoteEditModal';
import { QuoteBulkActions } from '@/components/admin/quotes/QuoteBulkActions';
import { standardSortOptions } from '@/components/admin';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminMetricsStrip } from '@/components/admin/AdminMetricsStrip';
import { AdminToolbar } from '@/components/admin/AdminToolbar';
import { AdminActionsRow } from '@/components/admin/AdminActionsRow';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import { recordOwnedByDistributor } from '@/lib/distributorScope';
import { useCtrlWheelZoom } from '@/hooks/useCtrlWheelZoom';
// Data Tidy-Up moved to dedicated route /admin/tidy-up

const STATUS_OPTIONS = ['draft', 'sent', 'signed', 'won', 'refunded', 'lost'];

interface SentimentAnalysis {
  interestLevel?: string;
  productFit?: string;
  pricingSensitivity?: string;
  recommendation?: string;
  rationale?: string;
}

interface TechStackItem {
  name: string;
  category: string;
  integrationNeed?: string;
  notes?: string;
}

interface ProposalViewStats {
  total_views: number;
  unique_sessions: number;
  first_view_at: string | null;
  last_view_at: string | null;
  mobile_views: number;
  desktop_views: number;
}

interface Quote {
  id: string;
  quote_id: string | null;
  company_name: string | null;
  contact_name: string | null;
  contact_email: string | null;
  industry: string | null;
  team_size: number | null;
  workflows: unknown;
  challenges: string[] | null;
  timeline: string | null;
  setup_fee_min: number | null;
  setup_fee_max: number | null;
  monthly_retainer_min: number | null;
  monthly_retainer_max: number | null;
  setup_fee_final: number | null;
  monthly_retainer_final: number | null;
  roi_conservative: number | null;
  roi_likely: number | null;
  roi_best: number | null;
  payback_months_conservative: number | null;
  payback_months_likely: number | null;
  payback_months_best: number | null;
  status: string | null;
  outcome: string | null;
  notes: string | null;
  transcript_summary: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  voice_agent_plan: string | null;
  voice_agent_monthly_cost: number | null;
  voice_agent_setup_cost: number | null;
  voice_agent_workflow_count: number | null;
  voice_agent_addons: unknown;
  access_code: string | null;
  meeting_transcript: string | null;
  sentiment_analysis: SentimentAnalysis | null;
  current_tech_stack: TechStackItem[] | null;
  // Signature fields
  signed_at: string | null;
  signed_by_name: string | null;
  signed_by_email: string | null;
  // Handover fields
  handover_status: string | null;
  handover_triggered_at: string | null;
  handover_notes: string | null;
  poc_requested: boolean;
}

export default function QuotesAdmin() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAdminAuth();
  const { isDistributor, canExportLeads, isSuperAdmin, viewAsProfile } = usePermissions();
  // When an admin previews via "View As", scope distributor data to the previewed user.
  const scopedUserId = viewAsProfile?.userId ?? user?.id ?? null;
  const scopedUserEmail = (viewAsProfile?.email ?? user?.email ?? '').trim().toLowerCase();
  const [collaboratorQuoteIds, setCollaboratorQuoteIds] = useState<string[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortValue, setSortValue] = useState('date_desc');
  const [pocFilter, setPocFilter] = useState('all');
  const [repFilter, setRepFilter] = useState('all');
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [proposalViewStats, setProposalViewStats] = useState<ProposalViewStats | null>(null);
  const [pdfDownloads, setPdfDownloads] = useState<{ count: number; lastAt: string | null }>({ count: 0, lastAt: null });
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(false);
  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  // Edit modal state
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  // Inline status update state
  const [updatingQuoteId, setUpdatingQuoteId] = useState<string | null>(null);
  // Confirmation dialog for destructive status changes
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    quoteId: string;
    newStatus: string;
    quote: Quote;
  } | null>(null);
  // Date picker for won status
  const [pendingWonDate, setPendingWonDate] = useState<{
    quoteId: string;
    newStatus: string;
    quote: Quote;
    selectedDate: Date | undefined;
  } | null>(null);
  // Payment amounts from quote_payments (keyed by quote_id string e.g. "ABC-1234-XYZ")
  const [paymentAmounts, setPaymentAmounts] = useState<Record<string, { setupFee: number; monthlyRetainer: number }>>({});
  const quotesTableScrollRef = useRef<HTMLDivElement>(null);
  const {
    containerRef: zoomContainerRef,
    zoom: tableZoom,
    zoomIn,
    zoomOut,
    resetZoom,
  } = useCtrlWheelZoom('admin:quotes:tableZoom');


  const scrollQuotesTable = useCallback((direction: 'left' | 'right') => {
    const container = quotesTableScrollRef.current;
    if (!container) return;

    const scrollAmount = Math.max(container.clientWidth * 0.75, 320);
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  }, []);

  const fetchQuotes = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .or('outcome.is.null,outcome.neq.Archived via Data Tidy-Up')
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Cast the data to match our Quote interface with proper type handling
      const typedQuotes: Quote[] = (data || []).map(q => ({
        ...q,
        sentiment_analysis: q.sentiment_analysis as unknown as SentimentAnalysis | null,
        current_tech_stack: Array.isArray(q.current_tech_stack) 
          ? (q.current_tech_stack as unknown as TechStackItem[])
          : null,
      }));
      setQuotes(typedQuotes);
    } catch (err) {
      console.error('Failed to fetch quotes:', err);
      toast.error('Failed to load quotes');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPaymentAmounts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('quote_payments')
        .select('quote_id, payment_type, installment_type, pricing_option, amount, created_at')
        .neq('status', 'superseded')
        .in('payment_type', [
          'setup_fee', 'setup_initiation', 'setup_month1', 'setup_month2', 'setup_month3',
          'monthly_retainer', 'slot_reservation'
        ])
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data) return;

      // Group by quote_id, then deduplicate by composite key (payment_type:installment_type)
      // keeping only the latest entry for each key (data is sorted newest first)
      const groupedByQuote: Record<string, typeof data> = {};
      for (const row of data) {
        if (!row.quote_id) continue;
        if (!groupedByQuote[row.quote_id]) groupedByQuote[row.quote_id] = [];
        groupedByQuote[row.quote_id].push(row);
      }

      const amountsMap: Record<string, { setupFee: number; monthlyRetainer: number }> = {};
      for (const [quoteId, rows] of Object.entries(groupedByQuote)) {
        // Find latest batch: entries within 60s of newest entry and same pricing option
        const latestTime = new Date(rows[0].created_at).getTime();
        const latestPricingOption = rows[0].pricing_option;
        const batchRows = rows.filter((r) => {
          const isInLatestWindow = latestTime - new Date(r.created_at).getTime() < 60000;
          const isSamePricingOption = (r.pricing_option ?? null) === (latestPricingOption ?? null);
          return isInLatestWindow && isSamePricingOption;
        });

        // Deduplicate by composite key within the batch (last entry wins = first in desc order)
        const seen = new Set<string>();
        const dedupedRows: typeof rows = [];
        for (const row of batchRows) {
          const key = `${row.payment_type}:${row.installment_type || ''}`;
          if (!seen.has(key)) {
            seen.add(key);
            dedupedRows.push(row);
          }
        }

        const entry = { setupFee: 0, monthlyRetainer: 0 };
        for (const row of dedupedRows) {
          if (row.payment_type === 'monthly_retainer') {
            entry.monthlyRetainer = row.amount / 100;
          } else {
            entry.setupFee += row.amount / 100;
          }
        }
        amountsMap[quoteId] = entry;
      }
      setPaymentAmounts(amountsMap);
    } catch (err) {
      console.error('Failed to fetch payment amounts:', err);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchQuotes().then(() => fetchPaymentAmounts());
    }
  }, [user]);

  // Deep-link: open quote modal when ?quote=<quote_id> or ?quote=<uuid> is present
  useEffect(() => {
    const target = searchParams.get('quote');
    if (!target || quotes.length === 0) return;
    const match = quotes.find(
      (q) => q.quote_id === target || q.id === target || q.access_code === target
    );
    if (match) {
      setSelectedQuote(match);
    } else {
      toast.error(`Quote "${target}" not found`);
    }
    // Clear param so it doesn't re-trigger
    searchParams.delete('quote');
    setSearchParams(searchParams, { replace: true });
  }, [quotes, searchParams, setSearchParams]);

  // Fetch proposal view stats when a quote is selected
  useEffect(() => {
    if (selectedQuote?.id) {
      fetchProposalViewStats(selectedQuote.id);
      fetchPdfDownloads(selectedQuote.quote_id || selectedQuote.id);
      setIsTranscriptOpen(false);
    } else {
      setProposalViewStats(null);
      setPdfDownloads({ count: 0, lastAt: null });
    }
    // Keyed on the id on purpose: this should refetch when a DIFFERENT quote
    // is selected, not when some unrelated field on the same quote changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedQuote?.id]);

  const fetchProposalViewStats = async (quoteId: string) => {
    try {
      const { data, error } = await supabase
        .rpc('get_proposal_view_stats', { p_quote_id: quoteId });
      
      if (error) throw error;
      if (data && data.length > 0) {
        setProposalViewStats(data[0] as ProposalViewStats);
      } else {
        setProposalViewStats(null);
      }
    } catch (err) {
      console.error('Failed to fetch proposal view stats:', err);
      setProposalViewStats(null);
    }
  };

  const fetchPdfDownloads = async (quoteId: string) => {
    try {
      const { data, error } = await supabase
        .from('proposal_pdf_downloads')
        .select('downloaded_at')
        .eq('quote_id', quoteId)
        .order('downloaded_at', { ascending: false });
      if (error) throw error;
      setPdfDownloads({
        count: data?.length || 0,
        lastAt: data?.[0]?.downloaded_at || null,
      });
    } catch {
      setPdfDownloads({ count: 0, lastAt: null });
    }
  };

  const handleCopyQuoteId = async (quoteId: string) => {
    try {
      await navigator.clipboard.writeText(quoteId);
      setCopiedId(quoteId);
      toast.success('Quote ID copied to clipboard');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('Failed to copy Quote ID');
    }
  };

  const handleCopyAccessCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success('Access code copied to clipboard');
    } catch {
      toast.error('Failed to copy access code');
    }
  };

  const handleCopyProposalLink = async (quoteId: string) => {
    try {
      const link = `${window.location.origin}/proposal/${quoteId}`;
      await navigator.clipboard.writeText(link);
      toast.success('Proposal link copied to clipboard');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const getInterestLevelColor = (level?: string) => {
    switch (level?.toLowerCase()) {
      case 'high': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'low': return 'bg-red-500/10 text-red-600 border-red-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  // Load collaborator quote ids for the previewed/current distributor (resilient: falls back to ownership matching on error).
  useEffect(() => {
    if (!isDistributor || !scopedUserId) {
      setCollaboratorQuoteIds([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('record_collaborators')
          .select('entity_id')
          .eq('entity_type', 'quote')
          .eq('user_id', scopedUserId);
        if (error) throw error;
        if (!cancelled) setCollaboratorQuoteIds((data || []).map((r) => r.entity_id));
      } catch (err) {
        console.error('Failed to load collaborator quotes:', err);
        if (!cancelled) setCollaboratorQuoteIds([]);
      }
    })();
    return () => { cancelled = true; };
  }, [isDistributor, scopedUserId]);

  const collaboratorQuoteIdSet = useMemo(() => new Set(collaboratorQuoteIds), [collaboratorQuoteIds]);

  const filteredQuotes = useMemo(() => {
    const result = quotes.filter(quote => {
      // Distributor scope: only this distributor's own contribution (assigned, created, or collaborator).
      if (!recordOwnedByDistributor(
        quote as unknown as { id: string; assigned_distributor_id?: string | null; created_by_user_id?: string | null; created_by?: string | null },
        { isDistributor, scopedUserId, scopedUserEmail, collaboratorIds: collaboratorQuoteIdSet },
      )) return false;

      const query = searchQuery.toLowerCase();
      const matchesSearch = !query || (
        (quote.quote_id?.toLowerCase().includes(query)) ||
        (quote.company_name?.toLowerCase().includes(query)) ||
        (quote.contact_name?.toLowerCase().includes(query)) ||
        (quote.contact_email?.toLowerCase().includes(query)) ||
        (quote.industry?.toLowerCase().includes(query))
      );

      const matchesStatus = statusFilter === 'all' || quote.status === statusFilter;

      const matchesPoc = pocFilter === 'all' || 
        (pocFilter === 'yes' && quote.poc_requested) || 
        (pocFilter === 'no' && !quote.poc_requested);

      let matchesDate = true;
      if (dateFilter !== 'all') {
        const now = new Date();
        const created = new Date(quote.created_at);
        switch (dateFilter) {
          case 'today':
            matchesDate = created >= startOfDay(now) && created <= endOfDay(now);
            break;
          case '7days':
            matchesDate = created >= startOfDay(subDays(now, 7));
            break;
          case '30days':
            matchesDate = created >= startOfDay(subDays(now, 30));
            break;
        }
      }

      const matchesRep = repFilter === 'all' || (quote.created_by || '') === repFilter;

      return matchesSearch && matchesStatus && matchesPoc && matchesDate && matchesRep;
    });

    // Sort
    result.sort((a, b) => {
      switch (sortValue) {
        case 'date_asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'name_asc':
          return (a.company_name || '').localeCompare(b.company_name || '');
        case 'name_desc':
          return (b.company_name || '').localeCompare(a.company_name || '');
        case 'date_desc':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return result;
  }, [quotes, searchQuery, statusFilter, dateFilter, sortValue, pocFilter, repFilter, isDistributor, scopedUserId, scopedUserEmail, collaboratorQuoteIdSet]);

  // The tiles count the same set the table can show. They used to count
  // `quotes` directly, so a distributor saw company-wide totals above a list
  // scoped to their own quotes — the number and the rows disagreed.
  const scopedQuotes = useMemo(
    () => quotes.filter((quote) => recordOwnedByDistributor(
      quote as unknown as { id: string; assigned_distributor_id?: string | null; created_by_user_id?: string | null; created_by?: string | null },
      { isDistributor, scopedUserId, scopedUserEmail, collaboratorIds: collaboratorQuoteIdSet },
    )),
    [quotes, isDistributor, scopedUserId, scopedUserEmail, collaboratorQuoteIdSet],
  );
  const statusCount = (st: string) => scopedQuotes.filter((q) => q.status === st).length;

  const uniqueReps = useMemo(() => {
    const reps = quotes.map(q => q.created_by).filter(Boolean) as string[];
    return [...new Set(reps)].sort();
  }, [quotes]);

  // Bulk selection handlers
  const handleSelectAll = useCallback(() => {
    if (selectedIds.length === filteredQuotes.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredQuotes.map(q => q.id));
    }
  }, [selectedIds.length, filteredQuotes]);

  const handleSelectOne = useCallback((id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const handleEditQuote = useCallback((quote: Quote) => {
    setEditingQuote(quote);
    setIsEditModalOpen(true);
  }, []);

  const handleTogglePoc = useCallback(async (quoteId: string, checked: boolean) => {
    try {
      const { error } = await supabase
        .from('quotes')
        .update({ poc_requested: checked, updated_at: new Date().toISOString() })
        .eq('id', quoteId);
      if (error) throw error;
      setQuotes(prev => prev.map(q => q.id === quoteId ? { ...q, poc_requested: checked } : q));
      toast.success(checked ? 'PoC marked as requested' : 'PoC request removed');
    } catch (err) {
      console.error('Failed to update PoC status:', err);
      toast.error('Failed to update PoC status');
    }
  }, []);

  const formatCurrency = (value: number | null) => {
    if (value === null) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'signed':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'won':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'refunded':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'lost':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'sent':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'draft':
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusDotColor = (status: string) => {
    switch (status) {
      case 'signed': return 'bg-emerald-500';
      case 'won': return 'bg-green-500';
      case 'refunded': return 'bg-amber-500';
      case 'lost': return 'bg-red-500';
      case 'sent': return 'bg-blue-500';
      case 'draft':
      default: return 'bg-gray-400';
    }
  };

  const handleQuickStatusChange = async (quoteId: string, newStatus: string) => {
    const quote = quotes.find(q => q.id === quoteId);
    if (!quote) return;

    const currentStatus = quote.status || 'draft';

    // Block direct admin setting of "signed" status
    if (newStatus === 'signed' && currentStatus !== 'signed') {
      toast.error('Quotes can only be signed via the proposal page');
      return;
    }

    // Prompt for date when changing to "won"
    if (newStatus === 'won' && currentStatus !== 'won') {
      setPendingWonDate({ quoteId, newStatus, quote, selectedDate: new Date() });
      return;
    }

    // Check if this is a status reversion that requires cascading changes
    const isRevertingFromSigned = (currentStatus === 'signed' || currentStatus === 'won') && 
      (newStatus === 'draft' || newStatus === 'sent');
    const hasSignatureData = !!quote.signed_at;

    // Show confirmation for destructive status changes
    if (isRevertingFromSigned && hasSignatureData) {
      setPendingStatusChange({ quoteId, newStatus, quote });
      return;
    }

    // Execute simple status change
    await executeStatusChange(quoteId, newStatus, quote);
  };

  const executeStatusChange = async (quoteId: string, newStatus: string, quote: Quote, signedAtDate?: string) => {
    const currentStatus = quote.status || 'draft';
    const isRevertingFromSigned = (currentStatus === 'signed' || currentStatus === 'won') && 
      (newStatus === 'draft' || newStatus === 'sent');
    const hasSignatureData = !!quote.signed_at;

    setUpdatingQuoteId(quoteId);
    setPendingStatusChange(null);

    try {
      // Build update payload with cascading field resets
      const updatePayload: Record<string, unknown> = {
        status: newStatus,
        updated_at: new Date().toISOString(),
        ...(signedAtDate ? { signed_at: signedAtDate } : {})
      };

      // Clear signature and handover fields when reverting from signed
      if (isRevertingFromSigned && hasSignatureData) {
        updatePayload.signed_at = null;
        updatePayload.signed_by_name = null;
        updatePayload.signed_by_email = null;
        updatePayload.signature_ip_hash = null;
        updatePayload.handover_status = 'pending';
        updatePayload.handover_triggered_at = null;
      }

      const { error } = await supabase
        .from('quotes')
        .update(updatePayload)
        .eq('id', quoteId);

      if (error) throw error;

      // Handle related tables when reverting from signed
      if (isRevertingFromSigned && hasSignatureData) {
        // Supersede existing payment links
        if (quote.quote_id) {
          await supabase
            .from('quote_payments')
            .update({ status: 'superseded' })
            .eq('quote_id', quote.quote_id)
            .eq('status', 'pending');
        }

        // Cancel handover requests
        await supabase
          .from('handover_requests')
          .update({ status: 'cancelled' })
          .eq('quote_id', quoteId)
          .neq('status', 'completed');
      }

      toast.success(`Quote status updated to "${newStatus}"`);

      // Update local state with all cleared fields
      setQuotes(prev => prev.map(q => 
        q.id === quoteId 
          ? { 
              ...q, 
              status: newStatus, 
              updated_at: new Date().toISOString(),
              ...(isRevertingFromSigned && hasSignatureData ? {
                signed_at: null,
                signed_by_name: null,
                signed_by_email: null,
                handover_status: 'pending',
                handover_triggered_at: null
              } : {})
            } 
          : q
      ));
    } catch (err: unknown) {
      console.error('Status update failed:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setUpdatingQuoteId(null);
    }
  };

  const getHandoverStatusColor = (status: string | null) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'in_progress':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'triggered':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'pending':
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const handleTriggerHandover = async (quote: Quote) => {
    if (!quote.quote_id) {
      toast.error('Quote ID is required to trigger handover');
      return;
    }

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        toast.error('Please log in to trigger handover');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/trigger-handover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify({
          quoteId: quote.quote_id,
          priority: 'normal',
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to trigger handover');
      }

      toast.success('Handover triggered successfully');
      fetchQuotes();
    } catch (err) {
      console.error('Error triggering handover:', err);
      toast.error(err.message || 'Failed to trigger handover');
    }
  };

  const exportToCSV = () => {
    const dataToExport = filteredQuotes.length > 0 ? filteredQuotes : quotes;
    
    if (dataToExport.length === 0) {
      toast.error('No quotes to export');
      return;
    }

    // CSV headers
    const headers = [
      'Quote ID',
      'Company Name',
      'Contact Name',
      'Contact Email',
      'Industry',
      'Team Size',
      'Timeline',
      'Setup Fee Min',
      'Setup Fee Max',
      'Monthly Min',
      'Monthly Max',
      'ROI Conservative',
      'ROI Likely',
      'ROI Best',
      'Payback Months (Conservative)',
      'Payback Months (Likely)',
      'Payback Months (Best)',
      'Status',
      'Outcome',
      'Voice Agent Plan',
      'Voice Agent Monthly',
      'Voice Agent Setup',
      'Voice Agent Workflows',
      'Created By',
      'Created At',
      'Workflows',
      'Challenges',
      'Notes',
    ];

    // Format data rows
    const rows = dataToExport.map(quote => [
      quote.quote_id || '',
      quote.company_name || '',
      quote.contact_name || '',
      quote.contact_email || '',
      quote.industry || '',
      quote.team_size?.toString() || '',
      quote.timeline || '',
      quote.setup_fee_min?.toString() || '',
      quote.setup_fee_max?.toString() || '',
      quote.monthly_retainer_min?.toString() || '',
      quote.monthly_retainer_max?.toString() || '',
      quote.roi_conservative?.toFixed(1) || '',
      quote.roi_likely?.toFixed(1) || '',
      quote.roi_best?.toFixed(1) || '',
      quote.payback_months_conservative?.toString() || '',
      quote.payback_months_likely?.toString() || '',
      quote.payback_months_best?.toString() || '',
      quote.status || '',
      quote.outcome || '',
      quote.voice_agent_plan || '',
      quote.voice_agent_monthly_cost?.toString() || '',
      quote.voice_agent_setup_cost?.toString() || '',
      quote.voice_agent_workflow_count?.toString() || '',
      quote.created_by || '',
      format(new Date(quote.created_at), 'yyyy-MM-dd HH:mm:ss'),
      Array.isArray(quote.workflows) ? quote.workflows.join('; ') : '',
      quote.challenges?.join('; ') || '',
      (quote.notes || '').replace(/[\n\r]/g, ' '),
    ]);

    // Escape CSV values
    const escapeCSV = (value: string) => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    // Build CSV content
    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...rows.map(row => row.map(escapeCSV).join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `quotes-export-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${dataToExport.length} quotes to CSV`);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Please log in to view quotes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 min-w-0 overflow-x-hidden">
      {/* Band 1 — title. Refresh is in the header so every role keeps it. */}
      <AdminPageHeader
        title="Quotes"
        description="Manage and track all generated quotes"
        icon={<FileText className="h-4 w-4" />}
        onRefresh={fetchQuotes}
        isLoading={isLoading}
      />

      {/* Band 2 — tiles. Each one filters the table. Sent is the one that asks
          for something: a quote out with the client and not yet signed. Draft,
          Refunded and Lost stay reachable from the Status filter. */}
      <AdminMetricsStrip
        metrics={[
          { label: 'All quotes', value: scopedQuotes.length, active: statusFilter === 'all', onClick: () => setStatusFilter('all') },
          { label: 'Sent, not signed', value: statusCount('sent'), tone: statusCount('sent') > 0 ? 'warn' : 'default', active: statusFilter === 'sent', onClick: () => setStatusFilter(statusFilter === 'sent' ? 'all' : 'sent') },
          { label: 'Signed', value: statusCount('signed'), tone: 'good', active: statusFilter === 'signed', onClick: () => setStatusFilter(statusFilter === 'signed' ? 'all' : 'signed') },
          { label: 'Won', value: statusCount('won'), tone: 'good', active: statusFilter === 'won', onClick: () => setStatusFilter(statusFilter === 'won' ? 'all' : 'won') },
        ]}
      />

      {/* Admin tools — role-gated by the row itself. */}
      <AdminActionsRow
        actions={[
          { key: 'tidy', label: 'Tidy up', icon: <Sparkles className="h-3.5 w-3.5" />, onClick: () => navigate('/admin/tidy-up'), allowed: !isDistributor },
          { key: 'export', label: 'Export CSV', icon: <Download className="h-3.5 w-3.5" />, onClick: exportToCSV, disabled: !filteredQuotes.length, allowed: canExportLeads },
        ]}
      />

      {/* Band 3 — the shared toolbar: Search · Sort · Status · Owner first, in
          the Standard's order (the sales rep IS the owner of a quote), then
          Date and PoC. */}
      <AdminToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by Quote ID, company, contact..."
        resultCount={filteredQuotes.length}
        resultNoun="quotes"
        filters={[
          { key: 'sort', label: 'Sort', options: standardSortOptions, value: sortValue, onChange: setSortValue, allValue: 'date_desc' },
          {
            key: 'status',
            label: 'Status',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: 'all', label: 'All Status' },
              { value: 'draft', label: `Draft (${statusCount('draft')})` },
              { value: 'sent', label: `Sent (${statusCount('sent')})` },
              { value: 'signed', label: `Signed (${statusCount('signed')})` },
              { value: 'won', label: `Won (${statusCount('won')})` },
              { value: 'refunded', label: `Refunded (${statusCount('refunded')})` },
              { value: 'lost', label: `Lost (${statusCount('lost')})` },
            ],
          },
          {
            key: 'rep',
            label: 'Owner',
            value: repFilter,
            onChange: setRepFilter,
            options: [
              { value: 'all', label: 'All Reps' },
              ...uniqueReps.map(r => ({ value: r, label: r })),
            ],
          },
          {
            key: 'date',
            label: 'Date',
            value: dateFilter,
            onChange: setDateFilter,
            options: [
              { value: 'all', label: 'All Time' },
              { value: 'today', label: 'Today' },
              { value: '7days', label: 'Last 7 Days' },
              { value: '30days', label: 'Last 30 Days' },
            ],
          },
          {
            key: 'poc',
            label: 'PoC',
            value: pocFilter,
            onChange: setPocFilter,
            options: [
              { value: 'all', label: 'PoC: all' },
              { value: 'yes', label: 'PoC Requested' },
              { value: 'no', label: 'No PoC' },
            ],
          },
        ]}
        onClearAll={() => {
          setSearchQuery('');
          setStatusFilter('all');
          setDateFilter('all');
          setPocFilter('all');
          setRepFilter('all');
          setSortValue('date_desc');
        }}
      />

      {/* Bulk Actions Bar */}
      <QuoteBulkActions
        selectedIds={selectedIds}
        quotes={filteredQuotes}
        onSuccess={fetchQuotes}
        onClearSelection={handleClearSelection}
      />

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredQuotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? 'No quotes match your search' : 'No quotes yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-end gap-2 px-1">
                <span className="text-[11px] text-muted-foreground hidden sm:inline">
                  Ctrl / ⌘ + scroll to zoom
                </span>
                <div className="flex items-center gap-0.5">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={zoomOut} title="Zoom out" aria-label="Zoom out">
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <button
                    type="button"
                    onClick={resetZoom}
                    title="Reset zoom"
                    className="min-w-[42px] rounded px-1 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    {Math.round(tableZoom * 100)}%
                  </button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={zoomIn} title="Zoom in" aria-label="Zoom in">
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div ref={zoomContainerRef} style={{ zoom: tableZoom }} className="min-w-0">
              <Table
                containerRef={quotesTableScrollRef}
                containerClassName="w-full overflow-x-auto overflow-y-hidden scroll-smooth [touch-action:pan-x_pan-y]"
                className="w-full table-fixed"
              >

                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[36px]">
                      <Checkbox
                        checked={selectedIds.length === filteredQuotes.length && filteredQuotes.length > 0}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead className="w-[7%]">ID</TableHead>
                    <TableHead className="w-[12%]">Company</TableHead>
                    <TableHead className="w-[13%]">Contact</TableHead>
                    <TableHead className="w-[10%]">Industry</TableHead>
                    <TableHead className="w-[9%]">Setup Fee</TableHead>
                    <TableHead className="w-[9%]">Monthly</TableHead>
                    <TableHead className="w-[8%]">Voice</TableHead>
                    <TableHead className="w-[7%]">Status</TableHead>
                    <TableHead className="w-[4%] text-center">PoC</TableHead>
                    <TableHead className="w-[8%]">Created</TableHead>
                    <TableHead className="w-[8%]">By</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuotes.map((quote) => (
                    <TableRow 
                      key={quote.id}
                      className={cn(selectedIds.includes(quote.id) && 'bg-primary/5')}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(quote.id)}
                          onCheckedChange={() => handleSelectOne(quote.id)}
                          aria-label={`Select ${quote.quote_id || quote.id}`}
                        />
                      </TableCell>
                      <TableCell>
                        <code
                          className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded cursor-pointer hover:bg-muted/80 truncate block max-w-full"
                          onClick={() => quote.quote_id && handleCopyQuoteId(quote.quote_id)}
                          title={quote.quote_id ? 'Click to copy' : undefined}
                        >
                          {quote.quote_id || '-'}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 min-w-0" title={quote.company_name || undefined}>
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="font-medium text-sm truncate">
                            {quote.company_name || '-'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-1 min-w-0">
                            <User className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="text-xs truncate">{quote.contact_name || '-'}</span>
                          </div>
                          {quote.contact_email && (
                            <span className="text-xs text-muted-foreground truncate block pl-4">
                              {quote.contact_email}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="overflow-hidden">
                        {isSuperAdmin ? (
                          <Input
                            className="h-7 text-xs bg-transparent border-transparent hover:border-border capitalize max-w-full"
                            value={quote.industry || ''}
                            onChange={(e) => setQuotes(prev => prev.map(q => q.id === quote.id ? { ...q, industry: e.target.value } : q))}
                            onBlur={async (e) => {
                              const newVal = e.target.value.trim() || null;
                              const { error } = await supabase.from('quotes').update({ industry: newVal }).eq('id', quote.id);
                              if (error) toast.error('Failed to update industry');
                              else toast.success('Industry updated');
                            }}
                            placeholder="General"
                          />
                        ) : (
                          <Badge variant="outline" className="capitalize truncate max-w-full text-xs">
                            {quote.industry || 'General'}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {quote.setup_fee_final ? (
                          <span className="text-sm font-medium">
                            {formatCurrency(quote.setup_fee_final)}
                          </span>
                        ) : quote.quote_id && paymentAmounts[quote.quote_id]?.setupFee ? (
                          <span className="text-sm font-semibold text-emerald-700 flex items-center gap-1">
                            <Link2 className="w-3 h-3 shrink-0" />
                            {formatCurrency(paymentAmounts[quote.quote_id].setupFee)}
                          </span>
                        ) : (quote.setup_fee_min || quote.setup_fee_max) ? (
                          <span className="text-sm text-muted-foreground">
                            {formatCurrency(quote.setup_fee_min)} – {formatCurrency(quote.setup_fee_max)}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">– – –</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {quote.monthly_retainer_final ? (
                          <span className="text-sm font-medium">
                            {formatCurrency(quote.monthly_retainer_final)}
                          </span>
                        ) : quote.quote_id && paymentAmounts[quote.quote_id]?.monthlyRetainer ? (
                          <span className="text-sm font-semibold text-emerald-700 flex items-center gap-1">
                            <Link2 className="w-3 h-3 shrink-0" />
                            {formatCurrency(paymentAmounts[quote.quote_id].monthlyRetainer)}
                          </span>
                        ) : (quote.monthly_retainer_min || quote.monthly_retainer_max) ? (
                          <span className="text-sm text-muted-foreground">
                            {formatCurrency(quote.monthly_retainer_min)} – {formatCurrency(quote.monthly_retainer_max)}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">– – –</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {quote.voice_agent_plan && quote.voice_agent_plan !== 'none' ? (
                          <div className="space-y-1">
                            <Badge variant="outline" className="capitalize gap-1">
                              <Phone className="w-3 h-3" />
                              {quote.voice_agent_plan}
                            </Badge>
                            <p className="text-xs text-muted-foreground">
                              {formatCurrency(quote.voice_agent_monthly_cost)}/mo
                            </p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button 
                                className="inline-flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-md min-h-[44px] min-w-[44px] p-1"
                                disabled={updatingQuoteId === quote.id}
                              >
                                <Badge className={cn('capitalize', getStatusColor(quote.status))}>
                                  {quote.status || 'draft'}
                                </Badge>
                                <ChevronDown className="h-3 w-3 text-muted-foreground" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-popover border shadow-lg z-50">
                              {STATUS_OPTIONS.map((status) => (
                                <DropdownMenuItem
                                  key={status}
                                  onClick={() => handleQuickStatusChange(quote.id, status)}
                                  disabled={updatingQuoteId === quote.id}
                                  className="min-h-[44px] cursor-pointer"
                                >
                                  <span className={cn('h-2 w-2 rounded-full mr-2', getStatusDotColor(status))} />
                                  <span className="capitalize">{status}</span>
                                  {quote.status === status && <Check className="ml-auto h-4 w-4" />}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                          {quote.signed_at && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <PenLine className="h-3 w-3" />
                              {format(new Date(quote.signed_at), 'MMM d')}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={quote.poc_requested}
                          onCheckedChange={(checked) => handleTogglePoc(quote.id, !!checked)}
                          aria-label="PoC Requested"
                          className="mx-auto"
                        />
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(quote.created_at), 'MMM d, yyyy')}
                        </span>
                      </TableCell>
                      <TableCell className="min-w-[160px] align-middle">
                        {isSuperAdmin ? (
                          <Input
                            className="h-7 text-sm bg-transparent border-transparent hover:border-border focus:border-primary w-full min-w-[140px]"
                            value={quote.created_by || ''}
                            onChange={(e) => {
                              setQuotes(prev => prev.map(q => q.id === quote.id ? { ...q, created_by: e.target.value } : q));
                            }}
                            onBlur={async (e) => {
                              const newVal = e.target.value.trim() || null;
                              const { error } = await supabase.from('quotes').update({ created_by: newVal }).eq('id', quote.id);
                              if (error) {
                                toast.error('Failed to update sales rep');
                                fetchQuotes();
                              } else {
                                toast.success('Sales rep updated');
                              }
                            }}
                            placeholder="—"
                          />
                        ) : (
                          <span className="block text-sm text-muted-foreground truncate">
                            {quote.created_by || '-'}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="w-[120px] whitespace-nowrap align-middle">
                        <div className="flex items-center justify-end gap-0.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedQuote(quote)}
                            title="View details"
                            className="h-8 w-8 shrink-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditQuote(quote)}
                            title="Edit quote"
                            className="h-8 w-8 shrink-0 text-blue-600 hover:text-blue-700"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>

                          {quote.status === 'signed' && quote.handover_status !== 'triggered' && quote.handover_status !== 'in_progress' && quote.handover_status !== 'completed' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleTriggerHandover(quote)}
                              title="Trigger handover"
                              className="h-8 w-8 shrink-0 text-amber-600 hover:text-amber-700"
                            >
                              <ArrowRightCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </div>

          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={!!selectedQuote} onOpenChange={() => setSelectedQuote(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Quote Details
            </DialogTitle>
          </DialogHeader>
          {selectedQuote && (
            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="space-y-6">
                {/* Quote ID */}
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Quote ID</p>
                    <code className="text-lg font-mono font-bold">
                      {selectedQuote.quote_id || 'Not assigned'}
                    </code>
                  </div>
                  <Badge className={cn('capitalize', getStatusColor(selectedQuote.status))}>
                    {selectedQuote.status || 'draft'}
                  </Badge>
                </div>

                {/* Company & Contact */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Company</p>
                    <p className="font-medium">{selectedQuote.company_name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Industry</p>
                    <p className="font-medium capitalize">{selectedQuote.industry || 'General'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Contact Name</p>
                    <p className="font-medium">{selectedQuote.contact_name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Contact Email</p>
                    <p className="font-medium">{selectedQuote.contact_email || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Team Size</p>
                    <p className="font-medium">{selectedQuote.team_size || '-'} employees</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Timeline</p>
                    <p className="font-medium capitalize">{selectedQuote.timeline || '-'}</p>
                  </div>
                </div>

                {/* Distributor assignment (admins only) */}
                {!isDistributor && (
                  <DistributorAssignment
                    entityType="quote"
                    entityId={selectedQuote.id}
                    tableName="quotes"
                  />
                )}

                {/* Proposal Sharing */}
                {selectedQuote.quote_id && (
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Link2 className="h-4 w-4" />
                      Proposal Sharing
                    </h4>
                    <div className="p-4 bg-muted/50 rounded-lg space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Access Code</p>
                          <code className="text-lg font-mono font-bold">
                            {selectedQuote.access_code || 'Not set'}
                          </code>
                        </div>
                        {selectedQuote.access_code && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyAccessCode(selectedQuote.access_code!)}
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            Copy
                          </Button>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyProposalLink(selectedQuote.quote_id!)}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Copy Link
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`/proposal/${selectedQuote.quote_id}`, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          View Proposal
                        </Button>
                      </div>
                      
                      {/* Proposal View Stats */}
                      {proposalViewStats && proposalViewStats.total_views > 0 && (
                        <div className="pt-3 border-t border-border/50">
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                                <Eye className="h-3 w-3" />
                                <span className="text-xs">Views</span>
                              </div>
                              <p className="text-lg font-bold">{proposalViewStats.total_views}</p>
                            </div>
                            <div>
                              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                                <Laptop className="h-3 w-3" />
                                <span className="text-xs">Desktop</span>
                              </div>
                              <p className="text-lg font-bold">{proposalViewStats.desktop_views}</p>
                            </div>
                            <div>
                              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                                <Smartphone className="h-3 w-3" />
                                <span className="text-xs">Mobile</span>
                              </div>
                              <p className="text-lg font-bold">{proposalViewStats.mobile_views}</p>
                            </div>
                          </div>
                          {proposalViewStats.last_view_at && (
                            <p className="text-xs text-muted-foreground text-center mt-2">
                              Last viewed: {format(new Date(proposalViewStats.last_view_at), 'MMM d, yyyy h:mm a')}
                            </p>
                          )}
                        </div>
                      )}
                      
                      {/* PDF Download Stats */}
                      {pdfDownloads.count > 0 && (
                        <div className="pt-3 border-t border-border/50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Download className="h-3 w-3" />
                              <span className="text-xs">PDF Downloads</span>
                            </div>
                            <p className="text-lg font-bold">{pdfDownloads.count}</p>
                          </div>
                          {pdfDownloads.lastAt && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Last download: {format(new Date(pdfDownloads.lastAt), 'MMM d, yyyy h:mm a')}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Signature & Handover Status */}
                {selectedQuote.status === 'signed' && (
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <PenLine className="h-4 w-4" />
                      Signature & Handover
                    </h4>
                    <div className="p-4 bg-emerald-500/5 rounded-lg space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Signed By</p>
                          <p className="font-medium">{selectedQuote.signed_by_name || '-'}</p>
                          {selectedQuote.signed_by_email && (
                            <p className="text-xs text-muted-foreground">{selectedQuote.signed_by_email}</p>
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Signed At</p>
                          <p className="font-medium">
                            {selectedQuote.signed_at 
                              ? format(new Date(selectedQuote.signed_at), 'MMM d, yyyy h:mm a')
                              : '-'
                            }
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-border/50">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Handover Status</p>
                          <Badge className={cn('capitalize', getHandoverStatusColor(selectedQuote.handover_status))}>
                            {selectedQuote.handover_status || 'pending'}
                          </Badge>
                        </div>
                        {selectedQuote.handover_status !== 'triggered' && 
                         selectedQuote.handover_status !== 'in_progress' && 
                         selectedQuote.handover_status !== 'completed' && (
                          <Button
                            size="sm"
                            onClick={() => handleTriggerHandover(selectedQuote)}
                          >
                            <ArrowRightCircle className="h-4 w-4 mr-1" />
                            Trigger Handover
                          </Button>
                        )}
                      </div>
                      {selectedQuote.handover_notes && (
                        <div className="pt-3 border-t border-border/50">
                          <p className="text-sm text-muted-foreground mb-1">Handover Notes</p>
                          <p className="text-sm">{selectedQuote.handover_notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Sentiment Analysis */}
                {selectedQuote.sentiment_analysis && Object.keys(selectedQuote.sentiment_analysis).length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Brain className="h-4 w-4" />
                      AI Sentiment Analysis
                    </h4>
                    <div className="p-4 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg space-y-3">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Interest Level</p>
                          <Badge className={cn('capitalize', getInterestLevelColor(selectedQuote.sentiment_analysis.interestLevel))}>
                            {selectedQuote.sentiment_analysis.interestLevel || 'N/A'}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Product Fit</p>
                          <Badge variant="secondary" className="capitalize">
                            {selectedQuote.sentiment_analysis.productFit || 'N/A'}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Price Sensitivity</p>
                          <Badge variant="outline" className="capitalize">
                            {selectedQuote.sentiment_analysis.pricingSensitivity || 'N/A'}
                          </Badge>
                        </div>
                      </div>
                      {selectedQuote.sentiment_analysis.recommendation && (
                        <div className="pt-3 border-t border-border/30">
                          <p className="text-sm font-medium text-primary mb-1">
                            AI Recommendation: {selectedQuote.sentiment_analysis.recommendation}
                          </p>
                          {selectedQuote.sentiment_analysis.rationale && (
                            <p className="text-xs text-muted-foreground">
                              {selectedQuote.sentiment_analysis.rationale}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Current Tech Stack */}
                {selectedQuote.current_tech_stack && selectedQuote.current_tech_stack.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3">Current Tech Stack</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedQuote.current_tech_stack.map((tech, i) => (
                        <Badge 
                          key={i} 
                          variant={tech.integrationNeed === 'replace' ? 'destructive' : 'secondary'}
                          className="flex items-center gap-1"
                        >
                          {tech.name}
                          {tech.category && (
                            <span className="text-[10px] opacity-70">({tech.category})</span>
                          )}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pricing */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Pricing
                  </h4>
                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {selectedQuote.setup_fee_final ? 'Setup Fee (Final)' : 'Setup Fee Range'}
                      </p>
                      <p className="font-medium">
                        {selectedQuote.setup_fee_final 
                          ? formatCurrency(selectedQuote.setup_fee_final)
                          : `${formatCurrency(selectedQuote.setup_fee_min)} - ${formatCurrency(selectedQuote.setup_fee_max)}`}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {selectedQuote.monthly_retainer_final ? 'Monthly Retainer (Final)' : 'Monthly Retainer Range'}
                      </p>
                      <p className="font-medium">
                        {selectedQuote.monthly_retainer_final
                          ? formatCurrency(selectedQuote.monthly_retainer_final)
                          : `${formatCurrency(selectedQuote.monthly_retainer_min)} - ${formatCurrency(selectedQuote.monthly_retainer_max)}`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Voice Agent */}
                {selectedQuote.voice_agent_plan && selectedQuote.voice_agent_plan !== 'none' ? (
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Voice Agent
                    </h4>
                    <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                      <div>
                        <p className="text-sm text-muted-foreground">Plan</p>
                        <p className="font-medium capitalize">{selectedQuote.voice_agent_plan}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Monthly</p>
                        <p className="font-medium">{formatCurrency(selectedQuote.voice_agent_monthly_cost)}/mo</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Setup</p>
                        <p className="font-medium">{formatCurrency(selectedQuote.voice_agent_setup_cost)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Workflows</p>
                        <p className="font-medium">{selectedQuote.voice_agent_workflow_count || 1}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Voice Agent
                    </h4>
                    <div className="p-4 bg-muted/50 rounded-lg text-center text-muted-foreground">
                      N/A
                    </div>
                  </div>
                )}

                {/* ROI */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    ROI Projections
                  </h4>
                  <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Conservative</p>
                      <p className="text-lg font-bold text-orange-600">
                        {selectedQuote.roi_conservative?.toFixed(0)}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {selectedQuote.payback_months_conservative} mo payback
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Likely</p>
                      <p className="text-lg font-bold text-blue-600">
                        {selectedQuote.roi_likely?.toFixed(0)}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {selectedQuote.payback_months_likely} mo payback
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Best Case</p>
                      <p className="text-lg font-bold text-green-600">
                        {selectedQuote.roi_best?.toFixed(0)}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {selectedQuote.payback_months_best} mo payback
                      </p>
                    </div>
                  </div>
                </div>

                {/* Workflows */}
                <div>
                  <h4 className="font-medium mb-3">Workflows</h4>
                  {Array.isArray(selectedQuote.workflows) && selectedQuote.workflows.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {(selectedQuote.workflows as any[]).map((workflow, i) => {
                        const label = typeof workflow === 'string'
                          ? workflow
                          : (workflow?.name || workflow?.id || 'Workflow');
                        return <Badge key={i} variant="secondary">{label}</Badge>;
                      })}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">N/A</p>
                  )}
                </div>

                {/* Challenges */}
                <div>
                  <h4 className="font-medium mb-3">Challenges</h4>
                  {selectedQuote.challenges && selectedQuote.challenges.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedQuote.challenges.map((challenge, i) => (
                        <Badge key={i} variant="outline">{challenge}</Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">N/A</p>
                  )}
                </div>

                {/* Notes */}
                {selectedQuote.notes && (
                  <div>
                    <h4 className="font-medium mb-3">Notes</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {selectedQuote.notes}
                    </p>
                  </div>
                )}

                {/* Transcript Summary */}
                {selectedQuote.transcript_summary && (
                  <div>
                    <h4 className="font-medium mb-3">Transcript Summary</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {selectedQuote.transcript_summary}
                    </p>
                  </div>
                )}

                {/* Full Meeting Transcript (Collapsible) */}
                {selectedQuote.meeting_transcript && (
                  <Collapsible open={isTranscriptOpen} onOpenChange={setIsTranscriptOpen}>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
                        <h4 className="font-medium flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          Full Meeting Transcript
                          <span className="text-xs text-muted-foreground font-normal">
                            ({selectedQuote.meeting_transcript.length.toLocaleString()} chars)
                          </span>
                        </h4>
                        {isTranscriptOpen ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-3">
                      <div className="p-4 bg-muted/50 rounded-lg max-h-64 overflow-y-auto">
                        <p className="text-xs text-muted-foreground whitespace-pre-wrap font-mono">
                          {selectedQuote.meeting_transcript}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2"
                        onClick={() => {
                          navigator.clipboard.writeText(selectedQuote.meeting_transcript || '');
                          toast.success('Transcript copied to clipboard');
                        }}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy Transcript
                      </Button>
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {/* Version History */}
                <QuoteVersionHistory quoteId={selectedQuote.id} />

                {/* Metadata */}
                <div className="pt-4 border-t text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Created by: {selectedQuote.created_by || 'Unknown'}</span>
                    <span>Created: {format(new Date(selectedQuote.created_at), 'MMM d, yyyy h:mm a')}</span>
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <QuoteEditModal
        quote={editingQuote}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onSave={fetchQuotes}
      />

      {/* Status Reversion Confirmation Dialog */}
      <AlertDialog open={!!pendingStatusChange} onOpenChange={() => setPendingStatusChange(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revert Signed Quote?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p className="mb-3">
                  This will clear the signature and reset the proposal for{' '}
                  <strong>{pendingStatusChange?.quote.company_name || 'this quote'}</strong>.
                </p>
                <ul className="text-sm space-y-1.5 list-disc list-inside text-muted-foreground">
                  <li>Signature data will be cleared</li>
                  <li>Handover request will be cancelled</li>
                  <li>Payment links will be invalidated</li>
                  <li>Client will need to re-sign</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-[44px]">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (pendingStatusChange) {
                  executeStatusChange(
                    pendingStatusChange.quoteId, 
                    pendingStatusChange.newStatus, 
                    pendingStatusChange.quote
                  );
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 min-h-[44px]"
            >
              Yes, Revert Quote
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Won Date Picker Dialog */}
      <Dialog open={!!pendingWonDate} onOpenChange={() => setPendingWonDate(null)}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-emerald-500" />
              When was this deal won?
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-2">
            <p className="text-sm text-muted-foreground text-center">
              Select the date <strong>{pendingWonDate?.quote.company_name || 'this quote'}</strong> was won/signed.
            </p>
            <CalendarWidget
              mode="single"
              selected={pendingWonDate?.selectedDate}
              onSelect={(date) => {
                if (pendingWonDate && date) {
                  setPendingWonDate({ ...pendingWonDate, selectedDate: date });
                }
              }}
              disabled={(date) => date > new Date()}
              initialFocus
              className="p-3 pointer-events-auto rounded-md border"
            />
            {pendingWonDate?.selectedDate && (
              <p className="text-sm font-medium">
                Selected: {format(pendingWonDate.selectedDate, 'dd.MM.yyyy')}
              </p>
            )}
            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                className="flex-1 min-h-[44px]"
                onClick={() => setPendingWonDate(null)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 min-h-[44px] bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={!pendingWonDate?.selectedDate}
                onClick={() => {
                  if (pendingWonDate?.selectedDate) {
                    executeStatusChange(
                      pendingWonDate.quoteId,
                      pendingWonDate.newStatus,
                      pendingWonDate.quote,
                      pendingWonDate.selectedDate.toISOString()
                    );
                    setPendingWonDate(null);
                  }
                }}
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Confirm
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}