import { useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface WebVitalsMetric {
  name: string;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  delta: number;
  id: string;
}

// Web Vitals thresholds
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 }, // Largest Contentful Paint
  FID: { good: 100, poor: 300 },   // First Input Delay
  CLS: { good: 0.1, poor: 0.25 },  // Cumulative Layout Shift
  FCP: { good: 1800, poor: 3000 }, // First Contentful Paint
  TTFB: { good: 800, poor: 1800 }, // Time to First Byte
  INP: { good: 200, poor: 500 },   // Interaction to Next Paint
};

function getRating(name: string, value: number): "good" | "needs-improvement" | "poor" {
  const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS];
  if (!threshold) return "good";
  
  if (value <= threshold.good) return "good";
  if (value <= threshold.poor) return "needs-improvement";
  return "poor";
}

function getDeviceType(): string {
  const width = window.innerWidth;
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

function getConnectionType(): string {
  const connection = (navigator as any).connection;
  if (!connection) return "unknown";
  return connection.effectiveType || "unknown";
}

function getVisitorId(): string {
  let visitorId = localStorage.getItem("visitor_id");
  if (!visitorId) {
    visitorId = crypto.randomUUID();
    localStorage.setItem("visitor_id", visitorId);
  }
  return visitorId;
}

export function useWebVitals(enabled = true) {
  const sendMetric = useCallback(async (metric: WebVitalsMetric) => {
    if (!enabled) return;
    
    try {
      await supabase.from("performance_metrics").insert({
        page_url: window.location.pathname,
        metric_name: metric.name,
        metric_value: metric.value,
        rating: metric.rating,
        visitor_id: getVisitorId(),
        device_type: getDeviceType(),
        connection_type: getConnectionType(),
        user_agent: navigator.userAgent.substring(0, 200),
      });
    } catch (error) {
      // Silently fail - don't impact user experience
      console.debug("Failed to send metric:", error);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    // Measure TTFB
    const measureTTFB = () => {
      const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
      if (navigation) {
        const ttfb = navigation.responseStart - navigation.requestStart;
        sendMetric({
          name: "TTFB",
          value: ttfb,
          rating: getRating("TTFB", ttfb),
          delta: ttfb,
          id: `ttfb-${Date.now()}`,
        });
      }
    };

    // Measure FCP
    const measureFCP = () => {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === "first-contentful-paint") {
            const fcp = entry.startTime;
            sendMetric({
              name: "FCP",
              value: fcp,
              rating: getRating("FCP", fcp),
              delta: fcp,
              id: `fcp-${Date.now()}`,
            });
            observer.disconnect();
          }
        }
      });
      
      try {
        observer.observe({ type: "paint", buffered: true });
      } catch (e) {
        // Browser doesn't support this
      }
    };

    // Measure LCP
    const measureLCP = () => {
      let lcpValue = 0;
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        lcpValue = lastEntry.startTime;
      });

      try {
        observer.observe({ type: "largest-contentful-paint", buffered: true });
        
        // Report LCP on page hide or after 10 seconds
        const reportLCP = () => {
          if (lcpValue > 0) {
            sendMetric({
              name: "LCP",
              value: lcpValue,
              rating: getRating("LCP", lcpValue),
              delta: lcpValue,
              id: `lcp-${Date.now()}`,
            });
          }
          observer.disconnect();
        };

        window.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "hidden") {
            reportLCP();
          }
        }, { once: true });

        setTimeout(reportLCP, 10000);
      } catch (e) {
        // Browser doesn't support this
      }
    };

    // Measure CLS
    const measureCLS = () => {
      let clsValue = 0;
      let sessionValue = 0;
      let sessionEntries: PerformanceEntry[] = [];

      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const layoutShiftEntry = entry as any;
          if (!layoutShiftEntry.hadRecentInput) {
            const firstSessionEntry = sessionEntries[0];
            const lastSessionEntry = sessionEntries[sessionEntries.length - 1];

            if (
              sessionValue &&
              entry.startTime - (lastSessionEntry?.startTime || 0) < 1000 &&
              entry.startTime - (firstSessionEntry?.startTime || 0) < 5000
            ) {
              sessionValue += layoutShiftEntry.value;
              sessionEntries.push(entry);
            } else {
              sessionValue = layoutShiftEntry.value;
              sessionEntries = [entry];
            }

            if (sessionValue > clsValue) {
              clsValue = sessionValue;
            }
          }
        }
      });

      try {
        observer.observe({ type: "layout-shift", buffered: true });

        const reportCLS = () => {
          if (clsValue > 0) {
            sendMetric({
              name: "CLS",
              value: clsValue,
              rating: getRating("CLS", clsValue),
              delta: clsValue,
              id: `cls-${Date.now()}`,
            });
          }
          observer.disconnect();
        };

        window.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "hidden") {
            reportCLS();
          }
        }, { once: true });
      } catch (e) {
        // Browser doesn't support this
      }
    };

    // Run measurements
    if (document.readyState === "complete") {
      measureTTFB();
      measureFCP();
      measureLCP();
      measureCLS();
    } else {
      window.addEventListener("load", () => {
        measureTTFB();
        measureFCP();
        measureLCP();
        measureCLS();
      });
    }
  }, [enabled, sendMetric]);
}

export default useWebVitals;