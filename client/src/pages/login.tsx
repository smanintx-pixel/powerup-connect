import { useState } from "react";
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

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [, navigate] = useLocation();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginForm) {
    setError(null);
    setIsSubmitting(true);
    try {
      await login(values.email, values.password);
      navigate("/directory");
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

      <div className="w-full max-w-sm relative pu-shape-0 border-2 border-card-border bg-card p-6 sm:p-8 shadow-xl">
        <h1 className="text-2xl font-extrabold mb-1.5">Welcome back</h1>
        <p className="text-sm text-muted-foreground mb-6">Log in to your PowerUp Connect account.</p>

        {error && (
          <div
            className="flex items-start gap-2 rounded-lg bg-destructive/10 text-destructive px-3 py-2.5 text-sm mb-5"
            role="alert"
            data-testid="text-login-error"
          >
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Your password" data-testid="input-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isSubmitting} data-testid="button-submit-login">
              {isSubmitting ? "Logging in..." : "Log in"}
            </Button>
          </form>
        </Form>

        <p className="text-sm text-muted-foreground text-center mt-6">
          Need an account?{" "}
          <Link href="/signup" className="text-primary font-medium hover-elevate rounded-sm" data-testid="link-to-signup">
            Sign up
          </Link>
        </p>

        <div className="mt-6 pt-5 border-t border-border">
          <p className="text-xs text-muted-foreground mb-1">Demo credentials</p>
          <p className="text-xs font-mono text-muted-foreground" data-testid="text-demo-credentials">
            amara@brightpathventures.com / Powerup2027!
          </p>
        </div>
      </div>
    </div>
  );
}
