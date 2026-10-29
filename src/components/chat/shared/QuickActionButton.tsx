import { motion } from "framer-motion";
import { LucideIcon, Calendar, Play, Plus, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickActionButtonProps {
  label: string;
  onClick: () => void;
  icon?: LucideIcon;
  variant?: "default" | "primary" | "cta" | "dashed" | "rainbow";
  size?: "sm" | "md" | "lg";
  showArrow?: boolean;
  disabled?: boolean;
  className?: string;
}

export const QuickActionButton = ({
  label,
  onClick,
  icon: Icon,
  variant = "default",
  size = "md",
  showArrow = false,
  disabled = false,
  className,
}: QuickActionButtonProps) => {
  const sizeClasses = {
    sm: "text-xs px-3 py-1.5",
    md: "text-sm px-4 py-2",
    lg: "text-sm px-5 py-2.5",
  };

  const variantClasses = {
    default: "border border-border hover:bg-muted text-muted-foreground hover:text-foreground",
    primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20",
    cta: "bg-gradient-to-r from-primary to-pink-500 text-primary-foreground font-medium shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:scale-105",
    dashed: "border border-dashed border-border hover:bg-muted text-muted-foreground hover:text-foreground",
    rainbow: "rainbow-button text-foreground font-medium hover:scale-105",
  };

  return (
    <motion.button
      whileHover={{ scale: variant === "cta" ? 1.05 : 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded-full transition-all duration-200 flex items-center gap-1.5",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
      <span>{label}</span>
      {showArrow && <ArrowRight className="w-3.5 h-3.5" />}
    </motion.button>
  );
};

// Pre-configured quick action variants
export const BookDemoAction = ({ onClick, className }: { onClick: () => void; className?: string }) => (
  <QuickActionButton
    label="Book an Impact Conversation"
    onClick={onClick}
    icon={Calendar}
    variant="default"
    className={className}
  />
);

export const ViewTimesAction = ({ onClick, className }: { onClick: () => void; className?: string }) => (
  <QuickActionButton
    label="View Available Times"
    onClick={onClick}
    icon={Calendar}
    variant="cta"
    showArrow
    className={className}
  />
);

export const SeeDemosAction = ({ onClick, className }: { onClick: () => void; className?: string }) => (
  <QuickActionButton
    label="See Demos First"
    onClick={onClick}
    icon={Play}
    variant="default"
    showArrow
    className={cn("border-2 border-primary text-primary font-medium hover:bg-primary/10", className)}
  />
);

export const OtherAction = ({ onClick, className }: { onClick: () => void; className?: string }) => (
  <QuickActionButton
    label="Other"
    onClick={onClick}
    icon={Plus}
    variant="dashed"
    className={className}
  />
);

export default QuickActionButton;
