import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RegionCurrency } from './useRegionCurrency';

export interface GeneratedAmounts {
  setupFee: number;
  monthlyRetainer: number;
}

// Installment amounts for Option A
export interface InstallmentAmounts {
  depositAmount: number; // Dynamic deposit amount
  initiation: number;  // 50% minus deposit
  month1: number;      // 20%
  month2: number;      // 20%
  month3: number;      // 10%
}

// Payment links structure - supports both full payment and installments
export interface GeneratedLinks {
  slotReservation?: string;
  // For Options B & C (full payment)
  setupFee?: string;
  // For Option A (installments)
  setupInitiation?: string;
  setupMonth1?: string;
  setupMonth2?: string;
  setupMonth3?: string;
  // Monthly retainer (all options)
  monthlyRetainer?: string;
}

export interface PaymentLinkConfig {
  includePaymentLinks: boolean;
  setupFeeAmount: number;      // User-confirmed amount in dollars
  monthlyRetainerAmount: number; // User-confirmed amount in dollars
  generatedLinks: GeneratedLinks | null;
  generatedAmounts: GeneratedAmounts | null; // Track amounts at generation time
  installmentAmounts: InstallmentAmounts | null; // Track installment breakdowns
  isGenerating: boolean;
  generationError: string | null;
  pricingOption: 'A' | 'A1' | 'B' | 'C'; // Track which pricing option was used
}

// Payment types supported by the edge function
type PaymentType = 
  | 'slot_reservation' 
  | 'setup_fee'
  | 'setup_initiation'
  | 'setup_month1'
  | 'setup_month2'
  | 'setup_month3'
  | 'monthly_retainer';

interface GenerateLinksParams {
  quoteId: string;
  companyName: string;
  contactEmail?: string;
  contactName?: string;
  pricingOption: 'A' | 'A1' | 'B' | 'C';
  currency: RegionCurrency;
  // Optional overrides for fees - useful when regenerating after price changes
  overrideSetupFee?: number;
  overrideMonthlyRetainer?: number;
}

