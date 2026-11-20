import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ApiError, MediaAccessError, PolicyCurfewError, MaintenanceError } from "@nuancelabs/js-sdk";
import { useNuanceConversation } from "@nuancelabs/js-sdk/react";
import { ArrowLeft, Mic, MicOff, PhoneOff, Video, Sparkles, Lock, Clock, LifeBuoy } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

type HostStatus = { enabled: boolean; name: string; maxSeconds: number };

/** An error from our own server when it will not hand out a call token. Its message is safe to show. */
class HostStartError extends Error {}

function describeError(error: Error, name: string): string {
  if (error instanceof HostStartError) return error.message;
  if (error instanceof MediaAccessError) {
    return `${name} needs your microphone. Allow microphone access for this site in your browser, then try again.`;
  }
  if (error instanceof PolicyCurfewError) return `${name} is taking a break for now. Please try again later.`;
  if (error instanceof MaintenanceError) return `${name} is down for maintenance. Please try again later.`;
  if (error instanceof ApiError) {
    if (error.status === 429 || error.status === 409 || error.status === 503) {
      return `${name} is busy right now. Please try again in a minute.`;
    }
    if (error.status === 403) return `${name} is not available right now.`;
  }
  return `${name} could not start. Check your connection and try again.`;
}

const END_MESSAGES: Record<string, string> = {
  "time-limit": "That is the end of this call. You can start another whenever you like.",
  "policy-violation": "The call was ended because of what was said. Please wait a while before starting another.",
  "age-check": "The call was ended.",
  refused: "The call could not start. Please try again later.",
  "connection-lost": "The connection dropped. You can start again.",
  ended: "The call has ended.",
};

