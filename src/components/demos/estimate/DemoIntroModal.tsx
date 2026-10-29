import { motion } from "framer-motion";
import { 
  FileStack, 
  User, 
  Sparkles, 
  ArrowRight, 
  Clock, 
  Play
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DemoIntroModalProps {
  isOpen: boolean;
  onStart: () => void;
  onSkipTutorial?: () => void;
  onClose?: () => void;
}

const steps = [
  { icon: '📁', title: 'Upload', description: 'Drawings, scope notes, schedules' },
  { icon: '✅', title: 'Confirm', description: 'Human scope interpretation' },
  { icon: '📊', title: 'Extract', description: 'AI reads tables & text' },
  { icon: '🧮', title: 'Estimate', description: 'Generate draft with confidence' },
  { icon: '⚡', title: 'Revise', description: 'Instant recalculations' },
];

export function DemoIntroModal({ isOpen, onStart, onSkipTutorial, onClose }: DemoIntroModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && onClose) onClose(); }}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden" hideCloseButton={!onClose}>
        {/* Hero section */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
              <FileStack className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">From Drawings to Draft Estimate</h2>
              <p className="text-sm text-white/70">Human + AI Workflow</p>
            </div>
          </div>
          
          {/* Key positioning line */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/10 rounded-lg p-3 border border-white/10"
          >
            <p className="text-sm font-medium text-center">
              <span className="text-primary-foreground/80">Humans read drawings.</span>
              {' '}
              <span className="text-white font-semibold">Alfred accelerates everything that follows.</span>
            </p>
          </motion.div>
        </div>

        {/* Steps preview */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Clock className="w-4 h-4" />
            <span>5-7 minute interactive demo</span>
          </div>

          <div className="flex items-center justify-between">
            {steps.map((step, idx) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + idx * 0.1 }}
                className="text-center flex-1"
              >
                <div className="text-2xl mb-1">{step.icon}</div>
                <p className="text-xs font-medium">{step.title}</p>
              </motion.div>
            ))}
          </div>

          {/* What this demo proves */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              What This Demo Proves
            </h4>
            <ul className="text-xs space-y-1 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>AI recognises drawings at a general level</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>AI is strong with text, tables, and schedules</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>AI accelerates estimating structure and revisions</span>
              </li>
              <li className="flex items-start gap-2">
                <User className="w-3 h-3 text-blue-500 mt-0.5" />
                <span>Human remains commercially responsible</span>
              </li>
            </ul>
          </div>

          {/* Action buttons */}
          <div className="space-y-2">
            <Button onClick={onStart} className="w-full" size="lg">
              <Play className="w-4 h-4 mr-2" />
              Start Guided Demo
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            {onSkipTutorial && (
              <Button 
                onClick={onSkipTutorial} 
                variant="ghost" 
                className="w-full text-muted-foreground hover:text-foreground"
                size="sm"
              >
                Skip Tutorial & Explore Freely
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
