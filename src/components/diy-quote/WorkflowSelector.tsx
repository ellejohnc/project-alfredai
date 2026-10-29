import { memo, useState, useMemo } from 'react';
import { Switch } from '@/components/ui/switch';
import { motion } from 'framer-motion';
import { SafeAnimatePresence } from '@/components/ui/safe-animate-presence';
import { 
  Briefcase, 
  CheckCircle2, 
  X, 
  ChevronDown,
  Search,
  Plus,
  Info,
  Mic,
  ExternalLink,
  Play,
  Copy,
  Check,
  DollarSign,
  Trash2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { workflowOptions, type CustomWorkflow } from '@/hooks/useQuoteBuilder';
import { workflowDefinitions, getWorkflowById } from '@/lib/workflowDefinitions';
import { cn } from '@/lib/utils';
import { StepLabel } from './StepLabel';
import { demoComponents } from '@/pages/resources/demosData';
import { getShareableUrl } from '@/lib/siteConfig';

// Demos that have their own dedicated pages (not rendered inline on /resources/demos)
const dedicatedDemoPages: Record<string, string> = {
  'drawings-to-estimate': '/demos/drawings-to-estimate',
  'vendor-compliance': '/demos/vendor-compliance',
  'alfred-bid': '/demos/alfred-bid',
};

// Check if a workflow has a corresponding interactive demo
const hasDemo = (workflowId: string): boolean => {
  return workflowId in demoComponents || workflowId in dedicatedDemoPages;
};

// Get the demo URL for a workflow - uses production domain for external links
const getDemoUrl = (workflowId: string): string => {
  if (dedicatedDemoPages[workflowId]) {
    return getShareableUrl(dedicatedDemoPages[workflowId]);
  }
  return getShareableUrl(`/resources/demos?demo=${workflowId}`);
};

interface WorkflowSelectorProps {
  selectedWorkflows: string[];
  suggestedWorkflows?: string[];
  excludedWorkflows?: string[];
  bundlePricing?: boolean;
  customWorkflows?: CustomWorkflow[];
  onToggleWorkflow: (workflowId: string) => void;
  onDismissSuggestion?: (workflowId: string) => void;
  onClearSuggestions?: () => void;
  onToggleBundlePricing?: (value: boolean) => void;
  onAddCustomWorkflow?: (workflow: Omit<CustomWorkflow, 'id'>) => void;
  onUpdateCustomWorkflow?: (id: string, updates: Partial<Omit<CustomWorkflow, 'id'>>) => void;
  onRemoveCustomWorkflow?: (id: string) => void;
  hasTranscriptAnalysis?: boolean;
}

// Category labels for grouping
const categoryLabels: Record<string, string> = {
  workflow: 'Workflow Builder',
  knowledge: 'Knowledge & Insights',
  operations: 'Operations',
  cx: 'Customer Experience',
  butler: 'Butler AI',
  voice: 'Voice AI',
  marketplace: 'Integrations',
  property: 'Property Management',
  construction: 'Construction',
  proposals: 'Proposals',
  contracts: 'Contracts',
  inspection: 'Site Inspection',
  procurement: 'Procurement',
  recruitment: 'Recruitment',
  sales: 'Sales & CRM',
  finance: 'Finance',
  healthcare: 'Healthcare',
  insurance: 'Insurance',
  partnerships: 'Partnerships',
  legal: 'Legal',
  events: 'Events',
};

// Get workflow applications from contextualized workflow definitions
const getWorkflowApplications = (workflowId: string): string[] => {
  const workflow = getWorkflowById(workflowId);
  return workflow?.applications || [];
};

// Get workflow description from contextualized workflow definitions
const getWorkflowDescription = (workflowId: string): string => {
  const workflow = getWorkflowById(workflowId);
  return workflow?.description || '';
};

export const WorkflowSelector = memo(function WorkflowSelector({
  selectedWorkflows,
  suggestedWorkflows = [],
  excludedWorkflows = [],
  bundlePricing = false,
  customWorkflows = [],
  onToggleWorkflow,
  onDismissSuggestion,
  onClearSuggestions,
  onToggleBundlePricing,
  onAddCustomWorkflow,
  onUpdateCustomWorkflow,
  onRemoveCustomWorkflow,
  hasTranscriptAnalysis = false,
}: WorkflowSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [newCustomName, setNewCustomName] = useState('');
  const [newCustomSetupFee, setNewCustomSetupFee] = useState('');
  const [newCustomMonthlyFee, setNewCustomMonthlyFee] = useState('');

  // Copy all demo links handler
  const handleCopyAllDemoLinks = async () => {
    const workflowsWithDemos = selectedWorkflowObjects.filter(w => hasDemo(w.id));
    const linksText = workflowsWithDemos
      .map(w => `${w.label}: ${getDemoUrl(w.id)}`)
      .join('\n');
    
    try {
      await navigator.clipboard.writeText(linksText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy demo links:', err);
    }
  };

  // Get selected workflow objects
  const selectedWorkflowObjects = useMemo(() => {
    return workflowOptions.filter(w => selectedWorkflows.includes(w.id));
  }, [selectedWorkflows]);

  // Get unselected workflows, filtered by search
  const unselectedWorkflows = useMemo(() => {
    return workflowOptions
      .filter(w => !selectedWorkflows.includes(w.id))
      .filter(w => 
        searchQuery === '' || 
        w.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [selectedWorkflows, searchQuery]);

  // Group unselected by category
  const groupedUnselected = useMemo(() => {
    const groups: Record<string, typeof workflowOptions> = {};
    unselectedWorkflows.forEach(w => {
      if (!groups[w.category]) {
        groups[w.category] = [];
      }
      groups[w.category].push(w);
    });
    return groups;
  }, [unselectedWorkflows]);

  return (
    <section id="step-workflows" className="space-y-4">
      <StepLabel 
        step={4} 
        title="AI Agent Workflows" 
        description="Select which AI agents to include"
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <Briefcase className="w-5 h-5 text-primary" />
          <h3>AI Agent Workflows</h3>
        </div>
        <Badge variant="secondary">
          {(selectedWorkflows.length + customWorkflows.length) > 0 
            ? `${selectedWorkflows.length + customWorkflows.length} selected${customWorkflows.length > 0 ? ` (${customWorkflows.length} custom)` : ''}` 
            : 'N/A'}
        </Badge>
      </div>

      {/* AI Suggestions from transcript — user must explicitly add */}
      {(() => {
        const pending = suggestedWorkflows.filter(id => !selectedWorkflows.includes(id));
        if (pending.length === 0) return null;
        return (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <p className="text-xs font-semibold text-primary flex items-center gap-1.5">
                ✨ AI suggested {pending.length} workflow{pending.length !== 1 ? 's' : ''} from your transcript
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => {
                    pending.forEach(id => onToggleWorkflow(id));
                    onClearSuggestions?.();
                  }}
                >
                  Add all
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground"
                  onClick={() => onClearSuggestions?.()}
                >
                  Dismiss all
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Tap to add, or dismiss if not relevant. Nothing is added until you confirm.</p>
            <div className="flex flex-wrap gap-2">
              {pending.map(id => {
                const w = workflowOptions.find(o => o.id === id);
                if (!w) return null;
                return (
                  <div key={id} className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-background pl-2.5 pr-1 py-0.5 text-xs">
                    <button
                      type="button"
                      className="font-medium text-foreground hover:text-primary"
                      onClick={() => { onToggleWorkflow(id); onDismissSuggestion?.(id); }}
                    >
                      + {w.label}
                    </button>
                    <button
                      type="button"
                      aria-label="Dismiss suggestion"
                      className="ml-1 p-0.5 rounded-full text-muted-foreground hover:text-foreground"
                      onClick={() => onDismissSuggestion?.(id)}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Selected Workflows Display */}
      {selectedWorkflows.length > 0 ? (
        <div className="space-y-3">
          {hasTranscriptAnalysis && (
            <p className="text-xs text-muted-foreground">
              ✨ Identified from transcript analysis
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <SafeAnimatePresence mode="popLayout">
              {selectedWorkflowObjects.map((workflow) => {
                const applications = getWorkflowApplications(workflow.id);
                const description = getWorkflowDescription(workflow.id);
                const isCoveredByVoiceAgent = excludedWorkflows.includes(workflow.id);
                
                return (
                  <motion.div
                    key={workflow.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    layout
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge
                          variant={isCoveredByVoiceAgent ? "secondary" : "default"}
                          className={cn(
                            "flex items-center gap-1.5 py-1.5 px-3 cursor-pointer group",
                            isCoveredByVoiceAgent 
                              ? "bg-accent/50 hover:bg-accent/70 border border-primary/30" 
                              : "bg-primary hover:bg-primary/90",
                            hasDemo(workflow.id) && "ring-1 ring-primary/30"
                          )}
                          onClick={() => onToggleWorkflow(workflow.id)}
                        >
                          {isCoveredByVoiceAgent ? (
                            <Mic className="w-3.5 h-3.5 text-primary" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          <span>{workflow.label}</span>
                          {hasDemo(workflow.id) && (
                            <span className="text-[10px] opacity-70">🎬</span>
                          )}
                          {isCoveredByVoiceAgent && (
                            <span className="text-[10px] font-medium bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                              Voice Agent
                            </span>
                          )}
                          <Info className="w-3 h-3 opacity-60" />
                          <X className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs p-3">
                        {isCoveredByVoiceAgent && (
                          <p className="text-xs font-semibold text-primary mb-2 flex items-center gap-1.5">
                            <Mic className="w-3 h-3" />
                            Covered by Voice Agent — not counted in pricing
                          </p>
                        )}
                        {description && (
                          <p className="text-xs text-muted-foreground mb-2">{description}</p>
                        )}
                        {applications.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-xs font-semibold">Applications:</p>
                            <ul className="text-xs space-y-0.5">
                              {applications.map((app, idx) => (
                                <li key={idx} className="flex items-center gap-1.5">
                                  <span className="w-1 h-1 rounded-full bg-primary" />
                                  {app}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {hasDemo(workflow.id) && (
                          <a
                            href={getDemoUrl(workflow.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="w-3 h-3" />
                            View Interactive Demo →
                          </a>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </motion.div>
                );
              })}
            </SafeAnimatePresence>
          </div>
          
          {/* Related Demo Links Section */}
          {selectedWorkflows.some(id => hasDemo(id)) && (
            <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-primary flex items-center gap-1.5">
                  <Play className="w-3 h-3" />
                  See these AI agents in action:
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyAllDemoLinks}
                  className="h-7 px-2 text-xs gap-1.5 text-muted-foreground hover:text-primary"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-green-500" />
                      <span className="text-green-500">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy All Links
                    </>
                  )}
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedWorkflowObjects
                  .filter(w => hasDemo(w.id))
                  .map((workflow) => (
                    <a
                      key={workflow.id}
                      href={getDemoUrl(workflow.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-background rounded-md border text-xs hover:border-primary hover:text-primary transition-colors"
                    >
                      <Play className="w-3 h-3" />
                      {workflow.label}
                      <ExternalLink className="w-3 h-3 opacity-50" />
                    </a>
                  ))}
              </div>
            </div>
          )}
          
          {/* Bundle Pricing Toggle */}
          {(selectedWorkflows.length + customWorkflows.length) > 1 && onToggleBundlePricing && (
            <div className="mt-3 flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">Bundle Pricing</p>
                  <p className="text-xs text-muted-foreground">Show as single bundled price on proposal</p>
                </div>
              </div>
              <Switch
                checked={bundlePricing}
                onCheckedChange={onToggleBundlePricing}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 rounded-lg bg-muted/50 border border-dashed border-border text-center">
          <p className="text-muted-foreground text-sm">
            No workflows selected. Use the dropdown below to add workflows.
          </p>
        </div>
      )}

      {/* Custom Workflows Section */}
      {onAddCustomWorkflow && (
        <div className="space-y-3">
          {customWorkflows.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Custom Workflows</p>
              {customWorkflows.map((cw) => (
                <div key={cw.id} className="flex items-center gap-2 p-3 rounded-lg border bg-card">
                  <DollarSign className="w-4 h-4 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{cw.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Setup: ${cw.setupFee.toLocaleString()} · Monthly: ${cw.monthlyFee.toLocaleString()}
                    </p>
                  </div>
                  {onRemoveCustomWorkflow && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveCustomWorkflow(cw.id)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {showCustomForm ? (
            <div className="p-4 rounded-lg border border-dashed border-primary/40 bg-primary/5 space-y-3">
              <p className="text-sm font-semibold flex items-center gap-2">
                <Plus className="w-4 h-4 text-primary" />
                Add Custom Workflow
              </p>
              <Input
                placeholder="Workflow name (e.g. Custom Integration)"
                value={newCustomName}
                onChange={(e) => setNewCustomName(e.target.value)}
                className="min-h-[44px]"
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Setup Fee ($)</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={newCustomSetupFee}
                    onChange={(e) => setNewCustomSetupFee(e.target.value)}
                    min={0}
                    className="min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Monthly Fee ($)</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={newCustomMonthlyFee}
                    onChange={(e) => setNewCustomMonthlyFee(e.target.value)}
                    min={0}
                    className="min-h-[44px]"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    if (newCustomName.trim()) {
                      onAddCustomWorkflow({
                        name: newCustomName.trim(),
                        setupFee: parseFloat(newCustomSetupFee) || 0,
                        monthlyFee: parseFloat(newCustomMonthlyFee) || 0,
                      });
                      setNewCustomName('');
                      setNewCustomSetupFee('');
                      setNewCustomMonthlyFee('');
                      setShowCustomForm(false);
                    }
                  }}
                  disabled={!newCustomName.trim()}
                  className="min-h-[44px]"
                >
                  Add Workflow
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowCustomForm(false);
                    setNewCustomName('');
                    setNewCustomSetupFee('');
                    setNewCustomMonthlyFee('');
                  }}
                  className="min-h-[44px]"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCustomForm(true)}
              className="gap-2 min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              Add Custom Workflow
            </Button>
          )}
        </div>
      )}

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between"
            role="combobox"
            aria-expanded={isOpen}
          >
            <span className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Workflows
              {unselectedWorkflows.length > 0 && (
                <span className="text-muted-foreground">
                  ({unselectedWorkflows.length} available)
                </span>
              )}
            </span>
            <ChevronDown className={cn(
              "w-4 h-4 transition-transform",
              isOpen && "rotate-180"
            )} />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-[400px] p-0 bg-popover border border-border shadow-lg z-50" 
          align="start"
          sideOffset={4}
        >
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search workflows..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <ScrollArea className="h-[300px]">
            <div className="p-2">
              {Object.keys(groupedUnselected).length === 0 ? (
                <p className="text-center text-muted-foreground py-4 text-sm">
                  {searchQuery ? 'No workflows match your search' : 'All workflows selected'}
                </p>
              ) : (
                Object.entries(groupedUnselected).map(([category, workflows]) => (
                  <div key={category} className="mb-3 last:mb-0">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1">
                      {categoryLabels[category] || category}
                    </p>
                    <div className="space-y-1">
                      {workflows.map((workflow) => {
                        const applications = getWorkflowApplications(workflow.id);
                        
                        return (
                          <Tooltip key={workflow.id}>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() => {
                                  onToggleWorkflow(workflow.id);
                                }}
                                className={cn(
                                  "w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors",
                                  "hover:bg-primary/10 hover:text-primary",
                                  "focus:outline-none focus:bg-primary/10 focus:text-primary"
                                )}
                              >
                                <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/50 flex items-center justify-center flex-shrink-0" />
                                <span className="text-sm flex-1">{workflow.label}</span>
                                <Info className="w-3.5 h-3.5 text-muted-foreground" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-xs p-3">
                              {applications.length > 0 ? (
                                <div className="space-y-1">
                                  <p className="text-xs font-semibold">Applications:</p>
                                  <ul className="text-xs space-y-0.5">
                                    {applications.map((app, idx) => (
                                      <li key={idx} className="flex items-center gap-1.5">
                                        <span className="w-1 h-1 rounded-full bg-primary" />
                                        {app}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ) : (
                                <p className="text-xs text-muted-foreground">AI-powered workflow automation</p>
                              )}
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </section>
  );
});
