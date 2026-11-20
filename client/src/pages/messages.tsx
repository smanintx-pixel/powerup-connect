import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { AppShell } from "@/components/app-shell";
import { InitialsAvatar } from "@/components/initials-avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import type { PublicUser, Message } from "@shared/schema";
import { MessageCircle, Users } from "lucide-react";

type Conversation = { user: PublicUser; lastMessage: Message | null };

export default function Messages() {
  const { authedFetch } = useAuth();

  const { data, isLoading } = useQuery<{ conversations: Conversation[] }>({
    queryKey: ["/api/messages"],
    queryFn: async () => {
      const res = await authedFetch("/api/messages");
      if (!res.ok) throw new Error("Could not load messages.");
      return res.json();
    },
    refetchInterval: 5000,
  });

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 md:py-10">
        <h1 className="text-2xl font-extrabold mb-1">Messages</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Conversations with attendees you&rsquo;ve connected with.
        </p>

        {isLoading ? (
          <div className="space-y-3" data-testid="skeleton-messages">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-card-border bg-card p-4 flex items-center gap-3">
                <div className="skeleton skeleton-avatar" />
                <div className="flex-1 space-y-1.5">
                  <div className="skeleton skeleton-text" style={{ width: "40%" }} />
                  <div className="skeleton skeleton-text" style={{ width: "60%" }} />
                </div>
              </div>
            ))}
          </div>
        ) : !data || data.conversations.length === 0 ? (
          <div className="empty-state" data-testid="text-messages-empty">
            <MessageCircle className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <h3 className="text-base font-bold mb-1">No conversations yet</h3>
            <p className="text-sm text-muted-foreground max-w-xs mb-5">
Send a connection request from someone&rsquo;s profile. Once she accepts, you can
              message each other.
            </p>
            <Link href="/directory">
              <Button data-testid="button-messages-browse-directory">
                <Users className="h-4 w-4" />
                Browse the directory
              </Button>
            </Link>
          </div>
        ) : (
          <ul className="space-y-2" role="list">
            {data.conversations.map((conv) => (
              <li key={conv.user.id}>
                <Link href={`/messages/${conv.user.id}`}>
                  <div
                    className="rounded-xl border border-card-border bg-card p-4 hover-elevate active-elevate-2 cursor-pointer flex items-center gap-3"
                    data-testid={`card-conversation-${conv.user.id}`}
                  >
                    <InitialsAvatar
                      name={conv.user.name}
                      photoUrl={conv.user.photoUrl}
                      className="h-11 w-11 shrink-0"
                      testId={`avatar-conversation-${conv.user.id}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate" data-testid={`text-conversation-name-${conv.user.id}`}>
                        {conv.user.name}
                      </p>
                      <p className="text-sm text-muted-foreground truncate" data-testid={`text-conversation-preview-${conv.user.id}`}>
                        {conv.lastMessage?.body ?? "Say hello"}
                      </p>
                    </div>
                    {conv.lastMessage && (
                      <span className="text-xs text-muted-foreground shrink-0">
                        {new Date(conv.lastMessage.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    )}
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
