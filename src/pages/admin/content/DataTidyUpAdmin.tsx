import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { format, differenceInDays } from 'date-fns';
import {
  Sparkles, AlertTriangle, UserX, MailX, Copy as CopyIcon, Archive, Clock,
  Loader2, Check, FileX, Eye, Wand2, Users,
} from 'lucide-react';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { DuplicateResolver, type DuplicateGroup, type DuplicateEntry } from '@/components/admin/DuplicateResolver';
import { TidyUpEditModal } from '@/components/admin/TidyUpEditModal';
import { SalesRepMergeModal, type RepVariantGroup } from '@/components/admin/SalesRepMergeModal';
import { standardSortOptions } from '@/components/admin';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminMetricsStrip } from '@/components/admin/AdminMetricsStrip';
import { AdminToolbar } from '@/components/admin/AdminToolbar';
import { AdminActionsRow } from '@/components/admin/AdminActionsRow';

// ─── Types ───────────────────────────────────────────────────────
interface EnrichmentSource {
  table: 'leads' | 'ghl_submissions';
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
}

interface TidyUpIssue {
  id: string;
  displayId: string;
  primaryLabel: string;
  secondaryLabel: string | null;
  email: string | null;
  assignee: string | null;
  createdAt: string;
  updatedAt: string | null;
  status: string | null;
  issues: string[];
  source: 'quote' | 'lead';
  dupGroupKey?: string;
  enrichment?: EnrichmentSource[];
  meta: {
    setupFee?: string | null;
    monthlyRetainer?: string | null;
    workflowCount?: number;
    phone?: string | null;
    leadType?: string | null;
    leadSource?: string | null;
    industry?: string | null;
  };
}

type IssueCategoryKey = 'empty_deal' | 'no_sales_rep' | 'no_contact' | 'no_company' | 'duplicate' | 'stale' | 'no_name' | 'no_email' | 'inconsistent_rep';

interface IssueCategory {
  key: IssueCategoryKey;
  label: string;
  description: string;
  icon: React.ReactNode;
  severity: 'warning' | 'info' | 'destructive';
  autoFixable: boolean;
  sources: ('quote' | 'lead')[];
}

const ISSUE_CATEGORIES: IssueCategory[] = [
  { key: 'empty_deal', label: 'Empty Deals', description: 'No company name, no fees, no workflows', icon: <FileX className="w-4 h-4" />, severity: 'destructive', autoFixable: true, sources: ['quote'] },
  { key: 'stale', label: 'Stale Entries', description: 'No updates in 90+ days', icon: <Clock className="w-4 h-4" />, severity: 'info', autoFixable: true, sources: ['quote', 'lead'] },
  { key: 'no_sales_rep', label: 'No Sales Rep', description: 'Missing assigned rep', icon: <UserX className="w-4 h-4" />, severity: 'warning', autoFixable: false, sources: ['quote'] },
  { key: 'no_contact', label: 'No Contact Info', description: 'Missing contact name or email', icon: <MailX className="w-4 h-4" />, severity: 'warning', autoFixable: true, sources: ['quote'] },
  { key: 'no_company', label: 'No Company', description: 'Company name is blank', icon: <AlertTriangle className="w-4 h-4" />, severity: 'warning', autoFixable: false, sources: ['quote', 'lead'] },
  { key: 'duplicate', label: 'Duplicates', description: 'Same email appears multiple times', icon: <CopyIcon className="w-4 h-4" />, severity: 'info', autoFixable: false, sources: ['quote', 'lead'] },
  { key: 'inconsistent_rep', label: 'Rep Variants', description: 'Same rep, different name spellings', icon: <Users className="w-4 h-4" />, severity: 'info', autoFixable: false, sources: ['quote'] },
  { key: 'no_name', label: 'No Name', description: 'Missing first or last name', icon: <UserX className="w-4 h-4" />, severity: 'warning', autoFixable: false, sources: ['lead'] },
  { key: 'no_email', label: 'No Email', description: 'Missing email address', icon: <MailX className="w-4 h-4" />, severity: 'destructive', autoFixable: false, sources: ['lead'] },
];

function formatFeeRange(min?: number | null, max?: number | null, final?: number | null): string | null {
  if (final) return `$${final.toLocaleString()}`;
  if (min && max) return `$${min.toLocaleString()} – $${max.toLocaleString()}`;
  if (min) return `$${min.toLocaleString()}+`;
  if (max) return `up to $${max.toLocaleString()}`;
  return null;
}

