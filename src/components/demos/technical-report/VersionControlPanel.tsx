import { motion } from "framer-motion";
import { GitBranch, Clock, User, FileText, RotateCcw, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { MOCK_REPORT_VERSIONS } from "./demoData";
import type { ReportVersion } from "./types";

interface VersionControlPanelProps {
  currentVersion: string;
  onVersionSelect?: (version: string) => void;
  onCompare?: () => void;
  onRestore?: (version: string) => void;
}

const STATUS_STYLES: Record<ReportVersion["status"], string> = {
  draft: "bg-muted text-muted-foreground border-border",
  review: "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30",
  approved: "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  final: "bg-primary/20 text-primary border-primary/30",
};

const STATUS_LABELS: Record<ReportVersion["status"], string> = {
  draft: "Draft",
  review: "Under Review",
  approved: "Approved",
  final: "Final",
};

export function VersionControlPanel({
  currentVersion,
  onVersionSelect,
  onCompare,
  onRestore,
}: VersionControlPanelProps) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-primary" />
            <h4 className="text-xs font-semibold text-foreground">Version History</h4>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCompare}
            className="h-7 text-xs gap-1"
          >
            <ArrowLeftRight className="w-3 h-3" />
            Compare
          </Button>
        </div>
      </div>

      {/* Version Timeline */}
      <ScrollArea className="max-h-[250px]">
        <div className="p-3 space-y-0">
          {MOCK_REPORT_VERSIONS.map((version, index) => {
            const isActive = version.version === currentVersion;
            const isLast = index === MOCK_REPORT_VERSIONS.length - 1;

            return (
              <div key={version.version} className="relative">
                {/* Timeline connector */}
                {!isLast && (
                  <div className="absolute left-[11px] top-[24px] w-0.5 h-[calc(100%-8px)] bg-border" />
                )}

                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    "flex items-start gap-3 p-2 rounded-lg cursor-pointer transition-all",
                    isActive
                      ? "bg-primary/5 border border-primary/20"
                      : "hover:bg-muted/50"
                  )}
                  onClick={() => onVersionSelect?.(version.version)}
                >
                  {/* Timeline dot */}
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5",
                      isActive
                        ? "border-primary bg-primary"
                        : "border-border bg-background"
                    )}
                  >
                    <FileText
                      className={cn(
                        "w-2.5 h-2.5",
                        isActive ? "text-primary-foreground" : "text-muted-foreground"
                      )}
                    />
                  </div>

                  {/* Version info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-foreground">
                        v{version.version}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn("text-[10px] py-0", STATUS_STYLES[version.status])}
                      >
                        {STATUS_LABELS[version.status]}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {version.summary}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="w-2.5 h-2.5" />
                        {version.author}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {version.timestamp}
                      </span>
                    </div>
                  </div>

                  {/* Restore button (show on hover for non-current versions) */}
                  {!isActive && version.status !== "final" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[10px] px-2 opacity-0 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRestore?.(version.version);
                      }}
                    >
                      <RotateCcw className="w-3 h-3 mr-1" />
                      Restore
                    </Button>
                  )}
                </motion.div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