export function usePaymentLinks(initialSetupFee: number = 0, initialMonthlyRetainer: number = 0) {
  const [includePaymentLinks, setIncludePaymentLinks] = useState(false);
  const [includeSlotReservation, setIncludeSlotReservation] = useState(true);
  const [setupFeeAmount, setSetupFeeAmount] = useState(initialSetupFee);
  const [monthlyRetainerAmount, setMonthlyRetainerAmount] = useState(initialMonthlyRetainer);
  const [slotReservationOverride, setSlotReservationOverride] = useState<number | null>(null);
  const [generatedLinks, setGeneratedLinks] = useState<GeneratedLinks | null>(null);
  const [generatedAmounts, setGeneratedAmounts] = useState<GeneratedAmounts | null>(null);
  const [installmentAmounts, setInstallmentAmounts] = useState<InstallmentAmounts | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [lastPricingOption, setLastPricingOption] = useState<'A' | 'A1' | 'B' | 'C'>('A');
  const [slotReservationError, setSlotReservationError] = useState(false);

  // Calculate the effective slot reservation amount
  const calculatedSlotReservation = 5000;
  const effectiveSlotReservation = slotReservationOverride !== null ? slotReservationOverride : calculatedSlotReservation;

  // Detect if prices have changed since links were generated
  const hasPriceChanged = Boolean(
    generatedLinks && 
    generatedAmounts && 
    (setupFeeAmount !== generatedAmounts.setupFee || 
     monthlyRetainerAmount !== generatedAmounts.monthlyRetainer)
  );

  // Update suggested amounts when pricing changes
  const updateSuggestedAmounts = useCallback((setupFee: number, monthlyRetainer: number) => {
    // Only update if links haven't been generated yet
    if (!generatedLinks) {
      setSetupFeeAmount(setupFee);
      setMonthlyRetainerAmount(monthlyRetainer);
    }
  }, [generatedLinks]);

  // Generate a single payment link
  const generateSingleLink = async (
    params: GenerateLinksParams,
    paymentType: PaymentType,
    amount?: number,
    installmentNumber?: number
  ): Promise<string | undefined> => {
    try {
      // For non-slot payments, amount is required and must be positive
      const amountInCents = typeof amount === 'number' && amount > 0 
        ? Math.round(amount * 100) 
        : undefined;
      
      const { data, error } = await supabase.functions.invoke('create-quote-payment-link', {
        body: {
          quoteId: params.quoteId,
          companyName: params.companyName,
          contactEmail: params.contactEmail && params.contactEmail !== 'null' ? params.contactEmail : undefined,
          contactName: params.contactName,
          paymentType,
          amount: amountInCents,
          pricingOption: params.pricingOption,
          currency: params.currency.toLowerCase(), // 'aud' or 'usd'
          installmentNumber,
          description: getPaymentDescription(paymentType, params.companyName, amount, params.pricingOption),
        }
      });
      
      if (error) {
        console.error(`Failed to generate ${paymentType} link:`, error);
        return undefined;
      }
      
      return data?.url || undefined;
    } catch (err) {
      console.error(`Payment link generation error for ${paymentType}:`, err);
      return undefined;
    }
  };

  // Helper to generate payment descriptions
  const getPaymentDescription = (
    paymentType: PaymentType, 
    companyName: string, 
    amount?: number,
    pricingOption?: 'A' | 'A1' | 'B' | 'C'
  ): string | undefined => {
    switch (paymentType) {
      case 'setup_initiation':
        return `Project Initiation Fee (50% less deposit) for ${companyName}. This amount reflects 50% of the setup fee, less the Production Slot Deposit already paid. Part 1 of 4 installments.`;
      case 'setup_month1':
        return `Month 1 Payment (20%) for ${companyName}. Part 2 of 4 installments.`;
      case 'setup_month2':
        return `Month 2 Payment (20%) for ${companyName}. Part 3 of 4 installments.`;
      case 'setup_month3':
        return `Final Payment (10%) for ${companyName}. Part 4 of 4 installments.`;
      case 'setup_fee':
        return `AI Implementation Setup Fee for ${companyName}. Option ${pricingOption} - Full payment.`;
      case 'monthly_retainer':
        return `Monthly AI Partnership Retainer for ${companyName}`;
      default:
        return undefined;
    }
  };

  // Generate all payment links based on pricing option
  const generateAllPaymentLinks = useCallback(async (params: GenerateLinksParams) => {
    if (!includePaymentLinks) {
      return null;
    }

    // Use override amounts if provided (for regeneration), otherwise use hook state
    const rawSetupFee = params.overrideSetupFee ?? setupFeeAmount;
    const rawMonthlyRetainer = params.overrideMonthlyRetainer ?? monthlyRetainerAmount;
    
    const effectiveSetupFee = typeof rawSetupFee === 'number' && Number.isFinite(rawSetupFee) ? rawSetupFee : 0;
    const effectiveMonthlyRetainer = typeof rawMonthlyRetainer === 'number' && Number.isFinite(rawMonthlyRetainer) ? rawMonthlyRetainer : 0;

    console.log('[usePaymentLinks] Generating links with fees:', { 
      pricingOption: params.pricingOption,
      overrideSetupFee: params.overrideSetupFee, 
      overrideMonthlyRetainer: params.overrideMonthlyRetainer,
      hookSetupFee: setupFeeAmount,
      hookMonthlyRetainer: monthlyRetainerAmount,
      effectiveSetupFee, 
      effectiveMonthlyRetainer 
    });

    // Validate amounts before generating links
    if (effectiveSetupFee <= 0) {
      const errorMsg = 'Setup fee amount must be greater than $0 to generate payment links.';
      setGenerationError(errorMsg);
      toast.error(errorMsg);
      return null;
    }
    
    if (effectiveMonthlyRetainer <= 0) {
      const errorMsg = 'Monthly retainer amount must be greater than $0 to generate payment links.';
      setGenerationError(errorMsg);
      toast.error(errorMsg);
      return null;
    }

    // Update internal state with override values if provided
    if (params.overrideSetupFee !== undefined) {
      setSetupFeeAmount(params.overrideSetupFee);
    }
    if (params.overrideMonthlyRetainer !== undefined) {
      setMonthlyRetainerAmount(params.overrideMonthlyRetainer);
    }

    setIsGenerating(true);
    setGenerationError(null);
    setLastPricingOption(params.pricingOption);
    
    try {
      let links: GeneratedLinks;
      let calculatedInstallments: InstallmentAmounts | null = null;

      // Use manual override if set, otherwise auto-calculate ($5k min or 50% of setup)
      // When slot reservation is disabled, no deposit is deducted
      const depositAmount = includeSlotReservation
        ? effectiveSlotReservation
        : 0;

      if (params.pricingOption === 'A') {
        // Option A: Generate 4 installment links for setup fee
        const rawInitiation = Math.round(effectiveSetupFee * 0.5);
        const initiation = Math.max(0, rawInitiation - depositAmount); // Deduct deposit
        const month1 = Math.round(effectiveSetupFee * 0.2);
        const month2 = Math.round(effectiveSetupFee * 0.2);
        const month3 = effectiveSetupFee - rawInitiation - month1 - month2; // Remainder based on raw 50%

        console.log('[usePaymentLinks] Option A installments:', { 
          depositAmount,
          rawInitiation, 
          initiation, 
          month1, 
          month2, 
          month3 
        });

        calculatedInstallments = { depositAmount, initiation, month1, month2, month3 };

        // Build link generation promises - skip $0 amounts
        const linkPromises: Promise<string | undefined>[] = [];
        const linkKeys: string[] = [];

        if (includeSlotReservation && depositAmount > 0) {
          linkPromises.push(generateSingleLink(params, 'slot_reservation', depositAmount));
          linkKeys.push('slotReservation');
        }

        if (initiation > 0) {
          linkPromises.push(generateSingleLink(params, 'setup_initiation', initiation, 1));
          linkKeys.push('setupInitiation');
        }
        linkPromises.push(
          generateSingleLink(params, 'setup_month1', month1, 2),
          generateSingleLink(params, 'setup_month2', month2, 3),
          generateSingleLink(params, 'setup_month3', month3, 4),
          generateSingleLink(params, 'monthly_retainer', effectiveMonthlyRetainer),
        );
        linkKeys.push('setupMonth1', 'setupMonth2', 'setupMonth3', 'monthlyRetainer');

        const results = await Promise.all(linkPromises);
        // Map results to link keys
        const linkMap: Record<string, string | undefined> = {};
        linkKeys.forEach((key, i) => { linkMap[key] = results[i]; });

        // Retry slot reservation once if it failed (only when included)
        let finalSlotReservation: string | undefined = undefined;
        if (includeSlotReservation) {
          finalSlotReservation = linkMap.slotReservation;
          if (!finalSlotReservation) {
            console.warn('[usePaymentLinks] Slot reservation link failed, retrying in 1s...');
            await new Promise(r => setTimeout(r, 1000));
            finalSlotReservation = await generateSingleLink(params, 'slot_reservation', depositAmount);
          }

          if (!finalSlotReservation) {
            setSlotReservationError(true);
            toast.warning('Slot Reservation link failed to generate. Please retry.');
          } else {
            setSlotReservationError(false);
          }
        }

        links = {
          slotReservation: finalSlotReservation,
          setupInitiation: linkMap.setupInitiation,
          setupMonth1: linkMap.setupMonth1,
          setupMonth2: linkMap.setupMonth2,
          setupMonth3: linkMap.setupMonth3,
          monthlyRetainer: linkMap.monthlyRetainer,
        };

        // Count successful links
        const baseExpected = (initiation > 0 ? 5 : 4); // installments + retainer
        const expectedCount = includeSlotReservation ? baseExpected + 1 : baseExpected;
        const successCount = Object.values(links).filter(Boolean).length;
        
        if (successCount === 0) {
          const errorMsg = 'Failed to generate payment links. Please try again or contact support.';
          setGenerationError(errorMsg);
          toast.error(errorMsg);
          return null;
        }

        if (successCount >= expectedCount) {
          toast.success(`All ${expectedCount} payment links generated successfully!`);
        } else {
          toast.warning(`Generated ${successCount}/${expectedCount} payment links. Some links may be missing.`);
        }

      } else {
        // Options A1, B & C: Single full payment for setup fee, minus the slot reservation deposit
        const setupFeeAfterDeposit = includeSlotReservation
          ? Math.max(0, effectiveSetupFee - depositAmount)
          : effectiveSetupFee;

        calculatedInstallments = { depositAmount, initiation: 0, month1: 0, month2: 0, month3: 0 };

        console.log('[usePaymentLinks] Option B/C setup fee after deposit deduction:', {
          effectiveSetupFee,
          depositAmount,
          setupFeeAfterDeposit,
          includeSlotReservation,
        });

        // Build promises
        const linkPromises: Promise<string | undefined>[] = [];
        const linkKeys: string[] = [];

        if (includeSlotReservation && depositAmount > 0) {
          linkPromises.push(generateSingleLink(params, 'slot_reservation', depositAmount));
          linkKeys.push('slotReservation');
        }

        if (setupFeeAfterDeposit > 0) {
          linkPromises.push(generateSingleLink(params, 'setup_fee', setupFeeAfterDeposit));
          linkKeys.push('setupFee');
        }

        linkPromises.push(generateSingleLink(params, 'monthly_retainer', effectiveMonthlyRetainer));
        linkKeys.push('monthlyRetainer');

        const results = await Promise.all(linkPromises);
        const linkMap: Record<string, string | undefined> = {};
        linkKeys.forEach((key, i) => { linkMap[key] = results[i]; });

        // Retry slot reservation once if it failed (only when included)
        let finalSlotReservation: string | undefined = undefined;
        if (includeSlotReservation) {
          finalSlotReservation = linkMap.slotReservation;
          if (!finalSlotReservation) {
            console.warn('[usePaymentLinks] Slot reservation link failed, retrying in 1s...');
            await new Promise(r => setTimeout(r, 1000));
            finalSlotReservation = await generateSingleLink(params, 'slot_reservation', depositAmount);
          }

          if (!finalSlotReservation) {
            setSlotReservationError(true);
            toast.warning('Slot Reservation link failed to generate. Please retry.');
          } else {
            setSlotReservationError(false);
          }
        }

        links = {
          slotReservation: finalSlotReservation,
          setupFee: linkMap.setupFee,
          monthlyRetainer: linkMap.monthlyRetainer,
        };

        const baseExpected = setupFeeAfterDeposit > 0 ? 2 : 1; // setup + retainer
        const expectedCount = includeSlotReservation ? baseExpected + 1 : baseExpected;
        const successCount = Object.values(links).filter(Boolean).length;
        
        if (successCount === 0) {
          const errorMsg = 'Failed to generate payment links. Please try again or contact support.';
          setGenerationError(errorMsg);
          toast.error(errorMsg);
          return null;
        }

        if (successCount >= expectedCount) {
          toast.success(`All ${expectedCount} payment links generated successfully!`);
        } else {
          toast.warning(`Generated ${successCount}/${expectedCount} payment links. Some links may be missing.`);
        }
      }

      setGeneratedLinks(links);
      setInstallmentAmounts(calculatedInstallments);
      
      // Store amounts used at generation time
      setGeneratedAmounts({
        setupFee: effectiveSetupFee,
        monthlyRetainer: effectiveMonthlyRetainer,
      });

      return links;
    } catch (err) {
      console.error('Failed to generate payment links:', err);
      const errorMsg = 'An error occurred while generating payment links.';
      setGenerationError(errorMsg);
      toast.error(errorMsg);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [includePaymentLinks, includeSlotReservation, setupFeeAmount, monthlyRetainerAmount]);

  // Reset all state
  const resetPaymentLinks = useCallback(() => {
    setIncludePaymentLinks(false);
    setGeneratedLinks(null);
    setGeneratedAmounts(null);
    setInstallmentAmounts(null);
    setGenerationError(null);
    setSlotReservationError(false);
    setSlotReservationOverride(null);
  }, []);

  // Clear generated links (but keep toggle and amounts)
  // Silent mode for manual reset vs auto-triggered by price change
  const clearGeneratedLinks = useCallback((silent: boolean = false) => {
    setGeneratedLinks(null);
    setGeneratedAmounts(null);
    setInstallmentAmounts(null);
    setGenerationError(null);
    setSlotReservationError(false);
    if (!silent) {
      toast.info('Prices changed. Please regenerate payment links.');
    }
  }, []);

  return {
    // State
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
    lastPricingOption,
    slotReservationError,
    slotReservationOverride,
    effectiveSlotReservation,
    calculatedSlotReservation,
    
    // Setters
    setIncludePaymentLinks,
    setIncludeSlotReservation,
    setSetupFeeAmount,
    setMonthlyRetainerAmount,
    setSlotReservationOverride,
    updateSuggestedAmounts,
    
    // Actions
    generateAllPaymentLinks,
    resetPaymentLinks,
    clearGeneratedLinks,
  };
}
