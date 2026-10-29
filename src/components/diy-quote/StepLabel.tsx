import { memo } from 'react';
import { cn } from '@/lib/utils';

interface StepLabelProps {
  step: number | string;
  title: string;
  description?: string;
  isOptional?: boolean;
}

export const StepLabel = memo(function StepLabel({
  step,
  title,
  description,
  isOptional = false,
}: StepLabelProps) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div className={cn(
        "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold",
        "bg-primary text-primary-foreground"
      )}>
        {step}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-medium text-foreground">{title}</h4>
          {isOptional && (
            <span className="text-xs text-muted-foreground">(Optional)</span>
          )}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
    </div>
  );
});
