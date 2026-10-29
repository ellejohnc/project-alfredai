import re

def fix_investor():
    with open('src/pages/admin/content/InvestorLeadsAdmin.tsx', 'r') as f:
        content = f.read()
    
    # 1. Fix Imports
    content = re.sub(r'import \{ useMemo \} from "react";\n', '', content)
    content = re.sub(r'import \{ LeadAdminToolbar \} from "@\/components\/admin\/leads\/LeadAdminToolbar";\n', '', content)
    content = re.sub(r'import \{ useLeadOverlayData \} from "@\/hooks\/useLeadOverlay";\n', '', content)
    content = re.sub(r'import \{ useSalesReps \} from "@\/hooks\/useSalesReps";\n', '', content)
    content = re.sub(r'import \{ ownerName \} from "@\/components\/admin\/leads\/leadOverlayUi";\n', '', content)
    content = re.sub(r'import \{ leadKey \} from "@\/lib\/unifiedLead";\n', '', content)
    content = re.sub(r'import \{ optionsFromData \} from "@\/lib\/leadSearch";\n', '', content)

    header_imports = """import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useRecordDeepLink } from '@/hooks/useRecordDeepLink';
import { LeadOverlaySection, LeadOverlayBadges } from '@/components/admin/leads/LeadOverlayWidgets';
import { LegacyLeadActions } from '@/components/admin/leads/LegacyLeadActions';
import { LeadList, LeadListHeader, LeadListRow } from '@/components/admin/leads/LeadListRow';
import { LeadsToolbar } from '@/components/admin/leads/LeadsToolbar';
import { LeadAdminToolbar } from "@/components/admin/leads/LeadAdminToolbar";
import { LeadMetricsStrip } from '@/components/admin/leads/LeadMetricsStrip';
import { LeadOverlayOwnerCell } from '@/components/admin/leads/LeadOverlayOwnerCell';
import { SourceBadge } from '@/components/admin/leads/SourceBadge';
import { leadStatusLabel, leadKey } from '@/lib/unifiedLead';
import { useLeadOverlayData } from "@/hooks/useLeadOverlay";
import { useSalesReps } from "@/hooks/useSalesReps";
import { ownerName } from "@/components/admin/leads/leadOverlayUi";
import { optionsFromData } from "@/lib/leadSearch";
"""
    content = re.sub(r'^import \{ useEffect.*?\n(import .*?\n)*', header_imports, content, flags=re.MULTILINE)

    # 2. Fix Component Body
    # Remove existing ownerFilter, salesReps, overlay, ownerNameFor if they exist
    content = re.sub(r'  const \{ data: overlay \} = useLeadOverlayData\(\);\n', '', content)
    content = re.sub(r'  const \{ data: salesReps = \[\] \} = useSalesReps\(\);\n', '', content)
    content = re.sub(r'  const \[ownerFilter, setOwnerFilter\] = useState<string>\("all"\);\n', '', content)
    content = re.sub(r'  const ownerNameFor = useMemo\(\(\) => \{.*?\}, \[overlay, salesReps\]\);\n', '', content, flags=re.DOTALL)
    
    setup_code = """  const { data: overlay } = useLeadOverlayData();
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
"""
    content = re.sub(r'  const \[searchQuery, setSearchQuery\] = useState\(\'\'\);', r"  const [searchQuery, setSearchQuery] = useState('');\n" + setup_code, content)

    # 3. Fix filterLeads pipeline
    content = re.sub(r'    // Filter by owner.*?    // Filter by role', '    // Filter by owner\n    if (ownerFilter !== "all") {\n      filtered = filtered.filter(lead => {\n        const name = ownerNameFor(lead.id);\n        if (ownerFilter === "__unassigned") return !name;\n        return name === ownerFilter;\n      });\n    }\n\n    // Filter by role', content, flags=re.DOTALL)

    # 4. Fix clearAllFilters
    content = re.sub(r'  const clearAllFilters = \(\) => \{.*?\}', r"""  const clearAllFilters = () => {
    setSearchQuery('');
    setFilterStatus('all');
    setFilterRole('all');
    setFilterVerification('all');
    setSortBy('date_desc');
    setOwnerFilter('all');
  }""", content, flags=re.DOTALL)

    # 5. Fix JSX
    # Remove old toolbar/header buttons and stray LeadAdminToolbar tags
    content = re.sub(r'<LeadAdminToolbar.*?/>', '', content, flags=re.DOTALL)
    content = re.sub(r'<Button onClick=\{exportToCSV\}.*?</Button>', '', content, flags=re.DOTALL)
    content = re.sub(r'<Button\s+onClick=\{fetchLeads\}.*?</Button>', '', content, flags=re.DOTALL)
    
    # Insert LeadAdminToolbar after the second LeadMetricsStrip
    admin_toolbar = """
      <LeadAdminToolbar
        actions={[
          {
            key: 'export',
            label: 'Export CSV',
            icon: <Download className="h-3.5 w-3.5" />,
            onClick: exportToCSV,
            allowed: canExportLeads,
          },
          {
            key: 'refresh',
            label: 'Refresh',
            icon: <RefreshCw className="h-3.5 w-3.5" />,
            onClick: fetchLeads,
            loading: isLoading,
          },
        ]}
      />
"""
    strips = list(re.finditer(r'</LeadMetricsStrip>', content))
    if len(strips) >= 2:
        idx = strips[1].end()
        content = content[:idx] + admin_toolbar + content[idx:]

    # Fix LeadsToolbar filters
    content = re.sub(r'filters=\{\[.*?\]\}', r"""filters={[
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
        ]}""", content, flags=re.DOTALL)
    
    # Fix actions in LeadsToolbar (should be empty as buttons are in LeadAdminToolbar)
    content = re.sub(r'actions=\{\s+<>\s+</>\s+\}', 'actions={null}', content)

    with open('src/pages/admin/content/InvestorLeadsAdmin.tsx', 'w') as f:
        f.write(content)

