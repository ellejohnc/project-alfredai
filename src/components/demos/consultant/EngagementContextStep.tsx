import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Building2, Users, TrendingUp, MessageSquare, Phone, FileText, Upload, Link2, Mic, Database, Check, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import type { EngagementContext } from "./types";
import { INDUSTRIES, REVENUE_BANDS, INSIGHT_SOURCES } from "./types";
import accountableLogo from "@/assets/logos/accountable-link.svg";

interface EngagementContextStepProps {
  data: EngagementContext;
  aiCommentary: string;
  isDemo?: boolean;
  onAnalysisComplete?: () => void;
}

const AI_NOTE_TAKERS = [
  { id: "otter", name: "Otter.ai", icon: "🦦" },
  { id: "fireflies", name: "Fireflies.ai", icon: "🔥" },
  { id: "gong", name: "Gong", icon: "🔔" },
  { id: "chorus", name: "Chorus", icon: "🎵" },
  { id: "fathom", name: "Fathom", icon: "📊" },
];

const CRM_INTEGRATIONS = [
  { id: "accountable", name: "Accountable.link", icon: "accountable", isLogo: true },
  { id: "salesforce", name: "Salesforce", icon: "☁️" },
  { id: "hubspot", name: "HubSpot", icon: "🧡" },
  { id: "pipedrive", name: "Pipedrive", icon: "📈" },
  { id: "dynamics", name: "Microsoft Dynamics", icon: "🔷" },
];

const SAMPLE_MEETING_NOTES = `[00:00:12] Jane Smith: Thanks for taking the time today. So we're Meridian Healthcare Group, about $180 million in revenue, 12 facilities across three states.

[00:00:28] You: Great, thanks Sarah. What prompted you to reach out?

[00:00:35] Jane Smith: Honestly, we had a failed ERP implementation last year and we're still dealing with the fallout. Our processes are a mess.

[00:01:02] Michael Torres: Yeah, I'm VP of Operations here. My team is spending 15 plus hours a week just on data entry and updating systems manually. Patient scheduling, billing reconciliation, inventory—it's all disconnected.

[00:01:28] David Park: David here, CFO. We're bleeding money on overtime for administrative tasks. And we just had a compliance audit that flagged documentation gaps. That's a big deal in healthcare.

[00:02:15] You: What systems are you currently using?

[00:02:22] Jane Smith: Epic for EHR, QuickBooks Enterprise for accounting, and then... honestly, a lot of Access databases and Excel spreadsheets.

[00:02:45] You: What's driving the timeline here?

[00:02:50] David Park: New state regulations go into effect Q3. We need automated reporting or we're looking at penalties.

[00:03:18] You: And budget-wise, what are you thinking?

[00:03:25] David Park: For the right solution, $200 to $400K range. But I need to see clear ROI. Board has to approve anything over $150K.

[00:04:02] Michael Torres: One thing—our IT team is just two people and they're already stretched thin. Whatever we do needs to account for that.

[00:04:30] Jane Smith: And honestly, we had a bad experience with our last vendor. There are some trust issues we need to work through.

[00:05:10] You: Understood. What are the next steps from your side?

[00:05:18] Jane Smith: We'd like a proposal within two weeks. I'm championing this internally but David holds the budget authority.`;

// Extracted data from transcript analysis
const EXTRACTED_DATA = {
  clientName: "Meridian Healthcare Group",
  industry: "Healthcare",
  revenueBand: "$100M+",
  engagementTrigger: "Failed ERP implementation last year, manual processes causing 15+ hours/week of data entry, compliance audit flagged documentation gaps, new state regulations effective Q3 require automated reporting",
  insightSource: "Discovery Call",
};