// ─── Quote scanner ───────────────────────────────────────────────
async function scanQuotes(): Promise<TidyUpIssue[]> {
  const { data, error } = await supabase
    .from('quotes')
    .select('id, quote_id, company_name, contact_name, contact_email, created_by, status, created_at, updated_at, setup_fee_min, setup_fee_max, setup_fee_final, monthly_retainer_min, monthly_retainer_max, monthly_retainer_final, workflows, industry')
    .not('status', 'eq', 'lost')
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!data) return [];

  const issueMap = new Map<string, TidyUpIssue>();

  const add = (row: typeof data[0], key: IssueCategoryKey, groupKey?: string, enrichment?: EnrichmentSource[]) => {
    const existing = issueMap.get(row.id);
    if (existing) {
      existing.issues.push(key);
      if (groupKey && !existing.dupGroupKey) existing.dupGroupKey = groupKey;
      if (enrichment?.length) existing.enrichment = [...(existing.enrichment || []), ...enrichment];
      return;
    }
    const wfCount = Array.isArray(row.workflows) ? (row.workflows as unknown[]).length : 0;
    issueMap.set(row.id, {
      id: row.id,
      displayId: row.quote_id || row.id.slice(0, 8),
      primaryLabel: row.company_name || '(No company)',
      secondaryLabel: row.contact_name,
      email: row.contact_email,
      assignee: row.created_by,
      createdAt: row.created_at || '',
      updatedAt: row.updated_at,
      status: row.status,
      issues: [key],
      source: 'quote',
      dupGroupKey: groupKey,
      enrichment,
      meta: {
        setupFee: formatFeeRange(row.setup_fee_min, row.setup_fee_max, row.setup_fee_final),
        monthlyRetainer: formatFeeRange(row.monthly_retainer_min, row.monthly_retainer_max, row.monthly_retainer_final),
        workflowCount: wfCount,
        industry: row.industry,
      },
    });
  };

  // Pre-fetch leads and GHL submissions for enrichment
  const [leadsRes, ghlRes] = await Promise.all([
    supabase.from('leads').select('id, first_name, last_name, email, phone, company').is('archived_at', null),
    supabase.from('ghl_submissions').select('id, lead_name, lead_first_name, lead_last_name, lead_email, lead_phone, lead_company').is('archived_at', null),
  ]);
  const allLeads = leadsRes.data || [];
  const allGhl = ghlRes.data || [];

  // Build lookup indices by email
  const leadsByEmail = new Map<string, typeof allLeads>();
  for (const l of allLeads) {
    if (l.email) { const k = l.email.toLowerCase().trim(); leadsByEmail.set(k, [...(leadsByEmail.get(k) || []), l]); }
  }
  const ghlByEmail = new Map<string, typeof allGhl>();
  for (const g of allGhl) {
    if (g.lead_email) { const k = g.lead_email.toLowerCase().trim(); ghlByEmail.set(k, [...(ghlByEmail.get(k) || []), g]); }
  }

  // Tokenize a string into significant words (3+ chars, lowercased)
  const STOP_WORDS = new Set(['pty', 'ltd', 'inc', 'the', 'and', 'for', 'llc', 'group', 'services', 'solutions', 'australia', 'pty ltd']);
  function tokenize(s: string): string[] {
    return s.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length >= 3 && !STOP_WORDS.has(w));
  }
  function wordOverlap(a: string, b: string): number {
    const tokA = tokenize(a);
    const tokB = new Set(tokenize(b));
    if (!tokA.length || !tokB.size) return 0;
    const matches = tokA.filter(w => tokB.has(w)).length;
    return matches / Math.min(tokA.length, tokB.size);
  }
  function firstNameMatch(quoteContact: string | null, otherName: string): boolean {
    if (!quoteContact) return false;
    const qFirst = quoteContact.trim().split(/\s+/)[0]?.toLowerCase();
    if (!qFirst || qFirst.length < 2) return false;
    const oFirst = otherName.trim().split(/\s+/)[0]?.toLowerCase();
    return qFirst === oFirst;
  }
  function lastNameMatch(quoteContact: string | null, otherName: string): boolean {
    if (!quoteContact) return false;
    const parts = quoteContact.trim().split(/\s+/);
    if (parts.length < 2) return false;
    const qLast = parts[parts.length - 1].toLowerCase();
    if (qLast.length < 3) return false;
    const oParts = otherName.trim().split(/\s+/);
    const oLast = oParts[oParts.length - 1]?.toLowerCase();
    return qLast === oLast;
  }
  // Extract a likely domain slug from company name (e.g., "Shamrock Joinery" → "shamrockjoinery")
  function companyToDomainSlug(company: string): string {
    return company.toLowerCase().replace(/[^a-z0-9]/g, '');
  }
  // Extract domain from email (e.g., "tony@shamrockjoinery.com.au" → "shamrockjoinery")
  function emailDomainSlug(email: string): string {
    const domain = email.split('@')[1] || '';
    // Strip TLD parts (.com, .au, .co, .com.au, etc.)
    return domain.replace(/\.(com|co|net|org|io|au|nz|uk|us|gov|edu|info)(\.[a-z]{2,3})?$/gi, '').replace(/[^a-z0-9]/g, '');
  }

  function findEnrichment(row: typeof data[0]): EnrichmentSource[] {
    const sources: EnrichmentSource[] = [];
    const seen = new Set<string>();
    const emailKey = row.contact_email?.toLowerCase().trim();
    const companyKey = row.company_name?.toLowerCase().trim();
    const nameKey = row.contact_name?.toLowerCase().trim();
    const companySlug = companyKey ? companyToDomainSlug(companyKey) : '';

    const addLead = (l: typeof allLeads[0]) => {
      const uid = `leads:${l.id}`;
      if (seen.has(uid)) return;
      seen.add(uid);
      const name = [l.first_name, l.last_name].filter(Boolean).join(' ');
      if (name || l.email || l.phone) {
        sources.push({ table: 'leads', id: l.id, name: name || undefined, email: l.email || undefined, phone: l.phone || undefined, company: l.company || undefined });
      }
    };
    const addGhl = (g: typeof allGhl[0]) => {
      const uid = `ghl:${g.id}`;
      if (seen.has(uid)) return;
      seen.add(uid);
      const name = g.lead_name || [g.lead_first_name, g.lead_last_name].filter(Boolean).join(' ');
      if (name || g.lead_email || g.lead_phone) {
        sources.push({ table: 'ghl_submissions', id: g.id, name: name || undefined, email: g.lead_email || undefined, phone: g.lead_phone || undefined, company: g.lead_company || undefined });
      }
    };

    // 1. Exact email match (highest confidence)
    if (emailKey) {
      (leadsByEmail.get(emailKey) || []).forEach(addLead);
      (ghlByEmail.get(emailKey) || []).forEach(addGhl);
    }

    // 2. Fuzzy matching against GHL submissions
    for (const g of allGhl) {
      if (seen.has(`ghl:${g.id}`)) continue;
      if (!g.lead_email) continue;

      const gName = g.lead_name || [g.lead_first_name, g.lead_last_name].filter(Boolean).join(' ');
      const gCompany = g.lead_company?.toLowerCase().trim();

      // Strategy A: Company word overlap + first name match
      const companyWordMatch = companyKey && gCompany && wordOverlap(companyKey, gCompany) >= 0.5;
      const fNameMatch = nameKey && gName && firstNameMatch(row.contact_name, gName);
      const lNameMatch = nameKey && gName && lastNameMatch(row.contact_name, gName);

      if (companyWordMatch && (fNameMatch || lNameMatch)) {
        addGhl(g); continue;
      }
      // Strategy B: Strong company match (100% word overlap)
      if (companyKey && gCompany && wordOverlap(companyKey, gCompany) >= 1.0) {
        addGhl(g); continue;
      }
      // Strategy C: Email domain matches company name slug (e.g., shamrockjoinery.com.au ↔ "Shamrock Joinery")
      if (companySlug && companySlug.length >= 5) {
        const gEmailSlug = emailDomainSlug(g.lead_email);
        if (gEmailSlug && gEmailSlug.length >= 5 && (companySlug.includes(gEmailSlug) || gEmailSlug.includes(companySlug))) {
          addGhl(g); continue;
        }
      }
      // Strategy D: Last name match (unique enough) + any company overlap
      if (lNameMatch && companyKey && gCompany && wordOverlap(companyKey, gCompany) >= 0.3) {
        addGhl(g); continue;
      }
    }

    // 3. Same strategies for leads
    for (const l of allLeads) {
      if (seen.has(`leads:${l.id}`)) continue;
      if (!l.email) continue;

      const lFullName = [l.first_name, l.last_name].filter(Boolean).join(' ');
      const lCompany = l.company?.toLowerCase().trim();

      const companyWordMatch = companyKey && lCompany && wordOverlap(companyKey, lCompany) >= 0.5;
      const fNameMatch = nameKey && lFullName && firstNameMatch(row.contact_name, lFullName);
      const lNameMatch2 = nameKey && lFullName && lastNameMatch(row.contact_name, lFullName);

      if (companyWordMatch && (fNameMatch || lNameMatch2)) {
        addLead(l); continue;
      }
      if (companyKey && lCompany && wordOverlap(companyKey, lCompany) >= 1.0) {
        addLead(l); continue;
      }
      // Email domain ↔ company slug
      if (companySlug && companySlug.length >= 5) {
        const lEmailSlug = emailDomainSlug(l.email);
        if (lEmailSlug && lEmailSlug.length >= 5 && (companySlug.includes(lEmailSlug) || lEmailSlug.includes(companySlug))) {
          addLead(l); continue;
        }
      }
      if (lNameMatch2 && companyKey && lCompany && wordOverlap(companyKey, lCompany) >= 0.3) {
        addLead(l); continue;
      }
    }

    return sources;
  }

  for (const row of data) {
    const hasFees = !!(row.setup_fee_min || row.setup_fee_max || row.setup_fee_final || row.monthly_retainer_min || row.monthly_retainer_max || row.monthly_retainer_final);
    const hasWorkflows = Array.isArray(row.workflows) && (row.workflows as unknown[]).length > 0;

    if (!row.company_name && !hasFees && !hasWorkflows) add(row, 'empty_deal');
    if (!row.created_by || row.created_by.trim() === '') add(row, 'no_sales_rep');
    if (!row.contact_name || !row.contact_email) {
      const enrichment = findEnrichment(row);
      add(row, 'no_contact', undefined, enrichment.length > 0 ? enrichment : undefined);
    }
    if (!row.company_name && (hasFees || hasWorkflows)) add(row, 'no_company');
    if (row.status === 'draft' || !row.status) {
      const lastTouch = row.updated_at || row.created_at;
      if (lastTouch && differenceInDays(new Date(), new Date(lastTouch)) >= 90) add(row, 'stale');
    }
  }

  // Duplicates
  const dupMap = new Map<string, typeof data>();
  for (const row of data) {
    if (row.company_name && row.contact_email) {
      const key = `${row.company_name.toLowerCase().trim()}|${row.contact_email.toLowerCase().trim()}`;
      const arr = dupMap.get(key) || [];
      arr.push(row);
      dupMap.set(key, arr);
    }
  }
  for (const [groupKey, group] of dupMap) {
    if (group.length > 1) group.forEach(r => add(r, 'duplicate', `q:${groupKey}`));
  }

  // ── Sales rep name fuzzy matching ──
  // Group by normalised rep name to find variants
  const repNorm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');
  const repMap = new Map<string, Map<string, string[]>>(); // normKey → Map<originalName, quoteIds>
  for (const row of data) {
    const rep = row.created_by?.trim();
    if (!rep) continue;
    const nk = repNorm(rep);
    if (nk.length < 3) continue;
    if (!repMap.has(nk)) repMap.set(nk, new Map());
    const variants = repMap.get(nk)!;
    if (!variants.has(rep)) variants.set(rep, []);
    variants.get(rep)!.push(row.id);
  }

  // Also fuzzy-merge keys that are within Levenshtein distance 2 or share a surname token
  const normKeys = Array.from(repMap.keys());
  const merged = new Map<string, Set<string>>(); // canonical normKey → set of normKeys in group
  const assigned = new Set<string>();

  function levenshtein(a: string, b: string): number {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    const matrix: number[][] = [];
    for (let i = 0; i <= a.length; i++) { matrix[i] = [i]; }
    for (let j = 0; j <= b.length; j++) { matrix[0][j] = j; }
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
      }
    }
    return matrix[a.length][b.length];
  }

  for (let i = 0; i < normKeys.length; i++) {
    if (assigned.has(normKeys[i])) continue;
    const group = new Set([normKeys[i]]);
    assigned.add(normKeys[i]);
    for (let j = i + 1; j < normKeys.length; j++) {
      if (assigned.has(normKeys[j])) continue;
      const dist = levenshtein(normKeys[i], normKeys[j]);
      const maxLen = Math.max(normKeys[i].length, normKeys[j].length);
      // Match if distance <= 2, or <= 20% of length for longer names
      if (dist <= 2 || (maxLen >= 8 && dist / maxLen <= 0.2)) {
        group.add(normKeys[j]);
        assigned.add(normKeys[j]);
      }
    }
    if (group.size > 0) merged.set(normKeys[i], group);
  }

  // Flag quotes that belong to variant groups with 2+ distinct spellings
  for (const [, nkGroup] of merged) {
    // Collect all variants across the merged norm keys
    const allVariants = new Map<string, string[]>();
    for (const nk of nkGroup) {
      const variants = repMap.get(nk);
      if (variants) {
        for (const [name, ids] of variants) {
          if (!allVariants.has(name)) allVariants.set(name, []);
          allVariants.get(name)!.push(...ids);
        }
      }
    }
    if (allVariants.size < 2) continue; // Only one spelling, no issue

    const groupKey = `rep:${Array.from(nkGroup).sort().join('|')}`;
    for (const [, ids] of allVariants) {
      for (const id of ids) {
        add(data.find(r => r.id === id)!, 'inconsistent_rep', groupKey);
      }
    }
  }

  return Array.from(issueMap.values());
}

