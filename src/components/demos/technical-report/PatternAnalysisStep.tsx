import { motion } from "framer-motion";
import { TrendingUp, AlertTriangle, Link2, Info, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { PatternAnomaly } from "./types";

interface PatternAnalysisStepProps {
  patterns: PatternAnomaly[];
  progress: number;
}

const getPatternIcon = (type: PatternAnomaly["type"]) => {
  switch (type) {
    case "trend":
      return TrendingUp;
    case "anomaly":
      return AlertTriangle;
    case "correlation":
      return Link2;
    default:
      return Info;
  }
};

const getPatternColor = (type: PatternAnomaly["type"]) => {
  switch (type) {
    case "trend":
      return "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30";
    case "anomaly":
      return "bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30";
    case "correlation":
      return "bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
};

const getSeverityBadgeColor = (severity: PatternAnomaly["severity"]) => {
  switch (severity) {
    case "critical":
      return "bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30";
    case "warning":
      return "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30";
    case "info":
      return "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
};

// Simple mini chart component
const MiniChart = ({ dataPoints }: { dataPoints: number[] }) => {
  const max = Math.max(...dataPoints);
  const min = Math.min(...dataPoints);
  const range = max - min || 1;

  return (
    <div className="flex items-end gap-0.5 h-8">
      {dataPoints.map((point, i) => {
        const height = ((point - min) / range) * 100;
        const isLast = i === dataPoints.length - 1;
        return (
          <div
            key={i}
            className={`w-3 rounded-t transition-all ${
              isLast ? "bg-primary" : "bg-primary/40"
            }`}
            style={{ height: `${Math.max(height, 10)}%` }}
          />
        );
      })}
    </div>
  );
};

export default function PatternAnalysisStep({ patterns, progress }: PatternAnalysisStepProps) {
  const visibleCount = Math.floor((progress / 100) * patterns.length);
  const visiblePatterns = patterns.slice(0, Math.max(visibleCount, 1));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Sparkles className="w-4 h-4 text-primary animate-pulse" />
        AI analyzing patterns, trends, and anomalies...
      </div>

      <div className="space-y-3">
        {visiblePatterns.map((pattern, index) => {
          const PatternIcon = getPatternIcon(pattern.type);
          return (
            <motion.div
              key={pattern.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15 }}
            >
              <Card className={`border ${getSeverityBadgeColor(pattern.severity)}`}>
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${getPatternColor(
                        pattern.type
                      )}`}
                    >
                      <PatternIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium text-sm text-foreground">
                          {pattern.title}
                        </h4>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${getSeverityBadgeColor(pattern.severity)}`}
                        >
                          {pattern.severity}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {pattern.description}
                      </p>
                      {pattern.recommendation && (
                        <p className="text-xs text-primary mt-1.5 flex items-center gap-1">
                          <span className="font-medium">→</span>
                          {pattern.recommendation}
                        </p>
                      )}
                    </div>
                    {pattern.dataPoints && (
                      <div className="flex-shrink-0">
                        <MiniChart dataPoints={pattern.dataPoints} />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {progress >= 100 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-3 gap-2 pt-2"
        >
          <div className="text-center p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
            <p className="text-lg font-bold text-rose-600 dark:text-rose-400">
              {patterns.filter(p => p.severity === "critical").length}
            </p>
            <p className="text-[10px] text-muted-foreground">Critical</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
              {patterns.filter(p => p.severity === "warning").length}
            </p>
            <p className="text-[10px] text-muted-foreground">Warnings</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {patterns.filter(p => p.severity === "info").length}
            </p>
            <p className="text-[10px] text-muted-foreground">Info</p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
