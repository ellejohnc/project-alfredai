import { useState, useCallback, useEffect, lazy, Suspense, memo } from 'react';
import { Helmet } from 'react-helmet';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import Header from '@/components/layout/Header';
import { MinimalFooter } from '@/components/layout/MinimalFooter';
import { Lock } from 'lucide-react';
import { TranscriptAnalyzer } from '@/components/diy-quote/TranscriptAnalyzer';
import { QuoteLoader } from '@/components/diy-quote/QuoteLoader';
import { DuplicateQuoteDialog } from '@/components/diy-quote/DuplicateQuoteDialog';
import { ResetConfirmDialog } from '@/components/diy-quote/ResetConfirmDialog';
import { useQuoteBuilder } from '@/hooks/useQuoteBuilder';
import { usePaymentLinks } from '@/hooks/usePaymentLinks';
import { RegionCurrency, useRegionCurrency } from '@/hooks/useRegionCurrency';
import { useTutorial } from '@/hooks/useTutorial';
import { useDeferredSection } from '@/hooks/useDeferredSection';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { MessageSquare, FileText, HelpCircle, RotateCcw } from 'lucide-react';
import { generateQuoteId } from '@/lib/generateQuotePDF';
import { PRODUCTION_URL } from '@/lib/siteConfig';
import { supabase } from '@/integrations/supabase/client';
import { isQuoteAdminRole, isValidQuickAccessCode } from '@/lib/diyQuoteAccess';
import { SectionErrorBoundary } from '@/components/ui/section-error-boundary';
import { toast } from 'sonner';
import { 
  QuoteFormSkeleton, 
  ResultsPanelSkeleton,
} from '@/components/diy-quote/skeletons';

// Lazy load heavy components
const QuoteForm = lazy(() => import('@/components/diy-quote/QuoteForm').then(m => ({ default: m.QuoteForm })));
const QuoteResultCard = lazy(() => import('@/components/diy-quote/QuoteResultCard').then(m => ({ default: m.QuoteResultCard })));
const SimilarQuotesPanel = lazy(() => import('@/components/diy-quote/SimilarQuotesPanel').then(m => ({ default: m.SimilarQuotesPanel })));
const QuoteActions = lazy(() => import('@/components/diy-quote/QuoteActions').then(m => ({ default: m.QuoteActions })));
const PricingRecommendation = lazy(() => import('@/components/diy-quote/PricingRecommendation').then(m => ({ default: m.PricingRecommendation })));
const EmailGenerator = lazy(() => import('@/components/diy-quote/EmailGenerator').then(m => ({ default: m.EmailGenerator })));
const GuidedTutorial = lazy(() => import('@/components/diy-quote/GuidedTutorial').then(m => ({ default: m.GuidedTutorial })));
const PriceListEditor = lazy(() => import('@/components/diy-quote/PriceListEditor').then(m => ({ default: m.PriceListEditor })));

