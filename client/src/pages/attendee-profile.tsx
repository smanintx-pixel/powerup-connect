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
import type { PublicUser, Connection, Relation } from "@shared/schema";
import { ArrowLeft, ExternalLink, Heart, HeartHandshake, Check, MessageCircle, Phone, Mail, Clock, Lock } from "lucide-react";
import { PowerBadge } from "@/components/power-badge";

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
    // Her answer to a request changes what this page may show, so keep it fresh.
    refetchOnMount: "always",
    refetchInterval: 15000,
  });

  const { data: connData } = useQuery<{ connection: Connection | null; relation: Relation }>({
    queryKey: ["/api/connections", attendeeId],
    queryFn: async () => {
      const res = await authedFetch(`/api/connections/${attendeeId}`);
      if (!res.ok) throw new Error("Could not load connection");
      return res.json();
    },
    enabled: !!attendeeId,
    refetchOnMount: "always",
    refetchInterval: 15000,
  });

  const relation: Relation = connData?.relation ?? "none";
  const isConnected = relation === "connected";
  const isSelf = currentUser?.id === attendeeId;
  const [actionError, setActionError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [reminderDate, setReminderDate] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [connecting, setConnecting] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setNote(connData?.connection?.note ?? "");
    setReminderDate(connData?.connection?.reminderDate ?? "");
  }, [connData?.connection?.id, attendeeId]);

  // request | accept | decline | remove (remove also takes back an unanswered request)
  async function act(action: "request" | "accept" | "decline" | "remove") {
    setConnecting(true);
    setActionError(null);
    try {
      const res = await authedFetch(
        action === "remove" ? `/api/connections/${attendeeId}` : `/api/connections/${attendeeId}/${action}`,
        { method: action === "remove" ? "DELETE" : "POST", body: JSON.stringify({}) }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setActionError(data.message ?? "That did not work. Please try again.");
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/connections", attendeeId] }),
        queryClient.invalidateQueries({ queryKey: ["/api/connections"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/users", attendeeId] }),
        queryClient.invalidateQueries({ queryKey: ["/api/directory"] }),
      ]);
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
              {(attendee.pastYears ?? []).length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mb-3" data-testid="text-attendee-years">
                  <PowerBadge pastYears={attendee.pastYears} />
                  <span className="text-xs text-muted-foreground">
                    Attended {attendee.pastYears.join(", ")}
                  </span>
                </div>
              )}
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
              {(attendee.interests ?? []).length > 0 && (
                <div className="mb-4" data-testid="text-attendee-interests">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Here for</p>
                  <div className="flex flex-wrap gap-1.5">
                    {attendee.interests.map((item) => (
                      <span key={item} className="rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {attendee.phone && (
                  <a href={`tel:${attendee.phone.replace(/[^0-9+]/g, "")}`} data-testid="link-attendee-phone">
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <Phone className="h-3.5 w-3.5" />
                      {attendee.phone}
                    </Button>
                  </a>
                )}
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
                {attendee.email && (
                  <a href={`mailto:${attendee.email}`} data-testid="link-attendee-email" className="max-w-full">
                    <Button variant="outline" size="sm" className="gap-1.5 max-w-full">
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{attendee.email}</span>
                    </Button>
                  </a>
                )}
                {isConnected && (
                  <Link href={`/messages/${attendee.id}`}>
                    <Button size="sm" variant="secondary" className="gap-1.5" data-testid="button-message-attendee">
                      <MessageCircle className="h-3.5 w-3.5" />
                      Message
                    </Button>
                  </Link>
                )}
                {!isSelf && relation === "none" && (
                  <Button
                    variant="gold"
                    size="sm"
                    onClick={() => act("request")}
                    disabled={connecting}
                    className="gap-1.5"
                    data-testid="button-connect-attendee"
                  >
                    <Heart className="h-3.5 w-3.5" />
                    {connecting ? "Sending..." : "Ask to connect"}
                  </Button>
                )}
                {relation === "incoming" && (
                  <>
                    <Button variant="gold" size="sm" onClick={() => act("accept")} disabled={connecting} className="gap-1.5" data-testid="button-accept-attendee">
                      <Check className="h-3.5 w-3.5" />
                      Accept request
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => act("decline")} disabled={connecting} data-testid="button-decline-attendee">
                      Decline
                    </Button>
                  </>
                )}
              </div>

              {relation === "incoming" && (
                <p className="mt-3 text-sm text-muted-foreground" data-testid="text-relation-incoming">
                  {attendee.name.split(" ")[0]} asked to connect with you. She is not told if you decline.
                </p>
              )}
              {relation === "outgoing" && (
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground" data-testid="text-relation-outgoing">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                    Request sent
                  </span>
                  <span>You can message her once she accepts.</span>
                  <button type="button" onClick={() => act("remove")} disabled={connecting} className="underline font-semibold text-primary" data-testid="button-cancel-request">
                    Take it back
                  </button>
                </div>
              )}
              {!isSelf && !isConnected && (
                <p className="mt-3 text-xs text-muted-foreground flex items-start gap-1.5">
                  <Lock className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  Messaging and any contact details she shares open up once you are connected.
                </p>
              )}
              {actionError && (
                <p className="mt-3 text-sm text-destructive" role="alert" data-testid="text-connect-error">{actionError}</p>
              )}
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

        {isConnected && (
          <p className="mt-5 text-center text-xs text-muted-foreground">
            <button type="button" onClick={() => act("remove")} disabled={connecting} className="underline" data-testid="button-remove-connection">
              Remove {attendee.name.split(" ")[0]} from my connections
            </button>
          </p>
        )}
      </div>
    </AppShell>
  );
}
