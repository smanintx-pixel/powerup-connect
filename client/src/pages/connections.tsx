import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { AppShell } from "@/components/app-shell";
import { InitialsAvatar } from "@/components/initials-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import type { PublicUser, Connection } from "@shared/schema";
import { HeartHandshake, Calendar, Users, Check, Clock } from "lucide-react";
import { BrandRings } from "@/components/brand-rings";

type ConnectionWithUser = Connection & { user: PublicUser };
type PendingRequest = { id: number; createdAt: number; user: PublicUser };
type ConnectionsData = { connections: ConnectionWithUser[]; incoming: PendingRequest[]; outgoing: PendingRequest[] };

export default function Connections() {
  const { authedFetch } = useAuth();
  const [sortBy, setSortBy] = useState<"recent" | "reminder">("recent");

  const queryClient = useQueryClient();
  const [busyId, setBusyId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function act(otherId: number, action: "accept" | "decline" | "remove") {
    setBusyId(otherId);
    setActionError(null);
    try {
      const res = await authedFetch(
        action === "remove" ? `/api/connections/${otherId}` : `/api/connections/${otherId}/${action}`,
        { method: action === "remove" ? "DELETE" : "POST", body: JSON.stringify({}) }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setActionError(body.message ?? "That did not work. Please try again.");
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/connections"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/directory"] }),
      ]);
    } finally {
      setBusyId(null);
    }
  }

  const { data, isLoading } = useQuery<ConnectionsData>({
    queryKey: ["/api/connections"],
    queryFn: async () => {
      const res = await authedFetch("/api/connections");
      if (!res.ok) throw new Error("Could not load connections.");
      return res.json();
    },
    refetchInterval: 20000,
  });
  const incoming = data?.incoming ?? [];
  const outgoing = data?.outgoing ?? [];

  const sorted = useMemo(() => {
    const conns = data?.connections ?? [];
    if (sortBy === "recent") {
      return [...conns].sort((a, b) => b.createdAt - a.createdAt);
    }
    return [...conns].sort((a, b) => {
      if (!a.reminderDate && !b.reminderDate) return 0;
      if (!a.reminderDate) return 1;
      if (!b.reminderDate) return -1;
      return new Date(a.reminderDate).getTime() - new Date(b.reminderDate).getTime();
    });
  }, [data, sortBy]);

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 md:py-10">
        <h1 className="text-2xl font-extrabold mb-1">My connections</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Women who accepted your request, or whose request you accepted. Only connections can
          message each other.
        </p>

        {actionError && (
          <p className="text-sm text-destructive mb-4" role="alert" data-testid="text-connections-error">{actionError}</p>
        )}

        {incoming.length > 0 && (
          <section aria-labelledby="requests-heading" className="mb-8" data-testid="section-incoming-requests">
            <h2 id="requests-heading" className="text-base font-extrabold mb-1">
              Requests to connect ({incoming.length})
            </h2>
            <p className="text-xs text-muted-foreground mb-3">
              Accept to let her message you and see any contact details you chose to share. She is not told if you decline.
            </p>
            <ul className="space-y-3" role="list">
              {incoming.map((req) => (
                <li key={req.id} className="rounded-xl border-2 border-primary/30 bg-card p-4" data-testid={`card-request-${req.user.id}`}>
                  <Link href={`/attendee/${req.user.id}`} className="flex items-center gap-3 min-w-0">
                    <InitialsAvatar name={req.user.name} photoUrl={req.user.photoUrl} className="h-12 w-12 shrink-0" />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold truncate">{req.user.name}</span>
                      <span className="block text-xs text-muted-foreground truncate">
                        {req.user.title}
                        {req.user.title && req.user.company ? " · " : ""}
                        {req.user.company}
                      </span>
                    </span>
                  </Link>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Button size="sm" variant="gold" className="gap-1.5" disabled={busyId === req.user.id} onClick={() => act(req.user.id, "accept")} data-testid={`button-accept-${req.user.id}`}>
                      <Check className="h-3.5 w-3.5" />
                      Accept
                    </Button>
                    <Button size="sm" variant="outline" disabled={busyId === req.user.id} onClick={() => act(req.user.id, "decline")} data-testid={`button-decline-${req.user.id}`}>
                      Decline
                    </Button>
                    <Link href={`/attendee/${req.user.id}`}>
                      <Button size="sm" variant="ghost">View profile</Button>
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {!isLoading && sorted.length > 0 && (
          <div className="flex gap-2 mb-5">
            <Button
              size="sm"
              variant={sortBy === "recent" ? "default" : "outline"}
              onClick={() => setSortBy("recent")}
              data-testid="button-sort-recent"
            >
              Most recent
            </Button>
            <Button
              size="sm"
              variant={sortBy === "reminder" ? "default" : "outline"}
              onClick={() => setSortBy("reminder")}
              data-testid="button-sort-reminder"
            >
              Upcoming reminder
            </Button>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3" data-testid="skeleton-connections">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-card-border bg-card p-5 flex items-center gap-3">
                <div className="skeleton skeleton-avatar" />
                <div className="flex-1 space-y-1.5">
                  <div className="skeleton skeleton-text" style={{ width: "40%" }} />
                  <div className="skeleton skeleton-text" style={{ width: "70%" }} />
                </div>
              </div>
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="empty-state" data-testid="text-connections-empty">
            <BrandRings className="w-36 mb-4" />
            <h3 className="text-base font-bold mb-1">No connections yet</h3>
            <p className="text-sm text-muted-foreground max-w-xs mb-5">
              Head to the directory and ask to connect with the women you meet. Once she accepts,
              she shows up here with your private notes.
            </p>
            <Link href="/directory">
              <Button data-testid="button-browse-directory">
                <Users className="h-4 w-4" />
                Browse the directory
              </Button>
            </Link>
          </div>
        ) : (
          <ul className="space-y-3" role="list">
            {sorted.map((conn) => (
              <li key={conn.id}>
                <Link href={`/attendee/${conn.user.id}`}>
                  <div
                    className="rounded-xl border border-card-border bg-card p-5 hover-elevate active-elevate-2 cursor-pointer flex items-start gap-4"
                    data-testid={`card-connection-${conn.user.id}`}
                  >
                    <InitialsAvatar
                      name={conn.user.name}
                      photoUrl={conn.user.photoUrl}
                      className="h-12 w-12 shrink-0"
                      testId={`avatar-connection-${conn.user.id}`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium truncate" data-testid={`text-connection-name-${conn.user.id}`}>
                          {conn.user.name}
                        </p>
                        {conn.reminderDate && (
                          <Badge variant="secondary" className="gap-1 text-xs shrink-0">
                            <Calendar className="h-3 w-3" />
                            {new Date(conn.reminderDate).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                            })}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate mb-1.5">
                        {conn.user.title}
                        {conn.user.title && conn.user.company ? " · " : ""}
                        {conn.user.company}
                      </p>
                      {conn.note ? (
                        <p className="text-sm text-muted-foreground line-clamp-2" data-testid={`text-connection-note-${conn.user.id}`}>
                          {conn.note}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground/60 italic flex items-center gap-1.5">
                          <HeartHandshake className="h-3.5 w-3.5" />
                          No notes yet — tap to add one
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {outgoing.length > 0 && (
          <section aria-labelledby="sent-heading" className="mt-10" data-testid="section-outgoing-requests">
            <h2 id="sent-heading" className="text-base font-extrabold mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Waiting for an answer ({outgoing.length})
            </h2>
            <ul className="space-y-2" role="list">
              {outgoing.map((req) => (
                <li key={req.id} className="rounded-xl border border-card-border bg-card p-3 flex items-center gap-3" data-testid={`card-sent-${req.user.id}`}>
                  <Link href={`/attendee/${req.user.id}`} className="flex items-center gap-3 min-w-0 flex-1">
                    <InitialsAvatar name={req.user.name} photoUrl={req.user.photoUrl} className="h-10 w-10 shrink-0" />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold truncate">{req.user.name}</span>
                      <span className="block text-xs text-muted-foreground truncate">{req.user.company || req.user.title}</span>
                    </span>
                  </Link>
                  <Button size="sm" variant="ghost" disabled={busyId === req.user.id} onClick={() => act(req.user.id, "remove")} data-testid={`button-cancel-${req.user.id}`}>
                    Take back
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </AppShell>
  );
}
