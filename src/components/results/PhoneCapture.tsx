import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Phone, ArrowRight, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PhoneCaptureProps {
  onSubmit: (phone: string) => void;
  onSkip: () => void;
  onDecline: () => void;
  showSkipOption: boolean;
}

// Common country codes with their dial codes and formats
const countryCodes = [
  { code: "AU", dialCode: "+61", name: "Australia", minLength: 9, maxLength: 10 },
  { code: "US", dialCode: "+1", name: "United States", minLength: 10, maxLength: 10 },
  { code: "GB", dialCode: "+44", name: "United Kingdom", minLength: 10, maxLength: 11 },
  { code: "NZ", dialCode: "+64", name: "New Zealand", minLength: 8, maxLength: 10 },
  { code: "SG", dialCode: "+65", name: "Singapore", minLength: 8, maxLength: 8 },
  { code: "HK", dialCode: "+852", name: "Hong Kong", minLength: 8, maxLength: 8 },
  { code: "MY", dialCode: "+60", name: "Malaysia", minLength: 9, maxLength: 10 },
  { code: "PH", dialCode: "+63", name: "Philippines", minLength: 10, maxLength: 10 },
  { code: "IN", dialCode: "+91", name: "India", minLength: 10, maxLength: 10 },
  { code: "AE", dialCode: "+971", name: "UAE", minLength: 9, maxLength: 9 },
  { code: "CA", dialCode: "+1", name: "Canada", minLength: 10, maxLength: 10 },
  { code: "DE", dialCode: "+49", name: "Germany", minLength: 10, maxLength: 12 },
  { code: "FR", dialCode: "+33", name: "France", minLength: 9, maxLength: 9 },
  { code: "JP", dialCode: "+81", name: "Japan", minLength: 10, maxLength: 11 },
  { code: "CN", dialCode: "+86", name: "China", minLength: 11, maxLength: 11 },
];

// Format phone number for display (add spaces for readability)
const formatPhoneDisplay = (value: string, countryCode: string): string => {
  const digits = value.replace(/\D/g, "");
  const country = countryCodes.find(c => c.code === countryCode);
  
  if (!country) return digits;
  
  // Format based on country
  if (countryCode === "AU") {
    // Australian format: 0XXX XXX XXX or XXX XXX XXX
    if (digits.length <= 4) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 10)}`;
  }
  
  if (countryCode === "US" || countryCode === "CA") {
    // US/Canada format: (XXX) XXX-XXXX
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }
  
  if (countryCode === "GB") {
    // UK format: XXXX XXX XXXX
    if (digits.length <= 4) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  
  // Default format: groups of 3-4 digits
  if (digits.length <= 4) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
};

// Detect country from browser locale
const detectCountry = (): string => {
  try {
    const locale = navigator.language || "en-AU";
    const countryFromLocale = locale.split("-")[1]?.toUpperCase();
    const found = countryCodes.find(c => c.code === countryFromLocale);
    return found ? found.code : "AU";
  } catch {
    return "AU";
  }
};

export function PhoneCapture({ onSubmit, onSkip, onDecline, showSkipOption }: PhoneCaptureProps) {
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("AU");
  const [error, setError] = useState("");

  // Detect country on mount
  useEffect(() => {
    setCountryCode(detectCountry());
  }, []);

  const validatePhone = (value: string): { valid: boolean; message?: string } => {
    const digits = value.replace(/\D/g, "");
    const country = countryCodes.find(c => c.code === countryCode);
    
    if (!country) {
      return { valid: digits.length >= 7, message: "Please enter a valid phone number" };
    }

    if (digits.length < country.minLength) {
      return { 
        valid: false, 
        message: `Phone number should be at least ${country.minLength} digits for ${country.name}` 
      };
    }

    if (digits.length > country.maxLength) {
      return { 
        valid: false, 
        message: `Phone number should be at most ${country.maxLength} digits for ${country.name}` 
      };
    }

    return { valid: true };
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow digits, spaces, dashes, and parentheses
    const cleaned = value.replace(/[^\d\s\-()]/g, "");
    const formatted = formatPhoneDisplay(cleaned, countryCode);
    setPhone(formatted);
    setError("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!phone.trim()) {
      setError("Please enter your phone number");
      return;
    }

    const validation = validatePhone(phone);
    if (!validation.valid) {
      setError(validation.message || "Please enter a valid phone number");
      return;
    }

    // Format final phone number with country code
    const country = countryCodes.find(c => c.code === countryCode);
    const digits = phone.replace(/\D/g, "");
    const formattedPhone = `${country?.dialCode || ""} ${digits}`;
    
    onSubmit(formattedPhone.trim());
  };

  const handleDecline = () => {
    setPhone("");
    setError("");
    onDecline();
  };

  const selectedCountry = countryCodes.find(c => c.code === countryCode);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-4 max-w-sm mx-auto"
    >
      <div className="text-center mb-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-3">
          <Phone className="w-6 h-6 text-primary" />
        </div>
        <h3 className="font-semibold text-foreground mb-1">
          One more step before the demo
        </h3>
        <p className="text-sm text-muted-foreground">
          Add your phone number so we can reach you with your personalized insights
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full space-y-3">
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-sm text-muted-foreground">Phone Number</Label>
          <div className="flex gap-2">
            <Select value={countryCode} onValueChange={setCountryCode}>
              <SelectTrigger className="w-[120px] flex-shrink-0">
                <SelectValue>
                  <span className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>{selectedCountry?.dialCode}</span>
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {countryCodes.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    <span className="flex items-center gap-2">
                      <span className="font-medium">{country.dialCode}</span>
                      <span className="text-muted-foreground text-xs">{country.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              id="phone"
              type="tel"
              placeholder={countryCode === "AU" ? "0400 000 000" : "Phone number"}
              value={phone}
              onChange={handlePhoneChange}
              className={`flex-1 ${error ? "border-destructive" : ""}`}
              maxLength={15}
            />
          </div>
          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}
        </div>

        <Button type="submit" size="lg" className="w-full gap-2">
          Watch It In Action
          <ArrowRight className="w-4 h-4" />
        </Button>
      </form>

      {!showSkipOption ? (
        <button
          type="button"
          onClick={handleDecline}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          I'd rather not share my number
        </button>
      ) : (
        <button
          type="button"
          onClick={onSkip}
          className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
        >
          Skip to book an Impact Conversation
        </button>
      )}
    </motion.div>
  );
}
