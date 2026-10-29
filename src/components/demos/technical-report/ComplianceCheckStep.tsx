import { motion } from "framer-motion";
import { Shield, CheckCircle2, XCircle, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { ComplianceItem } from "./types";
import { getStatusColor } from "./demoData";

interface ComplianceCheckStepProps {
  complianceItems: ComplianceItem[];
  progress: number;
}

const getStatusIcon = (status: ComplianceItem["status"]) => {
  switch (status) {
    case "pass":
      return CheckCircle2;
    case "fail":
      return XCircle;
    case "review":
      return AlertCircle;
    default:
      return AlertCircle;
  }
};

export default function ComplianceCheckStep({ complianceItems, progress }: ComplianceCheckStepProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const visibleCount = Math.floor((progress / 100) * complianceItems.length);
  const visibleItems = complianceItems.slice(0, Math.max(visibleCount, 1));

  const passCount = complianceItems.filter(c => c.status === "pass").length;
  const failCount = complianceItems.filter(c => c.status === "fail").length;
  const reviewCount = complianceItems.filter(c => c.status === "review").length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Shield className="w-4 h-4 text-primary" />
        Verifying against industry standards...
      </div>

      {/* Summary stats */}
      {progress >= 100 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="grid grid-cols-3 gap-2"
        >
          <div className="text-center p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{passCount}</p>
            <p className="text-[10px] text-muted-foreground">Passed</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
            <p className="text-lg font-bold text-rose-600 dark:text-rose-400">{failCount}</p>
            <p className="text-[10px] text-muted-foreground">Failed</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{reviewCount}</p>
            <p className="text-[10px] text-muted-foreground">Review</p>
          </div>
        </motion.div>
      )}

      <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
        {visibleItems.map((item, index) => {
          const StatusIcon = getStatusIcon(item.status);
          const isExpanded = expandedId === item.id;

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08 }}
            >
              <Card
                className={`cursor-pointer transition-all ${getStatusColor(item.status)} ${
                  isExpanded ? "ring-1 ring-primary/30" : ""
                }`}
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start gap-2">
                    <StatusIcon
                      className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                        item.status === "pass"
                          ? "text-emerald-500"
                          : item.status === "fail"
                          ? "text-rose-500"
                          : "text-amber-500"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-[10px]">
                          {item.standard}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`text-[10px] uppercase ${getStatusColor(item.status)}`}
                        >
                          {item.status}
                        </Badge>
                      </div>
                      <h4 className="font-medium text-sm text-foreground mt-1">
                        {item.requirement}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {item.details}
                      </p>

                      {isExpanded && item.remediation && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="mt-2 pt-2 border-t border-border"
                        >
                          <p className="text-xs font-medium text-foreground">Remediation:</p>
                          <p className="text-xs text-primary mt-0.5">{item.remediation}</p>
                        </motion.div>
                      )}
                    </div>
                    {item.remediation && (
                      <div className="flex-shrink-0">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
