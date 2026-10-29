import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useRecordDeepLink } from '@/hooks/useRecordDeepLink';
import { LeadOverlaySection, LeadOverlayBadges } from '@/components/admin/leads/LeadOverlayWidgets';
import { LegacyLeadActions } from '@/components/admin/leads/LegacyLeadActions';
import { LeadList, LeadListHeader, LeadListRow } from '@/components/admin/leads/LeadListRow';
import { AdminToolbar } from '@/components/admin/AdminToolbar';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminActionsRow } from "@/components/admin/AdminActionsRow";
import { AdminMetricsStrip } from '@/components/admin/AdminMetricsStrip';
import { LeadOverlayOwnerCell } from '@/components/admin/leads/LeadOverlayOwnerCell';
import { SourceBadge } from '@/components/admin/leads/SourceBadge';
import { leadStatusLabel, leadKey } from '@/lib/unifiedLead';
import { useLeadOverlayData } from "@/hooks/useLeadOverlay";
import { useSalesReps } from "@/hooks/useSalesReps";
import { ownerName } from "@/components/admin/leads/ownerName";
import { optionsFromData } from "@/lib/leadSearch";

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  Loader2, 
  Briefcase, 
  Linkedin,
  CheckCircle2,
  Clock,
  Download,
  Phone,
  Globe,
  Shield,
  XCircle,
  RefreshCw,
  Copy,
  Send,
  Ban,
  Eye,
  Activity,
  Trash2,
  ExternalLink,
  TrendingUp,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { format } from 'date-fns';
import AccessDenied from '@/components/admin/AccessDenied';
import InvestorActivityDashboard from '@/components/admin/InvestorActivityDashboard';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatName, capitalizeText } from '@/lib/textFormatting';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { LeadPanelErrorState } from '@/components/admin/LeadPanelErrorState';

interface CodeUsageLog {
  id: string;
  access_code: string;
  is_master_code: boolean;
  ip_address: string | null;
  user_agent: string | null;
  accessed_at: string;
}

type InvestorStatus = 'pending_review' | 'approved' | 'rejected';

interface InvestorLead {
  id: string;
  full_name: string;
  email: string;
  firm_name: string;
  role: string;
  investment_focus: string | null;
  typical_check_size: string | null;
  interest_reason: string | null;
  linkedin_url: string | null;
  social_profile_url: string | null;
  phone_number: string | null;
  phone_verified: boolean | null;
  verification_method: string | null;
  session_token: string | null;
  verified_at: string | null;
  created_at: string;
  status: InvestorStatus;
  access_code: string | null;
  access_code_expires_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  admin_notes: string | null;
}

