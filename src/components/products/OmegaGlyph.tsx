import { cn } from "@/lib/utils";
import symbolWhite from "@/assets/omega/symbol-white.png.asset.json";
import wordmarkBlack from "@/assets/omega/wordmark-black.png.asset.json";

/**
 * Omega (Ω) glyph tile — the visual identity for the Omega layer.
 * Deep navy gradient with the official white Omega symbol (transparent PNG so
 * the tile shows through).
 * Should be the ONLY dark element in any layout it appears in — that exclusivity
 * signals that Omega is the core layer. Never render as an item in a plain list of equals.
 */
export const OmegaGlyph = ({
  className,
  size = 56,
  showLabel = false,
}: {
  className?: string;
  size?: number;
  showLabel?: boolean;
}) => {
  return (
    <div className={cn("inline-flex items-center gap-3 group", className)}>
      <div
        aria-hidden="true"
        className="relative flex items-center justify-center rounded-2xl shadow-elevation-2 transition-transform duration-[900ms] ease-out group-hover:[transform:rotate(360deg)] motion-reduce:group-hover:[transform:none] cursor-pointer overflow-hidden"
        style={{
          width: size,
          height: size,
          background: "linear-gradient(135deg, #171E38 0%, #2C3766 100%)",
        }}
      >
        <img
          src={symbolWhite.url}
          alt=""
          className="pointer-events-none select-none"
          style={{ width: size * 0.72, height: size * 0.72, objectFit: "contain" }}
        />
        {/* subtle inner highlight */}
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 40%)",
          }}
        />
      </div>
      {showLabel && (
        <img
          src={wordmarkBlack.url}
          alt="Omega"
          className="dark:invert"
          style={{ height: size * 0.42, width: "auto" }}
        />
      )}
    </div>
  );
};

export default OmegaGlyph;
