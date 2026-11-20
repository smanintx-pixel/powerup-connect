import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Logo, Wordmark } from "@/components/logo";
import { useAuth } from "@/lib/auth-context";
import { TermsContent, PrivacyContent, LEGAL_STATUS } from "@/content/legal";

/** The Terms of Service or Privacy Policy. Open to everyone, signed in or not. */
export default function LegalPage({ kind }: { kind: "terms" | "privacy" }) {
  const { user } = useAuth();
  const title = kind === "terms" ? "Terms of Service" : "Privacy Policy";
  const other = kind === "terms" ? { href: "/privacy", label: "Privacy Policy" } : { href: "/terms", label: "Terms of Service" };
  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b-2 border-border bg-card">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <Link href={user ? "/home" : "/"} className="flex items-center gap-2">
            <Logo className="h-7 w-7" />
            <Wordmark className="text-base" />
          </Link>
          <Link href={user ? "/settings" : "/"} className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover-elevate rounded-md px-2 py-1" data-testid="link-legal-back">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 text-[15px] leading-relaxed" data-testid={`page-${kind}`}>
        <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
        <p className="mt-2 mb-4 inline-block rounded-lg bg-accent/30 px-3 py-1.5 text-sm font-semibold" data-testid="text-legal-status">
          {LEGAL_STATUS}
        </p>
        {kind === "terms" ? <TermsContent /> : <PrivacyContent />}
        <p className="mt-10 border-t border-border pt-4 text-sm">
          See also our <Link href={other.href} className="text-primary underline">{other.label}</Link>.
        </p>
      </main>
    </div>
  );
}