export default function DIYQuotePage() {
  const { isLoading: isAuthLoading, user, userRole, signIn } = useAdminAuth();
  // DIY Quote Save/Load is restricted to true admin roles only.
  // Non-admin authenticated users (editor, sales_rep, distributor) are NOT granted access.
  const isQuoteAdmin = isQuoteAdminRole(userRole);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [quickCode, setQuickCode] = useState('');
  const [quickCodeError, setQuickCodeError] = useState('');
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [quickAccessUsed, setQuickAccessUsed] = useState(
    sessionStorage.getItem('diy_quote_quick_access') === 'true'
  );

  // Approved partners get scoped Save/Load access to their own quotes.
  // null = still checking, true/false = resolved.
  const [partnerApproved, setPartnerApproved] = useState<boolean | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (!user || isQuoteAdmin) {
      setPartnerApproved(false);
      return;
    }
    (async () => {
      try {
        const { data } = await supabase
          .from('diy_access_requests')
          .select('status')
          .eq('user_id', user.id)
          .eq('status', 'approved')
          .maybeSingle();
        if (!cancelled) setPartnerApproved(!!data);
      } catch {
        if (!cancelled) setPartnerApproved(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user, isQuoteAdmin]);

  const hasBuilderAccess = isQuoteAdmin || partnerApproved === true;

  // While auth (or the partner-approval check) is resolving, avoid flashing the gate.
  if ((isAuthLoading || (user && !isQuoteAdmin && partnerApproved === null)) && !quickAccessUsed) {
    return (
      <>
        <Header />
        <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 pt-20 p-4">
          <RotateCcw className="w-6 h-6 text-muted-foreground animate-spin" />
        </main>
      </>
    );
  }


  if (!hasBuilderAccess && !quickAccessUsed) {
    const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoginError('');
      setIsSigningIn(true);
      try {
        const { error } = await signIn(loginEmail, loginPassword);
        if (error) {
          setLoginError(error.message || 'Invalid credentials');
        }
      } catch {
        setLoginError('Login failed. Please try again.');
      } finally {
        setIsSigningIn(false);
      }
    };

    const handleResetPassword = async () => {
      if (!loginEmail) {
        setLoginError('Please enter your email address first');
        return;
      }
      setLoginError('');
      setIsResetting(true);
      try {
        // Generate a proper single-use tokenised link server-side and send the
        // styled email in one step.
        const { error } = await supabase.functions.invoke('request-password-reset', {
          body: { email: loginEmail },
        });
        if (error) {
          toast.error('Failed to send reset email. Please try again.');
        } else {
          toast.success('Password reset email sent! Check your inbox.');
        }
      } catch {
        toast.error('Failed to send reset email. Please try again or contact support.');
      } finally {
        setIsResetting(false);
      }
    };

    const handleQuickAccess = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!isValidQuickAccessCode(quickCode)) {
        setQuickCodeError('Please enter an access code');
        return;
      }
      const code = quickCode.trim();
      setIsVerifyingCode(true);
      setQuickCodeError('');
      try {
        // Validate the code server-side (it lives in a secret, never in the
        // client bundle) so a mistyped code is rejected here instead of
        // failing silently later inside the builder.
        const { data, error } = await supabase.functions.invoke('quote-operations', {
          body: { action: 'verify_access', quickAccessCode: code },
        });
        if (error || !data?.success) {
          setQuickCodeError('That access code is not valid. Please check and try again.');
          return;
        }
        setQuickAccessUsed(true);
        sessionStorage.setItem('diy_quote_quick_access', 'true');
        // Store the typed code so the edge function can validate it server-side.
        sessionStorage.setItem('diy_quote_quick_access_code', code);
        toast.success('Quick access granted! Note: Save/Load requires admin login.');
      } catch {
        setQuickCodeError('Could not verify the code right now. Please try again or contact support.');
      } finally {
        setIsVerifyingCode(false);
      }
    };


    return (
      <>
        <Header />
        <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 pt-20 p-4">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-xl space-y-6">
            {/* Gate header */}
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <Lock className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl font-bold">DIY Quote Builder</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Choose how you'd like to access the tool
              </p>
            </div>

            {/* Signed-in but lacks admin privileges */}
            {user && !isQuoteAdmin && partnerApproved === false && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-center">
                <p className="text-sm font-medium text-foreground">
                  Your DIY Quote Builder access hasn't been approved yet.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Apply from your partner portal, then an admin will approve you. Once approved you'll get
                  Save/Load access scoped to the quotes you manage. Use the access code below for view-only mode meanwhile.
                </p>
                <a
                  href="/partners/portal/diy-access"
                  className="inline-flex items-center justify-center mt-2 text-xs font-medium text-primary underline-offset-2 hover:underline min-h-[40px]"
                >
                  Apply for access
                </a>
              </div>
            )}


            {/* Quick Access Code */}
            <div>

              <div className="text-center mb-4">
                <h2 className="text-xl font-bold mb-1">Quick Access</h2>
                <p className="text-muted-foreground text-xs">
                  Enter access code to start building quotes
                </p>
              </div>
              <form onSubmit={handleQuickAccess} className="flex gap-2">
                <input
                  type="password"
                  placeholder="Access code"
                  value={quickCode}
                  onChange={(e) => { setQuickCode(e.target.value); setQuickCodeError(''); }}
                  className="flex-1 px-3 py-2.5 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  required
                  autoFocus
                />
                <Button type="submit" className="px-5 min-h-[42px]" disabled={isVerifyingCode}>
                  {isVerifyingCode ? 'Verifying…' : 'Go'}
                </Button>
              </form>
              {quickCodeError && (
                <p className="text-sm text-destructive text-center mt-2">{quickCodeError}</p>
              )}
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or sign in for full access</span>
              </div>
            </div>

            {/* Admin Login */}
            <form onSubmit={handleLogin} className="space-y-3">
              <input
                type="email"
                placeholder="Email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                required
              />
              {loginError && (
                <p className="text-sm text-destructive text-center">{loginError}</p>
              )}
              <Button type="submit" className="w-full" variant="outline" disabled={isSigningIn}>
                {isSigningIn ? 'Signing in...' : 'Sign In with Admin Account'}
              </Button>
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={isResetting}
                className="w-full text-center text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline min-h-[40px] disabled:opacity-60"
              >
                {isResetting ? 'Sending reset link...' : 'Forgot your password?'}
              </button>
            </form>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>DIY Quote Builder | alfred ai</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <Header />
      <main className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 pt-20">
        <div className="container mx-auto px-4 py-8">
          <QuoteBuilderContent />
        </div>
      </main>
      <MinimalFooter />
    </>
  );
}

