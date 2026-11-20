import { useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Heart,
  Phone,
  MapPin,
  Globe,
  Mail,
  GraduationCap,
  Banknote,
  BadgeCheck,
  Handshake,
  Landmark,
  Building2,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Reveal, stagger } from "@/components/motion";
import { useAuth } from "@/lib/auth-context";
import type { Resource } from "@shared/schema";

type ResourceData = { resources: Resource[]; saved: string[] };

// "What do you need right now?" Each need maps to one category in the guide.
const NEEDS: { category: string; title: string; blurb: string; icon: LucideIcon; tone: string }[] = [
  { category: "Advising & Training", title: "Advice and training", blurb: "Free one-on-one coaching, classes and research tools", icon: GraduationCap, tone: "pu-purple text-white" },
  { category: "Funding & Loans", title: "Money to start or grow", blurb: "Microloans, small business loans and loan programs", icon: Banknote, tone: "pu-green text-white" },
  { category: "Certification & Contracting", title: "Certify and win contracts", blurb: "SWaM certification and selling to government", icon: BadgeCheck, tone: "pu-blue text-white" },
  { category: "Chambers & Networking", title: "Network and get known", blurb: "Chambers and directories, including Black chambers", icon: Handshake, tone: "pu-sun text-[#0B1440]" },
  { category: "County & City Programs", title: "Help from my county or city", blurb: "Your local economic development office", icon: Landmark, tone: "pu-hero text-white" },
  { category: "Incubators & Workspace", title: "Space to work", blurb: "Incubators and coworking", icon: Building2, tone: "pu-night text-white" },
];
const AREAS = ["Loudoun County", "Fairfax County", "Prince William County", "Arlington", "Alexandria"];
const FOCUS_ORDER = ["Women", "Black-owned", "Minority-owned", "Latino", "Veterans", "Immigrants & refugees"];

// A short list to begin with, for a woman who does not know where to start.
const FIRST_CALLS: { slug: string; why: string }[] = [
  { slug: "women-s-business-center-of-northern-virginia", why: "Free one-on-one counseling for women starting or growing a business." },
  { slug: "northern-virginia-black-chamber-of-commerce-nvbcc", why: "The regional chamber for Black-owned businesses." },
  { slug: "virginia-department-of-small-business-and-supplier-diversity", why: "Free state certification that helps you compete for government contracts." },
];

const COST_BADGE: Record<Resource["costType"], { label: string; className: string }> = {
  free: { label: "Free", className: "pu-green text-white" },
  low: { label: "Free and low-cost", className: "pu-green text-white" },
  membership: { label: "Membership", className: "pu-blue text-white" },
  loan: { label: "Loans", className: "pu-sun text-[#0B1440]" },
  fee: { label: "Fee-based", className: "pu-night text-white" },
};

