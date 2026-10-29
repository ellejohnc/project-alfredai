import React from "react";
import symbolWhite from "@/assets/omega/symbol-white.png.asset.json";

/**
 * Omega (Ω) symbol icon — official brand mark.
 * Rendered via CSS mask from the white transparent symbol so it inherits
 * `currentColor`, matching the ergonomics of a lucide icon.
 */
export const OmegaIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({
  className,
  style,
  ...props
}) => (
  <span
    aria-hidden="true"
    className={className as string | undefined}
    style={{
      display: "inline-block",
      backgroundColor: "currentColor",
      WebkitMaskImage: `url(${symbolWhite.url})`,
      maskImage: `url(${symbolWhite.url})`,
      WebkitMaskRepeat: "no-repeat",
      maskRepeat: "no-repeat",
      WebkitMaskPosition: "center",
      maskPosition: "center",
      WebkitMaskSize: "contain",
      maskSize: "contain",
      ...(style as React.CSSProperties | undefined),
    }}
  />
);

export default OmegaIcon;
