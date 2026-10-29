import { motion } from "framer-motion";
import { Lightbulb, Clock, DollarSign, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { Recommendation } from "./types";
import { getPriorityColor } from "./demoData";

interface RecommendationsStepProps {
  recommendations: Recommendation[];
  progress: number;
}

export default function RecommendationsStep({ recommendations, progress }: RecommendationsStepProps) {
  const visibleCount = Math.floor((progress / 100) * recommendations.length);
  const visibleRecs = recommendations.slice(0, Math.max(visibleCount, 1));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Lightbulb className="w-4 h-4 text-primary" />
        Priority-ranked action items based on risk assessment
      </div>

      {/* Risk matrix summary */}
      {progress >= 100 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-4 gap-1"
        >
          {["critical", "high", "medium", "low"].map(priority => {
            const count = recommendations.filter(r => r.priority === priority).length;
            return (
              <div
                key={priority}
                className={`text-center p-2 rounded-lg ${getPriorityColor(priority as Recommendation["priority"])}`}
              >
                <p className="text-lg font-bold">{count}</p>
                <p className="text-[10px] capitalize">{priority}</p>
              </div>
            );
          })}
        </motion.div>
      )}

      <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
        {visibleRecs.map((rec, index) => (
          <motion.div
            key={rec.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.12 }}
          >
            <Card className={`border ${getPriorityColor(rec.priority)}`}>
              <CardContent className="p-3">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant="outline"
                        className={`text-[10px] uppercase font-semibold ${getPriorityColor(rec.priority)}`}
                      >
                        {rec.priority}
                      </Badge>
                      <h4 className="font-medium text-sm text-foreground">
                        {rec.title}
                      </h4>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">{rec.description}</p>

                  {/* Risk meter */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Risk Level
                      </span>
                      <span className="font-medium">{rec.riskLevel}%</span>
                    </div>
                    <Progress
                      value={rec.riskLevel}
                      className={`h-1.5 ${
                        rec.riskLevel >= 80
                          ? "[&>div]:bg-rose-500"
                          : rec.riskLevel >= 50
                          ? "[&>div]:bg-amber-500"
                          : "[&>div]:bg-blue-500"
                      }`}
                    />
                  </div>

                  <div className="flex items-center gap-4 pt-1">
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {rec.timeline}
                    </div>
                    {rec.estimatedCost && (
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <DollarSign className="w-3 h-3" />
                        {rec.estimatedCost}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
