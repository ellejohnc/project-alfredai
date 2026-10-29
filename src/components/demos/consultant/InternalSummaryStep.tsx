import { useState } from "react";
import { motion } from "framer-motion";
import { 
  FileText, AlertTriangle, DollarSign, MessageSquare, Eye, ChevronDown, Lock,
  Mail, FileOutput, Database, CheckCircle2, Loader2, Send, Download, RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { EngagementContext, FeeRange, EngagementShape, DeliveryRisk } from "./types";
import { calculateRiskClassification } from "./demoData";

interface InternalSummaryStepProps {
  context: EngagementContext;
  feeRange: FeeRange;
  selectedShape: EngagementShape | null;
  aiSummary: string;
  deliveryRisk?: DeliveryRisk;
  isDemo?: boolean;
}

export function InternalSummaryStep({ 
  context, 
  feeRange, 
  selectedShape,
  aiSummary,
  deliveryRisk,
  isDemo = true 
}: InternalSummaryStepProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    scope: true,
    risk: true,
    pricing: true,
    talking: true,
    flags: true,
  });
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [emailType, setEmailType] = useState<string>("proposal-intro");
  const [generatedEmail, setGeneratedEmail] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [actionCompleted, setActionCompleted] = useState<Record<string, boolean>>({});

  const riskClass = deliveryRisk ? calculateRiskClassification(deliveryRisk) : "AMBER";

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const emailTemplates: Record<string, { subject: string; body: string }> = {
    "proposal-intro": {
      subject: `Proposal Discussion: ${context.clientName} Operations Engagement`,
      body: `Hi [Contact Name],

Thank you for our recent conversation about the operational challenges ${context.clientName} is facing. Based on our discovery discussion, I've prepared some initial thinking on how we might approach this engagement.

Key areas we'd focus on:
• Operations process mapping and gap analysis
• System integration requirements assessment
• Decision ownership matrix development
• Phased implementation roadmap

Given the complexity we discussed, I'd recommend a ${selectedShape?.type || 'Phased Engagement'} approach. This protects both parties by allowing us to validate assumptions before committing to later phases.

I'd welcome the opportunity to walk you through our proposed approach in more detail. Would you have 30 minutes next week?

Best regards,
[Your Name]`,
    },
    "fee-discussion": {
      subject: `Investment Discussion: ${context.clientName} Engagement`,
      body: `Hi [Contact Name],

Following our recent discussions, I wanted to provide some context around the investment for the proposed engagement with ${context.clientName}.

Based on our assessment, the recommended investment range is ${formatCurrency(feeRange.min)} – ${formatCurrency(feeRange.max)}. This reflects:

• The operational complexity we identified during discovery
• A ${selectedShape?.type || 'phased'} approach with built-in review gates
• Buffer for integration and coordination overhead

This is not a time-based estimate – it's based on the complexity and risk profile of the work, which protects both the quality of delivery and the value you receive.

Happy to discuss the breakdown in more detail on a call.

Best regards,
[Your Name]`,
    },
    "follow-up": {
      subject: `Re: ${context.clientName} Engagement - Next Steps`,
      body: `Hi [Contact Name],

I wanted to follow up on our proposal for ${context.clientName}. I understand these decisions take time, especially given the scope of what we discussed.

A few thoughts based on our conversation:

1. The ${selectedShape?.type || 'phased approach'} we proposed is specifically designed to reduce risk – you can validate value before committing to later phases.

2. We've built in explicit review checkpoints to ensure alignment throughout.

3. Given the ${context.industry} sector dynamics you mentioned, timing may be important.

Would it be helpful to schedule a brief call to address any questions from your team?

Best regards,
[Your Name]`,
    },
  };

  const handleGenerateEmail = () => {
    setIsGenerating(true);
    // Simulate AI generation delay
    setTimeout(() => {
      const template = emailTemplates[emailType];
      setGeneratedEmail(template.body);
      setIsGenerating(false);
    }, 1500);
  };

  const handleAction = (action: string) => {
    setActiveAction(action);
    if (action === "email") {
      handleGenerateEmail();
    }
  };

  const simulateAction = (actionKey: string, delay: number = 2000) => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setActionCompleted(prev => ({ ...prev, [actionKey]: true }));
    }, delay);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Internal Only Banner */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-primary">Internal Summary Output</p>
                <p className="text-xs text-muted-foreground">For internal alignment only — not for client distribution</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
              {context.clientName}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Summary Sections */}
      <div className="space-y-4">
        {/* 1. Internal Scope Narrative */}
        <Collapsible open={openSections.scope} onOpenChange={() => toggleSection('scope')}>
          <Card className="border-border/50">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/20 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    Internal Scope Narrative
                  </CardTitle>
                  <ChevronDown className={`w-4 h-4 transition-transform ${openSections.scope ? 'rotate-180' : ''}`} />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="prose prose-sm max-w-none text-muted-foreground">
                  <p>
                    <strong>{context.clientName}</strong> is a mid-market {context.industry.toLowerCase()} company 
                    ({context.revenueBand}) experiencing {context.engagementTrigger.toLowerCase().split('.')[0]}. 
                    They approached us following a {context.insightSource.toLowerCase()} seeking operations improvement and 
                    process redesign support.
                  </p>
                  <p className="mt-3">
                    The engagement is shaped as a <strong>{selectedShape?.type || 'Phased Engagement'}</strong>, 
                    protecting both parties through natural validation points before committing to later phases. 
                    This approach directly addresses the complexity identified during assessment.
                  </p>
                  <p className="mt-3">
                    Key focus areas: operations process mapping, system integration assessment, 
                    decision ownership matrix development, and phased implementation roadmap.
                  </p>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* 2. Delivery Risk Notes */}
        <Collapsible open={openSections.risk} onOpenChange={() => toggleSection('risk')}>
          <Card className={`${riskClass === 'RED' ? 'border-red-500/30 bg-red-500/5' : riskClass === 'AMBER' ? 'border-amber-500/30 bg-amber-500/5' : 'border-green-500/30 bg-green-500/5'}`}>
            <CollapsibleTrigger asChild>
              <CardHeader className={`cursor-pointer transition-colors ${riskClass === 'RED' ? 'hover:bg-red-500/10' : riskClass === 'AMBER' ? 'hover:bg-amber-500/10' : 'hover:bg-green-500/10'}`}>
                <div className="flex items-center justify-between">
                  <CardTitle className={`text-sm font-medium flex items-center gap-2 ${riskClass === 'RED' ? 'text-red-600' : riskClass === 'AMBER' ? 'text-amber-600' : 'text-green-600'}`}>
                    <AlertTriangle className="w-4 h-4" />
                    Delivery Risk Notes
                  </CardTitle>
                  <ChevronDown className={`w-4 h-4 transition-transform ${riskClass === 'RED' ? 'text-red-600' : riskClass === 'AMBER' ? 'text-amber-600' : 'text-green-600'} ${openSections.risk ? 'rotate-180' : ''}`} />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0 space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`${riskClass === 'RED' ? 'bg-red-500/10 text-red-600 border-red-500/30' : riskClass === 'AMBER' ? 'bg-amber-500/10 text-amber-600 border-amber-500/30' : 'bg-green-500/10 text-green-600 border-green-500/30'}`}>
                    {riskClass}
                  </Badge>
                  <span className="text-sm text-muted-foreground">Risk Classification</span>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className={`${riskClass === 'RED' ? 'text-red-500' : riskClass === 'AMBER' ? 'text-amber-500' : 'text-green-500'} mt-1`}>⚠</span>
                    {riskClass === 'GREEN' ? 'Lower complexity profile - standard delivery approach viable' : 'Operational entropy indicates scope creep likelihood'}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className={`${riskClass === 'RED' ? 'text-red-500' : riskClass === 'AMBER' ? 'text-amber-500' : 'text-green-500'} mt-1`}>⚠</span>
                    {deliveryRisk?.ambiguityTolerance} ambiguity tolerance may {deliveryRisk?.ambiguityTolerance === 'Comfortable' ? 'support' : 'create friction during'} discovery
                  </li>
                  <li className="flex items-start gap-2">
                    <span className={`${riskClass === 'RED' ? 'text-red-500' : riskClass === 'AMBER' ? 'text-amber-500' : 'text-green-500'} mt-1`}>⚠</span>
                    {deliveryRisk?.timePressure} timeline expectations require {deliveryRisk?.timePressure === 'Realistic' ? 'standard' : 'active expectation'} management
                  </li>
                </ul>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* 3. Pricing Rationale */}
        <Collapsible open={openSections.pricing} onOpenChange={() => toggleSection('pricing')}>
          <Card className="border-border/50">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/20 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-primary" />
                    Pricing Rationale
                  </CardTitle>
                  <ChevronDown className={`w-4 h-4 transition-transform ${openSections.pricing ? 'rotate-180' : ''}`} />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0 space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <span className="text-sm font-medium">Recommended Range</span>
                  <span className="text-lg font-bold text-primary">
                    {formatCurrency(feeRange.min)} — {formatCurrency(feeRange.max)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Confidence:</span>
                  <Badge variant="outline">{feeRange.confidence}%</Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Key Drivers</p>
                  {feeRange.drivers.slice(0, 3).map((driver, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{driver.label}</span>
                      <span className="font-medium">+{formatCurrency(driver.amount)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* 4. Talking Points */}
        <Collapsible open={openSections.talking} onOpenChange={() => toggleSection('talking')}>
          <Card className="border-border/50">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/20 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    Talking Points for Proposal Meeting
                  </CardTitle>
                  <ChevronDown className={`w-4 h-4 transition-transform ${openSections.talking ? 'rotate-180' : ''}`} />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    Emphasize {selectedShape?.type?.toLowerCase() || 'phased'} approach as risk mitigation, not lack of confidence
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    Position complexity discovery as protecting their investment
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    Address timeline expectations early — set realistic Phase 1 completion
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    Highlight decision ownership matrix as immediate quick win
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    Require sponsor commitment to unblock data access within 2 weeks
                  </li>
                </ul>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* 5. Red Flags */}
        <Collapsible open={openSections.flags} onOpenChange={() => toggleSection('flags')}>
          <Card className="border-red-500/30 bg-red-500/5">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-red-500/10 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-red-600">
                    <Eye className="w-4 h-4" />
                    Red Flags to Watch During Delivery
                  </CardTitle>
                  <ChevronDown className={`w-4 h-4 text-red-600 transition-transform ${openSections.flags ? 'rotate-180' : ''}`} />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">🚩</span>
                    Sponsor availability drops or authority questioned
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">🚩</span>
                    Leadership alignment shifts from "{deliveryRisk?.leadershipAlignment || 'mostly aligned'}" to "conflicting"
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">🚩</span>
                    Data access requests stall beyond agreed timelines
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">🚩</span>
                    Scope additions arrive without change control acknowledgment
                  </li>
                </ul>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>

      {/* AI Summary */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <span className="text-sm">🧠</span>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-primary">Final Assessment</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {aiSummary}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Panel - Email, Quote, CRM */}
      {isDemo && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Next Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs defaultValue="email" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="email" className="text-xs">
                  <Mail className="w-3 h-3 mr-1" /> Generate Email
                </TabsTrigger>
                <TabsTrigger value="quote" className="text-xs">
                  <FileOutput className="w-3 h-3 mr-1" /> Quote Preview
                </TabsTrigger>
                <TabsTrigger value="crm" className="text-xs">
                  <Database className="w-3 h-3 mr-1" /> Update CRM
                </TabsTrigger>
              </TabsList>

              <TabsContent value="email" className="space-y-4 mt-4">
                <div className="flex gap-2 flex-wrap">
                  <Button 
                    variant={emailType === "proposal-intro" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => { setEmailType("proposal-intro"); setGeneratedEmail(""); }}
                  >
                    Proposal Intro
                  </Button>
                  <Button 
                    variant={emailType === "fee-discussion" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => { setEmailType("fee-discussion"); setGeneratedEmail(""); }}
                  >
                    Fee Discussion
                  </Button>
                  <Button 
                    variant={emailType === "follow-up" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => { setEmailType("follow-up"); setGeneratedEmail(""); }}
                  >
                    Follow-up
                  </Button>
                </div>

                {!generatedEmail && (
                  <Button onClick={handleGenerateEmail} disabled={isGenerating} className="w-full">
                    {isGenerating ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                    ) : (
                      <><Send className="w-4 h-4 mr-2" /> Generate Email</>
                    )}
                  </Button>
                )}

                {generatedEmail && (
                  <div className="space-y-3">
                    <div className="p-2 bg-muted/30 rounded text-xs">
                      <strong>Subject:</strong> {emailTemplates[emailType].subject}
                    </div>
                    <Textarea 
                      value={generatedEmail} 
                      onChange={(e) => setGeneratedEmail(e.target.value)}
                      className="min-h-[200px] text-sm"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1">
                        <Send className="w-3 h-3 mr-1" /> Send Email
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => { setGeneratedEmail(""); handleGenerateEmail(); }}>
                        <RefreshCw className="w-3 h-3 mr-1" /> Regenerate
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="quote" className="space-y-4 mt-4">
                <div className="border rounded-lg p-4 bg-muted/20">
                  <div className="text-center space-y-2 mb-4">
                    <p className="font-semibold">{context.clientName}</p>
                    <p className="text-sm text-muted-foreground">Operations Improvement Engagement</p>
                    <div className="text-2xl font-bold text-primary">
                      {formatCurrency(feeRange.min)} — {formatCurrency(feeRange.max)}
                    </div>
                    <Badge>{selectedShape?.type || "Phased Engagement"}</Badge>
                  </div>
                  <div className="border-t pt-4 space-y-2 text-sm">
                    <p className="font-medium">Included:</p>
                    <ul className="text-muted-foreground space-y-1">
                      <li>• Operations process mapping</li>
                      <li>• System integration assessment</li>
                      <li>• Decision ownership matrix</li>
                      <li>• Implementation roadmap</li>
                    </ul>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1" onClick={() => simulateAction('pdf')}>
                    {actionCompleted.pdf ? (
                      <><CheckCircle2 className="w-3 h-3 mr-1" /> Downloaded</>
                    ) : isGenerating ? (
                      <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Generating...</>
                    ) : (
                      <><Download className="w-3 h-3 mr-1" /> Export PDF</>
                    )}
                  </Button>
                  <Button size="sm" variant="outline">
                    Preview Full Quote
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="crm" className="space-y-4 mt-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Company Record</p>
                      <p className="text-xs text-muted-foreground">{context.clientName}</p>
                    </div>
                    {actionCompleted.company ? (
                      <Badge className="bg-green-500/10 text-green-600 border-green-500/30">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Updated
                      </Badge>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => simulateAction('company')}>
                        {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : "Update"}
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Opportunity</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(feeRange.min)} - {formatCurrency(feeRange.max)}</p>
                    </div>
                    {actionCompleted.opportunity ? (
                      <Badge className="bg-green-500/10 text-green-600 border-green-500/30">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Created
                      </Badge>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => simulateAction('opportunity')}>
                        {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : "Create"}
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Activity Log</p>
                      <p className="text-xs text-muted-foreground">Assessment completed</p>
                    </div>
                    {actionCompleted.activity ? (
                      <Badge className="bg-green-500/10 text-green-600 border-green-500/30">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Logged
                      </Badge>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => simulateAction('activity')}>
                        {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : "Log"}
                      </Button>
                    )}
                  </div>
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => {
                    simulateAction('company', 800);
                    setTimeout(() => simulateAction('opportunity', 800), 1000);
                    setTimeout(() => simulateAction('activity', 800), 2000);
                  }}
                  disabled={actionCompleted.company && actionCompleted.opportunity && actionCompleted.activity}
                >
                  {actionCompleted.company && actionCompleted.opportunity && actionCompleted.activity ? (
                    <><CheckCircle2 className="w-4 h-4 mr-2" /> All CRM Updates Complete</>
                  ) : (
                    <><Database className="w-4 h-4 mr-2" /> Sync All to CRM</>
                  )}
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Completion Badge */}
      {isDemo && (
        <div className="flex justify-center gap-4 pt-4">
          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30 py-2 px-4">
            ✓ Assessment Complete
          </Badge>
        </div>
      )}
    </motion.div>
  );
}
