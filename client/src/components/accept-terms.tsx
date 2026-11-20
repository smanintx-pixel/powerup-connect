import { useState } from "react";
import { Link } from "wouter";
import { Logo, Wordmark } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/lib/auth-context";
import { TERMS_VERSION } from "@shared/legal";

/** Shown to a signed-in attendee who has not agreed to the current Terms and Privacy Policy. */
export function AcceptTerms() {
  const { authedFetch, setUser, logout, user } = useAuth();
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isUpdate = Boolean(user?.termsVersion);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await authedFetch("/api/legal/accept", { method: "POST", body: JSON.stringify({ version: TERMS_VERSION, agree: true }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message ?? "Could not save your agreement.");
      setUser(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your agreement.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative overflow-hidden min-h-dvh pu-hero flex flex-col items-center justify-center px-4 py-10">
      <div className="relative flex items-center gap-2.5 mb-8 text-white">
        <Logo className="h-9 w-9" />
        <Wordmark className="text-xl" onDark />
      </div>
      <div className="w-full max-w-md relative pu-shape-0 border-2 border-card-border bg-card p-6 sm:p-8 shadow-xl" data-testid="panel-accept-terms">
        <h1 className="text-2xl font-extrabold mb-1.5">{isUpdate ? "Our terms have changed" : "One quick step"}</h1>
        <p className="text-sm text-muted-foreground mb-5">
          To keep using PowerUp Connect, please read and agree to our Terms of Service and Privacy Policy. They explain the community
          rules, what other attendees can see, and how Nia, the AI host, handles your calls.
        </p>
        <div className="flex gap-3 text-sm font-semibold mb-5">
          <Link href="/terms" className="text-primary underline">Terms of Service</Link>
          <Link href="/privacy" className="text-primary underline">Privacy Policy</Link>
        </div>
        <label className="flex items-start gap-3 text-sm mb-5 cursor-pointer">
          <Checkbox checked={agree} onCheckedChange={(v) => setAgree(v === true)} className="mt-0.5" data-testid="checkbox-accept-terms" />
          <span>I am 18 or older, and I agree to the Terms of Service and Privacy Policy.</span>
        </label>
        {error && <p className="text-sm text-destructive mb-3" role="alert">{error}</p>}
        <Button className="w-full" disabled={!agree || busy} onClick={submit} data-testid="button-accept-terms">
          {busy ? "Saving..." : "Agree and continue"}
        </Button>
        <button type="button" onClick={logout} className="mt-4 w-full text-center text-sm text-muted-foreground underline">
          Not now, log me out
        </button>
      </div>
    </div>
  );
}
