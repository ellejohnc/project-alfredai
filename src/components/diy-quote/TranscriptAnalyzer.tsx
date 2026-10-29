import { useState, memo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { SafeAnimatePresence } from '@/components/ui/safe-animate-presence';
import { 
  Sparkles, 
  Loader2, 
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Server,
  ArrowRight,
  Plus,
  ArrowUp,
  History,
  FileText,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { TechStackItem } from '@/hooks/useQuoteBuilder';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface TranscriptAnalyzerProps {
  isAnalyzing: boolean;
  transcriptSummary: string;
  onAnalyze: (transcript: string) => void;
  currentTechStack?: TechStackItem[];
  // History props for loaded quotes
  previousTranscript?: string;
  previousSummary?: string;
  isLoadedQuote?: boolean;
}

export const TranscriptAnalyzer = memo(function TranscriptAnalyzer({
  isAnalyzing,
  transcriptSummary,
  onAnalyze,
  currentTechStack = [],
  previousTranscript = '',
  previousSummary = '',
  isLoadedQuote = false,
}: TranscriptAnalyzerProps) {
  const [transcript, setTranscript] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);
  const [showRawTranscript, setShowRawTranscript] = useState(false);

  // Clean summary text that might contain raw JSON or markdown code blocks
  const cleanSummaryText = (summary: string): string => {
    if (!summary) return '';
    
    const trimmed = summary.trim();
    
    // Check if the summary looks like raw JSON or markdown code block
    if (trimmed.startsWith('```') || trimmed.startsWith('{')) {
      // Try to extract just the summary field if it's JSON
      try {
        // First try to extract from markdown code blocks
        const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        const jsonStr = codeBlockMatch ? codeBlockMatch[1].trim() : trimmed;
        
        // Try to find and parse JSON object
        const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.summary && typeof parsed.summary === 'string') {
            return parsed.summary;
          }
        }
      } catch {
        // If parsing fails, strip code fences and return cleaned text
        return trimmed
          .replace(/```(?:json)?/g, '')
          .replace(/```/g, '')
          .replace(/^[\s\n]+|[\s\n]+$/g, '')
          .substring(0, 500);
      }
    }
    
    return summary;
  };

  // Clear local transcript state when form is reset (detected via props becoming empty)
  useEffect(() => {
    if (!transcriptSummary && !previousTranscript && !previousSummary && !isLoadedQuote) {
      setTranscript('');
    }
  }, [transcriptSummary, previousTranscript, previousSummary, isLoadedQuote]);

  const handleAnalyze = () => {
    onAnalyze(transcript);
  };

  const hasPreviousAnalysis = isLoadedQuote && (previousSummary || previousTranscript);

  return (
    <div id="step-analyze" className="border border-border rounded-xl overflow-hidden bg-card">
      {/* Header - clickable to expand/collapse */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm flex-shrink-0">
            1
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">Analyze Meeting Transcript</h3>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Optional</span>
              {hasPreviousAnalysis && (
                <Badge variant="outline" className="text-xs border-amber-300 bg-amber-50 text-amber-700">
                  <History className="w-3 h-3 mr-1" />
                  Has History
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Paste transcript to auto-fill the form with AI
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        )}
      </button>

      <SafeAnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 space-y-4">
              {/* Previous Analysis History Section */}
              {hasPreviousAnalysis && (
                <Collapsible open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
                  <div className="bg-amber-50/50 border border-amber-200/50 rounded-lg overflow-hidden">
                    <CollapsibleTrigger asChild>
                      <button
                        type="button"
                        className="w-full flex items-center justify-between p-3 hover:bg-amber-100/50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <History className="w-4 h-4 text-amber-600" />
                          <span className="text-sm font-medium text-amber-700">Previous Analysis</span>
                          <Badge variant="outline" className="text-xs border-amber-300 bg-amber-100 text-amber-700">
                            From loaded quote
                          </Badge>
                        </div>
                        {isHistoryOpen ? (
                          <ChevronUp className="w-4 h-4 text-amber-600" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-amber-600" />
                        )}
                      </button>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <div className="px-3 pb-3 space-y-3">
                        {/* Previous AI Summary */}
                        {previousSummary && (
                          <div className="p-3 bg-white/80 rounded-md border border-amber-200/30">
                            <div className="flex items-start gap-2">
                              <Sparkles className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                              <div className="space-y-1 flex-1">
                                <p className="text-xs font-medium text-amber-700">AI Summary</p>
                                <p className="text-sm text-muted-foreground select-text cursor-text">{previousSummary}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Previous Raw Transcript (collapsible) */}
                        {previousTranscript && (
                          <div className="space-y-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowRawTranscript(!showRawTranscript)}
                              className="gap-2 text-xs text-amber-700 hover:text-amber-800 hover:bg-amber-100/50 h-7"
                            >
                              {showRawTranscript ? (
                                <>
                                  <EyeOff className="w-3 h-3" />
                                  Hide Raw Transcript
                                </>
                              ) : (
                                <>
                                  <Eye className="w-3 h-3" />
                                  View Raw Transcript ({previousTranscript.split(/\s+/).length} words)
                                </>
                              )}
                            </Button>
                            
                            <SafeAnimatePresence>
                              {showRawTranscript && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <div className="p-3 bg-muted/50 rounded-md border max-h-48 overflow-y-auto">
                                    <div className="flex items-start gap-2">
                                      <FileText className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                      <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono flex-1">
                                        {previousTranscript}
                                      </pre>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </SafeAnimatePresence>
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              )}

              {/* Separator for loaded quotes */}
              {hasPreviousAnalysis && (
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground font-medium">Add New Transcript</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
              )}

              {/* New Transcript Input - wrapper provides space for focus ring */}
              <div className="p-0.5 -m-0.5">
                <Textarea
                  placeholder="Paste your meeting transcript here... The AI will extract company name, industry, team size, challenges, and recommended workflows."
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  rows={6}
                  className="resize-none"
                />
              </div>

              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {transcript.length > 0 && `${transcript.split(/\s+/).length} words`}
                </p>
                <Button
                  onClick={handleAnalyze}
                  disabled={!transcript.trim() || isAnalyzing}
                  className="gap-2"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Analyze with AI
                    </>
                  )}
                </Button>
              </div>

              {/* Show current summary if available (from new analysis) */}
              {transcriptSummary && transcriptSummary !== previousSummary && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-primary/5 border border-primary/20 rounded-lg"
                >
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-primary mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-primary">AI Summary</p>
                      <p className="text-sm text-muted-foreground select-text cursor-text">{cleanSummaryText(transcriptSummary)}</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Show detected tech stack */}
              {currentTechStack.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-orange-50 border border-orange-200 rounded-lg"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Server className="w-4 h-4 text-orange-600" />
                    <p className="text-sm font-medium text-orange-700">Current Tech Stack Detected</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {currentTechStack.map((tech, i) => (
                      <Badge 
                        key={i} 
                        variant="outline" 
                        className={cn(
                          "text-xs gap-1.5 py-1",
                          tech.integrationNeed === 'replace' && "border-red-300 bg-red-50",
                          tech.integrationNeed === 'integrate' && "border-blue-300 bg-blue-50",
                          tech.integrationNeed === 'augment' && "border-green-300 bg-green-50"
                        )}
                      >
                        <span className="font-medium">{tech.name}</span>
                        <span className={cn(
                          "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium",
                          tech.integrationNeed === 'replace' && "bg-red-100 text-red-700",
                          tech.integrationNeed === 'integrate' && "bg-blue-100 text-blue-700",
                          tech.integrationNeed === 'augment' && "bg-green-100 text-green-700"
                        )}>
                          {tech.integrationNeed === 'replace' && <ArrowRight className="w-3 h-3" />}
                          {tech.integrationNeed === 'integrate' && <Plus className="w-3 h-3" />}
                          {tech.integrationNeed === 'augment' && <ArrowUp className="w-3 h-3" />}
                          {tech.integrationNeed}
                        </span>
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-orange-600 mt-2">
                    <span className="font-medium">Legend:</span>{' '}
                    <span className="text-blue-600">integrate</span> = connect to,{' '}
                    <span className="text-green-600">augment</span> = enhance,{' '}
                    <span className="text-red-600">replace</span> = move away from
                  </p>
                </motion.div>
              )}

              {/* Fallback notice */}
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <span>
                  If analysis fails, the form fields can still be filled manually. 
                  You can also paste notes instead of a full transcript.
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </SafeAnimatePresence>
    </div>
  );
});