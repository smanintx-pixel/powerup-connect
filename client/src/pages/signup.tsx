import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Logo, Wordmark } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useAuth } from "@/lib/auth-context";
import { AlertCircle } from "lucide-react";
import { ChipSelect } from "@/components/chip-select";
import { PowerBadge } from "@/components/power-badge";
import { CONFERENCE_YEARS } from "@shared/event";

const signupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  accessCode: z.string().min(1, "Access code is required"),
  title: z.string().optional(),
  company: z.string().optional(),
});

type SignupForm = z.infer<typeof signupSchema>;

export default function Signup() {
  const [, navigate] = useLocation();
  const { signup, user, token } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pastYears, setPastYears] = useState<number[]>([]);
  const [created, setCreated] = useState(false);

  // Move on only once the new sign-in has reached the rest of the app.
  // Navigating straight after signup() ran ahead of it, so the profile
  // set-up page saw nobody signed in and bounced the new attendee away.
  useEffect(() => {
    if (created && user && token) navigate("/profile-setup");
  }, [created, user, token, navigate]);

  const form = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", password: "", accessCode: "", title: "", company: "" },
  });

  async function onSubmit(values: SignupForm) {
    setError(null);
    setIsSubmitting(true);
    try {
      await signup({ ...values, pastYears });
      setCreated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative overflow-hidden min-h-dvh pu-hero flex flex-col items-center justify-center px-4 py-10">
      <div className="pu-ring -left-20 -top-24 h-64 w-64 border-[28px] border-[#FFC933] opacity-90" aria-hidden="true" />
      <div className="pu-ring -right-14 bottom-10 h-40 w-40 border-[20px] border-[#70C040] opacity-75" aria-hidden="true" />
      <div className="pu-ring left-[12%] -bottom-16 h-36 w-36 border-[18px] border-[#02AFEF] opacity-70" aria-hidden="true" />
      <Link href="/" className="relative flex items-center gap-2.5 mb-8 text-white">
        <Logo className="h-9 w-9" />
        <Wordmark className="text-xl" onDark />
      </Link>

      <div className="w-full max-w-md relative pu-shape-0 border-2 border-card-border bg-card p-6 sm:p-8 shadow-xl">
        <h1 className="text-2xl font-extrabold mb-1.5">Create your account</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Access included with your Power Up Women&rsquo;s Conference registration.
        </p>

        {error && (
          <div
            className="flex items-start gap-2 rounded-lg bg-destructive/10 text-destructive px-3 py-2.5 text-sm mb-5"
            role="alert"
            data-testid="text-signup-error"
          >
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full name</FormLabel>
                  <FormControl>
                    <Input placeholder="Jordan Blake" data-testid="input-name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="you@example.com" data-testid="input-email" {...field} />
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
                    <FormLabel>Title (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Founder" data-testid="input-title" {...field} />
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
                    <FormLabel>Company (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Acme Co." data-testid="input-company" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="At least 6 characters" data-testid="input-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="accessCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Access code</FormLabel>
                  <FormControl>
                    <Input placeholder="POWERUP2027" data-testid="input-access-code" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div>
              <p className="text-sm font-medium mb-1" id="past-years-label">
                Which past Power Up conferences have you attended?
              </p>
              <p className="text-xs text-muted-foreground mb-2.5">
                Tap every year you were there. First time? Leave this blank.
              </p>
              <ChipSelect
                options={CONFERENCE_YEARS}
                value={pastYears}
                onChange={setPastYears}
                label="Past Power Up conferences attended"
                testIdPrefix="chip-year"
              />
              {pastYears.length >= 2 && (
                <p className="mt-3 text-sm flex flex-wrap items-center gap-2" data-testid="text-signup-badge">
                  <span>That makes you a</span>
                  <PowerBadge pastYears={pastYears} />
                </p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
              data-testid="button-submit-signup"
            >
              {isSubmitting ? "Creating account..." : "Create account"}
            </Button>
          </form>
        </Form>

        <p className="text-sm text-muted-foreground text-center mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-medium hover-elevate rounded-sm" data-testid="link-to-login">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
