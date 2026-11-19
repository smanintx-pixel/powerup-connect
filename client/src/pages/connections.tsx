import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { AppShell } from "@/components/app-shell";
import { InitialsAvatar } from "@/components/initials-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import type { PublicUser, Connection } from "@shared/schema";
import { HeartHandshake, Calendar, Users } from "lucide-react";
import { BrandRings } from "@/components/brand-rings";

type ConnectionWithUser = Connection & { user: PublicUser };

export default function Connections() {
  const { authedFetch } = useAuth();
  const [sortBy, setSortBy] = useState<"recent" | "reminder">("recent");

  const { data, isLoading } = useQuery<{ connections: ConnectionWithUser[] }>({
    queryKey: ["/api/connections"],
    queryFn: async () => {
      const res = await authedFetch("/api/connections");
      if (!res.ok) throw new Error("Could not load connections.");
      return res.json();
    },
  });

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
          Everyone you&rsquo;ve connected with &mdash; a network that lasts long after the
          conference ends.
        </p>

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
              Head to the directory and connect with attendees you meet. Your notes and their
              contact info will stay right here &mdash; all year long.
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
      </div>
    </AppShell>
  );
}
