import { motion } from "framer-motion";
import { Send, FileText, File, Code, Users, Mail, CheckCircle2, Download, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Stakeholder } from "./types";

interface ExportDistributionStepProps {
  stakeholders: Stakeholder[];
  exportFormat: "pdf" | "docx" | "html";
  onToggleStakeholder: (id: string) => void;
  onSetFormat: (format: "pdf" | "docx" | "html") => void;
  isComplete: boolean;
}

const formatOptions = [
  { id: "pdf" as const, label: "PDF", icon: FileText, description: "Professional print-ready" },
  { id: "docx" as const, label: "Word", icon: File, description: "Editable document" },
  { id: "html" as const, label: "HTML", icon: Code, description: "Web-ready format" },
];

export default function ExportDistributionStep({
  stakeholders,
  exportFormat,
  onToggleStakeholder,
  onSetFormat,
  isComplete,
}: ExportDistributionStepProps) {
  const selectedStakeholders = stakeholders.filter(s => s.selected);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {isComplete ? (
        // Completion state
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-6 space-y-4"
        >
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Report Complete!</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Technical report generated and ready for distribution
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Badge className="bg-primary/20 text-primary border-primary/30">
              <FileText className="w-3 h-3 mr-1" />
              {exportFormat.toUpperCase()} Generated
            </Badge>
            <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
              <Mail className="w-3 h-3 mr-1" />
              {selectedStakeholders.length} Recipients
            </Badge>
          </div>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors min-h-[44px]">
            <Download className="w-4 h-4" />
            Download Report
          </button>
        </motion.div>
      ) : (
        <>
          {/* Format selection */}
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <Send className="w-4 h-4 text-primary" />
              Select export format
            </div>
            <div className="grid grid-cols-3 gap-2">
              {formatOptions.map(format => {
                const Icon = format.icon;
                return (
                  <button
                    key={format.id}
                    onClick={() => onSetFormat(format.id)}
                    className={`p-3 rounded-lg border transition-all text-center min-h-[70px] ${
                      exportFormat === format.id
                        ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 mx-auto mb-1 ${
                        exportFormat === format.id ? "text-primary" : "text-muted-foreground"
                      }`}
                    />
                    <p className="text-xs font-medium">{format.label}</p>
                    <p className="text-[10px] text-muted-foreground">{format.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stakeholder selection */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Distribution List
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {stakeholders.map(stakeholder => (
                <motion.div
                  key={stakeholder.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onToggleStakeholder(stakeholder.id)}
                  className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all min-h-[48px] ${
                    stakeholder.selected
                      ? "bg-primary/10 border border-primary/30"
                      : "bg-muted/30 border border-transparent hover:bg-muted/50"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                      stakeholder.selected
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {stakeholder.name
                      .split(" ")
                      .map(n => n[0])
                      .join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {stakeholder.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {stakeholder.role}
                    </p>
                  </div>
                  {stakeholder.selected && (
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                  )}
                </motion.div>
              ))}
            </CardContent>
          </Card>

          {/* Ready to export message */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1"
          >
            <Sparkles className="w-3 h-3 text-primary" />
            Ready to generate and distribute report
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
