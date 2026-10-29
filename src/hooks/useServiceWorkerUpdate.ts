import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

interface ServiceWorkerUpdateState {
  hasUpdate: boolean;
  isChecking: boolean;
  registration: ServiceWorkerRegistration | null;
}

const reloadOncePerSession = (key: string) => {
  if (sessionStorage.getItem(key)) return;
  sessionStorage.setItem(key, "1");
  window.location.reload();
};

export function useServiceWorkerUpdate() {
  const [state, setState] = useState<ServiceWorkerUpdateState>({
    hasUpdate: false,
    isChecking: false,
    registration: null,
  });

  const checkForUpdates = useCallback(async () => {
    if (!state.registration) return;
    
    setState(prev => ({ ...prev, isChecking: true }));
    try {
      await state.registration.update();
    } catch (error) {
      console.warn("Failed to check for updates:", error);
    } finally {
      setState(prev => ({ ...prev, isChecking: false }));
    }
  }, [state.registration]);

  const applyUpdate = useCallback(() => {
    if (!state.registration?.waiting) return;
    
    // Tell the waiting service worker to activate
    state.registration.waiting.postMessage({ type: "SKIP_WAITING" });
    
    // Reload the page to use the new version
    reloadOncePerSession("sw-update-reload");
  }, [state.registration]);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // Avoid SW in Lovable preview (stale caches can mix chunk versions and crash hooks)
    const isLovablePreviewHost =
      /^id-preview--/i.test(window.location.hostname) ||
      /\.lovableproject\.com$/i.test(window.location.hostname);
    const shouldUseServiceWorker = import.meta.env.PROD && !isLovablePreviewHost;
    if (!shouldUseServiceWorker) return;

    let registration: ServiceWorkerRegistration | null = null;

    const handleStateChange = () => {
      if (registration?.waiting) {
        setState(prev => ({ ...prev, hasUpdate: true }));
        
        // Show update toast
        toast.info("New version available!", {
          description: "Click to refresh and get the latest features.",
          duration: 0, // Don't auto-dismiss
          action: {
            label: "Update Now",
            onClick: () => {
              registration?.waiting?.postMessage({ type: "SKIP_WAITING" });
              reloadOncePerSession("sw-update-reload");
            },
          },
        });
      }
    };

    const registerSW = async () => {
      try {
        registration = await navigator.serviceWorker.getRegistration();
        
        if (!registration) {
          registration = await navigator.serviceWorker.register("/sw.js");
        }

        setState(prev => ({ ...prev, registration }));

        // Check if there's already a waiting worker
        if (registration.waiting) {
          handleStateChange();
        }

        // Listen for new service workers
        registration.addEventListener("updatefound", () => {
          const newWorker = registration?.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              handleStateChange();
            }
          });
        });

        // Handle controller change (when new SW takes over)
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          reloadOncePerSession("sw-controllerchange-reload");
        });

      } catch (error) {
        console.warn("Service Worker registration failed:", error);
      }
    };

    registerSW();
  }, []);

  return {
    ...state,
    checkForUpdates,
    applyUpdate,
  };
}

export default useServiceWorkerUpdate;