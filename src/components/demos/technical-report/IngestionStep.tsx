import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import { Sparkles, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { ExtractedData } from "./types";
import { getCategoryIcon, getCategoryColor, getSeverityColor } from "./demoData";

interface IngestionStepProps {
  extractedData: ExtractedData[];
  progress: number;
}

export default function IngestionStep({ extractedData, progress }: IngestionStepProps) {
  const visibleCount = Math.floor((progress / 100) * extractedData.length);
  const visibleData = extractedData.slice(0, Math.max(visibleCount, 1));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="w-4 h-4 text-primary animate-pulse" />
          AI extracting and categorizing data...
        </div>
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Processing sources</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
      </div>

      <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
        <AnimatePresence mode="popLayout">
          {visibleData.map((data, index) => {
            const CategoryIcon = getCategoryIcon(data.category);
            return (
              <motion.div
                key={data.id}
                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="border-border/50">
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 ${getCategoryColor(
                          data.category
                        )}`}
                      >
                        <CategoryIcon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-medium text-sm text-foreground">
                            {data.title}
                          </h4>
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${getCategoryColor(data.category)}`}
                          >
                            {data.category}
                          </Badge>
                        </div>
                        <p
                          className={`text-xs mt-1 ${getSeverityColor(data.severity)}`}
                        >
                          {data.value}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-[10px] text-muted-foreground">
                            Source: {data.source}
                          </span>
                          <div className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                              {data.confidence}% confidence
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {progress >= 100 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-xs text-emerald-600 dark:text-emerald-400 pt-1"
        >
          ✓ {extractedData.length} data points extracted successfully
        </motion.div>
      )}
    </motion.div>
  );
}
