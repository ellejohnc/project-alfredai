import { motion } from "framer-motion";
import { DollarSign, AlertTriangle, TrendingUp, HelpCircle, Lock, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { FeeRange } from "./types";
import { useState } from "react";

interface FeeRangeStepProps {
  data: FeeRange;
  aiCommentary: string;
  isDemo?: boolean;
}

export function FeeRangeStep({ data, aiCommentary, isDemo = true }: FeeRangeStepProps) {
  const [showDetails, setShowDetails] = useState(true);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const totalDrivers = data.drivers.reduce((sum, d) => sum + d.amount, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Internal Only Warning */}
      <Card className="border-red-500/30 bg-red-500/5">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-sm font-medium text-red-600">Internal Use Only</p>
                <p className="text-xs text-muted-foreground">Never expose fee logic to clients</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30">
              Confidential
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Fee Range Display */}
        <div className="lg:col-span-2 space-y-4">
          {/* Main Fee Display */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Recommended Fee Band
                </CardTitle>
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {showDetails ? (
                <>
                  {/* Fee Range */}
                  <div className="text-center py-6 space-y-2">
                    <div className="text-3xl font-bold text-primary">
                      {formatCurrency(data.min)} — {formatCurrency(data.max)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Recommended engagement fee range
                    </p>
                  </div>

                  {/* Confidence Level */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Estimate Confidence</span>
                      <span className="text-sm font-medium">{data.confidence}%</span>
                    </div>
                    <Progress value={data.confidence} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      Based on input completeness and historical patterns
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <EyeOff className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Fee details hidden</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cost Drivers */}
          {showDetails && (
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Primary Cost Drivers
                  <Badge variant="outline" className="text-xs">Not hours</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.drivers.map((driver, index) => (
                  <motion.div
                    key={driver.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span className="text-sm">{driver.label}</span>
                    </div>
                    <span className="text-sm font-medium text-primary">
                      +{formatCurrency(driver.amount)}
                    </span>
                  </motion.div>
                ))}
                <div className="pt-3 border-t border-border/50 flex items-center justify-between">
                  <span className="text-sm font-medium">Total Complexity Premium</span>
                  <span className="text-base font-bold text-primary">
                    {formatCurrency(totalDrivers)}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Warnings & Assumptions */}
        <div className="space-y-4">
          {/* Scope Creep Zones */}
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-amber-600 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Scope Creep Zones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {data.creepZones.map((zone, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-amber-500 mt-1">•</span>
                    {zone}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Assumptions */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <HelpCircle className="w-4 h-4" />
                Assumptions to Validate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {data.assumptions.map((assumption, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary mt-1">□</span>
                    {assumption}
                  </li>
                ))}
              </ul>
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
                  <p className="text-sm font-medium text-primary">Pricing Rationale</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {aiCommentary}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
