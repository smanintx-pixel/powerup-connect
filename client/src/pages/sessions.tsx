import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { BrandRings } from "@/components/brand-rings";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import type { SessionWithMaterials, SessionMaterial } from "@shared/schema";
import { PlayCircle, Clock, FileText, Presentation, BookOpen, Link2, ExternalLink, UserRound } from "lucide-react";

type Filter = "all" | "recordings" | "materials";

// Only ever link to web addresses. Anything else in the data is ignored.
function safeUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}

function youTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    let id: string | null = null;
    if (host === "youtu.be") id = u.pathname.slice(1);
    else if (host === "youtube.com" || host === "m.youtube.com") {
      if (u.pathname === "/watch") id = u.searchParams.get("v");
      else if (u.pathname.startsWith("/embed/") || u.pathname.startsWith("/shorts/") || u.pathname.startsWith("/live/")) id = u.pathname.split("/")[2];
    }
    return id && /^[A-Za-z0-9_-]{6,20}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

const KIND: Record<string, { label: string; icon: typeof FileText }> = {
  slides: { label: "Presentation", icon: Presentation },
  handout: { label: "Handout", icon: FileText },
  guide: { label: "Guide", icon: BookOpen },
  link: { label: "Link", icon: Link2 },
};

function Recording({ session }: { session: SessionWithMaterials }) {
  const [open, setOpen] = useState(false);
  const url = safeUrl(session.recordingUrl);
  if (!url) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted rounded-full px-2.5 py-1.5" data-testid={`text-recording-pending-${session.id}`}>
        <Clock className="h-3 w-3" />
        Recording will be posted after the conference
      </span>
    );
  }
  const yt = youTubeId(url);
  if (yt && open) {
    return (
      <div className="rounded-xl overflow-hidden bg-black aspect-video" data-testid={`player-${session.id}`}>
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${yt}?autoplay=1&rel=0`}
          title={`Recording: ${session.title}`}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          className="w-full h-full border-0"
        />
      </div>
    );
  }
  if (yt) {
    return (
      <Button type="button" variant="gold" size="sm" onClick={() => setOpen(true)} data-testid={`button-watch-${session.id}`}>
        <PlayCircle className="h-4 w-4" />
        Watch the recording
      </Button>
    );
  }
  return (
    <Button asChild variant="gold" size="sm">
      <a href={url} target="_blank" rel="noopener noreferrer" data-testid={`link-watch-${session.id}`}>
        <PlayCircle className="h-4 w-4" />
        Watch the recording
        <ExternalLink className="h-3.5 w-3.5" />
        <span className="sr-only">(opens in a new tab)</span>
      </a>
    </Button>
  );
}

function Material({ material }: { material: SessionMaterial }) {
  const url = safeUrl(material.url);
  if (!url) return null;
  const kind = KIND[material.kind] ?? KIND.link;
  return (
    <li>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 rounded-xl border border-card-border bg-background px-3.5 py-3 hover-elevate active-elevate-2"
        data-testid={`link-material-${material.id}`}
      >
        <kind.icon className="h-4 w-4 shrink-0 text-primary" />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold truncate">{material.title}</span>
          <span className="block text-xs text-muted-foreground">{kind.label}</span>
        </span>
        <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="sr-only">(opens in a new tab)</span>
      </a>
    </li>
  );
}

export default function Sessions() {
  const { authedFetch } = useAuth();
  const [filter, setFilter] = useState<Filter>("all");

  const { data, isLoading, isError } = useQuery<{ sessions: SessionWithMaterials[] }>({
    queryKey: ["/api/sessions"],
    queryFn: async () => {
      const res = await authedFetch("/api/sessions");
      if (!res.ok) throw new Error("Could not load the sessions.");
      return res.json();
    },
  });

  const sessions = data?.sessions ?? [];
  const hasRecording = (s: SessionWithMaterials) => Boolean(safeUrl(s.recordingUrl));
  const hasMaterials = (s: SessionWithMaterials) => s.materials.some((m) => safeUrl(m.url));
  const shown = useMemo(() => {
    if (filter === "recordings") return sessions.filter(hasRecording);
    if (filter === "materials") return sessions.filter(hasMaterials);
    return sessions;
  }, [sessions, filter]);

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: `All sessions${sessions.length ? ` (${sessions.length})` : ""}` },
    { key: "recordings", label: `Recordings (${sessions.filter(hasRecording).length})` },
    { key: "materials", label: `Materials (${sessions.filter(hasMaterials).length})` },
  ];

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 md:py-10">
        <h1 className="text-2xl font-extrabold mb-1">Sessions</h1>
        <p className="text-sm text-muted-foreground mb-5">
          Every session in one place, with its recording and any presentations, handouts or
          guides that go with it.
        </p>

        <div role="group" aria-label="Filter sessions" className="flex flex-wrap gap-2 mb-6">
          {filters.map((f) => {
            const on = filter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                aria-pressed={on}
                onClick={() => setFilter(f.key)}
                data-testid={`filter-sessions-${f.key}`}
                className={`rounded-full border px-3.5 min-h-[40px] text-sm font-semibold hover-elevate active-elevate-2 ${
                  on ? "pu-purple text-white border-transparent shadow-sm" : "border-border bg-card"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <div className="space-y-3" data-testid="skeleton-sessions">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-card-border bg-card p-5 space-y-2">
                <div className="skeleton skeleton-text" style={{ width: "60%" }} />
                <div className="skeleton skeleton-text" style={{ width: "85%" }} />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="empty-state" role="alert" data-testid="text-sessions-error">
            <h3 className="text-base font-bold mb-1">The sessions could not be loaded</h3>
            <p className="text-sm text-muted-foreground max-w-xs">Check your connection and try again.</p>
          </div>
        ) : shown.length === 0 ? (
          <div className="pu-shape-0 pu-night text-white p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left shadow-lg" data-testid="text-sessions-empty">
            <BrandRings className="w-32 shrink-0" />
            <div>
              <h2 className="text-base font-bold mb-1">
                {filter === "recordings"
                  ? "No recordings yet"
                  : filter === "materials"
                    ? "No materials yet"
                    : "The session list is on its way"}
              </h2>
              <p className="text-sm text-[#DCE2FF]">
                {filter === "recordings"
                  ? "Recordings are posted here after the conference."
                  : filter === "materials"
                    ? "Presentations, handouts and guides appear here as speakers share them."
                    : "Sessions will appear here as the program is confirmed."}
              </p>
            </div>
          </div>
        ) : (
          <ul className="space-y-4" role="list">
            {shown.map((session, i) => {
              const materials = session.materials.filter((m) => safeUrl(m.url));
              return (
                <li
                  key={session.id}
                  className={`pu-shape-${i % 4} border border-card-border bg-card p-5 sm:p-6`}
                  data-testid={`card-session-${session.id}`}
                >
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2">
                    {session.track && (
                      <span className="rounded-full pu-purple text-white text-[11px] font-extrabold uppercase tracking-wide px-2.5 py-1">
                        {session.track}
                      </span>
                    )}
                    {session.timeLabel && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {session.timeLabel}
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-extrabold leading-snug" data-testid={`text-session-title-${session.id}`}>
                    {session.title}
                  </h2>
                  {session.presenter && (
                    <p className="mt-1 text-sm text-muted-foreground flex items-start gap-1.5">
                      <UserRound className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>{session.presenter}</span>
                    </p>
                  )}
                  {session.description && <p className="mt-2 text-sm leading-relaxed">{session.description}</p>}

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <section aria-label={`Recording for ${session.title}`}>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Recording</h3>
                      <Recording session={session} />
                    </section>
                    <section aria-label={`Materials for ${session.title}`}>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                        Presentations and materials
                      </h3>
                      {materials.length === 0 ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted rounded-full px-2.5 py-1.5" data-testid={`text-materials-pending-${session.id}`}>
                          <FileText className="h-3 w-3" />
                          Nothing shared yet
                        </span>
                      ) : (
                        <ul className="space-y-2" role="list">
                          {materials.map((m) => (
                            <Material key={m.id} material={m} />
                          ))}
                        </ul>
                      )}
                    </section>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
