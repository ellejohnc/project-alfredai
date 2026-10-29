import { useState, useEffect } from 'react';

export type RegionCurrency = 'AUD' | 'USD';

interface RegionInfo {
  currency: RegionCurrency;
  currencySymbol: string;
  isAuNz: boolean;
  taxLabel: string;
  countryCode: string | null;
}

const AU_NZ_COUNTRY_CODES = ['AU', 'NZ'];

// Default to USD for international users
const DEFAULT_REGION: RegionInfo = {
  currency: 'USD',
  currencySymbol: 'US$',
  isAuNz: false,
  taxLabel: 'excl. tax',
  countryCode: null,
};

const AU_NZ_REGION: RegionInfo = {
  currency: 'AUD',
  currencySymbol: 'A$',
  isAuNz: true,
  taxLabel: '+ GST',
  countryCode: null,
};

export function useRegionCurrency(): RegionInfo & { isLoading: boolean } {
  const [regionInfo, setRegionInfo] = useState<RegionInfo>(DEFAULT_REGION);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const detectRegion = async () => {
      try {
        // Try to detect region using a free IP geolocation service
        // Using ipapi.co which has a generous free tier
        const response = await fetch('https://ipapi.co/json/', {
          signal: AbortSignal.timeout(3000), // 3 second timeout
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch location');
        }
        
        const data = await response.json();
        const countryCode = data.country_code || data.country;
        
        if (countryCode && AU_NZ_COUNTRY_CODES.includes(countryCode.toUpperCase())) {
          setRegionInfo({
            ...AU_NZ_REGION,
            countryCode: countryCode.toUpperCase(),
          });
        } else {
          setRegionInfo({
            ...DEFAULT_REGION,
            countryCode: countryCode?.toUpperCase() || null,
          });
        }
      } catch (error) {
        // On error, default to USD (international)
        console.log('Region detection failed, defaulting to USD:', error);
        setRegionInfo(DEFAULT_REGION);
      } finally {
        setIsLoading(false);
      }
    };

    detectRegion();
  }, []);

  return { ...regionInfo, isLoading };
}

// Format currency with the appropriate symbol
export function formatRegionCurrency(
  amount: number,
  currency: RegionCurrency,
  showTaxLabel: boolean = false,
  taxLabel: string = 'excl. tax'
): string {
  const formatter = new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  
  const formatted = formatter.format(amount);
  
  if (showTaxLabel) {
    return `${formatted} ${taxLabel}`;
  }
  
  return formatted;
}

// Get currency symbol
export function getCurrencySymbol(currency: RegionCurrency): string {
  return currency === 'AUD' ? 'A$' : 'US$';
}
