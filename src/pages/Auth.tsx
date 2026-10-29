import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock, User, Eye, EyeOff, CheckCircle, ArrowLeft, Loader2, Shield, Zap, TrendingUp } from "lucide-react";
import { LatestUpdates } from "@/components/auth/LatestUpdates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useUserAuth } from "@/contexts/UserAuthContext";
import alfredLogo from "@/assets/alfred-ai-mid.png";

// Validation schemas
const signInSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signUpSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Include at least one uppercase letter")
    .regex(/[0-9]/, "Include at least one number"),
  confirmPassword: z.string(),
  acceptTerms: z.literal(true, { errorMap: () => ({ message: "You must accept the terms" }) }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignInFormData = z.infer<typeof signInSchema>;
type SignUpFormData = z.infer<typeof signUpSchema>;

// Google icon component
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      fill="currentColor"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="currentColor"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="currentColor"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="currentColor"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

// Password strength indicator
const PasswordStrength = ({ password }: { password: string }) => {
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  
  const criteria = [
    { label: "8+ characters", met: hasMinLength },
    { label: "Uppercase letter", met: hasUppercase },
    { label: "Number", met: hasNumber },
  ];
  
  return (
    <div className="mt-2 space-y-1">
      {criteria.map((c) => (
        <div key={c.label} className="flex items-center gap-2 text-xs">
          <CheckCircle className={`w-3 h-3 ${c.met ? "text-green-500" : "text-muted-foreground/40"}`} />
          <span className={c.met ? "text-foreground" : "text-muted-foreground/60"}>{c.label}</span>
        </div>
      ))}
    </div>
  );
};

const Auth = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "signin";
  
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signIn, signUp, signInWithGoogle, resetPassword } = useUserAuth();

  // Preserve an OAuth consent (or other) return path across sign-in/sign-up.
  const rawNext = searchParams.get("next");
  const safeNext =
    rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : null;

  // Persist next so it survives a full-page OAuth (Google) round-trip.
  useEffect(() => {
    if (safeNext) sessionStorage.setItem("post_auth_next", safeNext);
  }, [safeNext]);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      const stored = sessionStorage.getItem("post_auth_next");
      const from =
        safeNext || stored || (location.state as { from?: string })?.from || "/";
      if (stored) sessionStorage.removeItem("post_auth_next");
      navigate(from, { replace: true });
    }
  }, [user, navigate, location, safeNext]);


  // Sign in form
  const signInForm = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  // Sign up form
  const signUpForm = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { fullName: "", email: "", password: "", confirmPassword: "", acceptTerms: false as unknown as true },
  });

  const handleSignIn = async (data: SignInFormData) => {
    setIsSubmitting(true);
    const { error } = await signIn(data.email, data.password);
    setIsSubmitting(false);
    
    if (error) {
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Welcome back!",
        description: "You've successfully signed in.",
      });
    }
  };

  const handleSignUp = async (data: SignUpFormData) => {
    setIsSubmitting(true);
    const { error } = await signUp(data.email, data.password, data.fullName);
    setIsSubmitting(false);
    
    if (error) {
      toast({
        title: "Sign up failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Check your email",
        description: "We've sent you a verification link to complete your registration.",
      });
      setMode("signin");
      signUpForm.reset();
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    const { error } = await signInWithGoogle();
    setIsSubmitting(false);
    
    if (error) {
      toast({
        title: "Google sign in failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail) {
      toast({
        title: "Email required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    const { error } = await resetPassword(forgotEmail);
    setIsSubmitting(false);
    
    if (error) {
      toast({
        title: "Failed to send reset email",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Reset email sent",
        description: "Check your inbox for password reset instructions.",
      });
      setShowForgotPassword(false);
      setForgotEmail("");
    }
  };

  const watchedPassword = signUpForm.watch("password");

  return (
    <>
      <Helmet>
        <title>{mode === "signin" ? "Sign In" : "Sign Up"} | alfred ai</title>
        <meta name="description" content="Sign in or create an account to access alfred ai's intelligent operations platform." />
      </Helmet>

      <div className="min-h-screen bg-background relative overflow-hidden">
        {/* Animated gradient orbs */}
        <motion.div
          className="absolute top-20 right-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none"
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-secondary/10 rounded-full blur-[100px] pointer-events-none"
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/2 right-0 w-[300px] h-[300px] bg-accent/5 rounded-full blur-[80px] pointer-events-none"
          animate={{ y: [0, -20, 0], opacity: [0.2, 0.3, 0.2] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
          <div className="container-wide flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
              <img src={alfredLogo} alt="alfred ai" className="h-8 w-auto" />
            </Link>
            
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {mode === "signin" ? "Not a member?" : "Already a member?"}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setMode(mode === "signin" ? "signup" : "signin");
                  setShowForgotPassword(false);
                }}
                className="min-h-[44px] px-4"
              >
                {mode === "signin" ? "Sign up now" : "Sign in"}
              </Button>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="min-h-screen flex items-center py-24 px-4">
          <div className="container-wide">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              {/* Left: Marketing copy - Hidden on mobile */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="hidden lg:block"
              >
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground">
                  {mode === "signin" ? "Welcome back." : "Join alfred ai."}
                </h1>
            <p className="text-xl md:text-2xl font-medium text-foreground/90 mt-4 max-w-md">
              Agentic AI Execution Layer for Project Execution
            </p>
            <p className="text-lg text-muted-foreground mt-2 max-w-md">
              From Requests to Delivery — 10x Faster
            </p>
                
                {/* Trust signals */}
                <div className="mt-8 space-y-4">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-primary" />
                    </div>
                    <span>Certified Enterprise-grade security</span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-primary" />
                    </div>
                    <span>Guaranteed ROI or we work for free</span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-primary" />
                    </div>
                    <span>Lightning-fast implementations (Starting from 48 hours)</span>
                  </div>
                </div>

                {/* Latest Updates */}
                <LatestUpdates />
              </motion.div>

              {/* Right: Auth form */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="w-full max-w-md mx-auto lg:mx-0"
              >
                <Card className="shadow-2xl border-0 bg-card/95 backdrop-blur-sm">
                  <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold">
                      {showForgotPassword ? "Reset Password." : mode === "signin" ? "Sign in Now." : "Create Account."}
                    </CardTitle>
                    <CardDescription>
                      {showForgotPassword
                        ? "Enter your email to receive reset instructions"
                        : mode === "signin"
                        ? "Enter your details below"
                        : "Start your AI journey today"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <AnimatePresence mode="wait">
                      {showForgotPassword ? (
                        <motion.div
                          key="forgot"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="space-y-4"
                        >
                          <div className="space-y-2">
                            <Label htmlFor="forgot-email">Email</Label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input
                                id="forgot-email"
                                type="email"
                                placeholder="you@example.com"
                                value={forgotEmail}
                                onChange={(e) => setForgotEmail(e.target.value)}
                                className="pl-10 min-h-[44px]"
                              />
                            </div>
                          </div>
                          <Button
                            onClick={handleForgotPassword}
                            disabled={isSubmitting}
                            className="w-full min-h-[44px] bg-primary hover:bg-primary/90"
                          >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Reset Link"}
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => setShowForgotPassword(false)}
                            className="w-full min-h-[44px]"
                          >
                            Back to Sign In
                          </Button>
                        </motion.div>
                      ) : mode === "signin" ? (
                        <motion.form
                          key="signin"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          onSubmit={signInForm.handleSubmit(handleSignIn)}
                          className="space-y-4"
                        >
                          <div className="space-y-2">
                            <Label htmlFor="signin-email">Email</Label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input
                                id="signin-email"
                                type="email"
                                placeholder="you@example.com"
                                {...signInForm.register("email")}
                                className="pl-10 min-h-[44px]"
                              />
                            </div>
                            {signInForm.formState.errors.email && (
                              <p className="text-xs text-destructive">{signInForm.formState.errors.email.message}</p>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="signin-password">Password</Label>
                              <button
                                type="button"
                                onClick={() => setShowForgotPassword(true)}
                                className="text-xs text-primary hover:underline"
                              >
                                Forgot?
                              </button>
                            </div>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input
                                id="signin-password"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                {...signInForm.register("password")}
                                className="pl-10 pr-10 min-h-[44px]"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                            {signInForm.formState.errors.password && (
                              <p className="text-xs text-destructive">{signInForm.formState.errors.password.message}</p>
                            )}
                          </div>
                          
                          <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full min-h-[44px] bg-primary hover:bg-primary/90"
                          >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign in"}
                          </Button>
                        </motion.form>
                      ) : (
                        <motion.form
                          key="signup"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          onSubmit={signUpForm.handleSubmit(handleSignUp)}
                          className="space-y-4"
                        >
                          <div className="space-y-2">
                            <Label htmlFor="signup-name">Full Name</Label>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input
                                id="signup-name"
                                type="text"
                                placeholder="John Doe"
                                {...signUpForm.register("fullName")}
                                className="pl-10 min-h-[44px]"
                              />
                            </div>
                            {signUpForm.formState.errors.fullName && (
                              <p className="text-xs text-destructive">{signUpForm.formState.errors.fullName.message}</p>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="signup-email">Email</Label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input
                                id="signup-email"
                                type="email"
                                placeholder="you@example.com"
                                {...signUpForm.register("email")}
                                className="pl-10 min-h-[44px]"
                              />
                            </div>
                            {signUpForm.formState.errors.email && (
                              <p className="text-xs text-destructive">{signUpForm.formState.errors.email.message}</p>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="signup-password">Password</Label>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input
                                id="signup-password"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                {...signUpForm.register("password")}
                                className="pl-10 pr-10 min-h-[44px]"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                            {signUpForm.formState.errors.password && (
                              <p className="text-xs text-destructive">{signUpForm.formState.errors.password.message}</p>
                            )}
                            <PasswordStrength password={watchedPassword || ""} />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="signup-confirm">Confirm Password</Label>
                            <div className="relative">
                              <CheckCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input
                                id="signup-confirm"
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="••••••••"
                                {...signUpForm.register("confirmPassword")}
                                className="pl-10 pr-10 min-h-[44px]"
                              />
                              <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              >
                                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                            {signUpForm.formState.errors.confirmPassword && (
                              <p className="text-xs text-destructive">{signUpForm.formState.errors.confirmPassword.message}</p>
                            )}
                          </div>
                          
                          <div className="flex items-start gap-2">
                            <Checkbox
                              id="terms"
                              checked={signUpForm.watch("acceptTerms") === true}
                              onCheckedChange={(checked) => signUpForm.setValue("acceptTerms", checked as true)}
                              className="mt-1"
                            />
                            <Label htmlFor="terms" className="text-sm text-muted-foreground leading-tight">
                              I agree to the{" "}
                              <Link to="/terms" className="text-primary hover:underline">
                                Terms of Service
                              </Link>{" "}
                              and{" "}
                              <Link to="/privacy" className="text-primary hover:underline">
                                Privacy Policy
                              </Link>
                            </Label>
                          </div>
                          {signUpForm.formState.errors.acceptTerms && (
                            <p className="text-xs text-destructive">{signUpForm.formState.errors.acceptTerms.message}</p>
                          )}
                          
                          <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full min-h-[44px] bg-primary hover:bg-primary/90"
                          >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create account"}
                          </Button>
                        </motion.form>
                      )}
                    </AnimatePresence>

                    {/* OAuth divider */}
                    {!showForgotPassword && (
                      <>
                        <div className="relative my-6">
                          <div className="absolute inset-0 flex items-center">
                            <Separator />
                          </div>
                          <div className="relative flex justify-center">
                            <span className="bg-card px-3 text-sm text-muted-foreground">
                              or continue with
                            </span>
                          </div>
                        </div>

                        {/* Google button */}
                        <Button
                          variant="outline"
                          onClick={handleGoogleSignIn}
                          disabled={isSubmitting}
                          className="w-full min-h-[44px] gap-2"
                        >
                          <GoogleIcon />
                          Continue with Google
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Mobile: Show sign up link below card */}
                <p className="text-center text-sm text-muted-foreground mt-6 lg:hidden">
                  {mode === "signin" ? (
                    <>
                      Don't have an account?{" "}
                      <button
                        onClick={() => setMode("signup")}
                        className="text-primary hover:underline font-medium"
                      >
                        Sign up
                      </button>
                    </>
                  ) : (
                    <>
                      Already have an account?{" "}
                      <button
                        onClick={() => setMode("signin")}
                        className="text-primary hover:underline font-medium"
                      >
                        Sign in
                      </button>
                    </>
                  )}
                </p>
              </motion.div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default Auth;
