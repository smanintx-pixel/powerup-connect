import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { AppShell } from "@/components/app-shell";
import { InitialsAvatar } from "@/components/initials-avatar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Search, Users } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import type { PublicUser } from "@shared/schema";

export default function Directory() {
  const { authedFetch } = useAuth();
  const [query, setQuery] = useState("");

  const { data, isLoading } = useQuery<{ users: PublicUser[] }>({
    queryKey: ["/api/directory"],
    queryFn: async () => {
      const res = await authedFetch("/api/directory");
      if (!res.ok) throw new Error("Could not load the directory.");
      return res.json();
    },
  });

  const filtered = useMemo(() => {
    const attendees = data?.users ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return attendees;
    return attendees.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.company.toLowerCase().includes(q) ||
        a.title.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [data, query]);

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 md:py-10">
        <h1 className="text-2xl font-extrabold mb-1">Attendee directory</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Search by name, company, or interest to find the right people to meet.
        </p>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search attendees..."
            className="pl-9"
            data-testid="input-directory-search"
          />
        </div>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="skeleton-directory">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-card-border bg-card p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="skeleton skeleton-avatar" />
                  <div className="flex-1 space-y-1.5">
                    <div className="skeleton skeleton-text" style={{ width: "70%" }} />
                    <div className="skeleton skeleton-text" style={{ width: "50%" }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state" data-testid="text-directory-empty">
            <Users className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <h3 className="text-base font-bold mb-1">No attendees match your search</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Try a different name, company, or tag.
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((attendee, i) => (
              <Link key={attendee.id} href={`/attendee/${attendee.id}`} className="block min-w-0">
                <Card
                  className={`p-5 border-2 pu-card-tint pu-shape-${i % 4} hover-elevate active-elevate-2 cursor-pointer h-full`}
                  data-testid={`card-attendee-${attendee.id}`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <InitialsAvatar
                      name={attendee.name}
                      photoUrl={attendee.photoUrl}
                      className="h-12 w-12"
                      testId={`avatar-attendee-${attendee.id}`}
                    />
                    <div className="min-w-0">
                      <p className="font-serif text-base font-bold truncate" data-testid={`text-attendee-name-${attendee.id}`}>
                        {attendee.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {attendee.title}
                        {attendee.title && attendee.company ? " · " : ""}
                        {attendee.company}
                      </p>
                    </div>
                  </div>
                  {attendee.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {attendee.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
