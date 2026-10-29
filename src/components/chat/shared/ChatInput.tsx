import { forwardRef, KeyboardEvent } from "react";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import { Send, Loader2, Mic, MicOff, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  placeholder?: string;
  disabled?: boolean;
  isLoading?: boolean;
  isOnline?: boolean;
  showVoice?: boolean;
  isRecording?: boolean;
  onToggleRecording?: () => void;
  maxLength?: number;
  showCharCount?: boolean;
  charCountThreshold?: number;
  variant?: "default" | "pill" | "bordered";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const ChatInput = forwardRef<HTMLInputElement, ChatInputProps>(({
  value,
  onChange,
  onSend,
  placeholder = "Type a message...",
  disabled = false,
  isLoading = false,
  isOnline = true,
  showVoice = false,
  isRecording = false,
  onToggleRecording,
  maxLength = 2000,
  showCharCount = true,
  charCountThreshold = 1800,
  variant = "default",
  size = "md",
  className,
}, ref) => {
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const charCount = value.length;
  const isNearLimit = charCount >= charCountThreshold;
  const canSend = value.trim() && !isLoading && !disabled && isOnline;

  const sizeClasses = {
    sm: "h-9 text-sm px-3",
    md: "h-11 text-sm px-4",
    lg: "h-12 text-base px-5",
  };

  const buttonSizes = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-11 w-11",
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        {/* Voice button */}
        {showVoice && onToggleRecording && (
          <Button
            type="button"
            size="icon"
            variant={isRecording ? "destructive" : "outline"}
            onClick={onToggleRecording}
            disabled={isLoading || disabled}
            className={cn(
              buttonSizes[size],
              "rounded-full shrink-0 transition-all",
              isRecording && "animate-pulse"
            )}
          >
            {isRecording ? (
              <MicOff className="w-4 h-4" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </Button>
        )}

        {/* Input field */}
        <div className="flex-1 relative">
          <input
            ref={ref}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isOnline ? placeholder : "You're offline..."}
            disabled={disabled || isLoading || !isOnline}
            maxLength={maxLength}
            className={cn(
              "w-full bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50 transition-all",
              variant === "default" && "rounded-full focus:ring-2 focus:ring-primary/50",
              variant === "pill" && "rounded-full border border-border focus:border-primary",
              variant === "bordered" && "rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20",
              sizeClasses[size]
            )}
          />

          {/* Character count */}
          <AnimatePresence>
            {showCharCount && isNearLimit && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={cn(
                  "absolute right-3 top-1/2 -translate-y-1/2 text-xs",
                  charCount >= maxLength ? "text-destructive" : "text-muted-foreground"
                )}
              >
                {charCount}/{maxLength}
              </motion.span>
            )}
          </AnimatePresence>

          {/* Offline indicator */}
          {!isOnline && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <WifiOff className="w-4 h-4 text-destructive" />
            </div>
          )}
        </div>

        {/* Send button */}
        <Button
          type="button"
          size="icon"
          onClick={onSend}
          disabled={!canSend}
          className={cn(
            buttonSizes[size],
            "rounded-full bg-primary hover:bg-primary/90 transition-all",
            "shadow-lg shadow-primary/20 hover:shadow-primary/30",
            "disabled:shadow-none"
          )}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
});

ChatInput.displayName = "ChatInput";

export default ChatInput;
