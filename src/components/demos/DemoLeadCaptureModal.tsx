import { storeDemoAccess } from './demoLeadAccess';

import { useState } from "react";
import { getVisitorId } from '@/lib/visitorId';
import { Play, Loader2, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { saveCountryCode } from "@/lib/phoneUtils";
import { ResourceAccessFields } from "@/components/resources/ResourceAccessFields";
import { initialResourceAccessValues, validateResourceAccess, normaliseResourceAccess, type ResourceAccessValues, type ResourceAccessErrors } from "@/lib/resourceAccess";
import { getUTMData } from "@/lib/utmTracking";

interface DemoLeadCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  demoId: string;
  demoTitle: string;
}

export function DemoLeadCaptureModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  demoId, 
  demoTitle 
}: DemoLeadCaptureModalProps) {
  const { toast } = useToast();
  
  const [access, setAccess] = useState<ResourceAccessValues>(() => initialResourceAccessValues());
  const [errors, setErrors] = useState<ResourceAccessErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const e = validateResourceAccess(access);
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const lead = normaliseResourceAccess(access);
      const name = lead.fullName;
      const email = lead.email;
      const company = lead.company;
      const firstName = lead.firstName;
      const lastName = lead.lastName;
      const formattedPhone = lead.phone;
      const countryCode = access.countryCode;

      // Store access immediately (before any network calls)
      storeDemoAccess(email);
      
      // Persist identity to unified key (alfred_lead_identity + lead_identity)
      const identity = {
        firstName,
        lastName,
        name,
        email,
        phone: formattedPhone,
        company,
        turnover: access.turnover,
      };
      localStorage.setItem("alfred_lead_identity", JSON.stringify(identity));
      // Legacy compat
      localStorage.setItem("lead_identity", JSON.stringify(identity));
      saveCountryCode(countryCode);
      
      // Fire background processing (non-blocking, fire-and-forget)
      const utmData = getUTMData();
      supabase.functions.invoke('queue-demo-lead', {
        body: {
          lead_email: email,
          lead_name: name,
          lead_phone: formattedPhone,
          lead_company: company,
          lead_turnover: access.turnover,
          source_page: `/resources/demos/${demoId}`,
          source_medium: "demo_share_link",
          source_campaign: `demo_${demoId}`,
          lead_source: "demo_share",
          visitor_id: getVisitorId(),
          demo_title: demoTitle,
          demo_id: demoId,
          contact_consent: true,
          utm_data: utmData,
        }
      }).catch(err => console.error('Background lead processing failed:', err));
      // Note: No await - we don't wait for this to complete
      
      toast({
        title: "Welcome!",
        description: "Enjoy exploring the demo.",
      });
      
      // Grant access immediately (<100ms)
      onSuccess();
    } catch (error) {
      console.error("Demo lead capture error:", error);
      toast({
        title: "Something went wrong",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent 
        className="sm:max-w-md p-0 max-h-[90vh] overflow-y-auto"
      >
        <div className="relative">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 pb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Access Demo
                </h2>
                <p className="text-sm text-muted-foreground">
                  {demoTitle}
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 pt-4 space-y-4">
            <p className="text-sm text-muted-foreground mb-4">
              Enter your details to view this interactive demo.
            </p>

            <ResourceAccessFields values={access} errors={errors} onChange={setAccess} idPrefix="demo" />

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-11 mt-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Access Demo
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default DemoLeadCaptureModal;
