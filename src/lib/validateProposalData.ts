import { workflowDefinitions, WorkflowDefinition } from '@/lib/workflowDefinitions';
import { voiceAgentPlans, type CustomWorkflow } from '@/hooks/useQuoteBuilder';

export interface Discrepancy {
  type: 'missing_workflow' | 'invalid_workflow' | 'missing_voice_plan' | 'missing_field' | 'invalid_custom_workflow';
  id: string;
  message: string;
  suggestion?: string;
}

export interface ValidationResult {
  isValid: boolean;
  discrepancies: Discrepancy[];
  validWorkflows: WorkflowDefinition[];
  invalidWorkflowIds: string[];
}

// Create a Set of valid workflow IDs for O(1) lookup
const validWorkflowIds = new Set(workflowDefinitions.map(w => w.id));

/**
 * Validates proposal data before generating the web-based quote URL.
 * Checks for:
 * - Valid workflow IDs that exist in the catalog
 * - Valid voice agent plan if selected
 * - Required fields like company name
 */
export function validateProposalData(data: {
  workflows?: string[];
  customWorkflows?: CustomWorkflow[];
  voice_agent_plan?: string | null;
  industry?: string;
  company_name?: string;
}): ValidationResult {
  const discrepancies: Discrepancy[] = [];
  const validWorkflows: WorkflowDefinition[] = [];
  const invalidWorkflowIds: string[] = [];

  // Validate workflows
  if (data.workflows && Array.isArray(data.workflows)) {
    for (const workflowId of data.workflows) {
      // Check for invalid type
      if (typeof workflowId !== 'string') {
        invalidWorkflowIds.push(String(workflowId));
        discrepancies.push({
          type: 'invalid_workflow',
          id: String(workflowId),
          message: `Invalid workflow ID format: ${workflowId}`,
          suggestion: 'Remove this workflow and re-add from the list'
        });
        continue;
      }
      
      // Check if workflow exists in catalog
      const workflow = workflowDefinitions.find(w => w.id === workflowId);
      if (!workflow) {
        invalidWorkflowIds.push(workflowId);
        discrepancies.push({
          type: 'missing_workflow',
          id: workflowId,
          message: `Workflow "${workflowId}" not found in catalog`,
          suggestion: 'This workflow may have been renamed or removed. Please select a different workflow.'
        });
      } else {
        validWorkflows.push(workflow);
      }
    }
  }

  // Validate custom workflows: must have name + fixed setup/monthly pricing
  if (data.customWorkflows && Array.isArray(data.customWorkflows)) {
    data.customWorkflows.forEach((cw, idx) => {
      const label = cw?.name?.trim() || `Custom workflow #${idx + 1}`;
      if (!cw || typeof cw !== 'object') {
        discrepancies.push({
          type: 'invalid_custom_workflow',
          id: String(idx),
          message: `Custom workflow #${idx + 1} is malformed`,
          suggestion: 'Remove and re-add this custom workflow'
        });
        return;
      }
      if (!cw.name?.trim()) {
        discrepancies.push({
          type: 'invalid_custom_workflow',
          id: cw.id || String(idx),
          message: `Custom workflow #${idx + 1} is missing a name`,
          suggestion: 'Give the custom workflow a descriptive name before generating'
        });
      }
      const setupOk = typeof cw.setupFee === 'number' && Number.isFinite(cw.setupFee) && cw.setupFee > 0;
      const monthlyOk = typeof cw.monthlyFee === 'number' && Number.isFinite(cw.monthlyFee) && cw.monthlyFee >= 0;
      if (!setupOk) {
        discrepancies.push({
          type: 'invalid_custom_workflow',
          id: cw.id || String(idx),
          message: `"${label}" needs a fixed setup fee greater than 0`,
          suggestion: 'Set a fixed setup price for this custom workflow in Step 4'
        });
      }
      if (!monthlyOk) {
        discrepancies.push({
          type: 'invalid_custom_workflow',
          id: cw.id || String(idx),
          message: `"${label}" needs a fixed monthly retainer (0 or more)`,
          suggestion: 'Set a fixed monthly price for this custom workflow in Step 4'
        });
      }
    });
  }

  // Validate voice agent plan if selected
  if (data.voice_agent_plan) {
    const planExists = voiceAgentPlans.some(p => p.id === data.voice_agent_plan);
    if (!planExists) {
      discrepancies.push({
        type: 'missing_voice_plan',
        id: data.voice_agent_plan,
        message: `Voice plan "${data.voice_agent_plan}" not found`,
        suggestion: 'Select a different voice agent plan from the available options'
      });
    }
  }

  // Validate required fields
  if (!data.company_name?.trim()) {
    discrepancies.push({
      type: 'missing_field',
      id: 'company_name',
      message: 'Company name is required for the proposal',
      suggestion: 'Enter a company name in the Client Details section before generating'
    });
  }

  return {
    isValid: discrepancies.length === 0,
    discrepancies,
    validWorkflows,
    invalidWorkflowIds
  };
}

/**
 * Quick check if all workflow IDs are valid
 */
export function areWorkflowsValid(workflowIds: string[]): boolean {
  return workflowIds.every(id => typeof id === 'string' && validWorkflowIds.has(id));
}

/**
 * Get list of invalid workflow IDs
 */
export function getInvalidWorkflowIds(workflowIds: string[]): string[] {
  return workflowIds.filter(id => typeof id !== 'string' || !validWorkflowIds.has(id));
}

/**
 * Get workflow definition by ID (for display purposes)
 */
export function getWorkflowById(id: string): WorkflowDefinition | undefined {
  return workflowDefinitions.find(w => w.id === id);
}
