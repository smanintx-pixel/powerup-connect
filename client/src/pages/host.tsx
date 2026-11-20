import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, MediaAccessError, PolicyCurfewError, MaintenanceError } from "@nuancelabs/js-sdk";
import { useNuanceConversation } from "@nuancelabs/js-sdk/react";
import { ArrowLeft, Mic, MicOff, PhoneOff, Video, Sparkles, Lock, Clock, LifeBuoy } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { NUANCE_PRIVACY_URL } from "@shared/legal";
import { useAuth } from "@/lib/auth-context";

type HostStatus = { enabled: boolean; name: string; maxSeconds: number; consented: boolean; consentVersion: string; restrictedRegions: string[] };

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

/** The agreement Nuance Labs requires before any call. Recorded on the server with its version. */
function HostConsent({ status, onDone }: { status: HostStatus; onDone: () => void }) {
  const { authedFetch } = useAuth();
  const [agreeRecording, setAgreeRecording] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [notRestricted, setNotRestricted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const name = status.name;
  const regions = status.restrictedRegions;
  const regionText = regions.length > 1 ? `${regions.slice(0, -1).join(", ")} or ${regions[regions.length - 1]}` : regions.join("");

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await authedFetch("/api/host/consent", {
        method: "POST",
        body: JSON.stringify({ version: status.consentVersion, agreeRecording, agreePrivacy, notRestrictedResident: notRestricted }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message ?? "Could not save your agreement.");
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your agreement.");
    } finally {
      setBusy(false);
    }
  }

  const Box = ({ checked, onChange, id, children }: { checked: boolean; onChange: (v: boolean) => void; id: string; children: React.ReactNode }) => (
    <label className="flex items-start gap-3 text-sm cursor-pointer">
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(v === true)} className="mt-0.5" data-testid={`checkbox-${id}`} />
      <span>{children}</span>
    </label>
  );

  return (
    <div className="rounded-2xl border-2 border-[#FFC933] bg-card p-6" data-testid="panel-host-consent">
      <h2 className="text-lg font-extrabold mb-1">Before your first call</h2>
      <p className="text-sm text-muted-foreground mb-4">
        {name} is an artificial intelligence, not a person. She is run by Nuance Labs, an independent company. Please read and agree to
        the following. You only need to do this once.
      </p>
      <ul className="text-sm space-y-2 mb-5 list-disc pl-5">
        <li>Nuance Labs records and stores your calls with {name}, including your voice and what you say, and may use them to improve its service and train its AI models. Your camera stays off.</li>
        <li>To start a call, the app sends Nuance Labs your first name, what you are here for, how many past conferences you attended, the session list and a code that stands for your account. Nothing else from your profile.</li>
        <li>{name} can be wrong, and she does not give medical, mental health, legal or financial advice. In an emergency call 911, or call or text 988.</li>
        <li>Do not tell her financial, medical or ID details, or other people's personal information.</li>
      </ul>
      <div className="space-y-3 mb-5">
        <Box id="host-recording" checked={agreeRecording} onChange={setAgreeRecording}>
          I agree that Nuance Labs may record, store and use my calls with {name} as described above, and I direct the app to send it the
          information listed.
        </Box>
        <Box id="host-privacy" checked={agreePrivacy} onChange={setAgreePrivacy}>
          I have read{" "}
          <a href={NUANCE_PRIVACY_URL} target="_blank" rel="noopener noreferrer" className="text-primary underline">Nuance Labs' privacy policy</a>.
        </Box>
        <Box id="host-region" checked={notRestricted} onChange={setNotRestricted}>
          I do not live in {regionText}, where Nuance Labs does not offer this service.
        </Box>
      </div>
      {error && <p className="mb-3 text-sm text-destructive" role="alert">{error}</p>}
      <Button variant="gold" onClick={submit} disabled={busy || !agreeRecording || !agreePrivacy || !notRestricted} data-testid="button-host-consent">
        {busy ? "Saving..." : "Agree and continue"}
      </Button>
      <p className="mt-4 text-xs text-muted-foreground">
        You can withdraw this agreement in Settings. If you do not agree, the rest of the app works as usual.
      </p>
    </div>
  );
}

export default function Host() {
  const { authedFetch } = useAuth();
  const queryClient = useQueryClient();
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
      if (data.code === "consent_required") queryClient.invalidateQueries({ queryKey: ["/api/host/status"] });
      throw new HostStartError(data.message ?? "The call could not start. Please try again later.");
    }
    return data.token as string;
  }, [authedFetch, queryClient]);

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
        ) : status.data?.enabled && !status.data.consented ? (
          <HostConsent status={status.data} onDone={() => queryClient.invalidateQueries({ queryKey: ["/api/host/status"] })} />
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
                <p className="mb-4 rounded-xl bg-muted px-4 py-3 text-sm" data-testid="text-host-call-notice">
                  {name} is an AI, run by Nuance Labs. This call is recorded by Nuance Labs and may be used to train its AI, as you
                  agreed. Starting the call confirms that again.
                </p>
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
