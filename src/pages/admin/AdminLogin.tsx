import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Lock, Mail, Loader2 } from 'lucide-react';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const REMEMBER_ME_KEY = 'alfred_admin_remember_me';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { signIn, isLoading, user, isAdmin } = useAdminAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (user && isAdmin) {
      navigate('/admin');
    }
  }, [user, isAdmin, navigate]);

  // Load remember me preference on mount
  useEffect(() => {
    const remembered = localStorage.getItem(REMEMBER_ME_KEY);
    if (remembered === 'true') {
      setRememberMe(true);
    }
  }, []);

  const handleResetPassword = async () => {
    if (!loginEmail) {
      toast.error('Please enter your email address first');
      return;
    }

    setIsResetting(true);
    try {
      // Generate a proper single-use tokenised link server-side and send the
      // styled email in one step. (Avoids sending a token-less link.)
      const { error } = await supabase.functions.invoke('request-password-reset', {
        body: { email: loginEmail },
      });

      if (error) {
        toast.error('Failed to send reset email. Please try again.');
      } else {
        toast.success('Password reset email sent! Check your inbox.');
      }
    } catch (err) {
      toast.error('Failed to send reset email');
    } finally {
      setIsResetting(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const validated = loginSchema.parse({ email: loginEmail, password: loginPassword });
      const { error, data } = await signIn(validated.email, validated.password);
      
      if (error) {
        toast.error(error.message || 'Failed to sign in');
        setIsSubmitting(false);
      } else {
        // Handle remember me - store preference for persistent session
        if (rememberMe) {
          localStorage.setItem(REMEMBER_ME_KEY, 'true');
        } else {
          localStorage.removeItem(REMEMBER_ME_KEY);
        }

        // Update last_login_at in admin_users
        if (data?.user?.email) {
          await supabase
            .from('admin_users')
            .update({ last_login_at: new Date().toISOString() })
            .eq('email', data.user.email);
        }
        toast.success('Welcome back!');
        setIsRedirecting(true);
        navigate('/admin');
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
      }
      setIsSubmitting(false);
    }
  };


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
      {isRedirecting && (
        <div className="absolute inset-0 z-50 bg-background/70 backdrop-blur-sm flex items-center justify-center">
          <div className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3 shadow-lg">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm font-medium text-foreground">Signing you in…</span>
          </div>
        </div>
      )}

      <Card className="w-full max-w-md shadow-2xl border-border/50">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Admin Control Center</CardTitle>
          <CardDescription>Sign in to manage content</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="login-email"
                  type="email"
                  placeholder="admin@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="pl-10"
                  required
                  disabled={isSubmitting || isRedirecting}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="pl-10"
                  required
                  disabled={isSubmitting || isRedirecting}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="remember-me" 
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
                disabled={isSubmitting || isRedirecting}
              />
              <Label 
                htmlFor="remember-me" 
                className="text-sm text-muted-foreground cursor-pointer"
              >
                Remember me
              </Label>
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting || isRedirecting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={handleResetPassword}
              disabled={isResetting || isRedirecting}
              className="text-sm text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
            >
              {isResetting ? 'Sending...' : 'Forgot your password?'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
