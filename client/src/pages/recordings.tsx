import { AppShell } from "@/components/app-shell";
import { PlayCircle, Clock } from "lucide-react";
import { BrandRings } from "@/components/brand-rings";

const SESSIONS = [
  {
    id: "live-with-purpose",
    title: "Live with Purpose",
    description: "Opening keynote on defining your mission and leading with intention.",
  },
  {
    id: "live-with-passion",
    title: "Live with Passion",
    description: "A candid conversation on turning what you love into lasting impact.",
  },
  {
    id: "live-with-power",
    title: "Live with Power",
    description: "Closing keynote on owning your influence and making your next power move.",
  },
  {
    id: "trailblazer-legacy-panel",
    title: "Trailblazer & Legacy Honoree Panel",
    description: "Honorees reflect on the paths they forged and the ones still ahead.",
  },
  {
    id: "negotiation-workshop",
    title: "The Art of the Ask: Negotiation Workshop",
    description: "Hands-on strategies for negotiating pay, deals, and boardroom seats.",
  },
  {
    id: "capital-and-community",
    title: "Capital & Community: Funding Your Vision",
    description: "Founders and investors on raising capital without losing your voice.",
  },
];

export default function Recordings() {
  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 md:py-10">
        <h1 className="text-2xl font-extrabold mb-1">Session recordings</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Recordings from the Power Up Women&rsquo;s Conference will appear here after the
          event.
        </p>

        <div className="pu-shape-0 pu-night text-white p-6 sm:p-8 mb-6 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left shadow-lg">
          <BrandRings className="w-32 shrink-0" />
          <div>
            <h2 className="text-base font-bold mb-1">Recordings aren&rsquo;t live yet</h2>
            <p className="text-sm text-[#DCE2FF]" data-testid="text-recordings-global-empty">
              Recordings will be posted here after the event. Check back once the conference
              wraps to relive every session.
            </p>
          </div>
        </div>

        <ul className="space-y-3" role="list">
          {SESSIONS.map((session) => (
            <li
              key={session.id}
              className="rounded-xl border border-card-border bg-card p-5 flex items-start gap-4"
              data-testid={`card-session-${session.id}`}
            >
              <div className="h-11 w-11 rounded-full pu-purple flex items-center justify-center shrink-0">
                <PlayCircle className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium mb-0.5" data-testid={`text-session-title-${session.id}`}>
                  {session.title}
                </p>
                <p className="text-sm text-muted-foreground mb-2">{session.description}</p>
                <span
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted rounded-full px-2.5 py-1"
                  data-testid={`text-session-status-${session.id}`}
                >
                  <Clock className="h-3 w-3" />
                  Recording will be posted here after the event
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  );
}
