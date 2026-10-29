import strathImg from "@/assets/hero-strath.jpg.asset.json";
import barImg from "@/assets/hero-bar.jpg.asset.json";
import sgImg from "@/assets/hero-sg.jpg.asset.json";
import ldnImg from "@/assets/hero-ldn.jpg.asset.json";
import bucImg from "@/assets/hero-buc.jpg.asset.json";

// Photos: Wikimedia Commons (CC BY / CC BY-SA). North Strathfield Arnotts,
// International Towers Barangaroo, Marina Bay Singapore, London skyline (Diliff),
// Palace of the Parliament Bucharest.
/**
 * Hero background slideshow — location slots.
 *
 * Each slide is one of the firm's locations. A photo is added by setting
 * `image` to a URL (an uploaded Lovable asset URL works well). An empty
 * `image` is skipped gracefully — the hero simply keeps its aurora
 * background until every photo has been provided.
 */
export interface HeroLocationSlide {
  id: string;
  /** Photo URL. Empty string until a photo is provided — the slide is then skipped. */
  image: string;
  city: string;
  /** Named building or workspace, shown in the caption when set. */
  venue?: string;
  country: string;
}

export const HERO_SLIDE_DURATION_MS = 7000;

export const HERO_LOCATION_SLIDES: HeroLocationSlide[] = [
  {
    id: "wotso-north-strathfield",
    image: strathImg.url,
    city: "Sydney",
    venue: "Wotso, North Strathfield",
    country: "Australia",
  },
  {
    id: "tower-one-barangaroo",
    image: barImg.url,
    city: "Sydney",
    venue: "Tower One, Barangaroo",
    country: "Australia",
  },
  {
    id: "singapore",
    image: sgImg.url,
    city: "Singapore",
    country: "Singapore",
  },
  {
    id: "london",
    image: ldnImg.url,
    city: "London",
    country: "United Kingdom",
  },
  {
    id: "bucharest",
    image: bucImg.url,
    city: "Bucharest",
    country: "Romania",
  },
];

/** Slides that actually carry a photo, in display order. */
export const slidesWithImages = (): HeroLocationSlide[] =>
  HERO_LOCATION_SLIDES.filter((s) => typeof s.image === "string" && s.image.trim() !== "");

/** Human-readable caption for a slide, e.g. "Tower One, Barangaroo · Sydney, Australia". */
export const slideCaption = (slide: HeroLocationSlide): string =>
  slide.venue ? `${slide.venue} · ${slide.city}, ${slide.country}` : `${slide.city}, ${slide.country}`;
