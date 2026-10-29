import { cn } from "@/lib/utils";

interface AmbientBackgroundProps {
  variant?: "default" | "active" | "complete";
  className?: string;
}

export function AmbientBackground({ variant = "default", className }: AmbientBackgroundProps) {
  return (
    <div className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}>
      {/* Minimal dot grid pattern only */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 0.5px, transparent 0)`,
          backgroundSize: "24px 24px",
        }}
      />
    </div>
  );
}