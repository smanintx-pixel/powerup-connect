import { Link } from "wouter";
import { Logo, Wordmark } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Users, NotebookPen, CalendarHeart, Linkedin } from "lucide-react";
import powerUpLogo from "@/assets/power-up-logo.png";
import sampleDenise from "@/assets/sample-denise.jpg";
import sampleCheryl from "@/assets/sample-cheryl.jpg";
import sampleTamika from "@/assets/sample-tamika.jpg";
import { Reveal, BlurWords, stagger } from "@/components/motion";

/**
 * Sample cards for the hero. The three women are invented and their portraits are
 * AI-generated illustrations; none of them is a real attendee.
 */
const SAMPLE = [
  { photo: sampleDenise, name: "Denise Carter", role: "Founder & CEO", tags: ["Fundraising", "Fintech"], shape: "pu-shape-0", tilt: "-rotate-3", offset: "" },
  { photo: sampleCheryl, name: "Cheryl Washington", role: "Financial Advisor", tags: ["Wealth", "Mentoring"], shape: "pu-shape-1", tilt: "rotate-2", offset: "ml-auto -mt-3" },
  { photo: sampleTamika, name: "Tamika Brooks", role: "Career Coach", tags: ["Leadership", "Speaking"], shape: "pu-shape-2", tilt: "-rotate-1", offset: "ml-6 -mt-3" },
];

const FEATURES = [
  {
    icon: Users,
    title: "Find your people",
    body: "Search the attendee directory by name, company or interest and see who’s in the room with you.",
    tone: "pu-blue text-white",
    shape: "rounded-[72px_24px_24px_24px]",
    offset: "",
  },
  {
    icon: NotebookPen,
    title: "Remember every conversation",
    body: "Keep private notes and follow-up reminders on everyone you connect with. Only you can see them.",
    tone: "pu-purple text-white",
    shape: "rounded-[24px_24px_72px_24px]",
    offset: "sm:mt-10",
  },
  {
    icon: CalendarHeart,
    title: "Stay connected all year",
    body: "Your network doesn’t end when the conference does. Message and revisit connections any time.",
    tone: "pu-sun text-[#0B1440]",
    shape: "rounded-[24px_72px_24px_24px]",
    offset: "sm:mt-4",
  },
];

