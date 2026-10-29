import { X, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatHeaderProps {
  title?: string;
  subtitle?: string;
  isOnline?: boolean;
  showClose?: boolean;
  onClose?: () => void;
  variant?: "default" | "gradient" | "minimal";
  className?: string;
  children?: React.ReactNode;
}

export const ChatHeader = ({
  title = "Alfred",
  subtitle = "alfred ai Assistant",
  isOnline = true,
  showClose = true,
  onClose,
  variant = "default",
  className,
  children,
}: ChatHeaderProps) => {
  return (
    <div
      className={cn(
        "flex items-center justify-between px-4 py-3 border-b border-border shrink-0",
        variant === "default" && "bg-background",
        variant === "gradient" && "bg-muted/50",
        variant === "minimal" && "bg-transparent",
        className
      )}
    >
      <div className="flex items-center gap-3">
        {/* Avatar - solid color */}
        <div className="relative w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center">
          <img src="/alfred-ai-loader.png" alt="alfred ai" className="w-8 h-8 object-contain" />
          
          {/* Online indicator */}
          <span
            className={cn(
              "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background",
              isOnline ? "bg-emerald-500" : "bg-muted"
            )}
          />
        </div>

        <div>
          <h3 className="font-semibold text-foreground">{title}</h3>
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground">{subtitle}</p>
            {!isOnline && (
              <span className="flex items-center gap-1 text-xs text-destructive">
                <WifiOff className="w-3 h-3" />
                Offline
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {children}
        
        {showClose && onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-full hover:bg-accent hover:text-accent-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default ChatHeader;
