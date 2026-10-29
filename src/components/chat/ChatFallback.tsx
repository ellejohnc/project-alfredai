import { motion } from "framer-motion";
import { AlertCircle, RefreshCw, Calendar, Trash2, WifiOff, Clock, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ChatErrorType = 
  | "rate_limit"
  | "payment_required"
  | "network_error"
  | "timeout"
  | "service_error"
  | "unknown";

const FALLBACK_MESSAGES: Record<ChatErrorType, { title: string; message: string; icon: typeof AlertCircle }> = {
  rate_limit: {
    title: "High Demand",
    message: "I'm getting a lot of questions right now! Please try again in a moment, or book a demo with our team.",
    icon: Clock,
  },
  payment_required: {
    title: "Taking a Break",
    message: "I'm taking a quick break. In the meantime, book a demo with our team to continue the conversation!",
    icon: CreditCard,
  },
  network_error: {
    title: "Connection Issue",
    message: "Looks like you're offline. Check your connection and try again.",
    icon: WifiOff,
  },
  timeout: {
    title: "Taking Too Long",
    message: "That's taking longer than expected. Let me try again, or you can book a demo instead.",
    icon: Clock,
  },
  service_error: {
    title: "Technical Difficulties",
    message: "I'm having technical difficulties. Our team would love to chat with you directly!",
    icon: AlertCircle,
  },
  unknown: {
    title: "Something Went Wrong",
    message: "Something went wrong on my end. Would you like to try again or book a demo with our team?",
    icon: AlertCircle,
  },
};

interface ChatFallbackProps {
  errorType: ChatErrorType;
  onRetry?: () => void;
  onBookCall?: () => void;
  onClear?: () => void;
  canRetry?: boolean;
  retryCount?: number;
}

const ChatFallback = ({
  errorType,
  onRetry,
  onBookCall,
  onClear,
  canRetry = true,
  retryCount = 0,
}: ChatFallbackProps) => {
  const fallback = FALLBACK_MESSAGES[errorType];
  const IconComponent = fallback.icon;
  const maxRetriesReached = retryCount >= 3;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 space-y-3"
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
          <IconComponent className="w-4 h-4 text-destructive" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-foreground text-sm">{fallback.title}</h4>
          <p className="text-sm text-muted-foreground mt-0.5">{fallback.message}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        {canRetry && !maxRetriesReached && onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="gap-1.5 text-xs h-8"
          >
            <RefreshCw className="w-3 h-3" />
            Try Again {retryCount > 0 && `(${3 - retryCount} left)`}
          </Button>
        )}

        {onBookCall && (
          <Button
            size="sm"
            onClick={onBookCall}
            className="gap-1.5 text-xs h-8 bg-primary hover:bg-primary-hover"
          >
            <Calendar className="w-3 h-3" />
            Book a demo
          </Button>
        )}

        {onClear && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="gap-1.5 text-xs h-8 text-muted-foreground"
          >
            <Trash2 className="w-3 h-3" />
            Start Fresh
          </Button>
        )}
      </div>

      {maxRetriesReached && (
        <p className="text-xs text-muted-foreground">
          Multiple attempts failed. Please book a demo with our team for immediate assistance.
        </p>
      )}
    </motion.div>
  );
};

export default ChatFallback;
