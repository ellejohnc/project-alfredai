import sys
import re

def patch_file(path, patches):
    with open(path, 'r') as f:
        content = f.read()
    for pattern, replacement in patches:
        # Use a more literal approach for common strings to avoid regex escaping hell
        if isinstance(pattern, str) and pattern not in content and '?' not in pattern and '*' not in pattern:
             print(f"Warning: pattern not found in {path}: {pattern[:50]}...")
        content = re.sub(pattern, replacement, content, flags=re.MULTILINE)
    with open(path, 'w') as f:
        f.write(content)

# AlphaDigitalLeadsAdmin.tsx
alpha_patches = [
    (r'import { LeadMetricsStrip, LeadAdminToolbar } from "@/components/admin/leads/LeadMetricsStrip";',
     r'import { LeadMetricsStrip } from "@/components/admin/leads/LeadMetricsStrip";\nimport { LeadAdminToolbar } from "@/components/admin/leads/LeadAdminToolbar";'),
    (r'import { LeadOverlayOwnerCell, LeadOverlayOutcome } from "@/components/admin/leads/LeadOverlayOwnerCell";',
     r'import { LeadOverlayOwnerCell, LeadOverlayOutcome } from "@/components/admin/leads/LeadOverlayOwnerCell";\nimport { ownerName } from "@/components/admin/leads/leadOverlayUi";'),
    (r'import { leadKey, leadStatusLabel } from \'@/lib/unifiedLead\';',
     r'import { leadKey, leadStatusLabel } from "@/lib/unifiedLead";\nimport { useLeadOverlayData } from "@/hooks/useLeadOverlay";\nimport { useSalesReps } from "@/hooks/useSalesReps";'),
    (r'const { canViewLeads } = usePermissions\(\);',
     r'const { canViewLeads, canExportLeads } = usePermissions();'),
    (r'const \[searchQuery, setSearchQuery\] = useState\(""\);',
     r'const [searchQuery, setSearchQuery] = useState("");\n  const { data: overlay } = useLeadOverlayData();\n  const { data: salesReps = [] } = useSalesReps();\n  const [ownerFilter, setOwnerFilter] = useState<string>("all");'),
    (r'const scheduleFetchLeads = useMemo\(\(\) => \{',
     r'  const ownerNameFor = useMemo(() => {\n    const byKey = new Map<string, string>();\n    for (const a of overlay?.annotations ?? []) {\n      if (a.lead_source !== "alpha_digital_leads" || !a.owner_id) continue;\n      const name = ownerName(a.owner_id, salesReps);\n      if (name) byKey.set(leadKey(a.lead_source, a.lead_id), name);\n    }\n    return (id: string) => byKey.get(leadKey("alpha_digital_leads", id)) ?? null;\n  }, [overlay, salesReps]);\n\n  const scheduleFetchLeads = useMemo(() => {'),
    (r'const exportToCSV = \(\) => \{',
     r'  const adminActions = [\n    {\n      key: "sync",\n      label: "Sync now",\n      icon: <RefreshCw className="h-3.5 w-3.5" />,\n      onClick: handleSync,\n      loading: syncing,\n    },\n    {\n      key: "export",\n      label: "Export CSV",\n      icon: <Download className="h-3.5 w-3.5" />,\n      onClick: exportToCSV,\n      disabled: !filtered.length,\n      allowed: canExportLeads,\n    },\n  ];\n\n  const exportToCSV = () => {'),
    (r'if \(\n\s*!matchesLeadSearch\(searchQuery, \{',
     r'    if (ownerFilter !== "all") {\n      const name = ownerNameFor(l.id);\n      if (ownerFilter === "__unassigned") {\n        if (name) return false;\n      } else if (name !== ownerFilter) {\n        return false;\n      }\n    }\n\n    if (\n      !matchesLeadSearch(searchQuery, {'),
    (r'<div className="flex flex-wrap gap-2">.*?</div>',
     r''),
    (r'metrics=\{\[\n\s*\{\n\s*value: stats\.total,',
     r'metrics={[\n              {\n                value: stats.total,'),
    (r'active: repliedOnly,\n\s*\}\n\s*\]\}\n\s*/>',
     r'active: repliedOnly,\n              },\n            ]}\n          />\n          <LeadAdminToolbar actions={adminActions} className="mt-4" />'),
    (r'filters=\{\[\n\s*\{',
     r'filters={[\n              {\n                key: "owner",\n                label: "Owner",\n                value: ownerFilter,\n                onChange: setOwnerFilter,\n                width: "w-[160px]",\n                options: [\n                  { value: "all", label: "All owners" },\n                  { value: "__unassigned", label: "Unassigned" },\n                  ...optionsFromData(leads, (l) => ownerNameFor(l.id)),\n                ],\n              },\n              {'),
    (r'onClearAll=\{\(\) => \{\n\s*setSearchQuery\(\'\'\);\n\s*setCampaignFilter\(\'all\'\);\n\s*setStepFilter\(\'all\'\);\n\s*setReachFilter\(\'all\'\);\n\s*setRepliedOnly\(false\);\n\s*setDateFrom\(\'\'\);\n\s*setDateTo\(\'\'\);\n\s*\}\}',
     r'onClearAll={() => {\n              setSearchQuery("");\n              setCampaignFilter("all");\n              setStepFilter("all");\n              setReachFilter("all");\n              setRepliedOnly(false);\n              setDateFrom("");\n              setDateTo("");\n              setOwnerFilter("all");\n            }}')
]

