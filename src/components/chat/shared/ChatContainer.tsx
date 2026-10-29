import { forwardRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ChatContainerProps {
  children: React.ReactNode;
  variant?: "floating" | "embedded" | "modal" | "fullscreen";
  className?: string;
  isMobile?: boolean;
}

export const ChatContainer = forwardRef<HTMLDivElement, ChatContainerProps>(({
  children,
  variant = "floating",
  className,
  isMobile = false,
}, ref) => {
  const baseScrollStyles = "overscroll-behavior-contain touch-manipulation";
  
  const variants = {
    floating: cn(
      "fixed z-[60] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden",
      baseScrollStyles,
      isMobile 
        ? "bottom-24 right-3 w-[calc(100vw-24px)] h-[calc(100vh-120px)]"
        : "bottom-6 right-6 w-[380px] max-w-[calc(100vw-48px)] h-[600px] max-h-[calc(100vh-100px)]"
    ),
    embedded: cn("w-full bg-card/95 backdrop-blur-md border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden", baseScrollStyles),
    modal: cn("w-[95vw] md:max-w-2xl h-[85vh] md:h-[90vh] max-h-[800px] bg-background border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden", baseScrollStyles),
    fullscreen: cn("fixed inset-0 z-50 bg-background flex flex-col overflow-hidden", baseScrollStyles),
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: variant === "floating" && isMobile ? '100%' : 20, scale: variant === "floating" && !isMobile ? 0.95 : 1 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: variant === "floating" && isMobile ? '100%' : 20, scale: variant === "floating" && !isMobile ? 0.95 : 1 }}
      transition={{ type: "spring", damping: isMobile ? 30 : 25, stiffness: isMobile ? 350 : 300 }}
      className={cn(variants[variant], className)}
    >
      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-secondary/[0.02] pointer-events-none" />
      
      {/* Content */}
      <div className="relative flex flex-col h-full">
        {children}
      </div>
    </motion.div>
  );
});

ChatContainer.displayName = "ChatContainer";

export default ChatContainer;
