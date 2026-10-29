import { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, Clock, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/pricingEngine';

interface ProposalVersion {
  id: string;
  version_number: number;
  created_at: string;
  created_by: string | null;
  change_summary: string | null;
  setup_fee_final: number | null;
  setup_fee_min: number | null;
  setup_fee_max: number | null;
  monthly_retainer_final: number | null;
  monthly_retainer_min: number | null;
  monthly_retainer_max: number | null;
  workflows: unknown;
}

interface ProposalVersionHistoryProps {
  quoteId: string;
  currentVersion?: number;
  isAdmin?: boolean;
}

export const ProposalVersionHistory = memo(function ProposalVersionHistory({
  quoteId,
  currentVersion = 1,
  isAdmin = false
}: ProposalVersionHistoryProps) {
  const [versions, setVersions] = useState<ProposalVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null);

  useEffect(() => {
    const fetchVersions = async () => {
      try {
        // Get the quote's internal ID first
        const { data: quoteData, error: quoteError } = await supabase
          .from('quotes')
          .select('id')
          .eq('quote_id', quoteId)
          .maybeSingle();

        if (quoteError || !quoteData) {
          setIsLoading(false);
          return;
        }

        const { data, error } = await supabase
          .rpc('get_quote_versions_safe', { p_quote_id: quoteData.id });


        if (error) throw error;
        setVersions(data || []);
      } catch (err) {
        console.error('Failed to fetch versions:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVersions();
  }, [quoteId]);

  if (isLoading) {
    return null;
  }

  // Only show if there are previous versions
  if (versions.length === 0) {
    return null;
  }

  // Non-admin users should not see internal revision history
  if (!isAdmin) {
    return null;
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSetupFee = (v: ProposalVersion) => {
    if (v.setup_fee_final) return formatCurrency(v.setup_fee_final);
    if (v.setup_fee_min && v.setup_fee_max) {
      return `${formatCurrency(v.setup_fee_min)} - ${formatCurrency(v.setup_fee_max)}`;
    }
    return 'N/A';
  };

  const getMonthlyFee = (v: ProposalVersion) => {
    if (v.monthly_retainer_final) return formatCurrency(v.monthly_retainer_final);
    if (v.monthly_retainer_min && v.monthly_retainer_max) {
      return `${formatCurrency(v.monthly_retainer_min)} - ${formatCurrency(v.monthly_retainer_max)}`;
    }
    return 'N/A';
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.65 }}
    >
      <Card>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-primary" />
                  <span>Proposal History</span>
                  <Badge variant="secondary" className="ml-2">
                    {versions.length} revision{versions.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground mb-4">
                Track all changes made to your proposal for complete transparency.
              </p>

              <div className="space-y-3">
                {/* Current Version Indicator */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                    {currentVersion}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">Current Version</p>
                    <p className="text-xs text-muted-foreground">
                      You are viewing the latest proposal
                    </p>
                  </div>
                  <Badge className="bg-primary">Active</Badge>
                </div>

                {/* Previous Versions */}
                <AnimatePresence>
                  {versions.map((version, index) => (
                    <motion.div
                      key={version.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border rounded-lg overflow-hidden"
                    >
                      <button
                        onClick={() => setExpandedVersion(
                          expandedVersion === version.id ? null : version.id
                        )}
                        className="w-full flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors text-left"
                      >
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-sm font-medium">
                          {version.version_number}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">
                            Version {version.version_number}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(version.created_at)}
                          </p>
                        </div>
                        {expandedVersion === version.id ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </button>

                      <AnimatePresence>
                        {expandedVersion === version.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t bg-muted/20"
                          >
                            <div className="p-4 space-y-3">
                              {version.change_summary && (
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground mb-1">
                                    Changes Made
                                  </p>
                                  <p className="text-sm">{version.change_summary}</p>
                                </div>
                              )}

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground mb-1">
                                    Setup Fee
                                  </p>
                                  <p className="text-sm font-semibold">
                                    {getSetupFee(version)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground mb-1">
                                    Monthly Retainer
                                  </p>
                                  <p className="text-sm font-semibold">
                                    {getMonthlyFee(version)}/mo
                                  </p>
                                </div>
                              </div>

                              {version.workflows && Array.isArray(version.workflows) && version.workflows.length > 0 && (
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground mb-1">
                                    Included Workflows
                                  </p>
                                  <p className="text-sm">
                                    {version.workflows.length} automation{version.workflows.length !== 1 ? 's' : ''}
                                  </p>
                                </div>
                              )}

                              {version.created_by && (
                                <p className="text-xs text-muted-foreground">
                                  Updated by: {version.created_by}
                                </p>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {versions.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">This is the original proposal</p>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </motion.section>
  );
});

export default ProposalVersionHistory;