# B2BMatchmakingLeadsAdmin.tsx
b2b_patches = [
    (r'import { LeadsToolbar } from \'@/components/admin/leads/LeadsToolbar\';',
     r'import { LeadsToolbar } from "@/components/admin/leads/LeadsToolbar";\nimport { LeadAdminToolbar } from "@/components/admin/leads/LeadAdminToolbar";'),
    (r'import { leadKey, leadStatusLabel } from \'@/lib/unifiedLead\';',
     r'import { leadKey, leadStatusLabel } from "@/lib/unifiedLead";\nimport { useLeadOverlayData } from "@/hooks/useLeadOverlay";\nimport { optionsFromData } from "@/lib/leadSearch";'),
    (r'const \[search, setSearch\] = useState\(\'\'\);',
     r'const [search, setSearch] = useState("");\n  const { data: overlay } = useLeadOverlayData();\n  const [ownerFilter, setOwnerFilter] = useState("all");'),
    (r'const leads = useMemo\(\(\) => \{',
     r'  const ownerNameFor = useMemo(() => {\n    const byKey = new Map<string, string>();\n    for (const a of overlay?.annotations ?? []) {\n      if (!a.owner_id) continue;\n      const name = ownerName(a.owner_id, reps);\n      if (name) byKey.set(leadKey(a.lead_source, a.lead_id), name);\n    }\n    return (source: string, id: string) => byKey.get(leadKey(source, id)) ?? null;\n  }, [overlay, reps]);\n\n  const leads = useMemo(() => {'),
    (r'return leads\.filter\(\(l\) => \{',
     r'return leads.filter((l) => {\n      if (ownerFilter !== "all") {\n        const name = ownerNameFor(l.source, l.id);\n        if (ownerFilter === "__unassigned") {\n          if (name) return false;\n        } else if (name !== ownerFilter) {\n          return false;\n        }\n      }'),
    (r'active: callsOnly,\n\s*\},\n\s*\]\}\n\s*/>',
     r'active: callsOnly,\n          },\n        ]}\n      />\n\n      <LeadAdminToolbar\n        actions={[\n          {\n            key: "refresh",\n            label: "Refresh",\n            icon: <RefreshCw className="h-3.5 w-3.5" />,\n            onClick: () => {\n              refetch();\n              toast.success("Refreshing leads…");\n            },\n            loading: isRefetching,\n          },\n        ]}\n        className="mt-4"\n      />'),
    (r'onClearAll=\{\(\) => \{ setSearch\(\'\'\); setCallsOnly\(false\); \}\}',
     r'onClearAll={() => { setSearch(""); setCallsOnly(false); setOwnerFilter("all"); }}'),
    (r'actions=\{\n\s*<Button variant="outline" size="sm" className="h-8 text-xs"\n\s*onClick=\{\(\) => \{ refetch\(\); toast\.success\(\'Refreshing leads…\'\); \}\} disabled=\{isRefetching\}>\n\s*<RefreshCw className=\{`w-3.5 h-3.5 mr-1.5 \$\{isRefetching \? \'animate-spin\' : \'\'\}`} \/> Refresh\n\s*</Button>\n\s*\}',
     r''),
    (r'searchPlaceholder="Search name, email, company, title, message…"',
     r'searchPlaceholder="Search name, email, company, title, message…"\n        filters={[\n          {\n            key: "owner",\n            label: "Owner",\n            value: ownerFilter,\n            onChange: setOwnerFilter,\n            options: [\n              { value: "all", label: "All owners" },\n              { value: "__unassigned", label: "Unassigned" },\n              ...optionsFromData(leads, (l) => ownerNameFor(l.source, l.id)),\n            ],\n          },\n        ]}')
]

