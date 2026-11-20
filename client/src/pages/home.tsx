import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Users,
  Heart,
  MessageCircle,
  Presentation,
  UserRound,
  Check,
  ArrowRight,
  Calendar,
  Lock,
  Ticket,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { InitialsAvatar } from "@/components/initials-avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { PowerBadge } from "@/components/power-badge";
import { Reveal, CountUp, BlurWords, stagger } from "@/components/motion";
import type { PublicUser, Connection, Message } from "@shared/schema";

type ConnectionWithUser = Connection & { user: PublicUser };
type Conversation = { user: PublicUser; lastMessage: Message | null };

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || "there";
}

// Reminder dates are stored as YYYY-MM-DD. Compare them as local calendar days.
function daysUntil(isoDate: string) {
  const [y, m, d] = isoDate.split("-").map(Number);
  if (!y || !m || !d) return null;
  const target = new Date(y, m - 1, d).getTime();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((target - today) / 86_400_000);
}

function dueLabel(days: number) {
  if (days < 0) return days === -1 ? "1 day overdue" : `${-days} days overdue`;
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
}

export default function Home() {
  const { user, authedFetch } = useAuth();

  const directory = useQuery<{ users: PublicUser[] }>({
    queryKey: ["/api/directory"],
    queryFn: async () => {
      const res = await authedFetch("/api/directory");
      if (!res.ok) throw new Error("Could not load the directory.");
      return res.json();
    },
  });
  const connections = useQuery<{ connections: ConnectionWithUser[] }>({
    queryKey: ["/api/connections"],
    queryFn: async () => {
      const res = await authedFetch("/api/connections");
      if (!res.ok) throw new Error("Could not load connections.");
      return res.json();
    },
  });
  const messages = useQuery<{ conversations: Conversation[] }>({
    queryKey: ["/api/messages"],
    queryFn: async () => {
      const res = await authedFetch("/api/messages");
      if (!res.ok) throw new Error("Could not load messages.");
      return res.json();
    },
  });

  const attendeeCount = directory.data?.users.length;
  const connectionCount = connections.data?.connections.length;
  const conversationCount = messages.data?.conversations.length;

  const followUps = useMemo(() => {
    return (connections.data?.connections ?? [])
      .map((c) => ({ conn: c, days: c.reminderDate ? daysUntil(c.reminderDate) : null }))
      .filter((x): x is { conn: ConnectionWithUser; days: number } => x.days !== null && x.days <= 14)
      .sort((a, b) => a.days - b.days);
  }, [connections.data]);

  const profileDone = Boolean(
    user && user.title && user.company && user.bio && user.tags && user.tags.length > 0 &&
      user.interests && user.interests.length > 0
  );
  const steps = [
    {
      key: "profile",
      done: profileDone,
      title: "Finish your profile",
      body: "Add a photo, your title and company, a short bio, tags and what you are here for, so the right women can find you.",
      href: "/settings",
      cta: "Edit profile",
      icon: UserRound,
    },
    {
      key: "directory",
      done: (connectionCount ?? 0) > 0 || (conversationCount ?? 0) > 0,
      title: "See who is in the room",
      body: "Browse the directory and search by name, company or tag.",
      href: "/directory",
      cta: "Open directory",
      icon: Users,
    },
    {
      key: "connect",
      done: (connectionCount ?? 0) > 0,
      title: "Save your first connection",
      body: "Met someone worth remembering? Save her with a private note and a follow-up date.",
      href: "/directory",
      cta: "Find her",
      icon: Heart,
    },
    {
      key: "message",
      done: (conversationCount ?? 0) > 0,
      title: "Send a message",
      body: "Say hello while the conversation is still fresh.",
      href: "/messages",
      cta: "Open messages",
      icon: MessageCircle,
    },
  ];
  const loaded = !directory.isLoading && !connections.isLoading && !messages.isLoading;
  const doneCount = steps.filter((s) => s.done).length;
  const allDone = loaded && doneCount === steps.length;
  const nextStep = steps.find((s) => !s.done);

  const stats = [
    { label: attendeeCount === 1 ? "woman in the directory" : "women in the directory", value: attendeeCount, href: "/directory", tone: "pu-blue", shape: "pu-shape-0" },
    { label: connectionCount === 1 ? "connection saved" : "connections saved", value: connectionCount, href: "/connections", tone: "pu-purple", shape: "pu-shape-1" },
    { label: conversationCount === 1 ? "conversation" : "conversations", value: conversationCount, href: "/messages", tone: "pu-green", shape: "pu-shape-2" },
  ];

  const guide = [
    {
      icon: Users,
      title: "Directory",
      body: "Everyone at the conference who has joined the app. Open a profile to read her bio and connect.",
      href: "/directory",
    },
    {
      icon: Heart,
      title: "Connections",
      body: "The women you saved, with your private notes and the date you want to follow up.",
      href: "/connections",
    },
    {
      icon: MessageCircle,
      title: "Messages",
      body: "One-to-one messages with other attendees. No phone numbers needed.",
      href: "/messages",
    },
    {
      icon: Presentation,
      title: "Sessions",
      body: "Each session with its recording and any presentations, handouts or guides.",
      href: "/sessions",
    },
  ];

  return (
    <AppShell>
      {/* Welcome */}
      <section className="pu-hero relative overflow-hidden text-white" data-testid="section-home-hero">
        <span className="pu-aurora" aria-hidden="true" />
        <span className="pu-ring pu-float" style={{ width: 220, height: 220, borderWidth: 28, borderColor: "#FFC933", right: -110, top: -120, opacity: 0.9 }} />
        <span className="pu-ring pu-float-slow" style={{ width: 120, height: 120, borderWidth: 16, borderColor: "#02AFEF", right: 110, bottom: -60, opacity: 0.75 }} />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-16 md:pt-12 md:pb-20">
          <p className="font-script text-2xl md:text-3xl text-[#FFD23F] -rotate-2 inline-block mb-1 pu-rise-now">
            You&rsquo;re in the room
          </p>
          <h1 className="text-3xl md:text-5xl font-extrabold leading-tight tracking-tight pu-rise-now" style={stagger(1)} data-testid="text-home-welcome">
            Welcome, {user ? firstName(user.name) : "there"}.
          </h1>
          <PowerBadge pastYears={user?.pastYears} className="mt-2 text-xs px-3 py-1.5 shadow-md pu-rise-now" />
          <BlurWords
            className="mt-3 max-w-xl text-base md:text-lg text-white/90 leading-relaxed"
            text="PowerUp Connect keeps the women you meet at Power Up within reach. Find her, save what you talked about, and follow up long after the day ends."
          />
          {nextStep && loaded && (
            <Link href={nextStep.href}>
              <Button variant="gold" size="lg" className="mt-6 pu-glow" data-testid="button-home-next-step">
                {nextStep.title}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
        <svg aria-hidden="true" viewBox="0 0 1440 80" preserveAspectRatio="none" className="absolute left-0 -bottom-px block w-full h-10 md:h-14">
          <path className="fill-background" d="M0,80 L1440,80 L1440,22 C1040,92 420,-18 0,58 Z" />
        </svg>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-10 space-y-10">
        {/* At a glance */}
        <Reveal as="section" aria-label="At a glance" className="grid grid-cols-3 gap-3 md:gap-4 -mt-2">
          {stats.map((s, i) => (
            <Link key={s.href} href={s.href} className="block min-w-0 pu-rise" style={stagger(i)}>
              <div
                className={`${s.tone} ${s.shape} text-white p-4 md:p-5 h-full hover-elevate active-elevate-2 shadow-md pu-lift`}
                data-testid={`stat-${s.href.slice(1)}`}
              >
                <p className="text-3xl md:text-4xl font-extrabold leading-none">
                  {s.value === undefined ? "–" : <CountUp value={s.value} />}
                </p>
                <p className="mt-1.5 text-xs md:text-sm font-semibold text-white/90 leading-snug">{s.label}</p>
              </div>
            </Link>
          ))}
        </Reveal>

        {/* Follow-ups */}
        {followUps.length > 0 && (
          <Reveal as="section" aria-labelledby="home-followups">
            <h2 id="home-followups" className="text-lg font-extrabold mb-3 flex items-center gap-2 pu-rise">
              <Calendar className="h-5 w-5 text-primary" />
              Follow-ups coming up
            </h2>
            <ul className="space-y-2.5" role="list">
              {followUps.slice(0, 3).map(({ conn, days }, i) => (
                <li key={conn.id} className="pu-rise" style={stagger(i + 1)}>
                  <Link href={`/attendee/${conn.user.id}`} className="block min-w-0">
                    <div className="rounded-xl border border-card-border bg-card p-4 flex items-center gap-3 hover-elevate active-elevate-2" data-testid={`followup-${conn.user.id}`}>
                      <InitialsAvatar name={conn.user.name} photoUrl={conn.user.photoUrl} className="h-10 w-10 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate">{conn.user.name}</p>
                        {conn.note && <p className="text-xs text-muted-foreground truncate">{conn.note}</p>}
                      </div>
                      <span className={`text-xs font-bold shrink-0 ${days < 0 ? "text-destructive" : "text-primary"}`}>
                        {dueLabel(days)}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
            {followUps.length > 3 && (
              <Link href="/connections" className="inline-block mt-3 text-sm font-semibold text-primary">
                See all {followUps.length} follow-ups
              </Link>
            )}
          </Reveal>
        )}

        {/* Getting started */}
        {!allDone && (
          <Reveal as="section" aria-labelledby="home-start">
            <div className="flex items-baseline justify-between gap-3 mb-3 pu-rise">
              <h2 id="home-start" className="text-lg font-extrabold">Get started</h2>
              {loaded && (
                <span className="text-sm font-semibold text-muted-foreground" data-testid="text-home-progress">
                  {doneCount} of {steps.length} done
                </span>
              )}
            </div>
            <ol className="space-y-2.5" role="list">
              {steps.map((step, i) => (
                <li key={step.key} className="pu-rise" style={stagger(i + 1)}>
                  <div
                    className={`rounded-xl border p-4 flex items-start gap-3 ${
                      step.done ? "border-card-border bg-muted/50" : "border-card-border bg-card"
                    }`}
                    data-testid={`step-${step.key}`}
                  >
                    <span
                      className={`shrink-0 h-9 w-9 rounded-full flex items-center justify-center text-sm font-extrabold ${
                        step.done ? "pu-green text-white pu-pop" : "pu-purple text-white"
                      } ${loaded && step.key === nextStep?.key ? "pu-pulse" : ""}`}
                      style={stagger(i + 1)}
                      aria-hidden="true"
                    >
                      {step.done ? <Check className="h-4 w-4" /> : i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-bold ${step.done ? "text-muted-foreground line-through" : ""}`}>
                        {step.title}
                        {step.done && <span className="sr-only"> (done)</span>}
                      </p>
                      {!step.done && <p className="text-sm text-muted-foreground mt-0.5">{step.body}</p>}
                    </div>
                    {!step.done && (
                      <Link href={step.href} className="shrink-0">
                        <Button size="sm" variant="outline" data-testid={`button-step-${step.key}`}>
                          {step.cta}
                        </Button>
                      </Link>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </Reveal>
        )}

        {/* What's here */}
        <Reveal as="section" aria-labelledby="home-guide">
          <h2 id="home-guide" className="text-lg font-extrabold mb-3 pu-rise">What&rsquo;s in the app</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {guide.map((g, i) => (
              <Link key={g.title} href={g.href} className="block min-w-0 pu-rise" style={stagger(i + 1)}>
                <div className={`pu-card-tint pu-shape-${i % 4} border border-card-border p-5 h-full hover-elevate active-elevate-2 pu-lift`} data-testid={`guide-${g.title.toLowerCase()}`}>
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <g.icon className="h-5 w-5 text-primary" />
                    <h3 className="text-base font-bold">{g.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{g.body}</p>
                </div>
              </Link>
            ))}
          </div>
        </Reveal>

        {/* Good to know */}
        <Reveal as="section" aria-labelledby="home-know">
          <div className="rounded-2xl border border-card-border bg-card p-5 pu-rise">
          <h2 id="home-know" className="text-base font-extrabold mb-3">Good to know</h2>
          <ul className="space-y-3 text-sm text-muted-foreground" role="list">
            <li className="flex gap-3">
              <Lock className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
              <span>Your notes and follow-up dates are private. Only you can see them.</span>
            </li>
            <li className="flex gap-3">
              <Ticket className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
              <span>Everyone here joined with a conference access code.</span>
            </li>
            <li className="flex gap-3">
              <UserRound className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
              <span>Other attendees see your photo, name, title, company, bio, tags, what you are here for and your LinkedIn link. Your email stays hidden, and your phone number shows only if you turn that on.</span>
            </li>
          </ul>
          </div>
        </Reveal>
      </div>
    </AppShell>
  );
}
