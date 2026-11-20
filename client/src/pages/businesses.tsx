import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Heart,
  Phone,
  MapPin,
  Globe,
  Mail,
  Shuffle,
  Store,
  UtensilsCrossed,
  Scissors,
  HeartPulse,
  ShoppingBag,
  Briefcase,
  Hammer,
  PartyPopper,
  type LucideIcon,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Reveal, stagger } from "@/components/motion";
import { useAuth } from "@/lib/auth-context";
import type { Business } from "@shared/schema";

type BusinessData = { businesses: Business[]; saved: string[] };

const CATEGORY_ORDER = [
  "Eat & Drink",
  "Beauty & Barber",
  "Shops & Gifts",
  "Wellness & Fitness",
  "Events & Travel",
  "Professional Services",
  "Home & Trades",
];
const CATEGORY_ICON: Record<string, LucideIcon> = {
  "Eat & Drink": UtensilsCrossed,
  "Beauty & Barber": Scissors,
  "Shops & Gifts": ShoppingBag,
  "Wellness & Fitness": HeartPulse,
  "Events & Travel": PartyPopper,
  "Professional Services": Briefcase,
  "Home & Trades": Hammer,
};
const CATEGORY_TONE: Record<string, string> = {
  "Eat & Drink": "pu-sun text-[#0B1440]",
  "Beauty & Barber": "pu-purple text-white",
  "Shops & Gifts": "pu-blue text-white",
  "Wellness & Fitness": "pu-green text-white",
  "Events & Travel": "pu-hero text-white",
  "Professional Services": "pu-night text-white",
  "Home & Trades": "pu-blue text-white",
};
// The conference is in Leesburg, so Loudoun County is "near the conference".
const NEAR_AREA = "Loudoun County";
const AREA_ORDER = ["Loudoun County", "Fairfax County", "Prince William County", "Arlington", "Alexandria"];

function placeLabel(b: Business) {
  if (b.city && b.area && b.city !== b.area) return `${b.city} · ${b.area}`;
  return b.city || b.area || "Northern Virginia";
}

