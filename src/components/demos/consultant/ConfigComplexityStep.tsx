import { motion } from "framer-motion";
import { Layers, Package, Settings, DollarSign, Users, ArrowRightLeft, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import type { ConfigComplexity } from "./types";

interface ConfigComplexityStepProps {
  data: ConfigComplexity;
  aiCommentary: {
    hotspots: string[];
    marginRisk: string;
    resistance: string;
  };
  isDemo?: boolean;
}

const CUSTOMIZATION_LEVELS = ["Low", "Medium", "High", "Extreme"];
const EXCEPTION_FREQUENCY = ["Rare", "Occasional", "Frequent", "Constant"];
const PRICING_CLARITY = ["Clear rules", "Some exceptions", "Case-by-case", "Chaotic"];
const CONFIG_OWNERSHIP = ["Single owner", "Committee", "Ad hoc"];
const HANDOFF_QUALITY = ["Seamless", "Minor gaps", "Significant gaps", "Broken"];

export function ConfigComplexityStep({ data, aiCommentary, isDemo = true }: ConfigComplexityStepProps) {
  const getComplexityBadge = (value: string, options: string[]) => {
    const index = options.indexOf(value);
    const total = options.length - 1;
    if (index <= total * 0.33) return { color: "bg-green-500/10 text-green-600 border-green-500/30", level: "Low" };
    if (index <= total * 0.66) return { color: "bg-amber-500/10 text-amber-600 border-amber-500/30", level: "Medium" };
    return { color: "bg-red-500/10 text-red-600 border-red-500/30", level: "High" };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Form Inputs */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="w-4 h-4" />
                Product & Service Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Live Offerings */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Layers className="w-4 h-4 text-muted-foreground" />
                    Number of Live Offerings
                  </Label>
                  <span className="text-lg font-bold text-primary">{data.liveOfferings}</span>
                </div>
                <Slider
                  value={[data.liveOfferings]}
                  min={1}
                  max={50}
                  step={1}
                  disabled={isDemo}
                  className="py-2"
                />
                <p className="text-xs text-muted-foreground">Products, services, or SKUs actively sold</p>
              </div>

              {/* Customization Degree */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Settings className="w-4 h-4 text-muted-foreground" />
                  Degree of Customization
                  <Badge variant="outline" className={getComplexityBadge(data.customizationDegree, CUSTOMIZATION_LEVELS).color}>
                    {getComplexityBadge(data.customizationDegree, CUSTOMIZATION_LEVELS).level} Risk
                  </Badge>
                </Label>
                <Select value={data.customizationDegree} disabled={isDemo}>
                  <SelectTrigger className="bg-muted/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CUSTOMIZATION_LEVELS.map(level => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Exception Frequency */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-muted-foreground" />
                  Exception Frequency
                  <Badge variant="outline" className={getComplexityBadge(data.exceptionFrequency, EXCEPTION_FREQUENCY).color}>
                    {getComplexityBadge(data.exceptionFrequency, EXCEPTION_FREQUENCY).level} Risk
                  </Badge>
                </Label>
                <Select value={data.exceptionFrequency} disabled={isDemo}>
                  <SelectTrigger className="bg-muted/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXCEPTION_FREQUENCY.map(freq => (
                      <SelectItem key={freq} value={freq}>{freq}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Pricing Clarity */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  Pricing Logic Clarity
                  <Badge variant="outline" className={getComplexityBadge(data.pricingClarity, PRICING_CLARITY).color}>
                    {getComplexityBadge(data.pricingClarity, PRICING_CLARITY).level} Risk
                  </Badge>
                </Label>
                <Select value={data.pricingClarity} disabled={isDemo}>
                  <SelectTrigger className="bg-muted/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRICING_CLARITY.map(clarity => (
                      <SelectItem key={clarity} value={clarity}>{clarity}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Config Ownership */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  Configuration Decision Ownership
                  <Badge variant="outline" className={getComplexityBadge(data.configOwnership, CONFIG_OWNERSHIP).color}>
                    {getComplexityBadge(data.configOwnership, CONFIG_OWNERSHIP).level} Risk
                  </Badge>
                </Label>
                <Select value={data.configOwnership} disabled={isDemo}>
                  <SelectTrigger className="bg-muted/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONFIG_OWNERSHIP.map(ownership => (
                      <SelectItem key={ownership} value={ownership}>{ownership}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Handoff Quality */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-muted-foreground" />
                  Sales-to-Delivery Handoff Quality
                  <Badge variant="outline" className={getComplexityBadge(data.handoffQuality, HANDOFF_QUALITY).color}>
                    {getComplexityBadge(data.handoffQuality, HANDOFF_QUALITY).level} Risk
                  </Badge>
                </Label>
                <Select value={data.handoffQuality} disabled={isDemo}>
                  <SelectTrigger className="bg-muted/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HANDOFF_QUALITY.map(quality => (
                      <SelectItem key={quality} value={quality}>{quality}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: AI Commentary */}
        <div className="space-y-4">
          {/* Configuration Hotspots */}
          <Card className="border-red-500/30 bg-red-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Configuration Hotspots
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {aiCommentary.hotspots.map((hotspot, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-red-500 mt-1">•</span>
                    {hotspot}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Margin Risk */}
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-amber-600">Margin Leakage Risk</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{aiCommentary.marginRisk}</p>
            </CardContent>
          </Card>

          {/* Standardization Resistance */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-sm">🧠</span>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-primary">Standardization Resistance</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {aiCommentary.resistance}
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
