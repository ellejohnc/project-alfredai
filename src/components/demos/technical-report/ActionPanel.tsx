import { motion } from "framer-motion";
import { 
  Play, 
  Send, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  DollarSign,
  FileDown,
  Users,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { 
  MOCK_RECOMMENDATIONS, 
  MOCK_PATTERNS, 
  getPriorityColor,
  INITIAL_DATA_SOURCES 
} from "./demoData";
import type { DataSource, Stakeholder } from "./types";

interface ActionPanelProps {
  currentStep: number;
  stepProgress: number;
  dataSources: DataSource[];
  stakeholders: Stakeholder[];
  exportFormat: 'pdf' | 'docx' | 'html';
  onAdvanceStep: () => void;
  onToggleStakeholder: (id: string) => void;
  onSetFormat: (format: 'pdf' | 'docx' | 'html') => void;
  demoComplete: boolean;
}

export function ActionPanel({
  currentStep,
  stepProgress,
  dataSources,
  stakeholders,
  exportFormat,
  onAdvanceStep,
  onToggleStakeholder,
  onSetFormat,
  demoComplete,
}: ActionPanelProps) {
  const selectedSourcesCount = dataSources.filter(s => s.selected).length;
  const selectedStakeholdersCount = stakeholders.filter(s => s.selected).length;

  // Render content based on current step
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Sources step
        return (
          <div className="space-y-4">
            <div className="bg-muted/30 border border-border rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-foreground">Sources Selected</span>
                <Badge variant="outline" className="text-xs">
                  {selectedSourcesCount} of {dataSources.length}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Select data sources from the panel to include in your technical report.
              </p>
            </div>
            <Button 
              onClick={onAdvanceStep} 
              className="w-full gap-2"
              disabled={selectedSourcesCount === 0}
            >
              <Zap className="w-4 h-4" />
              Start Extraction
            </Button>
          </div>
        );

      case 1: // Ingestion step
        return (
          <div className="space-y-4">
            <div className="bg-muted/30 border border-border rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-foreground">AI Extraction</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="text-foreground font-medium">{Math.round(stepProgress)}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${stepProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            </div>
            <Button 
              onClick={onAdvanceStep} 
              className="w-full gap-2"
              disabled={stepProgress < 50}
            >
              <Play className="w-4 h-4" />
              Analyze Patterns
            </Button>
          </div>
        );

      case 2: // Patterns step
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              {MOCK_PATTERNS.slice(0, 3).map((pattern, index) => (
                <motion.div
                  key={pattern.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    "p-2 rounded-lg border",
                    pattern.severity === 'critical' && "bg-rose-500/10 border-rose-500/30",
                    pattern.severity === 'warning' && "bg-amber-500/10 border-amber-500/30",
                    pattern.severity === 'info' && "bg-blue-500/10 border-blue-500/30"
                  )}
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle className={cn(
                      "w-3.5 h-3.5 mt-0.5",
                      pattern.severity === 'critical' && "text-rose-500",
                      pattern.severity === 'warning' && "text-amber-500",
                      pattern.severity === 'info' && "text-blue-500"
                    )} />
                    <div>
                      <p className="text-xs font-medium text-foreground">{pattern.title}</p>
                      <p className="text-[10px] text-muted-foreground">{pattern.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            <Button onClick={onAdvanceStep} className="w-full gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Check Compliance
            </Button>
          </div>
        );

      case 3: // Compliance step
        return (
          <div className="space-y-4">
            <div className="bg-muted/30 border border-border rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-foreground">Compliance Summary</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 bg-emerald-500/10 rounded-lg">
                  <p className="text-lg font-bold text-emerald-600">3</p>
                  <p className="text-[10px] text-muted-foreground">Passed</p>
                </div>
                <div className="text-center p-2 bg-rose-500/10 rounded-lg">
                  <p className="text-lg font-bold text-rose-600">1</p>
                  <p className="text-[10px] text-muted-foreground">Failed</p>
                </div>
                <div className="text-center p-2 bg-amber-500/10 rounded-lg">
                  <p className="text-lg font-bold text-amber-600">2</p>
                  <p className="text-[10px] text-muted-foreground">Review</p>
                </div>
              </div>
            </div>
            <Button onClick={onAdvanceStep} className="w-full gap-2">
              <Play className="w-4 h-4" />
              Generate Report
            </Button>
          </div>
        );

      case 4: // Report generation step
        return (
          <div className="space-y-4">
            <div className="bg-muted/30 border border-border rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-primary animate-pulse" />
                <span className="text-xs font-semibold text-foreground">Generating Report</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Sections Complete</span>
                  <span className="text-foreground font-medium">{Math.round(stepProgress)}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${stepProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            </div>
            <Button 
              onClick={onAdvanceStep} 
              className="w-full gap-2"
              disabled={stepProgress < 50}
            >
              <Play className="w-4 h-4" />
              Get Recommendations
            </Button>
          </div>
        );

      case 5: // Recommendations step
        return (
          <div id="tr-recommendations" className="space-y-4">
            <ScrollArea className="h-[280px]">
              <div className="space-y-2 pr-2">
                {MOCK_RECOMMENDATIONS.map((rec, index) => (
                  <motion.div
                    key={rec.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      "p-3 rounded-lg border",
                      getPriorityColor(rec.priority)
                    )}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-xs font-medium text-foreground">{rec.title}</p>
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {rec.priority}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground mb-2">{rec.description}</p>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {rec.timeline}
                      </div>
                      {rec.estimatedCost && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          {rec.estimatedCost}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
            <Button onClick={onAdvanceStep} className="w-full gap-2">
              <FileDown className="w-4 h-4" />
              Export Report
            </Button>
          </div>
        );

      case 6: // Export step
        return (
          <div id="tr-export-panel" className="space-y-4">
            {/* Format selection */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-foreground">Export Format</span>
              <div className="flex gap-2">
                {(['pdf', 'docx', 'html'] as const).map((format) => (
                  <button
                    key={format}
                    onClick={() => onSetFormat(format)}
                    className={cn(
                      "flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all border min-h-[44px]",
                      exportFormat === format
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/50 text-muted-foreground border-border hover:border-primary/50"
                    )}
                  >
                    {format.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Stakeholders */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">Recipients</span>
                <Badge variant="outline" className="text-xs">
                  {selectedStakeholdersCount} selected
                </Badge>
              </div>
              <div className="space-y-2">
                {stakeholders.map((stakeholder) => (
                  <div
                    key={stakeholder.id}
                    onClick={() => onToggleStakeholder(stakeholder.id)}
                    className={cn(
                      "flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-all min-h-[44px]",
                      stakeholder.selected
                        ? "bg-primary/5 border-primary/30"
                        : "bg-muted/30 border-border hover:border-primary/30"
                    )}
                  >
                    <Checkbox
                      checked={stakeholder.selected}
                      className="pointer-events-none"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{stakeholder.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{stakeholder.role}</p>
                    </div>
                    <Users className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  </div>
                ))}
              </div>
            </div>

            {/* Send button */}
            <Button 
              className="w-full gap-2 glow-pulse"
              disabled={selectedStakeholdersCount === 0}
            >
              <Send className="w-4 h-4" />
              Send Report
            </Button>

            {demoComplete && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 text-center"
              >
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                <p className="text-xs font-medium text-foreground">Demo Complete!</p>
                <p className="text-[10px] text-muted-foreground">Report sent to stakeholders</p>
              </motion.div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm text-foreground">AI Actions</h3>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        {renderStepContent()}
      </div>
    </div>
  );
}
