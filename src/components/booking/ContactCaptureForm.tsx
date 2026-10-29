import { memo, useState, useCallback, useRef, useEffect } from "react";
import { Calendar, Play, AlertCircle, Check, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { strictEmailSchema } from "@/lib/emailValidation";
import { toast } from "sonner";
import {
  COUNTRY_CODES,
  detectCountryFromLocale,
  formatPhoneDisplay,
  validatePhoneForCountry,
  formatInternationalPhone,
  getCountryByCode,
  saveCountryCode,
} from "@/lib/phoneUtils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ContactCaptureFormProps {
  leadName: string;
  leadEmail: string;
  leadPhone: string;
  leadCompany: string;
  onNameChange: (name: string) => void;
  onEmailChange: (email: string) => void;
  onPhoneChange: (phone: string) => void;
  onCompanyChange: (company: string) => void;
  onSubmit: (email: string) => void;
  onViewCalendar: () => void;
  onViewDemos: () => void;
  showCTA: boolean;
}

export const ContactCaptureForm = memo(function ContactCaptureForm({
  leadName,
  leadEmail,
  leadPhone,
  leadCompany,
  onNameChange,
  onEmailChange,
  onPhoneChange,
  onCompanyChange,
  onSubmit,
  onViewCalendar,
  onViewDemos,
  showCTA,
}: ContactCaptureFormProps) {
  const [emailError, setEmailError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [countryCode, setCountryCode] = useState(() => detectCountryFromLocale());
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Delay rendering to prevent flicker during rapid state changes
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Focus name input when form becomes visible (not CTA mode)
  useEffect(() => {
    if (isVisible && !showCTA && nameInputRef.current) {
      const focusTimer = setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(focusTimer);
    }
  }, [isVisible, showCTA]);

  const handleEmailBlur = useCallback(() => {
    if (leadEmail.trim()) {
      const result = strictEmailSchema.safeParse(leadEmail);
      if (!result.success) {
        setEmailError(result.error.errors[0]?.message || "Invalid email");
      } else {
        setEmailError(null);
      }
    }
  }, [leadEmail]);

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onEmailChange(e.target.value);
    if (emailError) setEmailError(null);
  }, [onEmailChange, emailError]);

  const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits and common phone characters
    const cleaned = e.target.value.replace(/[^\d\s\-()]/g, "");
    const formatted = formatPhoneDisplay(cleaned, countryCode);
    onPhoneChange(formatted);
    if (phoneError) setPhoneError(null);
  }, [onPhoneChange, phoneError, countryCode]);

  const handlePhoneBlur = useCallback(() => {
    if (leadPhone.trim()) {
      const validation = validatePhoneForCountry(leadPhone, countryCode);
      setPhoneError(validation.isValid ? null : validation.error || null);
    }
  }, [leadPhone, countryCode]);

  const isPhoneValid = useCallback(() => {
    if (!leadPhone.trim()) return false;
    return validatePhoneForCountry(leadPhone, countryCode).isValid;
  }, [leadPhone, countryCode]);

  const handleSubmit = useCallback(() => {
    const email = leadEmail.trim();
    const result = strictEmailSchema.safeParse(email);
    
    if (!result.success) {
      const errorMsg = result.error.errors[0]?.message || "Please enter a valid email";
      setEmailError(errorMsg);
      toast.error(errorMsg);
      return;
    }
    
    // Validate phone if provided
    if (leadPhone.trim()) {
      const phoneValidation = validatePhoneForCountry(leadPhone, countryCode);
      if (!phoneValidation.isValid) {
        setPhoneError(phoneValidation.error || "Invalid phone number");
        toast.error(phoneValidation.error || "Invalid phone number");
        return;
      }
    }
    
    setEmailError(null);
    setPhoneError(null);
    onSubmit(result.data);
    toast.success('Saved — you can book now');
  }, [leadEmail, leadPhone, onSubmit]);

  // Don't render until visibility delay passes
  if (!isVisible) {
    return (
      <div className="px-3 sm:px-5 pb-3 sm:pb-4 shrink-0">
        <div className="h-[180px]" /> {/* Placeholder to prevent layout shift */}
      </div>
    );
  }

  // Show CTA buttons when email is captured
  if (showCTA) {
    return (
      <div className="px-3 sm:px-5 pb-3 sm:pb-4 shrink-0">
        <p className="text-[10px] sm:text-xs text-muted-foreground font-medium mb-2">Choose:</p>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            onClick={onViewCalendar}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-all shadow-md active:scale-[0.98]"
          >
            <Calendar className="w-4 h-4" />
            View Available Times
          </button>
          <button
            onClick={onViewDemos}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 rounded-xl bg-muted/60 hover:bg-muted text-foreground font-medium text-sm border border-border/50 transition-all active:scale-[0.98]"
          >
            <Play className="w-4 h-4" />
            See Demos First
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 sm:px-5 pb-3 sm:pb-4 shrink-0 space-y-2">
      <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">
        One last thing before you book:
      </p>
      <div className="rounded-xl border border-border bg-background/60 backdrop-blur-sm p-3 sm:p-4 space-y-2">
        <input
          ref={nameInputRef}
          value={leadName}
          onChange={(e) => onNameChange(e.target.value)}
          autoComplete="name"
          placeholder="Your name *"
          maxLength={100}
          className="w-full bg-muted/50 border border-border/50 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all"
        />
        <div className="relative">
          <input
            value={leadEmail}
            onChange={handleEmailChange}
            onBlur={handleEmailBlur}
            inputMode="email"
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="email"
            maxLength={255}
            placeholder="Work email *"
            className={cn(
              "w-full bg-muted/50 border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-all",
              emailError
                ? "border-red-500/70 focus:ring-red-500/30 focus:border-red-500/50"
                : "border-border/50 focus:ring-primary/30 focus:border-primary/30"
            )}
          />
          {emailError && (
            <div className="absolute -bottom-5 left-0 flex items-center gap-1 text-xs text-red-500">
              <AlertCircle className="w-3 h-3" />
              <span>{emailError}</span>
            </div>
          )}
        </div>
        <div className={cn("relative", emailError && "mt-4")}>
          <div className="flex gap-2">
            <Select value={countryCode} onValueChange={(value) => {
              setCountryCode(value);
              saveCountryCode(value);
            }}>
              <SelectTrigger className="w-[90px] flex-shrink-0 bg-muted/50 border-border/50 rounded-xl h-10">
                <SelectValue>
                  <span className="flex items-center gap-1">
                    <Globe className="w-3 h-3 text-muted-foreground" />
                    <span className="text-sm">{getCountryByCode(countryCode)?.dialCode}</span>
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {COUNTRY_CODES.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    <span className="flex items-center gap-2">
                      <span className="font-medium">{country.dialCode}</span>
                      <span className="text-muted-foreground text-xs">{country.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative flex-1">
              <input
                value={leadPhone}
                onChange={handlePhoneChange}
                onBlur={handlePhoneBlur}
                inputMode="tel"
                autoComplete="tel"
                placeholder={getCountryByCode(countryCode)?.placeholder || "Phone number"}
                maxLength={20}
                className={cn(
                  "w-full bg-muted/50 border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-all pr-10 h-10",
                  phoneError
                    ? "border-red-500/70 focus:ring-red-500/30 focus:border-red-500/50"
                    : "border-border/50 focus:ring-primary/30 focus:border-primary/30"
                )}
              />
              {isPhoneValid() && (
                <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
              )}
            </div>
          </div>
          {phoneError && (
            <div className="absolute -bottom-5 left-0 flex items-center gap-1 text-xs text-red-500">
              <AlertCircle className="w-3 h-3" />
              <span>{phoneError}</span>
            </div>
          )}
          <p className="text-[10px] text-muted-foreground mt-1 ml-1">Optional</p>
        </div>
        <input
          value={leadCompany}
          onChange={(e) => onCompanyChange(e.target.value)}
          autoComplete="organization"
          placeholder="Company (optional)"
          maxLength={100}
          className={cn(
            "w-full bg-muted/50 border border-border/50 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all",
            phoneError && "mt-4"
          )}
        />
        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            disabled={!leadName.trim() || !leadEmail.trim() || !!emailError}
            className={cn(
              "flex-1 h-10 rounded-xl text-sm font-medium transition-all active:scale-[0.98]",
              !leadName.trim() || !leadEmail.trim() || emailError
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            Continue to Calendar
          </button>
        </div>
      </div>
    </div>
  );
});
