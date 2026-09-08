"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Home, Lock, LogOut, Plus, Shield, Sparkles, Users } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";

const items = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/vault", label: "Vault", icon: Lock },
  { href: "/deposit", label: "Deposit", icon: Plus },
  { href: "/family", label: "Family", icon: Users },
  { href: "/preview", label: "Preview", icon: Heart },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { session, logout, firebaseUser } = useAuth();
  const userEmail = session?.email || firebaseUser?.email;
  const userInitial = (userEmail ? userEmail[0] : "U").toUpperCase();
  const role = session?.role;

  return (
    <div className="mx-auto flex min-h-full w-full max-w-6xl flex-1 flex-col px-4 pt-[max(1rem,env(safe-area-inset-top))]">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs uppercase tracking-[0.24em] text-lilac/80">
            <Sparkles size={13} className="text-pink animate-pulse" />
            <span>Digital Time Capsule</span>
          </div>
          <p className="font-serif text-2xl md:text-3xl text-white">{session?.capsuleTitle ?? "Vault"}</p>
        </div>

        <div className="flex items-center gap-2.5">
          {userEmail ? (
            <div
              className="glass flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3 transition hover:border-white/30"
              title={userEmail}
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-lilac via-pink to-glow text-xs font-bold text-navy shadow-sm">
                {userInitial}
              </div>
              <div className="flex flex-col text-left">
                <span className="max-w-[130px] truncate text-xs font-medium text-lavender sm:max-w-[200px] md:max-w-[260px]">
                  {userEmail}
                </span>
                {role ? (
                  <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted">
                    {role === "admin" && <Shield size={10} className="text-lilac" />}
                    {role === "family" && <Heart size={10} className="text-pink" />}
                    {role === "recipient" && <Sparkles size={10} className="text-glow" />}
                    <span
                      className={
                        role === "admin"
                          ? "text-lilac font-semibold"
                          : role === "family"
                          ? "text-pink font-semibold"
                          : "text-glow font-semibold"
                      }
                    >
                      {role}
                    </span>
                  </span>
                ) : null}
              </div>
            </div>
          ) : null}

          {role === "admin" ? (
            <Link
              href="/admin"
              className="glass inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium text-lilac transition hover:border-lilac/50 hover:bg-white/10"
              title="Admin Dashboard"
            >
              <Shield size={14} />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          ) : null}

          <button
            type="button"
            onClick={() => void logout()}
            className="glass inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium text-muted transition hover:border-rose-300/40 hover:text-rose-200 hover:bg-rose-500/10"
            title="Sign out"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>

      <div className="safe-bottom flex-1">{children}</div>

      <nav
        aria-label="Primary"
        className="glass fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 mx-auto flex max-w-lg justify-around rounded-full px-2 py-2 md:hidden"
      >
        {items.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-12 min-w-12 flex-col items-center justify-center rounded-full px-2 text-[11px] transition ${
                active ? "text-pink font-semibold" : "text-muted hover:text-lavender"
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <nav aria-label="Desktop" className="mb-8 hidden justify-center gap-3 md:flex">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-full px-4 py-2 text-sm transition ${
              pathname === item.href ? "bg-white/10 text-pink font-medium" : "text-muted hover:text-lavender hover:bg-white/5"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
