import { memo } from 'react';
import { CheckCircle2, Sparkles, AlertTriangle, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { FieldConfidence } from '@/hooks/useQuoteBuilder';

interface ConfidenceIndicatorProps {
  confidence?: FieldConfidence;
  fieldName: string;
  compact?: boolean;
}

const confidenceConfig: Record<FieldConfidence, {
  icon: typeof CheckCircle2;
  label: string;
  tooltip: string;
  className: string;
}> = {
  explicit: {
    icon: CheckCircle2,
    label: 'Confirmed',
    tooltip: 'This value was explicitly mentioned in the transcript.',
    className: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700',
  },
  inferred: {
    icon: Sparkles,
    label: 'AI Guess',
    tooltip: 'This value was inferred from context. Please verify.',
    className: 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-700',
  },
  unknown: {
    icon: AlertTriangle,
    label: 'Needs Input',
    tooltip: 'No data found in transcript. Please provide this value.',
    className: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700',
  },
  manual: {
    icon: Pencil,
    label: 'Manual',
    tooltip: 'This value was manually entered or adjusted.',
    className: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700',
  },
};

export const ConfidenceIndicator = memo(function ConfidenceIndicator({
  confidence,
  fieldName,
  compact = false,
}: ConfidenceIndicatorProps) {
  // Don't show indicator if no confidence tracking
  if (!confidence) return null;

  const config = confidenceConfig[confidence];
  const Icon = config.icon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant="outline"
          className={cn(
            'flex items-center gap-1 cursor-help transition-all',
            config.className,
            compact && 'px-1.5 py-0.5'
          )}
        >
          <Icon className={cn('flex-shrink-0', compact ? 'w-3 h-3' : 'w-3.5 h-3.5')} />
          {!compact && <span className="text-xs">{config.label}</span>}
        </Badge>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <p className="font-medium mb-1">{fieldName}: {config.label}</p>
        <p className="text-sm text-muted-foreground">{config.tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
});

interface NeedsAttentionSectionProps {
  fields: Array<{
    name: string;
    confidence?: FieldConfidence;
    scrollToId?: string;
  }>;
  hasTranscriptAnalysis: boolean;
}

export const NeedsAttentionSection = memo(function NeedsAttentionSection({
  fields,
  hasTranscriptAnalysis,
}: NeedsAttentionSectionProps) {
  // Only show after transcript analysis
  if (!hasTranscriptAnalysis) return null;

  const needsAttention = fields.filter(f => f.confidence === 'unknown' || f.confidence === 'inferred');
  
  if (needsAttention.length === 0) return null;

  const handleScrollTo = (id?: string) => {
    if (!id) return;
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
      setTimeout(() => {
        element.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
      }, 2000);
    }
  };

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3 mb-4">
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
            Please verify these values
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-400 mb-2">
            AI could not find accurate data in the transcript
          </p>
          <div className="flex flex-wrap gap-2">
            {needsAttention.map((field) => (
              <button
                key={field.name}
                type="button"
                onClick={() => handleScrollTo(field.scrollToId)}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-white dark:bg-amber-900/40 border border-amber-300 dark:border-amber-600 rounded hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors"
              >
                {field.confidence === 'unknown' ? (
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                ) : (
                  <Sparkles className="w-3 h-3 text-purple-600" />
                )}
                {field.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});
