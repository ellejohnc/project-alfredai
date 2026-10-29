import { useState, useCallback, type ReactNode } from "react";
import { DemoSpeedContext, DEFAULT_SPEED, STORAGE_KEY } from "./DemoSpeedContext";

function getStoredSpeed(): number {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const val = parseFloat(stored);
      if (!isNaN(val) && val >= 0.5 && val <= 3) return val;
    }
  } catch {
    // Storage unreadable — the default speed applies.
  }
  return DEFAULT_SPEED;
}

export function DemoSpeedProvider({ children }: { children: ReactNode }) {
  const [speedMultiplier, setSpeedMultiplierState] = useState(getStoredSpeed);

  const setSpeedMultiplier = useCallback((value: number) => {
    const clamped = Math.max(0.5, Math.min(3, value));
    setSpeedMultiplierState(clamped);
    try {
      localStorage.setItem(STORAGE_KEY, String(clamped));
    } catch {
      // Storage full or blocked. The speed still applies for this session.
    }
  }, []);

  const applySpeed = useCallback((ms: number) => {
    return ms * speedMultiplier;
  }, [speedMultiplier]);

  return (
    <DemoSpeedContext.Provider value={{ speedMultiplier, setSpeedMultiplier, applySpeed }}>
      {children}
    </DemoSpeedContext.Provider>
  );
}
