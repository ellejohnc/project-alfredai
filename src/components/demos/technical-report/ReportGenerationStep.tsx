import { motion } from "framer-motion";
import { FileText, Edit3, CheckCircle2, Sparkles } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { ReportSection } from "./types";

interface ReportGenerationStepProps {
  reportSections: ReportSection[];
  progress: number;
  onUpdateSection?: (id: string, content: string) => void;
}

export default function ReportGenerationStep({
  reportSections,
  progress,
  onUpdateSection,
}: ReportGenerationStepProps) {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const visibleCount = Math.floor((progress / 100) * reportSections.length);
  const visibleSections = reportSections.slice(0, Math.max(visibleCount, 1));

  const handleEdit = (section: ReportSection) => {
    setEditingSection(section.id);
    setEditContent(section.content);
  };

  const handleSave = (id: string) => {
    if (onUpdateSection) {
      onUpdateSection(id, editContent);
    }
    setEditingSection(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="w-4 h-4 text-primary animate-pulse" />
          Generating technical report sections...
        </div>
        {progress >= 100 && (
          <Badge variant="secondary" className="text-xs">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Complete
          </Badge>
        )}
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {visibleSections.map((section, index) => (
          <motion.button
            key={section.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => setActiveSection(section.id)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors min-h-[32px] ${
              activeSection === section.id || (!activeSection && index === 0)
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {section.title}
          </motion.button>
        ))}
      </div>

      {/* Active section content */}
      {visibleSections.map((section, index) => {
        const isActive = activeSection === section.id || (!activeSection && index === 0);
        if (!isActive) return null;

        return (
          <motion.div
            key={section.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    {section.title}
                  </CardTitle>
                  {section.editable && editingSection !== section.id && (
                    <button
                      onClick={() => handleEdit(section)}
                      className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors min-h-[32px] px-2"
                    >
                      <Edit3 className="w-3 h-3" />
                      Edit
                    </button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {editingSection === section.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editContent}
                      onChange={e => setEditContent(e.target.value)}
                      className="min-h-[150px] text-xs"
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setEditingSection(null)}
                        className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors min-h-[32px]"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSave(section.id)}
                        className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors min-h-[32px]"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <div className="text-xs text-foreground whitespace-pre-wrap leading-relaxed max-h-[200px] overflow-y-auto">
                      {section.content}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        );
      })}

      {progress >= 100 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-xs text-emerald-600 dark:text-emerald-400"
        >
          ✓ Report generated with {reportSections.length} sections
        </motion.div>
      )}
    </motion.div>
  );
}