// ─── Lead scanner ────────────────────────────────────────────────
async function scanLeads(): Promise<TidyUpIssue[]> {
  const { data, error } = await supabase
    .from('leads')
    .select('id, first_name, last_name, email, company, phone, lead_type, lead_source, created_at, archived_at')
    .is('archived_at', null)
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!data) return [];

  const issueMap = new Map<string, TidyUpIssue>();

  const add = (row: typeof data[0], key: IssueCategoryKey, groupKey?: string) => {
    const existing = issueMap.get(row.id);
    if (existing) {
      existing.issues.push(key);
      if (groupKey && !existing.dupGroupKey) existing.dupGroupKey = groupKey;
      return;
    }
    issueMap.set(row.id, {
      id: row.id,
      displayId: row.id.slice(0, 8),
      primaryLabel: [row.first_name, row.last_name].filter(Boolean).join(' ') || '(No name)',
      secondaryLabel: row.company,
      email: row.email,
      assignee: null,
      createdAt: row.created_at || '',
      updatedAt: null,
      status: row.lead_type || 'contact',
      issues: [key],
      source: 'lead',
      dupGroupKey: groupKey,
      meta: {
        phone: row.phone,
        leadType: row.lead_type,
        leadSource: row.lead_source,
      },
    });
  };

  for (const row of data) {
    if (!row.first_name && !row.last_name) add(row, 'no_name');
    if (!row.email) add(row, 'no_email');
    if (!row.company) add(row, 'no_company');
    if (row.created_at && differenceInDays(new Date(), new Date(row.created_at)) >= 90) {
      add(row, 'stale');
    }
  }

  // Duplicates by email
  const emailMap = new Map<string, typeof data>();
  for (const row of data) {
    if (row.email) {
      const key = row.email.toLowerCase().trim();
      const arr = emailMap.get(key) || [];
      arr.push(row);
      emailMap.set(key, arr);
    }
  }
  for (const [groupKey, group] of emailMap) {
    if (group.length > 1) group.forEach(r => add(r, 'duplicate', `l:${groupKey}`));
  }

  return Array.from(issueMap.values());
}

