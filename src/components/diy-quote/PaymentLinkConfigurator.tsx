import { memo, useEffect, useState } from 'react';
import { 
  CreditCard, 
  Link2, 
  Loader2, 
  Check,
  AlertCircle,
  AlertTriangle,
  Mail,
  Globe,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { formatCurrency, PricingResult } from '@/lib/pricingEngine';
import { QuoteFormData } from '@/hooks/useQuoteBuilder';
import { RegionCurrency, getCurrencySymbol } from '@/hooks/useRegionCurrency';
import { GeneratedLinks, InstallmentAmounts } from '@/hooks/usePaymentLinks';
import { PaymentLinkRow } from './PaymentLinkRow';

interface PaymentLinkConfiguratorProps {
  pricing: PricingResult;
  effectivePricingOption: 'A' | 'A1' | 'B' | 'C';
  formData: QuoteFormData;
  savedQuoteId: string | null;
  // Payment link state
  includePaymentLinks: boolean;
  includeSlotReservation: boolean;
  setupFeeAmount: number;
  monthlyRetainerAmount: number;
  generatedLinks: GeneratedLinks | null;
  generatedAmounts: { setupFee: number; monthlyRetainer: number } | null;
  installmentAmounts: InstallmentAmounts | null;
  isGenerating: boolean;
  generationError: string | null;
  hasPriceChanged: boolean;
  slotReservationOverride: number | null;
  effectiveSlotReservation: number;
  calculatedSlotReservation: number;
  // Actions
  onToggleInclude: (include: boolean) => void;
  onToggleSlotReservation: (include: boolean) => void;
  onSetupFeeChange: (amount: number) => void;
  onMonthlyRetainerChange: (amount: number) => void;
  onSlotReservationOverrideChange: (amount: number | null) => void;
  onGenerateLinks: (setupFee: number, monthlyRetainer: number, currency: RegionCurrency) => void;
  onClearLinks: (silent?: boolean) => void;
}

// Pricing option discounts
const PRICING_OPTION_DISCOUNTS: Record<'A' | 'A1' | 'B' | 'C', { setup: number; monthly: number }> = {
  A: { setup: 1.0, monthly: 1.0 },
  A1: { setup: 1.0, monthly: 1.0 },
  B: { setup: 0.9, monthly: 0.95 },
  C: { setup: 0.85, monthly: 0.90 },
};

export const PaymentLinkConfigurator = memo(function PaymentLinkConfigurator({
  pricing,
  effectivePricingOption,
  formData,
  savedQuoteId,
  includePaymentLinks,
  includeSlotReservation,
  setupFeeAmount,
  monthlyRetainerAmount,
  generatedLinks,
  generatedAmounts,
  installmentAmounts,
  isGenerating,
  generationError,
  hasPriceChanged,
  slotReservationOverride,
  effectiveSlotReservation,
  calculatedSlotReservation,
  onToggleInclude,
  onToggleSlotReservation,
  onSetupFeeChange,
  onMonthlyRetainerChange,
  onSlotReservationOverrideChange,
  onGenerateLinks,
  onClearLinks,
}: PaymentLinkConfiguratorProps) {
  const [selectedCurrency, setSelectedCurrency] = useState<RegionCurrency>('AUD'); // Default to AUD

  // Local string state for clean input editing (avoids glitchy number snapping)
  const [setupFeeInput, setSetupFeeInput] = useState(String(setupFeeAmount));
  const [monthlyInput, setMonthlyInput] = useState(String(monthlyRetainerAmount));
  const [slotInput, setSlotInput] = useState(String(effectiveSlotReservation));

  // Derive tax label from selected currency
  const currencySymbol = getCurrencySymbol(selectedCurrency);
  const taxLabel = selectedCurrency === 'AUD' ? '+ GST' : '+ tax';

  // Calculate suggested mid-point prices based on pricing option
  const discount = PRICING_OPTION_DISCOUNTS[effectivePricingOption];
  // Custom workflows have fixed pricing — add them on top of the discounted standard pricing
  const customSetupTotal = (formData.customWorkflows || []).reduce((sum, cw) => sum + (cw.setupFee || 0), 0);
  const customMonthlyTotal = (formData.customWorkflows || []).reduce((sum, cw) => sum + (cw.monthlyFee || 0), 0);
  const suggestedSetup = Math.round(((pricing.setupRange.min + pricing.setupRange.max) / 2) * discount.setup) + customSetupTotal;
  const suggestedMonthly = Math.round(((pricing.monthlyRange.min + pricing.monthlyRange.max) / 2) * discount.monthly) + customMonthlyTotal;

  // Update amounts when pricing changes and no links generated yet
  useEffect(() => {
    if (!generatedLinks) {
      onSetupFeeChange(suggestedSetup);
      onMonthlyRetainerChange(suggestedMonthly);
      setSetupFeeInput(String(suggestedSetup));
      setMonthlyInput(String(suggestedMonthly));
    }
  }, [suggestedSetup, suggestedMonthly, generatedLinks, onSetupFeeChange, onMonthlyRetainerChange]);

  // Sync local inputs when parent values change externally (e.g. "Apply fees" from similar quotes)
  useEffect(() => {
    setSetupFeeInput(String(setupFeeAmount));
  }, [setupFeeAmount]);

  useEffect(() => {
    setMonthlyInput(String(monthlyRetainerAmount));
  }, [monthlyRetainerAmount]);

  // Sync slot input when effective value changes
  useEffect(() => {
    setSlotInput(String(effectiveSlotReservation));
  }, [effectiveSlotReservation]);

  // Auto-clear links when prices change
  useEffect(() => {
    if (hasPriceChanged) {
      onClearLinks();
    }
  }, [hasPriceChanged, onClearLinks]);

  const handleEmailError = () => {
    const subject = encodeURIComponent('Payment Link Generation Error');
    const body = encodeURIComponent(
      `Quote ID: ${savedQuoteId || 'Not saved'}\n` +
      `Company: ${formData.companyName || 'Unknown'}\n` +
      `Page URL: ${window.location.href}\n\n` +
      `Error: ${generationError || 'Unknown error'}\n\n` +
      `Please help me generate payment links for this quote.`
    );
    window.open(`mailto:support@alfredai.com?subject=${subject}&body=${body}`, '_blank');
  };

  // Determine if we have any setup-related links (either full or installments)
  const hasSetupLinks = generatedLinks && (
    generatedLinks.setupFee || 
    generatedLinks.setupInitiation
  );

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-primary" />
            Payment Links
          </CardTitle>
          <div className="flex items-center gap-2">
            <Label htmlFor="include-payment-links" className="text-sm text-muted-foreground">
              Include in quote?
            </Label>
            <Switch
              id="include-payment-links"
              checked={includePaymentLinks}
              onCheckedChange={onToggleInclude}
            />
          </div>
        </div>
      </CardHeader>

      {includePaymentLinks && (
        <CardContent className="space-y-4">
          {/* Currency Selector & Tax Notice */}
          <div className="flex items-center justify-between gap-3 p-3 bg-muted/30 rounded-lg border border-muted">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
              <Select value={selectedCurrency} onValueChange={(val) => setSelectedCurrency(val as RegionCurrency)}>
                <SelectTrigger className="w-[110px] h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AUD">AUD (A$)</SelectItem>
                  <SelectItem value="USD">USD (US$)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Badge variant="outline" className="text-xs shrink-0">
              All prices {taxLabel}
            </Badge>
          </div>

          {/* Slot Reservation Toggle & Editable Amount */}
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">Slot Reservation</p>
                  <Switch
                    id="include-slot-reservation"
                    checked={includeSlotReservation}
                    onCheckedChange={(checked) => {
                      onToggleSlotReservation(checked);
                      // Clear links when toggling since amounts change
                      if (generatedLinks) onClearLinks(true);
                    }}
                  />
                </div>
                {includeSlotReservation ? (
                  <p className="text-xs text-muted-foreground mt-1">
                    Default: {currencySymbol}{calculatedSlotReservation.toLocaleString()}
                    {slotReservationOverride !== null && ' (overridden)'}
                  </p>
                ) : (
                  <p className="text-xs text-amber-600 mt-1">
                    Disabled — client pays full setup fee upfront
                  </p>
                )}
              </div>
              {includeSlotReservation && (
                <div className="text-right">
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{currencySymbol}</span>
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={slotInput}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9]/g, '');
                        setSlotInput(raw);
                      }}
                      onBlur={() => {
                        const val = parseInt(slotInput) || 0;
                        if (val === calculatedSlotReservation || val === 0) {
                          onSlotReservationOverrideChange(null);
                          setSlotInput(String(calculatedSlotReservation));
                        } else {
                          onSlotReservationOverrideChange(val);
                          setSlotInput(String(val));
                        }
                        if (generatedLinks) onClearLinks(true);
                      }}
                      className="w-28 h-9 pl-8 pr-2 text-right text-sm font-semibold"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{taxLabel}</p>
                </div>
              )}
            </div>
          </div>

          {/* Step 2: Setup Fee (Editable) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="setup-fee" className="text-sm">
                {includeSlotReservation ? 'Step 2' : 'Step 1'}: Setup Fee{!includeSlotReservation ? ' (Full Upfront)' : ''} <span className="text-muted-foreground text-xs">({taxLabel})</span>
              </Label>
              <span className="text-xs text-muted-foreground">
                Range: {formatCurrency(pricing.setupRange.min)} - {formatCurrency(pricing.setupRange.max)}
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{currencySymbol}</span>
              <Input
                id="setup-fee"
                type="text"
                inputMode="numeric"
                value={setupFeeInput}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, '');
                  setSetupFeeInput(raw);
                  const num = Number(raw);
                  if (!isNaN(num)) onSetupFeeChange(num);
                }}
                onBlur={() => {
                  const num = Number(setupFeeInput) || 0;
                  setSetupFeeInput(String(num));
                  onSetupFeeChange(num);
                }}
                className="pl-10"
                min={0}
                step={100}
              />
            </div>
            {includeSlotReservation && setupFeeAmount > 0 && (
              <p className="text-xs text-muted-foreground">
                Less Slot Reservation ({currencySymbol}{effectiveSlotReservation.toLocaleString()}) → Net payment: <span className="font-semibold text-foreground">{currencySymbol}{Math.max(0, setupFeeAmount - effectiveSlotReservation).toLocaleString()}</span>
              </p>
            )}
          </div>

          {/* Step 3: Monthly Retainer (Editable) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="monthly-retainer" className="text-sm">
                {includeSlotReservation ? 'Step 3' : 'Step 2'}: Monthly Retainer <span className="text-muted-foreground text-xs">({taxLabel})</span>
              </Label>
              <span className="text-xs text-muted-foreground">
                Range: {formatCurrency(pricing.monthlyRange.min)} - {formatCurrency(pricing.monthlyRange.max)}/mo
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{currencySymbol}</span>
              <Input
                id="monthly-retainer"
                type="text"
                inputMode="numeric"
                value={monthlyInput}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, '');
                  setMonthlyInput(raw);
                  const num = Number(raw);
                  if (!isNaN(num)) onMonthlyRetainerChange(num);
                }}
                onBlur={() => {
                  const num = Number(monthlyInput) || 0;
                  setMonthlyInput(String(num));
                  onMonthlyRetainerChange(num);
                }}
                className="pl-10"
                min={0}
                step={50}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">/month</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Recurring subscription • Cancellation/Termination as per Agreement
            </p>
          </div>

          {/* Error State */}
          {generationError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>{generationError}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEmailError}
                  className="gap-1 text-xs"
                >
                  <Mail className="w-3 h-3" />
                  Email Support
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Generate Button or Generated Links */}
          {!generatedLinks ? (
            <div className="space-y-3">
              {/* Prominent warning when quote not saved */}
              {!savedQuoteId && (
                <div className="flex items-center gap-2 rounded-lg border border-amber-400 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-600 px-4 py-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                    Save the quote first to generate payment links
                  </p>
                </div>
              )}
              {/* Warning when contact email is missing */}
              {savedQuoteId && (!formData.contactEmail || formData.contactEmail.trim() === '' || formData.contactEmail === 'null') && (
                <div className="flex items-center gap-2 rounded-lg border border-amber-400 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-600 px-4 py-3">
                  <Mail className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                    Add a contact email address above to pre-fill Stripe checkout for the client
                  </p>
                </div>
              )}
              <Button
                onClick={() => onGenerateLinks(setupFeeAmount, monthlyRetainerAmount, selectedCurrency)}
                disabled={!savedQuoteId || isGenerating}
                variant={!savedQuoteId ? "secondary" : "default"}
                className="w-full gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating Links...
                  </>
                ) : (
                  <>
                    <Link2 className="w-4 h-4" />
                    Generate Payment Links
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-2 pt-2 border-t">
              <p className="text-sm font-medium text-green-600 flex items-center gap-1">
                <Check className="w-4 h-4" />
                Payment links generated
              </p>

              {/* 24-hour expiry warning */}
              <Alert className="py-2 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-xs text-amber-800 dark:text-amber-300">
                  <strong>Note:</strong> These Stripe Checkout links expire in <strong>24 hours</strong> (Stripe's hard limit). 
                  On the client's proposal page, fresh links are generated on-demand when they click "Pay Now", so expiry is not an issue there.
                </AlertDescription>
              </Alert>
              
              {/* Slot Reservation Missing Fallback — only when toggle is ON */}
              {includeSlotReservation && !generatedLinks.slotReservation && (
                <Alert variant="destructive" className="py-3">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="space-y-2">
                    <p className="text-sm font-medium">Slot Reservation link unavailable</p>
                    <p className="text-xs">The commitment deposit payment link failed to generate.</p>
                    <div className="flex gap-2 mt-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => onGenerateLinks(setupFeeAmount, monthlyRetainerAmount, selectedCurrency)}
                        disabled={isGenerating}
                        className="gap-1.5 min-h-[44px]"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Retry
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleEmailError}
                        className="gap-1.5 min-h-[44px]"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        Email Support
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Generated Link Buttons */}
              <div className="space-y-2">
                {/* Slot Reservation */}
                {generatedLinks.slotReservation && (
                  <PaymentLinkRow
                    label="Slot Reservation"
                    amount={installmentAmounts?.depositAmount ?? effectiveSlotReservation}
                    url={generatedLinks.slotReservation}
                    taxLabel={taxLabel}
                  />
                )}

                {/* Option A: Show installment links */}
                {effectivePricingOption === 'A' && installmentAmounts && (
                  <>
                    {/* Show note if initiation is $0 (covered by deposit) */}
                    {installmentAmounts.initiation === 0 && (
                      <div className="text-xs text-muted-foreground px-3 py-2 bg-muted/30 rounded">
                        Initiation fee fully covered by Slot Reservation deposit
                      </div>
                    )}
                    {generatedLinks.setupInitiation && installmentAmounts.initiation > 0 && (
                      <PaymentLinkRow
                        label="Initiation (50%)"
                        amount={installmentAmounts.initiation}
                        url={generatedLinks.setupInitiation}
                        taxLabel={taxLabel}
                      />
                    )}
                    {generatedLinks.setupMonth1 && (
                      <PaymentLinkRow
                        label="Month 1 (20%)"
                        amount={installmentAmounts.month1}
                        url={generatedLinks.setupMonth1}
                        taxLabel={taxLabel}
                      />
                    )}
                    {generatedLinks.setupMonth2 && (
                      <PaymentLinkRow
                        label="Month 2 (20%)"
                        amount={installmentAmounts.month2}
                        url={generatedLinks.setupMonth2}
                        taxLabel={taxLabel}
                      />
                    )}
                    {generatedLinks.setupMonth3 && (
                      <PaymentLinkRow
                        label="Final (10%)"
                        amount={installmentAmounts.month3}
                        url={generatedLinks.setupMonth3}
                        taxLabel={taxLabel}
                      />
                    )}
                  </>
                )}

                {/* Options A1, B & C: Show single setup fee link */}
                {effectivePricingOption !== 'A' && generatedLinks.setupFee && (() => {
                  const depositAmount = includeSlotReservation ? effectiveSlotReservation : 0;
                  const setupAfterDeposit = Math.max(0, setupFeeAmount - depositAmount);
                  const label = effectivePricingOption === 'A1'
                    ? (includeSlotReservation ? "Setup Fee (less deposit)" : "Setup Fee (Full Upfront)")
                    : (includeSlotReservation ? "Setup Fee (less deposit)" : "Setup Fee (Full Upfront)");
                  return (
                    <PaymentLinkRow
                      label={label}
                      amount={setupAfterDeposit}
                      url={generatedLinks.setupFee}
                      taxLabel={taxLabel}
                    />
                  );
                })()}

                {/* Monthly Retainer */}
                {generatedLinks.monthlyRetainer && (
                  <PaymentLinkRow
                    label="Monthly"
                    amount={monthlyRetainerAmount}
                    url={generatedLinks.monthlyRetainer}
                    suffix="/mo"
                    taxLabel={taxLabel}
                  />
                )}
              </div>
              
              {/* Reset Links Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onClearLinks(true)}
                className="w-full mt-2 text-muted-foreground hover:text-destructive gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset & Regenerate Links
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
});
