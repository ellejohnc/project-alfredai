import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { SafeAnimatePresence } from '@/components/ui/safe-animate-presence';
import { 
  ChevronDown, 
  ChevronUp,
  Phone, 
  MessageSquare, 
  Mail, 
  Mic,
  Globe,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  AlertCircle,
  Plus,
  Minus
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { SliderWithArrows } from '@/components/ui/slider-with-arrows';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { StepLabel } from './StepLabel';
import { cn } from '@/lib/utils';
import { VoiceAgentSelection, VoiceAgentPlan, voiceAgentPlans, calculateVoiceAgentCosts } from '@/hooks/useQuoteBuilder';

interface VoiceAgentStepProps {
  selection: VoiceAgentSelection;
  onUpdateSelection: (selection: VoiceAgentSelection) => void;
  aiRecommendedPlan?: VoiceAgentPlan | null;
  aiRationale?: string;
}

export const VoiceAgentStep = memo(function VoiceAgentStep({
  selection,
  onUpdateSelection,
  aiRecommendedPlan,
  aiRationale,
}: VoiceAgentStepProps) {
  // Start expanded if no plan is selected yet, making manual selection obvious
  const [isExpanded, setIsExpanded] = useState(!selection.planId);
  
  const costs = calculateVoiceAgentCosts(selection, selection.workflowCount);
  const selectedPlan = selection.planId ? voiceAgentPlans.find(p => p.id === selection.planId) : null;
  const hasPlan = selection.planId && selection.planId !== 'none';

  const handlePlanSelect = (planId: VoiceAgentPlan) => {
    onUpdateSelection({
      ...selection,
      planId,
      aiRecommended: planId === aiRecommendedPlan,
    });
  };

  const handleAddonChange = <K extends keyof VoiceAgentSelection['addons']>(
    key: K,
    value: VoiceAgentSelection['addons'][K]
  ) => {
    onUpdateSelection({
      ...selection,
      addons: {
        ...selection.addons,
        [key]: value,
      },
    });
  };

  const handleWorkflowCountChange = (count: number) => {
    onUpdateSelection({
      ...selection,
      workflowCount: Math.max(1, Math.min(10, count)),
    });
  };

  return (
    <section id="step-voice-agent" className="space-y-4">
      <StepLabel 
        step="4a" 
        title="Voice Agent" 
        description="Optional AI-powered voice agent for sales calls"
        isOptional
      />
      
      {/* Collapsible Header */}
      <motion.button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-full flex items-center justify-between p-4 rounded-lg border transition-all",
          "bg-card hover:bg-muted/50",
          isExpanded ? "border-primary" : "border-border",
          hasPlan && "border-green-500/50 bg-green-50/50 dark:bg-green-950/20"
        )}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            hasPlan ? "bg-green-500/20 text-green-600" : "bg-muted text-muted-foreground"
          )}>
            <Phone className="w-5 h-5" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">Voice Agent</h3>
              {aiRecommendedPlan && (
                <Badge variant="secondary" className="text-xs">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI Suggested
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {hasPlan && selectedPlan
                ? `${selectedPlan.name} - $${costs.monthly.toLocaleString()}/mo`
                : 'Click to configure voice agent options'
              }
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasPlan && (
            <Badge variant="default" className="bg-green-500 hover:bg-green-600">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Configured
            </Badge>
          )}
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          </motion.div>
        </div>
      </motion.button>

      <SafeAnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="space-y-6 pt-2">
              {/* Description Card */}
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-sm">
                  Our Voice Agent covers your entire sales cycle — from the first call to the final appointment, 
                  with SMS and email follow-ups built in.
                </p>
              </div>

              {/* AI Recommendation */}
              {aiRecommendedPlan && aiRationale && (
                <div className="p-4 rounded-lg bg-purple-50 border border-purple-200 dark:bg-purple-950/30 dark:border-purple-800">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                        AI Recommendation: {voiceAgentPlans.find(p => p.id === aiRecommendedPlan)?.name}
                      </p>
                      <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                        {aiRationale}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Plan Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Select a Plan</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {voiceAgentPlans.map((plan) => {
                    const isSelected = selection.planId === plan.id;
                    const isRecommended = plan.id === aiRecommendedPlan;
                    
                    // Get full inclusions for tooltip
                    const getFullInclusions = () => {
                      if (plan.id === 'none') return null;
                      
                      if (plan.id === 'starter') {
                        return (
                          <div className="space-y-2 text-xs">
                            <p className="font-semibold text-sm">Starter Plan Includes:</p>
                            <ul className="space-y-1">
                              <li>• 10 Knowledge Base bots</li>
                              <li>• 250 minutes phone time</li>
                              <li>• 200 SMS messages</li>
                              <li>• 200 emails</li>
                              <li>• Sales workflow automation</li>
                              <li>• SMS & email follow-ups</li>
                              <li>• Calendar integration</li>
                              <li>• Basic CRM sync</li>
                            </ul>
                            <p className="text-muted-foreground mt-2">Perfect for small teams getting started with AI voice automation.</p>
                          </div>
                        );
                      }
                      
                      if (plan.id === 'growth') {
                        return (
                          <div className="space-y-2 text-xs">
                            <p className="font-semibold text-sm">Growth Plan Includes:</p>
                            <ul className="space-y-1">
                              <li>• 30 Knowledge Base bots</li>
                              <li>• 1,500 minutes phone time</li>
                              <li>• 500 SMS messages</li>
                              <li>• 500 emails</li>
                              <li>• All Starter features plus:</li>
                              <li>• Advanced workflow branching</li>
                              <li>• Priority support</li>
                              <li>• Custom call scripts</li>
                              <li>• Appointment reminders</li>
                            </ul>
                            <p className="text-muted-foreground mt-2">Ideal for growing teams with higher call volumes.</p>
                          </div>
                        );
                      }
                      
                      if (plan.id === 'scale') {
                        return (
                          <div className="space-y-2 text-xs">
                            <p className="font-semibold text-sm">Scale Plan Includes:</p>
                            <ul className="space-y-1">
                              <li>• 30 Knowledge Base bots</li>
                              <li>• 3,000 minutes phone time</li>
                              <li>• 1,500 SMS messages</li>
                              <li>• 1,500 emails</li>
                              <li>• All Growth features plus:</li>
                              <li>• Advanced analytics dashboard</li>
                              <li>• A/B testing for scripts</li>
                              <li>• Multi-campaign support</li>
                              <li>• Dedicated success manager</li>
                            </ul>
                            <p className="text-muted-foreground mt-2">Best for high-volume sales operations.</p>
                          </div>
                        );
                      }
                      
                      if (plan.id === 'enterprise-10k') {
                        return (
                          <div className="space-y-2 text-xs">
                            <p className="font-semibold text-sm">Enterprise 10K Includes:</p>
                            <ul className="space-y-1">
                              <li>• Platform fee: $3,200+GST/month</li>
                              <li>• 10,000 minutes included</li>
                              <li>• $0.25/min above 10K minutes</li>
                              <li>• Unlimited KB bots</li>
                              <li>• All Scale features plus:</li>
                              <li>• White-label options</li>
                              <li>• Custom API integrations</li>
                              <li>• SLA guarantees</li>
                              <li>• 24/7 priority support</li>
                            </ul>
                            <p className="text-muted-foreground mt-2">For enterprises with high-volume calling needs.</p>
                          </div>
                        );
                      }
                      
                      if (plan.id === 'enterprise-20k') {
                        return (
                          <div className="space-y-2 text-xs">
                            <p className="font-semibold text-sm">Enterprise 20K Includes:</p>
                            <ul className="space-y-1">
                              <li>• Platform fee: $3,900+GST/month</li>
                              <li>• 20,000 minutes included</li>
                              <li>• $0.18/min above 20K minutes</li>
                              <li>• Unlimited KB bots</li>
                              <li>• All Enterprise 10K features</li>
                              <li>• Lower per-minute overage rate</li>
                              <li>• Volume discounts available</li>
                              <li>• Custom contract terms</li>
                            </ul>
                            <p className="text-muted-foreground mt-2">Best rate for very high-volume operations.</p>
                          </div>
                        );
                      }
                      
                      if (plan.id === 'payg') {
                        return (
                          <div className="space-y-2 text-xs">
                            <p className="font-semibold text-sm">Pay-as-you-go Includes:</p>
                            <ul className="space-y-1">
                              <li>• No monthly subscription</li>
                              <li>• $0.40 per minute used</li>
                              <li>• One-time setup: $2,500/workflow</li>
                              <li>• 1-week setup covering:</li>
                              <li className="ml-2">- Sales workflow discovery</li>
                              <li className="ml-2">- AI Agent & SLM selection</li>
                              <li className="ml-2">- Prompt engineering</li>
                              <li className="ml-2">- Dashboard setup</li>
                              <li className="ml-2">- CRM integration</li>
                              <li className="ml-2">- Twilio setup + triggers</li>
                              <li className="ml-2">- Email + SMS notifications</li>
                              <li className="ml-2">- Calendar invite connection</li>
                            </ul>
                            <p className="text-muted-foreground mt-2">Flexible option for variable usage patterns.</p>
                          </div>
                        );
                      }
                      
                      return null;
                    };
                    
                    const tooltipContent = getFullInclusions();
                    
                    return (
                      <TooltipProvider key={plan.id}>
                        <Tooltip delayDuration={300}>
                          <TooltipTrigger asChild>
                            <motion.div
                              className={cn(
                                "relative flex flex-col p-4 rounded-lg border text-left transition-all cursor-pointer",
                                isSelected
                                  ? "bg-primary/10 border-primary ring-2 ring-primary/20"
                                  : "bg-card border-border hover:border-primary/50 hover:bg-muted/50",
                                plan.id === 'none' && "bg-muted/30"
                              )}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handlePlanSelect(plan.id)}
                            >
                              {isRecommended && (
                                <div className="absolute -top-2 -right-2">
                                  <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                                    <Sparkles className="w-3 h-3 mr-1" />
                                    Suggested
                                  </Badge>
                                </div>
                              )}
                              
                              <div className="flex items-start gap-3">
                                <div className={cn(
                                  "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5",
                                  isSelected ? "border-primary bg-primary" : "border-muted-foreground"
                                )}>
                                  {isSelected && <CheckCircle2 className="w-3 h-3 text-primary-foreground" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1">
                                      <span className="font-medium text-sm">{plan.name}</span>
                                      {tooltipContent && (
                                        <HelpCircle className="w-3.5 h-3.5 text-muted-foreground" />
                                      )}
                                    </div>
                                    {plan.monthlyFee > 0 && (
                                      <span className="text-sm font-semibold text-primary">
                                        ${plan.monthlyFee.toLocaleString()}/mo
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {plan.description}
                                  </p>
                                  {plan.included && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {plan.included.minutes && (
                                        <Badge variant="outline" className="text-xs">
                                          <Phone className="w-3 h-3 mr-1" />
                                          {plan.included.minutes} min
                                        </Badge>
                                      )}
                                      {plan.included.sms && (
                                        <Badge variant="outline" className="text-xs">
                                          <MessageSquare className="w-3 h-3 mr-1" />
                                          {plan.included.sms} SMS
                                        </Badge>
                                      )}
                                      {plan.included.emails && (
                                        <Badge variant="outline" className="text-xs">
                                          <Mail className="w-3 h-3 mr-1" />
                                          {plan.included.emails} emails
                                        </Badge>
                                      )}
                                    </div>
                                  )}
                                  
                                  {/* Workflow count selector - only show when selected and has setup fee */}
                                  {isSelected && plan.id !== 'none' && (
                                    <div 
                                      className="mt-3 pt-3 border-t border-border"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1">
                                          <span className="text-xs font-medium">Workflows</span>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                                            </TooltipTrigger>
                                            <TooltipContent className="max-w-xs">
                                              <p>Each workflow requires $2,500 setup</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleWorkflowCountChange(selection.workflowCount - 1);
                                            }}
                                            disabled={selection.workflowCount <= 1}
                                            className={cn(
                                              "w-6 h-6 rounded flex items-center justify-center border transition-colors",
                                              selection.workflowCount <= 1
                                                ? "bg-muted text-muted-foreground cursor-not-allowed"
                                                : "bg-background hover:bg-muted border-border"
                                            )}
                                          >
                                            <Minus className="w-3 h-3" />
                                          </button>
                                          <span className="w-8 text-center font-semibold text-sm">
                                            {selection.workflowCount}
                                          </span>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleWorkflowCountChange(selection.workflowCount + 1);
                                            }}
                                            disabled={selection.workflowCount >= 10}
                                            className={cn(
                                              "w-6 h-6 rounded flex items-center justify-center border transition-colors",
                                              selection.workflowCount >= 10
                                                ? "bg-muted text-muted-foreground cursor-not-allowed"
                                                : "bg-background hover:bg-muted border-border"
                                            )}
                                          >
                                            <Plus className="w-3 h-3" />
                                          </button>
                                        </div>
                                      </div>
                                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5 text-right">
                                        Setup: ${(2500 * selection.workflowCount).toLocaleString()} ({selection.workflowCount} × $2,500)
                                      </p>
                                    </div>
                                  )}
                                  
                                  {/* Show base setup fee for unselected cards */}
                                  {!isSelected && plan.setupFee > 0 && (
                                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                                      Setup from: ${plan.setupFee.toLocaleString()}/workflow
                                    </p>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          </TooltipTrigger>
                          {tooltipContent && (
                            <TooltipContent side="right" className="max-w-xs p-3">
                              {tooltipContent}
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </div>
              </div>

              {/* Add-ons Section (only when a paid plan is selected) */}
              {hasPlan && selection.planId !== 'payg' && (
                <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">Add-ons</h4>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>Optional extras to enhance your voice agent capabilities.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  <TooltipProvider>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Extra Minutes */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Label className="text-sm">Extra Minutes</Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>$0.40/min for additional call time</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {selection.addons.extraMinutes} min = ${(selection.addons.extraMinutes * 0.4).toFixed(0)}
                          </span>
                        </div>
                        <SliderWithArrows
                          value={[selection.addons.extraMinutes]}
                          onValueChange={([value]) => handleAddonChange('extraMinutes', value)}
                          min={0}
                          max={5000}
                          step={100}
                        />
                      </div>

                      {/* Extra SMS */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Label className="text-sm">Extra SMS</Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>$0.03/msg for additional SMS messages</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {selection.addons.extraSMS} msg = ${(selection.addons.extraSMS * 0.03).toFixed(0)}
                          </span>
                        </div>
                        <SliderWithArrows
                          value={[selection.addons.extraSMS]}
                          onValueChange={([value]) => handleAddonChange('extraSMS', value)}
                          min={0}
                          max={2000}
                          step={50}
                        />
                      </div>

                      {/* Extra Emails */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Label className="text-sm">Extra Emails</Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>$0.01/msg for additional email messages</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {selection.addons.extraEmails} emails = ${(selection.addons.extraEmails * 0.01).toFixed(0)}
                          </span>
                        </div>
                        <SliderWithArrows
                          value={[selection.addons.extraEmails]}
                          onValueChange={([value]) => handleAddonChange('extraEmails', value)}
                          min={0}
                          max={5000}
                          step={100}
                        />
                      </div>

                      {/* Private Voice */}
                      <div className="flex items-center justify-between p-3 rounded-lg border bg-background">
                        <div className="flex items-center gap-2">
                          <Mic className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <Label className="text-sm">Private Voice</Label>
                            <p className="text-xs text-muted-foreground">Custom brand tone</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">$39/mo</span>
                          <Switch
                            checked={selection.addons.privateVoice}
                            onCheckedChange={(checked) => handleAddonChange('privateVoice', checked)}
                          />
                        </div>
                      </div>

                      {/* Multi-language */}
                      <div className="space-y-2 p-3 rounded-lg border bg-background">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <Label className="text-sm">Multi-language</Label>
                              <p className="text-xs text-muted-foreground">$19/mo per language</p>
                            </div>
                          </div>
                          <Switch
                            checked={selection.addons.multiLanguage}
                            onCheckedChange={(checked) => handleAddonChange('multiLanguage', checked)}
                          />
                        </div>
                        {selection.addons.multiLanguage && (
                          <div className="pt-2">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span>Languages</span>
                              <span>{selection.addons.languageCount} = ${selection.addons.languageCount * 19}/mo</span>
                            </div>
                            <SliderWithArrows
                              value={[selection.addons.languageCount]}
                              onValueChange={([value]) => handleAddonChange('languageCount', value)}
                              min={1}
                              max={10}
                              step={1}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </TooltipProvider>
                </div>
              )}

              {/* Cost Summary */}
              {hasPlan ? (
                <div className="p-4 rounded-lg bg-green-50 border border-green-200 dark:bg-green-950/30 dark:border-green-800">
                  <h4 className="font-medium text-green-700 dark:text-green-300 mb-3">
                    Voice Agent Cost Summary
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-green-600 dark:text-green-400">Monthly Cost</p>
                      <p className="text-lg font-semibold text-green-700 dark:text-green-300">
                        ${costs.monthly.toLocaleString()}/mo
                      </p>
                    </div>
                    {costs.setup > 0 && (
                      <div>
                        <p className="text-sm text-green-600 dark:text-green-400">One-time Setup</p>
                        <p className="text-lg font-semibold text-green-700 dark:text-green-300">
                          ${costs.setup.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                  {selection.planId === 'payg' && (
                    <div className="mt-3 flex items-start gap-2 text-sm text-amber-600 dark:text-amber-400">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <p>Pay-as-you-go: $0.40/min usage-based billing</p>
                    </div>
                  )}
                  <p className="text-xs text-green-600/70 dark:text-green-400/70 mt-3">
                    *Prices exclude GST (Australia) / tax (other regions)
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-muted/50 border border-border text-center">
                  <p className="text-muted-foreground">N/A - No voice agent plan selected</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </SafeAnimatePresence>
    </section>
  );
});