function mapsUrl(b: Business) {
  if (!b.address && !b.city) return "";
  const hasCity = /,\s*VA\b/.test(b.address);
  const parts = [b.name, b.address, hasCity ? "" : b.city || b.area, hasCity ? "" : "Virginia"].filter(Boolean);
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parts.join(", "))}`;
}

function websiteLabel(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Website";
  }
}

function Chip({ active, onClick, children, testId }: { active: boolean; onClick: () => void; children: React.ReactNode; testId?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      data-testid={testId}
      className={`shrink-0 rounded-full border px-3.5 py-2 text-sm font-semibold hover-elevate active-elevate-2 ${
        active ? "pu-purple text-white border-transparent shadow-sm" : "bg-card border-input text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function BusinessCard({ b, saved, onToggle, spotlight }: { b: Business; saved: boolean; onToggle: () => void; spotlight?: boolean }) {
  const Icon = CATEGORY_ICON[b.category] ?? Store;
  const directions = mapsUrl(b);
  const linkClass =
    "inline-flex items-center gap-1.5 rounded-full border border-input bg-card px-3 py-2 text-sm font-semibold text-foreground hover-elevate active-elevate-2 max-w-full";
  return (
    <article
      className={`relative h-full rounded-2xl border bg-card p-5 ${spotlight ? "border-2 border-[#FFC933] shadow-md" : "border-card-border"}`}
      data-testid={`card-business-${b.slug}`}
    >
      {/* The wrapper holds the corner position; the button's hover style sets its own positioning. */}
      <span className="absolute right-3 top-3">
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={saved}
          aria-label={saved ? `Remove ${b.name} from saved` : `Save ${b.name}`}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full hover-elevate active-elevate-2"
          data-testid={`button-save-${b.slug}`}
        >
          <Heart className={`h-5 w-5 ${saved ? "fill-[#C2182F] text-[#C2182F]" : "text-muted-foreground"}`} />
        </button>
      </span>

      <div className="flex items-start gap-3 pr-10">
        <span className={`shrink-0 h-11 w-11 rounded-2xl flex items-center justify-center ${CATEGORY_TONE[b.category] ?? "pu-purple text-white"}`} aria-hidden="true">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h3 className="font-serif text-base font-extrabold leading-snug">{b.name}</h3>
          <p className="text-xs font-semibold text-primary mt-0.5">{b.type}</p>
          <p className="text-xs text-muted-foreground">{placeLabel(b)}</p>
        </div>
      </div>

      {b.specialty && <p className="mt-3 text-sm leading-relaxed">{b.specialty}</p>}
      {b.owner && (
        <p className="mt-2 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Owned by</span> {b.owner}
        </p>
      )}
      {b.address && (
        <p className="mt-2 text-xs text-muted-foreground">
          {b.address}
          {b.addressNote ? ` (${b.addressNote})` : ""}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {b.phone && (
          <a href={`tel:${b.phone.replace(/[^0-9+]/g, "")}`} className={linkClass} data-testid={`link-call-${b.slug}`}>
            <Phone className="h-3.5 w-3.5 shrink-0" />
            {b.phone}
          </a>
        )}
        {directions && (
          <a href={directions} target="_blank" rel="noopener noreferrer" className={linkClass} data-testid={`link-directions-${b.slug}`}>
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            Directions
          </a>
        )}
        {b.website && (
          <a href={b.website} target="_blank" rel="noopener noreferrer" className={linkClass} data-testid={`link-website-${b.slug}`}>
            <Globe className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{websiteLabel(b.website)}</span>
          </a>
        )}
        {b.email && (
          <a href={`mailto:${b.email}`} className={linkClass} data-testid={`link-email-${b.slug}`}>
            <Mail className="h-3.5 w-3.5 shrink-0" />
            Email
          </a>
        )}
      </div>
    </article>
  );
}

export default function Businesses() {
  const { authedFetch } = useAuth();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [area, setArea] = useState<string | null>(null);
  const [savedOnly, setSavedOnly] = useState(false);
  const [spotlightStep, setSpotlightStep] = useState(0);
  const [saveError, setSaveError] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery<BusinessData>({
    queryKey: ["/api/businesses"],
    queryFn: async () => {
      const res = await authedFetch("/api/businesses");
      if (!res.ok) throw new Error("Could not load the businesses.");
      return res.json();
    },
  });
  const all = data?.businesses ?? [];
  const saved = useMemo(() => new Set(data?.saved ?? []), [data?.saved]);

  async function toggleSave(slug: string) {
    const wasSaved = saved.has(slug);
    setSaveError(null);
    // Show the change at once, and put it back if the server says no.
    queryClient.setQueryData<BusinessData>(["/api/businesses"], (prev) =>
      prev ? { ...prev, saved: wasSaved ? prev.saved.filter((s) => s !== slug) : [slug, ...prev.saved] } : prev
    );
    try {
      const res = await authedFetch(`/api/businesses/${encodeURIComponent(slug)}/save`, {
        method: wasSaved ? "DELETE" : "POST",
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error();
    } catch {
      setSaveError("That could not be saved. Please try again.");
      queryClient.invalidateQueries({ queryKey: ["/api/businesses"] });
    }
  }

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const b of all) counts[b.category] = (counts[b.category] ?? 0) + 1;
    return counts;
  }, [all]);
  const areas = useMemo(() => AREA_ORDER.filter((a) => all.some((b) => b.area === a)), [all]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all
      .filter((b) => (category ? b.category === category : true))
      .filter((b) => (area ? b.area === area : true))
      .filter((b) => (savedOnly ? saved.has(b.slug) : true))
      .filter((b) =>
        q
          ? [b.name, b.type, b.category, b.specialty, b.city, b.area, b.owner].some((f) => f.toLowerCase().includes(q))
          : true
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [all, query, category, area, savedOnly, saved]);

  // One business a day, the same for everyone, with a button to see another.
  const spotlight = useMemo(() => {
    if (all.length === 0) return null;
    const day = Math.floor(Date.now() / 86_400_000);
    return all[(day * 7 + spotlightStep * 13) % all.length];
  }, [all, spotlightStep]);

  const filtering = Boolean(query.trim() || category || area || savedOnly);

  return (
    <AppShell>
      <section className="pu-hero relative overflow-hidden text-white" data-testid="section-business-hero">
        <span className="pu-aurora" aria-hidden="true" />
        <span className="pu-ring pu-float" style={{ width: 180, height: 180, borderWidth: 24, borderColor: "#FFC933", right: -80, top: -90, opacity: 0.9 }} />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-14 md:pt-10 md:pb-16">
          <p className="font-script text-2xl md:text-3xl text-[#FFD23F] -rotate-2 inline-block mb-1 pu-rise-now">Shop Black-owned</p>
          <h1 className="text-3xl md:text-4xl font-extrabold leading-tight tracking-tight pu-rise-now" style={stagger(1)}>
            Northern Virginia business directory
          </h1>
          <p className="mt-2 max-w-xl text-base text-white/90 leading-relaxed pu-rise-now" style={stagger(2)}>
            {all.length > 0 ? `${all.length} Black-owned businesses` : "Black-owned businesses"} from Leesburg to Alexandria. Eat,
            shop, book and hire close to home, and near the conference.
          </p>
        </div>
        <svg aria-hidden="true" viewBox="0 0 1440 80" preserveAspectRatio="none" className="absolute left-0 -bottom-px block w-full h-8 md:h-12">
          <path className="fill-background" d="M0,80 L1440,80 L1440,22 C1040,92 420,-18 0,58 Z" />
        </svg>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-10 space-y-8">
        {isLoading ? (
          <div className="grid sm:grid-cols-2 gap-4 pt-2" data-testid="skeleton-businesses">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-44 rounded-2xl" />
            ))}
          </div>
        ) : isError ? (
          <p className="text-sm text-destructive pt-4" role="alert">The businesses could not be loaded. Please try again.</p>
        ) : (
          <>
            {/* Spotlight */}
            {spotlight && !filtering && (
              <Reveal as="section" aria-labelledby="spotlight-heading">
                <div className="pu-rise">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <h2 id="spotlight-heading" className="text-lg font-extrabold">Today&rsquo;s spotlight</h2>
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setSpotlightStep((s) => s + 1)} data-testid="button-spotlight-next">
                      <Shuffle className="h-3.5 w-3.5" />
                      Show me another
                    </Button>
                  </div>
                  <BusinessCard b={spotlight} saved={saved.has(spotlight.slug)} onToggle={() => toggleSave(spotlight.slug)} spotlight />
                </div>
              </Reveal>
            )}

            {/* Browse by kind */}
            <section aria-labelledby="browse-heading">
              <h2 id="browse-heading" className="text-lg font-extrabold mb-3">Find a business</h2>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name, food, service or town"
                  aria-label="Search businesses"
                  className="pl-9"
                  data-testid="input-business-search"
                />
              </div>

              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Kind of business</p>
              <div className="flex flex-wrap gap-2 mb-4" role="group" aria-label="Kind of business">
                <Chip active={category === null} onClick={() => setCategory(null)} testId="chip-category-all">All</Chip>
                {CATEGORY_ORDER.filter((c) => categoryCounts[c]).map((c) => (
                  <Chip key={c} active={category === c} onClick={() => setCategory(category === c ? null : c)} testId={`chip-category-${c.split(" ")[0].toLowerCase()}`}>
                    {c} <span className="opacity-70">{categoryCounts[c]}</span>
                  </Chip>
                ))}
              </div>

              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Area</p>
              <div className="flex flex-wrap gap-2 mb-4" role="group" aria-label="Area">
                <Chip active={area === null} onClick={() => setArea(null)} testId="chip-area-all">All areas</Chip>
                {areas.map((a) => (
                  <Chip key={a} active={area === a} onClick={() => setArea(area === a ? null : a)} testId={`chip-area-${a.split(" ")[0].toLowerCase()}`}>
                    {a === NEAR_AREA ? `${a} (near the conference)` : a}
                  </Chip>
                ))}
              </div>

              <Chip active={savedOnly} onClick={() => setSavedOnly(!savedOnly)} testId="chip-saved">
                <span className="inline-flex items-center gap-1.5">
                  <Heart className={`h-3.5 w-3.5 ${savedOnly ? "fill-white" : ""}`} />
                  My saved {saved.size > 0 ? saved.size : ""}
                </span>
              </Chip>
            </section>

            {saveError && <p className="text-sm text-destructive" role="alert">{saveError}</p>}

            {/* Results */}
            <section aria-labelledby="results-heading">
              <h2 id="results-heading" className="text-sm font-semibold text-muted-foreground mb-3" aria-live="polite" data-testid="text-business-count">
                {filtered.length === 1 ? "1 business" : `${filtered.length} businesses`}
                {filtering ? " match" : ", A to Z"}
              </h2>
              {filtered.length === 0 ? (
                <div className="empty-state" data-testid="text-businesses-empty">
                  <Store className="h-10 w-10 text-muted-foreground/50 mb-3" />
                  <h3 className="text-base font-bold mb-1">{savedOnly && saved.size === 0 ? "Nothing saved yet" : "No businesses match"}</h3>
                  <p className="text-sm text-muted-foreground max-w-xs mb-4">
                    {savedOnly && saved.size === 0
                      ? "Tap the heart on any business to keep it here for later."
                      : "Try a different word, or clear the filters."}
                  </p>
                  <Button variant="outline" onClick={() => { setQuery(""); setCategory(null); setArea(null); setSavedOnly(false); }} data-testid="button-clear-filters">
                    Show all businesses
                  </Button>
                </div>
              ) : (
                <ul className="grid sm:grid-cols-2 gap-4" role="list">
                  {filtered.map((b) => (
                    <li key={b.slug} className="min-w-0">
                      <BusinessCard b={b} saved={saved.has(b.slug)} onToggle={() => toggleSave(b.slug)} />
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <p className="text-xs text-muted-foreground leading-relaxed">
              This list was put together in November 2026 from each business&rsquo;s own website, directory profiles and
              local coverage. Hours, addresses and ownership can change, so call ahead. To add a business or fix a listing, tell the conference team.
            </p>
          </>
        )}
      </div>
    </AppShell>
  );
}
