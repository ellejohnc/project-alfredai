import { cn } from "@/lib/utils";
import { CONSTRUCTION_PLATFORMS } from "./integrationData";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Building2, Check, Plug } from "lucide-react";

interface IntegrationBadgesProps {
  connectedPlatforms?: string[];
  onConnect?: (platformId: string) => void;
  compact?: boolean;
}

export function IntegrationBadges({ 
  connectedPlatforms = ['procore', 'sage300'], 
  onConnect,
  compact = false 
}: IntegrationBadgesProps) {
  const displayPlatforms = compact 
    ? CONSTRUCTION_PLATFORMS.slice(0, 4) 
    : CONSTRUCTION_PLATFORMS;

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1.5">
        {!compact && (
          <span className="text-xs text-muted-foreground mr-1">Integrations:</span>
        )}
        
        {displayPlatforms.map((platform) => {
          const isConnected = connectedPlatforms.includes(platform.id);
          
          return (
            <Tooltip key={platform.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onConnect?.(platform.id)}
                  className={cn(
                    "relative flex items-center justify-center w-6 h-6 rounded-md border transition-all",
                    isConnected 
                      ? "border-transparent" 
                      : "border-dashed border-muted-foreground/30 hover:border-primary/50",
                    "hover:scale-110"
                  )}
                  style={{ 
                    backgroundColor: isConnected ? platform.color + '20' : 'transparent',
                  }}
                >
                  <Building2 
                    className="w-3.5 h-3.5" 
                    style={{ color: isConnected ? platform.color : 'var(--muted-foreground)' }}
                  />
                  {isConnected && (
                    <div 
                      className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 flex items-center justify-center"
                    >
                      <Check className="w-1.5 h-1.5 text-white" />
                    </div>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                <div className="flex items-center gap-1.5">
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: platform.color }} 
                  />
                  <span className="font-medium">{platform.name}</span>
                  {isConnected ? (
                    <Badge variant="outline" className="text-[9px] py-0 h-4 text-green-600 border-green-500/30">
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[9px] py-0 h-4">
                      Click to connect
                    </Badge>
                  )}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {platform.category}
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
        
        {compact && CONSTRUCTION_PLATFORMS.length > 4 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-center w-6 h-6 rounded-md border border-dashed border-muted-foreground/30 text-[10px] text-muted-foreground">
                +{CONSTRUCTION_PLATFORMS.length - 4}
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {CONSTRUCTION_PLATFORMS.slice(4).map(p => p.name).join(', ')}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}

export default IntegrationBadges;
