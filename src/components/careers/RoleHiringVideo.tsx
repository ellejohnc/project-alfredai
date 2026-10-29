import { Play } from "lucide-react";
import videoAsset from "@/assets/careers/au-cto-hiring-video.mp4.asset.json";
import posterAsset from "@/assets/careers/au-cto-hiring-video-poster.jpg.asset.json";

/** Role slugs that show the hiring video inside their expanded listing. */
export const ROLE_HIRING_VIDEO_SLUGS: string[] = ["senior-full-stack-ai-engineer"];

export function roleHasHiringVideo(slug: string | null): boolean {
  return !!slug && ROLE_HIRING_VIDEO_SLUGS.includes(slug);
}

/**
 * Portrait hiring video for a specific role. The 174MB source only streams
 * once the visitor presses play (preload="none" + poster frame).
 */
export const RoleHiringVideo = () => (
  <div className="md:col-span-1">
    <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
      <span className="w-1.5 h-1.5 rounded-full bg-partner-pink" />
      From our CEO
    </div>
    <video
      controls
      playsInline
      preload="none"
      poster={posterAsset.url}
      src={videoAsset.url}
      className="w-full max-w-[280px] md:max-w-none mx-auto aspect-[9/16] rounded-xl border border-border bg-muted object-cover"
      aria-label="Video about the Senior Full-Stack AI Engineer role at alfred ai"
    >
      <track kind="captions" />
      Your browser does not support embedded video. Watch it at{" "}
      <a href={videoAsset.url}>this link</a>.
    </video>
    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
      <Play className="w-3 h-3" />
      Two and a half minutes on who we are and how this role works.
    </p>
  </div>
);