def fix_webinar():
    with open('src/pages/admin/content/WebinarLeadsAdmin.tsx', 'r') as f:
        content = f.read()
    
    # 1. Fix Imports
    content = re.sub(r'import \{ useMemo \} from "react";\n', '', content)
    content = re.sub(r'import \{ LeadAdminToolbar \} from "@\/components\/admin\/leads\/LeadAdminToolbar";\n', '', content)
    content = re.sub(r'import \{ useLeadOverlayData \} from "@\/hooks\/useLeadOverlay";\n', '', content)
    content = re.sub(r'import \{ useSalesReps \} from "@\/hooks\/useSalesReps";\n', '', content)
    content = re.sub(r'import \{ ownerName \} from "@\/components\/admin\/leads\/leadOverlayUi";\n', '', content)
    content = re.sub(r'import \{ leadKey \} from "@\/lib\/unifiedLead";\n', '', content)
    content = re.sub(r'import \{ optionsFromData \} from "@\/lib\/leadSearch";\n', '', content)

    header_imports = """import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useRecordDeepLink } from "@/hooks/useRecordDeepLink";
import { LeadOverlayBadges } from "@/components/admin/leads/LeadOverlayWidgets";
import { LegacyLeadActions } from "@/components/admin/leads/LegacyLeadActions";
import { SourceBadge } from "@/components/admin/leads/SourceBadge";
import { LeadMetricsStrip } from "@/components/admin/leads/LeadMetricsStrip";
import { LeadsToolbar } from "@/components/admin/leads/LeadsToolbar";
import { LeadAdminToolbar } from "@/components/admin/leads/LeadAdminToolbar";
import { LeadList, LeadListHeader, LeadListRow } from "@/components/admin/leads/LeadListRow";
import { LeadOverlayOwnerCell } from "@/components/admin/leads/LeadOverlayOwnerCell";
import { supabase } from "@/integrations/supabase/client";
import { usePermissions } from "@/hooks/usePermissions";
import { useLeadOverlayData } from "@/hooks/useLeadOverlay";
import { useSalesReps } from "@/hooks/useSalesReps";
import { ownerName } from "@/components/admin/leads/leadOverlayUi";
import { leadKey } from "@/lib/unifiedLead";
import { optionsFromData } from "@/lib/leadSearch";
"""
    content = re.sub(r'^import \{ useEffect.*?\n(import .*?\n)*', header_imports, content, flags=re.MULTILINE)

    # 2. Fix Component Body
    content = re.sub(r'  const \{ data: overlay \} = useLeadOverlayData\(\);\n', '', content)
    content = re.sub(r'  const \{ data: salesReps = \[\] \} = useSalesReps\(\);\n', '', content)
    content = re.sub(r'  const \[ownerFilter, setOwnerFilter\] = useState<string>\("all"\);\n', '', content)
    content = re.sub(r'  const ownerNameFor = useMemo\(\(\) => \{.*?\}, \[overlay, salesReps\]\);\n', '', content, flags=re.DOTALL)
    
    setup_code = """  const { data: overlay } = useLeadOverlayData();
  const { data: salesReps = [] } = useSalesReps();
  const [ownerFilter, setOwnerFilter] = useState<string>("all");

  const ownerNameFor = useMemo(() => {
    const byKey = new Map<string, string>();
    for (const a of overlay?.annotations ?? []) {
      if (a.lead_source !== "webinar_registrations" || !a.owner_id) continue;
      const name = ownerName(a.owner_id, salesReps);
      if (name) byKey.set(leadKey(a.lead_source, a.lead_id), name);
    }
    return (id: string) => byKey.get(leadKey("webinar_registrations", id)) ?? null;
  }, [overlay, salesReps]);
"""
    content = re.sub(r'  const \[searchQuery, setSearchQuery\] = useState\(""\);', r'  const [searchQuery, setSearchQuery] = useState("");\n' + setup_code, content)

    # 3. Fix filter logic
    content = re.sub(r'    if \(ownerFilter !== "all"\) \{.*?\}', '', content, flags=re.DOTALL)
    content = re.sub(r'    if \(!matchesSearch\) return false;', r'    if (!matchesSearch) return false;\n    if (ownerFilter !== "all") {\n      const name = ownerNameFor(lead.id);\n      if (ownerFilter === "__unassigned") {\n        if (name) return false;\n      } else if (name !== ownerFilter) {\n        return false;\n      }\n    }', content)

    # 4. Fix JSX
    content = re.sub(r'<LeadAdminToolbar.*?/>', '', content, flags=re.DOTALL)
    content = re.sub(r'<Button variant="outline" size="sm" onClick=\{handleRefresh\}.*?</Button>', '', content, flags=re.DOTALL)
    content = re.sub(r'<Button variant="outline" size="sm" className="h-8 text-xs" onClick=\{exportLeadsCSV\}>.*?</Button>', '', content, flags=re.DOTALL)
    
    admin_toolbar = """
      <LeadAdminToolbar
        actions={[
          {
            key: 'export',
            label: 'Export CSV',
            icon: <Download className="h-3.5 w-3.5" />,
            onClick: exportLeadsCSV,
            allowed: canExportLeads,
          },
          {
            key: 'refresh',
            label: 'Refresh',
            icon: <RefreshCw className="h-3.5 w-3.5" />,
            onClick: handleRefresh,
            loading: isRefreshing,
          },
        ]}
      />
"""
    content = re.sub(r'</LeadMetricsStrip>', r'</LeadMetricsStrip>' + admin_toolbar, content)

    # Fix LeadsToolbar filters
    content = re.sub(r'filters=\{\[.*?\]\}', r"""filters={[
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
            key: 'webinar',
            label: 'Webinar',
            value: webinarFilter,
            onChange: setWebinarFilter,
            width: 'w-[190px]',
            options: [
              { value: 'all', label: 'All webinars' },
              ...Array.from(new Set(leads.map(l => l.webinar_slug).filter(Boolean))).sort().map((slug) => ({ value: slug, label: slug })),
            ],
          },
          {
            key: 'date',
            label: 'Date',
            value: dateRange,
            onChange: setDateRange,
            width: 'w-[150px]',
            allValue: 'all',
            options: [
              { label: "All Time", value: "all" },
              { label: "Today", value: "today" },
              { label: "Last 7 Days", value: "7d" },
              { label: "Last 30 Days", value: "30d" },
            ],
          },
        ]}""", content, flags=re.DOTALL)

    # Fix onClearAll
    content = re.sub(r'onClearAll=\{\(\) => \{.*?\}\}', 'onClearAll={() => { setSearchQuery(""); setDateRange("all"); setWebinarFilter("all"); setOwnerFilter("all"); }}', content)

    # Fix Actions (Keep Add Lead)
    content = re.sub(r'actions=\{\s+<>\s+<Button.*?Add Lead.*?</Button>.*?<Button.*?Export.*?</Button>\s+</>\s+\}', r"""actions={
          <Button size="sm" className="h-8 text-xs" onClick={openCreateLead}>
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Lead
          </Button>
        }""", content, flags=re.DOTALL)

    # Fix AccessDenied logic if broken
    content = re.sub(r'if \(!canViewLeads, canExportLeads\)', 'if (!canViewLeads)', content)

    with open('src/pages/admin/content/WebinarLeadsAdmin.tsx', 'w') as f:
        f.write(content)

fix_investor()
fix_webinar()