function mapsUrl(r: Resource) {
  if (!r.address) return "";
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${r.name}, ${r.address}`)}`;
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

function ResourceCard({ r, saved, onToggle, local, why }: { r: Resource; saved: boolean; onToggle: () => void; local?: boolean; why?: string }) {
  const badge = COST_BADGE[r.costType] ?? COST_BADGE.free;
  const directions = mapsUrl(r);
  const linkClass =
    "inline-flex items-center gap-1.5 rounded-full border border-input bg-card px-3 py-2 text-sm font-semibold text-foreground hover-elevate active-elevate-2 max-w-full";
  return (
    <article className={`relative h-full rounded-2xl border bg-card p-5 ${why ? "border-2 border-[#FFC933]" : "border-card-border"}`} data-testid={`card-resource-${r.slug}`}>
      <span className="absolute right-3 top-3">
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={saved}
          aria-label={saved ? `Remove ${r.name} from saved` : `Save ${r.name}`}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full hover-elevate active-elevate-2"
          data-testid={`button-save-resource-${r.slug}`}
        >
          <Heart className={`h-5 w-5 ${saved ? "fill-[#C2182F] text-[#C2182F]" : "text-muted-foreground"}`} />
        </button>
      </span>

      <div className="pr-10">
        <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide ${badge.className}`}>{badge.label}</span>
          {local && (
            <span className="rounded-full border border-primary/40 bg-primary/5 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-primary">
              In your area
            </span>
          )}
          {r.tags.map((t) => (
            <span key={t} className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-bold text-secondary-foreground">
              {t}
            </span>
          ))}
        </div>
        <h3 className="font-serif text-base font-extrabold leading-snug">{r.name}</h3>
        <p className="text-xs font-semibold text-primary mt-0.5">{r.category}</p>
      </div>

      {why && <p className="mt-3 text-sm font-semibold">{why}</p>}
      <p className="mt-3 text-sm leading-relaxed">{r.offer}</p>

      <dl className="mt-3 space-y-1.5 text-xs text-muted-foreground">
        <div>
          <dt className="inline font-semibold text-foreground">Who it&rsquo;s for: </dt>
          <dd className="inline">{r.who}</dd>
        </div>
        <div>
          <dt className="inline font-semibold text-foreground">Cost: </dt>
          <dd className="inline">{r.cost}</dd>
        </div>
        <div>
          <dt className="inline font-semibold text-foreground">Serves: </dt>
          <dd className="inline">{r.serviceArea}</dd>
        </div>
        {r.address && (
          <div>
            <dt className="inline font-semibold text-foreground">Office: </dt>
            <dd className="inline">{r.address}</dd>
          </div>
        )}
      </dl>

      <div className="mt-4 flex flex-wrap gap-2">
        {r.website && (
          <a href={r.website} target="_blank" rel="noopener noreferrer" className={linkClass} data-testid={`link-resource-website-${r.slug}`}>
            <Globe className="h-3.5 w-3.5 shrink-0" />
            Website
          </a>
        )}
        {r.phone && (
          <a href={`tel:${r.phone.replace(/[^0-9+]/g, "")}`} className={linkClass}>
            <Phone className="h-3.5 w-3.5 shrink-0" />
            {r.phone}
          </a>
        )}
        {r.email && (
          <a href={`mailto:${r.email}`} className={linkClass}>
            <Mail className="h-3.5 w-3.5 shrink-0" />
            Email
          </a>
        )}
        {directions && (
          <a href={directions} target="_blank" rel="noopener noreferrer" className={linkClass}>
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            Directions
          </a>
        )}
      </div>
    </article>
  );
}

export default function Resources() {
  const { authedFetch } = useAuth();
  const queryClient = useQueryClient();
  const [need, setNeed] = useState<string | null>(null);
  const [area, setArea] = useState<string | null>(null);
  const [focus, setFocus] = useState<string | null>(null);
  const [freeOnly, setFreeOnly] = useState(false);
  const [savedOnly, setSavedOnly] = useState(false);
  const [query, setQuery] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);

  const { data, isLoading, isError } = useQuery<ResourceData>({
    queryKey: ["/api/resources"],
    queryFn: async () => {
      const res = await authedFetch("/api/resources");
      if (!res.ok) throw new Error("Could not load the resource guide.");
      return res.json();
    },
  });
  const all = data?.resources ?? [];
  const saved = useMemo(() => new Set(data?.saved ?? []), [data?.saved]);

  async function toggleSave(slug: string) {
    const wasSaved = saved.has(slug);
    setSaveError(null);
    queryClient.setQueryData<ResourceData>(["/api/resources"], (prev) =>
      prev ? { ...prev, saved: wasSaved ? prev.saved.filter((s) => s !== slug) : [slug, ...prev.saved] } : prev
    );
    try {
      const res = await authedFetch(`/api/resources/${encodeURIComponent(slug)}/save`, {
        method: wasSaved ? "DELETE" : "POST",
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error();
    } catch {
      setSaveError("That could not be saved. Please try again.");
      queryClient.invalidateQueries({ queryKey: ["/api/resources"] });
    }
  }

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const r of all) c[r.category] = (c[r.category] ?? 0) + 1;
    return c;
  }, [all]);
  const focusOptions = useMemo(() => FOCUS_ORDER.filter((f) => all.some((r) => r.tags.includes(f))), [all]);

  // A regional or statewide resource (no specific areas) serves every area.
  const servesArea = (r: Resource, a: string) => r.areas.length === 0 || r.areas.includes(a);
  const isLocal = (r: Resource) => Boolean(area && r.areas.includes(area));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all
      .filter((r) => (need ? r.category === need : true))
      .filter((r) => (area ? servesArea(r, area) : true))
      .filter((r) => (focus ? r.tags.includes(focus) : true))
      .filter((r) => (freeOnly ? r.costType === "free" || r.costType === "low" : true))
      .filter((r) => (savedOnly ? saved.has(r.slug) : true))
      .filter((r) => (q ? [r.name, r.category, r.offer, r.who, r.serviceArea, r.tags.join(" ")].some((f) => f.toLowerCase().includes(q)) : true))
      .sort((a, b) => Number(isLocal(b)) - Number(isLocal(a)) || a.name.localeCompare(b.name));
  }, [all, need, area, focus, freeOnly, savedOnly, saved, query]);

  const filtering = Boolean(need || area || focus || freeOnly || savedOnly || query.trim());
  const firstCalls = FIRST_CALLS.map((f) => ({ ...f, r: all.find((r) => r.slug.startsWith(f.slug)) })).filter(
    (f): f is { slug: string; why: string; r: Resource } => Boolean(f.r)
  );

  function clearAll() {
    setNeed(null);
    setArea(null);
    setFocus(null);
    setFreeOnly(false);
    setSavedOnly(false);
    setQuery("");
  }

  function pickNeed(category: string) {
    const next = need === category ? null : category;
    setNeed(next);
    if (next) setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  // With no need picked, results are grouped under each need's heading.
  const groups = need
    ? [{ title: "", items: filtered }]
    : NEEDS.map((n) => ({ title: n.title, items: filtered.filter((r) => r.category === n.category) })).filter((g) => g.items.length > 0);

  return (
    <AppShell>
      <section className="pu-night relative overflow-hidden text-white" data-testid="section-resources-hero">
        <span className="pu-aurora" aria-hidden="true" />
        <span className="pu-ring pu-float" style={{ width: 180, height: 180, borderWidth: 24, borderColor: "#FFC933", right: -80, top: -90, opacity: 0.9 }} />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-14 md:pt-10 md:pb-16">
          <p className="font-script text-2xl md:text-3xl text-[#FFD23F] -rotate-2 inline-block mb-1 pu-rise-now">For business owners</p>
          <h1 className="text-3xl md:text-4xl font-extrabold leading-tight tracking-tight pu-rise-now" style={stagger(1)}>
            Business resource guide
          </h1>
          <p className="mt-2 max-w-xl text-base text-white/90 leading-relaxed pu-rise-now" style={stagger(2)}>
            {all.length > 0 ? `${all.length} places` : "Places"} in Northern Virginia that help you start, fund and grow a business. Many
            cost nothing. Tell us what you need and we&rsquo;ll point you to the right door.
          </p>
        </div>
        <svg aria-hidden="true" viewBox="0 0 1440 80" preserveAspectRatio="none" className="absolute left-0 -bottom-px block w-full h-8 md:h-12">
          <path className="fill-background" d="M0,80 L1440,80 L1440,22 C1040,92 420,-18 0,58 Z" />
        </svg>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-10 space-y-8">
        {isLoading ? (
          <div className="grid sm:grid-cols-2 gap-4" data-testid="skeleton-resources">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-40 rounded-2xl" />
            ))}
          </div>
        ) : isError ? (
          <p className="text-sm text-destructive" role="alert">The resource guide could not be loaded. Please try again.</p>
        ) : (
          <>
            {/* Step 1: the need */}
            <Reveal as="section" aria-labelledby="need-heading">
              <h2 id="need-heading" className="text-lg font-extrabold mb-1 pu-rise">What do you need right now?</h2>
              <p className="text-sm text-muted-foreground mb-3 pu-rise">Pick one to see who can help. Tap it again to clear.</p>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {NEEDS.filter((n) => counts[n.category]).map((n, i) => {
                  const active = need === n.category;
                  return (
                    <button
                      key={n.category}
                      type="button"
                      onClick={() => pickNeed(n.category)}
                      aria-pressed={active}
                      style={stagger(i)}
                      className={`pu-rise text-left rounded-2xl p-4 min-h-[128px] flex flex-col shadow-md hover-elevate active-elevate-2 ${n.tone} ${
                        active ? "ring-4 ring-[#FFC933] ring-offset-2 ring-offset-background" : need ? "opacity-70" : ""
                      }`}
                      data-testid={`need-${n.category.split(" ")[0].toLowerCase()}`}
                    >
                      <n.icon className="h-6 w-6 mb-2 shrink-0" />
                      <span className="block text-base font-extrabold leading-tight">{n.title}</span>
                      <span className="block text-xs mt-1 opacity-90 leading-snug">{n.blurb}</span>
                      <span className="mt-auto pt-2 text-xs font-bold opacity-90">
                        {counts[n.category]} {counts[n.category] === 1 ? "place" : "places"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </Reveal>

            {/* Step 2: narrow it */}
            <section aria-labelledby="narrow-heading">
              <h2 id="narrow-heading" className="text-lg font-extrabold mb-3">Narrow it down</h2>

              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Where is your business?</p>
              <div className="flex flex-wrap gap-2 mb-4" role="group" aria-label="Where is your business">
                <Chip active={area === null} onClick={() => setArea(null)} testId="res-area-all">Anywhere in Northern Virginia</Chip>
                {AREAS.map((a) => (
                  <Chip key={a} active={area === a} onClick={() => setArea(area === a ? null : a)} testId={`res-area-${a.split(" ")[0].toLowerCase()}`}>
                    {a}
                  </Chip>
                ))}
              </div>

              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Made for</p>
              <div className="flex flex-wrap gap-2 mb-4" role="group" aria-label="Made for">
                <Chip active={focus === null} onClick={() => setFocus(null)} testId="res-focus-all">Everyone</Chip>
                {focusOptions.map((f) => (
                  <Chip key={f} active={focus === f} onClick={() => setFocus(focus === f ? null : f)} testId={`res-focus-${f.split(/[ -]/)[0].toLowerCase()}`}>
                    {f}
                  </Chip>
                ))}
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <Chip active={freeOnly} onClick={() => setFreeOnly(!freeOnly)} testId="res-free">Free or low-cost only</Chip>
                <Chip active={savedOnly} onClick={() => setSavedOnly(!savedOnly)} testId="res-saved">
                  <span className="inline-flex items-center gap-1.5">
                    <Heart className={`h-3.5 w-3.5 ${savedOnly ? "fill-white" : ""}`} />
                    My saved {saved.size > 0 ? saved.size : ""}
                  </span>
                </Chip>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search, for example loan, certification or mentoring"
                  aria-label="Search the resource guide"
                  className="pl-9"
                  data-testid="input-resource-search"
                />
              </div>
            </section>

            {saveError && <p className="text-sm text-destructive" role="alert">{saveError}</p>}

            {/* Good first calls, until she starts filtering */}
            {!filtering && firstCalls.length > 0 && (
              <Reveal as="section" aria-labelledby="first-heading">
                <h2 id="first-heading" className="text-lg font-extrabold mb-1 flex items-center gap-2 pu-rise">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Not sure where to start?
                </h2>
                <p className="text-sm text-muted-foreground mb-3 pu-rise">Three good first calls for a woman building a business here.</p>
                <ul className="grid lg:grid-cols-3 gap-4" role="list">
                  {firstCalls.map((f, i) => (
                    <li key={f.r.slug} className="min-w-0 pu-rise" style={stagger(i + 1)}>
                      <ResourceCard r={f.r} saved={saved.has(f.r.slug)} onToggle={() => toggleSave(f.r.slug)} why={f.why} />
                    </li>
                  ))}
                </ul>
              </Reveal>
            )}

            {/* Results */}
            <div ref={resultsRef} className="scroll-mt-20">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <h2 className="text-sm font-semibold text-muted-foreground" aria-live="polite" data-testid="text-resource-count">
                  {filtered.length === 1 ? "1 place" : `${filtered.length} places`}
                  {filtering ? " can help" : " in the guide"}
                </h2>
                {filtering && (
                  <Button size="sm" variant="outline" onClick={clearAll} data-testid="button-resource-clear">
                    Clear choices
                  </Button>
                )}
              </div>

              {filtered.length === 0 ? (
                <div className="empty-state" data-testid="text-resources-empty">
                  <Search className="h-10 w-10 text-muted-foreground/50 mb-3" />
                  <h3 className="text-base font-bold mb-1">{savedOnly && saved.size === 0 ? "Nothing saved yet" : "Nothing matches those choices"}</h3>
                  <p className="text-sm text-muted-foreground max-w-xs mb-4">
                    {savedOnly && saved.size === 0 ? "Tap the heart on any resource to keep it here." : "Try removing one of your choices."}
                  </p>
                  <Button variant="outline" onClick={clearAll}>Show the whole guide</Button>
                </div>
              ) : (
                <div className="space-y-8">
                  {groups.map((g) => (
                    <section key={g.title || "results"} aria-label={g.title || "Results"}>
                      {g.title && (
                        <h3 className="text-base font-extrabold mb-3">
                          {g.title} <span className="text-muted-foreground font-semibold">({g.items.length})</span>
                        </h3>
                      )}
                      <ul className="grid sm:grid-cols-2 gap-4" role="list">
                        {g.items.map((r) => (
                          <li key={r.slug} className="min-w-0">
                            <ResourceCard r={r} saved={saved.has(r.slug)} onToggle={() => toggleSave(r.slug)} local={isLocal(r)} />
                          </li>
                        ))}
                      </ul>
                    </section>
                  ))}
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              This guide was put together in November 2026 from each organization&rsquo;s own published information. Programs, fees and
              contacts change, so confirm the details with the organization. Loans cost money: compare the terms before you borrow.
              This is a list of places to ask, not financial or legal advice.
            </p>
          </>
        )}
      </div>
    </AppShell>
  );
}