export default function InvestorLeadsAdmin() {
  const navigate = useNavigate();
  const { user } = useAdminAuth();
  const { canViewLeads, canExportLeads } = usePermissions();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [leads, setLeads] = useState<InvestorLead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<InvestorLead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { data: overlay } = useLeadOverlayData();
  const { data: salesReps = [] } = useSalesReps();
  const [ownerFilter, setOwnerFilter] = useState<string>("all");

  const ownerNameFor = useMemo(() => {
    const byKey = new Map<string, string>();
    for (const a of overlay?.annotations ?? []) {
      if (a.lead_source !== "investor_leads" || !a.owner_id) continue;
      const name = ownerName(a.owner_id, salesReps);
      if (name) byKey.set(leadKey(a.lead_source, a.lead_id), name);
    }
    return (id: string) => byKey.get(leadKey("investor_leads", id)) ?? null;
  }, [overlay, salesReps]);


  const [selectedLead, setSelectedLead] = useState<InvestorLead | null>(null);
  
  // Initialize filters from URL params
  const [filterRole, setFilterRole] = useState<string>(searchParams.get('role') || 'all');
  const [filterStatus, setFilterStatus] = useState<string>(searchParams.get('status') || 'all');
  const [filterVerification, setFilterVerification] = useState<string>(searchParams.get('verification') || 'all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'name_asc' | 'name_desc'>('date_desc');
  
  // Approval/Rejection state
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isResendingCode, setIsResendingCode] = useState(false);
  
  // Access code usage tracking
  const [usageLogs, setUsageLogs] = useState<CodeUsageLog[]>([]);
  const [isLoadingUsage, setIsLoadingUsage] = useState(false);
  
  // Activity dashboard state
  const [showActivityDashboard, setShowActivityDashboard] = useState(false);
  const [activityDashboardLead, setActivityDashboardLead] = useState<InvestorLead | null>(null);
  
  // Bulk approval/rejection state
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [isBulkApproving, setIsBulkApproving] = useState(false);
  const [isBulkRejecting, setIsBulkRejecting] = useState(false);
  const [showBulkRejectDialog, setShowBulkRejectDialog] = useState(false);
  const [bulkRejectionReason, setBulkRejectionReason] = useState('');
  
  // Delete state
  const [leadToDelete, setLeadToDelete] = useState<InvestorLead | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Deep-link: open a record's details when arriving with ?record=<id>
  useRecordDeepLink({
    records: leads,
    ready: !isLoading,
    getId: (l) => l.id,
    onOpen: (l) => setSelectedLead(l),
  });

  // Update URL when filters change (preserve deep-link record param until handled)
  useEffect(() => {
    const params = new URLSearchParams();
    const record = searchParams.get('record');
    if (record) params.set('record', record);
    if (filterStatus !== 'all') params.set('status', filterStatus);
    if (filterRole !== 'all') params.set('role', filterRole);
    if (filterVerification !== 'all') params.set('verification', filterVerification);
    setSearchParams(params, { replace: true });
  }, [filterStatus, filterRole, filterVerification, setSearchParams]);

  // Clear selections when filters change
  useEffect(() => {
    setSelectedLeadIds(new Set());
  }, [filterStatus, filterRole, filterVerification, searchQuery]);

  useEffect(() => {
    if (user) {
      fetchLeads();
      
      // Set up real-time subscription
      const channel = supabase
        .channel('investor-leads-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'investor_leads'
          },
          (payload) => {
            console.log('Investor leads change:', payload);
            
            if (payload.eventType === 'INSERT') {
              setLeads(prev => [payload.new as InvestorLead, ...prev]);
              toast.info(`New investor lead: ${(payload.new as InvestorLead).full_name}`);
            } else if (payload.eventType === 'UPDATE') {
              setLeads(prev => prev.map(lead => 
                lead.id === payload.new.id ? payload.new as InvestorLead : lead
              ));
            } else if (payload.eventType === 'DELETE') {
              setLeads(prev => prev.filter(lead => lead.id !== payload.old.id));
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  useEffect(() => {
    filterLeads();
  }, [leads, searchQuery, filterRole, filterStatus, filterVerification, sortBy, ownerFilter, ownerNameFor]);

  const fetchLeads = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('investor_leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to fetch investor leads');
      console.error(error);
      setLoadError(true);
    } else {
      setLeads(data || []);
      setLoadError(false);
    }
    setIsLoading(false);
  };

  const filterLeads = () => {
    let filtered = [...leads];

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(lead => lead.status === filterStatus);
    }

    // Filter by owner
    if (ownerFilter !== "all") {
      filtered = filtered.filter(lead => {
        const name = ownerNameFor(lead.id);
        if (ownerFilter === "__unassigned") return !name;
        return name === ownerFilter;
      });
    }

    // Filter by role
    if (filterRole !== 'all') {
      filtered = filtered.filter(lead => lead.role === filterRole);
    }

    // Filter by verification method
    if (filterVerification !== 'all') {
      switch (filterVerification) {
        case 'email':
          filtered = filtered.filter(lead => lead.verification_method === 'email' || lead.verified_at);
          break;
        case 'social':
          filtered = filtered.filter(lead => lead.social_profile_url);
          break;
        case 'phone':
          filtered = filtered.filter(lead => lead.phone_number && lead.phone_verified);
          break;
        case 'booking':
          filtered = filtered.filter(lead => lead.verification_method === 'booking');
          break;
        case 'unverified':
          filtered = filtered.filter(lead => !lead.verified_at && !lead.phone_verified && !lead.social_profile_url);
          break;
      }
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(lead =>
        lead.full_name?.toLowerCase().includes(query) ||
        lead.email?.toLowerCase().includes(query) ||
        lead.firm_name?.toLowerCase().includes(query) ||
        lead.role?.toLowerCase().includes(query) ||
        lead.investment_focus?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'date_asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'date_desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'name_asc':
          return a.full_name.localeCompare(b.full_name);
        case 'name_desc':
          return b.full_name.localeCompare(a.full_name);
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    setFilteredLeads(filtered);
  };

  const handleApprove = async (lead: InvestorLead) => {
    setIsApproving(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const response = await supabase.functions.invoke('approve-investor-access', {
        body: { investorId: lead.id },
        headers: {
          Authorization: `Bearer ${sessionData.session?.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to approve investor');
      }

      toast.success(`Approved ${lead.full_name} - access code sent to their email`);
      setSelectedLead(null);
      fetchLeads();
    } catch (error) {
      console.error('Error approving investor:', error);
      toast.error(error.message || 'Failed to approve investor');
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!selectedLead || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setIsRejecting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const response = await supabase.functions.invoke('reject-investor-access', {
        body: { 
          investorId: selectedLead.id,
          rejectionReason: rejectionReason.trim(),
        },
        headers: {
          Authorization: `Bearer ${sessionData.session?.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to reject investor');
      }

      toast.success(`Rejected ${selectedLead.full_name} - notification sent`);
      setShowRejectDialog(false);
      setRejectionReason('');
      setSelectedLead(null);
      fetchLeads();
    } catch (error) {
      console.error('Error rejecting investor:', error);
      toast.error(error.message || 'Failed to reject investor');
    } finally {
      setIsRejecting(false);
    }
  };

  const handleResendAccessCode = async (lead: InvestorLead) => {
    setIsResendingCode(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const response = await supabase.functions.invoke('approve-investor-access', {
        body: { investorId: lead.id, resend: true },
        headers: {
          Authorization: `Bearer ${sessionData.session?.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to resend access code');
      }

      toast.success(`Access code resent to ${lead.email}`);
      fetchLeads();
    } catch (error) {
      console.error('Error resending access code:', error);
      toast.error(error.message || 'Failed to resend access code');
    } finally {
      setIsResendingCode(false);
    }
  };

  const fetchUsageLogs = async (investorId: string) => {
    setIsLoadingUsage(true);
    try {
      const { data, error } = await supabase
        .from('investor_code_usage')
        .select('*')
        .eq('investor_id', investorId)
        .order('accessed_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching usage logs:', error);
        return;
      }
      setUsageLogs(data || []);
    } catch (error) {
      console.error('Error fetching usage logs:', error);
    } finally {
      setIsLoadingUsage(false);
    }
  };

  const copyAccessCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Access code copied to clipboard');
  };

  // Bulk approval functions
  const pendingLeads = filteredLeads.filter(l => l.status === 'pending_review');
  
  const toggleLeadSelection = (leadId: string) => {
    setSelectedLeadIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(leadId)) {
        newSet.delete(leadId);
      } else {
        newSet.add(leadId);
      }
      return newSet;
    });
  };

  const selectAllVisible = () => {
    if (selectedLeadIds.size === filteredLeads.length && filteredLeads.length > 0) {
      setSelectedLeadIds(new Set());
    } else {
      setSelectedLeadIds(new Set(filteredLeads.map(l => l.id)));
    }
  };

  // Delete handlers
  const handleDeleteLead = async () => {
    if (!leadToDelete) return;
    setIsDeleting(true);
    
    try {
      const { error } = await supabase
        .from('investor_leads')
        .delete()
        .eq('id', leadToDelete.id);
        
      if (error) throw error;
      
      toast.success(`Deleted ${leadToDelete.full_name}`);
      setShowDeleteDialog(false);
      setLeadToDelete(null);
      setSelectedLead(null);
      // Real-time subscription handles list update
    } catch (error) {
      console.error('Error deleting investor lead:', error);
      toast.error(error.message || 'Failed to delete investor lead');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedLeadIds.size === 0) return;
    setIsBulkDeleting(true);
    
    const toastId = toast.loading(`Deleting ${selectedLeadIds.size} lead(s)...`);
    
    let successCount = 0;
    let failCount = 0;
    
    // Parallel deletion for speed
    const results = await Promise.allSettled(
      [...selectedLeadIds].map(id => 
        supabase.from('investor_leads').delete().eq('id', id)
      )
    );
    
    results.forEach((result) => {
      if (result.status === 'fulfilled' && !result.value.error) {
        successCount++;
      } else {
        failCount++;
      }
    });
    
    // Show appropriate toast based on results
    if (failCount === 0) {
      toast.success(`Deleted ${successCount} lead(s)`, { id: toastId });
    } else if (successCount === 0) {
      toast.error(`Failed to delete leads`, { id: toastId });
    } else {
      toast.warning(`Deleted ${successCount}, failed ${failCount}`, { id: toastId });
    }
    
    setShowBulkDeleteDialog(false);
    setSelectedLeadIds(new Set());
    setIsBulkDeleting(false);
  };

  const bulkApproveInvestors = async () => {
    if (selectedLeadIds.size === 0) {
      toast.error('No pending investors selected');
      return;
    }

    setIsBulkApproving(true);
    let successCount = 0;
    let failCount = 0;

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      for (const leadId of selectedLeadIds) {
        try {
          const response = await supabase.functions.invoke('approve-investor-access', {
            body: { investorId: leadId },
            headers: {
              Authorization: `Bearer ${sessionData.session?.access_token}`,
            },
          });

          if (response.error) {
            failCount++;
          } else {
            successCount++;
          }
        } catch {
          failCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Approved ${successCount} investor${successCount > 1 ? 's' : ''}`);
      }
      if (failCount > 0) {
        toast.error(`Failed to approve ${failCount} investor${failCount > 1 ? 's' : ''}`);
      }

      setSelectedLeadIds(new Set());
      fetchLeads();
    } catch (error) {
      console.error('Bulk approval error:', error);
      toast.error('Bulk approval failed');
    } finally {
      setIsBulkApproving(false);
    }
  };

  const bulkRejectInvestors = async () => {
    if (selectedLeadIds.size === 0) {
      toast.error('No pending investors selected');
      return;
    }

    if (!bulkRejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setIsBulkRejecting(true);
    let successCount = 0;
    let failCount = 0;

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      for (const leadId of selectedLeadIds) {
        try {
          const response = await supabase.functions.invoke('reject-investor-access', {
            body: { 
              investorId: leadId,
              rejectionReason: bulkRejectionReason.trim(),
            },
            headers: {
              Authorization: `Bearer ${sessionData.session?.access_token}`,
            },
          });

          if (response.error) {
            failCount++;
          } else {
            successCount++;
          }
        } catch {
          failCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Rejected ${successCount} investor${successCount > 1 ? 's' : ''}`);
      }
      if (failCount > 0) {
        toast.error(`Failed to reject ${failCount} investor${failCount > 1 ? 's' : ''}`);
      }

      setSelectedLeadIds(new Set());
      setShowBulkRejectDialog(false);
      setBulkRejectionReason('');
      fetchLeads();
    } catch (error) {
      console.error('Bulk rejection error:', error);
      toast.error('Bulk rejection failed');
    } finally {
      setIsBulkRejecting(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      'Partner / GP': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      'Principal / Director': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      'Associate / Analyst': 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
      'Family Office Principal': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      'Angel Investor': 'bg-green-500/10 text-green-500 border-green-500/20',
      'Strategic / Corporate': 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    };
    return colors[role] || 'bg-muted text-muted-foreground';
  };

  const getStatusBadge = (status: InvestorStatus) => {
    switch (status) {
      case 'pending_review':
        return (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
            <Clock className="h-3 w-3 mr-1" />
            Pending Review
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return null;
    }
  };

  const getCheckSizeBadgeColor = (size: string | null) => {
    if (!size) return 'bg-muted text-muted-foreground';
    const colors: Record<string, string> = {
      '< $500K': 'bg-slate-500/10 text-slate-500 border-slate-500/20',
      '$500K - $2M': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      '$2M - $5M': 'bg-teal-500/10 text-teal-500 border-teal-500/20',
      '$5M - $10M': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      '$10M+': 'bg-green-500/10 text-green-500 border-green-500/20',
    };
    return colors[size] || 'bg-muted text-muted-foreground';
  };

  const uniqueRoles = [...new Set(leads.map(l => l.role))];

  const statusCounts = {
    pending: leads.filter(l => l.status === 'pending_review').length,
    approved: leads.filter(l => l.status === 'approved').length,
    rejected: leads.filter(l => l.status === 'rejected').length,
  };

  const verificationCounts = {
    email: leads.filter(l => l.verification_method === 'email' || l.verified_at).length,
    social: leads.filter(l => l.social_profile_url).length,
    phone: leads.filter(l => l.phone_number && l.phone_verified).length,
    booking: leads.filter(l => l.verification_method === 'booking').length,
    unverified: leads.filter(l => !l.verified_at && !l.phone_verified && !l.social_profile_url).length,
  };

  /** Tiles toggle: clicking an applied status clears it (the old Card behaviour). */
  const toggleStatus = (status: InvestorStatus) =>
    setFilterStatus(filterStatus === status ? 'all' : status);
  const toggleVerification = (method: string) =>
    setFilterVerification(filterVerification === method ? 'all' : method);
  const clearAllFilters = () => {
    setSearchQuery('');
    setFilterStatus('all');
    setFilterRole('all');
    setFilterVerification('all');
    setSortBy('date_desc');
  };

  const exportToCSV = () => {
    const headers = ['Full Name', 'Email', 'Firm', 'Role', 'Status', 'Investment Focus', 'Check Size', 'Interest', 'LinkedIn', 'Access Code', 'Submitted'];
    const rows = filteredLeads.map(lead => [
      lead.full_name,
      lead.email,
      lead.firm_name,
      lead.role,
      capitalizeText(lead.status),
      lead.investment_focus || '',
      lead.typical_check_size || '',
      lead.interest_reason || '',
      lead.linkedin_url || '',
      lead.access_code || '',
      format(new Date(lead.created_at), 'yyyy-MM-dd HH:mm')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `investor-leads-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Exported to CSV');
  };

  // Access control check
  if (!canViewLeads) {
    return <AccessDenied message="Only admins can view investor leads." requiredRole="Admin or Super Admin" />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {loadError && <LeadPanelErrorState panelName="Investor leads" />}
      <AdminPageHeader
        title="Investor Leads"
        icon={<TrendingUp className="h-5 w-5 text-primary" />}
        description={`${filteredLeads.length} ${filteredLeads.length === 1 ? 'investor' : 'investors'}${filterStatus !== 'all' ? ` (${filterStatus.replace('_', ' ')})` : ''}`}
      />

      {/*
        Status counts — the same four numbers the bespoke stat Cards showed, in
        the shared strip. Each tile still toggles filterStatus, so clicking an
        applied tile clears it, exactly as the Cards did.
      */}
      <AdminMetricsStrip
        metrics={[
          {
            value: leads.length,
            label: 'Total leads',
            onClick: clearAllFilters,
            active: filterStatus === 'all' && filterRole === 'all' && filterVerification === 'all',
          },
          {
            value: statusCounts.pending,
            label: 'Pending review',
            tone: 'warn',
            onClick: () => toggleStatus('pending_review'),
            active: filterStatus === 'pending_review',
          },
          {
            value: statusCounts.approved,
            label: 'Approved',
            tone: 'good',
            onClick: () => toggleStatus('approved'),
            active: filterStatus === 'approved',
          },
          {
            value: statusCounts.rejected,
            label: 'Rejected',
            onClick: () => toggleStatus('rejected'),
            active: filterStatus === 'rejected',
          },
        ]}
      />

      {/*
        Verification is a filter dimension, not a metric — the `verification`
        dropdown in the toolbar below covers those five buckets, so a second
        strip would only duplicate it and break the one-strip/four-tile shape.
      */}


      {/* The admin row, which this page imported and never rendered — so its
          export function was dead code and there was no Refresh at all. */}
      <AdminActionsRow
        actions={[
          {
            key: 'refresh',
            label: 'Refresh',
            icon: <RefreshCw className="h-3.5 w-3.5" />,
            onClick: () => fetchLeads(),
            loading: isLoading,
          },
          {
            key: 'export',
            label: 'Export CSV',
            icon: <Download className="h-3.5 w-3.5" />,
            onClick: exportToCSV,
            disabled: !filteredLeads.length,
            allowed: canExportLeads,
          },
        ]}
      />

      <AdminToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by name, email, firm…"
        resultCount={filteredLeads.length}
        resultNoun="investor"
        filters={[
          {
            key: 'owner',
            label: 'Owner',
            value: ownerFilter,
            onChange: setOwnerFilter,
            width: 'w-[160px]',
            options: [
              { value: 'all', label: 'All owners' },
              { value: '__unassigned', label: 'Unassigned' },
              ...optionsFromData(leads, (r) => ownerNameFor(r.id)),
            ],
          },
          {
            key: 'status',
            label: 'Status',
            options: [
              { value: 'all', label: `All statuses (${leads.length})` },
              { value: 'pending_review', label: `Pending review (${leads.filter(l => l.status === 'pending_review').length})` },
              { value: 'approved', label: `Approved (${leads.filter(l => l.status === 'approved').length})` },
              { value: 'rejected', label: `Rejected (${leads.filter(l => l.status === 'rejected').length})` },
            ],
            value: filterStatus,
            onChange: setFilterStatus,
            width: 'w-[170px]',
          },
          {
            key: 'role',
            label: 'Role',
            options: [
              { value: 'all', label: 'All roles' },
              ...Array.from(new Set(leads.map(l => l.role))).sort().map((role) => ({ value: role, label: role })),
            ],
            value: filterRole,
            onChange: setFilterRole,
            width: 'w-[160px]',
          },
          {
            key: 'verification',
            label: 'Verification',
            options: [
              { value: 'all', label: 'All verifications' },
              { value: 'email', label: 'Email' },
              { value: 'social', label: 'Social' },
              { value: 'phone', label: 'Phone' },
              { value: 'booking', label: 'Booking' },
              { value: 'unverified', label: 'Unverified' },
            ],
            value: filterVerification,
            onChange: setFilterVerification,
            width: 'w-[170px]',
          },
          {
            key: 'sort',
            label: 'Sort',
            options: [
              { value: 'date_desc', label: 'Newest first' },
              { value: 'date_asc', label: 'Oldest first' },
              { value: 'name_asc', label: 'Name A–Z' },
              { value: 'name_desc', label: 'Name Z–A' },
            ],
            value: sortBy,
            onChange: (v) => setSortBy(v as any),
            allValue: 'date_desc',
            width: 'w-[150px]',
          },
        ]}
        onClearAll={clearAllFilters}
        actions={
          <>
            {/* Only show reject/approve for pending leads */}
            {pendingLeads.length > 0 && [...selectedLeadIds].some(id => pendingLeads.find(l => l.id === id)) && (
              <>
                <Button
                  onClick={() => setShowBulkRejectDialog(true)}
                  disabled={isBulkRejecting || isBulkApproving || isBulkDeleting}
                  variant="outline"
                  className="gap-2 border-red-500/50 text-red-500 hover:bg-red-500/10"
                  size="sm"
                >
                  <XCircle className="h-4 w-4" />
                  Reject
                </Button>
                <Button
                  onClick={bulkApproveInvestors}
                  disabled={isBulkApproving || isBulkRejecting || isBulkDeleting}
                  className="gap-2"
                  size="sm"
                >
                  {isBulkApproving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Approve
                </Button>
              </>
            )}
          </>
        }
      />


      {/* Bulk Rejection Dialog */}
      <Dialog open={showBulkRejectDialog} onOpenChange={setShowBulkRejectDialog}>
        <DialogContent className="w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto overflow-x-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              Reject {selectedLeadIds.size} Investor{selectedLeadIds.size > 1 ? 's' : ''}
            </DialogTitle>
            <DialogDescription>
              This will send a rejection notification to all selected investors with the reason provided.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Rejection Reason (shared)</label>
              <Textarea
                placeholder="e.g., Investment criteria not aligned with current round..."
                value={bulkRejectionReason}
                onChange={(e) => setBulkRejectionReason(e.target.value)}
                className="mt-2"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowBulkRejectDialog(false);
                setBulkRejectionReason('');
              }}
              disabled={isBulkRejecting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={bulkRejectInvestors}
              disabled={isBulkRejecting || !bulkRejectionReason.trim()}
              className="gap-2"
            >
              {isBulkRejecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Ban className="h-4 w-4" />
              )}
              Reject {selectedLeadIds.size} Investor{selectedLeadIds.size > 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {filteredLeads.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No investor leads found</p>
            <p className="text-xs text-muted-foreground mt-2">
              Try <span className="font-medium">Clear filters</span> or check your Status/Role/Verification filters.
            </p>
          </CardContent>
        </Card>
      ) : (
        <LeadList>
          <LeadListHeader whenLabel="Received" selectable />
          {filteredLeads.map((lead) => (
            <LeadListRow
              key={lead.id}
              selectable
              selectSlot={
                <Checkbox
                  checked={selectedLeadIds.has(lead.id)}
                  onCheckedChange={() => toggleLeadSelection(lead.id)}
                  aria-label={`Select ${lead.full_name}`}
                />
              }
              onClick={() => navigate(`/admin/investor-leads/${lead.id}`)}
              className={cn(selectedLeadIds.has(lead.id) && 'bg-primary/5')}
              name={formatName(lead.full_name)}
              badgeSlot={<SourceBadge label="Investor" />}
              extraSlot={
                <>
                  <Badge variant="outline" className={getRoleBadgeColor(lead.role)}>
                    {lead.role}
                  </Badge>
                  {lead.typical_check_size && lead.typical_check_size !== 'Prefer not to say' && (
                    <Badge variant="outline" className={getCheckSizeBadgeColor(lead.typical_check_size)}>
                      {lead.typical_check_size}
                    </Badge>
                  )}
                  {/* Kept as hover chips rather than extra lines in the row —
                      the full text is still reachable, and the row stays one
                      contact line like every other surface. */}
                  {lead.interest_reason && (
                    <Badge variant="outline" className="text-[10px] font-normal" title={lead.interest_reason}>
                      Why they're interested
                    </Badge>
                  )}
                  {lead.admin_notes && (
                    <Badge
                      variant="outline"
                      className="text-[10px] font-normal border-[hsl(var(--status-atrisk)/0.4)] bg-[hsl(var(--status-atrisk-surface))] text-[hsl(var(--status-atrisk))]"
                      title={lead.admin_notes}
                    >
                      Admin note
                    </Badge>
                  )}
                  <LeadOverlayBadges source="investor_leads" id={lead.id} />
                </>
              }
              contactLine={
                <span className="flex flex-wrap items-center gap-x-2">
                  <span className="truncate">{lead.email}</span>
                  {lead.firm_name && (
                    <>
                      <span aria-hidden>·</span>
                      <span className="truncate">{formatName(lead.firm_name)}</span>
                    </>
                  )}
                  {lead.investment_focus && (
                    <>
                      <span aria-hidden>·</span>
                      <span className="truncate">{lead.investment_focus}</span>
                    </>
                  )}
                </span>
              }
              status={lead.status}
              statusLabel={leadStatusLabel({ source: 'investor_leads', status: lead.status })}
              ownerSlot={<LeadOverlayOwnerCell source="investor_leads" id={lead.id} />}
              whenSlot={
                <div className="flex flex-col gap-0.5">
                  <span>{format(new Date(lead.created_at), 'MMM d, yyyy')}</span>
                  <span className="flex items-center gap-1.5">
                    {lead.linkedin_url && (
                      <a
                        href={lead.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        title="LinkedIn"
                      >
                        <Linkedin className="h-3.5 w-3.5 text-blue-500" />
                      </a>
                    )}
                    {lead.social_profile_url && (
                      <a
                        href={lead.social_profile_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        title="Other profile"
                      >
                        <Globe className="h-3.5 w-3.5 text-purple-500" />
                      </a>
                    )}
                    {lead.phone_number && <Phone className="h-3.5 w-3.5 text-green-500" />}
                  </span>
                </div>
              }
              actionsSlot={
                <div className="flex items-center gap-0.5">
                  {lead.status === 'approved' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      title="Activity dashboard"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivityDashboardLead(lead);
                        setShowActivityDashboard(true);
                      }}
                    >
                      <Activity className="h-4 w-4" />
                    </Button>
                  )}
                  <LegacyLeadActions
                    source="investor_leads"
                    id={lead.id}
                    name={formatName(lead.full_name) || lead.email}
                    email={lead.email}
                    phone={lead.phone_number}
                    company={lead.firm_name}
                    status={lead.status}
                    createdAt={lead.created_at}
                  />
                </div>
              }
            />
          ))}
        </LeadList>
      )}




      {/* Rejection Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto overflow-x-hidden">
          <DialogHeader>
            <DialogTitle>Reject Investor Request</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting {selectedLead?.full_name}'s request. 
              This will be included in the notification email.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectionReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isRejecting || !rejectionReason.trim()}
            >
              {isRejecting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Activity Dashboard Dialog */}
      <Dialog open={showActivityDashboard} onOpenChange={setShowActivityDashboard}>
        <DialogContent className="w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Investor Activity Dashboard
            </DialogTitle>
          </DialogHeader>
          {activityDashboardLead && (
            <InvestorActivityDashboard
              investorId={activityDashboardLead.id}
              investorName={activityDashboardLead.full_name}
              investorEmail={activityDashboardLead.email}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Single Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Investor Lead</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Are you sure you want to permanently delete <strong>{leadToDelete?.full_name}</strong>?</p>
              <p className="text-destructive">This action cannot be undone. All related bookings and access logs will also be deleted.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteLead}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedLeadIds.size} Investor Lead{selectedLeadIds.size > 1 ? 's' : ''}</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Are you sure you want to permanently delete <strong>{selectedLeadIds.size}</strong> investor lead{selectedLeadIds.size > 1 ? 's' : ''}?</p>
              <p className="text-destructive">This action cannot be undone. All related bookings and access logs will also be deleted.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isBulkDeleting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete {selectedLeadIds.size}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
