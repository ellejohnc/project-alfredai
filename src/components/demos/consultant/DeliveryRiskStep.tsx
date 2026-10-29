import { motion } from "framer-motion";
import { AlertTriangle, Users, Shield, Clock, Brain, HelpCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { DeliveryRisk } from "./types";

interface DeliveryRiskStepProps {
  data: DeliveryRisk;
  aiCommentary: {
    classification: "GREEN" | "AMBER" | "RED";
    message: string;
    constraints: string[];
  };
  isDemo?: boolean;
}

const ALIGNMENT_LEVELS = ["Unified", "Mostly aligned", "Mixed signals", "Conflicting"];
const POLITICAL_SENSITIVITY = ["Low", "Moderate", "High", "Minefield"];
const CHANGE_FATIGUE = ["Fresh", "Some fatigue", "Fatigued", "Exhausted"];
const TIME_PRESSURE = ["Realistic", "Optimistic", "Unrealistic", "Crisis-mode"];
const AMBIGUITY_TOLERANCE = ["Comfortable", "Tolerant", "Resistant", "Intolerant"];

export function DeliveryRiskStep({ data, aiCommentary, isDemo = true }: DeliveryRiskStepProps) {
  const getRiskColor = (value: string, options: string[]) => {
    const index = options.indexOf(value);
    const total = options.length - 1;
    if (index <= total * 0.25) return "bg-green-500/10 text-green-600 border-green-500/30";
    if (index <= total * 0.5) return "bg-amber-500/10 text-amber-600 border-amber-500/30";
    if (index <= total * 0.75) return "bg-orange-500/10 text-orange-600 border-orange-500/30";
    return "bg-red-500/10 text-red-600 border-red-500/30";
  };

  const classificationColors = {
    GREEN: "bg-green-500/20 text-green-600 border-green-500/50",
    AMBER: "bg-amber-500/20 text-amber-600 border-amber-500/50",
    RED: "bg-red-500/20 text-red-600 border-red-500/50",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Risk Assessment */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Change & Delivery Risk Assessment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Leadership Alignment */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  Leadership Alignment Level
                  <Badge variant="outline" className={getRiskColor(data.leadershipAlignment, ALIGNMENT_LEVELS)}>
                    {data.leadershipAlignment}
                  </Badge>
                </Label>
                <Select value={data.leadershipAlignment} disabled={isDemo}>
                  <SelectTrigger className="bg-muted/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALIGNMENT_LEVELS.map(level => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Political Sensitivity */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                  Internal Political Sensitivity
                  <Badge variant="outline" className={getRiskColor(data.politicalSensitivity, POLITICAL_SENSITIVITY)}>
                    {data.politicalSensitivity}
                  </Badge>
                </Label>
                <Select value={data.politicalSensitivity} disabled={isDemo}>
                  <SelectTrigger className="bg-muted/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {POLITICAL_SENSITIVITY.map(level => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Change Fatigue */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Brain className="w-4 h-4 text-muted-foreground" />
                  Change Fatigue Signals
                  <Badge variant="outline" className={getRiskColor(data.changeFatigue, CHANGE_FATIGUE)}>
                    {data.changeFatigue}
                  </Badge>
                </Label>
                <Select value={data.changeFatigue} disabled={isDemo}>
                  <SelectTrigger className="bg-muted/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CHANGE_FATIGUE.map(level => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Time Pressure */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  Time Pressure Realism
                  <Badge variant="outline" className={getRiskColor(data.timePressure, TIME_PRESSURE)}>
                    {data.timePressure}
                  </Badge>
                </Label>
                <Select value={data.timePressure} disabled={isDemo}>
                  <SelectTrigger className="bg-muted/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_PRESSURE.map(level => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Ambiguity Tolerance */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-muted-foreground" />
                  Client Tolerance for Ambiguity
                  <Badge variant="outline" className={getRiskColor(data.ambiguityTolerance, AMBIGUITY_TOLERANCE)}>
                    {data.ambiguityTolerance}
                  </Badge>
                </Label>
                <Select value={data.ambiguityTolerance} disabled={isDemo}>
                  <SelectTrigger className="bg-muted/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AMBIGUITY_TOLERANCE.map(level => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Risk Classification */}
        <div className="space-y-4">
          {/* Risk Classification */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Delivery Risk Classification</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6">
                <Badge 
                  variant="outline" 
                  className={`text-2xl px-6 py-3 ${classificationColors[aiCommentary.classification]}`}
                >
                  {aiCommentary.classification}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* AI Commentary */}
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-amber-600">Risk Assessment</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {aiCommentary.message}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Suggested Constraints */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-primary flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Suggested Engagement Constraints
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {aiCommentary.constraints.map((constraint, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    {constraint}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
