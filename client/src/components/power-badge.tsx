import { Crown, Star } from "lucide-react";
import { loyaltyBadge } from "@shared/event";
import { cn } from "@/lib/utils";

/**
 * "Power Legend" (4 or more past conferences) or "Power Up All-Star" (2 or 3).
 * Renders nothing for anyone else.
 */
export function PowerBadge({ pastYears, className }: { pastYears: readonly number[] | undefined; className?: string }) {
  const badge = loyaltyBadge(pastYears);
  if (!badge) return null;
  const count = new Set(pastYears).size;
  const legend = badge.key === "legend";
  const Icon = legend ? Crown : Star;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide whitespace-nowrap",
        legend ? "pu-sun text-[#0B1440]" : "pu-purple text-white",
        className
      )}
      title={`Attended ${count} Power Up conferences`}
      data-testid={`badge-${badge.key}`}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {badge.label}
      <span className="sr-only">, attended {count} Power Up conferences</span>
    </span>
  );
}
