import sys

with open('src/pages/admin/content/WebinarLeadsAdmin.tsx', 'r') as f:
    lines = f.readlines()

new_lines = []
for i, line in enumerate(lines):
    if 'import { useMemo }' in line and i > 0: continue
    if 'import { LeadAdminToolbar }' in line and i > 15: continue
    if 'setOwnerFilter("all");' in line and 'onClearAll' not in lines[i-1] and 'onClearAll' not in lines[i-2]:
        continue
    new_lines.append(line)

content = "".join(new_lines)

if 'const [ownerFilter, setOwnerFilter] = useState' not in content:
    content = content.replace(
        'const [searchQuery, setSearchQuery] = useState("");',
        'const [searchQuery, setSearchQuery] = useState("");\n  const { data: overlay } = useLeadOverlayData();\n  const { data: salesReps = [] } = useSalesReps();\n  const [ownerFilter, setOwnerFilter] = useState<string>("all");'
    )

if 'const ownerNameFor = useMemo(() =>' not in content:
    content = content.replace(
        'const [isRefreshing, setIsRefreshing] = useState(false);',
        'const ownerNameFor = useMemo(() => {\n    const byKey = new Map<string, string>();\n    for (const a of overlay?.annotations ?? []) {\n      if (a.lead_source !== "webinar_registrations" || !a.owner_id) continue;\n      const name = ownerName(a.owner_id, salesReps);\n      if (name) byKey.set(leadKey(a.lead_source, a.lead_id), name);\n    }\n    return (id: string) => byKey.get(leadKey("webinar_registrations", id)) ?? null;\n  }, [overlay, salesReps]);\n  const [isRefreshing, setIsRefreshing] = useState(false);'
    )

if 'setOwnerFilter("all");' not in content:
    content = content.replace(
        'onClearAll={() => { setSearchQuery(\'\'); setDateRange(\'all\'); setWebinarFilter(\'all\'); }}',
        'onClearAll={() => { setSearchQuery(\'\'); setDateRange(\'all\'); setWebinarFilter(\'all\'); setOwnerFilter(\'all\'); }}'
    )

if 'if (ownerFilter !== "all")' not in content:
    content = content.replace(
        'if (!matchesSearch) return false;',
        'if (!matchesSearch) return false;\n    if (ownerFilter !== "all") {\n      const name = ownerNameFor(lead.id);\n      if (ownerFilter === "__unassigned") {\n        if (name) return false;\n      } else if (name !== ownerFilter) {\n        return false;\n      }\n    }'
    )

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

if '<LeadAdminToolbar' not in content:
    content = content.replace(
        'active: dateRange === \'7d\' },\n        ]}\n      />',
        'active: dateRange === \'7d\' },\n        ]}\n      />' + admin_toolbar
    )

# Remove old buttons
content = content.replace(
    '          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>\n            <RefreshCw className={cn("w-4 h-4 mr-2", isRefreshing && "animate-spin")} />\n            <span className="hidden sm:inline">Refresh</span>\n          </Button>',
    ''
)
content = content.replace(
    '            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={exportLeadsCSV}>\n              <Download className="w-3.5 h-3.5 mr-1.5" /> Export\n            </Button>',
    ''
)

owner_filter_entry = """          {
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
          },"""

if 'key: \'owner\'' not in content:
    content = content.replace(
        'key: \'webinar\',',
        owner_filter_entry + '\n          {\n            key: \'webinar\','
    )

with open('src/pages/admin/content/WebinarLeadsAdmin.tsx', 'w') as f:
    f.write(content)
