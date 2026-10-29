import React from "react";
import { motion } from "framer-motion";
import { SafeAnimatePresence } from "@/components/ui/safe-animate-presence";
import { RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useServiceWorkerUpdate } from "@/hooks/useServiceWorkerUpdate";

export const UpdateNotification: React.FC = () => {
  const { hasUpdate, applyUpdate } = useServiceWorkerUpdate();
  const [dismissed, setDismissed] = React.useState(false);

  if (!hasUpdate || dismissed) return null;

  return (
    <SafeAnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50"
      >
        <div className="bg-card border border-border rounded-lg shadow-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-foreground">
                Update Available
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                A new version is ready. Refresh to get the latest features and improvements.
              </p>
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  onClick={applyUpdate}
                  className="gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh Now
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setDismissed(true)}
                >
                  Later
                </Button>
              </div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="flex-shrink-0 h-8 w-8"
              onClick={() => setDismissed(true)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    </SafeAnimatePresence>
  );
};

export default UpdateNotification;