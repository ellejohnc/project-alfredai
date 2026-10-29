import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Publishable site key - loaded from environment variable
const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

// Check if reCAPTCHA is properly configured
const isRecaptchaConfigured = (): boolean => {
  return !!(RECAPTCHA_SITE_KEY && RECAPTCHA_SITE_KEY.length > 10);
};

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

let scriptLoaded = false;
let scriptLoading = false;
let scriptLoadFailed = false;
const loadCallbacks: ((success: boolean) => void)[] = [];

const loadRecaptchaScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    // If reCAPTCHA is not configured, skip loading
    if (!isRecaptchaConfigured()) {
      console.warn('reCAPTCHA site key not configured - skipping reCAPTCHA');
      resolve(true); // Return true to allow form submission without reCAPTCHA
      return;
    }

    if (scriptLoaded && window.grecaptcha) {
      resolve(true);
      return;
    }

    if (scriptLoadFailed) {
      resolve(false);
      return;
    }

    loadCallbacks.push(resolve);

    if (scriptLoading) {
      return;
    }

    scriptLoading = true;

    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      window.grecaptcha.ready(() => {
        scriptLoaded = true;
        loadCallbacks.forEach(cb => cb(true));
        loadCallbacks.length = 0;
      });
    };

    script.onerror = () => {
      console.error('Failed to load reCAPTCHA script');
      scriptLoading = false;
      scriptLoadFailed = true;
      loadCallbacks.forEach(cb => cb(false));
      loadCallbacks.length = 0;
    };

    document.head.appendChild(script);
  });
};

interface UseRecaptchaResult {
  isReady: boolean;
  executeRecaptcha: (action: string) => Promise<string | null>;
  verifyRecaptcha: (action: string) => Promise<{ success: boolean; error?: string }>;
}

export function useRecaptcha(): UseRecaptchaResult {
  const [isReady, setIsReady] = useState(scriptLoaded || !isRecaptchaConfigured());

  useEffect(() => {
    loadRecaptchaScript().then((success) => {
      setIsReady(success || !isRecaptchaConfigured());
    });
  }, []);

  const executeRecaptcha = useCallback(async (action: string): Promise<string | null> => {
    // If reCAPTCHA is not configured, return a bypass token
    if (!isRecaptchaConfigured()) {
      console.warn('reCAPTCHA not configured - bypassing verification');
      return 'RECAPTCHA_NOT_CONFIGURED';
    }

    if (!window.grecaptcha) {
      console.error('reCAPTCHA not loaded');
      return null;
    }

    try {
      const token = await window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action });
      return token;
    } catch (error) {
      console.error('reCAPTCHA execute error:', error);
      return null;
    }
  }, []);

  const verifyRecaptcha = useCallback(async (action: string): Promise<{ success: boolean; error?: string }> => {
    // If reCAPTCHA is not configured, allow submission (for development/testing)
    if (!isRecaptchaConfigured()) {
      console.warn('reCAPTCHA not configured - allowing submission');
      return { success: true };
    }

    const token = await executeRecaptcha(action);
    
    if (!token) {
      return { success: false, error: 'Could not get reCAPTCHA token. Please refresh and try again.' };
    }

    try {
      const { data, error } = await supabase.functions.invoke('verify-recaptcha', {
        body: { token, action }
      });

      if (error) {
        console.error('reCAPTCHA verification error:', error);
        return { success: false, error: 'Verification failed. Please try again.' };
      }

      if (!data.success) {
        return { success: false, error: data.error || 'Verification failed' };
      }

      return { success: true };
    } catch (error) {
      console.error('reCAPTCHA verification error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }, [executeRecaptcha]);

  return { isReady, executeRecaptcha, verifyRecaptcha };
}