export default function Host() {
  const { authedFetch } = useAuth();
  const [muted, setMuted] = useState(false);
  const [presented, setPresented] = useState(false);
  const [endNote, setEndNote] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [caption, setCaption] = useState("");
  const startedOnce = useRef(false);

  const status = useQuery<HostStatus>({
    queryKey: ["/api/host/status"],
    queryFn: async () => {
      const res = await authedFetch("/api/host/status");
      if (!res.ok) throw new Error("Could not check the host.");
      return res.json();
    },
  });
  const name = status.data?.name ?? "Nia";
  const maxSeconds = status.data?.maxSeconds ?? 300;

  // The SDK asks for a fresh token each time a call starts. Our server holds the API key.
  const fetchToken = useCallback(async () => {
    const res = await authedFetch("/api/host/token", { method: "POST", body: JSON.stringify({}) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || typeof data.token !== "string") {
      throw new HostStartError(data.message ?? "The call could not start. Please try again later.");
    }
    return data.token as string;
  }, [authedFetch]);

  const { state, error, conversation, videoRef, audioRef, start, end } = useNuanceConversation({
    token: fetchToken,
    maxSessionSeconds: maxSeconds,
    mediaDevices: { cameraEnabled: false }, // voice only: her camera is never turned on
  });

  useEffect(() => {
    if (!conversation) return;
    const offChange = conversation.onChange((event) => {
      if (event.type === "avatar-presented") {
        setPresented(true);
        // She does not speak first unless asked to.
        conversation.sendInterfaceEvent({ type: "response.create" }).catch(() => {});
      } else if (event.type === "time-remaining") {
        setSecondsLeft(event.secondsRemaining);
      } else if (event.type === "session-ended") {
        setEndNote(END_MESSAGES[event.reason] ?? END_MESSAGES.ended);
      }
    });
    const offEvents = conversation.onInterfaceEvent((event) => {
      // Live captions of what she says, for anyone who cannot hear her well.
      if (event.type === "session.output_transcript.delta" && typeof event.delta === "string") {
        setCaption((prev) => (prev + event.delta).slice(-220));
      }
    });
    return () => {
      offChange();
      offEvents();
    };
  }, [conversation]);

  useEffect(() => {
    if (secondsLeft === null || state !== "connected") return;
    const t = setInterval(() => setSecondsLeft((s) => (s === null ? s : Math.max(0, s - 1))), 1000);
    return () => clearInterval(t);
  }, [secondsLeft === null, state]);

  async function handleStart() {
    startedOnce.current = true;
    setEndNote(null);
    setPresented(false);
    setMuted(false);
    setCaption("");
    setSecondsLeft(null);
    try {
      await start();
    } catch {
      // The hook reports the failure through `error`.
    }
  }

  async function handleEnd() {
    try {
      await end();
    } catch {
      // Already over.
    }
    setEndNote((prev) => prev ?? "You ended the call.");
  }

  async function toggleMute() {
    if (!conversation || state !== "connected") return;
    try {
      if (muted) await conversation.user.unmuteAudio();
      else await conversation.user.muteAudio();
      setMuted(!muted);
    } catch {
      // The call ended while toggling.
    }
  }

  const live = state === "connected";
  const starting = state === "connecting" || state === "queued";
  const inCall = live || starting;
  const errorText = error && !inCall ? describeError(error, name) : null;

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 md:py-10">
        <Link
          href="/home"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover-elevate rounded-md px-2 py-1 -ml-2 mb-4"
          data-testid="link-host-back"
        >
          <ArrowLeft className="h-4 w-4" />
          Home
        </Link>

        <h1 className="text-2xl font-extrabold mb-1 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Talk with {name}
        </h1>
        <p className="text-sm text-muted-foreground mb-5">
          {name} is your AI host for Power Up. Ask her about the sessions, how the app works, or practice
          introducing yourself before you walk up to someone new.
        </p>

        {status.isLoading ? (
          <div className="skeleton h-64 rounded-2xl" data-testid="skeleton-host" />
        ) : !status.data?.enabled ? (
          <div className="rounded-2xl border border-card-border bg-card p-6 text-sm" data-testid="notice-host-off">
            <p className="font-bold mb-1">{name} is not available yet</p>
            <p className="text-muted-foreground">She will be switched on closer to the conference.</p>
          </div>
        ) : (
          <>
            {/* The call. The video and audio elements stay mounted so the SDK can attach to them. */}
            <div
              className={`relative overflow-hidden rounded-3xl pu-night text-white shadow-lg ${inCall ? "" : "hidden"}`}
              data-testid="panel-host-call"
            >
              <div className="relative aspect-[4/5] sm:aspect-video max-h-[62dvh] w-full">
                <video ref={videoRef} autoPlay playsInline className="absolute inset-0 h-full w-full object-cover" data-testid="video-host" />
                <audio ref={audioRef} autoPlay />
                {!presented && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pu-night text-center px-6" role="status">
                    <span className="h-12 w-12 rounded-full border-4 border-white/25 border-t-[#FFC933] animate-spin" aria-hidden="true" />
                    <p className="font-bold">{name} is getting ready</p>
                    <p className="text-sm text-white/75">This can take up to half a minute.</p>
                  </div>
                )}
                <span className="absolute left-3 top-3 rounded-full bg-black/55 px-3 py-1 text-[11px] font-bold uppercase tracking-wide" data-testid="badge-host-ai">
                  AI host
                </span>
                {live && secondsLeft !== null && secondsLeft <= 60 && (
                  <span className="absolute right-3 top-3 rounded-full bg-[#FFC933] text-[#0B1440] px-3 py-1 text-xs font-extrabold" aria-live="polite">
                    {secondsLeft}s left
                  </span>
                )}
                {live && caption && (
                  <p className="absolute inset-x-3 bottom-3 rounded-xl bg-black/60 px-3 py-2 text-sm leading-snug" aria-live="off" data-testid="text-host-caption">
                    {caption}
                  </p>
                )}
              </div>
              <div className="flex items-center justify-center gap-3 p-4">
                <Button
                  variant="outline"
                  onClick={toggleMute}
                  disabled={!live}
                  aria-pressed={muted}
                  className="gap-2 bg-white/10 text-white [border-color:rgba(255,255,255,0.5)]"
                  data-testid="button-host-mute"
                >
                  {muted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  {muted ? "Unmute" : "Mute"}
                </Button>
                <Button variant="destructive" onClick={handleEnd} className="gap-2" data-testid="button-host-end">
                  <PhoneOff className="h-4 w-4" />
                  End call
                </Button>
              </div>
            </div>

            {!inCall && (
              <div className="rounded-2xl border border-card-border bg-card p-6" data-testid="panel-host-start">
                {endNote && (
                  <p className="mb-4 rounded-xl bg-muted px-4 py-3 text-sm font-medium" role="status" data-testid="text-host-ended">
                    {endNote}
                  </p>
                )}
                {errorText && (
                  <p className="mb-4 rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive" role="alert" data-testid="text-host-error">
                    {errorText}
                  </p>
                )}
                <Button variant="gold" size="lg" onClick={handleStart} className="gap-2 pu-glow" data-testid="button-host-start">
                  <Video className="h-4 w-4" />
                  {startedOnce.current ? `Talk with ${name} again` : `Start talking with ${name}`}
                </Button>
                <ul className="mt-5 space-y-3 text-sm text-muted-foreground" role="list">
                  <li className="flex gap-3">
                    <Mic className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                    <span>You will see and hear {name}, and she hears you. Your browser will ask to use your microphone. Your camera stays off.</span>
                  </li>
                  <li className="flex gap-3">
                    <Clock className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                    <span>Each call lasts up to {Math.round(maxSeconds / 60)} minutes. Headphones help in a busy room.</span>
                  </li>
                  <li className="flex gap-3">
                    <Lock className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                    <span>
                      {name} is an AI, not a person, and is provided by Nuance Labs, which processes the call. She is told your
                      first name, what you are here for and how many conferences you have attended. Nothing else from your profile.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <LifeBuoy className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                    <span>
                      She cannot give financial, legal or medical advice and is not a crisis service. In an emergency call 911,
                      or call or text 988 for the Suicide and Crisis Lifeline.
                    </span>
                  </li>
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
