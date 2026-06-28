"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { APP_NAME } from "@/lib/constants";

export default function LoginPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setError(
        error.message === "Invalid login credentials"
          ? "Email or password is incorrect."
          : error.message
      );
      setLoading(false);
      return;
    }

    // Session cookie is set — go to the dashboard.
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-10">
      {/* Subtle ledger-grid backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            "linear-gradient(#E7E9EC 1px, transparent 1px), linear-gradient(90deg, #E7E9EC 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
        }}
      />

      <div className="relative w-full max-w-sm">
        {/* Brand */}
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-3 grid h-12 w-12 place-items-center rounded-xl bg-primary text-white shadow-card">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
              <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2" />
              <path d="M3 9h18M9 9v12" stroke="currentColor" strokeWidth="2" />
              <rect x="3" y="3" width="18" height="6" fill="currentColor" opacity="0.9" />
            </svg>
          </span>
          <h1 className="text-xl font-semibold tracking-tight text-ink">{APP_NAME}</h1>
          <p className="mt-1 text-[13px] text-muted">Sign in to view and manage bookings.</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Email" htmlFor="email" required>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  className="pl-9"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </Field>

            <Field label="Password" htmlFor="password" required>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="px-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-faint hover:text-ink"
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>

            {error && (
              <div className="rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-[13px] font-medium text-danger">
                {error}
              </div>
            )}

            <Button type="submit" loading={loading} className="w-full">
              Sign in
              {!loading && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>
        </div>

        <p className="mt-4 text-center text-[12px] leading-relaxed text-faint">
          Accounts are created by your administrator in Supabase.
          <br />
          Contact them if you need access or a password reset.
        </p>
      </div>
    </main>
  );
}