interface PageHeaderProps {
  onReset?: () => void;
  hasUnsavedChanges?: boolean;
  loadedQuoteId?: string | null;
}

const PageHeader = memo(function PageHeader({ onReset, hasUnsavedChanges, loadedQuoteId }: PageHeaderProps) {
  const tutorial = useTutorial();
  const [showResetDialog, setShowResetDialog] = useState(false);

  const handleResetClick = () => {
    setShowResetDialog(true);
  };

  const handleConfirmReset = () => {
    if (onReset) {
      try {
        onReset();
        toast.success('Quote builder has been reset');
      } catch (error) {
        console.error('Reset failed:', error);
        toast.error('Failed to reset. Please refresh the page.');
      }
    }
  };

  return (
    <>
      <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center justify-center gap-3 mb-2">
          <h1 className="text-3xl md:text-4xl font-bold">
            DIY Quote Builder
          </h1>
          <div className="flex items-center gap-2">
            {onReset && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetClick}
                className="gap-2 border-destructive/50 hover:border-destructive hover:bg-destructive/5 text-destructive hover:text-destructive transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">New Quote</span>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={tutorial.start}
              className="gap-2 relative group border-primary/50 hover:border-primary hover:bg-primary/5 transition-all"
            >
              <span className="absolute inset-0 rounded-md animate-pulse bg-primary/10" />
              <HelpCircle className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
              <span className="relative">Guide Me</span>
            </Button>
          </div>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Generate accurate quotes from meeting transcripts or manual input. 
          Calculate ROI scenarios and compare with historical quotes.
        </p>
      </div>

      <ResetConfirmDialog
        open={showResetDialog}
        onOpenChange={setShowResetDialog}
        onConfirm={handleConfirmReset}
        hasUnsavedChanges={hasUnsavedChanges}
        loadedQuoteId={loadedQuoteId}
      />

      <Suspense fallback={null}>
        <GuidedTutorial
          isActive={tutorial.isActive}
          currentStep={tutorial.currentStep}
          totalSteps={tutorial.totalSteps}
          stepData={tutorial.currentStepData}
          onNext={tutorial.next}
          onBack={tutorial.back}
          onSkip={tutorial.skip}
          onComplete={tutorial.complete}
          onGoToStep={tutorial.goToStep}
        />
      </Suspense>
    </>
  );
});

