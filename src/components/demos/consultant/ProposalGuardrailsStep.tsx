import { motion } from "framer-motion";
import { Shield, CheckCircle2, XCircle, AlertTriangle, Calendar, Pause, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { ProposalGuardrails } from "./types";
import { useState } from "react";

interface ProposalGuardrailsStepProps {
  data: ProposalGuardrails;
  isDemo?: boolean;
  onConfirm?: () => void;
}

export function ProposalGuardrailsStep({ data, isDemo = true, onConfirm }: ProposalGuardrailsStepProps) {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const toggleItem = (key: string) => {
    setCheckedItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const isComplete = 
    data.inScope.length >= 3 &&
    data.outOfScope.length >= 2 &&
    data.changeControlTriggers.length >= 1 &&
    data.reviewCheckpoints.length >= 1 &&
    data.killSwitchConditions.length >= 1;

  const allChecked = Object.keys(checkedItems).length >= 5 && Object.values(checkedItems).every(v => v);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Mandatory Warning */}
      <Card className={`${isComplete ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className={`w-5 h-5 ${isComplete ? 'text-green-500' : 'text-red-500'}`} />
              <div>
                <p className={`text-sm font-medium ${isComplete ? 'text-green-600' : 'text-red-600'}`}>
                  {isComplete ? 'Guardrails Complete' : 'Mandatory Step'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isComplete ? 'Ready to generate summary' : 'Complete all sections before proceeding'}
                </p>
              </div>
            </div>
            <Badge variant="outline" className={isComplete ? 'bg-green-500/10 text-green-600 border-green-500/30' : 'bg-red-500/10 text-red-600 border-red-500/30'}>
              {isComplete ? 'Ready' : 'Incomplete'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* In-Scope */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Explicit In-Scope Items
              </CardTitle>
              <Badge variant="outline" className={data.inScope.length >= 3 ? 'bg-green-500/10 text-green-600' : 'bg-amber-500/10 text-amber-600'}>
                {data.inScope.length}/3 min
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.inScope.map((item, i) => (
              <div key={i} className="flex items-center gap-2 p-2 bg-muted/30 rounded-md">
                <Checkbox 
                  checked={checkedItems[`in-${i}`] ?? isDemo} 
                  onCheckedChange={() => toggleItem(`in-${i}`)}
                  disabled={isDemo}
                />
                <span className="text-sm">{item}</span>
              </div>
            ))}
            {!isDemo && (
              <Button variant="ghost" size="sm" className="w-full mt-2">
                <Plus className="w-4 h-4 mr-1" /> Add Item
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Out-of-Scope */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-500" />
                Explicit Out-of-Scope Items
              </CardTitle>
              <Badge variant="outline" className={data.outOfScope.length >= 2 ? 'bg-green-500/10 text-green-600' : 'bg-amber-500/10 text-amber-600'}>
                {data.outOfScope.length}/2 min
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.outOfScope.map((item, i) => (
              <div key={i} className="flex items-center gap-2 p-2 bg-muted/30 rounded-md">
                <Checkbox 
                  checked={checkedItems[`out-${i}`] ?? isDemo} 
                  onCheckedChange={() => toggleItem(`out-${i}`)}
                  disabled={isDemo}
                />
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Change Control Triggers */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Change Control Triggers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.changeControlTriggers.map((item, i) => (
              <div key={i} className="flex items-center gap-2 p-2 bg-amber-500/5 border border-amber-500/20 rounded-md">
                <Checkbox 
                  checked={checkedItems[`change-${i}`] ?? isDemo} 
                  onCheckedChange={() => toggleItem(`change-${i}`)}
                  disabled={isDemo}
                />
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Review Checkpoints */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-500" />
              Review Checkpoints
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.reviewCheckpoints.map((item, i) => (
              <div key={i} className="flex items-center gap-2 p-2 bg-blue-500/5 border border-blue-500/20 rounded-md">
                <Checkbox 
                  checked={checkedItems[`review-${i}`] ?? isDemo} 
                  onCheckedChange={() => toggleItem(`review-${i}`)}
                  disabled={isDemo}
                />
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Kill-Switch Conditions */}
      <Card className="border-red-500/30 bg-red-500/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-red-600">
            <Pause className="w-4 h-4" />
            Kill-Switch Conditions
            <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30">
              When to stop or re-scope
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.killSwitchConditions.map((item, i) => (
            <div key={i} className="flex items-center gap-2 p-2 bg-red-500/5 border border-red-500/20 rounded-md">
              <Checkbox 
                checked={checkedItems[`kill-${i}`] ?? isDemo} 
                onCheckedChange={() => toggleItem(`kill-${i}`)}
                disabled={isDemo}
              />
              <span className="text-sm">{item}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Proceed Button */}
      {!isDemo && (
        <div className="flex justify-end">
          <Button 
            size="lg" 
            disabled={!isComplete || !allChecked}
            onClick={onConfirm}
          >
            <Shield className="w-4 h-4 mr-2" />
            Confirm Guardrails & Generate Summary
          </Button>
        </div>
      )}
    </motion.div>
  );
}
