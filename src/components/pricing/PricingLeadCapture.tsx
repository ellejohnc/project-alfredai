import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { 
  User, 
  Mail, 
  Phone, 
  Globe, 
  Loader2, 
  CheckCircle2,
  ArrowRight,
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { businessEmailSchema } from "@/lib/emailValidation";
import { validatePhoneForCountry, formatInternationalPhone } from "@/lib/phoneUtils";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { getLeadIdentitySync } from "@/hooks/useLeadIdentity";

interface PricingLeadCaptureProps {
  calculatorData: {
    industry: string;
    teamSize: number;
    averageSalary: number;
    hoursOnAdmin: number;
    workflowCount: number;
  };
  onSuccess: () => void;
}

const websiteSchema = z.string().trim().refine((url) => {
  if (!url) return false;
  const pattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/.*)?$/i;
  return pattern.test(url);
}, { message: "Please enter a valid company website" });

export function PricingLeadCapture({ calculatorData, onSuccess }: PricingLeadCaptureProps) {
  const [formData, setFormData] = useState(() => {
    const identity = getLeadIdentitySync();
    const fullName = identity.name || `${identity.firstName || ''} ${identity.lastName || ''}`.trim();
    const nameParts = fullName.split(' ');
    return {
      firstName: identity.firstName || nameParts[0] || "",
      lastName: identity.lastName || nameParts.slice(1).join(' ') || "",
      email: identity.email || "",
      phone: identity.phone || "",
      website: "",
    };
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    // First Name - required
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = "First name must be at least 2 characters";
    }

    // Last Name - required
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = "Last name must be at least 2 characters";
    }

    // Email - required (business email only)
    if (!formData.email.trim()) {
      newErrors.email = "Business email is required";
    } else {
      const emailResult = businessEmailSchema.safeParse(formData.email);
      if (!emailResult.success) {
        newErrors.email = emailResult.error.errors[0]?.message || "Please use your work email";
      }
    }

    // Phone - required
    if (!formData.phone.trim()) {
      newErrors.phone = "Mobile number is required";
    // `.isValid` — this read the returned OBJECT as a boolean, and an object is
    // always truthy, so `!validatePhoneForCountry(...)` was always false and this
    // branch never ran. Any non-empty string passed as a phone number.
    } else if (!validatePhoneForCountry(formData.phone, "AU").isValid) {
      newErrors.phone = "Please enter a valid phone number";
    }

    // Website - required
    if (!formData.website.trim()) {
      newErrors.website = "Company website is required";
    } else {
      try {
        websiteSchema.parse(formData.website);
      } catch {
        newErrors.website = "Please enter a valid company website";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const formattedPhone = formatInternationalPhone(formData.phone, "AU");
      
      // Extract company name from website
      const websiteUrl = formData.website.replace(/^https?:\/\//, "").replace(/\/$/, "");
      const companyName = websiteUrl.split(".")[0];

      // Save to leads table
      const { error } = await supabase.from("leads").insert({
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formattedPhone,
        company: companyName,
        lead_type: "pricing_chatbot",
        source_page: "/pricing",
        source_medium: "pricing_calculator",
        message: JSON.stringify({
          industry: calculatorData.industry,
          teamSize: calculatorData.teamSize,
          averageSalary: calculatorData.averageSalary,
          hoursOnAdmin: calculatorData.hoursOnAdmin,
          workflowCount: calculatorData.workflowCount,
          website: formData.website,
        }),
      });

      if (error) throw error;

      // Store in localStorage for persistence
      localStorage.setItem("alfred_pricing_lead", JSON.stringify({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formattedPhone,
        company: companyName,
      }));

      setIsSubmitted(true);
      toast.success("Thank you! Your personalized quote is ready.");
      
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err) {
      console.error("Lead capture error:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-6 text-center"
      >
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary/20 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-secondary" />
        </div>
        <h3 className="text-lg font-semibold mb-2">You're all set!</h3>
        <p className="text-sm text-muted-foreground">
          Loading your personalized quote...
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">
          Almost there! Let's personalize your quote.
        </h3>
        <p className="text-sm text-muted-foreground">
          We'll send you a detailed breakdown with your exact numbers.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {/* First Name */}
          <div className="space-y-1.5">
            <Label htmlFor="firstName" className="text-xs">
              First Name <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="firstName"
                required
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                className={cn("pl-9", errors.firstName && "border-destructive")}
                placeholder="John"
              />
            </div>
            {errors.firstName && (
              <p className="text-xs text-destructive">{errors.firstName}</p>
            )}
          </div>

          {/* Last Name */}
          <div className="space-y-1.5">
            <Label htmlFor="lastName" className="text-xs">
              Last Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="lastName"
              required
              value={formData.lastName}
              onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
              className={cn(errors.lastName && "border-destructive")}
              placeholder="Smith"
            />
            {errors.lastName && (
              <p className="text-xs text-destructive">{errors.lastName}</p>
            )}
          </div>
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs">
            Business Email <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className={cn("pl-9", errors.email && "border-destructive")}
              placeholder="john@company.com"
            />
          </div>
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email}</p>
          )}
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <Label htmlFor="phone" className="text-xs">
            Mobile Number <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="phone"
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className={cn("pl-9", errors.phone && "border-destructive")}
              placeholder="+61 400 000 000"
            />
          </div>
          {errors.phone && (
            <p className="text-xs text-destructive">{errors.phone}</p>
          )}
        </div>

        {/* Website */}
        <div className="space-y-1.5">
          <Label htmlFor="website" className="text-xs">
            Company Website <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="website"
              required
              value={formData.website}
              onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
              className={cn("pl-9", errors.website && "border-destructive")}
              placeholder="company.com"
            />
          </div>
          {errors.website && (
            <p className="text-xs text-destructive">{errors.website}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full min-h-[48px]"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Get My Personalized Quote
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
          <Lock className="w-3 h-3" />
          Your information is secure and never shared.
        </p>
      </form>
    </motion.div>
  );
}
