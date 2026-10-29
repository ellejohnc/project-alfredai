import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SafeAnimatePresence } from '@/components/ui/safe-animate-presence';
import { Lock, ArrowRight, AlertCircle, Mail, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { SUPPORT_EMAIL } from '@/lib/siteConfig';

interface PasswordGateProps {
  onUnlock: () => void;
}

const CORRECT_PASSWORD = '2026';
const MAX_ATTEMPTS = 3;
const STORAGE_KEY = 'diy_quote_unlocked';

export function PasswordGate({ onUnlock }: PasswordGateProps) {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  // Check if already unlocked
  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY) === 'true') {
      onUnlock();
    }
  }, [onUnlock]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLocked) return;

    if (password === CORRECT_PASSWORD) {
      sessionStorage.setItem(STORAGE_KEY, 'true');
      toast.success('Access granted');
      onUnlock();
    } else {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setPassword('');
      
      if (newAttempts >= MAX_ATTEMPTS) {
        setIsLocked(true);
        toast.error('Too many failed attempts. Please contact an admin.');
      } else {
        toast.error(`Incorrect password. ${MAX_ATTEMPTS - newAttempts} attempts remaining.`);
      }
    }
  }, [password, attempts, isLocked, onUnlock]);

  const handleContactAdmin = () => {
    const subject = encodeURIComponent('DIY Quote Builder Access Request');
    const body = encodeURIComponent(`Hi,\n\nI need access to the DIY Quote Builder tool.\n\nPage: ${window.location.href}\n\nThank you`);
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center p-4">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="absolute top-4 left-4 gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="w-8 h-8 text-primary" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-center mb-2">
            DIY Quote Builder
          </h1>
          <p className="text-muted-foreground text-center mb-8">
            Enter the admin password to access this tool
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
                  onClick={handleContactAdmin}
                  className="w-full"
                  variant="outline"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Contact Admin for Access
                </Button>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                onSubmit={handleSubmit}
                className={`space-y-4 ${isShaking ? 'animate-shake' : ''}`}
              >
                <div className="space-y-2">
                  <Input
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="text-center text-lg tracking-widest"
                    autoFocus
                  />
                  {attempts > 0 && (
                    <p className="text-sm text-muted-foreground text-center">
                      {MAX_ATTEMPTS - attempts} attempts remaining
                    </p>
                  )}
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={!password.trim()}
                >
                  Unlock
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </motion.form>
            )}
          </SafeAnimatePresence>
        </div>
      </motion.div>

      {/* Add shake animation */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}
