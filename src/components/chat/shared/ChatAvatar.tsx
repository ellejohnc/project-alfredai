import { User } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatAvatarProps {
  role: "user" | "assistant";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "w-6 h-6",
  md: "w-8 h-8",
  lg: "w-10 h-10",
};

const iconSizes = {
  sm: "w-3 h-3",
  md: "w-4 h-4",
  lg: "w-5 h-5",
};

export const ChatAvatar = ({ role, size = "md", className }: ChatAvatarProps) => {
  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center shrink-0",
        sizeClasses[size],
        role === "assistant"
          ? "bg-background border border-border"
          : "bg-muted border border-border",
        className
      )}
    >
      {role === "assistant" ? (
        <img src="/alfred-ai-loader.png" alt="" aria-hidden="true" className="h-[80%] w-[80%] object-contain" />
      ) : (
        <User className={cn(iconSizes[size], "text-muted-foreground")} />
      )}
    </div>
  );
};

export default ChatAvatar;
