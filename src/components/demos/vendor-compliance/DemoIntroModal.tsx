import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, 
  Mail, 
  Users, 
  CheckCircle, 
  MessageSquare, 
  Cloud,
  Zap,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface DemoIntroModalProps {
  isOpen: boolean;
  onDismiss: (startTour: boolean, dontShowAgain: boolean) => void;
}

export function DemoIntroModal({ isOpen, onDismiss }: DemoIntroModalProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const features = [
    { icon: Mail, title: "AI Email Intake" },
    { icon: Users, title: "Vendor Matching" },
    { icon: MessageSquare, title: "Multi-Channel Alerts" },
    { icon: Cloud, title: "SharePoint Sync" },
    { icon: Zap, title: "Batch Processing" },
    { icon: Shield, title: "Compliance Dashboard" }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3 }}
            className="relative bg-card border border-border rounded-xl shadow-2xl max-w-lg w-full"
          >
            {/* Close Button */}
            <button
              onClick={() => onDismiss(false, dontShowAgain)}
              className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-muted transition-colors z-10"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>

            {/* Header - Compact */}
            <div className="p-5 pb-3 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/20 mb-3">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-xl font-bold">AI Vendor Compliance Agent</h2>
              <p className="text-sm text-muted-foreground mt-1.5">
                Automate subcontractor document tracking with AI-powered verification and multi-channel escalation.
              </p>
            </div>

            {/* Content - Compact */}
            <div className="px-5 pb-4 space-y-4">
              {/* Who & Industries combined */}
              <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground justify-center">
                <span className="px-2 py-1 rounded-full bg-muted">General Contractors</span>
                <span className="px-2 py-1 rounded-full bg-muted">Compliance Managers</span>
                <span className="px-2 py-1 rounded-full bg-muted">Construction</span>
                <span className="px-2 py-1 rounded-full bg-muted">Property Dev</span>
              </div>

              {/* Features Grid - Responsive 2x3 on mobile, 3x2 on larger */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {features.map((feature, idx) => (
                  <div 
                    key={idx}
                    className="flex flex-col items-center p-2.5 rounded-lg bg-muted/40 text-center"
                  >
                    <feature.icon className="w-4 h-4 text-primary mb-1" />
                    <p className="text-[11px] font-medium leading-tight">{feature.title}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer - Compact */}
            <div className="px-5 py-3 border-t border-border bg-muted/30 rounded-b-xl">
              <div className="flex items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                  <Checkbox 
                    checked={dontShowAgain}
                    onCheckedChange={(checked) => setDontShowAgain(checked === true)}
                    className="w-3.5 h-3.5"
                  />
                  Don't show again
                </label>
                
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => onDismiss(false, dontShowAgain)}
                  >
                    Skip
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => onDismiss(true, dontShowAgain)}
                  >
                    <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                    Start Tour
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default DemoIntroModal;
