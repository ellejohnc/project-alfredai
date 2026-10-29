import sys

with open('src/pages/admin/content/InvestorLeadsAdmin.tsx', 'r') as f:
    lines = f.readlines()

new_lines = []
skip = False
for i, line in enumerate(lines):
    # Remove duplicates of imports I might have added
    if 'import { useMemo }' in line and i > 0: continue
    if 'import { LeadAdminToolbar }' in line and i > 15: continue
    
    # Clean up the weird insertions
    if 'setOwnerFilter("all");' in line and 'setSortBy' not in lines[i-1] and 'setWebinarFilter' not in lines[i-1] and 'onClearAll' not in lines[i-1]:
        continue

    new_lines.append(line)

# Now apply the real changes
content = "".join(new_lines)

# Ensure ownerFilter state is there exactly once
if 'const [ownerFilter, setOwnerFilter] = useState' not in content:
    content = content.replace(
        'const [searchQuery, setSearchQuery] = useState(\'\');',
        'const [searchQuery, setSearchQuery] = useState(\'\');\n  const { data: overlay } = useLeadOverlayData();\n  const { data: salesReps = [] } = useSalesReps();\n  const [ownerFilter, setOwnerFilter] = useState<string>(\'all\');'
    )

# Ensure ownerNameFor memo is there exactly once
if 'const ownerNameFor = useMemo(() =>' not in content:
    content = content.replace(
        'const [selectedLead, setSelectedLead] = useState<InvestorLead | null>(null);',
        'const ownerNameFor = useMemo(() => {\n    const byKey = new Map<string, string>();\n    for (const a of overlay?.annotations ?? []) {\n      if (a.lead_source !== \'investor_leads\' || !a.owner_id) continue;\n      const name = ownerName(a.owner_id, salesReps);\n      if (name) byKey.set(leadKey(a.lead_source, a.lead_id), name);\n    }\n    return (id: string) => byKey.get(leadKey(\'investor_leads\', id)) ?? null;\n  }, [overlay, salesReps]);\n  const [selectedLead, setSelectedLead] = useState<InvestorLead | null>(null);'
    )

# Update clearAllFilters
if 'setOwnerFilter(\'all\');' not in content:
     content = content.replace(
        'setSortBy(\'date_desc\');',
        'setSortBy(\'date_desc\');\n    setOwnerFilter(\'all\');'
    )

# Update filterLeads pipeline
if 'Filter by owner' not in content:
    content = content.replace(
        '    // Filter by role',
        '    // Filter by owner\n    if (ownerFilter !== \'all\') {\n      filtered = filtered.filter(lead => {\n        const name = ownerNameFor(lead.id);\n        if (ownerFilter === \'__unassigned\') return !name;\n        return name === ownerFilter;\n      });\n    }\n\n    // Filter by role'
    )

# Update useEffect dependencies
content = content.replace(
    '[leads, searchQuery, filterRole, filterStatus, filterVerification, sortBy]',
    '[leads, searchQuery, filterRole, filterStatus, filterVerification, sortBy, ownerFilter, ownerNameFor]'
)

# JSX changes: AdminToolbar
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

if '<LeadAdminToolbar' not in content:
    content = content.replace(
        'active: filterVerification === \'unverified\',',
        'active: filterVerification === \'unverified\',\n          },\n        ]}\n      />'
    )
    # This is tricky because there are two LeadMetricsStrip. I want it after the second one.
    parts = content.split('active: filterVerification === \'unverified\',')
    if len(parts) > 1:
        # Reconstruct with toolbar after the metrics strip
        # Actually I already have the metrics strip closing tag in the replacement above.
        pass

# Better approach for JSX:
# Remove old buttons from header/toolbar
content = content.replace(
    '              aria-label="Refresh investor leads"\n              className="h-8 w-8 p-0"\n            >\n              <RefreshCw className="h-3.5 w-3.5" />\n            </Button>',
    ''
)
content = content.replace(
    '            <Button onClick={exportToCSV} variant="outline" size="sm" className="h-8 gap-1.5 text-xs">\n              <Download className="h-3.5 w-3.5" />\n              Export CSV\n            </Button>',
    ''
)

# Add Owner filter to LeadsToolbar
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
        'key: \'status\',',
        owner_filter_entry + '\n          {\n            key: \'status\','
    )

# Insert LeadAdminToolbar after the second LeadMetricsStrip
# Search for the end of the second strip
import re
strips = list(re.finditer(r'</LeadMetricsStrip>', content))
if len(strips) >= 2:
    idx = strips[1].end()
    content = content[:idx] + admin_toolbar + content[idx:]

with open('src/pages/admin/content/InvestorLeadsAdmin.tsx', 'w') as f:
    f.write(content)