// ─── Main component ──────────────────────────────────────────────
export default function DataTidyUpAdmin() {
  const [activeTab, setActiveTab] = useState<'quote' | 'lead'>('quote');
  const [isScanning, setIsScanning] = useState(false);
  const [issues, setIssues] = useState<TidyUpIssue[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  // One issue at a time, chosen from a tile or the Issue filter. It used to be
  // a set of toggles that all started on, so clicking a tile HID that issue.
  const [issueFilter, setIssueFilter] = useState<'all' | IssueCategoryKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [sortValue, setSortValue] = useState('date_desc');
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ ids: string[]; label: string } | null>(null);
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set());
  const [resolvingGroup, setResolvingGroup] = useState<DuplicateGroup | null>(null);
  const [enrichingId, setEnrichingId] = useState<string | null>(null);
  const [editingIssue, setEditingIssue] = useState<TidyUpIssue | null>(null);
  const [mergingRepGroup, setMergingRepGroup] = useState<RepVariantGroup | null>(null);

  const runScan = useCallback(async (tab: 'quote' | 'lead') => {
    setIsScanning(true);
    setIssues([]);
    setSelectedIds(new Set());
    setCompletedActions(new Set());
    try {
      const results = tab === 'quote' ? await scanQuotes() : await scanLeads();
      setIssues(results);
      if (results.length === 0) toast.success('All clean! No data quality issues found.');
    } catch (err) {
      console.error('Scan failed:', err);
      toast.error('Failed to scan. Please try again or email support with a screenshot.');
    } finally {
      setIsScanning(false);
    }
  }, []);

  useEffect(() => { runScan(activeTab); }, [activeTab, runScan]);

  // Build duplicate groups for the resolver
  const duplicateGroups = useMemo(() => {
    const groups = new Map<string, DuplicateGroup>();
    for (const issue of issues) {
      if (completedActions.has(issue.id)) continue;
      if (!issue.dupGroupKey || !issue.issues.includes('duplicate')) continue;
      const existing = groups.get(issue.dupGroupKey);
      const entry: DuplicateEntry = {
        id: issue.id,
        displayId: issue.displayId,
        primaryLabel: issue.primaryLabel,
        secondaryLabel: issue.secondaryLabel,
        email: issue.email,
        assignee: issue.assignee,
        createdAt: issue.createdAt,
        updatedAt: issue.updatedAt,
        status: issue.status,
        source: issue.source,
        meta: issue.meta,
      };
      if (existing) {
        existing.entries.push(entry);
      } else {
        const matchLabel = issue.source === 'quote'
          ? `${issue.primaryLabel} · ${issue.email || 'unknown'}`
          : issue.email || issue.primaryLabel;
        groups.set(issue.dupGroupKey, {
          groupKey: issue.dupGroupKey,
          matchLabel,
          entries: [entry],
        });
      }
    }
    // Only keep groups with 2+ entries
    return Array.from(groups.values()).filter(g => g.entries.length > 1);
  }, [issues, completedActions]);

  // Build rep variant groups for the merge modal
  const repVariantGroups = useMemo(() => {
    const groups = new Map<string, RepVariantGroup>();
    for (const issue of issues) {
      if (completedActions.has(issue.id)) continue;
      if (!issue.dupGroupKey?.startsWith('rep:') || !issue.issues.includes('inconsistent_rep')) continue;
      const gk = issue.dupGroupKey;
      if (!groups.has(gk)) {
        groups.set(gk, { canonical: '', variants: [], totalQuotes: 0 });
      }
      const group = groups.get(gk)!;
      const repName = issue.assignee || '';
      const existing = group.variants.find(v => v.name === repName);
      if (existing) {
        existing.count++;
        existing.quoteIds.push(issue.id);
      } else {
        group.variants.push({ name: repName, count: 1, quoteIds: [issue.id] });
      }
      group.totalQuotes++;
    }
    // Set canonical to most common variant
    for (const g of groups.values()) {
      g.canonical = g.variants.reduce((a, b) => (b.count > a.count ? b : a)).name;
    }
    return Array.from(groups.values()).filter(g => g.variants.length > 1);
  }, [issues, completedActions]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as 'quote' | 'lead');
    setIssueFilter('all');
    setOwnerFilter('all');
  };

  const categoriesForTab = ISSUE_CATEGORIES.filter(c => c.sources.includes(activeTab));
  const owners = useMemo(
    () => Array.from(new Set(issues.map(i => i.assignee).filter((a): a is string => !!a))).sort(),
    [issues],
  );
  const q = searchQuery.trim().toLowerCase();
  const filteredIssues = issues.filter(i => {
    if (completedActions.has(i.id)) return false;
    if (issueFilter !== 'all' && !i.issues.includes(issueFilter)) return false;
    if (ownerFilter === 'none' && i.assignee) return false;
    if (ownerFilter !== 'all' && ownerFilter !== 'none' && i.assignee !== ownerFilter) return false;
    if (q && ![i.displayId, i.primaryLabel, i.secondaryLabel, i.email, i.assignee].some(v => v?.toLowerCase().includes(q))) return false;
    return true;
  }).sort((a, b) => {
    if (sortValue === 'name_asc') return a.primaryLabel.localeCompare(b.primaryLabel);
    if (sortValue === 'name_desc') return b.primaryLabel.localeCompare(a.primaryLabel);
    const d = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    return sortValue === 'date_asc' ? d : -d;
  });

  const categoryCounts = categoriesForTab.map(cat => ({
    ...cat,
    count: issues.filter(i => !completedActions.has(i.id) && i.issues.includes(cat.key)).length,
  }));

  const totalActive = issues.filter(i => !completedActions.has(i.id)).length;

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => { const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n; });
  };

  const toggleSelectAll = () => {
    const all = filteredIssues.map(i => i.id);
    const allSel = all.every(id => selectedIds.has(id));
    setSelectedIds(prev => {
      const n = new Set(prev);
      all.forEach(id => allSel ? n.delete(id) : n.add(id));
      return n;
    });
  };

  const handleArchiveSelected = () => {
    const ids = filteredIssues.filter(i => selectedIds.has(i.id)).map(i => i.id);
    if (!ids.length) { toast.error('Nothing selected'); return; }
    setConfirmAction({ ids, label: `Archive ${ids.length} ${activeTab === 'quote' ? 'quote' : 'lead'}${ids.length !== 1 ? 's' : ''}` });
  };

  const handleAutoFix = async () => {
    const archiveIds = new Set<string>();
    const enrichItems: { issue: TidyUpIssue; source: EnrichmentSource }[] = [];

    for (const issue of issues) {
      if (completedActions.has(issue.id)) continue;
      const autoFixableKeys = issue.issues.filter(key => ISSUE_CATEGORIES.find(c => c.key === key)?.autoFixable);
      if (!autoFixableKeys.length) continue;

      // If it has no_contact AND enrichment sources, enrich instead of archive
      if (autoFixableKeys.includes('no_contact') && issue.enrichment?.length) {
        // Pick best enrichment source (prefer one with email)
        const best = issue.enrichment.find(s => s.email) || issue.enrichment[0];
        enrichItems.push({ issue, source: best });
      }
      
      // Archive empty deals & stale entries
      if (autoFixableKeys.some(k => k === 'empty_deal' || k === 'stale')) {
        archiveIds.add(issue.id);
      }
    }

    if (!archiveIds.size && !enrichItems.length) { toast.info('Nothing to auto-fix'); return; }

    // Enrich contacts first (no confirmation needed - it's additive, not destructive)
    if (enrichItems.length) {
      setIsProcessing(true);
      let enrichedCount = 0;
      for (const { issue, source } of enrichItems) {
        try {
          const updateData: Record<string, unknown> = {};
          if (!issue.secondaryLabel && source.name) updateData.contact_name = source.name;
          if (!issue.email && source.email) updateData.contact_email = source.email;
          if (source.company && issue.primaryLabel === '(No company)') updateData.company_name = source.company;
          updateData.updated_at = new Date().toISOString();

          if (Object.keys(updateData).length <= 1) continue;

          const { error } = await supabase.from('quotes').update(updateData).eq('id', issue.id);
          if (!error) {
            setCompletedActions(prev => { const n = new Set(prev); n.add(issue.id); return n; });
            enrichedCount++;
          }
        } catch { /* continue with next */ }
      }
      setIsProcessing(false);
      if (enrichedCount > 0) toast.success(`Enriched ${enrichedCount} quote(s) with contact info from GHL/Leads`);
    }

    // Then confirm archiving if needed
    if (archiveIds.size) {
      setConfirmAction({ ids: Array.from(archiveIds), label: `Auto-archive ${archiveIds.size} empty/stale entries` });
    }
  };

  const executeArchive = async (ids: string[]) => {
    setIsProcessing(true);
    try {
      if (activeTab === 'quote') {
        const { error } = await supabase.from('quotes').update({
          status: 'lost', outcome: 'Archived via Data Tidy-Up', updated_at: new Date().toISOString(),
        }).in('id', ids);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('leads').update({
          archived_at: new Date().toISOString(),
        } as any).in('id', ids);
        if (error) throw error;
      }

      setCompletedActions(prev => { const n = new Set(prev); ids.forEach(id => n.add(id)); return n; });
      setSelectedIds(prev => { const n = new Set(prev); ids.forEach(id => n.delete(id)); return n; });
      toast.success(`Archived ${ids.length} ${activeTab}(s)`);
    } catch (err) {
      console.error('Archive failed:', err);
      toast.error('Failed to archive. Please try again.');
    } finally {
      setIsProcessing(false);
      setConfirmAction(null);
    }
  };

  const handleDuplicateResolve = async (keepId: string, archiveIds: string[]) => {
    await executeArchive(archiveIds);
    setResolvingGroup(null);
  };

  const handleEnrich = async (issue: TidyUpIssue, source: EnrichmentSource) => {
    setEnrichingId(issue.id);
    try {
      const updateData: Record<string, unknown> = {};
      if (!issue.secondaryLabel && source.name) updateData.contact_name = source.name;
      if (!issue.email && source.email) updateData.contact_email = source.email;
      if (source.company && issue.primaryLabel === '(No company)') updateData.company_name = source.company;
      updateData.updated_at = new Date().toISOString();

      if (Object.keys(updateData).length <= 1) {
        toast.info('No new data to enrich from this source.');
        return;
      }

      const { error } = await supabase.from('quotes').update(updateData).eq('id', issue.id);
      if (error) throw error;

      setCompletedActions(prev => { const n = new Set(prev); n.add(issue.id); return n; });
      const enriched = Object.keys(updateData).filter(k => k !== 'updated_at').join(', ');
      toast.success(`Enriched ${enriched} from ${source.table === 'leads' ? 'Leads' : 'GHL'}`);
    } catch (err) {
      console.error('Enrich failed:', err);
      toast.error('Failed to enrich. Please try again.');
    } finally {
      setEnrichingId(null);
    }
  };

  const openDuplicateGroup = (groupKey: string) => {
    const group = duplicateGroups.find(g => g.groupKey === groupKey);
    if (group) setResolvingGroup(group);
  };

  const toggleFilter = (key: IssueCategoryKey) => {
    setIssueFilter(prev => (prev === key ? 'all' : key));
  };

  const selectedCount = filteredIssues.filter(i => selectedIds.has(i.id)).length;
  const allSelected = filteredIssues.length > 0 && filteredIssues.every(i => selectedIds.has(i.id));


  return (
    <div className="space-y-4 md:space-y-6">
      {/* Band 1 — title. */}
      <AdminPageHeader
        title="Data Tidy-Up"
        description="Scan and clean your data: missing info, duplicates and stale entries."
        icon={<Sparkles className="h-4 w-4" />}
        onRefresh={() => runScan(activeTab)}
        isLoading={isScanning}
      />

      {/* Band 2 — tiles. Each one shows only that issue; click it again for all. */}
      <AdminMetricsStrip
        metrics={[
          { label: 'All issues', value: isScanning ? '—' : totalActive, active: issueFilter === 'all', onClick: () => setIssueFilter('all') },
          ...categoryCounts.map(cat => ({
            label: cat.label,
            value: isScanning ? '—' : cat.count,
            tone: (cat.count > 0 && cat.severity !== 'info' ? 'warn' : 'default') as 'warn' | 'default',
            active: issueFilter === cat.key,
            onClick: () => toggleFilter(cat.key),
          })),
        ]}
      />

      {/* Admin tools — role-gated by the row itself. */}
      <AdminActionsRow
        actions={[
          { key: 'autofix', label: 'Auto-fix', icon: <Sparkles className="h-3.5 w-3.5" />, onClick: handleAutoFix, loading: isProcessing, disabled: totalActive === 0 },
        ]}
      />

      {/* Band 3 — the shared toolbar: Search · Sort · Issue (this page's status)
          · Owner, then Records, which used to be the Quotes / Leads tabs. */}
      <AdminToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={activeTab === 'quote' ? 'Search by quote ID, company, contact, email...' : 'Search by name, company, email...'}
        resultCount={filteredIssues.length}
        resultNoun={`${activeTab}s with issues`}
        filters={[
          { key: 'sort', label: 'Sort', options: standardSortOptions, value: sortValue, onChange: setSortValue, allValue: 'date_desc' },
          {
            key: 'issue',
            label: 'Issue',
            value: issueFilter,
            onChange: (v) => setIssueFilter(v as 'all' | IssueCategoryKey),
            options: [
              { value: 'all', label: 'All issues' },
              ...categoryCounts.map(cat => ({ value: cat.key, label: `${cat.label} (${cat.count})` })),
            ],
          },
          {
            key: 'owner',
            label: 'Owner',
            value: ownerFilter,
            onChange: setOwnerFilter,
            options: [
              { value: 'all', label: 'All owners' },
              { value: 'none', label: 'No owner' },
              ...owners.map(o => ({ value: o, label: o })),
            ],
          },
          {
            key: 'records',
            label: 'Records',
            value: activeTab,
            onChange: handleTabChange,
            allValue: 'quote',
            options: [
              { value: 'quote', label: 'Quotes' },
              { value: 'lead', label: 'Leads' },
            ],
          },
        ]}
        onClearAll={() => {
          setSearchQuery('');
          setIssueFilter('all');
          setOwnerFilter('all');
          setSortValue('date_desc');
        }}
      />

          {/* Duplicate groups summary */}
          {duplicateGroups.length > 0 && (issueFilter === 'all' || issueFilter === 'duplicate') && (
            <Card className="border-blue-500/20 bg-blue-500/5">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CopyIcon className="h-4 w-4 text-blue-500" />
                  {duplicateGroups.length} duplicate group{duplicateGroups.length !== 1 ? 's' : ''} found
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3 pt-0">
                <div className="flex flex-wrap gap-2">
                  {duplicateGroups.map(group => (
                    <Button
                      key={group.groupKey}
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs min-h-[44px]"
                      onClick={() => setResolvingGroup(group)}
                    >
                      <Eye className="h-3 w-3" />
                      {group.matchLabel.length > 35
                        ? group.matchLabel.slice(0, 35) + '…'
                        : group.matchLabel}
                      <Badge variant="secondary" className="text-[10px] ml-1">{group.entries.length}</Badge>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Rep variant groups summary */}
          {repVariantGroups.length > 0 && (issueFilter === 'all' || issueFilter === 'inconsistent_rep') && activeTab === 'quote' && (
            <Card className="border-amber-500/20 bg-amber-500/5">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  {repVariantGroups.length} sales rep name group{repVariantGroups.length !== 1 ? 's' : ''} to merge
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3 pt-0">
                <div className="flex flex-wrap gap-2">
                  {repVariantGroups.map((group, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs min-h-[44px] border-amber-500/30 hover:bg-amber-500/10"
                      onClick={() => setMergingRepGroup(group)}
                    >
                      <Users className="h-3 w-3 text-amber-600" />
                      {group.variants.map(v => v.name).join(' / ').slice(0, 40)}
                      {group.variants.map(v => v.name).join(' / ').length > 40 ? '…' : ''}
                      <Badge variant="secondary" className="text-[10px] ml-1">{group.totalQuotes}</Badge>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Bulk action bar */}
          {selectedCount > 0 && (
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-muted/50 border border-border">
              <span className="text-sm font-medium">{selectedCount} selected</span>
              <div className="flex gap-2 ml-auto">
                <Button size="sm" variant="outline" onClick={() => setSelectedIds(new Set())} className="min-h-[44px]">
                  Clear
                </Button>
                <Button size="sm" variant="destructive" onClick={handleArchiveSelected} disabled={isProcessing} className="gap-1.5 min-h-[44px]">
                  <Archive className="h-3.5 w-3.5" />
                  Archive ({selectedCount})
                </Button>
              </div>
            </div>
          )}

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              {isScanning ? (
                <div className="p-8 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-primary" />
                  <p className="text-sm text-muted-foreground">Analyzing {activeTab}s...</p>
                </div>
              ) : filteredIssues.length === 0 ? (
                <div className="p-12 text-center">
                  <Check className="w-10 h-10 text-green-500 mx-auto mb-3" />
                  <p className="text-sm font-medium">All clean!</p>
                  <p className="text-xs text-muted-foreground mt-1">No issues match these filters.</p>
                </div>
              ) : (
                <div className="overflow-x-auto [touch-action:pan-x]">
                  <Table className="min-w-[980px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">
                          <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} />
                        </TableHead>
                        <TableHead className="min-w-[100px]">ID</TableHead>
                        <TableHead className="min-w-[160px]">{activeTab === 'quote' ? 'Company' : 'Name'}</TableHead>
                        <TableHead className="min-w-[140px] hidden md:table-cell">{activeTab === 'quote' ? 'Contact' : 'Company'}</TableHead>
                        <TableHead className="min-w-[160px] hidden md:table-cell">Email</TableHead>
                        <TableHead className="min-w-[90px]">Status</TableHead>
                        <TableHead className="min-w-[100px] hidden lg:table-cell">Sales Rep</TableHead>
                        <TableHead className="min-w-[90px] hidden md:table-cell">Created</TableHead>
                        <TableHead className="min-w-[160px]">Issues</TableHead>
                        <TableHead className="w-20"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredIssues.map(issue => (
                        <TableRow
                          key={issue.id}
                          className={cn(
                            "cursor-pointer hover:bg-accent/50 transition-colors",
                            selectedIds.has(issue.id) && "bg-primary/5"
                          )}
                          onClick={(e) => {
                            // Don't open modal if clicking checkbox or action buttons
                            const target = e.target as HTMLElement;
                            if (target.closest('button') || target.closest('[role="checkbox"]') || target.closest('[data-radix-collection-item]')) return;
                            setEditingIssue(issue);
                          }}
                        >
                          <TableCell>
                            <Checkbox checked={selectedIds.has(issue.id)} onCheckedChange={() => toggleSelect(issue.id)} />
                          </TableCell>
                          <TableCell className="font-mono text-xs">{issue.displayId}</TableCell>
                          <TableCell>
                            <span className={cn("text-sm", issue.primaryLabel.startsWith('(') && "text-muted-foreground italic")}>
                              {issue.primaryLabel}
                            </span>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <span className={cn("text-sm", !issue.secondaryLabel && "text-muted-foreground italic")}>
                              {issue.secondaryLabel || '—'}
                            </span>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <span className={cn("text-xs truncate max-w-[160px] block", !issue.email && "text-muted-foreground italic")}>
                              {issue.email || '—'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px]">{issue.status || 'draft'}</Badge>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <span className={cn("text-xs", !issue.assignee && "text-muted-foreground italic")}>
                              {issue.assignee || '—'}
                            </span>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                            {issue.createdAt ? format(new Date(issue.createdAt), 'MMM d, yyyy') : '—'}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {issue.issues.map(issueKey => {
                                const cat = ISSUE_CATEGORIES.find(c => c.key === issueKey);
                                if (!cat) return null;
                                return (
                                  <Badge key={issueKey} variant={cat.severity === 'destructive' ? 'destructive' : 'secondary'} className="text-[9px] md:text-[10px] px-1.5 gap-1">
                                    {cat.icon}
                                    <span className="hidden sm:inline">{cat.label}</span>
                                  </Badge>
                                );
                              })}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {issue.dupGroupKey && issue.issues.includes('duplicate') && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  title="Resolve duplicates"
                                  onClick={() => openDuplicateGroup(issue.dupGroupKey!)}
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              {issue.enrichment && issue.enrichment.length > 0 && issue.issues.includes('no_contact') && (
                                <TooltipProvider>
                                  <DropdownMenu>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <DropdownMenuTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-emerald-600 dark:text-emerald-400"
                                            disabled={enrichingId === issue.id}
                                          >
                                            {enrichingId === issue.id
                                              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                              : <Wand2 className="h-3.5 w-3.5" />}
                                          </Button>
                                        </DropdownMenuTrigger>
                                      </TooltipTrigger>
                                      <TooltipContent side="left">
                                        <p className="text-xs">Enrich from {issue.enrichment.length} source{issue.enrichment.length !== 1 ? 's' : ''}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                    <DropdownMenuContent align="end" className="w-72">
                                      <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b">
                                        Enrich contact from:
                                      </div>
                                      {issue.enrichment.map((src, idx) => (
                                        <button
                                          key={`${src.table}-${src.id}-${idx}`}
                                          className="w-full text-left px-3 py-2.5 hover:bg-accent transition-colors text-sm min-h-[44px] flex flex-col gap-0.5"
                                          onClick={() => handleEnrich(issue, src)}
                                        >
                                          <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="text-[9px] shrink-0">
                                              {src.table === 'leads' ? 'Lead' : 'GHL'}
                                            </Badge>
                                            <span className="font-medium truncate">{src.name || '(no name)'}</span>
                                          </div>
                                          <div className="text-xs text-muted-foreground pl-[3.25rem] space-y-0.5">
                                            {src.email && <div>✉ {src.email}</div>}
                                            {src.phone && <div>☎ {src.phone}</div>}
                                            {src.company && <div>🏢 {src.company}</div>}
                                          </div>
                                        </button>
                                      ))}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TooltipProvider>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Completed summary */}
          {completedActions.size > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground px-1">
              <Check className="w-4 h-4 text-green-500" />
              {completedActions.size} {activeTab}{completedActions.size !== 1 ? 's' : ''} tidied up this session.
            </div>
          )}

      {/* Confirmation Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Action</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.label}? {activeTab === 'quote'
                ? 'This will set their status to "lost" with an archive note.'
                : 'This will archive the selected leads.'}
              {' '}This action can be reversed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing} className="min-h-[44px]">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmAction && executeArchive(confirmAction.ids)}
              disabled={isProcessing}
              className="gap-1 min-h-[44px]"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />}
              {isProcessing ? 'Processing...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Duplicate Resolver */}
      <DuplicateResolver
        group={resolvingGroup}
        onClose={() => setResolvingGroup(null)}
        onResolve={handleDuplicateResolve}
        onArchiveAll={async (ids) => {
          await executeArchive(ids);
          setResolvingGroup(null);
        }}
        isProcessing={isProcessing}
      />

      {/* Edit Modal */}
      <TidyUpEditModal
        issue={editingIssue}
        onClose={() => setEditingIssue(null)}
        onSaved={(id) => {
          setCompletedActions(prev => { const n = new Set(prev); n.add(id); return n; });
        }}
      />

      {/* Sales Rep Merge Modal */}
      <SalesRepMergeModal
        group={mergingRepGroup}
        onClose={() => setMergingRepGroup(null)}
        onMerged={(mergedIds) => {
          setCompletedActions(prev => {
            const n = new Set(prev);
            mergedIds.forEach(id => n.add(id));
            return n;
          });
          setMergingRepGroup(null);
        }}
      />
    </div>
  );
}
