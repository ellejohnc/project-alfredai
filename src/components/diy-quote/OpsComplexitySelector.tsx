import { memo } from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { HelpCircle, Zap, Settings, Layers, Building2, Crown } from 'lucide-react';
import { opsComplexityLevels } from '@/lib/pricingEngine';
import { cn } from '@/lib/utils';

interface OpsComplexitySelectorProps {
  value: string;
  onChange: (value: string) => void;
  tierSetupBase?: number;
  tierSetupCeiling?: number;
}

const complexityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  simple: Zap,
  standard: Settings,
  moderate: Layers,
  complex: Building2,
  enterprise: Crown,
};

export const OpsComplexitySelector = memo(function OpsComplexitySelector({
  value,
  onChange,
  tierSetupBase,
  tierSetupCeiling,
}: OpsComplexitySelectorProps) {
  const selectedComplexity = opsComplexityLevels.find(c => c.id === value) || opsComplexityLevels[1];
  
  // Calculate per-workflow rate preview
  const getPerWorkflowRate = (multiplier: number) => {
    if (!tierSetupBase || !tierSetupCeiling) return null;
    const range = Math.min(1, Math.max(0, (multiplier - 0.85) / (1.25 - 0.85)));
    return Math.round(tierSetupBase + (tierSetupCeiling - tierSetupBase) * range);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Label className="text-sm font-medium">Operational Complexity</Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-sm">
              <p className="font-medium mb-1">Setup Fee Scaling</p>
              <p className="text-sm text-muted-foreground mb-2">
                Select the complexity level based on the client's operational environment. 
                This affects the per-workflow setup cost within the $5K-$12K range.
              </p>
              <ul className="text-xs space-y-1 text-muted-foreground">
                <li><strong>Simple:</strong> Clean processes, standard integrations</li>
                <li><strong>Standard:</strong> Typical mid-market operations</li>
                <li><strong>Moderate:</strong> Multiple systems to integrate</li>
                <li><strong>Complex:</strong> Legacy systems, compliance needs</li>
                <li><strong>Enterprise:</strong> Multi-department, custom workflows</li>
              </ul>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <RadioGroup
        value={value}
        onValueChange={onChange}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2"
      >
        {opsComplexityLevels.map((level) => {
          const Icon = complexityIcons[level.id] || Settings;
          const isSelected = value === level.id;
          const rate = getPerWorkflowRate(level.multiplier);
          
          return (
            <TooltipProvider key={level.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <RadioGroupItem
                      value={level.id}
                      id={`complexity-${level.id}`}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={`complexity-${level.id}`}
                      className={cn(
                        "flex flex-col items-center justify-center rounded-lg border-2 p-3 cursor-pointer transition-all",
                        "hover:border-primary/50 hover:bg-accent/50",
                        isSelected
                          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                          : "border-border bg-card"
                      )}
                    >
                      <Icon className={cn(
                        "h-5 w-5 mb-1.5",
                        isSelected ? "text-primary" : "text-muted-foreground"
                      )} />
                      <span className={cn(
                        "text-xs font-medium text-center",
                        isSelected ? "text-primary" : "text-foreground"
                      )}>
                        {level.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground mt-0.5">
                        ×{level.multiplier.toFixed(2)}
                      </span>
                    </Label>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p className="font-medium">{level.name}</p>
                  <p className="text-sm text-muted-foreground">{level.description}</p>
                  {level.multiplier !== 1 && (
                    <p className="text-xs mt-1">
                      {level.multiplier < 1 
                        ? `${Math.round((1 - level.multiplier) * 100)}% below standard`
                        : `${Math.round((level.multiplier - 1) * 100)}% above standard`
                      }
                    </p>
                  )}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </RadioGroup>

      {/* Current selection summary */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Badge variant="outline" className="text-xs">
          {selectedComplexity.name}
        </Badge>
        <span className="text-xs">{selectedComplexity.description}</span>
      </div>
    </div>
  );
});
