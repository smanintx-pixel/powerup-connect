import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AppShell } from "@/components/app-shell";
import { InitialsAvatar } from "@/components/initials-avatar";
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
import { LogOut, X, ShieldCheck } from "lucide-react";

const settingsSchema = z.object({
  name: z.string().min(1, "Name is required"),
  title: z.string().optional(),
  company: z.string().optional(),
  bio: z.string().max(240).optional(),
  linkedinUrl: z.string().optional(),
  photoUrl: z.string().optional(),
});

type SettingsForm = z.infer<typeof settingsSchema>;

export default function Settings() {
  const [, navigate] = useLocation();
  const { user, authedFetch, setUser, logout } = useAuth();
  const [tags, setTags] = useState<string[]>(user?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");

  const form = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: user?.name ?? "",
      title: user?.title ?? "",
      company: user?.company ?? "",
      bio: user?.bio ?? "",
      linkedinUrl: user?.linkedinUrl ?? "",
      photoUrl: user?.photoUrl ?? "",
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
    setStatus("saving");
    const res = await authedFetch("/api/users/me", {
      method: "PATCH",
      body: JSON.stringify({ ...values, tags }),
    });
    if (res.ok) {
      const data = await res.json();
      setUser(data.user);
      setStatus("saved");
    } else {
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
          <div className="flex items-center gap-4 mb-6">
            <InitialsAvatar name={user?.name ?? ""} photoUrl={form.watch("photoUrl")} className="h-14 w-14" testId="avatar-settings" />
            <div>
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
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
              <FormField
                control={form.control}
                name="photoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Headshot photo URL</FormLabel>
                    <FormControl>
                      <Input data-testid="input-settings-photo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <label className="text-sm font-medium mb-2 block">Tags (up to 3)</label>
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

        <Button variant="outline" onClick={handleLogout} className="w-full gap-2" data-testid="button-logout">
          <LogOut className="h-4 w-4" />
          Log out
        </Button>
      </div>
    </AppShell>
  );
}
