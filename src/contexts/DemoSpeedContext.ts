import { createContext, useContext } from "react";
interface DemoSpeedContextType {
  speedMultiplier: number;
  setSpeedMultiplier: (value: number) => void;
  applySpeed: (ms: number) => number;
}

export const DemoSpeedContext = createContext<DemoSpeedContextType | null>(null);

export const STORAGE_KEY = "alfred_demo_speed";
export const DEFAULT_SPEED = 1.5;

export function useDemoSpeed() {
  const context = useContext(DemoSpeedContext);
  if (!context) {
    // Fallback: no provider = normal speed
    return {
      speedMultiplier: 1,
      setSpeedMultiplier: () => {},
      applySpeed: (ms: number) => ms,
    };
  }
  return context;
}
