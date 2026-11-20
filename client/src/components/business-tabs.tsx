import { Link } from "wouter";
import { ShoppingBag, Briefcase } from "lucide-react";

/** Switch between the two halves of the Businesses tab. */
export function BusinessTabs({ current }: { current: "shop" | "owners" }) {
  const tabs = [
    { key: "shop", href: "/businesses", label: "Shop Black-owned", icon: ShoppingBag },
    { key: "owners", href: "/resources", label: "For business owners", icon: Briefcase },
  ] as const;
  return (
    <nav aria-label="Businesses sections" className="grid grid-cols-2 gap-1.5 rounded-full border border-card-border bg-muted p-1.5" data-testid="business-tabs">
      {tabs.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          aria-current={current === t.key ? "page" : undefined}
          data-testid={`business-tab-${t.key}`}
          className={`flex items-center justify-center gap-1.5 rounded-full px-2 py-2.5 text-[13px] min-[440px]:text-sm font-bold hover-elevate active-elevate-2 ${
            current === t.key ? "pu-purple text-white shadow-sm" : "text-foreground"
          }`}
        >
          <t.icon className="hidden min-[440px]:block h-4 w-4 shrink-0" />
          <span className="truncate">{t.label}</span>
        </Link>
      ))}
    </nav>
  );
}
