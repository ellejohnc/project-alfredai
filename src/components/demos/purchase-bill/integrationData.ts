// Construction Management Software Integration Data

export interface ConstructionPlatform {
  id: string;
  name: string;
  color: string;
  bgColor: string;
  logoUrl?: string;
  category: string;
  endpoints: PlatformEndpoint[];
}

export interface PlatformEndpoint {
  method: 'GET' | 'POST' | 'PUT';
  path: string;
  description: string;
  syncType: SyncType;
}

export type SyncType = 
  | 'pull_po' 
  | 'pull_commitment' 
  | 'verify_contract' 
  | 'push_invoice' 
  | 'push_cost_code' 
  | 'update_budget';

export interface SyncLogEntry {
  id: string;
  timestamp: Date;
  method: 'GET' | 'POST' | 'PUT';
  endpoint: string;
  requestBody?: object;
  responseStatus: number;
  responseTime: number;
  responseBody?: object;
  error?: string;
}

export interface IntegrationStatus {
  platformId: string;
  connected: boolean;
  lastSync?: Date;
  syncCount: number;
}

// Platform configurations
export const CONSTRUCTION_PLATFORMS: ConstructionPlatform[] = [
  {
    id: 'procore',
    name: 'Procore',
    color: '#F47920',
    bgColor: 'bg-orange-500/10',
    category: 'Enterprise PM',
    endpoints: [
      { method: 'GET', path: '/rest/v1.0/projects/{id}/purchase_orders', description: 'Fetch Purchase Orders', syncType: 'pull_po' },
      { method: 'GET', path: '/rest/v1.0/projects/{id}/commitments', description: 'Fetch Commitments', syncType: 'pull_commitment' },
      { method: 'GET', path: '/rest/v1.0/projects/{id}/prime_contracts', description: 'Verify Contract', syncType: 'verify_contract' },
      { method: 'POST', path: '/rest/v1.0/projects/{id}/direct_costs', description: 'Push Direct Cost', syncType: 'push_invoice' },
      { method: 'PUT', path: '/rest/v1.0/projects/{id}/budget_modifications', description: 'Update Budget', syncType: 'update_budget' },
    ],
  },
  {
    id: 'buildertrend',
    name: 'Buildertrend',
    color: '#0073CF',
    bgColor: 'bg-blue-500/10',
    category: 'Residential Builder',
    endpoints: [
      { method: 'GET', path: '/api/v2/projects/{id}/budgets', description: 'Fetch Budget Lines', syncType: 'pull_po' },
      { method: 'GET', path: '/api/v2/projects/{id}/change-orders', description: 'Fetch Change Orders', syncType: 'pull_commitment' },
      { method: 'GET', path: '/api/v2/projects/{id}/contracts', description: 'Verify Contract', syncType: 'verify_contract' },
      { method: 'POST', path: '/api/v2/projects/{id}/expenses', description: 'Push Expense', syncType: 'push_invoice' },
    ],
  },
  {
    id: 'plangrid',
    name: 'PlanGrid (Autodesk)',
    color: '#00BFA5',
    bgColor: 'bg-teal-500/10',
    category: 'Field Management',
    endpoints: [
      { method: 'GET', path: '/projects/{id}/issues', description: 'Fetch Issues', syncType: 'pull_po' },
      { method: 'GET', path: '/projects/{id}/rfis', description: 'Fetch RFIs', syncType: 'pull_commitment' },
      { method: 'POST', path: '/projects/{id}/attachments', description: 'Push Invoice PDF', syncType: 'push_invoice' },
    ],
  },
  {
    id: 'sage300',
    name: 'Sage 300 CRE',
    color: '#00853E',
    bgColor: 'bg-green-500/10',
    category: 'Accounting ERP',
    endpoints: [
      { method: 'GET', path: '/api/jobs/{id}/commitments', description: 'Fetch Commitments', syncType: 'pull_commitment' },
      { method: 'GET', path: '/api/vendors/{id}/invoices', description: 'Fetch Vendor History', syncType: 'pull_po' },
      { method: 'POST', path: '/api/jobs/{id}/costs', description: 'Push Cost Entry', syncType: 'push_cost_code' },
      { method: 'PUT', path: '/api/jobs/{id}/budget', description: 'Update Job Budget', syncType: 'update_budget' },
    ],
  },
  {
    id: 'viewpoint',
    name: 'Viewpoint Vista',
    color: '#003087',
    bgColor: 'bg-indigo-500/10',
    category: 'Construction ERP',
    endpoints: [
      { method: 'GET', path: '/api/v1/subcontracts', description: 'Fetch Subcontracts', syncType: 'pull_commitment' },
      { method: 'GET', path: '/api/v1/purchase-orders', description: 'Fetch POs', syncType: 'pull_po' },
      { method: 'POST', path: '/api/v1/ap-invoices', description: 'Create AP Invoice', syncType: 'push_invoice' },
    ],
  },
  {
    id: 'coconstruct',
    name: 'CoConstruct',
    color: '#0099CC',
    bgColor: 'bg-cyan-500/10',
    category: 'Residential Builder',
    endpoints: [
      { method: 'GET', path: '/api/projects/{id}/selections', description: 'Fetch Selections', syncType: 'pull_po' },
      { method: 'GET', path: '/api/projects/{id}/budget-items', description: 'Fetch Budget Items', syncType: 'pull_commitment' },
      { method: 'POST', path: '/api/projects/{id}/bills', description: 'Push Bill', syncType: 'push_invoice' },
    ],
  },
];

