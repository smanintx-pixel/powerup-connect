import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Logo, Wordmark } from "@/components/logo";
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
import { PhotoUpload } from "@/components/photo-upload";
import { ProfileExtras, phoneProblem, type ProfileExtrasValue } from "@/components/profile-extras";
import { X } from "lucide-react";

const profileSchema = z.object({
  title: z.string().optional(),
  company: z.string().optional(),
  bio: z.string().max(240, "Keep your bio under 240 characters").optional(),
  linkedinUrl: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

const SUGGESTED_TAGS = [
  "Founder",
  "Marketing",
  "Finance",
  "Career Coach",
  "Nonprofit",
  "Legal",
  "Design",
  "Technology",
  "Operations",
  "Sales",
];

export default function ProfileSetup() {
  const [, navigate] = useLocation();
  const { user, authedFetch, setUser } = useAuth();
  const [tags, setTags] = useState<string[]>(user?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [extras, setExtras] = useState<ProfileExtrasValue>({
    phone: user?.phone ?? "",
    phoneVisible: user?.phoneVisible ?? false,
    emailVisible: user?.emailVisible ?? false,
    interests: user?.interests ?? [],
    pastYears: user?.pastYears ?? [],
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
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

  async function onSubmit(values: ProfileForm) {
    setError(null);
    if (phoneProblem(extras.phone)) return;
    setIsSubmitting(true);
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
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message ?? "Could not save your profile.");
      }
      const data = await res.json();
      setUser(data.user);
      navigate("/home");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-dvh bg-background flex flex-col items-center justify-center px-4 py-10">
      <div className="flex items-center gap-2 mb-6">
        <Logo className="h-8 w-8" />
        <Wordmark className="text-lg" />
      </div>

      <div className="w-full max-w-md pu-shape-0 border-2 border-card-border bg-card pu-card-tint p-6 sm:p-8 shadow-lg">
        <h1 className="text-2xl font-extrabold mb-1.5">Complete your profile</h1>
        <p className="text-sm text-muted-foreground mb-6">
          This is what other attendees will see in the directory.
        </p>

        <div className="mb-6">
          <PhotoUpload />
        </div>

        {error && (
          <div className="rounded-lg bg-destructive/10 text-destructive px-3 py-2.5 text-sm mb-5" role="alert" data-testid="text-profile-error">
            {error}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Founder & CEO" data-testid="input-profile-title" {...field} />
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
                      <Input placeholder="BrightPath Ventures" data-testid="input-profile-company" {...field} />
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
                  <FormLabel>One-line bio</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell the room what you're about."
                      className="resize-none min-h-[72px]"
                      data-testid="input-profile-bio"
                      {...field}
                    />
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
                    <Input placeholder="https://linkedin.com/in/you" data-testid="input-profile-linkedin" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <label className="text-sm font-medium mb-2 block">Industry tags (up to 3)</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1" data-testid={`badge-tag-${tag.toLowerCase().replace(/\s+/g, "-")}`}>
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      aria-label={`Remove ${tag} tag`}
                      data-testid={`button-remove-tag-${tag.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              {tags.length < 3 && (
                <div className="flex gap-2">
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
                    data-testid="input-tag"
                  />
                </div>
              )}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {SUGGESTED_TAGS.filter((t) => !tags.includes(t)).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => addTag(t)}
                    disabled={tags.length >= 3}
                    className="text-xs rounded-full border border-border px-2.5 py-1 text-muted-foreground hover-elevate active-elevate-2 disabled:opacity-40"
                    data-testid={`button-suggest-tag-${t.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    + {t}
                  </button>
                ))}
              </div>
            </div>

            <ProfileExtras value={extras} onChange={setExtras} email={user?.email} idPrefix="setup" />

            <Button type="submit" className="w-full" disabled={isSubmitting} data-testid="button-save-profile">
              {isSubmitting ? "Saving..." : "Save and continue"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
