import { memo } from 'react';
import { Play, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { WorkflowDefinition } from '@/lib/workflowDefinitions';
import { demoComponents } from '@/pages/resources/demosData';
import { PRODUCTION_URL } from '@/lib/siteConfig';

interface WorkflowCardProps {
  workflow: WorkflowDefinition;
}

const hasDemo = (workflowId: string): boolean => workflowId in demoComponents;
const getDemoUrl = (workflowId: string): string => `${PRODUCTION_URL}/resources/demos?demo=${workflowId}`;

/**
 * Isolated workflow card component with defensive rendering.
 * Wrapped by error boundary in parent to prevent cascade failures.
 */
export const WorkflowCard = memo(function WorkflowCard({ workflow }: WorkflowCardProps) {
  // Final defensive check - if any required field is missing, don't render
  if (!workflow || typeof workflow.id !== 'string' || typeof workflow.name !== 'string') {
    console.warn('[WorkflowCard] Invalid workflow data received:', workflow);
    return null;
  }

  return (
    <div 
      className="p-4 rounded-lg border bg-card hover:border-primary/50 transition-colors"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-semibold">{workflow.name}</h4>
        {hasDemo(workflow.id) && (
          <a
            href={getDemoUrl(workflow.id)}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <Play className="w-3 h-3" />
            Demo
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
      <p className="text-sm text-muted-foreground mb-3">
        {workflow.description || 'No description available'}
      </p>
      <div className="flex flex-wrap gap-1">
        {Array.isArray(workflow.applications) && workflow.applications.slice(0, 3).map((app: string, idx: number) => (
          <Badge key={idx} variant="secondary" className="text-xs">
            {app}
          </Badge>
        ))}
      </div>
    </div>
  );
});

export default WorkflowCard;
