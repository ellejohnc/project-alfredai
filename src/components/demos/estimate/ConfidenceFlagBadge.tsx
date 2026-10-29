import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle, HelpCircle, AlertTriangle } from "lucide-react";
import type { ConfidenceLevel } from "./types";

interface ConfidenceFlagBadgeProps {
  confidence: ConfidenceLevel;
  showLabel?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

const confidenceConfig: Record<ConfidenceLevel, {
  label: string;
  color: string;
  bgColor: string;
  icon: typeof CheckCircle;
}> = {
  high: {
    label: 'High',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    icon: CheckCircle,
  },
  medium: {
    label: 'Medium',
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
    icon: AlertTriangle,
  },
  low: {
    label: 'Low',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
    icon: AlertCircle,
  },
  missing: {
    label: 'Missing',
    color: 'text-gray-500',
    bgColor: 'bg-gray-100',
    icon: HelpCircle,
  },
};

export function ConfidenceFlagBadge({ 
  confidence, 
  showLabel = false, 
  size = 'sm',
  className 
}: ConfidenceFlagBadgeProps) {
  const config = confidenceConfig[confidence];
  const Icon = config.icon;
  
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';
  const padding = showLabel ? (size === 'sm' ? 'px-2 py-0.5' : 'px-2.5 py-1') : (size === 'sm' ? 'p-1' : 'p-1.5');
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';
  
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium",
        config.color,
        config.bgColor,
        padding,
        textSize,
        className
      )}
      title={`${config.label} confidence`}
    >
      <Icon className={iconSize} />
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}

export function ConfidenceLegend({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap gap-3 text-xs", className)}>
      {(Object.keys(confidenceConfig) as ConfidenceLevel[]).map((level) => (
        <div key={level} className="flex items-center gap-1.5">
          <ConfidenceFlagBadge confidence={level} size="sm" />
          <span className="text-muted-foreground">{confidenceConfig[level].label}</span>
        </div>
      ))}
    </div>
  );
}