// Sync type labels
export const SYNC_TYPE_LABELS: Record<SyncType, { label: string; description: string; icon: string }> = {
  pull_po: { 
    label: 'Pull PO Details', 
    description: 'Fetch Purchase Order data for matching',
    icon: '📥'
  },
  pull_commitment: { 
    label: 'Pull Commitments', 
    description: 'Fetch subcontract/commitment data',
    icon: '📋'
  },
  verify_contract: { 
    label: 'Verify Contract', 
    description: 'Cross-reference against active contracts',
    icon: '✓'
  },
  push_invoice: { 
    label: 'Push Invoice', 
    description: 'Send approved invoice for cost coding',
    icon: '📤'
  },
  push_cost_code: { 
    label: 'Push Cost Code', 
    description: 'Update job cost allocation',
    icon: '🏷️'
  },
  update_budget: { 
    label: 'Update Budget', 
    description: 'Sync invoice amount to budget actuals',
    icon: '💰'
  },
};

// Generate simulated API response based on platform and sync type
export function generateMockApiResponse(
  platform: ConstructionPlatform, 
  syncType: SyncType,
  billData?: { po_reference?: string; total_amount?: number; supplier_name?: string }
): object {
  const baseResponses: Record<SyncType, object> = {
    pull_po: {
      purchase_order: {
        id: `PO-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
        reference: billData?.po_reference || 'PO-2024-001',
        vendor: billData?.supplier_name || 'Contractor Ltd',
        original_amount: billData?.total_amount ? billData.total_amount * 1.05 : 125000,
        approved_changes: 5200,
        invoiced_to_date: billData?.total_amount ? billData.total_amount * 0.75 : 95000,
        remaining: billData?.total_amount ? billData.total_amount * 0.3 : 35200,
        status: 'active',
      },
    },
    pull_commitment: {
      commitment: {
        id: `COM-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        contract_number: 'SC-2024-045',
        vendor: billData?.supplier_name || 'Subcontractor Inc',
        original_value: 250000,
        approved_cos: 12500,
        revised_value: 262500,
        percent_complete: 68,
        retention_held: 13125,
      },
    },
    verify_contract: {
      contract: {
        id: `CON-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        title: 'Main Construction Contract',
        vendor: billData?.supplier_name,
        start_date: '2024-01-15',
        end_date: '2025-06-30',
        value: 1250000,
        retention_rate: 0.05,
        payment_terms: 30,
        status: 'active',
        match_confidence: 0.94,
      },
    },
    push_invoice: {
      result: {
        success: true,
        invoice_id: `INV-${platform.id.toUpperCase()}-${Date.now()}`,
        cost_code_applied: 'SUBCON-001',
        budget_updated: true,
        message: 'Invoice successfully pushed to ' + platform.name,
      },
    },
    push_cost_code: {
      result: {
        success: true,
        cost_entry_id: `CE-${Date.now()}`,
        job_id: 'JOB-2024-001',
        cost_code: '03.100.001',
        amount: billData?.total_amount || 45000,
        message: 'Cost code successfully applied',
      },
    },
    update_budget: {
      result: {
        success: true,
        budget_id: `BUD-${Date.now()}`,
        previous_actual: 450000,
        new_actual: 450000 + (billData?.total_amount || 45000),
        variance_percent: -2.3,
        message: 'Budget actuals updated',
      },
    },
  };

  return baseResponses[syncType];
}

// Simulate API errors for demonstration
export function simulatePlatformError(): { error: string; status: number } | null {
  const errorChance = Math.random();
  
  if (errorChance < 0.05) {
    return { error: 'OAuth token expired. Please reconnect.', status: 401 };
  }
  if (errorChance < 0.08) {
    return { error: 'Rate limit exceeded. Try again in 60 seconds.', status: 429 };
  }
  if (errorChance < 0.1) {
    return { error: 'Project not found in connected workspace.', status: 404 };
  }
  
  return null;
}

// Get platform by ID
export function getPlatformById(platformId: string): ConstructionPlatform | undefined {
  return CONSTRUCTION_PLATFORMS.find(p => p.id === platformId);
}

// Get endpoints for a specific sync type
export function getEndpointsForSyncType(platform: ConstructionPlatform, syncType: SyncType): PlatformEndpoint[] {
  return platform.endpoints.filter(e => e.syncType === syncType);
}
