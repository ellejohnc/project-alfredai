import { motion } from "framer-motion";
import { 
  X, 
  Star, 
  Clock, 
  CheckCircle2, 
  Sparkles,
  Download,
  ExternalLink,
  TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Integration } from "./types";

interface IntegrationDetailProps {
  integration: Integration;
  isOpen: boolean;
  onClose: () => void;
  onInstall: () => void;
}

export default function IntegrationDetail({ 
  integration, 
  isOpen, 
  onClose, 
  onInstall 
}: IntegrationDetailProps) {
  if (!isOpen) return null;

  const complexityLabels = {
    easy: { label: "Beginner Friendly", color: "text-green-600 bg-green-500/20" },
    medium: { label: "Intermediate", color: "text-amber-600 bg-amber-500/20" },
    advanced: { label: "Advanced Setup", color: "text-red-600 bg-red-500/20" }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className="absolute inset-0 bg-card z-10 overflow-y-auto"
    >
      {/* Header */}
      <div className={cn(
        "px-4 py-4 border-b border-border bg-gradient-to-r",
        integration.color
      )}>
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute top-2 right-2 h-8 w-8"
          onClick={onClose}
        >
          <X className="w-4 h-4" />
        </Button>
        
        <div className="flex items-center gap-3 mt-2">
          <div className="w-14 h-14 rounded-xl bg-background/50 flex items-center justify-center">
            <integration.icon className="w-7 h-7 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">{integration.name}</h3>
              {integration.popular && (
                <span className="px-2 py-0.5 bg-primary/20 text-primary text-[10px] rounded-full font-medium flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Popular
                </span>
              )}
              {integration.new && (
                <span className="px-2 py-0.5 bg-green-500/20 text-green-600 text-[10px] rounded-full font-medium">
                  NEW
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{integration.category}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Stats */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span className="font-medium">{integration.rating}</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Download className="w-4 h-4" />
            {integration.installs} installs
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            {integration.setupTime}
          </div>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn(
            "px-2 py-1 rounded-full text-xs font-medium",
            complexityLabels[integration.complexity].color
          )}>
            {complexityLabels[integration.complexity].label}
          </span>
          {integration.supportsAgentProtocol && (
            <span className="px-2 py-1 bg-violet-500/20 text-violet-600 rounded-full text-xs font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Supports Agent Protocol
            </span>
          )}
        </div>

        {/* Description */}
        <div>
          <h4 className="font-medium text-sm mb-2">About</h4>
          <p className="text-sm text-muted-foreground">{integration.longDescription}</p>
        </div>

        {/* Features */}
        <div>
          <h4 className="font-medium text-sm mb-2">Features</h4>
          <div className="grid grid-cols-2 gap-2">
            {integration.features.map((feature, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                {feature}
              </div>
            ))}
          </div>
        </div>

        {/* Setup Steps Preview */}
        <div>
          <h4 className="font-medium text-sm mb-2">Setup Process</h4>
          <div className="space-y-2">
            {integration.setupSteps.map((step, idx) => (
              <div 
                key={step.id} 
                className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg"
              >
                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-medium flex items-center justify-center">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{step.title}</div>
                  <div className="text-[10px] text-muted-foreground">{step.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 p-4 bg-card border-t border-border">
        {integration.installed ? (
          <Button className="w-full" variant="secondary" disabled>
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Already Installed
          </Button>
        ) : (
          <Button className="w-full" onClick={onInstall}>
            <Download className="w-4 h-4 mr-2" />
            Install {integration.name}
          </Button>
        )}
      </div>
    </motion.div>
  );
}
