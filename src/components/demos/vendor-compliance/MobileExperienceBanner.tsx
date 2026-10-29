import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Monitor, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

const STORAGE_KEY = "vendor-compliance-desktop-notice-dismissed";

export function MobileExperienceBanner() {
  const isMobile = useIsMobile();
  const [dismissed, setDismissed] = useState(() => 
    sessionStorage.getItem(STORAGE_KEY) === "true"
  );

  if (!isMobile || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem(STORAGE_KEY, "true");
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="bg-primary/10 border border-primary/20 rounded-lg p-3 mb-3"
      >
        <div className="flex items-start gap-3">
          <Monitor className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">Better on desktop</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              This demo is optimized for larger screens. For the best experience, switch to a tablet or desktop.
            </p>
          </div>
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-8 px-2 shrink-0 min-h-[44px] min-w-[44px] -mt-1 -mr-1"
            onClick={handleDismiss}
            aria-label="Dismiss banner"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default MobileExperienceBanner;