export default function Landing() {
  return (
    <div className="min-h-dvh bg-background overflow-x-hidden">
      <header className="relative z-10 flex items-center justify-between gap-3 px-4 sm:px-8 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2.5">
          <Logo className="h-9 w-9" />
          <Wordmark className="text-lg" />
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/login">
            <Button variant="outline" size="sm" data-testid="link-login-header">
              Log in
            </Button>
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="relative pu-hero text-white overflow-hidden">
        <span className="pu-aurora" aria-hidden="true" />
        <div className="pu-ring pu-float -left-28 -top-36 h-56 w-56 border-[24px] md:-left-36 md:-top-44 md:h-72 md:w-72 md:border-[30px] border-[#FFC933] opacity-90" aria-hidden="true" />
        <div className="pu-ring pu-float-slow right-[38%] -bottom-14 h-44 w-44 border-[22px] border-[#02AFEF] opacity-70" aria-hidden="true" />
        <div className="pu-ring -right-20 top-16 h-32 w-32 border-[16px] md:-right-16 md:top-10 md:h-40 md:w-40 md:border-[20px] border-[#70C040] opacity-75" aria-hidden="true" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-8 pt-12 pb-28 md:pt-20 md:pb-36 grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          <div>
            <p className="text-xs sm:text-sm font-bold tracking-[0.16em] uppercase text-[#FFD23F] mb-4 pu-rise-now">
              Power Up Women&rsquo;s Conference 2027
            </p>
            <h1 className="font-serif font-black text-4xl sm:text-5xl md:text-6xl leading-[1.02] tracking-tight drop-shadow-[0_6px_24px_rgba(11,20,64,0.45)] pu-rise-now" style={stagger(1)}>
              Your next power move starts with
            </h1>
            <p className="font-script text-5xl sm:text-6xl md:text-7xl leading-none text-[#FFD23F] -rotate-3 origin-left mt-2 mb-8 ml-2 pu-rise-now" style={stagger(2)}>
              a connection.
            </p>
            <BlurWords
              className="text-base md:text-lg text-[#FBEFFF] max-w-md mb-8 leading-relaxed"
              text="PowerUp Connect is the official networking app for attendees of the Power Up Women’s Conference. Find the right people in the room, trade contact info and keep the relationship alive long after the closing keynote."
            />
            <div className="flex flex-wrap gap-3">
              <Link href="/signup">
                <Button size="lg" variant="gold" className="pu-glow" data-testid="link-signup-hero">
                  Create your account
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-white/10 text-white [border-color:rgba(255,255,255,0.7)]"
                  data-testid="link-login-hero"
                >
                  I already have an account
                </Button>
              </Link>
            </div>
          </div>

          {/* Stack of sample attendee cards */}
          <div className="relative max-w-sm w-full mx-auto md:mx-0 md:ml-auto" aria-hidden="true">
            {SAMPLE.map((p, i) => (
              <div
                key={p.name}
                className={`relative w-[86%] pu-card-in ${p.offset}`}
                style={stagger(i)}
              >
              <div className={`bg-white text-[#0B1440] p-4 shadow-xl pu-bob ${p.shape} ${p.tilt}`} style={stagger(i)}>
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={p.photo}
                    alt=""
                    width={48}
                    height={48}
                    className="h-12 w-12 rounded-full object-cover shrink-0 ring-2 ring-[#FFC933]"
                  />
                  <div className="min-w-0">
                    <p className="font-serif font-extrabold leading-tight">{p.name}</p>
                    <p className="text-xs text-[#33406B]">{p.role}</p>
                  </div>
                  <Linkedin className="h-4 w-4 ml-auto text-[#0A5BB8]" />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {p.tags.map((t) => (
                    <span key={t} className="text-[11px] font-semibold rounded-full bg-[#EEE8FA] text-[#44158F] px-2.5 py-1">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              </div>
            ))}
          </div>
        </div>

        <svg
          aria-hidden="true"
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          className="absolute left-0 -bottom-px block w-full h-[70px] md:h-[110px] text-background"
        >
          <path fill="currentColor" d="M0,120 L1440,120 L1440,34 C1040,140 420,-28 0,90 Z" />
        </svg>
      </section>

      {/* ACCESS CODE */}
      <Reveal as="section" className="max-w-6xl mx-auto px-4 sm:px-8 -mt-2 md:-mt-6 relative z-10">
        <div className="pu-rise">
        <div className="pu-shape-0 border-2 border-card-border bg-card pu-card-tint shadow-md px-5 py-4 sm:px-7 sm:py-5 max-w-xl -rotate-1">
          <p className="text-sm font-semibold mb-1">Access is included with your conference registration</p>
          <p className="text-sm text-muted-foreground">
            Use the demo access code{" "}
            <code
              className="font-mono font-bold bg-accent/30 text-accent-foreground rounded-md px-1.5 py-0.5"
              data-testid="text-demo-access-code"
            >
              POWERUP2027
            </code>{" "}
            to explore the prototype.
          </p>
        </div>
        </div>
      </Reveal>

      {/* FEATURES */}
      <Reveal as="section" className="max-w-6xl mx-auto px-4 sm:px-8 pt-14 pb-20 md:pt-20 md:pb-28">
        <div className="pu-rise">
          <p className="font-script text-3xl text-primary -rotate-2 origin-left mb-1">Live with</p>
          <h2 className="font-serif font-black text-3xl sm:text-4xl md:text-5xl leading-none tracking-tight mb-10">
            purpose, passion and <span className="pu-text-grad">power.</span>
          </h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-5 md:gap-6 items-start">
          {FEATURES.map((f, i) => (
            <div key={f.title} className={`pu-rise ${f.offset}`} style={stagger(i + 1)}>
              <div className={`${f.tone} ${f.shape} p-7 pt-9 shadow-lg pu-lift`}>
                <f.icon className="h-7 w-7 mb-4" />
                <h3 className="font-serif font-extrabold text-xl mb-2">{f.title}</h3>
                <p className="text-sm leading-relaxed opacity-95">{f.body}</p>
              </div>
            </div>
          ))}
        </div>
      </Reveal>

      {/* FOOTER */}
      <footer className="pu-night text-[#DCE2FF]">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <a
            href="https://powerupwomensconference.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-xl bg-white px-4 py-3"
            data-testid="link-conference-site"
          >
            <img src={powerUpLogo} alt="Power Up Women's Conference website" className="h-6 sm:h-7 w-auto" />
          </a>
          <div className="text-xs space-y-1 sm:text-right">
            <p>PowerUp Connect, the networking app for the Power Up Women&rsquo;s Conference</p>
            <p className="opacity-80">Prototype build &middot; not for production use</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
