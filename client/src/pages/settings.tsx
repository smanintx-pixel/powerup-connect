import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AppShell } from "@/components/app-shell";
import { PhotoUpload } from "@/components/photo-upload";
import { ProfileExtras, phoneProblem, type ProfileExtrasValue } from "@/components/profile-extras";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useAuth } from "@/lib/auth-context";
import { LogOut, X, ShieldCheck, Sparkles, FileText, Trash2 } from "lucide-react";

const settingsSchema = z.object({
  name: z.string().min(1, "Name is required"),
  title: z.string().optional(),
  company: z.string().optional(),
  bio: z.string().max(240).optional(),
  linkedinUrl: z.string().optional(),
});

type SettingsForm = z.infer<typeof settingsSchema>;

/** Withdraw agreement for Nia (shown only after she agreed). */
function HostConsentSetting() {
  const { authedFetch } = useAuth();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const { data } = useQuery<{ enabled: boolean; name: string; consented: boolean }>({
    queryKey: ["/api/host/status"],
    queryFn: async () => {
      const res = await authedFetch("/api/host/status");
      if (!res.ok) throw new Error("Could not check the host.");
      return res.json();
    },
  });
  if (!data?.enabled || (!data.consented && !done)) return null;
  async function withdraw() {
    setBusy(true);
    try {
      const res = await authedFetch("/api/host/consent", { method: "DELETE" });
      if (res.ok) {
        setDone(true);
        queryClient.invalidateQueries({ queryKey: ["/api/host/status"] });
      }
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="rounded-2xl border border-card-border bg-card p-6 sm:p-8 mb-6" data-testid="section-host-consent">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="h-4 w-4 text-primary" />
        <h2 className="text-base font-bold">{data.name}, your AI host</h2>
      </div>
      {done ? (
        <p className="text-sm text-muted-foreground" role="status">
          Done. You will not be offered calls with {data.name} unless you agree again, and we will let Nuance Labs know. Recordings
          Nuance Labs already holds are covered by its privacy policy; you can write to privacy@nuancelabs.ai about them.
        </p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-3">
            You agreed that Nuance Labs may record and use your calls with {data.name}. You can withdraw that at any time.
          </p>
          <Button variant="outline" size="sm" onClick={withdraw} disabled={busy} data-testid="button-host-withdraw">
            {busy ? "Saving..." : "Withdraw my agreement"}
          </Button>
        </>
      )}
    </div>
  );
}

/** Permanent account deletion, behind the password. */
function DeleteAccount() {
  const { authedFetch, logout } = useAuth();
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      const res = await authedFetch("/api/users/me", { method: "DELETE", body: JSON.stringify({ password }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message ?? "Could not delete your account.");
      setOpen(false);
      logout();
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete your account.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="rounded-2xl border-2 border-destructive/30 bg-card p-6 sm:p-8 mb-6" data-testid="section-delete-account">
      <div className="flex items-center gap-2 mb-1">
        <Trash2 className="h-4 w-4 text-destructive" />
        <h2 className="text-base font-bold">Delete my account</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-3">
        This removes your profile, photo, connections, requests, notes, saved items and every message you sent or received, from both
        sides. It cannot be undone.
      </p>
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setPassword(""); setError(null); } }}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="text-destructive [border-color:hsl(var(--destructive)/0.5)]" data-testid="button-delete-account">
            Delete my account
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete your account for good?</DialogTitle>
            <DialogDescription>
              Everything listed will be deleted straight away and cannot be brought back. Enter your password to confirm.
            </DialogDescription>
          </DialogHeader>
          <Input type="password" autoComplete="current-password" placeholder="Your password" value={password} onChange={(e) => setPassword(e.target.value)} data-testid="input-delete-password" />
          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Keep my account</Button>
            <Button variant="destructive" onClick={confirm} disabled={!password || busy} data-testid="button-delete-confirm">
              {busy ? "Deleting..." : "Delete everything"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function Settings() {
  const [, navigate] = useLocation();
  const { user, authedFetch, setUser, logout } = useAuth();
  const [tags, setTags] = useState<string[]>(user?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [extras, setExtras] = useState<ProfileExtrasValue>({
    phone: user?.phone ?? "",
    phoneVisible: user?.phoneVisible ?? false,
    emailVisible: user?.emailVisible ?? false,
    interests: user?.interests ?? [],
    pastYears: user?.pastYears ?? [],
  });

  const form = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: user?.name ?? "",
      title: user?.title ?? "",
      company: user?.company ?? "",
      bio: user?.bio ?? "",
      linkedinUrl: user?.linkedinUrl ?? "",
    },
  });

  function addTag(tag: string) {
    const clean = tag.trim();
    if (!clean || tags.includes(clean) || tags.length >= 3) return;
    setTags([...tags, clean]);
    setTagInput("");
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
  }

  async function onSubmit(values: SettingsForm) {
    setSaveError(null);
    if (phoneProblem(extras.phone)) return;
    setStatus("saving");
    try {
      const res = await authedFetch("/api/users/me", {
        method: "PATCH",
        body: JSON.stringify({
          ...values,
          tags,
          phone: extras.phone.trim(),
          phoneVisible: extras.phoneVisible,
          emailVisible: extras.emailVisible,
          interests: extras.interests,
          pastYears: extras.pastYears,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message ?? "Could not save your changes.");
      setUser(data.user);
      setStatus("saved");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not save your changes.");
      setStatus("idle");
    }
  }

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <AppShell>
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-6 md:py-10">
        <h1 className="text-2xl font-extrabold mb-1">Settings</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Update your profile and manage your account.
        </p>

        <div className="rounded-2xl border border-card-border bg-card p-6 sm:p-8 mb-6">
          <div className="mb-6">
            <PhotoUpload />
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full name</FormLabel>
                    <FormControl>
                      <Input data-testid="input-settings-name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input data-testid="input-settings-title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company</FormLabel>
                      <FormControl>
                        <Input data-testid="input-settings-company" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea className="resize-none min-h-[72px]" data-testid="input-settings-bio" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="linkedinUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LinkedIn URL</FormLabel>
                    <FormControl>
                      <Input data-testid="input-settings-linkedin" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <label className="text-sm font-medium mb-2 block">Industry tags (up to 3)</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} aria-label={`Remove ${tag}`} data-testid={`button-settings-remove-tag-${tag.toLowerCase().replace(/\s+/g, "-")}`}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                {tags.length < 3 && (
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag(tagInput);
                      }
                    }}
                    placeholder="Add a tag and press Enter"
                    data-testid="input-settings-tag"
                  />
                )}
              </div>

              <ProfileExtras value={extras} onChange={(v) => { setExtras(v); setStatus("idle"); }} showPastYears email={user?.email} idPrefix="settings" />

              {saveError && (
                <p className="text-sm text-destructive" role="alert" data-testid="text-settings-error">
                  {saveError}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={status === "saving"} data-testid="button-save-settings">
                {status === "saving" ? "Saving..." : status === "saved" ? "Saved" : "Save changes"}
              </Button>
            </form>
          </Form>
        </div>

        <div className="rounded-2xl border border-card-border bg-card p-6 sm:p-8 mb-6">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <h2 className="text-base font-bold">Access & plan</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Access code:{" "}
            <span className="font-mono" data-testid="text-account-access-code">
              {user?.accessCode}
            </span>
          </p>
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            Plan: <Badge variant="secondary">Conference attendee</Badge>
          </div>
        </div>

        <HostConsentSetting />

        <div className="rounded-2xl border border-card-border bg-card p-6 sm:p-8 mb-6" data-testid="section-legal">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-4 w-4 text-primary" />
            <h2 className="text-base font-bold">Terms and privacy</h2>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
            <Link href="/terms" className="text-primary underline" data-testid="link-settings-terms">Terms of Service</Link>
            <Link href="/privacy" className="text-primary underline" data-testid="link-settings-privacy">Privacy Policy</Link>
          </div>
        </div>

        <DeleteAccount />

        <Button variant="outline" onClick={handleLogout} className="w-full gap-2" data-testid="button-logout">
          <LogOut className="h-4 w-4" />
          Log out
        </Button>
      </div>
    </AppShell>
  );
}
