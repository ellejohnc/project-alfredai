import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Sparkles, Calendar, FileText, AlertCircle, ChevronDown, ChevronUp, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { ScrollArea } from '@/components/ui/scroll-area';

export function MeetingNotesAnalysis() {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [docsAnalyzed, setDocsAnalyzed] = useState(0);
  const [totalDocs, setTotalDocs] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    setAnalysis(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('analyze-meeting-notes');
      
      if (fnError) throw fnError;
      
      if (data?.error) {
        setError(data.error);
        return;
      }

      setAnalysis(data.analysis);
      setDocsAnalyzed(data.docsAnalyzed || 0);
      setTotalDocs(data.totalDocs || 0);
    } catch (err) {
      console.error('Analysis error:', err);
      const msg = err instanceof Error ? err.message : 'Analysis failed';
      setError(msg);
      toast.error('Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    const next = !expanded;
    setExpanded(next);
    if (next && !analysis && !loading) {
      runAnalysis();
    }
  };

  const handleDismiss = () => {
    setExpanded(false);
  };

  return (
    <div className="space-y-0">
      {/* Trigger Button */}
      <Button
        onClick={handleToggle}
        variant="outline"
        className="gap-2 min-h-[44px] bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20 hover:from-blue-500/20 hover:to-purple-500/20 text-blue-700 dark:text-blue-300"
      >
        <Sparkles className="h-4 w-4" />
        AI Sales Analysis
        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>

      {/* Inline Expandable Panel */}
      {expanded && (
        <Card className="mt-4 border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-purple-500/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5 text-purple-500" />
                AI Meeting Notes Analysis
              </CardTitle>
              <div className="flex items-center gap-2">
                {!loading && analysis && (
                  <Button variant="outline" size="sm" onClick={runAnalysis} className="gap-1.5 min-h-[44px]">
                    <Sparkles className="h-3.5 w-3.5" />
                    Re-analyze
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={handleDismiss} className="min-h-[44px] min-w-[44px]">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="secondary" className="gap-1">
                <Calendar className="h-3 w-3" />
                Last 30 days
              </Badge>
              {(docsAnalyzed > 0 || totalDocs > 0) && (
                <Badge variant="secondary" className="gap-1">
                  <FileText className="h-3 w-3" />
                  {docsAnalyzed} of {totalDocs} docs analyzed
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent>
            {loading && (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                <div className="text-center">
                  <p className="font-medium">Fetching & analyzing meeting notes...</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Reading documents from Google Drive and generating insights
                  </p>
                </div>
              </div>
            )}

            {error && !loading && (
              <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
                <AlertCircle className="h-8 w-8 text-destructive" />
                <p className="text-sm text-muted-foreground max-w-md">{error}</p>
                <Button variant="outline" onClick={runAnalysis} className="gap-2 mt-2 min-h-[44px]">
                  <Sparkles className="h-4 w-4" />
                  Retry
                </Button>
              </div>
            )}

            {analysis && !loading && (
              <ScrollArea className="h-[60vh]">
                <div className="prose prose-sm dark:prose-invert max-w-none pr-4">
                  <ReactMarkdown>{analysis}</ReactMarkdown>
                </div>
              </ScrollArea>
            )}

            <p className="text-xs text-muted-foreground mt-4 pt-3 border-t">
              Powered by AI · Results are suggestions, not guarantees
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
