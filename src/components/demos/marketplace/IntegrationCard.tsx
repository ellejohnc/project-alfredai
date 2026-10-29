import { motion } from "framer-motion";
import { Star, Download, CheckCircle2, Zap, Sparkles, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Integration } from "./types";

interface IntegrationCardProps {
  integration: Integration;
  isInstalling: boolean;
  onInstall: () => void;
  onDetails: () => void;
}

export default function IntegrationCard({ 
  integration, 
  isInstalling, 
  onInstall,
  onDetails 
}: IntegrationCardProps) {
  const complexityColors = {
    easy: "bg-green-500/20 text-green-600",
    medium: "bg-amber-500/20 text-amber-600",
    advanced: "bg-red-500/20 text-red-600"
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "p-3 rounded-xl border transition-all cursor-pointer hover:shadow-md group",
        integration.installed 
          ? "bg-primary/5 border-primary/20" 
          : "bg-muted/50 border-border hover:border-primary/40"
      )}
      onClick={onDetails}
    >
      {/* Header */}
      <div className="flex items-start gap-2 mb-2">
        <div className={cn(
          "w-9 h-9 rounded-lg flex items-center justify-center bg-gradient-to-br shrink-0",
          integration.color
        )}>
          <integration.icon className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <h4 className="font-medium text-xs text-foreground truncate">{integration.name}</h4>
            {integration.popular && (
              <TrendingUp className="w-3 h-3 text-primary shrink-0" />
            )}
            {integration.new && (
              <span className="px-1 py-0.5 bg-primary/20 text-primary text-[8px] rounded font-medium shrink-0">
                NEW
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
              <span className="text-[10px] text-muted-foreground">{integration.rating}</span>
            </div>
            <span className="text-[10px] text-muted-foreground">•</span>
            <span className="text-[10px] text-muted-foreground">{integration.installs}</span>
          </div>
        </div>
      </div>
      
      {/* Description */}
      <p className="text-[10px] text-muted-foreground mb-2 line-clamp-2">
        {integration.description}
      </p>

      {/* Badges */}
      <div className="flex items-center gap-1 mb-2 flex-wrap">
        <span className={cn(
          "px-1.5 py-0.5 rounded text-[8px] font-medium",
          complexityColors[integration.complexity]
        )}>
          {integration.complexity}
        </span>
        <span className="px-1.5 py-0.5 bg-muted rounded text-[8px] text-muted-foreground">
          {integration.setupTime}
        </span>
        {integration.supportsAgentProtocol && (
          <span className="px-1.5 py-0.5 bg-violet-500/20 text-violet-600 rounded text-[8px] font-medium flex items-center gap-0.5">
            <Sparkles className="w-2.5 h-2.5" />
            Agent
          </span>
        )}
      </div>

      {/* Action */}
      {integration.installed ? (
        <div className="flex items-center gap-1 text-[10px] text-primary font-medium">
          <CheckCircle2 className="w-3 h-3" />
          Installed
        </div>
      ) : isInstalling ? (
        <div className="flex items-center gap-1 text-[10px] text-primary font-medium">
          <Zap className="w-3 h-3 animate-pulse" />
          Installing...
        </div>
      ) : (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onInstall();
          }}
          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors group-hover:text-primary"
        >
          <Download className="w-3 h-3" />
          Install
        </button>
      )}
    </motion.div>
  );
}
