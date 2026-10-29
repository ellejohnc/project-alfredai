import { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { SafeAnimatePresence } from '@/components/ui/safe-animate-presence';
import { SUPPORT_EMAIL } from '@/lib/siteConfig';
import { Lock, ArrowRight, AlertCircle, Mail, Loader2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from '@/components/ui/input-otp';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ProposalAccessGateProps {
  quoteId: string;
  companyName?: string;
  onUnlock: (quoteData: any, accessCode: string) => void;
}

const STORAGE_KEY_PREFIX = 'proposal_unlocked_';

export function ProposalAccessGate({ quoteId, companyName, onUnlock }: ProposalAccessGateProps) {
  const [accessCode, setAccessCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState(5);
  const [isLocked, setIsLocked] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const lastAutoSubmittedCodeRef = useRef('');

  // Check if already unlocked for this quote — re-fetch fresh data from DB
  useEffect(() => {
    const storedCode = sessionStorage.getItem(`${STORAGE_KEY_PREFIX}${quoteId}_code`);
    if (!storedCode) return;

    // Re-verify with the stored code to get fresh data from DB
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke('verify-proposal-access', {
          body: { quoteId, accessCode: storedCode }
        });

        if (error || !data?.success) {
          // Stored code is invalid — clear and show gate
          sessionStorage.removeItem(`${STORAGE_KEY_PREFIX}${quoteId}`);
          sessionStorage.removeItem(`${STORAGE_KEY_PREFIX}${quoteId}_code`);
          return;
        }

        const quoteWithPayments = { ...data.quote, _paymentLinks: data.paymentLinks || [] };
        // Update cache with fresh data
        sessionStorage.setItem(`${STORAGE_KEY_PREFIX}${quoteId}`, JSON.stringify(quoteWithPayments));
        onUnlock(quoteWithPayments, storedCode);
      } catch {
        sessionStorage.removeItem(`${STORAGE_KEY_PREFIX}${quoteId}`);
        sessionStorage.removeItem(`${STORAGE_KEY_PREFIX}${quoteId}_code`);
      }
    })();
  }, [quoteId, onUnlock]);

  const handleAccessCodeChange = useCallback((value: string) => {
    const sanitized = value.replace(/\D/g, '').slice(0, 6);
    setAccessCode(sanitized);

    if (sanitized.length < 6) {
      lastAutoSubmittedCodeRef.current = '';
    }
  }, []);

  const handleVerify = useCallback(async () => {
    if (accessCode.length !== 6 || isLocked || isVerifying) return;

    setIsVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-proposal-access', {
        body: { quoteId, accessCode }
      });

      if (error) throw error;

      if (data?.success) {
        console.log('[ProposalAccessGate] Unlocking with data:', data.quote);
        const quoteWithPayments = { ...data.quote, _paymentLinks: data.paymentLinks || [] };
        sessionStorage.setItem(`${STORAGE_KEY_PREFIX}${quoteId}`, JSON.stringify(quoteWithPayments));
        sessionStorage.setItem(`${STORAGE_KEY_PREFIX}${quoteId}_code`, accessCode);
        toast.success('Access granted! Loading your proposal...');
        lastAutoSubmittedCodeRef.current = '';
        onUnlock(quoteWithPayments, accessCode);
      } else {
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
        setAccessCode('');
        lastAutoSubmittedCodeRef.current = '';

        if (data?.rateLimited) {
          setIsLocked(true);
          toast.error('Too many attempts. Please try again later.');
        } else {
          const remaining = data?.attemptsRemaining ?? attemptsRemaining - 1;
          setAttemptsRemaining(remaining);

          if (remaining <= 0) {
            setIsLocked(true);
            toast.error('Access locked. Please contact support.');
          } else {
            toast.error(data?.error || `Invalid code. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`);
          }
        }
      }
    } catch (err) {
      console.error('Verification error:', err);
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      setAccessCode('');
      lastAutoSubmittedCodeRef.current = '';
      toast.error('Failed to verify. Please re-enter your 6-digit code.');
    } finally {
      setIsVerifying(false);
    }
  }, [accessCode, quoteId, isLocked, isVerifying, attemptsRemaining, onUnlock]);

  // Auto-submit once per entered 6-digit code
  useEffect(() => {
    if (
      accessCode.length === 6 &&
      !isVerifying &&
      !isLocked &&
      lastAutoSubmittedCodeRef.current !== accessCode
    ) {
      lastAutoSubmittedCodeRef.current = accessCode;
      void handleVerify();
    }
  }, [accessCode, handleVerify, isVerifying, isLocked]);

  const handleContactSupport = () => {
    const subject = encodeURIComponent('Proposal Access Request');
    const body = encodeURIComponent(
      `Hi,\n\nI need help accessing my proposal.\n\nProposal ID: ${quoteId}\n${companyName ? `Company: ${companyName}\n` : ''}\nPage: ${window.location.href}\n\nThank you`
    );
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
          {/* Logo/Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="w-8 h-8 text-primary" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-center mb-2">
            Secure Proposal
          </h1>
          <p className="text-muted-foreground text-center mb-2">
            {companyName ? (
              <>Proposal for <span className="font-semibold text-foreground">{companyName}</span></>
            ) : (
              <>Proposal ID: <span className="font-mono text-foreground">{quoteId}</span></>
            )}
          </p>
          <p className="text-sm text-muted-foreground text-center mb-8">
            Enter your 6-digit access code to view
          </p>

          <SafeAnimatePresence mode="wait">
            {isLocked ? (
              <motion.div
                key="locked"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                  <p className="text-sm text-destructive">
                    Access locked due to too many failed attempts.
                  </p>
                </div>
                <Button
                  onClick={handleContactSupport}
                  className="w-full"
                  variant="outline"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Contact Support
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                className={`space-y-6 ${isShaking ? 'animate-shake' : ''}`}
              >
                {/* OTP Input */}
                <div className="flex justify-center">
                  <InputOTP
                    value={accessCode}
                    onChange={handleAccessCodeChange}
                    maxLength={6}
                    disabled={isVerifying}
                    autoFocus
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                    </InputOTPGroup>
                    <InputOTPSeparator />
                    <InputOTPGroup>
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                {/* Submit Button */}
                <Button
                  onClick={handleVerify}
                  disabled={accessCode.length !== 6 || isVerifying}
                  className="w-full gap-2"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Unlock Proposal
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>

                {/* Attempts remaining */}
                {attemptsRemaining < 5 && (
                  <p className="text-xs text-center text-muted-foreground">
                    {attemptsRemaining} attempt{attemptsRemaining !== 1 ? 's' : ''} remaining
                  </p>
                )}

                {/* Help text */}
                <div className="pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground text-center">
                    The access code was provided in your proposal email or PDF.
                  </p>
                  <button
                    onClick={handleContactSupport}
                    className="mt-2 w-full text-xs text-primary hover:underline text-center"
                  >
                    Can't find your code? Contact support
                  </button>
                </div>
              </motion.div>
            )}
          </SafeAnimatePresence>
        </div>

        {/* Footer branding */}
        <p className="text-xs text-muted-foreground text-center mt-6">
          Secured by alfred ai
        </p>
      </motion.div>
    </div>
  );
}
