import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ChatAvatar } from "./ChatAvatar";
import { DemoMarkdown } from "@/components/demos/DemoMarkdown";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  showAvatar?: boolean;
  avatarSize?: "sm" | "md" | "lg";
  variant?: "default" | "compact" | "inline";
  animationDelay?: number;
  className?: string;
  onSuggestionClick?: (suggestion: string) => void;
}

// Parse suggested replies from assistant response (these are visitor responses, not questions)
const parseSuggestedReplies = (content: string): { mainContent: string; suggestions: string[] } => {
  // Match both "Quick replies:" and legacy "Quick questions:" for backwards compatibility
  const quickRepliesPattern = /\*\*Quick (?:replies|questions):\*\*\s*([\s\S]*?)$/i;
  const match = content.match(quickRepliesPattern);
  
  if (!match) {
    return { mainContent: content, suggestions: [] };
  }
  
  const mainContent = content.replace(quickRepliesPattern, '').trim();
  const suggestionsText = match[1];
  
  // Extract bullet points - clean up quotes and dashes
  const suggestions = suggestionsText
    .split(/\n/)
    .map(line => line.replace(/^[-•*]\s*/, '').replace(/^["']|["']$/g, '').trim())
    .filter(line => line.length > 0 && line.length < 60);
  
  return { mainContent, suggestions };
};

export const ChatMessage = ({
  role,
  content,
  showAvatar = true,
  avatarSize = "sm",
  variant = "default",
  animationDelay = 0,
  className,
  onSuggestionClick,
}: ChatMessageProps) => {
  const isUser = role === "user";

  // Clean content (remove special tokens)
  const cleanedContent = content
    .replace("[BOOK_DEMO]", "")
    .replace("[SHOW_CALENDAR]", "")
    .trim() || (content.includes("[BOOK_DEMO]") ? "Opening the booking form for you..." : "");

  // Parse suggestions for assistant messages
  const { mainContent, suggestions } = isUser 
    ? { mainContent: cleanedContent, suggestions: [] }
    : parseSuggestedReplies(cleanedContent);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        delay: animationDelay, 
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1]
      }}
      className={cn(
        "flex flex-col gap-2",
        className
      )}
    >
      <div className={cn(
        "flex gap-2.5",
        isUser ? "justify-end" : "justify-start",
        variant === "compact" && "gap-2",
      )}>
        {/* Assistant avatar on left */}
        {!isUser && showAvatar && (
          <ChatAvatar role="assistant" size={avatarSize} />
        )}
        
        {/* Message bubble */}
        <div
          className={cn(
            "relative max-w-[85%] px-4 py-2.5 transition-shadow",
            variant === "default" && "rounded-2xl",
            variant === "compact" && "rounded-xl px-3 py-2",
            variant === "inline" && "rounded-xl",
            isUser
              ? "bg-primary text-primary-foreground rounded-br-md shadow-lg shadow-primary/10"
              : "bg-muted text-foreground rounded-bl-md shadow-sm",
            // Glassmorphism for assistant messages
            !isUser && "backdrop-blur-sm border border-border/50"
          )}
        >
          {isUser ? (
            <p className={cn(
              "leading-relaxed whitespace-pre-wrap",
              variant === "compact" ? "text-xs" : "text-sm"
            )}>
              {mainContent}
            </p>
          ) : (
            <DemoMarkdown 
              content={mainContent} 
              className={cn(
                variant === "compact" ? "text-xs" : "text-sm",
                "[&_strong]:text-foreground [&_em]:text-muted-foreground [&_.text-slate-200]:text-foreground [&_.text-slate-300]:text-muted-foreground [&_.text-white]:text-foreground"
              )}
            />
          )}
        </div>

        {/* User avatar on right */}
        {isUser && showAvatar && (
          <ChatAvatar role="user" size={avatarSize} />
        )}
      </div>

      {/* Suggested Questions - only for assistant messages */}
      {!isUser && suggestions.length > 0 && onSuggestionClick && (
        <motion.div 
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.2 }}
          className={cn(
            "flex flex-wrap gap-1.5",
            showAvatar ? "ml-10" : "ml-0"
          )}
        >
          {suggestions.slice(0, 3).map((suggestion, idx) => (
            <motion.button
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + idx * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSuggestionClick(suggestion)}
              className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-colors text-left"
            >
              {suggestion}
            </motion.button>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
};

export default ChatMessage;
