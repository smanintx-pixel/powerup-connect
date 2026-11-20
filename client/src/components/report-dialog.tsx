import { useState } from "react";
import { Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth-context";
import { REPORT_REASONS } from "@shared/legal";

/** "Report" link that opens a short form sent to the owners. */
export function ReportDialog({ userId, name, className }: { userId: number; name: string; className?: string }) {
  const { authedFetch } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>("");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const first = name.split(" ")[0] || "this attendee";

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await authedFetch(`/api/users/${userId}/report`, { method: "POST", body: JSON.stringify({ reason, details }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message ?? "Could not send the report.");
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the report.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) {
          setReason("");
          setDetails("");
          setError(null);
          setSent(false);
        }
      }}
    >
      <DialogTrigger asChild>
        <button type="button" className={`inline-flex items-center gap-1.5 text-xs text-muted-foreground underline ${className ?? ""}`} data-testid="button-report">
          <Flag className="h-3.5 w-3.5" />
          Report {first}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        {sent ? (
          <>
            <DialogHeader>
              <DialogTitle>Thank you for telling us</DialogTitle>
              <DialogDescription>
                The conference team will review it. {first} is not told who reported her. If you do not want to hear from her, you can
                remove her as a connection or decline her request.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={() => setOpen(false)} data-testid="button-report-done">Done</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Report {first}</DialogTitle>
              <DialogDescription>Your report goes to the conference team, not to {first}.</DialogDescription>
            </DialogHeader>
            <fieldset className="space-y-2" data-testid="report-reasons">
              <legend className="text-sm font-semibold mb-1">What is happening?</legend>
              {REPORT_REASONS.map((r) => (
                <label key={r} className="flex items-center gap-2.5 text-sm cursor-pointer">
                  <input type="radio" name="report-reason" value={r} checked={reason === r} onChange={() => setReason(r)} className="h-4 w-4 accent-[hsl(var(--primary))]" />
                  {r}
                </label>
              ))}
            </fieldset>
            <div>
              <label htmlFor="report-details" className="text-sm font-semibold block mb-1">Anything else we should know? (optional)</label>
              <Textarea id="report-details" value={details} maxLength={2000} onChange={(e) => setDetails(e.target.value)} className="min-h-[80px]" data-testid="textarea-report-details" />
            </div>
            <p className="text-xs text-muted-foreground">If someone is in danger, call 911.</p>
            {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={submit} disabled={!reason || busy} data-testid="button-report-send">{busy ? "Sending..." : "Send report"}</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
