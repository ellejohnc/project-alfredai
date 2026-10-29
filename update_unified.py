import sys
import re

path = 'src/pages/admin/content/UnifiedLeadsInbox.tsx'
with open(path, 'r') as f:
    content = f.read()

# 1. Update permissions hook
content = content.replace(
    'const { canViewLeads, isSalesRep } = usePermissions();',
    'const { canViewLeads, canExportLeads, isSalesRep } = usePermissions();'
)

# 2. Add isRealtimeConnected state
content = content.replace(
    '  const { prefetch: prefetchGhlLead, cancel: cancelPrefetchGhlLead } = usePrefetchGhlLead();',
    """  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  useEffect(() => {
    const channel = supabase.channel('inbox-status')
      .subscribe((status) => {
        setIsRealtimeConnected(status === 'SUBSCRIBED');
      });
    return () => { supabase.removeChannel(channel); };
  }, []);
  const { prefetch: prefetchGhlLead, cancel: cancelPrefetchGhlLead } = usePrefetchGhlLead();"""
)

# 3. Add ownerNameFor and exportToCSV helpers
helpers = """  const ownerNameFor = useCallback(
    (l: UnifiedLead) => {
      const ownerId = l.annotation?.owner_id;
      if (!ownerId) return null;
      return ownerName(ownerId, reps) || null;
    },
    [reps]
  );

  const exportToCSV = () => {
    if (!displayed.length) return;
    const headers = ['Name', 'Email', 'Phone', 'Company', 'Status', 'Source', 'Received'];
    const rows = displayed.map((l) => [
      l.name,
      l.email || '',
      l.phone || '',
      l.company || '',
      humanizeStatusCode(l.status || ''),
      LEAD_SOURCE_META[l.source].label,
      format(new Date(l.created_at), 'yyyy-MM-dd HH:mm'),
    ]);
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `leads-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported successfully');
  };

"""
content = content.replace('  const filtered = useMemo(() => {', helpers + '  const filtered = useMemo(() => {')

# 4. Update owner filtering logic in filtered memo
old_owner_filter = """      if (ownerFilter !== ALL) {
        const owner = l.annotation?.owner_id ?? null;
        if (ownerFilter === '__none__' ? owner !== null : owner !== ownerFilter) return false;
      }"""
new_owner_filter = """      if (ownerFilter !== ALL) {
        const name = ownerNameFor(l);
        if (ownerFilter === '__unassigned') {
          if (!name) return true; // keep if no name
          return false;
        }
        if (name !== ownerFilter) return false;
      }"""
# Correcting logic: '__unassigned' should return true if NO name. 
# Wait, if ownerFilter is '__unassigned', we want rows with NO owner name.
new_owner_filter = """      if (ownerFilter !== ALL) {
        const name = ownerNameFor(l);
        if (ownerFilter === '__unassigned') {
          if (name) return false;
        } else {
          if (name !== ownerFilter) return false;
        }
      }"""
content = content.replace(old_owner_filter, new_owner_filter)

# 5. Update AdminPageHeader
header_pattern = r'<AdminPageHeader.*?/>'
new_header = """<AdminPageHeader
        title="Leads"
        icon={<Users className="h-5 w-5 text-primary" />}
        isRealtimeConnected={isRealtimeConnected}
        stats={[
          { label: 'Total', value: leads.length },
          { label: 'Showing', value: displayed.length },
        ]}
        description=""
      />"""
content = re.sub(header_pattern, new_header, content, flags=re.DOTALL)

# 6. Remove LeadFunnelMetrics
funnel_pattern = r'<LeadFunnelMetrics.*?\n\s+/>'
content = re.sub(funnel_pattern, '', content, flags=re.DOTALL)

# 7. Insert LeadAdminToolbar after LeadMetricsStrip
strip_end = 'active: segment === \'sync\',\n            },\n          ]}\n        />'
admin_toolbar = """
        <LeadAdminToolbar
          actions={[
            {
              key: 'refresh',
              label: 'Refresh',
              icon: <RefreshCw className="h-3.5 w-3.5" />,
              onClick: () => refetch(),
              loading: isRefetching,
            },
            {
              key: 'export',
              label: 'Export',
              icon: <Download className="h-3.5 w-3.5" />,
              onClick: exportToCSV,
              allowed: canExportLeads,
            },
          ]}
          className="mt-4"
        />"""
content = content.replace(strip_end, strip_end + admin_toolbar)

# 8. Update LeadsToolbar owner filter
old_toolbar_owner = """          {
            key: 'owner',
            label: 'Owner',
            allValue: ALL,
            value: ownerFilter,
            onChange: setOwnerFilter,
            options: [
              { value: ALL, label: 'Any owner' },
              { value: '__none__', label: 'Unassigned' },
              ...reps.map((r) => ({ value: r.id, label: r.display_name || r.email })),
            ],
          },"""
new_toolbar_owner = """          {
            key: 'owner',
            label: 'Owner',
            allValue: ALL,
            value: ownerFilter,
            onChange: setOwnerFilter,
            options: [
              { value: ALL, label: 'All owners' },
              { value: '__unassigned', label: 'Unassigned' },
              ...optionsFromData(leads, (l) => ownerNameFor(l)),
            ],
          },"""
content = content.replace(old_toolbar_owner, new_toolbar_owner)

with open(path, 'w') as f:
    f.write(content)
