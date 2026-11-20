import { useState, useRef, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { InitialsAvatar } from "@/components/initials-avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth-context";
import type { PublicUser, Message } from "@shared/schema";
import { ArrowLeft, Send } from "lucide-react";

export default function MessageThread() {
  const params = useParams<{ id: string }>();
  const otherUserId = Number(params.id);
  const { authedFetch, user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: userData } = useQuery<{ user: PublicUser }>({
    queryKey: ["/api/users", otherUserId],
    queryFn: async () => {
      const res = await authedFetch(`/api/users/${otherUserId}`);
      if (!res.ok) throw new Error("Attendee not found");
      return res.json();
    },
  });

  const { data: threadData, isLoading } = useQuery<{ messages: Message[]; canMessage: boolean }>({
    queryKey: ["/api/messages", otherUserId],
    queryFn: async () => {
      const res = await authedFetch(`/api/messages/${otherUserId}`);
      if (!res.ok) throw new Error("Could not load conversation.");
      return res.json();
    },
    refetchInterval: 4000,
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [threadData?.messages?.length]);

  async function handleSend() {
    const body = draft.trim();
    if (!body) return;
    setSending(true);
    try {
      const res = await authedFetch(`/api/messages/${otherUserId}`, {
        method: "POST",
        body: JSON.stringify({ body }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSendError(data.message ?? "Your message could not be sent.");
        await queryClient.invalidateQueries({ queryKey: ["/api/messages", otherUserId] });
      } else {
        setSendError(null);
        setDraft("");
        await queryClient.invalidateQueries({ queryKey: ["/api/messages", otherUserId] });
        await queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      }
    } finally {
      setSending(false);
    }
  }

  const attendee = userData?.user;
  const messages = threadData?.messages ?? [];
  // Until the thread has loaded, assume she can write; the server has the final say.
  const canMessage = threadData?.canMessage ?? true;

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 md:py-10 flex flex-col h-[calc(100dvh-8.5rem)] md:h-[calc(100dvh-6rem)]">
        <div className="flex items-center gap-3 mb-4">
          <Link
            href="/messages"
            className="inline-flex items-center justify-center rounded-md h-8 w-8 hover-elevate active-elevate-2 shrink-0"
            data-testid="link-back-to-messages"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          {attendee && (
            <>
              <InitialsAvatar name={attendee.name} photoUrl={attendee.photoUrl} className="h-9 w-9" testId="avatar-thread-recipient" />
              <div>
                <p className="text-sm font-medium" data-testid="text-thread-recipient-name">
                  {attendee.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {attendee.title}
                  {attendee.title && attendee.company ? " · " : ""}
                  {attendee.company}
                </p>
              </div>
            </>
          )}
        </div>

        <div className="flex-1 overflow-y-auto rounded-xl border border-card-border bg-card p-4 mb-3 space-y-3" data-testid="scroll-message-thread">
          {isLoading ? (
            <div className="space-y-2">
              <div className="skeleton skeleton-text" style={{ width: "60%" }} />
              <div className="skeleton skeleton-text" style={{ width: "40%", marginLeft: "auto" }} />
            </div>
          ) : messages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8" data-testid="text-thread-empty">
              {canMessage
                ? `No messages yet. Say hello to ${attendee?.name.split(" ")[0] ?? "her"}.`
                : "No messages yet."}
            </p>
          ) : (
            messages.map((msg) => {
              const isMine = msg.senderId === currentUser?.id;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                  data-testid={`message-${msg.id}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                      isMine
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted text-foreground rounded-bl-md"
                    }`}
                  >
                    {msg.body}
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {sendError && (
          <p className="text-sm text-destructive mb-2" role="alert" data-testid="text-send-error">{sendError}</p>
        )}
        {!canMessage ? (
          <div className="rounded-xl border border-card-border bg-muted/60 p-4 text-sm" data-testid="notice-not-connected">
            <p className="font-semibold mb-1">You are not connected</p>
            <p className="text-muted-foreground mb-3">
              Messages go only between women who have accepted each other&rsquo;s connection request.
            </p>
            <Link href={`/attendee/${otherUserId}`}>
              <Button size="sm" variant="outline" data-testid="button-thread-view-profile">View her profile</Button>
            </Link>
          </div>
        ) : (
        <div className="flex items-end gap-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Write a message..."
            className="min-h-[44px] max-h-32 resize-none"
            data-testid="textarea-message-draft"
          />
          <Button onClick={handleSend} disabled={sending || !draft.trim()} size="icon" aria-label="Send message" data-testid="button-send-message">
            <Send className="h-4 w-4" />
          </Button>
        </div>
        )}
      </div>
    </AppShell>
  );
}
