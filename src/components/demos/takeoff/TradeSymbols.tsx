import type { ComponentType, SVGProps } from "react";
import { HardHat, Layers3, Route, Zap, PaintRoller, PanelTop } from "lucide-react";
import type { TradeId } from "./takeoffData";

/** One symbol per trade — shared by the demo picker and the page cards. */
export const TRADE_ICONS: Record<TradeId, ComponentType<SVGProps<SVGSVGElement>>> = {
  gc: HardHat,
  windows: WindowSymbol,
  steel: SteelBeamSymbol,
  concrete: Layers3,
  civil: Route,
  mep: Zap,
  painting: PaintRoller,
  drywall: PanelTop,
  scaffolding: ScaffoldSymbol,
};

/**
 * Custom trade symbols for the AI Take-Off demo trade selector.
 * Drawn on the same 24x24 / stroke-2 grid as the lucide icons they sit beside,
 * inheriting currentColor so they theme like the rest of the kit.
 */

export function WindowSymbol({ strokeWidth = 2, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {/* window frame with a four-pane cross */}
      <path d="M4 3h16v16H4z" />
      <path d="M12 3v16" />
      <path d="M4 11h16" />
      {/* sill */}
      <path d="M2 22h20" />
    </svg>
  );
}

export function SteelBeamSymbol({ strokeWidth = 2, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {/* front face of the I-beam cross-section */}
      <path d="M3 7h16v3h-6v4h6v3H3v-3h6v-4H3z" />
      {/* extrusion faces — 3D depth up-right */}
      <path d="M3 7 6 4h16l-3 3" />
      <path d="M19 7V10l3-3V4" />
      <path d="M13 10v4l3-3V7" />
      <path d="M19 14v3l3-3v-3" />
      <path d="M9 10h4l3-3h-4" />
      <path d="M13 14h6l3-3h-6" />
    </svg>
  );
}

export function ScaffoldSymbol({ strokeWidth = 2, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {/* two standards, ledgers at three lifts, a deck plank overhanging the frame,
          and a diagonal brace in each lift */}
      <path d="M5 2v20" />
      <path d="M19 2v20" />
      <path d="M5 8h14" />
      <path d="M5 22h14" />
      <path d="M3 15h18" />
      <path d="M5 8 19 15" />
      <path d="M19 15 5 22" />
    </svg>
  );
}
