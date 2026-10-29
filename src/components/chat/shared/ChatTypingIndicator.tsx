import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ChatAvatar } from "./ChatAvatar";

interface ChatTypingIndicatorProps {
  showAvatar?: boolean;
  avatarSize?: "sm" | "md" | "lg";
  showSlowMessage?: boolean;
  slowMessageThreshold?: number;
  loadingDuration?: number;
  variant?: "dots" | "pulse" | "wave";
  className?: string;
}

export const ChatTypingIndicator = ({
  showAvatar = true,
  avatarSize = "sm",
  showSlowMessage = true,
  slowMessageThreshold = 10,
  loadingDuration = 0,
  variant = "dots",
  className,
}: ChatTypingIndicatorProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn("flex gap-2.5 items-start", className)}
    >
      {showAvatar && <ChatAvatar role="assistant" size={avatarSize} />}
      
      <div className="bg-muted/80 backdrop-blur-sm border border-border/50 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          {variant === "dots" && (
            <div className="flex items-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 bg-primary/60 rounded-full"
                  animate={{
                    y: [-2, 2, -2],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: i * 0.15,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>
          )}

          {variant === "pulse" && (
            <div className="flex items-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 bg-primary/60 rounded-full"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>
          )}

          {variant === "wave" && (
            <div className="flex items-center gap-0.5 h-4">
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-primary/60 rounded-full"
                  animate={{
                    height: ["4px", "16px", "4px"],
                  }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: i * 0.1,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>
          )}

          {showSlowMessage && loadingDuration >= slowMessageThreshold && (
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-muted-foreground ml-2"
            >
              Taking longer than usual...
            </motion.span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ChatTypingIndicator;
