import { memo } from 'react';
import { AlertTriangle, RefreshCw, Mail, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Discrepancy } from '@/lib/validateProposalData';
import { SUPPORT_EMAIL } from '@/lib/siteConfig';

interface ProposalValidationAlertProps {
  discrepancies: Discrepancy[];
  onRetry: () => void;
  onDismiss: () => void;
}

export const ProposalValidationAlert = memo(function ProposalValidationAlert({
  discrepancies,
  onRetry,
  onDismiss
}: ProposalValidationAlertProps) {
  const errorBody = encodeURIComponent(
    `I encountered validation errors when generating a proposal:\n\n${discrepancies.map(d => `- ${d.message}`).join('\n')}\n\nPage: ${window.location.href}`
  );

  return (
    <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/30 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
          <p className="font-semibold text-destructive">
            Cannot Generate Proposal URL
          </p>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onDismiss}
          className="h-8 w-8 p-0"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
      
      <p className="text-sm text-muted-foreground">
        The following {discrepancies.length === 1 ? 'issue needs' : 'issues need'} to be resolved before generating the web-based quote:
      </p>
      
      <ul className="space-y-2 max-h-48 overflow-y-auto">
        {discrepancies.map((d, i) => (
          <li key={i} className="text-sm p-3 bg-background rounded border border-destructive/20">
            <div className="font-medium text-destructive flex items-start gap-2">
              <span className="bg-destructive/20 text-destructive text-xs px-1.5 py-0.5 rounded shrink-0">
                {d.type.replace(/_/g, ' ').toUpperCase()}
              </span>
              <span>{d.message}</span>
            </div>
            {d.suggestion && (
              <div className="text-xs text-muted-foreground mt-2 pl-0.5">
                💡 {d.suggestion}
              </div>
            )}
          </li>
        ))}
      </ul>
      
      <div className="flex flex-wrap gap-2 pt-1">
        <Button onClick={onRetry} variant="outline" size="sm" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Re-validate
        </Button>
        <Button onClick={onDismiss} variant="ghost" size="sm">
          Dismiss
        </Button>
        <a 
          href={`mailto:${SUPPORT_EMAIL}?subject=Proposal%20Validation%20Error&body=${errorBody}`}
          className="ml-auto"
        >
          <Button variant="link" size="sm" className="gap-2 text-muted-foreground">
            <Mail className="w-4 h-4" />
            Report Issue
          </Button>
        </a>
      </div>
    </div>
  );
});