export function EngagementContextStep({ data, aiCommentary, isDemo = true, onAnalysisComplete }: EngagementContextStepProps) {
  const [transcriptInput, setTranscriptInput] = useState(isDemo ? SAMPLE_MEETING_NOTES : "");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [connectedIntegrations, setConnectedIntegrations] = useState<string[]>([]);
  const [inputSource, setInputSource] = useState<"paste" | "ai-notes" | "crm">("paste");
  const [countdown, setCountdown] = useState<number | null>(null);
  
  // Local state for extracted fields (allows demo to show population)
  const [extractedData, setExtractedData] = useState({
    clientName: data.clientName,
    industry: data.industry,
    revenueBand: data.revenueBand,
    engagementTrigger: data.engagementTrigger,
    insightSource: data.insightSource,
  });

  const handleAnalyzeTranscript = () => {
    if (!transcriptInput.trim()) {
      toast({
        title: "No content to analyze",
        description: "Please paste a transcript or meeting notes first.",
        variant: "destructive",
      });
      return;
    }
    
    setIsAnalyzing(true);
    // Simulate analysis with progressive field population
    setTimeout(() => {
      setExtractedData(prev => ({ ...prev, clientName: EXTRACTED_DATA.clientName }));
    }, 400);
    setTimeout(() => {
      setExtractedData(prev => ({ ...prev, industry: EXTRACTED_DATA.industry }));
    }, 700);
    setTimeout(() => {
      setExtractedData(prev => ({ ...prev, revenueBand: EXTRACTED_DATA.revenueBand }));
    }, 1000);
    setTimeout(() => {
      setExtractedData(prev => ({ ...prev, insightSource: EXTRACTED_DATA.insightSource }));
    }, 1300);
    setTimeout(() => {
      setExtractedData(prev => ({ ...prev, engagementTrigger: EXTRACTED_DATA.engagementTrigger }));
    }, 1600);
    setTimeout(() => {
      setIsAnalyzing(false);
      setHasAnalyzed(true);
      toast({
        title: "Transcript Analyzed",
        description: "Client context extracted and fields auto-populated.",
      });
      // Start countdown before auto-advance
      setCountdown(3);
    }, 2000);
  };

  // Countdown effect
  useEffect(() => {
    if (countdown === null) return;
    
    if (countdown === 0) {
      setCountdown(null);
      onAnalysisComplete?.();
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(prev => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, onAnalysisComplete]);

  const handleConnectIntegration = (integrationId: string, name: string) => {
    if (connectedIntegrations.includes(integrationId)) {
      toast({
        title: "Already Connected",
        description: `${name} is already connected.`,
      });
      return;
    }
    
    // Simulate connection
    toast({
      title: "Connecting...",
      description: `Connecting to ${name}...`,
    });
    
    setTimeout(() => {
      setConnectedIntegrations(prev => [...prev, integrationId]);
      toast({
        title: "Connected Successfully",
        description: `${name} connected. Recent meeting notes are now available.`,
      });
    }, 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Data Input Section */}
      <Card className="border-primary/20">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Initial Assessment Input</h3>
              </div>
              <Badge variant="outline" className="text-xs">Step 1: Data Collection</Badge>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Provide meeting notes, transcripts, or connect to your existing tools to auto-populate the engagement context.
            </p>

            <Tabs value={inputSource} onValueChange={(v) => setInputSource(v as typeof inputSource)} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="paste" className="gap-2">
                  <Upload className="w-4 h-4" />
                  <span className="hidden sm:inline">Paste Transcript</span>
                  <span className="sm:hidden">Paste</span>
                </TabsTrigger>
                <TabsTrigger value="ai-notes" className="gap-2">
                  <Mic className="w-4 h-4" />
                  <span className="hidden sm:inline">AI Note Taker</span>
                  <span className="sm:hidden">AI Notes</span>
                </TabsTrigger>
                <TabsTrigger value="crm" className="gap-2">
                  <Database className="w-4 h-4" />
                  <span className="hidden sm:inline">CRM Integration</span>
                  <span className="sm:hidden">CRM</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="paste" className="space-y-4 mt-4">
                <Textarea
                  placeholder="Paste your meeting transcript, discovery call notes, or any relevant context about the prospect..."
                  value={transcriptInput}
                  onChange={(e) => setTranscriptInput(e.target.value)}
                  className="min-h-[150px] resize-none"
                  disabled={isDemo}
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    AI will extract client name, industry, triggers, and pain points automatically.
                  </p>
                  <Button 
                    onClick={handleAnalyzeTranscript} 
                    disabled={isAnalyzing}
                    size="sm"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4 mr-2" />
                        Analyze & Extract
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="ai-notes" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {AI_NOTE_TAKERS.map((tool) => {
                    const isConnected = connectedIntegrations.includes(tool.id);
                    return (
                      <Button
                        key={tool.id}
                        variant={isConnected ? "default" : "outline"}
                        className="h-auto py-4 flex flex-col gap-2"
                        onClick={() => handleConnectIntegration(tool.id, tool.name)}
                        disabled={isDemo}
                      >
                        <span className="text-2xl">{tool.icon}</span>
                        <span className="text-xs font-medium">{tool.name}</span>
                        {isConnected && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            <Check className="w-3 h-3 mr-1" />
                            Connected
                          </Badge>
                        )}
                      </Button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <Link2 className="w-4 h-4 text-muted-foreground shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    Connect to pull recent meeting transcripts. AI will match the client and auto-fill context.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="crm" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {CRM_INTEGRATIONS.map((crm) => {
                    const isConnected = connectedIntegrations.includes(crm.id);
                    return (
                      <Button
                        key={crm.id}
                        variant={isConnected ? "default" : "outline"}
                        className="h-auto py-4 flex flex-col gap-2"
                        onClick={() => handleConnectIntegration(crm.id, crm.name)}
                        disabled={isDemo}
                      >
                        {'isLogo' in crm && crm.isLogo ? (
                          <img src={accountableLogo} alt={crm.name} className="h-6 w-auto" />
                        ) : (
                          <span className="text-2xl">{crm.icon}</span>
                        )}
                        <span className="text-xs font-medium">{crm.name}</span>
                        {isConnected && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            <Check className="w-3 h-3 mr-1" />
                            Connected
                          </Badge>
                        )}
                      </Button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <Database className="w-4 h-4 text-muted-foreground shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    Pull contact records, deal notes, and previous interactions directly from your CRM.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Form Inputs */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-border/50 relative overflow-hidden">
            {/* Countdown Overlay */}
            {countdown !== null && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center"
              >
                <div className="text-center space-y-3">
                  <div className="relative w-16 h-16 mx-auto">
                    {/* Background circle */}
                    <svg className="w-16 h-16 transform -rotate-90">
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                        className="text-muted/30"
                      />
                      {/* Animated progress circle */}
                      <motion.circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                        className="text-primary"
                        strokeLinecap="round"
                        initial={{ strokeDasharray: "176", strokeDashoffset: "0" }}
                        animate={{ strokeDashoffset: "176" }}
                        transition={{ duration: 1, ease: "linear" }}
                        key={countdown}
                      />
                    </svg>
                    {/* Countdown number */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <motion.span 
                        key={countdown}
                        initial={{ scale: 1.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-2xl font-bold text-primary"
                      >
                        {countdown}
                      </motion.span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Proceeding to next step...
                  </p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setCountdown(null)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              </motion.div>
            )}

            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-muted-foreground">Extracted Context</h4>
                {hasAnalyzed ? (
                  <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/30">
                    <Check className="w-3 h-3 mr-1" />
                    Auto-populated
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    Awaiting analysis
                  </Badge>
                )}
              </div>

              {/* Client Name */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  Client Name
                  {extractedData.clientName !== data.clientName && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-green-500/10 text-green-600">
                      Extracted
                    </Badge>
                  )}
                </Label>
                <Input 
                  value={extractedData.clientName} 
                  readOnly={isDemo}
                  className={`transition-all duration-300 ${
                    extractedData.clientName !== data.clientName 
                      ? 'bg-green-500/10 border-green-500/30 ring-1 ring-green-500/20' 
                      : 'bg-muted/30'
                  }`}
                />
              </div>

              {/* Industry & Revenue */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    Industry
                    {extractedData.industry !== data.industry && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-green-500/10 text-green-600">
                        Extracted
                      </Badge>
                    )}
                  </Label>
                  <Select value={extractedData.industry} disabled={isDemo}>
                    <SelectTrigger className={`transition-all duration-300 ${
                      extractedData.industry !== data.industry 
                        ? 'bg-green-500/10 border-green-500/30 ring-1 ring-green-500/20' 
                        : 'bg-muted/30'
                    }`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRIES.map(ind => (
                        <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-muted-foreground" />
                    Revenue Band
                    {extractedData.revenueBand !== data.revenueBand && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-green-500/10 text-green-600">
                        Extracted
                      </Badge>
                    )}
                  </Label>
                  <Select value={extractedData.revenueBand} disabled={isDemo}>
                    <SelectTrigger className={`transition-all duration-300 ${
                      extractedData.revenueBand !== data.revenueBand 
                        ? 'bg-green-500/10 border-green-500/30 ring-1 ring-green-500/20' 
                        : 'bg-muted/30'
                    }`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REVENUE_BANDS.map(band => (
                        <SelectItem key={band} value={band}>{band}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Engagement Trigger */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-muted-foreground" />
                  Engagement Trigger
                  {extractedData.engagementTrigger !== data.engagementTrigger && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-green-500/10 text-green-600">
                      Extracted
                    </Badge>
                  )}
                </Label>
                <Textarea 
                  value={extractedData.engagementTrigger}
                  readOnly={isDemo}
                  className={`min-h-[80px] resize-none transition-all duration-300 ${
                    extractedData.engagementTrigger !== data.engagementTrigger 
                      ? 'bg-green-500/10 border-green-500/30 ring-1 ring-green-500/20' 
                      : 'bg-muted/30'
                  }`}
                />
              </div>

              {/* Source of Insight */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  Source of Insight
                  {extractedData.insightSource !== data.insightSource && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-green-500/10 text-green-600">
                      Extracted
                    </Badge>
                  )}
                </Label>
                <Select value={extractedData.insightSource} disabled={isDemo}>
                  <SelectTrigger className={`transition-all duration-300 ${
                    extractedData.insightSource !== data.insightSource 
                      ? 'bg-green-500/10 border-green-500/30 ring-1 ring-green-500/20' 
                      : 'bg-muted/30'
                  }`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INSIGHT_SOURCES.map(source => (
                      <SelectItem key={source} value={source}>{source}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: AI Commentary */}
        <div className="space-y-4">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-sm">🧠</span>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-primary">Initial Assessment</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {aiCommentary}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Risk Posture</span>
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                    Moderate-High
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Complexity Signal</span>
                  <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/30">
                    Expansion Phase
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Engagement Type</span>
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">
                    Operations
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
