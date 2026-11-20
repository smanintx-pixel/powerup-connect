import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Small motion helpers for the Home page, in the spirit of the conference website:
 * content rises in as it arrives, numbers count up, the hero line blurs in.
 * Everything is CSS plus a few lines of script (no animation library), and every
 * effect is switched off when the device asks for reduced motion.
 */

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** Stagger position for a `.pu-rise` child: `style={stagger(i)}`. */
export function stagger(i: number): CSSProperties {
  return { ["--i" as string]: i } as CSSProperties;
}

/**
 * Wraps a block whose `.pu-rise` children fade and rise in, one after another,
 * the first time the block scrolls into view.
 */
export function Reveal({
  as = "div",
  className,
  children,
  ...rest
}: {
  as?: "div" | "section";
  className?: string;
  children: ReactNode;
  "aria-label"?: string;
  "aria-labelledby"?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.05 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const Tag = as as "div";
  return (
    <Tag ref={ref as React.RefObject<HTMLDivElement>} className={cn("pu-reveal", shown && "pu-in", className)} {...rest}>
      {children}
    </Tag>
  );
}

/** Counts from the previous value (0 at first) up to `value`. Screen readers get the final number. */
export function CountUp({ value, duration = 900 }: { value: number; duration?: number }) {
  const [shown, setShown] = useState(() => (prefersReducedMotion() ? value : 0));
  const from = useRef(prefersReducedMotion() ? value : 0);

  useEffect(() => {
    if (prefersReducedMotion() || typeof requestAnimationFrame === "undefined") {
      from.current = value;
      setShown(value);
      return;
    }
    const start = from.current;
    if (start === value) {
      setShown(value);
      return;
    }
    let raf = 0;
    let t0: number | null = null;
    const tick = (t: number) => {
      if (t0 === null) t0 = t;
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const current = Math.round(start + (value - start) * eased);
      from.current = current;
      setShown(current);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return (
    <>
      <span aria-hidden="true">{shown}</span>
      <span className="sr-only">{value}</span>
    </>
  );
}

/** A paragraph whose words blur into focus one after another. Read as one plain sentence by screen readers. */
export function BlurWords({ text, className }: { text: string; className?: string }) {
  const words = text.trim().split(/\s+/);
  return (
    <p className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((w, i) => (
          <span key={i}>
            <span className="pu-blur-word" style={stagger(i)}>
              {w}
            </span>
            {i < words.length - 1 ? " " : ""}
          </span>
        ))}
      </span>
    </p>
  );
}
