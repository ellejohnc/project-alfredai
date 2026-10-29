import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, Edit3, Check, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getDataForRole } from "./demoData";
import type { ReportSection, ComplianceItem } from "./types";

interface ReportPreviewPanelProps {
  currentStep: number;
  stepProgress: number;
  selectedRole: string;
}

export function ReportPreviewPanel({ currentStep, stepProgress, selectedRole }: ReportPreviewPanelProps) {
  // Get role-specific data
  const roleData = getDataForRole(selectedRole);
  
  const [sections, setSections] = useState<ReportSection[]>(roleData.reportSections);
  const [compliance, setCompliance] = useState<ComplianceItem[]>(roleData.compliance);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [visibleSections, setVisibleSections] = useState<number>(0);

  // Update data when role changes
  useEffect(() => {
    const newRoleData = getDataForRole(selectedRole);
    setSections(newRoleData.reportSections);
    setCompliance(newRoleData.compliance);
  }, [selectedRole]);

  // Progressively reveal sections based on current step
  useEffect(() => {
    if (currentStep < 4) {
      // Before report generation step
      setVisibleSections(0);
    } else if (currentStep === 4) {
      // During report generation
      const sectionsToShow = Math.floor((stepProgress / 100) * sections.length);
      setVisibleSections(Math.min(sectionsToShow + 1, sections.length));
    } else {
      // After report generation
      setVisibleSections(sections.length);
    }
  }, [currentStep, stepProgress, sections.length]);

  const handleEditSection = (sectionId: string) => {
    setEditingSection(sectionId);
  };

  const handleSaveSection = (sectionId: string, newContent: string) => {
    setSections(prev =>
      prev.map(s => (s.id === sectionId ? { ...s, content: newContent } : s))
    );
    setEditingSection(null);
  };

  // Calculate compliance summary from role-specific compliance data
  const complianceSummary = {
    passed: compliance.filter(c => c.status === 'pass').length,
    failed: compliance.filter(c => c.status === 'fail').length,
    review: compliance.filter(c => c.status === 'review').length,
  };

  // Show placeholder before report generation
  if (currentStep < 4) {
    return (
      <div 
        id="tr-report-preview"
        className="h-full flex flex-col bg-card border border-border rounded-xl overflow-hidden"
      >
        <div className="p-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm text-foreground">Report Preview</h3>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto">
              <FileText className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Report will appear here</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Complete data extraction and analysis steps first
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      id="tr-report-preview"
      className="h-full flex flex-col bg-card border border-border rounded-xl overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm text-foreground">Report Preview</h3>
          </div>
          {visibleSections === sections.length && (
            <Badge variant="outline" className="text-xs">
              {sections.length} sections
            </Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Compliance Summary - show after compliance step */}
          {currentStep >= 3 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-muted/30 border border-border rounded-lg p-3"
            >
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-semibold text-foreground">Compliance Status</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  <span className="text-muted-foreground">{complianceSummary.passed} Passed</span>
                </div>
                <div className="flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-rose-500" />
                  <span className="text-muted-foreground">{complianceSummary.failed} Failed</span>
                </div>
                <div className="flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-500" />
                  <span className="text-muted-foreground">{complianceSummary.review} Review</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Report Sections */}
          {sections.slice(0, visibleSections).map((section, index) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="border border-border rounded-lg overflow-hidden"
            >
              {/* Section Header */}
              <div className="flex items-center justify-between px-3 py-2 bg-muted/30 border-b border-border">
                <h4 className="text-xs font-semibold text-foreground">{section.title}</h4>
                {section.editable && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      editingSection === section.id
                        ? handleSaveSection(section.id, section.content)
                        : handleEditSection(section.id)
                    }
                    className="h-6 px-2 text-xs"
                  >
                    {editingSection === section.id ? (
                      <>
                        <Check className="w-3 h-3 mr-1" />
                        Save
                      </>
                    ) : (
                      <>
                        <Edit3 className="w-3 h-3 mr-1" />
                        Edit
                      </>
                    )}
                  </Button>
                )}
              </div>

              {/* Section Content */}
              <div className="p-3">
                {editingSection === section.id ? (
                  <textarea
                    className="w-full min-h-[100px] text-xs text-muted-foreground bg-background border border-border rounded-md p-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                    defaultValue={section.content}
                    onChange={(e) => {
                      const newContent = e.target.value;
                      setSections(prev =>
                        prev.map(s =>
                          s.id === section.id ? { ...s, content: newContent } : s
                        )
                      );
                    }}
                  />
                ) : (
                  <div className="text-xs text-muted-foreground prose prose-sm max-w-none">
                    {section.content.split('\n').map((line, i) => (
                      <p key={i} className={cn("mb-1", line.startsWith('#') && "font-semibold text-foreground")}>
                        {line.replace(/^#+\s*/, '').replace(/\*\*/g, '')}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {/* Loading indicator during generation */}
          {currentStep === 4 && visibleSections < sections.length && (
            <div className="flex items-center justify-center py-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <motion.div
                  className="w-2 h-2 rounded-full bg-primary"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                />
                Generating report...
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
