import React from "react";
import axiomIcon from "@/assets/axiom-engine-icon.png.asset.json";

/**
 * Axiom V6 engine icon.
 * Renders the uploaded engine image with transparent background.
 */
export const Engine6: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <img
    src={axiomIcon.url}
    alt="Axiom"
    className={props.className}
    style={{
      width: props.width,
      height: props.height,
      ...props.style,
    }}
  />
);
