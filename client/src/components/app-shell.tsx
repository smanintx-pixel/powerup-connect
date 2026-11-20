import { type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { House, Users, Heart, MessageCircle, Presentation, Store, Briefcase, Settings, LogOut } from "lucide-react";
import { Logo, Wordmark } from "@/components/logo";
import { useAuth } from "@/lib/auth-context";
import { InitialsAvatar } from "@/components/initials-avatar";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

// `short` is the label on the phone's bottom bar, where seven tabs share the width.
const NAV_ITEMS = [
  { href: "/home", label: "Home", short: "Home", icon: House },
  { href: "/directory", label: "Directory", short: "Directory", icon: Users },
  { href: "/connections", label: "Connections", short: "Connect", icon: Heart },
  { href: "/messages", label: "Messages", short: "Messages", icon: MessageCircle },
  { href: "/sessions", label: "Sessions", short: "Sessions", icon: Presentation },
  { href: "/businesses", label: "Businesses", short: "Shop", icon: Store },
  { href: "/resources", label: "Resources", short: "Resources", icon: Briefcase },
];

function isActive(location: string, href: string) {
  return location === href;
}

export function AppShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { user, logout, authedFetch } = useAuth();
  // Same query as the Connections page, so the two stay in step.
  const { data: connData } = useQuery<{ incoming?: unknown[] }>({
    queryKey: ["/api/connections"],
    queryFn: async () => {
      const res = await authedFetch("/api/connections");
      if (!res.ok) throw new Error("Could not load connections.");
      return res.json();
    },
    enabled: !!user,
    // Fresh on every screen change and every 20 seconds, so a new request shows up promptly.
    refetchOnMount: "always",
    refetchInterval: 20000,
  });
  const requestCount = connData?.incoming?.length ?? 0;
  const badgeFor = (href: string) => (href === "/connections" ? requestCount : 0);

  return (
    <div className="min-h-dvh flex flex-col md:flex-row bg-background">
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex md:w-64 md:flex-col md:border-r md:border-sidebar-border md:bg-sidebar md:h-dvh md:sticky md:top-0"
        aria-label="Main navigation"
      >
        <div className="flex items-center gap-2 px-6 py-6">
          <Logo className="h-8 w-8" />
          <Wordmark className="text-lg text-sidebar-foreground" />
        </div>
        <nav className="flex-1 px-3 space-y-1" data-testid="nav-desktop">
          {NAV_ITEMS.map((item) => {
            const active = isActive(location, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                data-testid={`link-nav-${item.label.toLowerCase()}`}
                className={`flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-semibold hover-elevate active-elevate-2 ${
                  active
                    ? "pu-purple text-white shadow-sm"
                    : "text-sidebar-foreground/80"
                }`}
              >
                <item.icon className="h-[18px] w-[18px]" />
                {item.label}
                {badgeFor(item.href) > 0 && (
                  <span className="ml-auto min-w-5 h-5 px-1.5 rounded-full bg-[#FFC933] text-[#0B1440] text-[11px] font-extrabold flex items-center justify-center" data-testid="badge-requests">
                    {badgeFor(item.href)}
                    <span className="sr-only"> requests to connect</span>
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="px-3 pb-4 space-y-1">
          <Link
            href="/settings"
            data-testid="link-nav-settings"
            className={`flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-semibold hover-elevate active-elevate-2 ${
              location === "/settings"
                ? "pu-purple text-white shadow-sm"
                : "text-sidebar-foreground/80"
            }`}
          >
            <Settings className="h-[18px] w-[18px]" />
            Settings
          </Link>
          {user && (
            <div className="flex items-center gap-3 rounded-lg px-3 py-3 mt-2 border-t border-sidebar-border pt-4">
              <InitialsAvatar name={user.name} photoUrl={user.photoUrl} className="h-9 w-9" testId="avatar-current-user" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate" data-testid="text-current-user-name">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.title || "Attendee"}</p>
              </div>
              <ThemeToggle />
            </div>
          )}
        </div>
      </aside>

      {/* Mobile header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 border-b-2 border-border bg-card sticky top-0 z-40">
        <Link href="/home" className="flex items-center gap-2">
          <Logo className="h-7 w-7" />
          <Wordmark className="text-base" />
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Link
            href="/settings"
            aria-label="Settings"
            data-testid="link-nav-mobile-settings"
            className={`inline-flex h-9 w-9 items-center justify-center rounded-full hover-elevate active-elevate-2 ${
              location === "/settings" ? "text-primary" : ""
            }`}
          >
            <Settings className="h-[18px] w-[18px]" />
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            aria-label="Log out"
            data-testid="button-logout-mobile"
          >
            <LogOut className="h-[18px] w-[18px]" />
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 pb-20 md:pb-0" id="main-content">
        {children}
      </main>

      {/* Mobile bottom tab nav */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t-2 border-border grid grid-cols-7 shadow-[0_-10px_24px_-14px_rgba(106,33,196,0.35)]"
        aria-label="Main navigation"
        data-testid="nav-mobile"
      >
        {NAV_ITEMS.map((item) => {
          const active = isActive(location, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              data-testid={`link-nav-mobile-${item.label.toLowerCase()}`}
              className={`relative min-w-0 flex flex-col items-center justify-center gap-1 py-2.5 min-h-[56px] hover-elevate active-elevate-2 ${
                active ? "text-primary pu-tab-active" : "text-muted-foreground"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] min-[440px]:text-[11px] font-semibold leading-none tracking-tight" aria-hidden="true">{item.short}</span>
              <span className="sr-only">{item.label}</span>
              {badgeFor(item.href) > 0 && (
                <span className="absolute top-1.5 left-1/2 ml-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#FFC933] text-[#0B1440] text-[10px] font-extrabold flex items-center justify-center" data-testid="badge-requests-mobile">
                  {badgeFor(item.href)}
                  <span className="sr-only"> requests to connect</span>
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