const QuoteBuilderContent = memo(function QuoteBuilderContent() {
  const {
    formData,
    clientInputs,
    pricing,
    roiCalculations,
    complexity,
    similarQuotes,
    isLoadingSimilar,
    isSaving,
    isAnalyzing,
    selectedPricingOption,
    effectivePricingOption,
    voiceAgentCosts,
    excludedWorkflows,
    updateField,
    updateClientInput,
    toggleWorkflow,
    toggleChallenge,
    addCustomWorkflow,
    updateCustomWorkflow,
    removeCustomWorkflow,
    customWorkflowTotals,
    updateVoiceAgent,
    fetchSimilarQuotes,
    saveQuote,
    analyzeTranscript,
    resetForm,
    setSelectedPricingOption,
    industryOptions,
    // Quote loading
    recentQuotes,
    searchResults,
    isLoadingRecent,
    isLoadingSearch,
    isLoadingQuote,
    loadedQuoteId,
    loadedQuoteDbId,
    hasSearched,
    fetchRecentQuotes,
    searchQuotes,
    loadQuote,
    // Quote history context
    quoteHistory,
    originalQuoteData,
    hasUserInput,
    // Duplicate detection
    duplicateMatches,
    showDuplicateDialog,
    dismissDuplicateDialog,
    // Fee update
    updateFinalFees,
    // Loaded quote financial data
    loadedQuoteFees,
  } = useQuoteBuilder();

  // Track saved quote ID and access code for payment link generation and email
  const [savedQuoteId, setSavedQuoteId] = useState<string | null>(null);
  const [savedAccessCode, setSavedAccessCode] = useState<string | null>(null);
  const [roiOverrides, setRoiOverrides] = useState<{ conservative?: number; likely?: number; best?: number }>({});
  const [resetCounter, setResetCounter] = useState(0);

  const handleRoiOverride = useCallback((scenario: 'conservative' | 'likely' | 'best', value: number) => {
    setRoiOverrides(prev => ({ ...prev, [scenario]: value }));
  }, []);

  // Region currency detection
  const regionInfo = useRegionCurrency();

  // Payment links hook
  const {
    includePaymentLinks,
    includeSlotReservation,
    setupFeeAmount,
    monthlyRetainerAmount,
    generatedLinks,
    generatedAmounts,
    installmentAmounts,
    isGenerating: isGeneratingLinks,
    generationError,
    hasPriceChanged,
    slotReservationOverride,
    effectiveSlotReservation,
    calculatedSlotReservation,
    setIncludePaymentLinks,
    setIncludeSlotReservation,
    setSetupFeeAmount,
    setMonthlyRetainerAmount,
    setSlotReservationOverride,
    generateAllPaymentLinks,
    resetPaymentLinks,
    clearGeneratedLinks,
  } = usePaymentLinks();

  // Handle save with quote ID tracking
  const handleSave = useCallback(async (
    salesRepName: string,
    options?: { isRegeneration?: boolean; changeSummary?: string }
  ) => {
    // Pass the final amounts and ROI overrides from payment link configurator
    const result = await saveQuote(
      salesRepName,
      { setupFee: setupFeeAmount, monthlyRetainer: monthlyRetainerAmount },
      Object.keys(roiOverrides).length > 0 ? roiOverrides : undefined,
      effectivePricingOption,
      options,
    );
    if (result?.id) {
      setSavedQuoteId(result.id);
    }
    if (result?.accessCode) {
      setSavedAccessCode(result.accessCode);
    }
    // Refresh past quotes list so the new/updated quote appears immediately
    try { await fetchRecentQuotes(); } catch (e) { console.warn('Refresh recent quotes failed', e); }
    return result;
  }, [saveQuote, setupFeeAmount, monthlyRetainerAmount, roiOverrides, effectivePricingOption, fetchRecentQuotes]);


  // Handle payment link generation with optional fee overrides and currency
  const handleGeneratePaymentLinks = useCallback(async (
    overrideSetupFee?: number, 
    overrideMonthlyRetainer?: number,
    currency?: RegionCurrency
  ) => {
    if (!savedQuoteId) return;
    
    // Persist the final fee overrides to DB so admin table reflects actual payment amounts
    const finalSetup = overrideSetupFee || setupFeeAmount;
    const finalMonthly = overrideMonthlyRetainer || monthlyRetainerAmount;
    if (finalSetup > 0 && finalMonthly > 0) {
      await updateFinalFees(savedQuoteId, finalSetup, finalMonthly);
    }
    
    await generateAllPaymentLinks({
      quoteId: savedQuoteId,
      companyName: formData.companyName || 'Client',
      contactEmail: formData.contactEmail,
      contactName: formData.contactName,
      pricingOption: effectivePricingOption,
      currency: currency || 'AUD', // Default to AUD if not specified
      // Pass overrides to avoid race condition with state updates
      overrideSetupFee,
      overrideMonthlyRetainer,
    });
  }, [savedQuoteId, formData.companyName, formData.contactEmail, formData.contactName, effectivePricingOption, generateAllPaymentLinks, setupFeeAmount, monthlyRetainerAmount, updateFinalFees]);

  // Sync loaded quote financial data to payment link configurator
  useEffect(() => {
    if (loadedQuoteFees && loadedQuoteId) {
      // Sync savedQuoteId so payment link generation works for loaded quotes
      if (loadedQuoteDbId) {
        setSavedQuoteId(loadedQuoteDbId);
      }
      if (loadedQuoteFees.accessCode) {
        setSavedAccessCode(loadedQuoteFees.accessCode);
      }
      if (loadedQuoteFees.setupFee && loadedQuoteFees.setupFee > 0) {
        setSetupFeeAmount(loadedQuoteFees.setupFee);
      }
      if (loadedQuoteFees.monthlyRetainer && loadedQuoteFees.monthlyRetainer > 0) {
        setMonthlyRetainerAmount(loadedQuoteFees.monthlyRetainer);
      }
      // Restore ROI overrides if they differ from calculated
      const newRoiOverrides: { conservative?: number; likely?: number; best?: number } = {};
      if (loadedQuoteFees.roiConservative != null) newRoiOverrides.conservative = Number(loadedQuoteFees.roiConservative);
      if (loadedQuoteFees.roiLikely != null) newRoiOverrides.likely = Number(loadedQuoteFees.roiLikely);
      if (loadedQuoteFees.roiBest != null) newRoiOverrides.best = Number(loadedQuoteFees.roiBest);
      if (Object.keys(newRoiOverrides).length > 0) {
        setRoiOverrides(newRoiOverrides);
      }
    }
  }, [loadedQuoteFees, loadedQuoteId, loadedQuoteDbId]);

  // Reset payment links when form is reset
  const handleReset = useCallback(() => {
    resetForm();
    setSavedQuoteId(null);
    setSavedAccessCode(null);
    resetPaymentLinks();
    setRoiOverrides({});
    setResetCounter(c => c + 1);
  }, [resetForm, resetPaymentLinks]);

  // Deferred loading for right column components
  const { shouldLoad: shouldLoadResults, ref: resultsRef } = useDeferredSection({ 
    rootMargin: '400px',
    immediate: hasUserInput // Load immediately if user has already input data
  });


  return (
    <>
      {/* Page Header with Reset */}
      <PageHeader onReset={handleReset} hasUnsavedChanges={hasUserInput} loadedQuoteId={loadedQuoteId} />
      {/* Duplicate Quote Detection Dialog */}
      <DuplicateQuoteDialog
        open={showDuplicateDialog}
        matches={duplicateMatches}
        onDismiss={dismissDuplicateDialog}
        onLoadQuote={loadQuote}
        onContinueNew={dismissDuplicateDialog}
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
      {/* Left Column - Input */}
      <div className="lg:col-span-3 space-y-6">
        {/* Quote Loader — recent quotes & search. Loads data only when the
            backend authorises the session; otherwise it shows an empty state
            (no crash) so the dropdown is always available. */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          <QuoteLoader
            recentQuotes={recentQuotes}
            isLoadingRecent={isLoadingRecent}
            isLoadingSearch={isLoadingSearch}
            isLoadingQuote={isLoadingQuote}
            searchResults={searchResults}
            loadedQuoteId={loadedQuoteId}
            hasSearched={hasSearched}
            onSearch={searchQuotes}
            onLoadQuote={loadQuote}
            onFetchRecent={fetchRecentQuotes}
          />
        </div>

        {/* Price List Reference */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 delay-75">
          <Suspense fallback={<div className="h-20 bg-card border border-border rounded-xl animate-pulse" />}>
            <PriceListEditor />
          </Suspense>
        </div>

        {/* Transcript Analyzer */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 delay-100">
          <TranscriptAnalyzer
            isAnalyzing={isAnalyzing}
            transcriptSummary={formData.transcriptSummary}
            onAnalyze={analyzeTranscript}
            currentTechStack={formData.currentTechStack}
            previousTranscript={formData.meetingTranscript}
            previousSummary={loadedQuoteId ? formData.transcriptSummary : undefined}
            isLoadedQuote={!!loadedQuoteId}
          />
        </div>

        {/* Mode Tabs */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 delay-200">
          <Tabs defaultValue="form" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="form" className="gap-2">
                <FileText className="w-4 h-4" />
                Form Mode
              </TabsTrigger>
              <TabsTrigger value="chat" className="gap-2" disabled>
                <MessageSquare className="w-4 h-4" />
                Chat Mode (Coming Soon)
              </TabsTrigger>
            </TabsList>

            <TabsContent value="form" className="space-y-0">
              <Suspense fallback={<QuoteFormSkeleton />}>
                <div className="bg-card border border-border rounded-xl p-6">
                  <QuoteForm
                    formData={formData}
                    clientInputs={clientInputs}
                    industryOptions={industryOptions}
                    quoteHistory={quoteHistory}
                    quoteDbId={loadedQuoteDbId}
                    excludedWorkflows={excludedWorkflows}
                    onUpdateField={updateField}
                    onUpdateClientInput={updateClientInput}
                    onToggleWorkflow={toggleWorkflow}
                    onToggleChallenge={toggleChallenge}
                    onAddCustomWorkflow={addCustomWorkflow}
                    onUpdateCustomWorkflow={updateCustomWorkflow}
                    onRemoveCustomWorkflow={removeCustomWorkflow}
                    onUpdateVoiceAgent={updateVoiceAgent}
                  />
                </div>
              </Suspense>
            </TabsContent>

            <TabsContent value="chat">
              <div className="bg-card border border-border rounded-xl p-6 min-h-[400px] flex items-center justify-center">
                <p className="text-muted-foreground">
                  Guided chatbot mode coming soon...
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right Column - Results */}
      <div ref={resultsRef} className="lg:col-span-2 space-y-6">
        <div className="lg:sticky lg:top-24 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 delay-300">
          {shouldLoadResults ? (
            <Suspense fallback={<ResultsPanelSkeleton />}>
              {/* Pricing Recommendation - Always show, with or without sentiment */}
              <PricingRecommendation 
                sentiment={formData.sentiment} 
                pricing={pricing}
                selectedOption={selectedPricingOption}
                effectiveOption={effectivePricingOption}
                onSelectOption={setSelectedPricingOption}
                isLoadedQuote={!!loadedQuoteId}
                onNewQuote={handleReset}
                onSaveAndNewQuote={async () => {
                  await handleSave('');
                  handleReset();
                }}
                isSaving={isSaving}
                specialDiscount={formData.specialDiscount}
                specialDiscountCustomPercent={formData.specialDiscountCustomPercent}
                onSpecialDiscountChange={(value) => updateField('specialDiscount', value)}
                onSpecialDiscountCustomPercentChange={(value) => updateField('specialDiscountCustomPercent', value)}
                contractMonths={formData.contractMonths}
                onContractMonthsChange={(months) => updateField('contractMonths', months)}
              />
              <div className="bg-card border border-border rounded-xl p-6">
                <QuoteResultCard
                  pricing={pricing}
                  roiCalculations={roiCalculations}
                  complexity={complexity}
                  workflowCount={(formData.workflows.length || 1) + (customWorkflowTotals?.count || 0)}
                  voiceAgentCosts={voiceAgentCosts}
                  customWorkflowTotals={customWorkflowTotals}
                  roiOverrides={roiOverrides}
                  onRoiOverride={handleRoiOverride}
                  onRoiReset={() => setRoiOverrides({})}
                />
              </div>




              {/* Similar Quotes */}
              <SimilarQuotesPanel
                quotes={similarQuotes}
                isLoading={isLoadingSimilar}
                onRefresh={fetchSimilarQuotes}
                industry={formData.industry}
                teamSize={formData.teamSize}
                onApplyFees={(setup, monthly) => {
                  setSetupFeeAmount(setup);
                  setMonthlyRetainerAmount(monthly);
                }}
              />

              {/* Actions */}
              <div className="bg-card border border-border rounded-xl p-4">
                <QuoteActions
                  pricing={pricing}
                  roiCalculations={roiCalculations}
                  formData={formData}
                  effectivePricingOption={effectivePricingOption}
                  isSaving={isSaving}
                  voiceAgentCosts={voiceAgentCosts}
                  loadedQuoteId={loadedQuoteId}
                  loadedAccessCode={savedAccessCode}
                  savedQuoteId={savedQuoteId}
                  onSave={handleSave}
                  onReset={handleReset}
                  onToggleWorkflow={toggleWorkflow}
                  onUpdateFinalFees={updateFinalFees}
                  // Payment link props
                  includePaymentLinks={includePaymentLinks}
                  includeSlotReservation={includeSlotReservation}
                  setupFeeAmount={setupFeeAmount}
                  monthlyRetainerAmount={monthlyRetainerAmount}
                  generatedLinks={generatedLinks}
                  generatedAmounts={generatedAmounts}
                  installmentAmounts={installmentAmounts}
                  isGeneratingLinks={isGeneratingLinks}
                  generationError={generationError}
                  hasPriceChanged={hasPriceChanged}
                  slotReservationOverride={slotReservationOverride}
                  effectiveSlotReservation={effectiveSlotReservation}
                  calculatedSlotReservation={calculatedSlotReservation}
                  onTogglePaymentLinks={setIncludePaymentLinks}
                  onToggleSlotReservation={setIncludeSlotReservation}
                  onSetupFeeChange={setSetupFeeAmount}
                  onMonthlyRetainerChange={setMonthlyRetainerAmount}
                  onSlotReservationOverrideChange={setSlotReservationOverride}
                  onGeneratePaymentLinks={handleGeneratePaymentLinks}
                  onClearPaymentLinks={clearGeneratedLinks}
                  onContactEmailChange={(email) => updateField('contactEmail', email)}
                />
              </div>

              {/* Email Generator */}
              <div className="bg-card border border-border rounded-xl p-4">
                <EmailGenerator
                  key={`email-gen-${resetCounter}-${loadedQuoteId || 'new'}`}
                  formData={formData}
                  pricing={pricing}
                  effectivePricingOption={effectivePricingOption}
                  roiCalculations={roiCalculations}
                  voiceAgentCosts={voiceAgentCosts}
                  quoteHistory={quoteHistory}
                  originalQuoteData={originalQuoteData}
                  loadedQuoteId={loadedQuoteId}
                  proposalUrl={loadedQuoteId ? `${PRODUCTION_URL}/proposal/${loadedQuoteId}` : undefined}
                  manualSetupFee={setupFeeAmount}
                  manualMonthlyRetainer={monthlyRetainerAmount}
                  accessCode={savedAccessCode || undefined}
                  slotReservationPaymentLink={generatedLinks?.slotReservation || undefined}
                />
              </div>
            </Suspense>
          ) : (
            <ResultsPanelSkeleton />
          )}
        </div>
      </div>
      </div>
    </>
  );
});
