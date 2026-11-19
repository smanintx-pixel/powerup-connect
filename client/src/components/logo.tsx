import powerButton from "@/assets/power-button.png";

interface LogoProps {
  className?: string;
  /** Kept for compatibility with earlier call sites. The brand mark is always shown in colour. */
  monochrome?: boolean;
}

/** The Power Up power button, the conference's brand mark. */
export function Logo({ className }: LogoProps) {
  return (
    <img
      src={powerButton}
      alt="Power Up Women's Conference"
      className={className}
      width={256}
      height={256}
      decoding="async"
    />
  );
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <div className={className}>
      <Logo className="h-full w-full" />
    </div>
  );
}

/** App name set in the brand display face, with "Connect" in the brand purple. */
export function Wordmark({ className, onDark }: { className?: string; onDark?: boolean }) {
  return (
    <span className={`font-serif font-extrabold tracking-tight ${className ?? ""}`}>
      PowerUp <span className={onDark ? "text-[#FFD23F]" : "text-primary"}>Connect</span>
    </span>
  );
}
