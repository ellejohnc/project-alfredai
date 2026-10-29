import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Lock, CheckCircle, AlertTriangle } from 'lucide-react';
import { z } from 'zod';
import { SUPPORT_EMAIL } from '@/lib/siteConfig';

const passwordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
});

type Phase = 'checking' | 'ready' | 'error';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [phase, setPhase] = useState<Phase>('checking');
  const [errorReason, setErrorReason] = useState<'expired' | 'used' | 'invalid'>('invalid');
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});

  // Detect the token on mount, but DO NOT exchange it yet. The token is only
  // consumed when the user submits the new password, so email security scanners
  // that pre-fetch the link can't burn the single-use token before the user.
  useEffect(() => {
    let active = true;

    const detect = async () => {
      const url = new URL(window.location.href);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));

      const urlError =
        url.searchParams.get('error_description') || hashParams.get('error_description');
      if (urlError) {
        if (active) setPhase('error');
        return;
      }

      const tokenHash = url.searchParams.get('token_hash');
      const code = url.searchParams.get('code');
      const hasImplicit = !!hashParams.get('access_token');

      if (tokenHash || code || hasImplicit) {
        // A recovery credential is present — show the reset form directly.
        if (active) setPhase('ready');
        return;
      }

      // No token in the URL — maybe a session already exists (implicit flow
      // auto-processed). Otherwise treat as an invalid/expired link.
      const { data: { session } } = await supabase.auth.getSession();
      if (!active) return;
      setPhase(session ? 'ready' : 'error');
    };

    detect();
    return () => {
      active = false;
    };
  }, []);

  // Exchange the single-use token for a session. Called at submit time only.
  const ensureSession = async () => {
    const { data: { session: existing } } = await supabase.auth.getSession();
    if (existing) return;

    const url = new URL(window.location.href);
    const tokenHash = url.searchParams.get('token_hash');
    const type = url.searchParams.get('type');
    const code = url.searchParams.get('code');

    if (tokenHash) {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: (type as 'recovery') || 'recovery',
      });
      if (error) throw error;
    } else if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) throw error;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No active session after verification');
  };



  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate
    const result = passwordSchema.safeParse({ password, confirmPassword });
    if (!result.success) {
      const fieldErrors: { password?: string; confirmPassword?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === 'password') fieldErrors.password = err.message;
        if (err.path[0] === 'confirmPassword') fieldErrors.confirmPassword = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    try {
      // Exchange the single-use token now (only when the user actually submits).
      try {
        await ensureSession();
      } catch (verifyErr) {
        const raw = verifyErr instanceof Error ? verifyErr.message.toLowerCase() : '';
        const reason: 'expired' | 'used' | 'invalid' = raw.includes('expired')
          ? 'expired'
          : raw.includes('already') || raw.includes('used') || raw.includes('consumed')
            ? 'used'
            : 'invalid';
        setErrorReason(reason);
        setPhase('error');
        toast.error(
          reason === 'expired'
            ? 'This reset link has expired. Please request a new one below.'
            : reason === 'used'
              ? 'This reset link has already been used. Please request a fresh one below.'
              : 'This reset link is no longer valid. Please request a new one below.'
        );
        return;
      }


      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        // Handle specific error when user no longer exists
        if (error.message.includes('User from sub claim in JWT does not exist') || 
            error.message.includes('User not found')) {
          toast.error('This account no longer exists. Please sign up again.');
          setTimeout(() => navigate('/admin/login'), 2000);
        } else {
          toast.error(error.message);
        }
      } else {
        setIsSuccess(true);
        toast.success('Password updated successfully!');
        // Redirect to admin after a short delay
        setTimeout(() => {
          navigate('/admin');
        }, 2000);
      }
    } catch (err) {
      toast.error('Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Password Updated!</h2>
            <p className="text-muted-foreground text-center">
              Your password has been successfully updated. Redirecting to admin...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-1">Checking your reset link…</h2>
            <p className="text-muted-foreground text-center text-sm">
              Hang tight for a moment.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }



  if (phase === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              {errorReason === 'expired'
                ? 'This reset link has expired'
                : errorReason === 'used'
                  ? 'This reset link was already used'
                  : 'Reset link no longer valid'}
            </h2>
            <p className="text-muted-foreground mb-3 text-sm">
              {errorReason === 'expired'
                ? 'For your security, password reset links expire after a short time. Request a new one below and use it right away.'
                : errorReason === 'used'
                  ? 'Reset links can only be used once. If you already reset your password, sign in with it — otherwise request a fresh link below.'
                  : 'This password reset link has expired or was already used. Reset links are single-use and valid for a limited time.'}
            </p>

            <p className="text-muted-foreground mb-6 text-sm">
              Some email providers automatically scan links before you open them, which can use up a
              single-use link early. If that happened, just request a fresh link below and open it
              directly from your inbox.
            </p>
            <div className="flex w-full flex-col gap-2">
              <Button className="w-full min-h-[44px]" onClick={() => navigate('/admin/login')}>
                Request a new reset link
              </Button>
              <a
                href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
                  'Password reset link not working'
                )}&body=${encodeURIComponent(
                  `Hi team,\n\nMy password reset link isn't working.\n\nPage: ${window.location.href}\n\n(Please attach a screenshot of this page.)`
                )}`}
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Still stuck? Email {SUPPORT_EMAIL}
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }





  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <CardTitle>Reset Your Password</CardTitle>
          <CardDescription>Enter your new password below</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={errors.password ? 'border-destructive' : ''}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={errors.confirmPassword ? 'border-destructive' : ''}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Password'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
