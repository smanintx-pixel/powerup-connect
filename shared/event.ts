// Facts about the conference that both the screens and the server use.
// Keep this file free of database imports so the browser bundle stays small.

/** Every Power Up Women's Conference so far, oldest first. */
export const CONFERENCE_YEARS = [
  2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026,
] as const;

/** What an attendee is here for. Shown on her profile and used to filter the directory. */
export const INTEREST_OPTIONS = [
  "Networking",
  "Employment",
  "Business Opportunities",
  "Community Engagement",
  "Social",
] as const;
export type Interest = (typeof INTEREST_OPTIONS)[number];

export type LoyaltyBadge = { key: "legend" | "all-star"; label: string } | null;

/** 4 or more past conferences: Power Legend. 2 or 3: Power Up All-Star. */
export function loyaltyBadge(pastYears: readonly number[] | undefined | null): LoyaltyBadge {
  const count = new Set(pastYears ?? []).size;
  if (count >= 4) return { key: "legend", label: "Power Legend" };
  if (count >= 2) return { key: "all-star", label: "Power Up All-Star" };
  return null;
}

/** Largest profile photo the server accepts, after the browser has resized it. */
export const MAX_PHOTO_BYTES = 150_000;