# ArchivedLeadsAdmin.tsx
archived_patches = [
    (r'import { LeadsToolbar, LeadAdminToolbar } from \'@/components/admin/leads/LeadsToolbar\';',
     r'import { LeadsToolbar } from "@/components/admin/leads/LeadsToolbar";\nimport { LeadAdminToolbar } from "@/components/admin/leads/LeadAdminToolbar";'),
    (r'import { leadKey, UnifiedLead, leadStatusLabel, LEAD_SOURCE_META } from \'@/lib/unifiedLead\';',
     r'import { leadKey, UnifiedLead, leadStatusLabel, LEAD_SOURCE_META } from "@/lib/unifiedLead";\nimport { useLeadOverlayData } from "@/hooks/useLeadOverlay";\nimport { useSalesReps } from "@/hooks/useSalesReps";'),
    (r'import { ownerName, leadOverlayUi } from \'@/components/admin/leads/leadOverlayUi\';',
     r'import { ownerName } from "@/components/admin/leads/leadOverlayUi";'),
    (r'const \[restoreTarget, setRestoreTarget\] = useState<UnifiedLead \| null>\(null\);',
     r'const [restoreTarget, setRestoreTarget] = useState<UnifiedLead | null>(null);\n  const { data: overlay } = useLeadOverlayData();\n  const { data: salesReps = [] } = useSalesReps();\n  const [ownerFilter, setOwnerFilter] = useState("all");'),
    (r'const matchesDateRange = \(dateStr: string \| null\) => \{',
     r'  const ownerNameFor = useMemo(() => {\n    const byKey = new Map<string, string>();\n    for (const a of overlay?.annotations ?? []) {\n      if (!a.owner_id) continue;\n      const name = ownerName(a.owner_id, salesReps);\n      if (name) byKey.set(leadKey(a.lead_source, a.lead_id), name);\n    }\n    return (source: string, id: string) => byKey.get(leadKey(source, id)) ?? null;\n  }, [overlay, salesReps]);\n\n  const matchesDateRange = (dateStr: string | null) => {'),
    (r'if \(\n\s*!matchesLeadSearch\(searchQuery, \{',
     r'        if (ownerFilter !== "all") {\n          const name = ownerNameFor(lead.source, lead.id);\n          if (ownerFilter === "__unassigned") {\n            if (name) return false;\n          } else if (name !== ownerFilter) {\n            return false;\n          }\n        }\n\n        if (\n          !matchesLeadSearch(searchQuery, {'),
    (r'setSourceFilter\(\'all\'\);\n\s*setDateRange\(\'all\'\);',
     r'setSourceFilter("all");\n    setDateRange("all");\n    setOwnerFilter("all");'),
    (r'<div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">.*?Refresh</span>\n\s*</Button>\n\s*</div>',
     r'<div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">\n        <div>\n          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">\n            <Archive className="h-6 w-6 text-primary" />\n            Archived Leads\n          </h1>\n          <p className="mt-1 text-sm text-muted-foreground">\n            Leads removed from the inbox. Restore one to put it back for everyone.\n          </p>\n        </div>\n      </div>',
     re.DOTALL),
    (r'metrics=\{\[\n\s*\{ value: leads\.length, label: \'Total archived\', onClick: clearAll \},\n\s*\.\.\.sourceTiles,\n\s*\]\}\n\s*/>',
     r'metrics={[\n          { value: leads.length, label: "Total archived", onClick: clearAll },\n          ...sourceTiles,\n        ]}\n      />\n\n      <LeadAdminToolbar\n        actions={[\n          {\n            key: "refresh",\n            label: "Refresh",\n            icon: <RefreshCw className="h-3.5 w-3.5" />,\n            onClick: () => refetch(),\n            loading: isFetching,\n          },\n        ]}\n        className="mt-4"\n      />'),
    (r'filters=\{\[\n\s*\{',
     r'filters={[\n          {\n            key: "owner",\n            label: "Owner",\n            value: ownerFilter,\n            onChange: setOwnerFilter,\n            width: "w-[160px]",\n            options: [\n              { value: "all", label: "All owners" },\n              { value: "__unassigned", label: "Unassigned" },\n              ...optionsFromData(leads, (l) => ownerNameFor(l.source, l.id)),\n            ],\n          },\n          {')
]

# Note: for the DOTALL one, we need to handle it specially
def patch_file_with_flags(path, patches):
    with open(path, 'r') as f:
        content = f.read()
    for p in patches:
        pattern = p[0]
        replacement = p[1]
        flags = p[2] if len(p) > 2 else re.MULTILINE
        content = re.sub(pattern, replacement, content, flags=flags)
    with open(path, 'w') as f:
        f.write(content)

patch_file_with_flags('src/pages/admin/content/AlphaDigitalLeadsAdmin.tsx', alpha_patches)
patch_file_with_flags('src/pages/admin/content/B2BMatchmakingLeadsAdmin.tsx', b2b_patches)
patch_file_with_flags('src/pages/admin/content/ArchivedLeadsAdmin.tsx', archived_patches)

