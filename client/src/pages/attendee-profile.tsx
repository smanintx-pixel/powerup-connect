import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { InitialsAvatar } from "@/components/initials-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import type { PublicUser, Connection } from "@shared/schema";
import { ArrowLeft, ExternalLink, Heart, HeartHandshake, Check, MessageCircle } from "lucide-react";

export default function AttendeeProfile() {
  const params = useParams<{ id: string }>();
  const attendeeId = Number(params.id);
  const { authedFetch, user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const { data: userData, isLoading: userLoading } = useQuery<{ user: PublicUser }>({
    queryKey: ["/api/users", attendeeId],
    queryFn: async () => {
      const res = await authedFetch(`/api/users/${attendeeId}`);
      if (!res.ok) throw new Error("Attendee not found");
      return res.json();
    },
  });

  const { data: connData } = useQuery<{ connection: Connection | null }>({
    queryKey: ["/api/connections", attendeeId],
    queryFn: async () => {
      const res = await authedFetch(`/api/connections/${attendeeId}`);
      if (!res.ok) throw new Error("Could not load connection");
      return res.json();
    },
    enabled: !!attendeeId,
  });

  const isConnected = !!connData?.connection;
  const [note, setNote] = useState("");
  const [reminderDate, setReminderDate] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [connecting, setConnecting] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (connData?.connection) {
      setNote(connData.connection.note ?? "");
      setReminderDate(connData.connection.reminderDate ?? "");
    }
  }, [connData?.connection?.id]);

  async function handleConnect() {
    setConnecting(true);
    try {
      const res = await authedFetch(`/api/connections/${attendeeId}`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error("Could not connect");
      await queryClient.invalidateQueries({ queryKey: ["/api/connections", attendeeId] });
      await queryClient.invalidateQueries({ queryKey: ["/api/connections"] });
    } finally {
      setConnecting(false);
    }
  }

  function scheduleSave(nextNote: string, nextReminder: string) {
    setSaveState("saving");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const res = await authedFetch(`/api/connections/${attendeeId}`, {
        method: "POST",
        body: JSON.stringify({ note: nextNote, reminderDate: nextReminder || null }),
      });
      if (res.ok) {
        setSaveState("saved");
        queryClient.invalidateQueries({ queryKey: ["/api/connections"] });
      }
    }, 600);
  }

  if (userLoading) {
    return (
      <AppShell>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10" data-testid="skeleton-attendee-profile">
          <div className="skeleton skeleton-avatar" style={{ width: 80, height: 80 }} />
          <div className="skeleton skeleton-heading mt-4" />
          <div className="skeleton skeleton-text" />
        </div>
      </AppShell>
    );
  }

  const attendee = userData?.user;
  if (!attendee) {
    return (
      <AppShell>
        <div className="empty-state">
          <h3 className="text-base font-bold">Attendee not found</h3>
          <Link href="/directory">
            <Button variant="outline" className="mt-4">
              Back to directory
            </Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 md:py-10">
        <Link
          href="/directory"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover-elevate rounded-md px-2 py-1 -ml-2 mb-4"
          data-testid="link-back-to-directory"
        >
          <ArrowLeft className="h-4 w-4" />
          Directory
        </Link>

        <div className="rounded-2xl border border-card-border bg-card p-6 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <InitialsAvatar
              name={attendee.name}
              photoUrl={attendee.photoUrl}
              className="h-20 w-20 text-lg"
              testId="avatar-attendee-detail"
            />
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-extrabold" data-testid="text-attendee-detail-name">
                {attendee.name}
              </h1>
              <p className="text-sm text-muted-foreground mb-3">
                {attendee.title}
                {attendee.title && attendee.company ? " · " : ""}
                {attendee.company}
              </p>
              {attendee.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {attendee.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              {attendee.bio && (
                <p className="text-sm leading-relaxed mb-4" data-testid="text-attendee-bio">
                  {attendee.bio}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {attendee.linkedinUrl && (
                  <a
                    href={attendee.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid="link-attendee-linkedin"
                  >
                    <Button variant="outline" size="sm" className="gap-1.5">
                      LinkedIn
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </a>
                )}
                {isConnected ? (
                  <Link href={`/messages/${attendee.id}`}>
                    <Button size="sm" variant="secondary" className="gap-1.5" data-testid="button-message-attendee">
                      <MessageCircle className="h-3.5 w-3.5" />
                      Message
                    </Button>
                  </Link>
                ) : (
                  <Button
                    variant="gold"
                    size="sm"
                    onClick={handleConnect}
                    disabled={connecting}
                    className="gap-1.5"
                    data-testid="button-connect-attendee"
                  >
                    <Heart className="h-3.5 w-3.5" />
                    {connecting ? "Connecting..." : "Connect"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {isConnected && (
          <div className="rounded-2xl border border-card-border bg-card p-6 sm:p-8" data-testid="section-private-notes">
            <div className="flex items-center gap-2 mb-1">
              <HeartHandshake className="h-4 w-4 text-primary" />
              <h2 className="text-base font-bold">Your private notes</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Only visible to you. Never shown to {attendee.name.split(" ")[0]} or anyone else.
            </p>

            <Label htmlFor="note" className="text-sm mb-1.5 block">
              Notes
            </Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                scheduleSave(e.target.value, reminderDate);
              }}
              placeholder="What did you talk about? What should you follow up on?"
              className="min-h-[100px] mb-4"
              data-testid="textarea-connection-note"
            />

            <Label htmlFor="reminder" className="text-sm mb-1.5 block">
              Follow-up reminder (optional)
            </Label>
            <Input
              id="reminder"
              type="date"
              value={reminderDate}
              onChange={(e) => {
                setReminderDate(e.target.value);
                scheduleSave(note, e.target.value);
              }}
              className="max-w-[200px]"
              data-testid="input-reminder-date"
            />

            <p
              className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5 h-4"
              data-testid="text-save-status"
            >
              {saveState === "saving" && "Saving..."}
              {saveState === "saved" && (
                <>
                  <Check className="h-3 w-3 text-primary" /> Saved
                </>
              )}
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
