import { motion } from "framer-motion";
import { Check, ChevronRight, AlertTriangle, Clock, Shield, Layout } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { EngagementShape } from "./types";

interface EngagementShapeStepProps {
  shapes: EngagementShape[];
  aiCommentary: string;
  onSelect?: (shape: EngagementShape) => void;
  isDemo?: boolean;
}

export function EngagementShapeStep({ shapes, aiCommentary, onSelect, isDemo = true }: EngagementShapeStepProps) {
  const selectedShape = shapes.find(s => s.selected);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* AI Recommendation */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <span className="text-sm">🧠</span>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-primary">Recommendation</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {aiCommentary}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shape Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {shapes.map((shape, index) => (
          <motion.div
            key={shape.type}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card 
              className={`cursor-pointer transition-all h-full ${
                shape.selected 
                  ? 'border-primary ring-2 ring-primary/20' 
                  : 'border-border/50 hover:border-border'
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">{shape.type}</CardTitle>
                  {shape.selected && (
                    <Badge className="bg-primary text-primary-foreground">
                      <Check className="w-3 h-3 mr-1" />
                      Recommended
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Rationale */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Layout className="w-3 h-3" />
                    Why this shape
                  </Label>
                  <p className="text-sm">{shape.rationale}</p>
                </div>

                {/* Risks Limited */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    Risks it limits
                  </Label>
                  <p className="text-xs text-muted-foreground">{shape.risksLimited}</p>
                </div>

                {/* Delayed */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Intentionally delayed
                  </Label>
                  <p className="text-xs text-muted-foreground">{shape.delayed}</p>
                </div>

                {!isDemo && (
                  <Button 
                    variant={shape.selected ? "default" : "outline"}
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => onSelect?.(shape)}
                  >
                    {shape.selected ? "Selected" : "Select"}
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Override Section */}
      {selectedShape && (
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Override Selection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                If you select a different shape than recommended, provide your rationale:
              </p>
              <Textarea
                placeholder="Override rationale (required if changing from recommended shape)..."
                className="bg-muted/30 min-h-[80px] resize-none"
                disabled={isDemo}
              />
              <p className="text-xs text-muted-foreground">
                Overrides are logged for internal review and quality assurance.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
