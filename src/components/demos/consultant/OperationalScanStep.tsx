import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import type { OperationalScore } from "./types";
import { OPERATIONAL_DIMENSIONS } from "./types";

interface OperationalScanStepProps {
  scores: OperationalScore[];
  aiCommentary: {
    overall: string;
    contradiction: string | null;
    warning: string;
  };
  isDemo?: boolean;
}

export function OperationalScanStep({ scores, aiCommentary, isDemo = true }: OperationalScanStepProps) {
  // Calculate entropy score
  const avgScore = scores.reduce((sum, s) => sum + s.score, 0) / scores.length;
  const entropyPercent = Math.round((1 - (avgScore / 5)) * 100);
  
  // Detect contradictions
  const hasContradiction = scores.some((s, i) => {
    if (s.dimension === "processMaturity" && s.score >= 4) {
      const ownership = scores.find(x => x.dimension === "decisionOwnership");
      return ownership && ownership.score <= 2;
    }
    return false;
  });

  const getScoreColor = (score: number) => {
    if (score <= 2) return "text-red-500";
    if (score === 3) return "text-amber-500";
    return "text-green-500";
  };

  const getScoreLabel = (score: number) => {
    const labels = ["Very Low", "Low", "Moderate", "Good", "Excellent"];
    return labels[score - 1] || "Unknown";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Scoring Interface */}
        <div className="lg:col-span-2 space-y-4">
          {scores.map((score, index) => {
            const dimension = OPERATIONAL_DIMENSIONS.find(d => d.key === score.dimension);
            return (
              <motion.div
                key={score.dimension}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="border-border/50">
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-sm font-medium">{score.label}</Label>
                        <p className="text-xs text-muted-foreground">{dimension?.description}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-lg font-bold ${getScoreColor(score.score)}`}>
                          {score.score}/5
                        </span>
                        <p className={`text-xs ${getScoreColor(score.score)}`}>
                          {getScoreLabel(score.score)}
                        </p>
                      </div>
                    </div>
                    
                    <Slider
                      value={[score.score]}
                      min={1}
                      max={5}
                      step={1}
                      disabled={isDemo}
                      className="py-2"
                    />
                    
                    <Textarea
                      value={score.justification}
                      readOnly={isDemo}
                      placeholder="Justification required..."
                      className="bg-muted/30 min-h-[60px] resize-none text-sm"
                    />
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Right: Entropy Profile & Commentary */}
        <div className="space-y-4">
          {/* Entropy Score */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Operational Entropy Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-4">
                <div className={`text-4xl font-bold ${entropyPercent > 50 ? 'text-red-500' : entropyPercent > 30 ? 'text-amber-500' : 'text-green-500'}`}>
                  {entropyPercent}%
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {entropyPercent > 50 ? 'High Entropy' : entropyPercent > 30 ? 'Moderate Entropy' : 'Low Entropy'}
                </p>
              </div>
              
              <div className="space-y-2">
                {scores.map(score => (
                  <div key={score.dimension} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground truncate max-w-[140px]">{score.label}</span>
                      <span className={getScoreColor(score.score)}>{score.score}/5</span>
                    </div>
                    <Progress value={score.score * 20} className="h-1.5" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* AI Commentary */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-sm">🧠</span>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-primary">Operational Analysis</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {aiCommentary.overall}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Warning */}
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-amber-600">Delivery Warning</p>
                  <p className="text-sm text-muted-foreground">
                    {aiCommentary.warning}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contradiction Alert */}
          {hasContradiction && (
            <Card className="border-red-500/30 bg-red-500/5">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-red-600">Contradiction Detected</p>
                    <p className="text-sm text-muted-foreground">
                      High process maturity typically correlates with clear ownership. Review scoring.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </motion.div>
  );
}
