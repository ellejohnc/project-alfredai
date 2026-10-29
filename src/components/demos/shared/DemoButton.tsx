import { memo } from "react";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface DemoButtonProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "outline" | "ghost" | "destructive" | "secondary" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  onClick?: () => void;
  featureName?: string;
  showDemoBadge?: boolean;
}

/**
 * Demo-only button wrapper component
 * Shows a toast notification explaining the feature is a demo
 */
const DemoButton = memo(function DemoButton({ 
  children, 
  className, 
  variant = "outline", 
  size = "default",
  onClick,
  featureName = "This feature",
  showDemoBadge = true
}: DemoButtonProps) {
  const handleClick = () => {
    toast({
      title: "Demo Feature",
      description: `${featureName} would work in the live product. This is a demonstration.`,
      duration: 2500,
    });
    onClick?.();
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant={variant} 
            size={size}
            className={cn("relative", className)}
            onClick={handleClick}
          >
            {children}
            {showDemoBadge && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <div className="flex items-center gap-1">
            <Info className="h-3 w-3" />
            Demo only - click to see how it works
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

export default DemoButton;
