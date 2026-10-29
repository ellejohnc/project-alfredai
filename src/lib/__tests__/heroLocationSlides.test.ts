import { describe, it, expect } from "vitest";
import { HERO_LOCATION_SLIDES, slidesWithImages, slideCaption } from "@/data/heroLocationSlides";

describe("hero location slideshow", () => {
  it("has exactly the five locations the hero must show", () => {
    expect(HERO_LOCATION_SLIDES.map((s) => s.id)).toEqual([
      "wotso-north-strathfield",
      "tower-one-barangaroo",
      "singapore",
      "london",
      "bucharest",
    ]);
  });

  it("labels the two Sydney offices by venue", () => {
    const wotso = HERO_LOCATION_SLIDES.find((s) => s.id === "wotso-north-strathfield");
    const towerOne = HERO_LOCATION_SLIDES.find((s) => s.id === "tower-one-barangaroo");
    expect(wotso?.venue).toBe("Wotso, North Strathfield");
    expect(towerOne?.venue).toBe("Tower One, Barangaroo");
  });

  it("shows Bucharest for Romania", () => {
    const bucharest = HERO_LOCATION_SLIDES.find((s) => s.id === "bucharest");
    expect(bucharest?.city).toBe("Bucharest");
    expect(bucharest?.country).toBe("Romania");
  });

  it("skips slides without a photo and captions the rest", () => {
    // Whatever photos are present, slidesWithImages must never return an empty one.
    for (const slide of slidesWithImages()) {
      expect(slide.image.trim()).not.toBe("");
    }

    const withPhoto = [
      { ...HERO_LOCATION_SLIDES[0], image: "https://example.com/wotso.jpg" },
      { ...HERO_LOCATION_SLIDES[3] }, // London, no venue — city/country only
    ];
    expect(slideCaption(withPhoto[0])).toBe("Wotso, North Strathfield · Sydney, Australia");
    expect(slideCaption(withPhoto[1])).toBe("London, United Kingdom");
  });
});
