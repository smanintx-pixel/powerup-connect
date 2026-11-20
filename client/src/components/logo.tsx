import { useState } from "react";
import powerButton from "@/assets/power-button.png";

interface LogoProps {
  className?: string;
  /** Kept for compatibility with earlier call sites. The brand mark is always shown in colour. */
  monochrome?: boolean;
}

// The "power on" intro plays when the app first opens, not on every screen
// change. Every logo that appears in the first moments gets it; later ones
// just keep the gentle glow.
let firstShownAt = 0;
function useIntro(): boolean {
  const [intro] = useState(() => {
    const now = Date.now();
    if (!firstShownAt) firstShownAt = now;
    return now - firstShownAt < 1500;
  });
  return intro;
}

/** The Power Up power button, the conference's brand mark. It powers on, then glows softly. */
export function Logo({ className }: LogoProps) {
  const intro = useIntro();
  return (
    <span className={`pu-logo relative inline-block shrink-0 align-middle ${intro ? "pu-logo-intro" : ""} ${className ?? ""}`}>
      <img
        src={powerButton}
        alt="Power Up Women's Conference"
        className="relative block h-full w-full"
        width={256}
        height={256}
        decoding="async"
      />
    </span>
  );
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <div className={className}>
      <Logo className="h-full w-full" />
    </div>
  );
}

/** App name set in the brand display face, with "Connect" in the brand purple and a passing shine. */
export function Wordmark({ className, onDark }: { className?: string; onDark?: boolean }) {
  const intro = useIntro();
  return (
    <span className={`font-serif font-extrabold tracking-tight ${className ?? ""}`}>
      <span className={intro ? "pu-word-intro inline-block" : "inline-block"}>PowerUp</span>{" "}
      <span
        className={`inline-block ${onDark ? "text-[#FFD23F] pu-word-shine-gold" : "text-primary pu-word-shine"} ${intro ? "pu-word-intro pu-word-intro-2" : ""}`}
      >
        Connect
      </span>
    </span>
  );
}
