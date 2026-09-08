"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, KeyRound, LogIn, Mail, Sparkles, UserPlus } from "lucide-react";
import { Field, GhostButton, PrimaryButton, TextInput } from "@/components/ui/Primitives";
import { GlowingLock } from "@/components/vault/VaultVisuals";
import { useAuth } from "@/components/providers/AuthProvider";
import { toUserMessage } from "@/lib/errors";

export function LoginScreen() {
  const router = useRouter();
  const { session, loading, configured, signInEmail, registerEmail, signInGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<"in" | "up">("in");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && session) router.replace("/dashboard");
  }, [loading, router, session]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "in") await signInEmail(email, password);
      else await registerEmail(email, password);
      router.replace("/dashboard");
    } catch (err) {
      setError(toUserMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-1 flex-col justify-center px-4 py-8">
      <GlowingLock unlocked={false} />
      <div className="mt-5 flex items-center justify-center gap-1.5 text-center text-xs font-semibold uppercase tracking-[0.28em] text-lilac">
        <Sparkles size={14} className="text-pink animate-pulse" />
        <span>Private Digital Capsule</span>
      </div>
      <h1 className="mt-2 text-center font-serif text-4xl sm:text-5xl text-white">
        Stay sealed until 18.
      </h1>
      <p className="mt-2 text-center text-sm leading-relaxed text-muted">
        A private lilac vault for letters, photos, and family love. Midnight, Asia/Manila — not a minute earlier.
      </p>

      {!configured ? (
        <div className="mt-6 rounded-2xl border border-rose-500/40 bg-rose-500/15 p-4 text-center text-sm text-rose-200">
          ⚠️ Firebase client keys are missing. Please check your environment configuration.
        </div>
      ) : (
        <form onSubmit={(e) => void submit(e)} className="glass mt-6 space-y-4 rounded-[2rem] p-6 shadow-2xl">
          <div className="flex rounded-xl bg-black/30 p-1 border border-white/5 mb-1">
            <button
              type="button"
              onClick={() => {
                setError(null);
                setMode("in");
              }}
              className={`flex-1 rounded-lg py-2 text-xs font-semibold transition ${
                mode === "in" ? "bg-lilac/25 text-white shadow-sm border border-lilac/30" : "text-muted hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setMode("up");
              }}
              className={`flex-1 rounded-lg py-2 text-xs font-semibold transition ${
                mode === "up" ? "bg-lilac/25 text-white shadow-sm border border-lilac/30" : "text-muted hover:text-white"
              }`}
            >
              Create Password
            </button>
          </div>

          <Field label="Email Address">
            <div className="relative">
              <TextInput
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-10"
              />
              <Mail size={16} className="pointer-events-none absolute left-3.5 top-3.5 text-white/40" />
            </div>
          </Field>

          <Field label="Password">
            <div className="relative">
              <TextInput
                type={showPassword ? "text" : "password"}
                autoComplete={mode === "in" ? "current-password" : "new-password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
                className="pl-10 pr-10"
              />
              <KeyRound size={16} className="pointer-events-none absolute left-3.5 top-3.5 text-white/40" />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-3 text-white/40 transition hover:text-white"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </Field>

          {error ? (
            <div role="alert" className="rounded-xl border border-rose-500/40 bg-rose-500/15 p-3 text-xs text-rose-200">
              {error}
            </div>
          ) : null}

          <PrimaryButton type="submit" disabled={busy} className="w-full inline-flex items-center justify-center gap-2">
            {mode === "in" ? <LogIn size={16} /> : <UserPlus size={16} />}
            <span>{busy ? "Entering..." : mode === "in" ? "Enter the Vault" : "Create Invited Account"}</span>
          </PrimaryButton>

          <div className="relative my-2 text-center text-xs text-muted">
            <span className="bg-[#0f0e26] px-3">or</span>
          </div>

          <GhostButton
            type="button"
            className="w-full inline-flex items-center justify-center gap-2"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError(null);
              try {
                await signInGoogle();
                router.replace("/dashboard");
              } catch (err) {
                setError(toUserMessage(err));
              } finally {
                setBusy(false);
              }
            }}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </GhostButton>

          <button
            type="button"
            className="w-full pt-1 text-center text-xs text-muted transition hover:text-lavender"
            onClick={() => {
              setError(null);
              setMode((m) => (m === "in" ? "up" : "in"));
            }}
          >
            {mode === "in" ? "Invited family or recipient? Create your password →" : "Already have access? Sign in here →"}
          </button>
        </form>
      )}
    </main>
  );
}
